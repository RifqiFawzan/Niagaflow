# ISSUE-005 — CRUD produk (SKU unik, search/filter/pagination, arsip)

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 3

## Goal

Produk dapat dikelola penuh lewat API dengan pencarian, filter kategori, pengurutan, dan pagination.

## Scope

- `GET /products` (query: `q`, `categoryId`, `sort`, `page`, `pageSize`, hanya `is_active=true` default)
- `GET /products/:id`, `POST /products`, `PATCH /products/:id`, `PATCH /products/:id/archive`
- Owner-only untuk tulis; staf boleh baca

## Acceptance Criteria

- [x] SKU duplikat → `409` (`SKU_DUPLICATE`, diverifikasi; SKU di-normalisasi uppercase)
- [x] Harga ≥ 0, stok ≥ 0, `low_stock_threshold` ≥ 0 (Zod, diverifikasi 400 utk harga negatif)
- [x] Arsip = set `is_active=false`, tidak muncul di daftar default (total 3 vs 4 dengan includeArchived)
- [x] Pagination mengembalikan total + halaman saat ini (page, pageSize, total, totalPages)

Terpenuhi di luar AC: pencarian `q` (nama/SKU), filter `categoryId`, sort `name|price|stock|createdAt` + asc/desc.

## Refs

- plan §3.3, §7 (endpoint produk)
