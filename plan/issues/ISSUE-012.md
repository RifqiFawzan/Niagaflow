# ISSUE-012 — Halaman pesanan, dashboard, laporan

Status: todo | Priority: P0 | Milestone: Minggu 6

## Goal

Alur operasional lengkap di UI: buat pesanan, lihat detail, ubah status, dan pantau dashboard + laporan.

## Scope

- `/orders` (filter status/tanggal), `/orders/new` (pemilih produk + qty, validasi stok), `/orders/:id` (detail + ubah status + riwayat)
- `/dashboard` (kartu ringkasan, pesanan terbaru, peringatan stok menipis)
- `/reports` (ringkasan rentang tanggal + produk terlaris)
- Konfirmasi dialog untuk batal pesanan

## Acceptance Criteria

- [ ] Buat pesanan dari UI memakai endpoint backend (total ditampilkan dari respons backend)
- [ ] Error stok tidak cukup muncul sebagai pesan jelas di form
- [ ] Status badge konsisten (`pending/processing/completed/cancelled`)
- [ ] Dashboard & laporan menampilkan data sesuai transaksi

## Refs

- plan §8 (halaman 9–12), §3.6–3.7
