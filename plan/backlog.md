# NiagaFlow — Backlog

Sumber: `plan/niagaflow_fullstack_project_plan.md` (§3 Ruang Lingkup, §9 Jadwal, §10 Prioritas).
Alur kerja: `workflow.md` — backlog → issues → kit → run loop (per issue: grooms → implement → verify → PASS/FAIL → close).

## P0 — MVP

- [x] ISSUE-001 — Scaffold monorepo (web + api + health check + README) — Minggu 1 ✅ 18 Okt 2026
- [x] ISSUE-002 — Skema database Prisma + migrasi + seed demo — Minggu 2 ✅ 18 Okt 2026
- [x] ISSUE-003 — Autentikasi login/logout/me + middleware role — Minggu 2 ✅ 18 Okt 2026
- [x] ISSUE-004 — CRUD kategori (hapus hanya jika tidak dipakai) — Minggu 3 ✅ 18 Okt 2026
- [x] ISSUE-005 — CRUD produk (SKU unik, search/filter/pagination, arsip) — Minggu 3 ✅ 18 Okt 2026
- [x] ISSUE-006 — CRUD pelanggan + riwayat pesanan per pelanggan — Minggu 4 ✅ 18 Okt 2026
- [x] ISSUE-007 — Buat pesanan (transaksi DB, stok, total dihitung backend) — Minggu 4 ✅ 18 Okt 2026
- [x] ISSUE-008 — Status pesanan, cancel + pengembalian stok, riwayat status — Minggu 4 ✅ 18 Okt 2026
- [x] ISSUE-009 — API dashboard & laporan (summary, top-products, low-stock) — Minggu 5 ✅ 18 Okt 2026
- [x] ISSUE-010 — Frontend shell + login + proteksi route — Minggu 6 ✅ 18 Okt 2026
- [x] ISSUE-011 — Halaman produk, kategori, pelanggan — Minggu 6 ✅ 20 Okt 2026
- [x] ISSUE-012 — Halaman pesanan, dashboard, laporan — Minggu 6 ✅ 20 Okt 2026

## P1 — setelah P0 stabil

- [ ] ISSUE-013 — Test integration alur inti (Vitest + Supertest) — Minggu 7
- [ ] ISSUE-014 — Keamanan (rate limit login, CORS ketat) + OpenAPI + deployment — Minggu 7

## Temuan tertunda (PM GATE 3 — 20 Okt 2026)

Blocking sudah diperbaiki (commit perbaikan gate 3). Berikut yang ditunda:

- [ ] Batas tanggal laporan: `from` di-parse sebagai UTC sementara `to` lokal → bisa meleset 1 hari di perbatasan. Kerjakan bersama test laporan di ISSUE-013.
- [ ] `/customers` tersembunyi dari nav staf tetapi route masih bisa diakses via URL langsung (hanya baca; tulis tetap owner-only). Konsistenkan saat ISSUE-014.
- [ ] Dead code di `Topbar`. Rapikan saat ISSUE-014.
- [ ] Tanggal selesai ISSUE-011 di dokumen tertulis 19 Okt, padahal commitnya 20 Okt. Dikoreksi pada commit perbaikan ini.

Disclosure: file frontend ISSUE-010 ikut terbundel ke commit ISSUE-001 (deviasi backfill). `app.ts` di-rewrite bertahap per commit agar tiap commit tetap buildable.

## P2 — tunda (jangan disentuh sebelum MVP)

Portal pelanggan, notifikasi email/WA, impor CSV, multi-toko, payment gateway, audit log lengkap, PWA.

## Aturan loop

1. Kerjakan issue berurutan sesuai nomor (P0 dulu).
2. Satu issue = satu commit (atau beberapa commit kecil) dengan pesan jelas: `ISSUE-00X: deskripsi`.
3. Sebelum close, cek Definition of Done di `plan/kit.md`.
4. Jika ada temuan saat implementasi yang mengubah AC, update file issue-nya dulu.
