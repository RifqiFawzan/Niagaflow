# ISSUE-022 — Hapus fitur pelanggan (kode saja)

Status: done | Priority: P2 | Selesai: 3 Nov 2026

Sumber: permintaan langsung pemilik, 3 Nov 2026 — "tidak perlu fitur pelanggan
karna fitur ini sangat tidak efektif".

## Goal

Fitur pelanggan hilang dari aplikasi: menu, halaman, pilihan di form pesanan,
kolom di daftar/detail pesanan, API, dan dokumentasi. Data lama di database
tetap disimpan.

## Asumsi keputusan

- **Lingkup "hapus kodenya saja"** (pilihan pemilik saat dikonfirmasi): seluruh
  kode, menu, dan API pelanggan dihapus; tabel `Customer`, kolom `orders.customer_id`,
  dan model Prisma **dibiarkan** — tidak ada migrasi, data lama utuh dan tidak
  bisa hilang. Konsekuensinya API pesanan masih mengembalikan `customerId` mentah
  dari baris DB (tipe frontend tidak memakainya lagi).
- **KPI "Pelanggan baru" di laporan ikut dihapus** karena satu-satunya sumbernya
  fitur pelanggan; dibiarkan akan selalu 0 dan membingungkan.
- **Pencarian pesanan** kini hanya mencocokkan nomor pesanan (sebelumnya juga
  nama pelanggan).
- **`customerId` kiriman klien lama diabaikan** (skema Zod tanpa field itu;
  key asing dibuang, bukan error) — klien lama tidak rusak.
- **Fixture test `budi` + 2 test pelanggan dihapus**; sisa test tidak memakainya.
- `docs/ERD.md` tidak diubah karena tabel `customers` memang masih ada di DB.

## Scope

### Backend

- Hapus `apps/api/src/modules/customers/` (router `GET/POST /customers`,
  `GET/PATCH /customers/:id`, `GET /customers/:id/orders`).
- `app.ts`: lepas mount `/api/v1/customers`.
- `modules/orders/orders.routes.ts`: buang `customerId` dari input, cek
  keberadaan pelanggan, penyimpanan, pencarian, dan `include` di list/detail.
- `modules/reports/reports.routes.ts`: buang `customer` dari pesanan terbaru
  dashboard dan KPI `newCustomers` dari ringkasan.
- `docs/openapi.ts`, `openapi-routes.ts`, `openapi-schemas.ts`: buang tag,
  path, dan skema pelanggan; buang `customerId` dari skema Order/OrderInput.
- `tests/auth-roles.test.ts`, `tests/helpers.ts`: hapus 2 test pelanggan + fixture.

### Frontend

- Hapus `apps/web/src/features/customers/` (daftar, detail, form).
- `App.tsx`: hapus route `/customers` dan `/customers/:id`.
- `Nav.tsx`: hapus menu "Pelanggan" + ikon `Users`.
- `types/index.ts`: hapus tipe `Customer`, `Order.customerId`, `Order.customer`,
  `ReportSummary.newCustomers`.
- `OrderCreatePage.tsx`: hapus pilihan pelanggan, state, dan query-nya.
- `OrderListPage.tsx`: hapus kolom "Pelanggan"; placeholder cari → "Cari no. pesanan...".
- `OrderDetailPage.tsx`: hapus kartu "Pelanggan".
- `DashboardPage.tsx`: pesanan terbaru hanya menampilkan nomor + tanggal.
- `ReportPage.tsx`: hapus kartu "Pelanggan baru".

### Dokumentasi

- `README.md`: fitur, tabel endpoint, dan catatan otorisasi tanpa pelanggan.
- `plan/backlog.md`: ISSUE-022 dicatat; catatan lama soal nav pelanggan diberi keterangan.

## Acceptance Criteria

- [x] Menu "Pelanggan" tidak ada lagi; URL `/customers` dialihkan ke dashboard
- [x] Form pesanan baru tanpa pilihan pelanggan dan pesanan tetap bisa dibuat
- [x] Daftar & detail pesanan tanpa kolom/kartu pelanggan
- [x] Dashboard (pesanan terbaru) dan laporan tanpa data/KPI pelanggan
- [x] `GET /api/v1/customers` → 404; ringkasan laporan tanpa `newCustomers`
- [x] Typecheck API + web hijau, test API lulus, build web hijau
- [x] Tidak ada error konsol saat uji browser

## Verifikasi (3 Nov 2026, lokal, browser + API + build)

| AC | Cara uji | Hasil |
|---|---|---|
| Menu & route | Login owner, baca `nav a`, buka `/customers` | Lulus. Menu: Dashboard, Produk, Kategori, Pesanan, Laporan, Pengguna. `/customers` → `/dashboard`. |
| Form pesanan | Buka `/orders/new`, tambah 1 produk, "Simpan pesanan" | Lulus. Tidak ada field pelanggan; pesanan `ORD-20261103-VDDNQY` dibuat, toast sukses, diarahkan ke detail. |
| Daftar pesanan | Buka `/orders` | Lulus. Header: No. pesanan, Tanggal, Item, Total, Status, Aksi. |
| Detail pesanan | Buka detail pesanan lama | Lulus. Hanya item, riwayat status, pembayaran — kartu "Pelanggan" hilang. |
| Dashboard | Baca "Pesanan terbaru" | Lulus. Hanya nomor pesanan + tanggal (tanpa "Tanpa pelanggan"). |
| Laporan | Buka `/reports` | Lulus. Hanya "Total penjualan selesai"; kartu "Pelanggan baru" hilang. |
| API | `GET /customers`, `GET /reports/summary`, `POST /orders` + `customerId` | Lulus. `/customers` → 404; summary: `from, to, totalSalesCompleted, ordersByStatus`; `customerId` diabaikan (error lanjut ke validasi produk). |
| Test | `npm test` di `apps/api` | Lulus. 62/62 (2 test pelanggan dihapus). |
| Typecheck/build | `tsc --noEmit` (api), `tsc -b --noEmit` (web), `npm run build` (web) | Lulus. |
| Konsol | `browser.console` di detail/daftar/laporan | Bersih (0 error). |

## Perubahan kode

- `apps/api/src/app.ts`
- `apps/api/src/modules/customers/customers.routes.ts` (dihapus)
- `apps/api/src/modules/orders/orders.routes.ts`
- `apps/api/src/modules/reports/reports.routes.ts`
- `apps/api/src/docs/openapi.ts`, `docs/openapi-routes.ts`, `docs/openapi-schemas.ts`
- `apps/api/tests/auth-roles.test.ts`, `tests/helpers.ts`
- `apps/web/src/App.tsx`, `components/layout/Nav.tsx`, `types/index.ts`
- `apps/web/src/features/customers/*` (dihapus)
- `apps/web/src/features/orders/OrderCreatePage.tsx`, `OrderListPage.tsx`, `OrderDetailPage.tsx`
- `apps/web/src/features/dashboard/DashboardPage.tsx`
- `apps/web/src/features/reports/ReportPage.tsx`
- `README.md`, `plan/backlog.md`

## Catatan / sisa

- Tabel `Customer` + kolom `orders.customer_id` masih ada di DB produksi & schema
  Prisma (sesuai pilihan "hapus kodenya saja"). Data pelanggan lama tetap utuh
  tapi tidak dipakai/ditampilkan. Bila nanti ingin bersih total, perlu migrasi
  destruktif (drop tabel/kolom) — menunggu keputusan pemilik.
- `docs/ERD.md` masih menggambarkan tabel `customers` — sesuai kondisi DB saat ini.
- Fitur pelanggan di masa depan (bila dihidupkan lagi) perlu membangun ulang
  router + halaman; model DB-nya masih siap.

## Refs

- Permintaan pemilik 3 Nov 2026 (sesi ini).
- `plan/backlog.md` baris temuan lama soal nav pelanggan (diberi catatan usang).
