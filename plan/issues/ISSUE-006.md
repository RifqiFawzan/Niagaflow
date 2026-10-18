# ISSUE-006 — CRUD pelanggan + riwayat pesanan

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 4

## Goal

Pelanggan bisa dicatat (nama, telepon opsional, catatan) dan riwayat pesanannya bisa dilihat.

## Scope

- `GET/POST /customers`, `GET /customers/:id`, `PATCH /customers/:id`, `GET /customers/:id/orders`
- Owner kelola; staf boleh baca + butuh data saat buat pesanan

## Acceptance Criteria

- [x] Nama wajib; phone/notes opsional (Zod, diverifikasi 400 utk nama kosong)
- [x] Riwayat pesanan mengembalikan ringkasan item + total + status (items: productNameSnapshot, quantity, lineTotal)
- [x] Pelanggan tidak ditemukan → `404` (detail & riwayat)

## Refs

- plan §3.5, §7 (endpoint pelanggan)
