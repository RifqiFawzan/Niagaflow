import jwt from "jsonwebtoken";

const SESSION_COOKIE = "session";
const DEFAULT_SESSION_TTL_DAYS = 30;

/** Durasi sesi (hari). Bisa diatur lewat env SESSION_TTL_DAYS; default 30 hari. */
function resolveSessionTtlDays(): number {
  const raw = Number(process.env.SESSION_TTL_DAYS);
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : DEFAULT_SESSION_TTL_DAYS;
}

export const SESSION_TTL_DAYS = resolveSessionTtlDays();
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

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
    expiresIn: `${SESSION_TTL_DAYS}d`,
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
const isProduction = process.env.NODE_ENV === "production";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  maxAge: SESSION_TTL_MS,
};

export { SESSION_COOKIE };
