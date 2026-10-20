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

- [x] ISSUE-013 — Test integration alur inti (Vitest + Supertest) — Minggu 7 ✅ 20 Okt 2026
- [x] ISSUE-014 — Keamanan (rate limit login, CORS ketat) + OpenAPI + deployment — Minggu 7 ✅ 20 Okt 2026

Sisa pekerjaan ISSUE-014: **demo online** belum dijalankan (butuh akun hosting pemilik). Semua berkas siap di `docs/DEPLOY.md` dan `.env.production.example`.

## Temuan tertunda (PM GATE 3 — 20 Okt 2026)

Blocking sudah diperbaiki (commit perbaikan gate 3). Berikut yang ditunda:

- [x] Batas tanggal laporan: `from` di-parse sebagai UTC sementara `to` lokal → bisa meleset 1 hari di perbatasan. **Selesai di ISSUE-013**: `resolveRange` kini menyelaraskan `from` ke awal hari lokal; test regresi ditambahkan.
- [x] `/customers` tersembunyi dari nav staf tetapi route masih bisa diakses via URL langsung (hanya baca; tulis tetap owner-only). Konsistenkan saat ISSUE-014. **Selesai**: menu Pelanggan kini tampil untuk staf, sesuai perilaku API (staf memang boleh membaca). Tulis tetap owner-only, dibuktikan test.
- [x] Dead code di `Topbar`. Rapikan saat ISSUE-014. **Selesai**: dihapus dari `Nav.tsx`.
- [ ] Tanggal selesai ISSUE-011 di dokumen tertulis 19 Okt, padahal commitnya 20 Okt. Dikoreksi pada commit perbaikan ini.
- [ ] Riwayat Git masih memuat password DB dev lokal `niagaflow_dev_2026` dan satu `SESSION_SECRET` uji di commit lama. Sudah diganti di commit ISSUE-014, tapi belum dihapus dari riwayat. Butuh rewrite history — menunggu izin pemilik.

Disclosure: file frontend ISSUE-010 ikut terbundel ke commit ISSUE-001 (deviasi backfill). `app.ts` di-rewrite bertahap per commit agar tiap commit tetap buildable.

## P2 — tunda (jangan disentuh sebelum MVP)

Portal pelanggan, notifikasi email/WA, impor CSV, multi-toko, payment gateway, audit log lengkap, PWA.

## Aturan loop

1. Kerjakan issue berurutan sesuai nomor (P0 dulu).
2. Satu issue = satu commit (atau beberapa commit kecil) dengan pesan jelas: `ISSUE-00X: deskripsi`.
3. Sebelum close, cek Definition of Done di `plan/kit.md`.
4. Jika ada temuan saat implementasi yang mengubah AC, update file issue-nya dulu.
