# Project Plan Fullstack: NiagaFlow

## Sistem Manajemen Pesanan, Stok, dan Penjualan untuk UMKM

**Jenis proyek:** Fullstack web application\
**Target:** Portofolio developer, UMKM kecil, toko rumahan, atau bisnis
online sederhana\
**Estimasi pengerjaan:** 6--8 minggu untuk MVP\
**Prioritas:** Fitur inti selesai, aman, teruji, dan bisa didemokan
secara online

------------------------------------------------------------------------

## 1. Ringkasan Proyek

NiagaFlow adalah aplikasi web yang membantu pemilik usaha kecil
mengelola produk, stok barang, pesanan, pelanggan, dan laporan penjualan
dari satu tempat.

Masalah yang ingin diselesaikan: - Stok sering dicatat manual sehingga
jumlahnya tidak akurat. - Pesanan pelanggan tersebar di chat atau
catatan. - Pemilik usaha kesulitan mengetahui produk terlaris dan total
penjualan. - Sulit melacak status pesanan dan riwayat transaksi.

**Solusi:** Sediakan dashboard sederhana untuk mencatat produk dan
pesanan, memperbarui stok secara konsisten, serta melihat ringkasan
penjualan.

### Nilai untuk portofolio

Proyek ini menunjukkan kemampuan membangun aplikasi end-to-end, bukan
hanya UI: - Frontend responsif dan terhubung ke backend. - REST API dan
validasi data. - Autentikasi serta otorisasi berbasis peran. - Relasi
database dan transaksi yang menjaga konsistensi stok. - Pengujian,
dokumentasi API, Git, deployment, dan penanganan error.

------------------------------------------------------------------------

## 2. Target Pengguna dan Peran

### A. Pemilik / Admin

-   Mengelola produk dan kategori.
-   Melihat serta mengubah status pesanan.
-   Mengelola data pelanggan.
-   Melihat laporan penjualan dan stok menipis.
-   Mengundang atau membuat akun staf.

### B. Staf

-   Melihat produk dan stok.
-   Membuat pesanan.
-   Memperbarui status pesanan sesuai izin.
-   Melihat data yang dibutuhkan untuk operasional.

### C. Pelanggan (opsional untuk versi lanjutan)

-   Melihat katalog produk.
-   Membuat pesanan.
-   Melihat status pesanan miliknya.

**Rekomendasi MVP:** Mulai dari Admin dan Staf. Portal pelanggan bisa
ditambahkan setelah alur internal stabil.

------------------------------------------------------------------------

## 3. Ruang Lingkup Fitur

### Fitur wajib --- MVP

1.  **Autentikasi**
    -   Login dan logout.
    -   Password disimpan dalam bentuk hash.
    -   Role `owner` dan `staff`.
    -   Endpoint dan halaman dilindungi sesuai role.
2.  **Dashboard**
    -   Total produk aktif.
    -   Jumlah pesanan hari ini.
    -   Total penjualan dari pesanan yang selesai.
    -   Daftar pesanan terbaru.
    -   Peringatan stok menipis.
3.  **Manajemen produk**
    -   Tambah, lihat, ubah, dan arsipkan produk.
    -   Nama, SKU/kode produk, kategori, harga, jumlah stok, dan batas
        stok minimum.
    -   Pencarian, filter, pengurutan, dan pagination.
    -   Validasi agar SKU tidak duplikat.
4.  **Manajemen kategori**
    -   Tambah, ubah, dan hapus kategori jika tidak sedang digunakan.
    -   Filter produk berdasarkan kategori.
5.  **Manajemen pelanggan**
    -   Nama, nomor kontak, dan catatan opsional.
    -   Riwayat pesanan per pelanggan.
6.  **Manajemen pesanan**
    -   Buat pesanan dengan satu atau lebih item.
    -   Hitung subtotal dan total di backend.
    -   Status: `pending`, `processing`, `completed`, `cancelled`.
    -   Riwayat perubahan status.
    -   Batalkan pesanan dengan aturan pengembalian stok yang jelas.
7.  **Laporan sederhana**
    -   Ringkasan penjualan berdasarkan rentang tanggal.
    -   Produk terlaris.
    -   Riwayat pesanan.
    -   Ekspor CSV sebagai fitur tambahan jika waktu memungkinkan.
8.  **Kualitas dasar**
    -   Validasi input di frontend dan backend.
    -   Pesan error yang mudah dipahami.
    -   Loading state, empty state, dan konfirmasi tindakan penting.
    -   Desain responsif untuk desktop dan ponsel.

### Fitur lanjutan --- jangan dikerjakan sebelum MVP stabil

-   Portal pelanggan dan katalog publik.
-   Notifikasi email/WhatsApp.
-   Impor produk dari CSV.
-   Multi-toko / multi-tenant.
-   Integrasi payment gateway.
-   Audit log lengkap.
-   Grafik analitik lanjutan.
-   Progressive Web App (PWA).

------------------------------------------------------------------------

## 4. Rekomendasi Teknologi

Pilih satu stack dan selesaikan proyek dengan stack tersebut. Jangan
mengganti teknologi di tengah jalan tanpa alasan kuat.

### Stack utama yang direkomendasikan

  -----------------------------------------------------------------------
  Bagian                  Teknologi               Alasan
  ----------------------- ----------------------- -----------------------
  Frontend                React + Vite +          Ekosistem luas dan
                          TypeScript              cocok untuk dashboard

  UI                      Tailwind CSS            Mempercepat pembuatan
                                                  layout responsif

  Routing                 React Router            Mengatur halaman dan
                                                  route terlindungi

  Data fetching           TanStack Query atau     Mengelola request,
                          fetch wrapper           loading, cache, dan
                                                  error

  Backend                 Node.js + Express +     Memahami REST API dan
                          TypeScript              backend secara
                                                  eksplisit

  Database                PostgreSQL              Cocok untuk data
                                                  transaksi dan relasi

  ORM                     Prisma                  Memudahkan schema,
                                                  migrasi, dan query

  Validasi                Zod                     Validasi data konsisten

  Autentikasi             Session cookie atau     Menangani login dan
                          access token dengan     akses
                          desain aman             

  Testing                 Vitest + Supertest;     Menguji unit, API, dan
                          Playwright untuk alur   alur pengguna
                          utama                   

  Dokumentasi API         OpenAPI/Swagger         Memudahkan demonstrasi
                                                  endpoint

  Version control         Git + GitHub            Riwayat perubahan dan
                                                  kolaborasi

  Deployment              Frontend dan backend    Membuat proyek bisa
                          pada layanan hosting    diakses HR/rekruter
                          yang mendukungnya;      
                          PostgreSQL terkelola    
  -----------------------------------------------------------------------

**Alternatif:** Jika ingin menonjolkan pengalaman Laravel, gunakan
Laravel API + React. Namun untuk rencana ini, gunakan React + Express +
PostgreSQL agar alur frontend, backend, dan API terlihat jelas.

------------------------------------------------------------------------

## 5. Arsitektur Sistem

``` text
Browser / React
      |
      | HTTPS + JSON
      v
Express REST API
      |
      +---- Authentication & Authorization
      +---- Validation & Business Logic
      +---- Product Service
      +---- Order Service
      +---- Report Service
      |
      v
Prisma ORM
      |
      v
PostgreSQL
```

### Prinsip penting

-   Frontend tidak boleh mengakses database secara langsung.
-   Semua aturan bisnis penting diperiksa ulang di backend.
-   Harga dan total pesanan dihitung di backend, bukan dipercaya dari
    browser.
-   Pembuatan pesanan dan pengurangan stok harus berjalan dalam
    transaksi database.
-   Endpoint yang mengubah data harus memeriksa autentikasi dan izin.
-   Gunakan environment variables untuk konfigurasi rahasia.
-   Jangan pernah memasukkan password, token, atau connection string ke
    repository.

### Struktur repository

``` text
niagaflow/
├── apps/
│   ├── web/                     # React frontend
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── dashboard/
│   │       │   ├── products/
│   │       │   ├── customers/
│   │       │   ├── orders/
│   │       │   └── reports/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── routes/
│   │       └── types/
│   └── api/                     # Express backend
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── products/
│       │   │   ├── categories/
│       │   │   ├── customers/
│       │   │   ├── orders/
│       │   │   └── reports/
│       │   ├── utils/
│       │   ├── app.ts
│       │   └── server.ts
│       └── tests/
├── docs/
│   ├── api.md
│   ├── database.md
│   └── screenshots/
├── .gitignore
├── README.md
└── package.json
```

Struktur ini adalah target akhir, bukan sesuatu yang harus dibuat
sekaligus. Mulai dari aplikasi minimal, lalu tambahkan folder saat modul
dibutuhkan.

------------------------------------------------------------------------

## 6. Rancangan Database

### Tabel `users`

  Kolom           Tipe / aturan            Keterangan
  --------------- ------------------------ ------------------
  id              UUID, primary key        ID pengguna
  name            VARCHAR                  Nama pengguna
  email           VARCHAR, unique          Email login
  password_hash   VARCHAR                  Hash password
  role            ENUM: `owner`, `staff`   Hak akses
  created_at      TIMESTAMP                Waktu dibuat
  updated_at      TIMESTAMP                Waktu diperbarui

### Tabel `categories`

  Kolom        Tipe / aturan       Keterangan
  ------------ ------------------- ---------------
  id           UUID, primary key   ID kategori
  name         VARCHAR             Nama kategori
  created_at   TIMESTAMP           Waktu dibuat

### Tabel `products`

  Kolom                 Tipe / aturan                 Keterangan
  --------------------- ----------------------------- --------------------
  id                    UUID, primary key             ID produk
  category_id           UUID, foreign key, nullable   Kategori
  sku                   VARCHAR, unique               Kode produk
  name                  VARCHAR                       Nama produk
  description           TEXT, nullable                Deskripsi
  price                 DECIMAL                       Harga
  stock                 INTEGER                       Stok saat ini
  low_stock_threshold   INTEGER                       Batas stok menipis
  is_active             BOOLEAN                       Status produk
  created_at            TIMESTAMP                     Waktu dibuat
  updated_at            TIMESTAMP                     Waktu diperbarui

### Tabel `customers`

  Kolom        Tipe / aturan       Keterangan
  ------------ ------------------- ----------------
  id           UUID, primary key   ID pelanggan
  name         VARCHAR             Nama pelanggan
  phone        VARCHAR, nullable   Nomor kontak
  notes        TEXT, nullable      Catatan
  created_at   TIMESTAMP           Waktu dibuat

### Tabel `orders`

  Kolom          Tipe / aturan                 Keterangan
  -------------- ----------------------------- ---------------------------------
  id             UUID, primary key             ID pesanan
  order_number   VARCHAR, unique               Nomor pesanan yang mudah dibaca
  customer_id    UUID, foreign key, nullable   Pelanggan
  created_by     UUID, foreign key ke users    Pembuat pesanan
  status         ENUM                          Status pesanan
  subtotal       DECIMAL                       Total sebelum diskon/pajak
  discount       DECIMAL, default 0            Diskon
  total          DECIMAL                       Total akhir
  notes          TEXT, nullable                Catatan
  created_at     TIMESTAMP                     Waktu dibuat
  updated_at     TIMESTAMP                     Waktu diperbarui

### Tabel `order_items`

  Kolom                   Tipe / aturan       Keterangan
  ----------------------- ------------------- ----------------------------
  id                      UUID, primary key   ID item
  order_id                UUID, foreign key   Pesanan
  product_id              UUID, foreign key   Produk
  product_name_snapshot   VARCHAR             Nama produk saat transaksi
  unit_price              DECIMAL             Harga saat transaksi
  quantity                INTEGER             Jumlah
  line_total              DECIMAL             Harga × jumlah

### Tabel `order_status_history`

  Kolom        Tipe / aturan                Keterangan
  ------------ ---------------------------- -------------------
  id           UUID, primary key            ID riwayat
  order_id     UUID, foreign key            Pesanan
  changed_by   UUID, foreign key ke users   Pengubah status
  old_status   VARCHAR                      Status sebelumnya
  new_status   VARCHAR                      Status baru
  changed_at   TIMESTAMP                    Waktu perubahan

### Relasi utama

``` text
categories 1 ---- * products
customers  1 ---- * orders
users      1 ---- * orders (created_by)
orders     1 ---- * order_items
products   1 ---- * order_items
orders     1 ---- * order_status_history
users      1 ---- * order_status_history
```

### Aturan integritas data

-   Harga harus lebih besar atau sama dengan nol; stok dan kuantitas
    harus bilangan bulat nonnegatif/positif sesuai konteks.
-   Kuantitas item pesanan minimal 1.
-   Simpan snapshot nama dan harga produk pada item pesanan agar riwayat
    transaksi tidak berubah saat produk diedit.
-   Gunakan tipe `DECIMAL` untuk uang, bukan floating point.
-   Buat pesanan dan kurangi stok dalam satu transaksi database.
-   Cegah stok menjadi negatif, termasuk ketika dua pesanan dibuat
    hampir bersamaan.
-   Definisikan kebijakan stok dengan jelas: misalnya stok dikurangi
    ketika pesanan dibuat dan dikembalikan ketika pesanan dibatalkan
    sebelum selesai.
-   Produk yang sudah dipakai dalam riwayat transaksi sebaiknya
    diarsipkan, bukan dihapus permanen.

------------------------------------------------------------------------

## 7. Rancangan REST API

Base URL lokal: `/api/v1`

### Auth

  Method   Endpoint         Fungsi
  -------- ---------------- --------------------------
  POST     `/auth/login`    Login
  POST     `/auth/logout`   Logout
  GET      `/auth/me`       Profil dan role pengguna

### Produk dan kategori

  Method   Endpoint                  Fungsi
  -------- ------------------------- -----------------------------------------
  GET      `/products`               Daftar produk dengan pencarian/filter
  GET      `/products/:id`           Detail produk
  POST     `/products`               Membuat produk
  PATCH    `/products/:id`           Mengubah produk
  PATCH    `/products/:id/archive`   Mengarsipkan produk
  GET      `/categories`             Daftar kategori
  POST     `/categories`             Membuat kategori
  PATCH    `/categories/:id`         Mengubah kategori
  DELETE   `/categories/:id`         Menghapus kategori yang tidak digunakan

### Pelanggan dan pesanan

  Method   Endpoint                  Fungsi
  -------- ------------------------- ---------------------------
  GET      `/customers`              Daftar pelanggan
  POST     `/customers`              Membuat pelanggan
  GET      `/customers/:id/orders`   Riwayat pesanan pelanggan
  GET      `/orders`                 Daftar pesanan
  GET      `/orders/:id`             Detail pesanan
  POST     `/orders`                 Membuat pesanan
  PATCH    `/orders/:id/status`      Mengubah status pesanan

### Laporan

  --------------------------------------------------------------------------------------------------
  Method                  Endpoint                                           Fungsi
  ----------------------- -------------------------------------------------- -----------------------
  GET                     `/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`   Ringkasan penjualan

  GET                     `/reports/top-products?from=...&to=...`            Produk terlaris

  GET                     `/reports/low-stock`                               Produk dengan stok
                                                                             menipis
  --------------------------------------------------------------------------------------------------

### Contoh request membuat pesanan

``` json
{
  "customerId": "uuid-pelanggan",
  "items": [
    {
      "productId": "uuid-produk",
      "quantity": 2
    }
  ],
  "notes": "Pesanan contoh"
}
```

Frontend hanya mengirim ID produk dan kuantitas. Backend mengambil harga
resmi dari database, memvalidasi stok, menghitung total, lalu menyimpan
pesanan dan perubahan stok dalam satu transaksi.

### Format respons yang konsisten

``` json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Contoh produk"
  }
}
```

Contoh error:

``` json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stok produk tidak mencukupi."
  }
}
```

Gunakan status HTTP yang tepat, seperti `200`, `201`, `400`, `401`,
`403`, `404`, `409`, dan `500`. Jangan mengirim stack trace atau
informasi rahasia ke klien.

------------------------------------------------------------------------

## 8. Rancangan Halaman Frontend

1.  `/login` --- formulir login.
2.  `/dashboard` --- kartu ringkasan, pesanan terbaru, stok menipis.
3.  `/products` --- tabel produk, pencarian, filter, pagination.
4.  `/products/new` --- formulir tambah produk.
5.  `/products/:id/edit` --- formulir edit produk.
6.  `/categories` --- manajemen kategori.
7.  `/customers` --- daftar pelanggan.
8.  `/customers/:id` --- profil dan riwayat pesanan.
9.  `/orders` --- daftar pesanan dengan filter status/tanggal.
10. `/orders/new` --- formulir pesanan dengan pemilih produk.
11. `/orders/:id` --- detail pesanan dan perubahan status.
12. `/reports` --- ringkasan dan produk terlaris.
13. `/settings` --- profil pengguna dan pengaturan dasar.

### Komponen UI yang dapat digunakan ulang

-   `AppLayout`, `Sidebar`, `Topbar`
-   `DataTable`, `Pagination`, `SearchInput`
-   `FormField`, `SelectField`, `CurrencyInput`
-   `StatusBadge`, `ConfirmDialog`, `Toast`
-   `LoadingState`, `EmptyState`, `ErrorState`
-   `ProtectedRoute`, `RoleGuard`

Utamakan tampilan yang bersih dan mudah digunakan. Jangan menghabiskan
terlalu banyak waktu untuk animasi sebelum alur utama bekerja.

------------------------------------------------------------------------

## 9. Rencana Pengerjaan 8 Minggu

### Minggu 1 --- Perencanaan dan setup

-   [ ] Finalisasi fitur MVP dan alur pengguna.
-   [ ] Buat repository GitHub.
-   [ ] Buat wireframe halaman inti.
-   [ ] Setup React, Express, TypeScript, PostgreSQL, dan Prisma.
-   [ ] Siapkan file `.env.example`.
-   [ ] Buat README awal dan aturan commit.

**Output:** Repository berjalan dan struktur proyek dasar siap.

### Minggu 2 --- Database dan autentikasi

-   [ ] Rancang schema Prisma dan relasi.
-   [ ] Buat migrasi database dan seed data demo.
-   [ ] Implementasi login/logout dan endpoint profil.
-   [ ] Hash password dengan library yang terawat.
-   [ ] Implementasi middleware autentikasi dan role.
-   [ ] Uji akses tanpa login dan akses role yang tidak sesuai.

**Output:** Login dan proteksi endpoint berjalan.

### Minggu 3 --- Produk dan kategori

-   [ ] CRUD produk.
-   [ ] CRUD kategori.
-   [ ] Validasi SKU unik, harga, dan stok.
-   [ ] Pencarian, filter, dan pagination.
-   [ ] Buat halaman produk dan kategori di frontend.
-   [ ] Tambahkan test endpoint inti.

**Output:** Produk dan kategori dapat dikelola dari UI.

### Minggu 4 --- Pelanggan dan pesanan

-   [ ] CRUD pelanggan sederhana.
-   [ ] Endpoint membuat dan membaca pesanan.
-   [ ] Hitung harga dan total di backend.
-   [ ] Terapkan transaksi database untuk stok dan pesanan.
-   [ ] Implementasi aturan pembatalan dan pengembalian stok.
-   [ ] Simpan riwayat perubahan status.

**Output:** Alur membuat pesanan konsisten dan dapat diuji.

### Minggu 5 --- Dashboard dan laporan

-   [ ] Buat API ringkasan dashboard.
-   [ ] Buat API stok menipis.
-   [ ] Buat laporan penjualan berdasarkan tanggal.
-   [ ] Buat laporan produk terlaris.
-   [ ] Hubungkan frontend dan tampilkan loading/error/empty state.

**Output:** Pemilik usaha dapat melihat kondisi bisnis dasar.

### Minggu 6 --- Penyelesaian UI dan keamanan

-   [ ] Perbaiki layout responsif.
-   [ ] Tambahkan konfirmasi untuk aksi berisiko.
-   [ ] Validasi input frontend dan backend.
-   [ ] Terapkan rate limiting untuk login.
-   [ ] Periksa CORS, cookie/token, dan konfigurasi HTTPS.
-   [ ] Pastikan rahasia tidak tersimpan di Git.
-   [ ] Tambahkan test untuk alur pesanan dan izin.

**Output:** MVP lebih nyaman dan aman digunakan.

### Minggu 7 --- Testing, dokumentasi, dan deployment

-   [ ] Dokumentasikan API dengan OpenAPI/Swagger.
-   [ ] Jalankan test otomatis.
-   [ ] Uji alur utama secara manual.
-   [ ] Deploy frontend, backend, dan database.
-   [ ] Atur environment variables di hosting.
-   [ ] Siapkan akun demo dengan data fiktif.
-   [ ] Tambahkan screenshot ke README.

**Output:** Aplikasi online dan bisa didemokan.

### Minggu 8 --- Polish portofolio

-   [ ] Perbaiki bug berdasarkan pengujian.
-   [ ] Tambahkan diagram arsitektur dan ERD.
-   [ ] Tulis keputusan teknis penting.
-   [ ] Buat video demo 2--3 menit.
-   [ ] Tambahkan instruksi setup lokal.
-   [ ] Tulis ringkasan kontribusi dan hal yang dipelajari.

**Output:** Proyek siap ditampilkan di CV, GitHub, dan saat interview.

------------------------------------------------------------------------

## 10. Prioritas Pengembangan

Gunakan urutan ini agar tidak terjebak membuat terlalu banyak fitur:

**P0 --- Harus ada** - Login dan role. - Produk dan kategori. -
Pembuatan pesanan. - Konsistensi stok. - Dashboard ringkas. - Deploy dan
README.

**P1 --- Penting setelah P0** - Pelanggan dan riwayat transaksi. -
Laporan rentang tanggal. - Testing API. - Dokumentasi Swagger. - Ekspor
CSV.

**P2 --- Jika waktu tersisa** - Portal pelanggan. - Notifikasi. - Impor
CSV. - Multi-toko. - Integrasi pembayaran.

------------------------------------------------------------------------

## 11. Strategi Testing

### Unit test

Uji fungsi seperti: - Perhitungan subtotal dan total. - Validasi
kuantitas. - Aturan transisi status. - Penentuan produk yang stoknya
menipis.

### Integration test

Uji: - Login berhasil dan gagal. - Pengguna tanpa izin tidak bisa
mengelola produk. - Produk dengan SKU duplikat ditolak. - Pesanan dengan
stok tidak cukup ditolak. - Pesanan yang berhasil mengurangi stok dengan
benar. - Pembatalan mengembalikan stok sesuai kebijakan. - Total
penjualan hanya menghitung status yang ditetapkan dalam aturan bisnis.

### End-to-end test

Skenario utama: 1. Admin login. 2. Admin membuat kategori dan produk. 3.
Staf membuat pelanggan dan pesanan. 4. Sistem memvalidasi stok. 5.
Pesanan diproses hingga selesai. 6. Dashboard dan laporan menampilkan
hasil yang sesuai.

------------------------------------------------------------------------

## 12. Keamanan Minimum

-   Simpan password dalam bentuk hash menggunakan algoritma yang sesuai,
    bukan plaintext.
-   Gunakan validasi server-side untuk semua input.
-   Terapkan autentikasi dan otorisasi di backend, bukan hanya
    menyembunyikan tombol di frontend.
-   Jika memakai cookie, atur `HttpOnly`, `Secure` di production,
    `SameSite`, dan perlindungan CSRF yang sesuai.
-   Jika memakai token, hindari menyimpan token sensitif di lokasi yang
    mudah dibaca JavaScript tanpa mempertimbangkan risikonya.
-   Terapkan rate limiting pada login dan endpoint sensitif.
-   Gunakan parameterized query/ORM dan hindari membangun SQL dari input
    mentah.
-   Atur CORS hanya untuk origin yang diperlukan.
-   Simpan rahasia di environment variables dan rotasi jika bocor.
-   Jangan gunakan data pelanggan nyata untuk demo portofolio.

------------------------------------------------------------------------

## 13. Checklist Definition of Done

Sebuah fitur dianggap selesai jika: - \[ \] Bisa digunakan melalui UI. -
\[ \] API memvalidasi input dan izin. - \[ \] Data tersimpan dengan
benar di PostgreSQL. - \[ \] Kondisi loading, error, dan data kosong
ditangani. - \[ \] Ada test untuk logika atau alur penting. - \[ \]
Tidak ada secret di repository. - \[ \] Perubahan sudah di-commit dengan
pesan yang jelas. - \[ \] README/API docs diperbarui bila diperlukan.

------------------------------------------------------------------------

## 14. Isi README GitHub

README akhir sebaiknya berisi: 1. Nama dan deskripsi proyek. 2. Masalah
yang diselesaikan. 3. Screenshot dashboard, produk, dan pesanan. 4.
Daftar fitur. 5. Teknologi yang digunakan. 6. Diagram arsitektur. 7.
ERD/database overview. 8. Cara menjalankan proyek secara lokal. 9.
Environment variables yang diperlukan melalui `.env.example`. 10.
Endpoint API atau tautan Swagger. 11. Cara menjalankan test. 12. Link
demo dan akun demo yang tidak memakai data pribadi. 13. Batasan yang
diketahui dan rencana pengembangan.

------------------------------------------------------------------------

## 15. Kriteria Keberhasilan

Proyek dinilai berhasil ketika: - Pengguna dapat login dan hanya
mengakses fitur sesuai role. - Admin dapat mengelola produk dan
kategori. - Pesanan dapat dibuat tanpa memercayai harga dari frontend. -
Stok tidak menjadi negatif saat terjadi permintaan bersamaan. - Pesanan
batal mengikuti aturan pengembalian stok. - Dashboard dan laporan sesuai
dengan data transaksi. - Aplikasi bisa diakses melalui URL demo. -
Developer lain bisa menjalankan proyek mengikuti README. - Pengujian
utama berjalan dan dokumentasi API tersedia.

------------------------------------------------------------------------

## 16. Cara Memulai Hari Pertama

Jangan langsung mengerjakan seluruh fitur. Mulai dengan langkah kecil
berikut:

1.  Buat repository `niagaflow`.
2.  Buat wireframe untuk login, dashboard, produk, dan pesanan.
3.  Buat folder `apps/web` dan `apps/api`.
4.  Jalankan frontend dan backend dengan endpoint health check.
5.  Hubungkan PostgreSQL dan Prisma.
6.  Buat model `User`, `Category`, dan `Product` terlebih dahulu.
7.  Commit perubahan awal ke GitHub.

**Target hari pertama:** frontend tampil, backend merespons
`/api/v1/health`, database terhubung, dan instruksi setup tertulis di
README.

## Penutup

Fokus utama proyek ini bukan banyaknya fitur, melainkan kualitas
implementasi: API yang konsisten, database yang benar, aturan bisnis
yang aman, UI yang jelas, test yang relevan, dan deployment yang bisa
dicoba. Setelah MVP selesai, fitur lanjutan dapat ditambahkan
berdasarkan kebutuhan pengguna nyata.
