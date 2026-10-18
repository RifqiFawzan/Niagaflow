# ISSUE-007 — Buat pesanan (transaksi, stok, total di backend)

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 4

## Goal

`POST /orders` membuat pesanan valid: harga diambil dari DB, stok dikurangi dalam transaksi, snapshot tersimpan.

## Scope

- `POST /orders` (body: customerId?, items[{productId, quantity}], notes?)
- `GET /orders` (filter status/tanggal, pagination), `GET /orders/:id` (detail + item + riwayat)
- `order_number` generate unik dan mudah dibaca
- Entry awal `order_status_history` (old_status null → pending)

## Acceptance Criteria

- [x] Harga/total dihitung backend; body harga dari klien diabaikan (subtotal 35000 dari DB, diverifikasi)
- [x] Stok kurang → `409 INSUFFICIENT_STOCK`, rollback penuh (stok kue tetap 3 setelah percobaan)
- [x] Quantity minimal 1; produk arsip → `400 PRODUCT_ARCHIVED`; produk tidak ada → `400 PRODUCT_NOT_FOUND`
- [x] `subtotal`, `total` akurat; snapshot nama+harga tersimpan (items di detail)
- [x] Staf dan owner keduanya boleh membuat pesanan (staff create = 201)

Bonus terpasang: diskon opsional (validasi diskon ≤ subtotal), list `GET /orders` dengan filter status/tanggal/pencarian, `order_number` `ORD-YYYYMMDD-XXXX`.

## Refs

- plan §3.6, §6 (aturan integritas), §7 (contoh request)
