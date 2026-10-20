# NiagaFlow

Sistem manajemen pesanan, stok, dan penjualan untuk UMKM. Aplikasi web fullstack: produk, kategori, pelanggan, pesanan (dengan konsistensi stok), dashboard, dan laporan sederhana.

## Tech Stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query (`apps/web`)
- **Backend:** Node.js + Express + TypeScript, Zod, session cookie (`apps/api`)
- **Database:** PostgreSQL + Prisma ORM

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

| Role  | Email                  | Password     |
|-------|------------------------|--------------|
| owner | owner@niagaflow.test   | password123  |
| staff | staff@niagaflow.test   | password123  |

## Struktur Proyek

```
niagaflow/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend + Prisma
├── plan/             # Rencana proyek, backlog, issues, kit konvensi
├── docs/             # Dokumentasi API & database
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

Base URL: `http://localhost:4000/api/v1`. Endpoint inti (rincian di `plan/niagaflow_fullstack_project_plan.md` §7): auth, products, categories, customers, orders, reports.
