import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth } from "../../middleware/auth.middleware";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "../../utils/session";
import { rateLimit } from "../../utils/rateLimit";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../utils/prisma";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

router.post("/login", asyncHandler(async (req, res) => {
  const ip = req.ip ?? "unknown";
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return res.status(429).json({
      success: false,
      error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan login. Coba lagi nanti." },
    });
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
    });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Email atau password salah." },
    });
  }

  res.cookie(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
  res.json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}));

router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  res.json({ success: true, data: null });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

export { router as authRouter };
