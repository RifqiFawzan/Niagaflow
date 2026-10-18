# ISSUE-002 — Skema database Prisma + migrasi + seed demo

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 2

## Goal

Semua tabel plan §6 terdefinisi di Prisma, migrasi jalan, seed menghasilkan data demo (akun owner/staf, kategori, produk).

## Scope

- `schema.prisma`: users, categories, products, customers, orders, order_items, order_status_history (+ enum Role, OrderStatus)
- Mapping snake_case (`@@map`/`@map`), UUID, Decimal untuk uang, relasi sesuai ERD
- `prisma/seed.ts`: 1 owner + 1 staf + 2–3 kategori + beberapa produk (termasuk 1 produk stok menipis)

## Acceptance Criteria

- [x] `prisma migrate dev` sukses di PostgreSQL (Docker postgres:17-alpine, port 5433)
- [x] Relasi & constraint sesuai plan §6 (SKU unik, FK, enum)
- [x] Seed idempoten (aman dijalankan dua kali) dan mencetak akun demo

## Refs

- plan §6 (rancangan database)
