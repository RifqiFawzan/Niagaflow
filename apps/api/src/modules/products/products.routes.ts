import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../utils/prisma";
import { parseUuid } from "../../utils/validate";
import { serializeProduct } from "../../utils/serialize";

const router = Router();

router.use(requireAuth);

const productSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi.").max(200, "Nama produk terlalu panjang."),
  sku: z.string().trim().min(1, "SKU wajib diisi.").max(50, "SKU terlalu panjang."),
  categoryId: z.string().uuid("Kategori tidak valid.").nullable().optional(),
  description: z.string().trim().max(2000, "Deskripsi terlalu panjang.").nullable().optional(),
  price: z.number().int("Harga harus bilangan bulat (rupiah penuh).").min(0, "Harga tidak boleh negatif."),
  stock: z.number().int("Stok harus bilangan bulat.").min(0, "Stok tidak boleh negatif."),
  lowStockThreshold: z.number().int("Batas stok menipis harus bilangan bulat.").min(0, "Batas stok tidak boleh negatif."),
});

const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  sort: z.enum(["name", "price", "stock", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  includeArchived: z
    .union([z.literal("true"), z.literal("false")])
    .default("false"),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }
    const { q, categoryId, sort, order, page, pageSize, includeArchived } = parsed.data;

    const where: Prisma.ProductWhereInput = {
      ...(includeArchived === "false" ? { isActive: true } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { id: true, name: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: products.map(serializeProduct),
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
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Produk tidak ditemukan." },
      });
    }
    res.json({ success: true, data: serializeProduct(product) });
  })
);

function mapUniqueViolation(res: import("express").Response, error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({
      success: false,
      error: { code: "SKU_DUPLICATE", message: "SKU sudah dipakai produk lain." },
    });
    return true;
  }
  return false;
}

router.post(
  "/",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }
    const data = parsed.data;
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        return res.status(400).json({
          success: false,
          error: { code: "CATEGORY_NOT_FOUND", message: "Kategori tidak ditemukan." },
        });
      }
    }
    try {
      const product = await prisma.product.create({
        data: {
          name: data.name,
          sku: data.sku.toUpperCase(),
          categoryId: data.categoryId ?? null,
          description: data.description ?? null,
          price: data.price,
          stock: data.stock,
          lowStockThreshold: data.lowStockThreshold,
        },
      });
      res.status(201).json({ success: true, data: serializeProduct(product) });
    } catch (error) {
      if (mapUniqueViolation(res, error)) return;
      throw error;
    }
  })
);

router.patch(
  "/:id",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }
    const id = parseUuid(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Produk tidak ditemukan." },
      });
    }
    const data = parsed.data;
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        return res.status(400).json({
          success: false,
          error: { code: "CATEGORY_NOT_FOUND", message: "Kategori tidak ditemukan." },
        });
      }
    }
    try {
      const product = await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.sku !== undefined ? { sku: data.sku.toUpperCase() } : {}),
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.stock !== undefined ? { stock: data.stock } : {}),
          ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}),
        },
      });
      res.json({ success: true, data: serializeProduct(product) });
    } catch (error) {
      if (mapUniqueViolation(res, error)) return;
      throw error;
    }
  })
);

router.patch(
  "/:id/archive",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const id = parseUuid(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Produk tidak ditemukan." },
      });
    }
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    res.json({ success: true, data: serializeProduct(product) });
  })
);

export { router as productsRouter };
