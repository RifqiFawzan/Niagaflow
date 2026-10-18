import { Router } from "express";
import { z } from "zod";
import { Prisma, OrderStatus } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../utils/prisma";
import { parseUuid } from "../../utils/validate";
import { serializeOrder } from "../../utils/serialize";

const router = Router();

router.use(requireAuth);

const createOrderSchema = z.object({
  customerId: z.string().uuid("Pelanggan tidak valid.").nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Produk tidak valid."),
        quantity: z.number().int("Jumlah harus bilangan bulat.").min(1, "Jumlah minimal 1."),
      })
    )
    .min(1, "Pesanan minimal berisi 1 item."),
  discount: z
    .number().int("Diskon harus bilangan bulat.")
    .min(0, "Diskon tidak boleh negatif.")
    .default(0),
  notes: z.string().trim().max(2000, "Catatan terlalu panjang.").nullable().optional(),
});

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  // 6 karakter dari alfabet tanpa karakter ambigu (32^6 ≈ 1,07 miliar kombinasi)
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i += 1) {
    rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ORD-${y}${m}${d}-${rand}`;
}

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { customerId, items, discount, notes } = parsed.data;
    const userId = req.user!.id;

    // Tolak duplikat produk (sederhana & eksplisit)
    const ids = items.map((i) => i.productId);
    if (new Set(ids).size !== ids.length) {
      throw new ApiError(400, "DUPLICATE_ITEM", "Terdapat produk duplikat dalam pesanan.");
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new ApiError(400, "CUSTOMER_NOT_FOUND", "Pelanggan tidak ditemukan.");
      }
    }

    const runTransaction = () =>
      prisma.$transaction(async (tx) => {
        let subtotal = 0;
        const itemsData: Array<{
          productId: string;
          productNameSnapshot: string;
          unitPrice: Prisma.Decimal;
          quantity: number;
          lineTotal: Prisma.Decimal;
        }> = [];

        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new ApiError(400, "PRODUCT_NOT_FOUND", "Salah satu produk tidak ditemukan.");
          }
          if (!product.isActive) {
            throw new ApiError(400, "PRODUCT_ARCHIVED", `Produk "${product.name}" sudah diarsipkan.`);
          }

          // Pengurangan stok bersyarat: hanya jika stok mencukupi (aman dari race)
          const updated = await tx.product.updateMany({
            where: { id: product.id, isActive: true, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new ApiError(
              409,
              "INSUFFICIENT_STOCK",
              `Stok produk "${product.name}" tidak mencukupi.`
            );
          }

          const lineTotal = product.price.mul(item.quantity);
          subtotal += Number(lineTotal);
          itemsData.push({
            productId: product.id,
            productNameSnapshot: product.name,
            unitPrice: product.price,
            quantity: item.quantity,
            lineTotal,
          });
        }

        if (discount > subtotal) {
          throw new ApiError(400, "DISCOUNT_EXCEEDS_TOTAL", "Diskon melebihi subtotal pesanan.");
        }
        const total = subtotal - discount;

        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerId: customerId ?? null,
            createdBy: userId,
            status: OrderStatus.pending,
            subtotal,
            discount,
            total,
            notes: notes ?? null,
            items: { create: itemsData },
          },
          include: { items: true },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            changedBy: userId,
            oldStatus: null,
            newStatus: OrderStatus.pending,
          },
        });

        return order;
      });

    // Tabrakan kunci unik order_number (langka): transaksi sudah rollback, ulang dengan nomor baru
    let order: Prisma.OrderGetPayload<{ include: { items: true } }> | null = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        order = await runTransaction();
        break;
      } catch (error) {
        const collision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";
        if (collision && attempt < 3) continue;
        if (collision) {
          throw new ApiError(
            409,
            "ORDER_NUMBER_COLLISION",
            "Gagal membuat nomor pesanan unik, coba lagi."
          );
        }
        throw error;
      }
    }
    if (!order) {
      throw new ApiError(
        409,
        "ORDER_NUMBER_COLLISION",
        "Gagal membuat nomor pesanan unik, coba lagi."
      );
    }

    res.status(201).json({ success: true, data: serializeOrder(order) });
  })
);

const statusSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "cancelled"]),
});

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const target = parsed.data.status;
    const userId = req.user!.id;
    const id = parseUuid(req.params.id);

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) {
        throw new ApiError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
      }

      const allowed = TRANSITIONS[order.status];
      if (!allowed.includes(target)) {
        throw new ApiError(
          400,
          "INVALID_TRANSITION",
          `Status pesanan tidak bisa diubah dari "${order.status}" menjadi "${target}".`
        );
      }

      // Guard atomik: hanya sukses kalau status belum berubah sejak dibaca
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: target },
      });
      if (claimed.count === 0) {
        throw new ApiError(409, "ORDER_CONFLICT", "Status pesanan baru saja berubah, muat ulang halaman.");
      }

      if (target === "cancelled") {
        for (const item of order.items) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          changedBy: userId,
          oldStatus: order.status,
          newStatus: target,
        },
      });

      return tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
    });

    res.json({ success: true, data: updated && serializeOrder(updated) });
  })
);

const listQuerySchema = z.object({
  status: z.enum(["pending", "processing", "completed", "cancelled"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { status, from, to, q, page, pageSize } = parsed.data;

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: { select: { id: true, name: true } },
          items: { select: { id: true, quantity: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map(serializeOrder),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseUuid(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        creator: { select: { id: true, name: true } },
        items: true,
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    });
    if (!order) {
      throw new ApiError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
    }
    res.json({ success: true, data: serializeOrder(order) });
  })
);

export { router as ordersRouter };
