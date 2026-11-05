# ISSUE-023 — Perbaiki sesi hilang di HP (cookie first-party + umur sesi)

Status: done | Priority: P1 | Selesai: 6 Nov 2026

Sumber: laporan pemilik, 6 Nov 2026 — sesi di web tidak bisa dipakai di
smartphone dan data tidak muncul.

## Diagnosis

Bukan masalah database dan bukan umur sesi yang pendek. Penyebabnya cookie sesi
dianggap **third-party** oleh browser HP:

- Web: `https://berniagaflows.vercel.app`
- API: `https://berniaga-flows.vercel.app` (domain berbeda)

`vercel.app` ada di Public Suffix List, jadi kedua subdomain dihitung sebagai
situs berbeda. Web memanggil API langsung (env `VITE_API_URL`), sehingga cookie
`session` yang dipasang API adalah cookie third-party.

- Chrome desktop masih mengizinkan cookie third-party → login normal.
- Safari (iOS) dan Chrome di HP memblokirnya → cookie tidak disimpan, semua
  request setelah login jadi 401, daftar/data tampak kosong.
- Cookie production lama: `SameSite=None; Max-Age=604800` (7 hari).

## Perbaikan

1. **API dipanggil lewat domain web sendiri.** `apps/web/vercel.json` menambah
   rewrite `/api/:path*` → `https://berniaga-flows.vercel.app/api/:path*`
   (sebelum rewrite SPA). Web memakai path relatif `/api/v1/...`, jadi cookie
   menjadi first-party dan diterima semua browser HP.
2. **Cookie `SameSite=Lax`** (sebelumnya `None` di production). Dengan satu
   domain, `Lax` cukup dan lebih aman.
3. **Umur sesi default 30 hari**, bisa diatur lewat env `SESSION_TTL_DAYS` (JWT
   dan `maxAge` cookie selalu sinkron). Sebelumnya hardcode 7 hari. Nilai env
   dibaca saat request (bukan saat modul dimuat) karena di lokal `.env` baru
   termuat lewat Prisma Client — kalau dibaca di awal, nilai dari `.env` terlewat
   dan yang terpakai default. Lokal diisi `SESSION_TTL_DAYS=7` di
   `apps/api/.env` (tidak di-commit); production tetap 30 hari.
4. Dokumentasi (`README.md`, `docs/DEPLOY.md`, `.env.example`,
   `.env.production.example`) diperbarui: `VITE_API_URL` **jangan diisi** di
   hosting.

## Asumsi keputusan

- **Default 30 hari** dipilih agar POS di HP tidak sering minta login ulang;
  bisa diubah kapan saja lewat env tanpa ubah kode.
- **Tanpa domain kustom.** Rewrite Vercel dipakai karena pemilik memakai domain
  `*.vercel.app`; cara ini tidak butuh beli domain.
- **URL backend ditulis langsung di `vercel.json`** karena rewrite tidak bisa
  membaca environment variable. Bila URL API berubah, ganti `destination`.
- Data di database tidak diubah/dihapus sama sekali. "Data tidak muncul" adalah
  efek 401, bukan data hilang.

## Acceptance Criteria

- [x] Cookie sesi production memakai `SameSite=Lax` (bukan `None`)
- [x] Umur sesi default 30 hari dan bisa diatur lewat `SESSION_TTL_DAYS`
      (lokal diuji dengan 7 hari)
- [x] Frontend memakai path relatif `/api`; rewrite Vercel meneruskan ke backend
- [x] Dokumentasi deploy tidak lagi menyuruh mengisi `VITE_API_URL`
- [x] Typecheck API + web hijau, test API 62/62 lulus, build web hijau
- [ ] Setelah deploy: login di HP bertahan dan data muncul (perlu deploy Vercel)

## Verifikasi lokal (6 Nov 2026)

| Uji | Hasil |
|---|---|
| Login lokal (`SESSION_TTL_DAYS=7`), cek header `Set-Cookie` | `Max-Age=604800` (7 hari), `HttpOnly`, `SameSite=Lax` |
| Login lokal tanpa env (default) | `Max-Age=2592000` (30 hari) |
| `npx tsc --noEmit` (api) | Lulus |
| `npm test` (api) | 62/62 lulus |
| `npm run build` (web) | Lulus |
| Arsitektur lokal | Vite dev sudah memakai proxy `/api` → `localhost:4000`, sama seperti pola rewrite di production |

## Langkah deploy (wajib, berurutan)

1. **Web dulu:** hapus env `VITE_API_URL` di project frontend Vercel, lalu
   redeploy. `vercel.json` baru ikut ter-deploy.
2. **API:** redeploy agar cookie `SameSite=Lax` + TTL 30 hari aktif. Opsional isi
   `SESSION_TTL_DAYS` di Vercel bila tidak ingin 30 hari (misalnya `7`).
3. Uji di HP: login, buka Produk/Pesanan, pastikan data muncul dan sesi bertahan
   setelah browser ditutup.

Urutan ini penting: kalau API di-deploy duluan (`Lax`) sementara web masih
memanggil domain API langsung, login desktop ikut rusak.

## Perubahan kode

- `apps/api/src/utils/session.ts`
- `apps/web/vercel.json`
- `apps/web/src/lib/api.ts` (komentar)
- `README.md`, `docs/DEPLOY.md`, `.env.example`, `.env.production.example`

## Catatan

- Migrasi Neon `20261031084549_add_roles` masih menunggu dijalankan; tidak
  berhubungan dengan masalah sesi ini.
- Setelah deploy, cookie lama (third-party untuk domain API) tidak terpakai lagi;
  pengguna otomatis login ulang sekali di HP.
