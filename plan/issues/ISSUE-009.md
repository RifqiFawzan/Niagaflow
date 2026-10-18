# ISSUE-009 — API dashboard & laporan

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 5

## Goal

Endpoint ringkasan dashboard dan laporan tersedia: total produk aktif, pesanan hari ini, total penjualan (status completed), pesanan terbaru, stok menipis, laporan rentang tanggal, produk terlaris.

## Scope

- `GET /reports/summary?from&to`, `GET /reports/top-products?from&to`, `GET /reports/low-stock`
- Data dashboard disusun dari ringkasan yang sama (boleh satu endpoint `/reports/dashboard`)

## Acceptance Criteria

- [x] Total penjualan hanya menghitung pesanan `completed` (45000 dari 1 order completed; pending/cancelled tak dihitung)
- [x] `low-stock` = `stock <= low_stock_threshold` dan produk aktif (Kue Kering 3≤5 tampil)
- [x] Rentang tanggal default 30 hari terakhir bila tidak diisi (diverifikasi dari/to eksplisit juga)
- [x] Semua endpoint terproteksi login (401 tanpa cookie)

Pembagian izin: `dashboard` & `low-stock` = semua login (operasional); `summary` & `top-products` = owner (sesuai plan §2 peran).

## Refs

- plan §3.7, §7 (endpoint laporan)
