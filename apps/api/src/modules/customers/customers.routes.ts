import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../utils/prisma";
import { parseUuid } from "../../utils/validate";
import { serializeOrder } from "../../utils/serialize";

const router = Router();

router.use(requireAuth);

const customerSchema = z.object({
  name: z.string().trim().min(1, "Nama pelanggan wajib diisi.").max(200, "Nama pelanggan terlalu panjang."),
  phone: z.string().trim().max(30, "Nomor kontak terlalu panjang.").nullable().optional(),
  notes: z.string().trim().max(2000, "Catatan terlalu panjang.").nullable().optional(),
});

const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
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
    const { q, page, pageSize } = parsed.data;
    const where: Prisma.CustomerWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      success: true,
      data: { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseUuid(req.params.id);
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Pelanggan tidak ditemukan." },
      });
    }
    res.json({ success: true, data: customer });
  })
);

router.get(
  "/:id/orders",
  asyncHandler(async (req, res) => {
    const id = parseUuid(req.params.id);
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Pelanggan tidak ditemukan." },
      });
    }
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { productNameSnapshot: true, quantity: true, lineTotal: true } } },
    });
    res.json({ success: true, data: orders.map(serializeOrder) });
  })
);

router.post(
  "/",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }
    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone ?? null,
        notes: parsed.data.notes ?? null,
      },
    });
    res.status(201).json({ success: true, data: customer });
  })
);

router.patch(
  "/:id",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const parsed = customerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }
    const id = parseUuid(req.params.id);
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Pelanggan tidak ditemukan." },
      });
    }
    const data = parsed.data;
    const customer = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
    res.json({ success: true, data: customer });
  })
);

export { router as customersRouter };
