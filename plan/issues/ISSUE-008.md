# ISSUE-008 — Status pesanan, cancel + pengembalian stok, riwayat

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 4

## Goal

`PATCH /orders/:id/status` menerapkan transisi status yang sah, mencatat riwayat, dan mengembalikan stok saat cancel.

## Scope

- Aturan transisi: pending → processing → completed; pending/processing → cancelled; selesai → terminal (tidak bisa diubah)
- Cancel mengembalikan stok item dalam transaksi
- Riwayat setiap perubahan (changed_by, old/new, waktu)

## Acceptance Criteria

- [x] Transisi tidak sah → `400` dengan pesan jelas (`INVALID_TRANSITION`, diverifikasi: completed→cancelled, pending→completed)
- [x] Cancel mengembalikan stok persis sejumlah item; cancel dua kali ditolak (terminal → 400, stok 47→41→44 terverifikasi)
- [x] Riwayat lengkap dan bisa dilihat di detail pesanan (3 entry: ->pending, pending->processing, processing->completed)
- [x] Pesanan completed tidak bisa di-cancel; guard atomik `updateMany` berbasis status lama (409 `ORDER_CONFLICT` bila tabrakan)

Catatan: owner & staff sama-sama boleh ubah status (sesuai plan §2 peran staf).

## Refs

- plan §3.6, §6 (kebijakan stok), §11 (test aturan transisi)
