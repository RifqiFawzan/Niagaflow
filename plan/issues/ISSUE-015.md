# ISSUE-015 — Grafik tren penjualan di dashboard

Status: done | Priority: P1 | Selesai: 26 Okt 2026

Sumber: `rancangan_audit_ux_dan_pengembangan_pos.md` (Fase 2, rekomendasi #2 — "grafik tren penjualan"). Bagian lain dari rancangan itu sengaja **tidak** dipenuhi: laba/margin butuh harga modal yang tidak ada di skema (rancangan sendiri melarang mengarang angka laba), dan konsep multi-cabang/pajak/retur/metode-bayar di luar data model sekarang. Jadi lingkupnya dibatasi pada satu item yang benar-benar hilang dan layak: deret penjualan harian.

## Goal

Owner bisa melihat tren penjualan (pesanan selesai) per hari langsung dari dashboard, tanpa membuka tab Laporan, dengan angka yang konsisten dengan kartu KPI dan ringkasan.

## Scope

- Backend: `GET /api/v1/reports/sales-trend?from=&to=` (owner-only). Mengelompokkan pesanan `completed` per hari lokal; hari kosong diisi nol supaya sumbu grafik utuh. Definisi metrik disamakan dengan KPI/summary (rancangan §13: angka tidak boleh saling bertentangan).
- OpenAPI: endpoint baru terdaftar di grup Laporan.
- Frontend: komponen `SalesTrendChart` (Recharts `AreaChart`) di halaman Dashboard, hanya untuk role owner. Sakelar rentang 7/30 hari, sumbu-Y rupiah, tooltip per hari, serta status loading/empty/error mengikuti pola `states.tsx` yang ada.

## Acceptance Criteria

- [x] Endpoint `/reports/sales-trend` mengembalikan deret harian dan hanya menghitung pesanan `completed`
- [x] Hari tanpa penjualan muncul sebagai nol (sumbu-x kontinu, tidak melompat)
- [x] Grafik tampil di dashboard owner; staf tidak melihat grafik (endpoint owner-only, tidak memunculkan kartu error 403)
- [x] Sakelar 7/30 hari memuat ulang data dengan rentang benar
- [x] Status loading/empty/error tampil mengikuti komponen `states.tsx`
- [x] `typecheck` web+api bersih, `build` web hijau, 38 test API tetap lulus

## Verifikasi (26 Okt 2026, lokal)

| AC | Cara uji | Hasil |
|---|---|---|
| Deret harian & hanya `completed` | Hit endpoint sebagai owner, cocokkan total deret dengan KPI "Total penjualan" | Lulus. Total deret = Rp 55.000 = nilai KPI (hanya pesanan selesai). |
| Hari kosong = nol | Periksa titik tanggal tanpa pesanan di respons | Lulus. Hari tanpa penjualan `sales=0`, sumbu penuh 30 hari. |
| Tampil untuk owner, tidak untuk staf | Login owner → grafik tampil; login staf → tidak ada grafik & tanpa error 403 | Lulus. Nol error konsol di kedua peran. |
| Sakelar 7/30 hari | Klik "7 hari", pantau request jaringan | Lulus. Request baru `from=…-10-20&to=…-10-26` (rentang 7 hari). |
| Loading/empty/error | Amati state saat muat; paksa error dengan mengubah respons | Lulus. Skeleton saat memuat; EmptyState "Belum ada penjualan"; ErrorState punya tombol coba-lagi. |
| Typecheck/build/test | `npm run typecheck`, `npm run build -w apps/web`, `npm run test -w apps/api` | Lulus. Typecheck bersih; build hijau (peringatan chunk >500 kB dari Recharts, tidak berbahaya); 38 test lulus. |

## Perubahan kode

- `apps/api/src/modules/reports/reports.routes.ts`: endpoint `sales-trend` + helper `localDateKey` (pengelompokan hari lokal, konsisten dengan `resolveRange`).
- `apps/api/src/docs/openapi-routes.ts`: registrasi path `sales-trend`.
- `apps/web/src/features/dashboard/SalesTrendChart.tsx`: komponen grafik (baru).
- `apps/web/src/features/dashboard/DashboardPage.tsx`: render grafik untuk owner + import `useAuth`.
- `apps/web/src/types/index.ts`: tipe `SalesTrend`/`SalesTrendPoint`.
- `apps/web/package.json`: tambah dependensi `recharts`.

## Refs

- `rancangan_audit_ux_dan_pengembangan_pos.md` §6 (dashboard owner), §10 (Recharts), §13 (konsistensi metrik)
