# ISSUE-021 — Ganti tema primer #2563EB + font Inter

Status: done | Priority: P2 | Selesai: 31 Okt 2026

Sumber: `plan/POS_UI_UX_Guideline.md` §10 (palet "Primary `#2563EB`", aturan visual
"font ... misalnya Inter"). Tahap B paket terakhir dari audit `plan/audit-pos-uiux.md`
(P2 no. 13). Screenshot README ikut diulang mengikuti backlog.

## Goal

Primer aplikasi biru `#2563EB` (bukan slate gelap) dan teks memakai font Inter,
sesuai pedoman; dokumentasi README diperbarui dengan screenshot baru bertema baru.

## Asumsi keputusan (default konvensional, tidak ada jawaban khusus dari user)

- **Hanya primer + font** (lingkup temuan 13): `--primary`, `--ring`,
  `--sidebar-primary`, `--sidebar-ring` → `oklch(0.546 0.245 262.881)` (= `#2563EB`,
  biru-600 Tailwind) dengan teks putih. Ikon/logo/link biru ikut otomatis lewat token.
- **Token lain tidak diubah**: danger sudah persis `#DC2626`, status hijau/merah/kuning
  pada kartu produk & badge sudah dekat pedoman, latar halaman sudah putih + `muted`
  slate-50 (setara `#F8FAFC`), radius kartu tetap 10px. Mengubahnya di luar lingkup
  temuan 13 hanya menambah risiko regresi visual.
- **Varian gelap** (`@media`/kelas `.dark`) disamakan warna primernya agar tetap
  koheren; aplikasi saat ini memang belum punya sakelar gelap.
- **Font Inter dipaket via `@fontsource-variable/inter`** (self-hosted): satu paket
  kecil, tanpa permintaan ke Google Fonts saat runtime (hemat & aman dari CORS/CSP),
  fallback ke system font bila gagal muat.
- Screenshot README diambil ulang dari app lokal (login owner) dengan viewport
  **1440×900** — ukuran sama dengan screenshot lama.

## Scope

### Frontend

- `apps/web/src/index.css`:
  - Impor `@fontsource-variable/inter`.
  - Token primer (terang + gelap), ring, sidebar-primary, sidebar-ring → biru-600.
  - `@theme inline`: `--font-sans` diisi `"Inter Variable"` + fallback system.
- `apps/web/package.json` + `package-lock.json`: dependensi baru
  `@fontsource-variable/inter`.
- `docs/screenshots/*.png`: dashboard, produk, pesanan, laporan diambil ulang
  (1440×900, tema biru + Inter).

### Dokumentasi

- `plan/audit-pos-uiux.md`: temuan 13 ditandai selesai; ringkasan tahap diperbarui.

## Acceptance Criteria

- [x] Warna aksi utama (tombol primer, link, indikator menu aktif) biru `#2563EB`
- [x] Seluruh halaman memakai font Inter (self-hosted, fallback system font)
- [x] Kontras teks tombol primer tetap lolos (putih di atas biru-600)
- [x] Typecheck + build web hijau
- [x] Screenshot README diambil ulang dengan tema baru (1440×900)

## Verifikasi (31 Okt 2026, lokal, browser + build)

| AC | Cara uji | Hasil |
|---|---|---|
| Token primer | Eval `getComputedStyle` di `/dashboard` | Lulus. `--primary: oklch(0.546 0.245 262.881)` = `#2563EB`. |
| Font Inter | Eval `document.fonts` setelah login | Lulus. Keluarga terdaftar & termuat: "Inter Variable"; `body` memakai `"Inter Variable", ui-sans-serif, ...`. |
| Visual | Login owner → cek dashboard, produk, pesanan, laporan | Lulus. Tombol "Masukkan stok baru", link "Lihat semua", logo, badge stok kini biru; teks Inter. |
| Screenshot | Ambil ulang 4 layar via playwright viewport 1440×900 | Lulus. Empat file `docs/screenshots/*.png` = 1440×900, tema biru. |
| Typecheck/build | `npm run typecheck -w apps/web`, `npm run build -w apps/web` | Lulus. |
| Konsol | `console error` saat uji browser | Bersih (hanya 401 `/auth/me` saat layar masuk & favicon 404 — sudah ada sebelumnya, bukan dari tema ini). |

## Perubahan kode

- `apps/web/src/index.css`
- `apps/web/package.json`, `package-lock.json`
- `docs/screenshots/dashboard.png`, `produk.png`, `pesanan.png`, `laporan.png`
- `plan/audit-pos-uiux.md` (temuan 13, ringkasan tahap)

## Catatan / sisa

- Tema gelap (`--primary` di blok gelap) ikut disamakan tapi belum pernah ditampilkan
  (belum ada sakelar mode gelap) — bila suatu saat ditambahkan, uji ulang kontras.
- Sisa audit setelah isu ini: tidak ada lagi di Tahap B; sisa P3 (PDF, notifikasi,
  profil/ganti password sendiri) menunggu keputusan Anda di backlog.

## Refs

- `plan/POS_UI_UX_Guideline.md` §10 (palet warna, aturan visual)
- `plan/audit-pos-uiux.md` temuan P2 no. 13
