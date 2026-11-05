# Cara Deploy NiagaFlow (Vercel + Neon)

Panduan ini menjelaskan cara menaruh NiagaFlow online di Vercel supaya bisa didemokan.

**Status:** berkas konfigurasi sudah siap dan sudah diuji. Langkah di bawah ini **belum dijalankan** karena butuh akun Vercel milik pemilik proyek.

## Susunan yang dipakai

| Bagian | Layanan | Peran |
|---|---|---|
| Frontend | Vercel | Menyajikan berkas React hasil build |
| Backend | Vercel (project kedua) | Menjalankan API Express |
| Database | Neon | Menyimpan data PostgreSQL |

Frontend dan backend dibuat sebagai **dua project Vercel terpisah** dari repo yang sama. Alasannya: keduanya punya perintah build dan hasil keluaran yang berbeda.

Alamat yang akan terbentuk:

```
https://berniagaflows.vercel.app       <- frontend
https://berniaga-flows.vercel.app      <- backend
```

## Langkah 1 — Siapkan database di Neon

1. Buat akun di neon.tech, lalu buat project baru.
2. Salin **connection string**-nya. Bentuknya seperti ini:

   ```
   postgresql://user:password@ep-xxx.aws.neon.tech/niagaflow?sslmode=require
   ```

3. Pastikan ada `?sslmode=require` di akhir. Neon menolak koneksi tanpa SSL.
4. Simpan string ini, nanti dipakai di Langkah 2 dan 4.

## Langkah 2 — Deploy backend ke Vercel

Buat project Vercel **pertama** dari repo ini.

| Setelan | Nilai |
|---|---|
| **Root Directory** | `apps/api` |
| **Framework Preset** | Other (biarkan default bila tidak ada pilihan) |
| **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| **Output Directory** | biarkan kosong |
| **Install Command** | biarkan default |

Lalu isi **Environment Variables** berikut:

| Nama | Nilai |
|---|---|
| `DATABASE_URL` | Connection string dari Langkah 1 |
| `SESSION_SECRET` | String acak panjang, cara membuatnya di bawah |
| `SESSION_TTL_DAYS` | Umur sesi dalam hari (opsional, default `30`) |
| `WEB_ORIGIN` | `https://berniagaflows.vercel.app` (sesuaikan setelah Langkah 3) |
| `DEMO_PASSWORD` | Password akun demo, minimal 12 karakter |
| `TRUST_PROXY` | `true` |

Membuat `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Catatan:** `NODE_ENV` **tidak perlu diisi**. Vercel sudah menyetelnya ke `production` sendiri. Kalau diisi ulang, malah berisiko bentrok.

Setelah deploy selesai, uji backendnya: buka `https://berniaga-flows.vercel.app/api/v1/health`. Harus menjawab `200`.

## Langkah 3 — Isi data contoh

Jalankan dari komputer Anda, diarahkan ke database produksi:

```bash
cd apps/api
DATABASE_URL="connection-string-neon" \
DEMO_PASSWORD="password-demo-anda" \
NODE_ENV=production \
npx prisma db seed
```

Di PowerShell:

```powershell
cd apps/api
$env:DATABASE_URL="connection-string-neon"
$env:DEMO_PASSWORD="password-demo-anda"
$env:NODE_ENV="production"
npx prisma db seed
```

Seed akan **menolak jalan** kalau `DEMO_PASSWORD` kosong atau kurang dari 12 karakter. Ini sengaja: demo publik tidak boleh memakai password lemah.

## Langkah 4 — Deploy frontend ke Vercel

Buat project Vercel **kedua** dari repo yang sama.

| Setelan | Nilai |
|---|---|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Vite |
| **Build Command** | biarkan default (`npm run build`) |
| **Output Directory** | biarkan default (`dist`) |

Isi satu environment variable (opsional):

| Nama | Nilai |
|---|---|
| `VITE_DEMO_PASSWORD` | Password demo yang sama dengan `DEMO_PASSWORD` di backend. Dipakai tombol isi-otomatis "Pemilik"/"Staf" di halaman login |

**Jangan isi `VITE_API_URL`.** Frontend memanggil `/api/v1/...` di domainnya sendiri, lalu `vercel.json` meneruskan ke backend. Dengan begitu cookie sesi tetap first-party dan login bertahan di browser HP (Safari/Chrome memblokir cookie third-party).

Berkas `vercel.json` di folder `apps/web` sudah mengatur build, *rewrite* `/api/*` ke backend, dan *rewrite* halaman seperti `/orders/:id` supaya bisa dibuka langsung tanpa error 404. Bila URL backend berubah, ganti `destination` pada aturan `/api/:path*`.

**Penting:** kedua env di atas ditanam saat build. Kalau nanti diubah, frontend harus di-deploy ulang.

**Peringatan:** nilai berawalan `VITE_` ikut terkunci ke berkas JavaScript bundel dan terbaca siapa pun lewat browser. Jangan pernah meletakkan rahasia di sana. Karena itu tombol isi-otomatis hanya layak dipakai untuk akun demo, bukan akun sungguhan. Bila tidak ingin password demo terekspos, hapus saja baris `VITE_DEMO_PASSWORD` — tombol isi-otomatis akan kembali memakai `password123` dan secara otomatis tidak berguna di produksi.

## Langkah 5 — Sambungkan keduanya

1. Kembali ke project **backend**, ubah `WEB_ORIGIN` menjadi URL frontend yang sebenarnya.
2. Pastikan tidak ada garis miring di akhir (`https://niagaflow-web.vercel.app`, bukan dengan `/`).
3. Deploy ulang backend agar setelan baru terpakai.

Tanpa langkah ini, CORS akan menolak permintaan dari frontend dan login akan gagal.

## Langkah 6 — Uji hasilnya

1. Buka URL frontend.
2. Masuk dengan `owner@niagaflow.test` dan password = `DEMO_PASSWORD` yang Anda isi.
3. Jalankan alur utama: buat pesanan, ubah statusnya, cek dashboard dan laporan.
4. Buka `https://berniaga-flows.vercel.app/docs` untuk memastikan Swagger UI hidup.

## Catatan keamanan

- `SESSION_SECRET` wajib diisi di production. Backend menolak jalan tanpa itu.
- Cookie sesi otomatis `Secure` di production, jadi hanya terkirim lewat HTTPS. Vercel sudah HTTPS.
- Cookie sesi `SameSite=Lax` karena frontend dan backend satu domain lewat *rewrite* `/api/*`. Umur sesi default 30 hari (`SESSION_TTL_DAYS`). Jangan mengisi `VITE_API_URL`, karena cookie lintas domain (third-party) diblokir browser HP dan sesi akan selalu hilang.
- Rate limit login dihitung per IP. `TRUST_PROXY=true` wajib karena Vercel memakai proxy. Tanpa itu, semua pengunjung dihitung sebagai satu IP dan satu orang bisa memblokir semua.
- **Rate limit disimpan di memori.** Di Vercel, tiap instance fungsi punya memori sendiri, jadi batasnya tidak benar-benar global. Untuk demo portofolio ini memadai. Kalau nanti dipakai sungguhan, ganti ke Redis/Upstash.
- Jangan pakai data pelanggan nyata untuk demo. Data hasil seed semuanya fiktif.

## Update setelah kode berubah

Setiap kali skema database berubah:

1. Buat migrasi di lokal: `npx prisma migrate dev -w apps/api`
2. Commit folder `apps/api/prisma/migrations`.
3. Deploy ulang backend. Build Command sudah memuat `prisma migrate deploy`, jadi migrasi ikut jalan.

## Kalau ada masalah

| Gejala | Penyebab yang paling sering |
|---|---|
| Halaman 404 saat dibuka langsung | `vercel.json` belum ikut ter-deploy di project frontend |
| Login gagal, tidak ada pesan | `WEB_ORIGIN` di backend belum sama dengan URL frontend |
| Error CORS di console browser | Sama seperti di atas, atau ada garis miring di akhir URL |
| "SESSION_SECRET wajib di-set" | Env `SESSION_SECRET` belum diisi di project backend |
| Frontend memanggil localhost | Frontend belum di-deploy ulang, atau `apps/web/vercel.json` tidak ikut ter-deploy |
| Login sukses tapi langsung diminta login lagi | Cookie sesi tidak terkirim. Pastikan `VITE_API_URL` **tidak diisi** (frontend harus memakai `/api` di domainnya sendiri) dan aturan `/api/:path*` di `apps/web/vercel.json` mengarah ke URL backend yang benar |
| Sesi hilang hanya di HP, desktop normal | Gejala cookie third-party. Frontend masih memanggil domain backend langsung (`VITE_API_URL` terisi) — kosongkan lalu deploy ulang |
| Tombol demo mengisi password salah | Env `VITE_DEMO_PASSWORD` belum diisi di project frontend, atau frontend belum di-deploy ulang |
| Error koneksi database | Connection string kurang `?sslmode=require` |
