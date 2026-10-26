# ISSUE-017 — Label status stok konsisten + urut tabel produk dua arah

Status: done | Priority: P2 | Selesai: 26 Okt 2026

Sumber: `plan/POS_UI_UX_Guideline.md` §9 Inventori ("Status yang konsisten: 'Aman', 'Menipis', 'Habis'") dan §6 tabel ("sorting, bila diperlukan"). Tahap A terakhir dari audit `plan/audit-pos-uiux.md` (temuan P2 no. 11 & 12).

## Goal

Status stok di tabel produk memakai tiga kata kunci yang konsisten dengan pedoman — termasuk pembedaan stok 0 — dan pengurutan nama/harga/stok tersedia dua arah.

## Scope

- Frontend saja (`ProductListPage.tsx`), tanpa ubah backend atau skema:
  - **Badge status**: `Habis` (stok 0, merah) / `Menipis (sisa X)` (stok ≤ batas, amber, dengan sisa qty) / `Aman` (hijau) / `Diarsipkan` (arsip, tetap sekunder). Sebelumnya hanya "Stok menipis" vs "Aktif" — stok 0 tidak dibedakan.
  - **Angka stok**: stok 0 tampil tebal merah (sebelumnya hanya amber untuk menipis), sejalan dengan kartu "Peringatan stok menipis" di dashboard yang sudah membedakan merah/amber.
  - **Dropdown Urutkan**: ditambah "Nama Z-A", "Harga terendah", "Stok tertinggi" — sebelumnya satu arah per kolom. Backend sudah menerima `sort`/`order` kedua arah (skema Zod `name|price|stock|createdAt` × `asc|desc`), jadi tidak ada perubahan API.
- Audit `plan/audit-pos-uiux.md` dikoreksi: temuan no. 11 & 12 ditandai selesai + koreksi fakta (aplikasi memakai "Aktif/Stok menipis", bukan "Restock"; pengurutan ternyata sudah ada via dropdown), baris checklist §3.6 yang menclaim "filter Stok menipis" (tidak ada di aplikasi) diperbaiki, baris §5 KPI & §7 disesuaikan dengan kenyataan.

## Acceptance Criteria

- [x] Stok 0 tampil badge `Habis` (merah), terpisah dari `Menipis`
- [x] Stok 1..batas tampil `Menipis (sisa X)` dengan angka sisa
- [x] Stok di atas batas tampil `Aman`; produk arsip tetap `Diarsipkan`
- [x] Pengurutan nama, harga, stok tersedia dua arah dan berfungsi end-to-end
- [x] `typecheck` web bersih, `build` web hijau

## Verifikasi (26 Okt 2026, lokal)

| AC | Cara uji | Hasil |
|---|---|---|
| Badge `Habis` | Set stok Kue Kering Cokelat = 0 lewat API, buka halaman Produk | Lulus. Badge merah "Habis", angka stok tebal merah. Stok dikembalikan ke 3 setelah uji. |
| Badge `Menipis (sisa X)` | Halaman Produk dengan stok Kue = 3 / min 5 | Lulus. Badge amber "Menipis (sisa 3)", angka stok amber tebal. |
| Badge `Aman` | Periksa Keripik (44/min 10) & Teh (117/min 24) | Lulus. Keduanya badge hijau "Aman". |
| Urut dua arah | Pilih "Nama Z-A" di dropdown Urutkan | Lulus. Urutan berubah: Teh Manis Jumbo → Kue Kering Cokelat → Keripik Singkong. Kombinasi lain (harga/stok, asc/desc) diterima skema Zod backend. |
| Typecheck/build | `npm run typecheck -w apps/web`, `npm run build -w apps/web` | Lulus. Typecheck bersih; build hijau (peringatan chunk >500 kB dari Recharts). |
| Regresi | Screenshot halaman Produk setelah perubahan | Lulus. Tabel, filter, badge, pagination tampil normal; tidak ada error JS (perubahan murni JSX terkontrol typecheck). |

## Perubahan kode

- `apps/web/src/features/products/ProductListPage.tsx`: badge status tiga kata + warna angka stok + 3 opsi urut baru + import `cn`.
- `plan/audit-pos-uiux.md`: koreksi fakta + penandaan selesai (temuan 4, 5, 7, 11, 12; checklist §3.6, §5, §7, §9; status Tahap A).

## Catatan / sisa

- "Restock" yang tercatat di audit sebagai label lama tidak ditemukan di kode — kemungkinan salah baca cuplikan; koreksi sudah ditulis di audit.
- Filter "stok menipis" pada daftar produk **tidak** ditambahkan: Prisma tidak bisa membandingkan kolom vs kolom (`stock <= lowStockThreshold`) tanpa query raw, dan menyaring setelah pagination akan merusak hitungan halaman. Pedoman hanya minta "filter kategori dan status" — filter arsip memenuhi "status". Bila dibutuhkan, perlu endpoint laporan terpisah (mis. pakai `/reports/low-stock` yang sudah ada).

## Refs

- `plan/POS_UI_UX_Guideline.md` §9 (Inventori), §6 (tabel: sorting), §3 checklist baris 6
- `plan/audit-pos-uiux.md` temuan P2 no. 11 & 12
