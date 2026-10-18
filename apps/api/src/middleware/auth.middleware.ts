import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { SESSION_COOKIE, verifySession } from "../utils/session";
import { prisma } from "../utils/prisma";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Silakan login terlebih dahulu." },
    });
  }

  const userId = verifySession(token);
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { code: "SESSION_INVALID", message: "Sesi tidak valid atau kedaluwarsa." },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Pengguna tidak ditemukan." },
    });
  }

  req.user = user;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Silakan login terlebih dahulu." },
      });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Anda tidak memiliki izin untuk tindakan ini." },
      });
    }
    next();
  };
}
