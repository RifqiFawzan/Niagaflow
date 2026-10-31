import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../utils/prisma";
import { parseUuid } from "../../utils/validate";

const router = Router();

router.use(requireAuth, requireRole("owner", "admin"));

/**
 * Kelola pengguna & peran (pedoman §15, §4 "Pengguna & Peran").
 * - Owner: penuh, termasuk memberi/mengubah peran pemilik.
 * - Admin: kelola akun non-pemilik (tidak boleh menyentuh akun pemilik,
 *   tidak boleh menetapkan peran owner) — cegah eskalasi hak.
 * - Tidak ada hapus akun: riwayat pesanan menolak penghapusan (FK) dan
 *   peran bisa diturunkan ke staf untuk mencabut akses.
 */

const ROLES = ["owner", "admin", "kasir", "stock_manager", "staff"] as const;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama terlalu panjang."),
  email: z.string().trim().email("Email tidak valid.").max(200, "Email terlalu panjang."),
  password: z.string().min(8, "Password minimal 8 karakter.").max(200, "Password terlalu panjang."),
  role: z.enum(ROLES, { message: "Peran tidak dikenal." }),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama terlalu panjang.").optional(),
    password: z.string().min(8, "Password minimal 8 karakter.").max(200, "Password terlalu panjang.").optional(),
    role: z.enum(ROLES, { message: "Peran tidak dikenal." }).optional(),
  })
  .refine(
    (v) => v.name !== undefined || v.password !== undefined || v.role !== undefined,
    { message: "Tidak ada perubahan untuk disimpan." }
  );

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });
    res.json({ success: true, data: users });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { name, email, password, role } = parsed.data;

    if (req.user!.role === "admin" && role === "owner") {
      throw new ApiError(403, "FORBIDDEN", "Hanya pemilik yang dapat membuat akun pemilik.");
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      throw new ApiError(409, "EMAIL_DUPLICATE", "Email sudah terdaftar.");
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
        role,
      },
      select: userSelect,
    });

    res.status(201).json({ success: true, data: user });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseUuid(req.params.id);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const { name, password, role } = parsed.data;

    const target = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!target) {
      throw new ApiError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");
    }

    // Admin tidak boleh menyentuh akun pemilik maupun memberi peran pemilik.
    if (req.user!.role === "admin" && (target.role === "owner" || role === "owner")) {
      throw new ApiError(403, "FORBIDDEN", "Hanya pemilik yang dapat mengelola akun pemilik.");
    }
    // Mencegah akun terkunci sendiri: peran sendiri tidak bisa diubah lewat sini.
    if (role !== undefined && role !== target.role && id === req.user!.id) {
      throw new ApiError(400, "SELF_ROLE_CHANGE", "Anda tidak bisa mengubah peran sendiri.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(password !== undefined
          ? { passwordHash: await bcrypt.hash(password, 10) }
          : {}),
      },
      select: userSelect,
    });

    res.json({ success: true, data: user });
  })
);

export { router as usersRouter };
