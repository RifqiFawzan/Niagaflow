# ISSUE-011 — Halaman produk, kategori, pelanggan

Status: done (19 Okt 2026) | Priority: P0 | Milestone: Minggu 6

## Goal

Manajemen produk, kategori, dan pelanggan bisa dilakukan dari UI dengan search, filter, pagination, dan form tervalidasi.

## Scope

- `/products` (tabel + search + filter kategori + pagination), `/products/new`, `/products/:id/edit`
- `/categories` (list + tambah/ubah/hapus dengan konfirmasi)
- `/customers`, `/customers/:id` (profil + riwayat pesanan)
- Guard role: menu tulis hanya untuk owner

## Acceptance Criteria

- [x] CRUD berjalan end-to-end ke API
- [x] Form validasi frontend (required, angka non-negatif) + pesan error backend ditampilkan
- [x] Konfirmasi dialog untuk hapus/arsip
- [x] Empty state saat tidak ada data; loading state saat fetch

## Catatan implementasi

- UI memakai **Tailwind + shadcn/ui** penuh (setup manual: `components.json`, `cn()`, Radix). Komponen lama
  (`Toast`, `ConfirmDialog` custom, `states` custom) diganti versi shadcn: Sonner `Toaster`, Radix `Dialog`,
  `Skeleton` untuk loading, `Badge` untuk status.
- Komponen bersama: `PageHeader`, `Pagination`, `ConfirmDialog`, `StatusBadge`, `states` (Loading/InlineLoading/
  Empty/Error), helper `lib/format.ts` (rupiah & tanggal) dan `lib/use-debounced-value.ts`.
- Validasi produk: nama & SKU wajib, harga/stok/batas stok harus bilangan bulat ≥ 0. Duplikat SKU dicek inline
  (bandingkan katalog) **dan** pesan `SKU_DUPLICATE` dari backend tetap ditampilkan di field SKU.
- Kategori: tambah, ubah inline, hapus dengan konfirmasi; error `CATEGORY_IN_USE` (409) ditampilkan sebagai pesan
  ramah tanpa menghapus baris.
- Pelanggan: daftar + search + pagination; detail berisi profil (editable owner) dan riwayat pesanan beserta total
  belanja (tanpa pesanan dibatalkan). Staf melihat mode baca-saja (field disabled, tanpa tombol simpan).
- Guard role: `/products/new`, `/products/:id/edit`, `/categories` hanya owner; staf diarahkan ke `/dashboard`.
  Menu tulis & kolom "Aksi" di daftar produk disembunyikan untuk staf.

## Verifikasi

- `npm run typecheck -w apps/web` + `npm run build -w apps/web` bersih.
- Uji browser (owner): daftar produk (filter kategori, urutkan, arsip, search "kue" → 1 baris), buat produk
  (SKU otomatis uppercase, toast "Produk dibuat."), validasi kosong & angka negatif/desimal, deteksi SKU duplikat
  inline (blokir submit), arsip produk via Dialog konfirmasi, toggle "Tampilkan arsip" (UJI-011 & TES-001 badge
  "Diarsipkan", tanpa tombol arsip).
- Uji browser (owner): kategori tambah/ubah inline/hapus; `CATEGORY_IN_USE` untuk "Makanan", hapus berhasil untuk
  kategori kosong.
- Uji browser (owner): pelanggan daftar → detail (riwayat 1 pesanan, total Rp 10.000), ubah profil tersimpan.
- Uji browser (staf): nav hanya Dashboard/Produk/Pesanan, tanpa tombol "Produk baru"/kolom Aksi, `/products/new`
  redirect ke `/dashboard`, profil pelanggan disabled tanpa tombol simpan.

## Refs

- plan §8 (halaman 3–8), §3 (fitur MVP)
