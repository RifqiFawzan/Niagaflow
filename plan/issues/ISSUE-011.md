# ISSUE-011 — Halaman produk, kategori, pelanggan

Status: todo | Priority: P0 | Milestone: Minggu 6

## Goal

Manajemen produk, kategori, dan pelanggan bisa dilakukan dari UI dengan search, filter, pagination, dan form tervalidasi.

## Scope

- `/products` (tabel + search + filter kategori + pagination), `/products/new`, `/products/:id/edit`
- `/categories` (list + tambah/ubah/hapus dengan konfirmasi)
- `/customers`, `/customers/:id` (profil + riwayat pesanan)
- Guard role: menu tulis hanya untuk owner

## Acceptance Criteria

- [ ] CRUD berjalan end-to-end ke API
- [ ] Form validasi frontend (required, angka non-negatif) + pesan error backend ditampilkan
- [ ] Konfirmasi dialog untuk hapus/arsip
- [ ] Empty state saat tidak ada data; loading state saat fetch

## Refs

- plan §8 (halaman 3–8), §3 (fitur MVP)
