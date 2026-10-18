# ISSUE-004 — CRUD kategori

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 3

## Goal

Kategori bisa dibuat, diubah, dihapus (jika belum dipakai produk), dan didaftar.

## Scope

- `GET/POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`
- Hanya role owner yang boleh tulis

## Acceptance Criteria

- [x] Hapus kategori yang dipakai produk → `409` dengan pesan jelas (`CATEGORY_IN_USE`, diverifikasi)
- [x] Validasi nama wajib diisi (Zod)
- [x] Staf → `403` untuk semua endpoint tulis (diverifikasi); staf boleh baca (200)

## Refs

- plan §3.4, §7 (endpoint kategori)
