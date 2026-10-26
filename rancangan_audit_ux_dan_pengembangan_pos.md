# Rancangan Audit UX dan Pengembangan Sistem POS

**Frontend:** React.js  
**Backend:** Node.js + Express  
**Target:** POS general-purpose untuk berbagai jenis usaha  
**Prioritas:** Audit UX, lalu redesign dashboard dan implementasi bertahap

---

## 1. Latar Belakang

Sistem Point of Sale (POS) tidak cukup hanya mencatat transaksi. Sistem juga perlu membantu:

- **Kasir** menyelesaikan transaksi dengan cepat dan minim kesalahan.
- **Owner** memahami kondisi usaha melalui ringkasan, grafik, laporan, dan peringatan yang mudah dipahami.
- **Pengelola stok** mengetahui produk yang menipis, habis, atau perlu diisi ulang.

Prinsip UX utama:

> Angka menunjukkan nilai yang tepat, grafik membantu menemukan pola, dan indikator membantu pengguna menentukan tindakan.

Dokumen ini adalah rancangan awal. Audit final harus dilakukan setelah melihat UI, alur pengguna, struktur kode, dan skema database yang sudah ada.

## 2. Tujuan Produk

1. Membuat alur transaksi yang cepat, jelas, dan konsisten.
2. Memudahkan owner memahami performa bisnis tanpa membaca banyak tabel.
3. Menyajikan data penjualan, stok, dan laporan secara konsisten.
4. Memisahkan kebutuhan operasional kasir dari kebutuhan analitik owner.
5. Mengembangkan UI secara bertahap tanpa harus menulis ulang seluruh sistem.
6. Menyiapkan fondasi yang dapat dikonfigurasi untuk berbagai jenis usaha.

## 3. Prinsip Desain UX

### 3.1 Berorientasi pada pengguna

- Kasir berorientasi pada penyelesaian transaksi.
- Owner berorientasi pada pemantauan dan pengambilan keputusan.
- Pengelola stok berorientasi pada akurasi inventori.
- Administrator berorientasi pada konfigurasi, akun, dan hak akses.

### 3.2 Hierarki informasi

Urutkan informasi berdasarkan kepentingannya:

1. Informasi yang paling sering dibutuhkan.
2. Perubahan atau masalah yang memerlukan tindakan.
3. Tren dan analisis pendukung.
4. Detail transaksi yang dapat dibuka ketika diperlukan.

### 3.3 Prinsip antarmuka

- Gunakan bahasa bisnis yang sederhana.
- Tampilkan satuan, periode, dan konteks untuk setiap metrik.
- Hindari menampilkan terlalu banyak grafik pada satu halaman.
- Sediakan loading, empty, error, dan success state.
- Gunakan warna status secara konsisten dan jangan mengandalkan warna saja untuk menyampaikan makna.
- Pastikan layout responsif pada desktop dan tablet.
- Berikan konfirmasi untuk tindakan berisiko seperti menghapus data atau membatalkan transaksi.

## 4. Audit UX Awal

Audit berikut merupakan hipotesis awal yang perlu diperiksa pada aplikasi aktual, bukan kesimpulan bahwa semua masalah sudah ada.

| Area | Pertanyaan audit | Risiko jika bermasalah | Rekomendasi |
|---|---|---|---|
| Hierarki informasi | Apakah owner langsung melihat metrik utama? | Informasi penting sulit ditemukan | Letakkan KPI dan tindakan prioritas di bagian atas |
| Grafik | Apakah judul, satuan, periode, dan tooltip jelas? | Grafik sulit ditafsirkan | Berikan label dan konteks yang konsisten |
| Alur kasir | Berapa langkah untuk menyelesaikan transaksi? | Transaksi lambat atau rawan kesalahan | Kurangi langkah dan jaga keranjang tetap terlihat |
| Konsistensi UI | Apakah tombol, form, tabel, dan status seragam? | Pengguna harus mempelajari pola berulang | Gunakan design system dan komponen bersama |
| Akurasi data | Apakah diskon, retur, pajak, dan biaya didefinisikan jelas? | Laporan menyesatkan | Tetapkan definisi metrik pada backend |
| Aksesibilitas | Apakah teks terbaca dan kontrol dapat digunakan dengan keyboard? | Sebagian pengguna kesulitan | Periksa kontras, label, fokus, dan ukuran target |
| Responsivitas | Apakah halaman nyaman di desktop dan tablet? | Konten terpotong atau sulit digunakan | Uji breakpoint dan tabel yang lebar |
| Keadaan sistem | Apakah loading, kosong, dan error dijelaskan? | Pengguna mengira sistem rusak | Sediakan state dan pesan yang membantu |

### Checklist audit

- [ ] Screenshot dashboard saat ini telah ditinjau.
- [ ] Alur transaksi kasir telah dicoba dari awal hingga selesai.
- [ ] Alur tambah/edit produk dan penyesuaian stok telah diperiksa.
- [ ] Navigasi dan penamaan menu telah diperiksa.
- [ ] Tampilan desktop dan tablet telah diuji.
- [ ] Loading, empty, error, dan success state telah diperiksa.
- [ ] Hak akses owner, kasir, dan admin telah diverifikasi.
- [ ] Angka pada kartu, grafik, dan laporan telah dibandingkan dengan data transaksi.

## 5. Struktur Navigasi yang Direkomendasikan

Struktur awal yang dapat disesuaikan dengan kebutuhan aplikasi:

1. **Dashboard**
   - Ringkasan performa
   - Tren penjualan
   - Produk terlaris
   - Peringatan stok
   - Aktivitas terbaru

2. **Kasir / POS**
   - Transaksi baru
   - Keranjang
   - Pembayaran
   - Struk
   - Riwayat transaksi

3. **Produk & Inventori**
   - Daftar produk
   - Kategori
   - Varian produk jika diperlukan
   - Stok saat ini
   - Stok minimum
   - Riwayat pergerakan stok
   - Penyesuaian stok

4. **Analitik & Laporan**
   - Laporan penjualan
   - Produk terlaris dan kurang laku
   - Penjualan per kategori
   - Margin/laba kotor jika data biaya tersedia
   - Jam ramai jika data waktu transaksi memadai
   - Ekspor laporan

5. **Pelanggan** *(opsional)*
   - Daftar pelanggan
   - Riwayat pembelian
   - Informasi pelanggan yang relevan

6. **Pengguna**
   - Akun pengguna
   - Peran
   - Hak akses
   - Aktivitas yang perlu diaudit

7. **Pengaturan**
   - Profil usaha
   - Cabang jika diperlukan
   - Metode pembayaran
   - Pajak dan diskon
   - Format struk
   - Batas stok minimum

Untuk POS general-purpose, fitur seperti pelanggan, pajak, varian, dan multi-cabang sebaiknya dapat dikonfigurasi. Jangan memaksa usaha kecil menggunakan fitur yang tidak mereka perlukan.

## 6. Rancangan Dashboard Owner

### 6.1 Urutan konten

1. **Header**
   - Nama usaha
   - Cabang/lokasi jika tersedia
   - Filter periode
   - Profil pengguna

2. **KPI cards**
   - Penjualan bersih
   - Jumlah transaksi
   - Rata-rata nilai transaksi
   - Laba kotor, hanya jika data biaya/modal tersedia dan perhitungannya dapat dipertanggungjawabkan

3. **Grafik tren penjualan**
   - Line chart atau area chart
   - Pilihan periode: hari ini, 7 hari, 30 hari, atau rentang khusus
   - Pembanding periode sebelumnya bila tersedia
   - Tooltip berisi tanggal dan nilai

4. **Analisis produk**
   - Produk terlaris berdasarkan kuantitas
   - Produk dengan kontribusi omzet tertinggi
   - Produk kurang laku jika periode dan definisinya jelas

5. **Peringatan dan tindakan**
   - Stok di bawah batas minimum
   - Produk habis
   - Transaksi yang perlu ditinjau
   - Tautan langsung ke halaman untuk menyelesaikan masalah

6. **Aktivitas terbaru**
   - Nomor transaksi
   - Waktu
   - Kasir
   - Total
   - Status
   - Akses ke detail transaksi

### 6.2 Pemilihan visualisasi

| Informasi | Visualisasi | Alasan |
|---|---|---|
| Penjualan dari waktu ke waktu | Line chart / area chart | Menemukan tren naik-turun |
| Perbandingan produk | Horizontal bar chart | Membandingkan produk dengan mudah |
| Kontribusi kategori | Donut chart atau bar chart | Melihat komposisi penjualan |
| Pencapaian target | Progress bar | Menunjukkan progres menuju target |
| Jam ramai | Bar chart atau heatmap | Menemukan waktu sibuk |
| Stok menipis | Alert dan tabel prioritas | Memudahkan tindakan restock |
| Laba dan margin | KPI + grafik tren | Memantau profitabilitas |

Tidak semua data harus menjadi grafik. Tabel lebih tepat untuk informasi rinci, dan alert lebih tepat untuk masalah yang membutuhkan tindakan.

### 6.3 Definisi metrik

Sebelum membuat grafik, tetapkan definisi bisnis secara konsisten:

- **Omzet kotor:** definisikan apakah dihitung sebelum diskon dan sebelum pajak.
- **Penjualan bersih:** tentukan perlakuan diskon, pembatalan, dan retur.
- **Jumlah transaksi:** tentukan status transaksi yang dihitung.
- **Rata-rata nilai transaksi:** penjualan sesuai definisi dibagi jumlah transaksi yang memenuhi syarat.
- **Laba kotor:** penjualan bersih dikurangi harga pokok barang yang terjual, sesuai kebijakan akuntansi aplikasi.
- **Stok menipis:** stok saat ini berada di bawah batas minimum yang dikonfigurasi.

Jangan menyamakan omzet dengan keuntungan. Jika data harga modal atau biaya belum tersedia, tampilkan omzet dan jangan mengarang nilai laba.

## 7. UX Halaman Kasir

Halaman kasir harus dioptimalkan untuk kecepatan dan pencegahan kesalahan.

### Layout yang disarankan

- Area utama: pencarian produk, kategori, dan daftar/grid produk.
- Panel samping: keranjang yang tetap terlihat.
- Bagian bawah/area tindakan: subtotal, diskon, total, dan tombol pembayaran.
- Modal pembayaran: metode pembayaran, jumlah diterima, kembalian, dan konfirmasi.
- Setelah transaksi: status berhasil dan opsi cetak/unduh/kirim struk sesuai kemampuan aplikasi.

### Hal yang perlu diperiksa

- Pencarian produk mudah ditemukan.
- Produk dapat ditambahkan dengan klik atau barcode jika didukung.
- Jumlah barang dapat diubah tanpa menghapus item.
- Total diperbarui secara konsisten.
- Validasi mencegah stok negatif jika aturan bisnis tidak mengizinkannya.
- Tombol bayar jelas dan tidak mudah tertekan secara tidak sengaja.
- Klik berulang tidak membuat transaksi ganda.
- Kegagalan pembayaran tidak menghilangkan isi keranjang tanpa pemberitahuan.
- Pembatalan dan retur memiliki alur serta hak akses yang jelas.

## 8. Design System

### 8.1 Palet warna awal

| Token | Warna | Penggunaan |
|---|---|---|
| Background | `#F8FAFC` | Latar halaman |
| Surface | `#FFFFFF` | Kartu dan panel |
| Primary | `#2563EB` | Tombol utama dan fokus |
| Success | `#16A34A` | Status berhasil |
| Warning | `#D97706` | Peringatan |
| Danger | `#DC2626` | Kesalahan dan tindakan berisiko |
| Text primary | `#0F172A` | Teks utama |
| Text secondary | `#64748B` | Keterangan dan metadata |
| Border | `#E2E8F0` | Batas komponen |

Warna ini merupakan titik awal; uji kontras dan sesuaikan dengan identitas visual produk.

### 8.2 Aturan komponen

- Gunakan skala jarak berbasis kelipatan 4 atau 8 px.
- Radius kartu sekitar 10–14 px secara konsisten.
- Standarkan ukuran dan varian tombol.
- Form memiliki label, petunjuk, dan pesan validasi.
- Status tidak dibedakan berdasarkan warna saja; sertakan teks atau ikon.
- Tabel menyediakan loading, empty, error, dan pagination jika dibutuhkan.
- Grafik mempunyai judul, satuan, periode, tooltip, dan fallback ketika data kosong.
- Hindari terlalu banyak bayangan, warna aksen, dan dekorasi.

## 9. Struktur Folder React yang Disarankan

Struktur ini merupakan referensi. Sesuaikan dengan pola proyek yang sudah ada agar tidak perlu memindahkan seluruh kode tanpa alasan.

```text
src/
├── app/
│   ├── App.jsx
│   └── router.jsx
├── components/
│   ├── layout/
│   │   ├── AppSidebar.jsx
│   │   ├── AppHeader.jsx
│   │   └── PageContainer.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Select.jsx
│   │   ├── DataTable.jsx
│   │   ├── EmptyState.jsx
│   │   ├── LoadingState.jsx
│   │   └── ErrorState.jsx
│   └── dashboard/
│       ├── KpiCard.jsx
│       ├── SalesTrendChart.jsx
│       ├── TopProductsChart.jsx
│       └── InventoryAlerts.jsx
├── features/
│   ├── sales/
│   ├── products/
│   ├── inventory/
│   ├── reports/
│   ├── customers/
│   └── users/
├── hooks/
│   └── useDashboard.js
├── services/
│   └── api.js
├── utils/
│   ├── currency.js
│   └── date.js
└── styles/
    └── globals.css
```

### Rekomendasi pembagian tanggung jawab

- `components/ui`: komponen presentasi yang dapat digunakan ulang.
- `components/dashboard`: visualisasi dan komponen khusus dashboard.
- `features`: alur dan komponen berdasarkan domain fitur.
- `services`: komunikasi HTTP dengan backend.
- `hooks`: pengelolaan state dan pengambilan data yang dapat digunakan ulang.
- `utils`: helper format mata uang, tanggal, dan fungsi murni.

## 10. Implementasi Grafik dengan Recharts

### 10.1 Instalasi

```bash
npm install recharts
```

### 10.2 Komponen `SalesTrendChart.jsx`

Contoh berikut mengasumsikan Tailwind CSS sudah terpasang. Jika proyek menggunakan CSS biasa, sesuaikan kelas styling-nya.

```jsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function SalesTrendChart({ data = [] }) {
  return (
    <section className="rounded-xl border bg-white p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Tren Penjualan</h2>
        <p className="text-sm text-gray-500">
          Pantau perubahan penjualan sesuai periode yang dipilih.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-500">
          Belum ada data penjualan pada periode ini.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis
                width={65}
                tickFormatter={(value) =>
                  value >= 1_000_000
                    ? `${(value / 1_000_000).toFixed(1)} jt`
                    : value >= 1_000
                    ? `${Math.round(value / 1_000)} rb`
                    : String(value)
                }
              />
              <Tooltip
                formatter={(value) => rupiah(value)}
                labelFormatter={(label) => `Periode: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="sales"
                name="Penjualan"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
```

### 10.3 Bentuk data yang diharapkan

```json
[
  { "label": "20 Okt", "sales": 850000 },
  { "label": "21 Okt", "sales": 1120000 },
  { "label": "22 Okt", "sales": 970000 },
  { "label": "23 Okt", "sales": 1450000 }
]
```

Data tersebut hanya contoh. Dalam aplikasi nyata, angka harus berasal dari agregasi backend, bukan data acak di frontend.

## 11. API Backend dengan Node.js dan Express

### 11.1 Endpoint yang disarankan

| Method | Endpoint | Tujuan |
|---|---|---|
| `GET` | `/api/dashboard/summary` | KPI untuk periode tertentu |
| `GET` | `/api/dashboard/sales-trend` | Data grafik penjualan |
| `GET` | `/api/dashboard/top-products` | Produk terlaris |
| `GET` | `/api/dashboard/category-sales` | Kontribusi kategori |
| `GET` | `/api/dashboard/stock-alerts` | Stok di bawah batas minimum |
| `GET` | `/api/reports/sales` | Laporan penjualan dengan filter |
| `GET` | `/api/sales` | Daftar transaksi |
| `GET` | `/api/products` | Daftar produk |

Gunakan format filter tanggal yang konsisten, misalnya:

```text
GET /api/dashboard/sales-trend?from=2026-10-01&to=2026-10-26
```

Tetapkan zona waktu usaha dan gunakan rentang tanggal secara konsisten, termasuk untuk transaksi di sekitar tengah malam.

### 11.2 Contoh route Express

Contoh ini mengasumsikan middleware autentikasi sudah mengisi `req.user` dan fungsi repository akan dibuat sesuai database aplikasi.

```javascript
import { Router } from "express";

const router = Router();

router.get("/sales-trend", async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const isValidDate = (value) =>
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({
        message: "Tanggal harus berformat YYYY-MM-DD.",
      });
    }

    if (from > to) {
      return res.status(400).json({
        message: "Tanggal mulai tidak boleh setelah tanggal akhir.",
      });
    }

    // Implementasikan berdasarkan database aplikasi.
    // businessId harus berasal dari sesi pengguna yang terautentikasi.
    const data = await getSalesTrend({
      from,
      to,
      businessId: req.user.businessId,
    });

    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
```

`getSalesTrend` adalah placeholder dan perlu diimplementasikan. Validasi tanggal di atas merupakan pemeriksaan dasar; untuk produksi, validasi tanggal kalender, rentang maksimum, timezone, serta akses data usaha/cabang juga harus dilakukan.

### 11.3 Ketentuan backend

- Semua query database harus menggunakan parameter yang aman.
- Jangan mempercayai `businessId`, `branchId`, atau peran dari input bebas pengguna.
- Terapkan autentikasi dan otorisasi pada setiap endpoint yang relevan.
- Batasi rentang tanggal dan jumlah data yang dapat diminta.
- Gunakan agregasi database untuk laporan yang besar.
- Tangani transaksi yang dibatalkan, diretur, atau belum selesai secara konsisten.
- Gunakan pagination untuk daftar transaksi yang besar.
- Hindari mengirim data pribadi yang tidak diperlukan ke frontend.

## 12. Integrasi Frontend dan Backend

Contoh alur pengambilan data:

1. Owner membuka dashboard.
2. React membaca periode filter.
3. Frontend memanggil endpoint dashboard.
4. Express memvalidasi filter dan hak akses.
5. Backend menghitung ringkasan dari database.
6. React menampilkan KPI dan grafik.
7. Jika gagal, UI menampilkan pesan dan opsi untuk mencoba kembali.

Contoh API client sederhana:

```javascript
// src/services/api.js

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export async function getSalesTrend({ from, to, signal }) {
  const params = new URLSearchParams({ from, to });

  const response = await fetch(
    `${API_BASE_URL}/dashboard/sales-trend?${params}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
      signal,
    }
  );

  if (!response.ok) {
    throw new Error("Gagal memuat data tren penjualan.");
  }

  const result = await response.json();
  return result.data;
}
```

Catatan:

- Sesuaikan `API_BASE_URL` dengan alamat backend.
- Contoh `credentials: "include"` sesuai untuk autentikasi berbasis cookie jika backend dikonfigurasi dengan benar.
- Jika menggunakan bearer token, tambahkan token melalui mekanisme autentikasi yang aman.
- Jangan menyimpan secret backend di variabel environment frontend; variabel `VITE_*` dapat terlihat oleh pengguna.
- Tambahkan penanganan loading, error, pembatalan request, dan perubahan filter.

## 13. Aturan Konsistensi Data

Dashboard akan menyesatkan jika metrik dihitung berbeda di setiap halaman.

Sebelum implementasi, dokumentasikan:

| Metrik | Definisi yang perlu diputuskan |
|---|---|
| Omzet kotor | Apakah sebelum diskon dan pajak? |
| Penjualan bersih | Perlakuan diskon, pembatalan, dan retur |
| Transaksi valid | Status transaksi yang dihitung |
| Rata-rata transaksi | Penjualan sesuai definisi dibagi transaksi yang memenuhi syarat |
| Laba kotor | Penjualan bersih dikurangi harga pokok barang terjual |
| Stok tersedia | Perlakuan stok rusak, dipesan, atau dalam penyesuaian |
| Produk terlaris | Berdasarkan kuantitas atau omzet |
| Perbandingan periode | Periode sebelumnya yang setara atau aturan lain yang dipilih |

Definisi harus dipakai secara konsisten pada KPI, grafik, tabel, dan ekspor laporan.

## 14. Keamanan dan Hak Akses

Peran awal yang dapat dipertimbangkan:

- **Owner:** dashboard, laporan, pengaturan usaha, pengguna, dan akses fitur sesuai kebijakan.
- **Kasir:** transaksi dan riwayat yang diizinkan.
- **Pengelola stok:** produk, inventori, dan penyesuaian stok sesuai kewenangan.
- **Admin:** konfigurasi teknis atau operasional sesuai kebijakan usaha.

Hal yang perlu diterapkan:

- Autentikasi untuk endpoint privat.
- Otorisasi di backend, bukan hanya menyembunyikan tombol di React.
- Validasi input dan batasan data.
- Audit log untuk tindakan penting.
- Konfirmasi pembatalan, retur, dan penyesuaian stok.
- Pencegahan transaksi ganda saat tombol bayar diklik berulang.
- Kebijakan backup dan pemulihan database.

## 15. Rencana Implementasi Bertahap

### Fase 1 — Audit

- [ ] Tinjau screenshot dashboard yang ada.
- [ ] Petakan halaman dan alur pengguna.
- [ ] Uji alur transaksi kasir.
- [ ] Periksa konsistensi UI.
- [ ] Verifikasi metrik dengan data database.
- [ ] Susun daftar masalah berdasarkan dampak dan tingkat kesulitan.

**Hasil:** laporan audit, prioritas perbaikan, dan daftar komponen yang perlu dipertahankan atau diubah.

### Fase 2 — Dashboard owner

- [ ] Buat layout dashboard.
- [ ] Implementasikan KPI cards.
- [ ] Tambahkan filter periode.
- [ ] Buat grafik tren penjualan.
- [ ] Tambahkan produk terlaris.
- [ ] Tambahkan peringatan stok.
- [ ] Hubungkan seluruh komponen dengan API nyata.
- [ ] Tambahkan loading, empty, dan error state.

**Hasil:** dashboard owner yang informatif dan konsisten.

### Fase 3 — Penyempurnaan operasional

- [ ] Perbaiki alur kasir berdasarkan hasil audit.
- [ ] Perbaiki halaman produk dan inventori.
- [ ] Standarkan tabel, formulir, tombol, dan notifikasi.
- [ ] Pastikan akses berbasis peran.
- [ ] Tambahkan laporan dan ekspor jika diperlukan.

**Hasil:** pengalaman yang konsisten di seluruh aplikasi.

### Fase 4 — Validasi

- [ ] Uji pada desktop dan tablet.
- [ ] Uji data kosong dan error API.
- [ ] Bandingkan angka dashboard dengan transaksi sumber.
- [ ] Uji transaksi ganda dan pembatalan.
- [ ] Uji hak akses setiap peran.
- [ ] Minta pengguna mencoba tugas umum dan catat hambatannya.
- [ ] Perbaiki masalah berdasarkan temuan nyata.

**Hasil:** UI yang tidak hanya menarik secara visual, tetapi juga dapat diandalkan.

## 16. Kriteria Penerimaan

Redesign dianggap layak jika:

- Owner dapat menemukan penjualan dan jumlah transaksi dengan cepat.
- Grafik mempunyai judul, label periode, satuan, dan tooltip.
- Filter tanggal bekerja dan seluruh visualisasi mengikuti filter yang sama.
- Nilai dashboard sesuai dengan data sumber dan definisi metrik.
- Stok menipis mengarah ke tindakan yang relevan.
- Kasir tetap dapat menyelesaikan transaksi tanpa regresi.
- Loading, error, dan data kosong ditangani dengan baik.
- Tampilan dapat digunakan pada ukuran layar target.
- Hak akses diperiksa oleh backend.
- Komponen UI utama konsisten dan dapat digunakan ulang.

## 17. Informasi yang Dibutuhkan untuk Audit Aktual

Agar rancangan dapat disesuaikan dengan sistem yang sudah berjalan, siapkan:

1. Screenshot dashboard saat ini.
2. Screenshot halaman kasir dan inventori.
3. Struktur folder React dan Express.
4. Skema tabel database atau model data.
5. Contoh data transaksi yang sudah dianonimkan.
6. Informasi autentikasi dan peran pengguna.
7. Library UI/CSS yang saat ini digunakan.

Jangan sertakan password, token, secret API, data pelanggan asli, atau informasi sensitif lainnya.

## 18. Rekomendasi Akhir

Jangan mulai dengan menambahkan banyak grafik sekaligus. Mulailah dari audit, tetapkan definisi metrik, lalu bangun dashboard owner dengan:

1. KPI yang relevan.
2. Grafik tren penjualan.
3. Produk terlaris.
4. Peringatan stok.
5. Filter periode yang konsisten.

Setelah itu, evaluasi alur kasir dan inventori berdasarkan penggunaan nyata. Tujuan akhirnya adalah agar owner dapat menjawab tiga pertanyaan dalam beberapa detik:

- **Berapa hasil penjualan saya?**
- **Apa yang sedang terjadi pada bisnis saya?**
- **Apa tindakan yang perlu saya ambil?**
