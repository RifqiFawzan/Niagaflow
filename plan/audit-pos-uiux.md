# Audit UI/UX — NiagaFlow

Sumber: `plan/POS_UI_UX_Guideline.md`. Dijalankan mengikuti `workflow.md` (proyek eksisting):
audit → tinjau pendekatan → backlog → issues → loop.

Metode: cek 4 halaman (dashboard, produk, pesanan, laporan) lewat `playwright-cli` + baca kode.
Cocokkan dengan checklist §3 dan kriteria penerimaan §17.

---

## 1. Ringkasan status

Aplikasi sudah rapi dan konsisten untuk alur **owner** (dashboard, produk, pesanan, laporan).
Sebagian besar checklist §3 terpenuhi.

Namun pedoman ini dirancang untuk **sistem POS dengan 4 peran dan halaman kasir**.
Aplikasi sekarang hanya punya **2 peran (owner, staff)**; alur kasir (metode bayar, uang
diterima, kembalian) baru ditambahkan di ISSUE-018 lewat `/orders/new`.
Karena itu sebagian poin pedoman yang tersisa bukan "perbaikan UI", melainkan **fitur yang
belum ada** (riwayat stok, peran 4 jenis, tema). Perbedaan ini sengaja dicatat, bukan
ditutupi (lihat §4).

---

## 2. Yang sudah sesuai (tidak perlu diubah)

| Poin pedoman | Status | Bukti |
|---|---|---|
| §3.1 Owner lihat penjualan cepat | ✅ | Dashboard halaman pertama, KPI di atas |
| §3.2 Filter periode mudah ditemukan | ✅ | Laporan punya filter tanggal; Dashboard punya toggle 7/30 hari |
| §3.3 Grafik ada judul, periode, satuan, tooltip | ✅ | `SalesTrendChart`: judul, footer periode, sumbu rupiah, tooltip per hari |
| §3.6 Produk mudah dicari & difilter | ✅ | Cari nama/SKU, filter kategori & arsip, label status "Aman/Menipis/Habis" (ISSUE-017) |
| §3.7 Form ada label & pesan validasi | ✅ | Zod di backend + validasi form (ISSUE-006) |
| §3.8 Ada state loading/kosong/sukses/gagal | ✅ | `states.tsx` (ISSUE-004) |
| §3.9 Layout nyaman desktop & tablet | ✅ | Nav desktop + drawer mobile (ISSUE-014) |
| §3.10 Hak akses dicek backend | ✅ | `requireRole` (ISSUE-002) |
| §3.11 Angka dashboard = data sumber | ✅ | Total Rp 55.000 cocok dengan KPI & grafik |
| §5 KPI cards + Aturan KPI | ✅ | 4 kartu (Produk aktif, Pesanan hari ini, Total penjualan, Stok menipis) — masing-masing punya hint periode/metrik. Contoh pedoman (rata-rata nilai transaksi, laba kotor) tidak dipenuhi: laba butuh HPP yang tidak ada di skema & dilarang dikarang; sifatnya saran ("urutan yang disarankan"). |
| §7 Produk: cari, filter status, kolom tabel | ✅ | Nama, Kategori, Harga, Stok, Status; tombol Tambah/Ubah/Arsipkan (hapus lunak, sesuai "nonaktifkan" di pedoman §9) |
| §8 Pesanan: cari, filter status, filter tanggal, badge status | ✅ | Sudah ada semua + "Pesanan baru" |
| §9 Laporan: filter tanggal, KPI, pesanan per status, produk terlaris, ekspor CSV | ✅ | Semua ada; penjualan per kategori ditambahkan di ISSUE-016 |
| §8.1 Konfirmasi hapus transaksi | ✅ | Dialog konfirmasi (ISSUE-006) |
| §15.8 Keamanan password | ✅ | Tidak ada password di URL/log (ISSUE-002) |

---

## 3. Temuan berperingkat

### P0 — menghalangi transaksi (belum ada fitur)

1. **Belum ada halaman POS/kasir.** Pedoman §4, §5.2, §10.6–§10.9, §11 mendeskripsikan
   kasir 2 panel (kiri cari produk + keranjang, kanan ringkasan tetap).
   **Selesai: ISSUE-018** — koreksi fakta: `/orders/new` ternyata sudah berstruktur 2 panel
   sesuai §8 (kiri: cari produk + keranjang; kanan: ringkasan + tombol bayar), jadi tidak
   perlu halaman POS terpisah. ISSUE-018 menambahkan langkah pembayaran (metode bayar,
   uang diterima, kembalian) di panel kanan.

2. **Metode pembayaran belum dicatat.** Tidak ada kolom `paymentMethod` (tunai/QRIS/card)
   di model pesanan. Pedoman §4, §8.2, §9, §10.3, §10.4, §17.2 mensyaratkannya.
   **Selesai: ISSUE-018** — kolom `paymentMethod` (TUNAI/QRIS/TRANSFER) + `amountPaid`
   ditambahkan via migrasi DB; input di halaman buat pesanan; tampil di detail pesanan.

3. **Diskon produk & input kasir belum ada.** Pedoman §4.2, §10.10–§10.12 (diskon produk /
   total, nominal / persen, input angka +/−).
   **Selesai sebagian (ISSUE-018):** diskon total kini bisa nominal (Rp) atau persen (%)
   dengan input angka, plus metode bayar + uang diterima/kembalian (§10.10–§10.12).
   *Belum:* diskon per item / harga coret produk — butuh kolom diskon di produk &
   OrderItem; keputusan lingkup, belum dikerjakan.

### P1 — owner sulit ambil keputusan / data belum lengkap

4. **Belum ada "Penjualan per kategori"** (donut, §9.5). Data kategori ada di produk,
   jadi bisa dibuat endpoint baru + gabung ke OrderItem. **Selesai: ISSUE-016.**

5. **Produk terlaris masih tabel, bukan grafik batang horizontal** (§6.2). Data sudah ada
   (`/reports/top-products`), tinggal ditampilkan sebagai `BarChart` yang diurutkan.
   **Selesai: ISSUE-016.**

6. **Riwayat pergerakan stok belum ada** (§15.5, §15.6, audit P1). Tabel stok hanya berubah
   saat pesanan dibuat/dibatalkan. Belum ada form "Stok masuk" / "Stok keluar" + riwayat.
   **Selesai: ISSUE-019.**

7. **Kartu KPI dashboard belum satu periode** (§6.3). KPI memakai "hari ini" + "semua waktu",
   sedangkan grafik memakai 7/30 hari. Pedoman minta satu filter periode untuk semua.
   **Selesai sebagian (ISSUE-016):** ketiga grafik kini berbagi satu sakelar periode —
   syarat §6.4 ("semua **grafik** dashboard mengikuti filter periode yang sama") terpenuhi.
   Kartu KPI sengaja tetap "hari ini"/"semua waktu" dengan hint periode eksplisit; pedoman
   §5 hanya "idealnya" menampilkan periode terpilih, dan mengikatkan KPI ke filter 7/30 hari
   mengubah arti kartu untuk owner **dan** staf → keputusan produk, bukan perbaikan teknis.

8. **Peran belum 4 jenis** (§10.14 matriks akses). Sekarang owner + staff. Kasir, pengelola
   stok, admin belum ada sebagai peran terpisah.
   **Selesai: ISSUE-020** — peran `admin`, `kasir`, `stock_manager` bertambah (staf lama
   dipertahankan), matriks izin di backend, halaman kelola pengguna untuk owner & admin.

### P2 — efisiensi / polesan kecil

9. **Detail pesanan belum tampilkan metode bayar** (§8.2).
   **Selesai: ISSUE-018** — kartu "Pembayaran" di detail: metode, uang diterima, kembalian.
10. **Pencarian global belum ada** (§10.6, audit P1).
11. **Label stok**: pedoman §9 minta status "Aman"/"Menipis"/"Habis"; aplikasi memakai
    "Aktif"/"Stok menipis" tanpa beda untuk stok 0. **Selesai: ISSUE-017** — kini "Aman",
    "Menipis (sisa X)", "Habis" (stok 0), "Diarsipkan".
12. **Tabel produk belum bisa diurutkan** (nama, harga, stok) — opsional di pedoman.
    **Koreksi:** pengurutan sudah ada lewat dropdown "Urutkan", tapi satu arah per kolom.
    **Selesai: ISSUE-017** — nama/harga/stok kini tersedia dua arah.
13. **Desain sistem beda dari pedoman**: primer `#2563EB` biru + font Inter (§10.1–§10.2);
    aplikasi memakai primer slate gelap + font bawaan. Bisa diubah, tapi ini seluruh tema.
    **Selesai: ISSUE-021** — primer kini `#2563EB` (token ring & sidebar ikut) dan font
    Inter self-hosted via `@fontsource-variable/inter`; screenshot README diambil ulang.

### P3 — rendah / opsional

14. Ekspor PDF belum ada (§8.3, §15.4) — CSV sudah ada; PDF opsional.
15. Notifikasi / inbox stok menipis belum ada (§15.8).
16. Halaman pengaturan (profil, ganti password, kelola pengguna) belum ada (§12).
    **Sebagian selesai: ISSUE-020** — kelola pengguna (buat akun + ubah peran) ada;
    profil usaha & ganti password sendiri belum.

---

## 4. Konflik lingkup (perlu keputusan, bukan ditutupi)

Pedoman mengasumsikan POS dengan 4 peran + halaman kasir + pembayaran + inventaris.
Aplikasi sekarang adalah sistem pesanan/penjualan dengan 2 peran dan tanpa POS.

- Menjalankan **seluruh** pedoman = membangun fitur baru besar (model DB baru:
  `paymentMethod`, riwayat stok; halaman baru: POS, inventoris, pengaturan; peran baru).
- Sebagian poin (P0 no. 1–3, P1 no. 6 & 8) **tidak bisa** dikerjakan tanpa keputusan Anda,
  karena menyentuh skema data dan jumlah peran.
- Polesan yang aman & bernilai tanpa mengubah lingkup: **P1 no. 4 & 5** (grafik kategori +
  grafik batang produk terlaris), **P1 no. 7** (samakan periode KPI), dan sebagian **P2**.

---

## 5. Saran langkah

Kerjakan bertahap, mulai dari yang aman dan bernilai:

- **Tahap A (aman, tanpa ubah skema):** no. 4, 5, 7 + beberapa P2 (label stok, urut tabel).
  **Selesai — ISSUE-016 (grafik + periode) dan ISSUE-017 (label stok + urut).**
- **Tahap B (butuh keputusan Anda):** no. 1–3 (halaman POS + metode bayar + diskon),
  no. 6 (riwayat stok), no. 8 (peran), no. 13 (ganti tema).
  **Selesai — ISSUE-018 (no. 1–3), ISSUE-019 (no. 6), ISSUE-020 (no. 8), ISSUE-021
  (no. 13). Seluruh paket Tahap B lengkap.**

Setelah Anda pilih tahap/lingkup, tiap item dipecah jadi issue (backlog → loop),
lalu dikerjakan satu per satu.
