import jwt from "jsonwebtoken";

const SESSION_COOKIE = "session";
const DEFAULT_SESSION_TTL_DAYS = 30;

/**
 * Durasi sesi (hari), dibaca saat dipakai — bukan saat modul dimuat.
 * Di lokal, `.env` baru termuat lewat Prisma Client; kalau dibaca di awal,
 * `SESSION_TTL_DAYS` terlewat dan yang terpakai default.
 */
export function sessionTtlDays(): number {
  const raw = Number(process.env.SESSION_TTL_DAYS);
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : DEFAULT_SESSION_TTL_DAYS;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET wajib di-set di production.");
    }
    return "dev-secret-tidak-aman";
  }
  return secret;
}

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), {
    expiresIn: `${sessionTtlDays()}d`,
  });
}

export function verifySession(token: string): string | null {
  try {
    const payload = jwt.verify(token, getSecret());
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}

// Frontend memanggil API lewat path yang sama (rewrite /api di Vercel), jadi
// cookie tetap first-party. SameSite=Lax cukup dan paling aman; cookie
// third-party (SameSite=None) diblokir browser HP (Safari/Chrome), yang membuat
// sesi hilang dan data tidak muncul di smartphone.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionTtlDays() * 24 * 60 * 60 * 1000,
  };
}

export { SESSION_COOKIE };
