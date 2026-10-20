# ISSUE-012 — Halaman pesanan, dashboard, laporan

Status: done ✅ 20 Okt 2026 | Priority: P0 | Milestone: Minggu 6

## Goal

Alur operasional lengkap di UI: buat pesanan, lihat detail, ubah status, dan pantau dashboard + laporan.

## Scope

- `/orders` (filter status/tanggal), `/orders/new` (pemilih produk + qty, validasi stok), `/orders/:id` (detail + ubah status + riwayat)
- `/dashboard` (kartu ringkasan, pesanan terbaru, peringatan stok menipis)
- `/reports` (ringkasan rentang tanggal + produk terlaris)
- Konfirmasi dialog untuk batal pesanan

## Acceptance Criteria

- [x] Buat pesanan dari UI memakai endpoint backend (total ditampilkan dari respons backend)
- [x] Error stok tidak cukup muncul sebagai pesan jelas di form
- [x] Status badge konsisten (`pending/processing/completed/cancelled`)
- [x] Dashboard & laporan menampilkan data sesuai transaksi

## Bukti verifikasi (browser, 20 Okt 2026)

- `/orders`: 6 pesanan tampil dengan nomor, pelanggan, tanggal, jumlah item, total, badge status; paginasi benar.
- `/orders/new`: pemilih produk (hanya produk aktif) + filter kategori/search; qty naik/turun; tombol jadi "Maksimum" saat qty = stok; validasi klien (diskon > subtotal, qty > stok) memblokir submit; API `INSUFFICIENT_STOCK` (409) ditampilkan sebagai pesan Indonesia di form + toast.
- Buat pesanan nyata → `ORD-20261020-8EX54X`, total dari server (Rp 70.000), redirect ke detail, toast sukses.
- `/orders/:id`: item + rollup (subtotal/diskon/total), riwayat status, aksi sesuai transisi (`pending`→Diproses/Batalkan, `processing`→Selesai/Batalkan, `completed`/`cancelled` terminal).
- Batal pesanan lewat ConfirmDialog → stok kembali (1→3), badge "Dibatalkan", toast; `pending→processing→completed` terverifikasi dengan riwayat 3 entri.
- `/reports` (owner): rentang tanggal default 30 hari, total penjualan selesai, pelanggan baru, pesanan per status, produk terlaris (hanya pesanan selesai), stok menipis; filter tanggal mengubah data; Ekspor CSV (nama file + MIME + BOM benar).
- Gating role: staff → `/reports` API 403 + redirect ke `/dashboard`, nav tanpa "Laporan"; staff tetap bisa membuat pesanan.

## Catatan implementasi

- `PATCH /orders/:id/status` hanya mengembalikan `items` (tanpa `statusHistory`); klien melakukan merge status lalu invalidate query detail agar riwayat tetap sinkron.
- `PlaceholderPage` dihapus karena seluruh route placeholder sudah tergantikan.
- Dashboard: kartu "Pesanan terbaru" kini menautkan tiap baris ke `/orders/:id` + tombol "Semua pesanan"/"Pesanan baru".


## Refs

- plan §8 (halaman 9–12), §3.6–3.7
