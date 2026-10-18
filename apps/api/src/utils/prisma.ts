import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient — satu koneksi pool untuk seluruh aplikasi.
 * (Di CI/test bisa di-reset via prisma.$disconnect() + hapus referensi.)
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
