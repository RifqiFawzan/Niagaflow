# ISSUE-010 — Frontend shell + login + proteksi route

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 6

## Goal

Halaman login berfungsi, sesi tersimpan, route terlindungi, layout dashboard (sidebar + topbar) berdiri.

## Scope

- Route `/login`, `/dashboard`; komponen `AppLayout`, `Sidebar`, `Topbar`, `ProtectedRoute`, `RoleGuard`
- `AuthProvider` + query `/auth/me`; form login dengan loading/error state
- Komponen dasar: `LoadingState`, `EmptyState`, `ErrorState`, `Toast`

## Acceptance Criteria

- [x] Akses `/dashboard` tanpa sesi → redirect ke `/login` — verifikasi browser: `/` → `/login`
- [x] Login sukses → masuk `/dashboard`; logout kembali ke `/login` — verifikasi browser (owner + staf)
- [x] UI responsif (desktop + ponsel) untuk shell — sidebar desktop, drawer hamburger < lg
- [x] Loading & error state tampil saat cek sesi — "Memeriksa sesi..." (LoadingState), 401 me → redirect

Catatan verifikasi browser (Playwright via tab): RoleGuard staf buka `/reports` → redirect `/dashboard`; nav staf hanya Dashboard/Produk/Pesanan; dashboard menampilkan 4 kartu + pesanan terbaru + peringatan stok dari API nyata.

## Refs

- plan §8 (halaman & komponen reusable)
