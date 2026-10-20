import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Baca apps/api/.env.test (format KEY=VALUE sederhana) tanpa dependensi tambahan. */
function loadTestEnv() {
  const file = path.join(apiDir, ".env.test");
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

/**
 * Menyiapkan database test terpisah (niagaflow_test) sebelum seluruh suite berjalan.
 * Skema didorong dengan `prisma db push --force-reset` supaya test selalu mulai dari
 * skema bersih tanpa menyentuh database demo/dev.
 *
 * Mengembalikan fungsi teardown: Vitest 3 memanggilnya setelah semua suite selesai
 * (opsi `globalTeardown` terpisah tidak dikenal di versi ini).
 */
export default async function setup() {
  loadTestEnv();

  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL belum diisi. Salin apps/api/.env.test.example ke apps/api/.env.test."
    );
  }

  const env = { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL };

  execFileSync("npx", ["prisma", "db", "push", "--force-reset", "--skip-generate"], {
    cwd: apiDir,
    env,
    stdio: "inherit",
    shell: true,
  });

  return async function teardown() {
    // Koneksi Prisma ditutup oleh afterAll di setiap file test; tidak ada yang perlu dibersihkan.
  };
}
