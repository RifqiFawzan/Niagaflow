# Panduan Lengkap UI/UX Sistem POS
**Frontend:** React.js | **Backend:** Node.js + Express | **Target:** General POS  
**Library grafik:** Recharts | **Library ikon:** lucide-react

## Referensi visual

Gambar ini adalah referensi konsep untuk dashboard owner, grafik, navigasi, design system, dan halaman kasir. Data dan angka pada gambar bersifat ilustratif, bukan data aktual.

![Referensi UI/UX POS](pos-ui-ux-reference.png)

---

## 1. Tujuan produk

POS harus membantu:
- **Kasir:** menyelesaikan transaksi cepat dan akurat.
- **Owner:** memahami hasil usaha dan menentukan tindakan.
- **Pengelola stok:** mengetahui stok menipis, habis, dan perlu restock.
- **Admin:** mengelola pengguna, hak akses, dan konfigurasi.

Prinsip utama: **angka memberi nilai yang tepat, grafik memperlihatkan pola, dan indikator membantu pengguna bertindak.**

## 2. Aturan UI/UX umum

1. **Jelas:** gunakan bahasa sederhana, hindari jargon teknis.
2. **Konsisten:** tombol, formulir, tabel, status, navigasi, dan notifikasi menggunakan pola yang sama.
3. **Efisien:** kurangi klik dan input yang tidak diperlukan.
4. **Hierarki visual:** tampilkan informasi paling penting lebih dahulu.
5. **Feedback:** berikan status loading, berhasil, gagal, dan data kosong.
6. **Pencegahan kesalahan:** validasi sebelum menyimpan, membayar, menghapus, atau membatalkan.
7. **Aksesibilitas:** kontras memadai, label input jelas, fokus keyboard terlihat, jangan mengandalkan warna saja.
8. **Responsif:** uji desktop dan tablet; pastikan kontrol tetap mudah digunakan.
9. **Berorientasi tindakan:** peringatan harus mengarahkan pengguna ke halaman untuk menyelesaikan masalah.
10. **Data akurat:** angka kartu, grafik, tabel, dan laporan harus memakai definisi yang konsisten.

### Bedakan kebutuhan pengguna

| Peran | Tujuan utama | Halaman utama |
|---|---|---|
| Owner | Memantau bisnis dan mengambil keputusan | Dashboard |
| Kasir | Memproses transaksi | Kasir / POS |
| Pengelola stok | Mengelola produk dan persediaan | Produk & Inventori |
| Admin | Mengelola konfigurasi dan akun | Pengaturan / Pengguna |

## 3. Audit UX sebelum redesign

Poin berikut adalah checklist audit, bukan klaim bahwa semua masalah sudah ada.

- [ ] Owner dapat menemukan penjualan dan transaksi dengan cepat.
- [ ] Filter periode mudah ditemukan.
- [ ] Grafik memiliki judul, periode, satuan, legenda/tooltip yang jelas.
- [ ] Kasir dapat mencari produk tanpa berpindah halaman berulang kali.
- [ ] Keranjang, total, diskon, pajak, dan tombol pembayaran mudah dilihat.
- [ ] Produk dan stok memiliki pencarian, filter, dan status yang jelas.
- [ ] Form memiliki label dan pesan validasi yang mudah dimengerti.
- [ ] Loading, empty, error, dan success state tersedia.
- [ ] Layout nyaman digunakan pada desktop dan tablet.
- [ ] Hak akses diperiksa di backend.
- [ ] Nilai dashboard cocok dengan transaksi sumber.

### Prioritas temuan
- **P0 Kritis:** transaksi ganda, salah hitung, kebocoran data, akses tanpa izin.
- **P1 Tinggi:** alur transaksi terhambat, stok/laporan tidak konsisten.
- **P2 Sedang:** navigasi membingungkan, pola UI tidak konsisten.
- **P3 Rendah:** detail kosmetik yang tidak menghambat pekerjaan.

## 4. Struktur menu aplikasi

Gunakan sidebar di desktop dan drawer/menu ringkas di tablet. Ikon harus disertai label agar mudah dipahami pengguna baru.

| Menu utama | Submenu | Fungsi |
|---|---|---|
| Dashboard | Ringkasan | KPI, tren, produk terlaris, peringatan |
| Kasir / POS | Transaksi baru, Riwayat | Proses dan cari transaksi |
| Produk | Daftar produk, Kategori, Varian (opsional) | Katalog produk |
| Inventori | Stok, Stok menipis, Mutasi, Penyesuaian | Kontrol persediaan |
| Laporan | Penjualan, Produk, Kategori, Kasir, Ekspor | Analisis bisnis |
| Pelanggan (opsional) | Daftar, Riwayat pembelian | Data pelanggan |
| Pengguna & Peran | Pengguna, Hak akses | Manajemen akun |
| Pengaturan | Profil usaha, Pembayaran, Pajak, Struk, Cabang (opsional) | Konfigurasi |

### Aturan navigasi
- Menu aktif harus mudah dikenali.
- Posisi menu konsisten antarhalaman.
- Jangan menampilkan menu yang tidak relevan dengan peran.
- Menyembunyikan menu di frontend **bukan** pengganti otorisasi backend.
- Hindari terlalu banyak submenu.
- Nama menu memakai istilah yang dikenal pengguna, misalnya “Stok” dan “Laporan”.
- Tampilkan nama pengguna/peran di area profil.

### Ikon
Gunakan satu keluarga ikon, misalnya `lucide-react`.

```bash
npm install lucide-react
```

Contoh ikon: `LayoutDashboard`, `ShoppingCart`, `Package`, `Boxes`, `ChartNoAxesCombined`, `Users`, `UserCog`, `Settings`.

## 5. Rancangan dashboard owner

Urutan yang disarankan:

1. **Header:** nama usaha, cabang jika ada, filter periode, profil pengguna.
2. **KPI cards:** penjualan bersih, jumlah transaksi, rata-rata nilai transaksi, laba kotor jika data modal tersedia.
3. **Grafik tren penjualan:** line chart atau area chart.
4. **Produk terlaris:** horizontal bar chart.
5. **Penjualan per kategori:** donut chart atau bar chart.
6. **Peringatan stok:** daftar produk menipis dengan tindakan langsung.
7. **Aktivitas terbaru:** transaksi, waktu, kasir, total, status, dan tautan detail.

Mulai dengan 3–4 KPI utama. Jangan memenuhi dashboard dengan banyak grafik yang tidak membantu keputusan.

### Aturan KPI
Setiap kartu idealnya menunjukkan:
- Label metrik.
- Nilai dengan format yang tepat.
- Periode yang sedang dipilih.
- Pembanding periode sebelumnya jika tersedia.
- Penjelasan singkat bila istilah berpotensi ambigu.

**Jangan menyamakan omzet dengan laba.** Tampilkan laba kotor hanya jika harga pokok barang terjual dan aturan perhitungannya tersedia.

## 6. Pemilihan grafik

| Kebutuhan | Visualisasi | Aturan UX |
|---|---|---|
| Tren penjualan harian/mingguan/bulanan | Line chart / area chart | Sumbu waktu konsisten; tooltip menunjukkan tanggal dan nilai |
| Produk terlaris | **Horizontal bar chart** | Cocok untuk label produk panjang; jelaskan apakah berdasarkan unit atau omzet |
| Perbandingan kategori | Bar chart | Lebih mudah membandingkan banyak kategori |
| Komposisi beberapa kategori | Donut chart | Sertakan legenda, nilai, dan persentase |
| Penjualan per jam | Column/bar chart | Label jam jelas |
| Jam sibuk per hari dan jam | Heatmap bila data cukup | Beri legenda intensitas dan label sumbu |
| Target penjualan | Progress bar | Tampilkan nilai aktual, target, dan periode |
| Stok menipis | Alert/tabel tindakan | Tampilkan stok, batas minimum, dan tombol restock |
| Rincian transaksi | Tabel | Pencarian, filter, sorting, pagination bila diperlukan |
| Perbandingan dua periode | Line chart dua seri atau bar chart | Legenda harus jelas |

### Aturan umum grafik
- Setiap grafik harus menjawab satu pertanyaan bisnis.
- Judul harus spesifik, misalnya “Penjualan per Hari”.
- Nyatakan satuan: rupiah, unit, transaksi, atau persen.
- Gunakan tooltip untuk detail, bukan sebagai satu-satunya cara memahami data.
- Hindari efek 3D, terlalu banyak warna, dan terlalu banyak seri.
- Jangan memotong atau memanipulasi skala sehingga perbedaan terlihat menyesatkan.
- Jangan mengisi grafik dengan data palsu.
- Jika data kosong, jelaskan bahwa data belum tersedia.
- Sediakan ringkasan teks/tabel alternatif bila sesuai.
- Format rupiah menggunakan locale Indonesia.
- Semua grafik dashboard mengikuti filter periode yang sama kecuali ada alasan UX yang jelas.

## 7. Library grafik: Recharts

**Gunakan Recharts sebagai library grafik utama.** Recharts dirancang untuk React dan menyediakan grafik yang umum dibutuhkan dashboard POS.

Instalasi:
```bash
npm install recharts
```

Komponen yang dipakai:
- `ResponsiveContainer`: menyesuaikan ukuran grafik.
- `LineChart` + `Line`: tren penjualan.
- `AreaChart` + `Area`: tren dengan area terisi.
- `BarChart` + `Bar`: grafik batang; gunakan `layout="vertical"` untuk horizontal bar chart.
- `PieChart` + `Pie`: komposisi kategori.
- `XAxis`, `YAxis`: label sumbu.
- `CartesianGrid`: garis bantu.
- `Tooltip`: detail nilai.
- `Legend`: keterangan seri.

### Contoh horizontal bar chart produk terlaris

Contoh styling menggunakan Tailwind CSS. Jika proyek tidak memakai Tailwind, ganti kelas styling sesuai CSS proyek.

```jsx
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(value);

export default function TopProductsChart({ data = [] }) {
  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold">Produk Terlaris</h2>
      <p className="mb-4 text-sm text-slate-500">
        Berdasarkan jumlah unit terjual pada periode terpilih.
      </p>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Belum ada data produk pada periode ini.
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 20, bottom: 4, left: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatNumber} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${formatNumber(value)} unit`, "Terjual"]} />
              <Bar
                dataKey="quantity"
                name="Terjual"
                fill="#2563EB"
                radius={[0, 5, 5, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
```

Format data yang diharapkan:
```json
[
  { "name": "Kopi Susu", "quantity": 86 },
  { "name": "Americano", "quantity": 64 },
  { "name": "Matcha Latte", "quantity": 48 }
]
```

Angka di atas hanya contoh. Data produksi harus berasal dari backend.

### Contoh line chart penjualan

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
  if (!data.length) {
    return (
      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Tren Penjualan</h2>
        <p className="py-12 text-center text-sm text-slate-500">
          Belum ada data pada periode ini.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="mb-1 text-lg font-semibold">Tren Penjualan</h2>
      <p className="mb-4 text-sm text-slate-500">
        Perubahan penjualan selama periode yang dipilih.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis
              width={76}
              tickFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)} jt`
                : v >= 1_000 ? `${Math.round(v / 1_000)} rb`
                : String(v)
              }
            />
            <Tooltip formatter={(value) => rupiah(value)} />
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
    </section>
  );
}
```

Format data:
```json
[
  { "label": "20 Okt", "sales": 850000 },
  { "label": "21 Okt", "sales": 1120000 },
  { "label": "22 Okt", "sales": 970000 }
]
```

### Donut chart kategori
Gunakan `PieChart`, `Pie`, `Cell`, `Tooltip`, dan `Legend`. Selalu tampilkan legenda dan nilai kategori; warna saja tidak cukup. Jika kategori banyak, pertimbangkan bar chart.

## 8. Halaman kasir / POS

### Layout
- Pencarian produk/barcode di bagian atas.
- Kategori produk yang mudah dipilih.
- Daftar atau grid produk dengan nama dan harga.
- Keranjang tetap terlihat di desktop.
- Subtotal, diskon, pajak, dan total dikelompokkan.
- Tombol pembayaran paling menonjol.
- Modal pembayaran berisi metode pembayaran, jumlah diterima, dan kembalian jika relevan.
- Setelah transaksi, tampilkan status, nomor transaksi, dan opsi struk sesuai kemampuan sistem.

### Aturan interaksi
- Kuantitas dapat diubah dengan mudah.
- Total diperbarui konsisten setelah item atau diskon berubah.
- Cegah klik ganda yang membuat transaksi duplikat.
- Jika request gagal, jangan menghilangkan keranjang tanpa pemberitahuan.
- Konfirmasi pembatalan sesuai risiko tindakan.
- Validasi stok dilakukan juga di backend.
- Fokus keyboard kembali ke pencarian produk setelah item ditambahkan jika cocok dengan alur.
- Jangan menjanjikan cetak struk jika perangkat/cara cetak belum didukung.

## 9. Produk dan inventori

### Produk
- Cari berdasarkan nama, SKU, atau barcode jika tersedia.
- Filter kategori dan status.
- Kolom inti: nama, SKU, kategori, harga jual, stok, status.
- Sediakan tambah, edit, detail, dan nonaktifkan sesuai aturan bisnis.
- Pertimbangkan riwayat transaksi sebelum menghapus produk.

### Inventori
- Tampilkan stok saat ini dan batas minimum.
- Status yang konsisten: “Aman”, “Menipis”, “Habis”.
- Simpan alasan penyesuaian dan riwayat mutasi.
- Jangan mengizinkan stok negatif kecuali memang diizinkan aturan bisnis.
- Alert dashboard harus mengarah ke produk yang perlu ditangani.

## 10. Design system

### Palet warna awal
| Token | Hex | Penggunaan |
|---|---|---|
| Background | `#F8FAFC` | Latar halaman |
| Surface | `#FFFFFF` | Kartu/panel |
| Primary | `#2563EB` | Aksi utama dan fokus |
| Success | `#16A34A` | Berhasil |
| Warning | `#D97706` | Peringatan |
| Danger | `#DC2626` | Error/tindakan berisiko |
| Text primary | `#0F172A` | Teks utama |
| Text secondary | `#64748B` | Keterangan |
| Border | `#E2E8F0` | Pembatas |

### Aturan visual
- Spacing berbasis kelipatan 4/8 px.
- Radius kartu sekitar 10–14 px secara konsisten.
- Gunakan font yang mudah dibaca, misalnya Inter atau system font.
- Hindari bayangan berat dan dekorasi berlebihan.
- Tombol dan kontrol harus nyaman digunakan di tablet.
- Pastikan kontras teks memenuhi kebutuhan aksesibilitas.
- Status selalu memiliki teks/ikon, bukan warna saja.

### Komponen reusable
`Button`, `Input`, `Select`, `DateRangePicker`, `Modal`, `Badge`, `DataTable`, `Pagination`, `KpiCard`, `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `ConfirmDialog`.

Komponen perlu mendukung state yang sesuai: disabled, loading, invalid, focus, error, dan success.

## 11. Struktur folder React

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
│   │   ├── Input.jsx
│   │   ├── DataTable.jsx
│   │   ├── EmptyState.jsx
│   │   ├── LoadingState.jsx
│   │   └── ErrorState.jsx
│   └── dashboard/
│       ├── KpiCard.jsx
│       ├── SalesTrendChart.jsx
│       ├── TopProductsChart.jsx
│       ├── CategorySalesChart.jsx
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

Ini struktur referensi; pertahankan pola proyek saat ini jika sudah rapi.

## 12. API backend yang disarankan

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/dashboard/summary` | KPI dashboard |
| GET | `/api/dashboard/sales-trend` | Grafik tren |
| GET | `/api/dashboard/top-products` | Produk terlaris |
| GET | `/api/dashboard/category-sales` | Penjualan kategori |
| GET | `/api/dashboard/stock-alerts` | Peringatan stok |
| GET | `/api/reports/sales` | Laporan penjualan |
| GET | `/api/products` | Daftar produk |
| GET | `/api/sales` | Daftar transaksi |

Contoh filter:
```text
GET /api/dashboard/sales-trend?from=2026-10-01&to=2026-10-26
```

### Aturan backend
- Validasi tanggal, rentang, dan filter.
- Tetapkan zona waktu usaha.
- Gunakan autentikasi dan otorisasi pada endpoint privat.
- Batasi data berdasarkan usaha/cabang yang boleh diakses.
- Gunakan query database berparameter.
- Agregasikan data di backend untuk laporan besar.
- Terapkan pagination pada daftar transaksi.
- Tangani retur, pembatalan, dan transaksi belum selesai secara konsisten.
- Jangan mempercayai `businessId`, `branchId`, atau peran dari input bebas pengguna.

## 13. Definisi metrik

Sebelum membuat grafik, sepakati definisi berikut dan gunakan konsisten di semua halaman.

| Metrik | Hal yang perlu ditetapkan |
|---|---|
| Omzet kotor | Sebelum/sesudah diskon dan pajak? |
| Penjualan bersih | Perlakuan diskon, pembatalan, dan retur |
| Transaksi valid | Status transaksi yang dihitung |
| Rata-rata transaksi | Penjualan sesuai definisi dibagi transaksi yang memenuhi syarat |
| Laba kotor | Penjualan bersih dikurangi harga pokok barang terjual |
| Stok tersedia | Perlakuan barang rusak, dipesan, dan penyesuaian |
| Produk terlaris | Berdasarkan kuantitas atau omzet |
| Perbandingan periode | Periode sebelumnya yang setara atau aturan lain |

## 14. Aksesibilitas, responsivitas, dan feedback

### Aksesibilitas
- Beri label pada setiap input.
- Fokus keyboard harus terlihat.
- Gunakan nama tombol yang bermakna.
- Pastikan kontras teks memadai.
- Pesan error menjelaskan cara memperbaiki masalah.
- Jangan hanya menggunakan warna untuk menyampaikan status.
- Sediakan ringkasan teks atau data alternatif untuk grafik bila sesuai.

### Responsivitas
- **Desktop:** sidebar dan area kerja utama; keranjang kasir dapat berdampingan dengan katalog.
- **Tablet:** navigasi dapat diringkas, tetapi kontrol tetap mudah disentuh.
- **Layar sempit:** prioritaskan ringkasan dan tindakan; jangan memaksakan banyak kolom.
- **Tabel lebar:** gunakan scroll horizontal yang jelas atau tampilan alternatif.

### State wajib
- **Loading:** beri indikator proses.
- **Empty:** jelaskan data belum tersedia dan langkah berikutnya.
- **Error:** jelaskan kegagalan dan sediakan retry jika aman.
- **Success:** konfirmasi hasil tindakan.
- **Disabled:** jelaskan mengapa aksi belum tersedia jika tidak jelas.

## 15. Keamanan dan hak akses

Peran awal:
- **Owner:** dashboard, laporan, konfigurasi, dan manajemen pengguna sesuai kebijakan.
- **Kasir:** transaksi dan riwayat yang diizinkan.
- **Pengelola stok:** produk dan inventori sesuai kewenangan.
- **Admin:** konfigurasi sesuai kebutuhan.

Checklist:
- [ ] Endpoint privat dilindungi autentikasi.
- [ ] Otorisasi diperiksa di backend.
- [ ] Input divalidasi di backend.
- [ ] Query database aman dari SQL injection.
- [ ] Output ditangani untuk mengurangi risiko XSS.
- [ ] HTTPS digunakan di produksi.
- [ ] Secret tidak dimasukkan ke bundle frontend.
- [ ] Aksi penting dicatat dalam audit log.
- [ ] Pembayaran mencegah transaksi ganda.
- [ ] Backup dan pemulihan database direncanakan.

## 16. Roadmap implementasi

### Fase 1 — Audit
- [ ] Ambil screenshot dashboard, kasir, produk, dan inventori.
- [ ] Petakan alur pengguna.
- [ ] Verifikasi angka dengan database.
- [ ] Klasifikasikan masalah P0–P3.
**Output:** laporan audit dan daftar prioritas.

### Fase 2 — Design system dan navigasi
- [ ] Tetapkan warna, tipografi, spacing, dan radius.
- [ ] Standarkan sidebar, header, tombol, input, tabel, badge.
- [ ] Pastikan menu sesuai peran.
- [ ] Buat loading/empty/error state.
**Output:** komponen UI konsisten.

### Fase 3 — Dashboard owner
- [ ] KPI cards.
- [ ] Filter periode.
- [ ] Line chart tren penjualan.
- [ ] Horizontal bar chart produk terlaris.
- [ ] Grafik kategori bila bermanfaat.
- [ ] Peringatan stok dan aktivitas terbaru.
- [ ] Hubungkan dengan API nyata.
**Output:** dashboard owner yang membantu pengambilan keputusan.

### Fase 4 — Kasir dan inventori
- [ ] Perbaiki pencarian dan keranjang.
- [ ] Perjelas pembayaran dan total.
- [ ] Cegah transaksi ganda.
- [ ] Hubungkan alert stok dengan inventori.
- [ ] Verifikasi hak akses.
**Output:** alur operasional lebih konsisten.

### Fase 5 — Pengujian
- [ ] Uji desktop dan tablet.
- [ ] Uji data kosong dan error API.
- [ ] Bandingkan laporan dengan data sumber.
- [ ] Uji pembatalan, retur, dan klik pembayaran berulang.
- [ ] Uji tiap peran pengguna.
- [ ] Lakukan usability test untuk tugas umum.
**Output:** redesign tervalidasi, bukan hanya bagus di screenshot.

## 17. Kriteria penerimaan

- Owner dapat menemukan metrik utama dengan cepat.
- Grafik memiliki judul, satuan, periode, dan tooltip.
- Horizontal bar chart terbaca dan label produk jelas.
- Filter periode diterapkan konsisten.
- Data berasal dari backend dan cocok dengan transaksi sumber.
- Alert stok mengarah ke tindakan yang relevan.
- Alur kasir tetap berjalan tanpa regresi.
- Loading, empty, error, dan success state tersedia.
- Layout bekerja pada ukuran layar target.
- Otorisasi diperiksa di backend.
- Komponen UI konsisten dan dapat digunakan kembali.

## 18. Bahan untuk audit aplikasi aktual

Siapkan:
1. Screenshot dashboard.
2. Screenshot halaman kasir dan inventori.
3. Struktur folder React dan Express.
4. Skema database/model transaksi, produk, dan stok.
5. Contoh data yang sudah dianonimkan.
6. Library CSS/UI yang digunakan.
7. Mekanisme autentikasi dan peran.

Jangan sertakan password, token, secret API, atau data pribadi pelanggan.

---

## Ringkasan keputusan

- **Frontend:** React.js.
- **Backend:** Node.js + Express.
- **Grafik:** Recharts.
- **Ikon:** lucide-react.
- **Tren penjualan:** line chart.
- **Produk terlaris:** horizontal bar chart.
- **Kategori:** donut atau bar chart, sesuai jumlah kategori.
- **Stok menipis:** alert/tabel tindakan.
- **Urutan kerja:** audit → design system/menu → dashboard → kasir/inventori → validasi.

Tujuan akhirnya: owner dapat menjawab dengan cepat **berapa hasil penjualan, apa yang sedang terjadi, dan tindakan apa yang perlu dilakukan**.
