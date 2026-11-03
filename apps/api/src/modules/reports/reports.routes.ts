import { Router } from "express";
import { z } from "zod";
import { Prisma, OrderStatus } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../utils/prisma";
import { money, serializeOrder, serializeProduct } from "../../utils/serialize";

const router = Router();

router.use(requireAuth);

const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

function resolveRange(from?: Date, to?: Date) {
  const end = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : new Date();
  // `from` juga diselaraskan ke awal hari lokal (bukan UTC midnight dari "YYYY-MM-DD"),
  // supaya pesanan dini hari pada tanggal awal tidak ikut terbuang.
  const start = from ? new Date(new Date(from).setHours(0, 0, 0, 0)) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

// Kunci "YYYY-MM-DD" berdasarkan tanggal lokal server (bukan UTC),
// supaya pengelompokan per hari konsisten dengan resolveRange.
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function getLowStock() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
    orderBy: { stock: "asc" },
  });
  return products.filter((p) => p.stock <= p.lowStockThreshold);
}

// Ringkasan dashboard (semua role login — data operasional)
router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalActiveProducts, ordersToday, salesAgg, recentOrders, lowStock] =
      await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: OrderStatus.completed },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            items: { select: { quantity: true } },
          },
        }),
        getLowStock(),
      ]);

    res.json({
      success: true,
      data: {
        totalActiveProducts,
        ordersToday,
        totalSalesCompleted: money(salesAgg._sum.total),
        recentOrders: recentOrders.map(serializeOrder),
        lowStock: lowStock.slice(0, 10).map(serializeProduct),
        lowStockCount: lowStock.length,
      },
    });
  })
);

// Ringkasan penjualan per rentang tanggal (owner)
router.get(
  "/summary",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = rangeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { start, end } = resolveRange(parsed.data.from, parsed.data.to);
    const range = { gte: start, lte: end };

    const [byStatus, salesAgg] = await Promise.all([
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: range },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: OrderStatus.completed, createdAt: range },
      }),
    ]);

    const statusCounts: Record<string, { count: number; total: number }> = {};
    for (const row of byStatus) {
      statusCounts[row.status] = {
        count: row._count._all,
        total: money(row._sum.total),
      };
    }

    res.json({
      success: true,
      data: {
        from: start,
        to: end,
        totalSalesCompleted: money(salesAgg._sum.total),
        ordersByStatus: statusCounts,
      },
    });
  })
);

// Tren penjualan harian (owner) — dipakai grafik dashboard.
// Hanya menghitung pesanan berstatus `completed`, sama seperti KPI dan summary,
// supaya angka di grafik dan kartu tidak saling bertentangan.
router.get(
  "/sales-trend",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = rangeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { start, end } = resolveRange(parsed.data.from, parsed.data.to);

    // Ambil ringkas (createdAt + total saja) lalu kelompokkan per hari lokal di JS.
    // Ini menyelaraskan batas hari dengan resolveRange (waktu lokal server) sehingga
    // tidak ada selisih zona-waktu antara grafik dan ringkasan.
    const orders = await prisma.order.findMany({
      where: { status: OrderStatus.completed, createdAt: { gte: start, lte: end } },
      select: { createdAt: true, total: true },
    });

    const byDay = new Map<string, { sales: number; orders: number }>();
    // Isi semua hari dalam rentang dengan nol supaya sumbu-x grafik utuh.
    const cursor = new Date(start);
    while (cursor <= end) {
      byDay.set(localDateKey(cursor), { sales: 0, orders: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    for (const o of orders) {
      const key = localDateKey(o.createdAt);
      const bucket = byDay.get(key) ?? { sales: 0, orders: 0 };
      bucket.sales += Number(o.total ?? 0);
      bucket.orders += 1;
      byDay.set(key, bucket);
    }

    const points = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, sales: money(v.sales), orders: v.orders }));

    res.json({ success: true, data: { from: start, to: end, points } });
  })
);

// Produk terlaris per rentang (owner)
router.get(
  "/top-products",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = rangeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { start, end } = resolveRange(parsed.data.from, parsed.data.to);

    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: { status: OrderStatus.completed, createdAt: { gte: start, lte: end } },
      },
      _sum: { quantity: true, lineTotal: true },
      _count: { _all: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 10,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, name: true, sku: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    res.json({
      success: true,
      data: grouped.map((g) => ({
        productId: g.productId,
        name: byId.get(g.productId)?.name ?? "(produk terhapus)",
        sku: byId.get(g.productId)?.sku ?? null,
        quantitySold: g._sum.quantity ?? 0,
        revenue: money(g._sum.lineTotal),
        ordersCount: g._count._all,
      })),
    });
  })
);

// Penjualan per kategori (owner) — dipakai grafik donat.
// Hanya pesanan `completed`, sama seperti laporan lain supaya angka konsisten.
router.get(
  "/sales-by-category",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = rangeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { start, end } = resolveRange(parsed.data.from, parsed.data.to);

    // Kategori tidak bisa di-groupBy langsung (butuh join ke product), jadi ambil
    // item + nama kategorinya lalu rangkum di JS.
    const items = await prisma.orderItem.findMany({
      where: {
        order: { status: OrderStatus.completed, createdAt: { gte: start, lte: end } },
      },
      select: {
        quantity: true,
        lineTotal: true,
        product: { select: { category: { select: { name: true } } } },
      },
    });

    const byCategory = new Map<string, { revenue: number; quantity: number }>();
    for (const item of items) {
      const name = item.product?.category?.name ?? "Tanpa kategori";
      const bucket = byCategory.get(name) ?? { revenue: 0, quantity: 0 };
      bucket.revenue += Number(item.lineTotal ?? 0);
      bucket.quantity += item.quantity;
      byCategory.set(name, bucket);
    }

    const categories = [...byCategory.entries()]
      .map(([name, v]) => ({ name, revenue: money(v.revenue), quantity: v.quantity }))
      .sort((a, b) => Number(b.revenue) - Number(a.revenue));

    res.json({ success: true, data: { from: start, to: end, categories } });
  })
);

// Produk stok menipis (semua role login — operasional)
router.get(
  "/low-stock",
  asyncHandler(async (_req, res) => {
    const items = await getLowStock();
    res.json({ success: true, data: items.map(serializeProduct) });
  })
);

export { router as reportsRouter };
