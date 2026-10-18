# ISSUE-013 — Test integration alur inti

Status: todo | Priority: P1 | Milestone: Minggu 7

## Goal

Test Vitest + Supertest melindungi alur inti: auth, izin role, SKU duplikat, pesanan & stok, cancel restock, laporan.

## Scope

- Setup Vitest + Supertest di `apps/api/tests`
- Skenario (plan §11): login sukses/gagal; staf ditolak kelola produk; SKU duplikat `409`; pesanan stok kurang `409` + rollback; pesanan sukses mengurangi stok; cancel mengembalikan stok; total penjualan hanya `completed`

## Acceptance Criteria

- [ ] `npm run test` hijau di CI/lokal
- [ ] Test memakai database test terpisah (bukan data demo)
- [ ] Tidak ada test yang bergantung urutan eksekusi

## Refs

- plan §11 (strategi testing), §13 (DoD: ada test logika penting)
