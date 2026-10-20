# Cara Deploy NiagaFlow

Panduan ini menjelaskan cara menaruh NiagaFlow online supaya bisa didemokan.

**Status:** berkas konfigurasi dan langkah-langkah sudah siap, tetapi **belum dijalankan**. Deploy butuh akun hosting, dan itu harus dilakukan pemilik proyek. Langkah di bawah ini untuk Anda jalankan sendiri.

## Bagian yang akan dibuat

| Bagian | Isi | Contoh layanan |
|---|---|---|
| Frontend | React hasil build (`vite build`) | Vercel, Netlify |
| Backend | Express (`node dist/server.js`) | Render, Railway |
| Database | PostgreSQL terkelola | Neon, Supabase, Railway |

Tiga bagian ini terpisah. Frontend hanya menyajikan berkas statis, backend menjalankan API, database menyimpan data.

## Langkah 1 — Siapkan database

1. Buat database PostgreSQL di layanan pilihan Anda.
2. Salin connection string-nya. Pastikan ada `?sslmode=require` di akhir, karena database terkelola biasanya menolak koneksi tanpa SSL.

## Langkah 2 — Deploy backend

1. Buat layanan baru, arahkan ke repo ini, dan set folder kerja ke `apps/api`.
2. **Build command:** `npm run deploy:build`
3. **Start command:** `npm run start`
4. Isi environment variables berikut (lihat `.env.production.example`):

| Nama | Nilai |
|---|---|
| `DATABASE_URL` | Connection string dari Langkah 1 |
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | String acak panjang (lihat cara di bawah) |
| `WEB_ORIGIN` | URL frontend nanti (isi setelah Langkah 3) |
| `TRUST_PROXY` | `true` |
| `DEMO_PASSWORD` | Password akun demo, minimal 12 karakter |

Membuat `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

5. Setelah backend online, isi data contoh. Jalankan sekali dari komputer Anda, arahkan ke database produksi:

```bash
cd apps/api
NODE_ENV=production DEMO_PASSWORD="password-demo-anda" DATABASE_URL="..." npx prisma db seed
```

Seed akan **menolak jalan** kalau `NODE_ENV=production` tapi `DEMO_PASSWORD` kosong atau kurang dari 12 karakter. Ini sengaja, supaya demo publik tidak memakai password lemah.

## Langkah 3 — Deploy frontend

1. Buat layanan baru di layanan static hosting, arahkan ke repo ini, folder `apps/web`.
2. **Build command:** `npm install && npm run build`
3. **Output directory:** `apps/web/dist`
4. Tambahkan satu environment variable: `VITE_API_URL` berisi URL backend dari Langkah 2.

## Langkah 4 — Sambungkan keduanya

1. Kembali ke backend, ubah `WEB_ORIGIN` menjadi URL frontend yang sebenarnya. Ini penting: CORS akan menolak permintaan dari origin lain.
2. Pastikan tidak ada garis miring di akhir URL (`https://contoh.vercel.app`, bukan `https://contoh.vercel.app/`).
3. Deploy ulang backend agar setelan baru terpakai.

## Langkah 5 — Uji hasilnya

1. Buka URL frontend.
2. Masuk dengan akun demo. Passwordnya = `DEMO_PASSWORD` yang Anda isi.
3. Jalankan alur utama: buat pesanan, ubah statusnya, cek dashboard dan laporan.
4. Buka `<URL-backend>/docs` untuk memastikan Swagger UI juga hidup.

## Catatan keamanan

- `SESSION_SECRET` di production wajib diisi. Backend akan menolak jalan tanpa itu.
- Cookie sesi otomatis `Secure` di production, artinya hanya terkirim lewat HTTPS. Jadi backend harus benar-benar HTTPS.
- Rate limit login berbasis IP. `TRUST_PROXY=true` wajib di hosting yang memakai proxy, supaya IP pengunjung terbaca benar. Kalau tidak, semua pengunjung dihitung sebagai satu IP.
- Jangan pakai data pelanggan nyata untuk demo. Data hasil seed semuanya fiktif.

## Update setelah kode berubah

Setiap kali skema database berubah:

1. Buat migrasi baru di lokal: `npx prisma migrate dev -w apps/api`
2. Commit folder `apps/api/prisma/migrations`.
3. Deploy backend lagi. Build command sudah memuat `prisma migrate deploy`, jadi migrasi ikut jalan.
