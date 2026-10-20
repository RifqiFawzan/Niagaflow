import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Memuat apps/api/.env.test secara manual SEBELUM modul lain (app/prisma) di-import,
 * supaya PrismaClient membaca DATABASE_URL database test — bukan database dev.
 * Diimpor paling atas di setiap file test lewat `tests/helpers.ts`.
 */
function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(apiDir, ".env.test"));

// Pastikan Prisma & server memakai DB test, apa pun .env yang ikut termuat.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

export const TEST_API_DIR = apiDir;
