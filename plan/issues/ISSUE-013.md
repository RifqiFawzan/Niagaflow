# ISSUE-013 — Test integration alur inti

Status: done (20 Okt 2026) | Priority: P1 | Milestone: Minggu 7

## Goal

Test Vitest + Supertest melindungi alur inti: auth, izin role, SKU duplikat, pesanan & stok, cancel restock, laporan.

## Scope

- Setup Vitest + Supertest di `apps/api/tests`
- Skenario (plan §11): login sukses/gagal; staf ditolak kelola produk; SKU duplikat `409`; pesanan stok kurang `409` + rollback; pesanan sukses mengurangi stok; cancel mengembalikan stok; total penjualan hanya `completed`

## Acceptance Criteria

- [x] `npm run test` hijau di CI/lokal
- [x] Test memakai database test terpisah (bukan data demo)
- [x] Tidak ada test yang bergantung urutan eksekusi

## Hasil

Dua suite, **35 test hijau** (`npm run test` dari root maupun `-w apps/api`):

| Suite | Test | Cakupan |
| --- | --- | --- |
| `tests/auth-roles.test.ts` | 12 | login sukses/gagal/email tak dikenal, cookie HttpOnly, `/me` tanpa & dengan sesi, logout, staf ditolak kelola produk & kategori & laporan owner-only (403), staf boleh lihat produk + buat pesanan, owner boleh kelola produk, SKU duplikat 409 |
| `tests/orders-reports.test.ts` | 23 | total dihitung server (harga kiriman klien diabaikan), diskon, riwayat status awal, snapshot nama/harga item, stok kurang 409 + rollback (single & multi-item), produk diarsipkan, diskon > subtotal, validasi, 401 tanpa sesi, transisi status + transisi tidak valid + status terminal, cancel restock tepat sekali, id tidak valid 404/400, laporan (summary hanya `completed`, dashboard, top-products, low-stock, filter rentang tanggal, batas tanggal lokal, 401 tanpa sesi) |

Infrastruktur:

- `apps/api/tests/global-setup.ts` — memuat `.env.test`, lalu `prisma db push --force-reset` ke DB test sebelum suite jalan.
- `apps/api/tests/helpers.ts` — `resetFixtures()` (hapus + buat ulang fixture: 2 user, 2 kategori, 3 produk, 1 pelanggan) + `loginCookie()` memakai endpoint login asli; ikut me-reset rate limiter agar 10 login/menit tidak bocor antar-test.
- `apps/api/tests/env.ts` — mengarahkan `DATABASE_URL` ke `TEST_DATABASE_URL` sebelum PrismaClient dibuat.
- `apps/api/tsconfig.test.json` + script `npm run typecheck -w apps/api` — typecheck `src` + `tests`.
- `apps/api/src/utils/rateLimit.ts` — tambah `resetRateLimit()` (hanya dipakai test).

Bukti:

- `npm run test` → `Test Files 2 passed (2)` / `Tests 35 passed (35)`.
- Urutan dibalik (`vitest run tests/orders-reports.test.ts tests/auth-roles.test.ts`) → tetap 35 passed (tidak bergantung urutan).
- DB dev dicek setelah suite: `niagaflow` tetap 2 users / 7 orders / 5 products (tidak tersentuh); `niagaflow_test` berisi fixture test.
- `npx tsc --noEmit -p apps/api/tsconfig.json` dan `-p apps/api/tsconfig.test.json` → bersih.

Catatan: `.env.test` tidak di-commit (masuk `.gitignore`); contohnya di `apps/api/.env.test.example`.

## Refs

- plan §11 (strategi testing), §13 (DoD: ada test logika penting)
