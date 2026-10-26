# ISSUE-018 — POS: metode bayar, uang diterima/kembalian, diskon Rp/%

Status: done | Priority: P0 | Selesai: 26 Okt 2026

Sumber: `plan/POS_UI_UX_Guideline.md` §8 (POS: "Tombol pembayaran paling menonjol",
"Modal pembayaran berisi metode pembayaran, jumlah diterima, dan kembalian jika relevan",
"Diskon … nominal atau persen"), §10.3–§10.12, §17.2. Tahap B paket 1 dari audit
`plan/audit-pos-uiux.md` (temuan P0 no. 1–3, P2 no. 9).

## Goal

Pesanan bisa dicatat dengan metode bayar, uang diterima + kembalian (untuk tunai), dan
diskon yang bisa dipilih nominal (Rp) atau persen (%).

## Asumsi keputusan (default konvensional, tidak ada jawaban khusus dari user)

- **Metode bayar**: Tunai, QRIS, Transfer. Pesanan lama dibiarkan NULL → tampil
  "Belum dicatat".
- **`paymentMethod` opsional di API** (kompatibel dengan test/klien lama); UI selalu
  mengirim nilai (default Tunai).
- **`amountPaid` (uang diterima) opsional**; bila diisi wajib ≥ total — server menolak
  dengan `PAYMENT_INSUFFICIENT` dalam transaksi yang sama (rollback penuh).
- **Diskon tetap per pesanan (order-level)**, bukan per item — pedoman §8 hanya
  mensyaratkan "diskon" dalam kelompok subtotal/diskon/total. Diskon per item / harga
  coret produk di luar lingkup (butuh kolom di produk & OrderItem) — dicatat sebagai
  sisa di audit no. 3.
- **Kembalian dihitung klien** dari `amountPaid − total` (tidak disimpan; angka bisa
  ditampilkan ulang tanpa kolom baru).
- **Tombol tetap "Simpan pesanan"** — pesanan dibuat berstatus `pending`, pembayaran
  baru "selesai" saat `completed`; label "Bayar" akan menyesatkan.
- Halaman POS terpisah **tidak dibuat**: `/orders/new` sudah 2 panel sesuai §8
  (koreksi temuan no. 1 di audit).

## Scope

### DB (migrasi `20261026141319_add_payment_method`)

- Enum baru `PaymentMethod { TUNAI, QRIS, TRANSFER }`.
- `Order.paymentMethod PaymentMethod? @map("payment_method")` (nullable — pesanan lama).
- `Order.amountPaid Decimal? @map("amount_paid") @db.Decimal(12, 2)`.

### Backend

- `orders.routes.ts`: input `paymentMethod` + `amountPaid` di `createOrderSchema`;
  validasi `amountPaid < total` → `400 PAYMENT_INSUFFICIENT`; kedua nilai ikut
  `tx.order.create`.
- `serialize.ts`: `amountPaid` (Decimal → number, nullable), mengikuti konvensi rupiah.
- OpenAPI: `orderSchema` + `orderInput` diperkaya `paymentMethod`/`amountPaid`.

### Frontend

- `types/index.ts`: tipe `PaymentMethod` + `PAYMENT_METHOD_LABELS` (Tunai/QRIS/Transfer);
  `Order` + `paymentMethod`, `amountPaid`.
- `OrderCreatePage.tsx`:
  - **Diskon**: dropdown tipe `Rp`/`%` (default Rp) — nilai persen dihitung ke nominal
    sebelum submit (kontrak API tetap integer rupiah); pratinjau "Nilai diskon: Rp X"
    untuk mode persen.
  - **Pembayaran**: Select metode bayar (default Tunai); bila Tunai tampil input
    "Uang diterima" + kembalian live di bawah input **dan** baris di ringkasan
    (Subtotal → Diskon → Perkiraan total → Kembalian, dikelompokkan sesuai §8).
  - Validasi: angka bulat, uang diterima ≥ total.
- `OrderDetailPage.tsx`: kartu **Pembayaran** (metode, uang diterima, kembalian;
  keterangan bila tidak dicatat / non-tunai).

### Test

- `orders-reports.test.ts`: 2 test baru → 42 lulus:
  - `mencatat metode bayar dan uang diterima (number)` — create + cek DB + cek detail.
  - `menolak uang diterima kurang dari total (PAYMENT_INSUFFICIENT)` — 400 + transaksi
    rollback (order count 0).

## Acceptance Criteria

- [x] Buat pesanan bisa memilih metode bayar (Tunai/QRIS/Transfer)
- [x] Tunai: input uang diterima → kembalian tampil live; uang diterima < total ditolak
- [x] Diskon bisa nominal (Rp) atau persen (%)
- [x] Detail pesanan menampilkan metode bayar + uang diterima + kembalian
- [x] Pesanan lama (tanpa metode) tidak rusak — tampil "Belum dicatat"
- [x] Typecheck + build web hijau; 42 test API lulus

## Verifikasi (26 Okt 2026, lokal)

| AC | Cara uji | Hasil |
|---|---|---|
| Metode + uang diterima | Browser: Keripik Rp15.000, diskon 10%, uang diterima Rp20.000 → simpan | Lulus. Detail menampilkan Tunai / Rp20.000 / kembalian Rp6.500; total Rp13.500 (diskon Rp1.500). |
| Data server | `GET /api/v1/orders/:id` | Lulus. `paymentMethod:"TUNAI"`, `amountPaid:20000` (number), `discount:1500`, `total:13500`, `status:"pending"`. |
| Ringkasan + kembalian | Eval DOM halaman buat pesanan | Lulus. Baris Kembalian muncul di ringkasan dan inline (Rp5.000 saat uang Rp20.000 vs total Rp15.000). |
| Tolak uang kurang | Test API `amountPaid25000` vs total 30000 | Lulus. 400 `PAYMENT_INSUFFICIENT`, order tidak tersimpan. |
| Pesanan lama | Test list/detail sebelum kolom diisi | Lulus. Field nullable, tidak ada error (test lama tetap 40 lulus tanpa ubah). |
| Typecheck/build/test | `npm run typecheck -w apps/api -w apps/web`, `npm run build -w apps/web`, `npm run test -w apps/api` | Lulus. 42 test; build hijau (peringatan chunk Recharts lama). |
| Regresi alur | Batalkan pesanan uji → stok Keripik kembali 44 | Lulus. |

## Perubahan kode

- `apps/api/prisma/schema.prisma` + `prisma/migrations/20261026141319_add_payment_method/`
- `apps/api/src/modules/orders/orders.routes.ts`
- `apps/api/src/utils/serialize.ts`
- `apps/api/src/docs/openapi-schemas.ts`
- `apps/api/tests/orders-reports.test.ts`
- `apps/web/src/types/index.ts`
- `apps/web/src/features/orders/OrderCreatePage.tsx`
- `apps/web/src/features/orders/OrderDetailPage.tsx`
- `plan/audit-pos-uiux.md` (temuan 1, 2, 3, 9 + §1 ringkasan)

## Catatan / sisa

- **Bug saat verifikasi (bukan bug kode):** Vite dev menyajikan modul lama setelah edit
  atomik (watcher Windows) — baris Kembalian di ringkasan tidak muncul walau sudah ada
  di file. Restart server web menyelesaikan. Kalau HMR aneh di lokal → restart Vite.
- Diskon per item / harga coret produk belum (lihat asumsi; audit no. 3 "sebagian").
- Kolom daftar pesanan (`OrderListPage`) tidak menampilkan metode bayar — §8.2 hanya
  mensyaratkan tampilan di detail; ditambah bila diminta.

## Refs

- `plan/POS_UI_UX_Guideline.md` §8 (POS), §10.3–§10.12 (input & diskon), §17.2
- `plan/audit-pos-uiux.md` temuan P0 no. 1–3, P2 no. 9
