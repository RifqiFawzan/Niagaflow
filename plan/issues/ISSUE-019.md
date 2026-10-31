# ISSUE-019 — Riwayat pergerakan stok + form stok masuk/keluar

Status: done | Priority: P1 | Selesai: 31 Okt 2026

Sumber: `plan/POS_UI_UX_Guideline.md` §15.5 (riwayat stok), §15.6 (stok masuk/keluar),
§9 (inventori). Tahap B paket 2 dari audit `plan/audit-pos-uiux.md` (P1 no. 6).

## Goal

Setiap perubahan stok tercatat sebagai mutasi (masuk/keluar/penjualan/pembatalan) dengan
alasan, pelaku, dan waktu — plus form manual "stok masuk/keluar" khusus owner dan halaman
riwayat yang bisa ditelusuri semua peran.

## Asumsi keputusan (default konvensional, tidak ada jawaban khusus dari user)

- **4 jenis mutasi**: `MASUK`/`KELUAR` (manual, owner) + `PENJUALAN`/`PEMBATALAN`
  (otomatis dari pesanan). Nilai `delta` bertanda (+/−) supaya riwayat cukup satu kolom.
- **`reason` wajib hanya untuk input manual**; mutasi otomatis `reason` null — UI menampilkan
  nomor pesanan terkait ("Pesanan ORD-…") sebagai keterangannya.
- **Stok awal produk baru & penyesuaian lewat form ubah produk** ikut tercatat (alasan
  "Stok awal produk baru" / "Penyesuaian lewat ubah produk") — tidak ada jalur ubah stok
  yang diam-diam.
- **Daftar riwayat terbuka untuk semua peran login** (read-only); hanya POST yang owner-only
  (403 untuk staf). Konsisten dengan keterbacaan data stok oleh kasir.
- **Filter halaman riwayat**: produk + pencarian (nama/alasan, klien). Filter per jenis
  belum dibuat — bisa ditambah bila diminta.
- Route `/stock-movements` tanpa `RoleGuard` (bukan halaman ubah data).

## Scope

### DB (migrasi `20261026144534_add_stock_movements`)

- Enum baru `StockMovementType { MASUK, KELUAR, PENJUALAN, PEMBATALAN }`.
- Model `StockMovement` (`stock_movements`): `delta` (integer bertanda), `type`, `reason?`,
  `orderId?` (onDelete SetNull), `createdBy`, relasi `Product` (Cascade) + `User`;
  index `[productId, createdAt desc]`.

### Backend

- Modul baru `modules/stock/stock.routes.ts`, dipasang di `app.ts`:
  - `POST /api/v1/stock-movements` — owner-only; `reason` wajib; guard `INSUFFICIENT_STOCK`
    bila keluar melebihi stok; update stok + catat mutasi dalam satu transaksi.
  - `GET /api/v1/stock-movements` — semua peran login; filter `productId`/`type`, paginasi,
    include product/user/order.
- `orders.routes.ts`: buat pesanan → `createMany` mutasi `PENJUALAN` (−qty per item);
  batalkan → `PEMBATALAN` (+qty) dalam transaksi yang sama.
- `products.routes.ts`: POST produk mencatat stok awal (bila >0); PATCH mencatat selisih
  stok ("Penyesuaian lewat ubah produk") — dua-duanya dibungkus `$transaction`.
- OpenAPI: `stockMovementSchema` + `stockMovementInput`; path GET/POST `/stock-movements`
  (tag "Riwayat stok").
- `tests/helpers.ts`: `resetFixtures` menghapus `stockMovement` lebih dulu (FK ke product).

### Frontend

- `types/index.ts`: `StockMovementType`, `STOCK_MOVEMENT_LABELS`, `StockMovement`.
- `StockAdjustDialog.tsx` (baru): jenis Masuk/Keluar, jumlah, alasan wajib; validasi klien
  (min 1, alasan terisi, keluar ≤ stok); sukses → invalidate `["products"]` +
  `["stock-movements"]`.
- `ProductListPage.tsx`: tombol header **Riwayat stok** (semua peran) → `/stock-movements`;
  tombol baris **Atur stok** (owner) → dialog.
- `StockMovementListPage.tsx` (baru, `features/stock/`): tabel Waktu / Produk / Jenis
  (badge warna) / Perubahan (±, hijau/merah) / Alasan / Oleh; filter produk + pencarian;
  paginasi mengikuti pola halaman produk.
- `App.tsx`: route `/stock-movements` tanpa RoleGuard.

### Test

- `tests/stock-movements.test.ts` (10 test baru) → **52 lulus**: stok masuk, tolak keluar
  melebihi stok, `reason` wajib, staf 403, daftar + filter + paginasi, pesanan → PENJUALAN,
  batalkan → PEMBATALAN, PATCH produk → selisih tercatat, produk baru → stok awal tercatat.

## Acceptance Criteria

- [x] Setiap perubahan stok tercatat: manual, pesanan, pembatalan, ubah/produk baru
- [x] Form stok masuk/keluar (owner) dengan alasan wajib; keluar dibatasi stok tersedia
- [x] Halaman riwayat: waktu, produk, jenis, perubahan ±, alasan/kaitan pesanan, pelaku
- [x] Staf bisa melihat riwayat tapi tidak bisa mencatat mutasi (403)
- [x] Typecheck + build web hijau; 52 test API lulus

## Verifikasi (31 Okt 2026, lokal)

| AC | Cara uji | Hasil |
|---|---|---|
| Stok masuk | Browser (owner): Atur stok → Masuk 10, alasan "Restok dari pemasok" | Lulus. Teh Manis 117 → 127; baris `MASUK +10` muncul dengan pelaku "Owner Demo". |
| Stok keluar | Dialog → Keluar 5, alasan "Barang rusak" | Lulus. Kue Kering 50 → 45; baris `KELUAR −5`. |
| Mutasi penjualan | Buat pesanan 1 Teh Manis → buka riwayat | Lulus. Baris `PENJUALAN −1`, keterangan "Pesanan ORD-20261031-XG865P". |
| Mutasi pembatalan | Batalkan pesanan uji | Lulus. Baris `PEMBATALAN +1`; stok Teh Manis kembali 127. |
| Peran staf | Login staf → halaman produk | Lulus. Tanpa tombol "Atur stok"; tombol "Riwayat stok" tetap ada dan halaman riwayat terbuka (4 baris). |
| Tolak keluar berlebih | Test API `keluar` melebihi stok | Lulus. 400 `INSUFFICIENT_STOCK`, stok tidak berubah. |
| Typecheck/build/test | `npm run typecheck -w apps/api -w apps/web`, `npm run build -w apps/web`, `npm run test -w apps/api` | Lulus. 52 test; build hijau; 0 error konsol selama uji browser. |

## Perubahan kode

- `apps/api/prisma/schema.prisma` + `prisma/migrations/20261026144534_add_stock_movements/`
- `apps/api/src/modules/stock/stock.routes.ts` (baru)
- `apps/api/src/app.ts`
- `apps/api/src/modules/orders/orders.routes.ts`
- `apps/api/src/modules/products/products.routes.ts`
- `apps/api/src/docs/openapi-schemas.ts`, `apps/api/src/docs/openapi-routes.ts`
- `apps/api/tests/helpers.ts`, `apps/api/tests/stock-movements.test.ts` (baru)
- `apps/web/src/types/index.ts`
- `apps/web/src/features/products/StockAdjustDialog.tsx` (baru)
- `apps/web/src/features/products/ProductListPage.tsx`
- `apps/web/src/features/stock/StockMovementListPage.tsx` (baru)
- `apps/web/src/App.tsx`
- `plan/audit-pos-uiux.md` (temuan 6)

## Catatan / sisa

- Data uji lokal tertinggal di riwayat (masuk +10, keluar −5, pesanan dibatalkan) — jejak
  verifikasi wajar di DB dev.
- Filter jenis mutasi & ekspor riwayat belum (di luar temuan audit; minta bila perlu).
- `prisma generate` di Windows minta port 4000 dilepas dulu (EPERM) — sudah jalan sebelum
  shutdown terakhir.

## Refs

- `plan/POS_UI_UX_Guideline.md` §9 (inventori), §15.5–§15.6 (riwayat & mutasi stok)
- `plan/audit-pos-uiux.md` temuan P1 no. 6
