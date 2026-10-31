# ISSUE-020 — Peran 4 jenis (tambah admin/kasir/pengelola stok) + halaman kelola pengguna

Status: done | Priority: P1 | Selesai: 31 Okt 2026

Sumber: `plan/POS_UI_UX_Guideline.md` §15 (peran: owner, kasir, pengelola stok, admin),
§2 (tabel kebutuhan peran), menu "Pengguna & Peran" §4. Tahap B paket 3 dari audit
`plan/audit-pos-uiux.md` (P1 no. 8 + sebagian P2 no. 16).

## Goal

Peran bertambah menjadi 4 jenis sesuai pedoman (staf lama dipertahankan agar data lama
tidak rusak), otorisasi backend mengikuti peran, dan tersedia halaman kelola pengguna
(buat akun + ubah peran) untuk owner & admin.

## Asumsi keputusan (default konvensional, tidak ada jawaban khusus dari user)

- **Enum Role**: `owner`, `admin`, `kasir`, `stock_manager`, `staff` (staf lama tetap
  ada agar akun & data lama aman).
- **Matriks izin** (paling konservatif — perilaku owner & staf tidak berubah):
  - Semua peran (basis staf): baca dashboard/produk/pelanggan/pesanan, buat pesanan,
    lihat riwayat stok.
  - **Pengelola stok** += tulis produk, tulis kategori, catat mutasi stok manual
    (sebelumnya owner-saja).
  - **Kasir** = basis staf (transaksi + riwayat), tanpa kekuatan tulis produk/kategori.
  - **Admin** += kelola pengguna (owner & admin saja), tapi **tanpa** laporan.
  - **Laporan** tetap owner-saja; tulis pelanggan tetap owner-saja (tidak diubah).
- **Admin dibatasi agar tidak bisa**: memberi peran owner, menyentuh akun pemilik
  (cegah eskalasi hak). Kebijakan dijepit di server, UI hanya menyembunyikan pilihan.
- **Tidak ada hapus akun**: riwayat pesanan menolak penghapusan (FK) dan akses bisa
  dicabut dengan menurunkan peran ke staf. **Tidak ada ubah peran sendiri**
  (`SELF_ROLE_CHANGE`) supaya akun tidak terkunci sendiri.
- Halaman "Pengguna" berisi buat akun + ubah peran saja. Reset password via UI,
  profil usaha, dan ganti password sendiri **belum** (audit no. 16 sebagian).
- Menu "Pengguna" tampil owner+admin; "Kategori" kini owner+pengelola stok; "Laporan"
  tetap owner.

## Scope

### DB (migrasi `20261031084549_add_roles`)

- `ALTER TYPE "Role" ADD VALUE` `admin`, `kasir`, `stock_manager` (staf & owner lama
  tidak tersentuh).

### Backend

- `middleware/auth.middleware.ts`: `requireRole` kini menerima banyak peran
  (`requireRole("owner", "stock_manager")`).
- Penjaga diperbarui: produk (3), kategori (3), stok-movements POST →
  `owner + stock_manager`. Laporan & tulis pelanggan tetap owner.
- Modul baru `modules/users/users.routes.ts` (owner+admin, dipasang `/api/v1/users`):
  - `GET /` — daftar (tanpa password), semua user owner/admin boleh lihat.
  - `POST /` — buat akun (nama, email unik → 409, password min 8, peran); admin tidak
    boleh membuat peran owner (403).
  - `PATCH /:id` — ubah nama/peran/password; admin tidak boleh menyentuh akun pemilik;
    ubah peran sendiri → 400 `SELF_ROLE_CHANGE`; 404 bila id tak dikenal, 400 bila bukan
    UUID.
- OpenAPI: `userSchema`, `userInput`, `userUpdateInput`; path GET/POST/PATCH users
  (tag "Pengguna", ditambahkan ke daftar tag; tag "Riwayat stok" ikut dilengkapi);
  ringkasan endpoint kategori/produk/stok disesuaikan ("owner/pengelola stok").

### Frontend

- `types/index.ts`: `Role` 5 nilai + `ROLE_LABELS` (Pemilik, Admin, Kasir, Pengelola
  stok, Staf); `User` dapat `createdAt?`.
- `routes/guards.tsx`: `RoleGuard` menerima `Role | Role[]`.
- `components/layout/Nav.tsx`: `ownerOnly` → `roles: Role[]`; item baru "Pengguna"
  (UserCog) owner+admin; "Kategori" owner+pengelola stok; "Laporan" owner.
- `AppLayout`: label peran memakai `ROLE_LABELS`.
- `App.tsx`: route produk/tambah/ubah + kategori → `["owner","stock_manager"]`;
  route baru `/users` → `["owner","admin"]`.
- `ProductListPage`: `isOwner` → `canManage` (owner|stock_manager) untuk tombol
  Produk baru / Atur stok / Ubah / Arsipkan.
- `features/users/UserListPage.tsx` (baru): tabel Nama/Email/Peran/Bergabung/Aksi;
  dialog "Pengguna baru" (validasi klien + peran default Kasir); dialog "Ubah peran";
  baris sendiri & baris pemilik (untuk admin) tanpa aksi; pilihan peran owner
  disembunyikan untuk admin.

### Test

- `tests/helpers.ts`: fixture bertambah `kasir`, `stockManager`, `admin`.
- `tests/auth-roles.test.ts` +12 test → **64 lulus**: pengelola stok boleh tulis
  produk/kategori/stok; kasir 403 untuk itu tapi boleh buat pesanan & lihat riwayat;
  laporan owner-saja (admin/pengelola stok/kasir 403); /users 403 untuk staf/kasir/
  pengelola stok; owner buat pengguna + duplikat 409 + login pengguna baru; admin buat
  akun non-owner tapi owner → 403; admin ubah akun pemilik → 403; ubah peran ditolak
  untuk diri sendiri; ubah password → login password-baru berhasil; id 404/non-UUID 400.

## Acceptance Criteria

- [x] Peran 4 jenis + staf lama ada di DB dan bisa dipilih saat buat/ubah pengguna
- [x] Pengelola stok bisa kelola produk, kategori, dan mutasi stok; kasir tidak
- [x] Laporan tetap khusus owner
- [x] Halaman kelola pengguna (owner & admin): buat akun + ubah peran
- [x] Admin tidak bisa memberi peran pemilik / menyentuh akun pemilik (server + UI)
- [x] Menu sidebar mengikuti peran; label peran tampil di header
- [x] Typecheck + build web hijau; 64 test API lulus

## Verifikasi (31 Okt 2026, lokal, browser + test)

| AC | Cara uji | Hasil |
|---|---|---|
| Owner penuh | Login owner → sidebar | Lulus. Menu lengkap + "Pengguna"; label "Pemilik"; pilihan peran di dialog lengkap 5 peran. |
| Buat pengguna | Dialog "Pengguna baru" ×3 (kasir, pengelola stok, admin) | Lulus. Ketiganya muncul di tabel dengan peran & tanggal benar; 0 error konsol. |
| Kasir | Login kasir@niagaflow.test | Lulus. Menu "Dashboard, Produk, Pelanggan, Pesanan" (tanpa Kategori/Laporan/Pengguna); produk tanpa "Produk baru"/"Atur stok", "Riwayat stok" ada; /reports & /users dialihkan ke dashboard. |
| Pengelola stok | Login stok@niagaflow.test | Lulus. Menu + "Kategori" (tanpa Laporan/Pengguna); produk dengan "Produk baru" + "Atur stok"; halaman kategori terbuka; /reports dialihkan. |
| Admin | Login admin@niagaflow.test → /users | Lulus. Menu + "Pengguna" (tanpa Kategori/Laporan); baris pemilik & baris sendiri tanpa aksi "Ubah peran"; opsi "Pemilik" tidak muncul; ubah peran Staf Demo → Kasir berhasil lalu dikembalikan ke Staf. |
| Batasan server | Test API (admin ubah pemilik 403, buat owner 403, ubah peran sendiri 400, duplikat 409) | Lulus. |
| Typecheck/build/test | `npm run typecheck -w apps/api -w apps/web`, `npm run build -w apps/web`, `npm run test -w apps/api` | Lulus. 64 test; build hijau. |

## Perubahan kode

- `apps/api/prisma/schema.prisma` + `prisma/migrations/20261031084549_add_roles/`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/modules/users/users.routes.ts` (baru)
- `apps/api/src/app.ts`
- `apps/api/src/modules/products/products.routes.ts`
- `apps/api/src/modules/categories/categories.routes.ts`
- `apps/api/src/modules/stock/stock.routes.ts`
- `apps/api/src/docs/openapi.ts`, `openapi-schemas.ts`, `openapi-routes.ts`
- `apps/api/tests/helpers.ts`, `apps/api/tests/auth-roles.test.ts`
- `apps/web/src/types/index.ts`
- `apps/web/src/routes/guards.tsx`
- `apps/web/src/components/layout/Nav.tsx`, `AppLayout.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/features/products/ProductListPage.tsx`
- `apps/web/src/features/users/UserListPage.tsx` (baru)
- `plan/audit-pos-uiux.md` (temuan 8, 16)

## Catatan / sisa

- DB dev kini berisi 3 pengguna uji (Kasir Toko, Pengelola Stok, Admin Toko — semua
  password `rahasia123`) plus Staf Demo yang sempat diubah perannya lalu dikembalikan
  ke staf. Hapus lewat DB langsung bila tidak dipakai (halaman belum punya hapus akun).
- Reset password via UI, profil usaha, ganti password sendiri: audit no. 16 sebagian —
  belum (API PATCH `/users/:id` sudah mendukung reset password).
- Demo login di halaman masuk tetap 2 tombol (Pemilik/Staf); peran baru login dengan
  email buatan sendiri.

## Refs

- `plan/POS_UI_UX_Guideline.md` §2 (tabel peran), §4 (menu), §15 (hak akses)
- `plan/audit-pos-uiux.md` temuan P1 no. 8, P2 no. 16
