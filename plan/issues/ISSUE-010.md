# ISSUE-010 — Frontend shell + login + proteksi route

Status: todo | Priority: P0 | Milestone: Minggu 6

## Goal

Halaman login berfungsi, sesi tersimpan, route terlindungi, layout dashboard (sidebar + topbar) berdiri.

## Scope

- Route `/login`, `/dashboard`; komponen `AppLayout`, `Sidebar`, `Topbar`, `ProtectedRoute`, `RoleGuard`
- `AuthProvider` + query `/auth/me`; form login dengan loading/error state
- Komponen dasar: `LoadingState`, `EmptyState`, `ErrorState`, `Toast`

## Acceptance Criteria

- [ ] Akses `/dashboard` tanpa sesi → redirect ke `/login`
- [ ] Login sukses → masuk `/dashboard`; logout kembali ke `/login`
- [ ] UI responsif (desktop + ponsel) untuk shell
- [ ] Loading & error state tampil saat cek sesi

## Refs

- plan §8 (halaman & komponen reusable)
