# NiagaFlow

Sistem manajemen pesanan, stok, dan penjualan untuk UMKM. Aplikasi web fullstack: produk, kategori, pelanggan, pesanan (dengan konsistensi stok), dashboard, dan laporan sederhana.

## Tech Stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query (`apps/web`)
- **Backend:** Node.js + Express + TypeScript, Zod, session cookie (`apps/api`)
- **Database:** PostgreSQL + Prisma ORM

## Screenshot

Belum ada gambar di repo ini. Halaman yang perlu diambil: dashboard, produk, pesanan, laporan.

Cara mengambilnya: jalankan aplikasi (`npm run dev:api` dan `npm run dev:web`), masuk, lalu simpan gambar ke `docs/screenshots/` dengan nama persis ini.

| Berkas | Halaman |
|---|---|
| `docs/screenshots/dashboard.png` | `/dashboard` |
| `docs/screenshots/produk.png` | `/products` |
| `docs/screenshots/pesanan.png` | `/orders` |
| `docs/screenshots/laporan.png` | `/reports` |

Setelah gambarnya ada, baris di bawah ini otomatis menampilkannya:

| Dashboard | Produk |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Produk](docs/screenshots/produk.png) |

| Pesanan | Laporan |
|---|---|
| ![Pesanan](docs/screenshots/pesanan.png) | ![Laporan](docs/screenshots/laporan.png) |

## Cara Menjalankan Lokal

Prasyarat: Node.js ≥ 20, npm, PostgreSQL berjalan.

```bash
npm install                      # install semua workspace

cp .env.example apps/api/.env    # lalu isi DATABASE_URL, dll
npx prisma migrate dev -w apps/api
npx prisma db seed -w apps/api

npm run dev:api                  # API: http://localhost:4000
npm run dev:web                  # Web: http://localhost:5173
```

Health check: `GET http://localhost:4000/api/v1/health`

### Akun demo (hasil seed)

| Role  | Email                | Password (lokal) | Password (production) |
|-------|----------------------|------------------|------------------------|
| owner | owner@niagaflow.test | `password123`    | isi `DEMO_PASSWORD`    |
| staff | staff@niagaflow.test | `password123`    | isi `DEMO_PASSWORD`    |

Saat seed dijalankan dengan `NODE_ENV=production`, password diambil dari env `DEMO_PASSWORD` (minimal 12 karakter). Seed akan menolak jalan kalau kosong atau terlalu pendek, supaya demo publik tidak memakai password lemah. Di lokal, `password123` tetap dipakai agar dev dan test tidak perlu setup tambahan.

## Struktur Proyek

```
niagaflow/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend + Prisma
├── docs/             # ERD & dokumentasi tambahan
├── plan/             # Rencana proyek, backlog, issues, kit konvensi
├── README.md
└── package.json      # npm workspaces
```

## Pengembangan

Proyek ini dikerjakan mengikuti alur di `workflow.md`: `plan/` (rencana) → `plan/backlog.md` → `plan/issues/` (per fitur, dengan acceptance criteria) → `plan/kit.md` (konvensi) → loop implementasi per issue.

Lihat `plan/kit.md` sebelum menambah kode — konvensi API, aturan bisnis (stok, uang Decimal, transaksi), dan Definition of Done ada di sana.

## Test

Test integration (Vitest + Supertest) ada di `apps/api/tests` dan memakai **database test terpisah** (`niagaflow_test`), bukan data demo.

```bash
# sekali saja: buat database test
docker exec niagaflow-pg psql -U postgres -c "CREATE DATABASE niagaflow_test;"
# siapkan kredensial test
cp apps/api/.env.test.example apps/api/.env.test   # lalu sesuaikan DATABASE_URL

npm run test                   # jalankan seluruh suite (dari root)
npm run test -w apps/api       # hanya test API
npm run typecheck -w apps/api  # typecheck src + tests
```

Skema database test di-reset otomatis sebelum suite berjalan (`prisma db push --force-reset`), dan setiap test membangun ulang fixture-nya sendiri sehingga urutan eksekusi tidak berpengaruh.

## API

Base URL: `http://localhost:4000/api/v1`.

Dokumentasi interaktif (Swagger UI) tersedia di **http://localhost:4000/docs**.
Dokumen mentahnya (OpenAPI 3.0) di **http://localhost:4000/openapi.json**.

Dokumentasi ini dibuat dari skema Zod yang sama dengan validasi runtime, jadi ikut berubah otomatis saat validasi berubah — tidak bisa basi.

| Modul     | Endpoint                                                                              |
|-----------|---------------------------------------------------------------------------------------|
| Auth      | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`                                 |
| Kategori  | `GET/POST /categories`, `PATCH/DELETE /categories/:id`                                  |
| Produk    | `GET/POST /products`, `GET/PATCH /products/:id`, `PATCH /products/:id/archive`          |
| Pelanggan | `GET/POST /customers`, `GET/PATCH /customers/:id`, `GET /customers/:id/orders`           |
| Pesanan   | `GET/POST /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`                        |
| Laporan   | `GET /reports/dashboard`, `GET /reports/summary`, `GET /reports/top-products`, `GET /reports/low-stock` |

### Keamanan

- **Sesi** memakai JWT di cookie `session`, bersifat `HttpOnly` + `SameSite=Lax`, dan `Secure` otomatis saat `NODE_ENV=production`. Cookie tidak bisa dibaca JavaScript, sehingga terlindung dari pencurian via XSS.
- **Rate limit login**: 10 percobaan per menit per alamat IP. Percobaan ke-11 dan seterusnya ditolak dengan `429 RATE_LIMITED`.
- **Otorisasi berbasis peran**: tulis kategori/pelanggan/produk hanya untuk `owner`; laporan penjualan hanya untuk `owner`; buat dan ubah status pesanan untuk `owner` dan `staff`.
- **Header keamanan**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- **CORS** hanya mengizinkan origin dari `WEB_ORIGIN`, bukan semua origin.
- Rahasia (`SESSION_SECRET`, `DATABASE_URL`) dibaca dari environment; hanya file `.example` yang masuk Git.

## Database

Diagram relasi (ERD) ada di [`docs/ERD.md`](docs/ERD.md).

## Deployment

**Status: berkas konfigurasi siap, deploy belum dijalankan** (butuh akun hosting pemilik proyek).

Rencana yang dipakai: frontend dan backend ke **Vercel** (dua project terpisah dari repo yang sama), database ke **Neon**.

Panduan langkah demi langkah ada di [`docs/DEPLOY.md`](docs/DEPLOY.md). Isi environment variables mengikuti [`.env.production.example`](.env.production.example).

Dua hal yang paling sering bikin gagal:

1. Frontend **wajib** diberi env `VITE_API_URL` berisi URL backend. Tanpa itu, permintaan API menuju domain frontend sendiri dan login gagal. Di lokal env ini boleh kosong karena ada proxy dev Vite.
2. Backend **wajib** diberi `WEB_ORIGIN` berisi URL frontend. Kalau tidak cocok, CORS menolak semua permintaan.

## Catatan

- Angka rupiah dikirim ke frontend sebagai bilangan bulat (integer), bukan `Decimal`. Lihat `apps/api/src/utils/serialize.ts`.
- Nama produk disalin ke item pesanan saat pesanan dibuat, supaya riwayat lama tidak berubah bila produk diganti nama.
