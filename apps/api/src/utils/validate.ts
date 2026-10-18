import { ApiError } from "./ApiError";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validasi path param :id berbentuk UUID SEBELUM masuk Prisma,
 * supaya id sampah menghasilkan 400 (bukan P2023 -> 500).
 */
export function parseUuid(value: string): string {
  if (!UUID_RE.test(value)) {
    throw new ApiError(400, "INVALID_ID", "Parameter id tidak valid.");
  }
  return value;
}
