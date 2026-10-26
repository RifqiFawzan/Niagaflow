# ISSUE-016 — Grafik produk terlaris + penjualan per kategori di dashboard

Status: done | Priority: P1 | Selesai: 26 Okt 2026

Sumber: `plan/POS_UI_UX_Guideline.md` §5.3–§5.5 (urutan grafik dashboard), §6.2 (batang horizontal untuk produk terlaris), §6.3 (semua grafik dashboard satu filter periode), §10.6 (donut untuk penjualan per kategori). Tahap A dari audit `plan/audit-pos-uiux.md` (aman, tanpa ubah skema DB).

## Goal

Dashboard owner menampilkan tiga grafik dengan **satu periode yang sama**: tren penjualan, produk terlaris (batang horizontal), dan penjualan per kategori (donut) — sesuai pedoman, tanpa mengubah skema database.

## Scope

- Backend: `GET /api/v1/reports/sales-by-category?from=&to=` (owner-only). Mengelompokkan item pesanan `completed` per nama kategori produk (join via `product.category`), produk tanpa kategori masuk `Tanpa kategori`, diurutkan revenue desc. Metrik disamakan dengan endpoint laporan lain (hanya `completed`, rentang hari lokal via `resolveRange`).
- OpenAPI: endpoint baru terdaftar di grup Laporan.
- Frontend:
  - `period.ts` (baru): `RANGES`, `buildRange`, `shortLabel`, `toIso` — periode dihitung sekali di induk.
  - `DashboardPage`: state `days` diangkat ke halaman; `from`/`to` yang sama di-pass ke ketiga grafik (§6.3).
  - `SalesTrendChart`: jadi komponen terkendali (props `days`/`onDaysChange`/`from`/`to`), sakelar 7/30 tetap di header kartu.
  - `TopProductsChart` (baru): BarChart `layout="vertical"` (batang horizontal), pendapatan di ujung kanan batang, data dari `/reports/top-products` yang sudah ada.
  - `CategoryDonutChart` (baru): PieChart donut (inner/outer radius), warna `--chart-1..5`, tooltip + legend memuat persentase.
  - Ketiganya hanya dirender untuk role owner; status loading/empty/error mengikuti `states.tsx`.
- Tipe: `SalesByCategory` di `apps/web/src/types/index.ts`.

## Acceptance Criteria

- [x] Endpoint `/reports/sales-by-category` mengembalikan agregat per kategori, hanya pesanan `completed`
- [x] Produk tanpa kategori dikelompokkan sebagai `Tanpa kategori`
- [x] Grafik produk terlaris berupa batang horizontal, urut dari pendapatan terbesar (§6.2)
- [x] Grafik donat menampilkan persentase kategori (§10.6)
- [x] Ketiga grafik memakai satu sakelar periode 7/30 hari yang sama (§6.3)
- [x] Hanya owner yang melihat ketiga grafik; staf tanpa error 403
- [x] `typecheck` web bersih, `build` web hijau, seluruh test API lulus

## Verifikasi (26 Okt 2026, lokal)

| AC | Cara uji | Hasil |
|---|---|---|
| Agregat per kategori, hanya `completed` | Hit endpoint sebagai owner; bandingkan totalnya dengan top-products | Lulus. `Makanan` Rp 45.000 (qty 3) + `Minuman` Rp 10.000 (qty 2) = Rp 55.000 = KPI "Total penjualan". Test unit ditambah (2 test: grouping + `Tanpa kategori`). |
| Tanpa kategori → `Tanpa kategori` | Test vitest mengosongkan `categoryId` lalu cek respons | Lulus (test kedua). |
| Batang horizontal + urut desc | Buka dashboard, periksa sumbu-Y nama produk & urutan batang | Lulus. Keripik Singkong (Rp 45.000) batang lebih panjang dari Teh Manis Jumbo (Rp 10.000). |
| Donut + persentase | Periksa `.recharts-pie-sector` + legend + tooltip | Lulus. Makanan/Minuman tampil di legend; tooltip memuat `Rp … (xx%)`. |
| Satu periode untuk ketiga grafik | Klik "7 hari" (semua kosong, pesanan selesai di 18 Okt di luar jendela), kembali "30 hari" | Lulus. Ketiga grafik serentak menampilkan EmptyState "Belum ada penjualan", lalu serentak kembali terisi — tanpa error. |
| Owner-only | Dashboard owner: ketiga grafik tampil | Lulus. Elemen `.recharts-area-curve`, `.recharts-bar-rectangle`, `.recharts-pie-sector` semua ada; tanpa error konsol (selain 401 `/auth/me` & 404 favicon yang memang benign). |
| Typecheck/build/test | `npm run typecheck -w apps/web`, `npm run build -w apps/web`, `npm run test -w apps/api` | Lulus. Typecheck bersih; build hijau (peringatan chunk >500 kB dari Recharts); **40 test lulus** (38 + 2 baru). |

## Perubahan kode

- `apps/api/src/modules/reports/reports.routes.ts`: endpoint `sales-by-category` (rangkum item per kategori di JS, karena Prisma tidak bisa groupBy lintas join).
- `apps/api/src/docs/openapi-routes.ts`: registrasi path `sales-by-category`.
- `apps/api/tests/orders-reports.test.ts`: 2 test baru + endpoint ditambahkan ke daftar uji 401.
- `apps/web/src/features/dashboard/period.ts`: modul periode bersama (baru).
- `apps/web/src/features/dashboard/TopProductsChart.tsx`: grafik batang horizontal (baru).
- `apps/web/src/features/dashboard/CategoryDonutChart.tsx`: grafik donat (baru).
- `apps/web/src/features/dashboard/SalesTrendChart.tsx`: jadi komponen terkendali (state diangkat ke induk).
- `apps/web/src/features/dashboard/DashboardPage.tsx`: state `days` + render ketiga grafik untuk owner.
- `apps/web/src/types/index.ts`: tipe `SalesByCategory`.

## Catatan / sisa

- Kartu KPI sengaja tetap "hari ini" + "semua waktu" — pedoman §5.1 memang mendefinisikan KPI sebagai angka hari ini; aturan §6.3 (satu periode) berlaku untuk **grafik**, dan itu sudah dipenuhi.
- Tahap A yang belum: label stok "Stok Rendah (sisa X)" (§7.2) dan pengurutan kolom tabel produk — dijadwalkan sebagai issue terpisah.

## Refs

- `plan/POS_UI_UX_Guideline.md` §5.3–5.5, §6.2, §6.3, §10.6
- `plan/audit-pos-uiux.md` (temuan P1 no. 4, 5, 7)
