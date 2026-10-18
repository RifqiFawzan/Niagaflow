# NiagaFlow — Kit (konvensi & konteks kerja)

Ringkasan keputusan teknis supaya semua issue dikerjakan konsisten. Rincian di `plan/niagaflow_fullstack_project_plan.md`.

## Stack (terkunci — jangan ganti)

- Monorepo npm workspaces: `apps/web` + `apps/api`
- Frontend: React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM
- Validasi: Zod. Auth: session cookie HttpOnly. Test: Vitest + Supertest
- API prefix: `/api/v1`. Dev: api `:4000`, web `:5173` (proxy `/api` → `:4000`

## Konvensi API

- Sukses: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code": "SNAKE_CASE", "message": "pesan manusiawi" } }`
- Status HTTP: `200` `201` `400` `401` `403` `404` `409` `429` `500`. Jangan kirim stack trace ke klien.
- Semua input divalidasi Zod di backend (frontend hanya UX).
- Uang (harga/subtotal/diskon/total): SELALU `number` (integer rupiah) di respons API — serialisasi lewat `src/utils/serialize.ts` (`money`/`serializeOrder`/`serializeProduct`); jangan kembalikan Prisma Decimal mentah (JSON.stringify mengubahnya jadi string).
- Satu PrismaClient singleton: `src/utils/prisma.ts` — jangan `new PrismaClient()` di module routes/middleware.

## Aturan bisnis wajib

- Uang = `Decimal` (Prisma `@db.Decimal(12,2)`), bukan Float.
- Buat pesanan + kurangi stok dalam SATU transaksi `$transaction`.
- Simpan snapshot `product_name_snapshot` + `unit_price` di `order_items`.
- Stok tidak boleh negatif (update bersyarat / cek di dalam transaksi).
- Kebijakan stok: dikurangi saat pesanan dibuat; dikembalikan saat pesanan dibatalkan sebelum `completed`.
- Produk terpakai transaksi → arsipkan (`is_active=false`), jangan hard delete.
- SKU unik. Kategori hanya bisa dihapus jika belum dipakai produk.
- Harga & total selalu dihitung backend, tidak dipercaya dari frontend.
- Role: `owner` = semua; `staff` = lihat produk/stok, buat pesanan, ubah status (owner kelola produk/kategori/pelanggan/laporan).

## Database

- Schema mengikuti plan §6. Mapping `@@map`/`@map` snake_case sesuai nama tabel/kolom di plan.
- ID UUID. `created_at`/`updated_at` di tabel utama.
- `order_status_history.old_status` nullable (entry pertama saat pesanan dibuat).

## Definition of Done (per issue)

- [ ] Bisa dipakai lewat API/UI sesuai AC issue
- [ ] Validasi input + izin diperiksa di backend
- [ ] Loading/error/empty state ditangani (untuk halaman frontend)
- [ ] Test untuk logika penting (mulai berlaku dari ISSUE-013)
- [ ] Tidak ada secret di repository (`.env` ada di `.gitignore`)
- [ ] README/dokumentasi ikut diperbarui bila perlu

## Perintah

```
npm install                          # sekali, di root (semua workspace)
npm run dev:api                      # API :4000
npm run dev:web                      # Web :5173
npm run build                        # build semua workspace

# Database (butuh PostgreSQL + DATABASE_URL di apps/api/.env)
npx prisma migrate dev -w apps/api
npx prisma db seed -w apps/api
npx prisma studio -w apps/api
```
