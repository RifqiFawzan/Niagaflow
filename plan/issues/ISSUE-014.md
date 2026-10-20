# ISSUE-014 — Keamanan + OpenAPI + deployment

Status: done | Priority: P1 | Milestone: Minggu 7 | Selesai: 20 Okt 2026

Catatan: bagian "demo online" belum dijalankan karena butuh akun hosting milik pemilik proyek. Berkas dan panduan deploy sudah siap di `docs/DEPLOY.md`. Lihat tabel verifikasi di bawah.

## Goal

MVP diamankan, terdokumentasi (OpenAPI), dan bisa didemokan online.

## Scope

- Rate limiting login penuh, CORS hanya untuk origin web, cookie `HttpOnly`/`SameSite`, `Secure` di production
- Dokumentasi API OpenAPI/Swagger dari skema Zod yang ada
- Deploy: frontend + backend + PostgreSQL terkelola; env vars diatur di hosting; akun demo fiktif
- README final: screenshot, ERD, cara setup, cara test, link demo

## Acceptance Criteria

- [x] Tidak ada secret di Git (cek `git log -p` untuk `.env`) — dengan catatan di bawah
- [x] Swagger UI bisa dibuka dan semua endpoint terdaftar
- [ ] Demo online bisa login dengan akun demo dan menjalankan alur pesanan utama — **belum**, butuh akun hosting
- [x] Rate limit login aktif (percobaan berulang dibatasi)

## Verifikasi (20 Okt 2026)

| AC | Cara uji | Hasil |
|---|---|---|
| Tidak ada secret di Git | `git log --all --name-only --diff-filter=A` + cari pola secret di `git log -p` | Lulus dengan catatan. File `.env` asli **tidak pernah** masuk Git; hanya `.env.example` dan `apps/api/.env.test.example`. **Catatan:** password DB dev lokal dan satu `SESSION_SECRET` uji masih ada di isi commit lama; sudah diganti di commit ini, tapi belum dihapus dari riwayat (butuh rewrite history, tidak dilakukan tanpa izin). |
| Swagger UI | Buka `/docs/`, hitung `.opblock` | Lulus. 26 operasi di 19 path, 7 grup tag. `/openapi.json` valid (OpenAPI 3.0.3). |
| Demo online | — | Belum dijalankan. Berkas siap: `.env.production.example`, `docs/DEPLOY.md`, skrip `deploy:build`. |
| Rate limit login | 12 percobaan login salah lewat HTTP, plus test otomatis | Lulus. Percobaan ke-11 dan ke-12 dijawab `429 RATE_LIMITED`. Test `rate limit login` ikut menjaga perilaku ini. |

## Perubahan tambahan di luar scope awal

- `.gitignore`: pola `.env.*` ditambah (sebelumnya `.env.production` bisa lolos ikut ter-commit).
- `app.ts`: header keamanan dasar (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`), batas body JSON 1 MB, dan `trust proxy` opsional lewat `TRUST_PROXY`.
- `seed.ts`: di production seed menolak jalan kalau `DEMO_PASSWORD` kosong atau < 12 karakter. Password dev lokal tetap `password123` agar test tidak rusak.
- Frontend: `api.ts` kini membaca `VITE_API_URL` (temuan penting — sebelumnya hanya path relatif `/api/v1`, sehingga di hosting akan menuju domain frontend sendiri dan login gagal). Ditambah `vite-env.d.ts` agar tipe env dicek.
- `Nav.tsx`: menu Pelanggan ditampilkan ke staf (sesuai perilaku API yang memang mengizinkan staf membaca), dan dead code `Topbar` dihapus.
- Test bertambah dari 35 menjadi 38: baca pelanggan oleh staf, tulis pelanggan oleh staf ditolak 403, dan rate limit login.

## Refs

- plan §12 (keamanan), §14 (isi README), §9 Minggu 7
