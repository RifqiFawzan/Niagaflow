# ISSUE-024 — Katalog menu Yessy Kitchen

**Tanggal:** 6 Nov 2026
**Status:** Selesai (lokal). Production menunggu persetujuan.

## Permintaan

Mengganti katalog aplikasi dengan menu Yessy Kitchen dari `menu_yessy.md`.

## Keputusan

- **Produk demo tidak dihapus, hanya dinonaktifkan** (`MKN-001`, `MKN-002`,
  `MNM-001`). Riwayat pesanan lama memakai produk ini, jadi menghapus akan
  merusak relasi `order_items`.
- **Seed dibuat idempoten** (upsert per `sku`): aman dijalankan berulang, baik di
  database kosong maupun yang sudah berisi. Stok produk yang sudah ada tidak
  direset saat seed ulang.
- **6 kategori** mengikuti menu: Food, Nasi Goreng & Mie, Drinks, Soft Drinks,
  Snacks, Seafood Specialities. Kategori lama "Makanan"/"Minuman" diganti nama
  menjadi "Food"/"Drinks" bila belum ada.
- **Harga** memakai rupiah penuh: `100K` → `100000`.
- **Varian** belum didukung sistem, jadi:
  - Ikan utuh per ukuran menjadi produk terpisah (Small s/d Double Extra Large).
  - Pilihan saus ditulis di deskripsi.
- **Lobster** belum ada harga di menu → harga `0`, `isActive: false`, deskripsi
  "tersedia sesuai permintaan, pesan H-1".
- **Stok awal** 100 per item aktif, ambang stok menipis 10. Restoran tidak
  menghitung porsi, tetapi pembuatan pesanan tetap divalidasi terhadap stok.

## Perubahan

- `apps/api/prisma/seed.ts`: data menu Yessy + upsert idempoten + nonaktifkan
  produk demo + penggantian nama kategori lama.
- `apps/web/src/features/orders/OrderCreatePage.tsx`: katalog pemilih pesanan
  mengambil `pageSize=100` (sebelumnya 50) agar seluruh menu tampil di tab
  "Semua".
- Tidak ada perubahan skema/migrasi.

## Verifikasi lokal

| Uji | Hasil |
|---|---|
| `npm run seed` (api) | 70 item siap |
| Isi DB | Food 17, Drinks 18 (termasuk 3 produk demo nonaktif), Nasi Goreng & Mie 6, Soft Drinks 4, Snacks 12, Seafood Specialities 16 |
| Produk demo | ketiganya `isActive: false` |
| Lobster | harga 0, stok 0, nonaktif |
| `npx tsc --noEmit` | Lulus |
| `npm test` | 62/62 lulus |
| API `/products` dengan sesi login | 200, item menu tampil dengan harga benar |
| `npm run build` (web) | Lulus |

## Production (selesai 6 Nov 2026)

Seed dijalankan ke Neon production dari `apps/api` dengan `NODE_ENV=production`.

Hasil verifikasi lewat API production:

- Total produk 73, **69 aktif**.
- Food 15, Drinks 17, Nasi Goreng & Mie 6, Soft Drinks 4, Snacks 12,
  Seafood Specialities 15 (Lobster nonaktif).
- Produk demo `MKN-001`, `MKN-002`, `MNM-001` semuanya nonaktif.
- Lobster: harga 0, stok 0, nonaktif.
- Endpoint pemilih pesanan (hanya aktif) mengembalikan 69 item.

Catatan: seed butuh env `DEMO_PASSWORD` (minimal 12 karakter) bila
`NODE_ENV=production`. Seed aman dijalankan ulang.
