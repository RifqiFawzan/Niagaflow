import { Router } from "express";
import { z } from "zod";
import { StockMovementType } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../utils/prisma";
import { parseUuid } from "../../utils/validate";

const router = Router();

router.use(requireAuth);

/**
 * Riwayat pergerakan stok (pedoman §15.5–§15.6, §9).
 * - POST: penyesuaian manual "Stok masuk"/"Stok keluar" (owner) — alasan wajib.
 * - GET: daftar semua gerakan (termasuk otomatis dari pesanan), semua peran boleh lihat.
 * Gerakan PENJUALAN/PEMBATALAN dibuat otomatis di transaksi pesanan.
 */

const createMovementSchema = z.object({
  productId: z.string().uuid("Produk tidak valid."),
  type: z.enum(["MASUK", "KELUAR"], { message: "Jenis gerakan tidak dikenal." }),
  quantity: z
    .number().int("Jumlah harus bilangan bulat.")
    .min(1, "Jumlah minimal 1."),
  reason: z
    .string().trim().min(1, "Alasan wajib diisi.")
    .max(500, "Alasan terlalu panjang."),
});

router.post(
  "/",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = createMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { productId, type, quantity, reason } = parsed.data;
    const userId = req.user!.id;

    const movement = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new ApiError(404, "NOT_FOUND", "Produk tidak ditemukan.");
      }
      const delta = type === StockMovementType.MASUK ? quantity : -quantity;
      // Stok tidak boleh minus; guard di tempat (tanpa raw query)
      if (delta < 0 && product.stock < quantity) {
        throw new ApiError(
          400,
          "INSUFFICIENT_STOCK",
          `Stok "${product.name}" hanya ${product.stock}, tidak cukup untuk dikeluarkan.`
        );
      }
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { increment: delta } },
      });
      return tx.stockMovement.create({
        data: { productId, delta, type, reason, createdBy: userId },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, name: true } },
        },
      });
    });

    res.status(201).json({ success: true, data: movement });
  })
);

const listQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  type: z.enum(["MASUK", "KELUAR", "PENJUALAN", "PEMBATALAN"]).optional(),
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
    const { productId, type, page, pageSize } = parsed.data;

    const where = {
      ...(productId ? { productId } : {}),
      ...(type ? { type } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, name: true } },
          order: { select: { id: true, orderNumber: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  })
);

export { router as stockMovementsRouter };
