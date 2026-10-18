import jwt from "jsonwebtoken";

const SESSION_COOKIE = "session";
const SESSION_TTL_DAYS = 7;

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

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export { SESSION_COOKIE };
