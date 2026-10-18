import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../utils/prisma";
import { parseUuid } from "../../utils/validate";

const router = Router();

router.use(requireAuth);

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(100, "Nama kategori terlalu panjang."),
});

// Semua user login boleh membaca daftar kategori
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json({
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        productCount: c._count.products,
        createdAt: c.createdAt,
      })),
    });
  })
);

router.post(
  "/",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }
    const category = await prisma.category.create({ data: { name: parsed.data.name } });
    res.status(201).json({ success: true, data: category });
  })
);

router.patch(
  "/:id",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }
    const id = parseUuid(req.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Kategori tidak ditemukan." },
      });
    }
    const category = await prisma.category.update({
      where: { id: existing.id },
      data: { name: parsed.data.name },
    });
    res.json({ success: true, data: category });
  })
);

router.delete(
  "/:id",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const id = parseUuid(req.params.id);
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Kategori tidak ditemukan." },
      });
    }
    if (existing._count.products > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: "CATEGORY_IN_USE",
          message: "Kategori masih dipakai oleh produk dan tidak bisa dihapus.",
        },
      });
    }
    await prisma.category.delete({ where: { id: existing.id } });
    res.json({ success: true, data: null });
  })
);

export { router as categoriesRouter };
