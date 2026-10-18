# ISSUE-003 — Autentikasi login/logout/me + middleware role

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 2

## Goal

Login dan logout berjalan dengan session cookie HttpOnly; endpoint dilindungi middleware auth + role.

## Scope

- `POST /auth/login` (Zod + bcrypt), `POST /auth/logout`, `GET /auth/me`
- Middleware `requireAuth` dan `requireRole("owner")`
- Rate limiting login (minimal disiapkan strukturnya; penuh di ISSUE-014)

## Acceptance Criteria

- [x] Login salah password → `401` dengan kode error jelas (diverifikasi: `INVALID_CREDENTIALS`)
- [x] Akses endpoint terproteksi tanpa cookie → `401` (`UNAUTHENTICATED`)
- [x] Staf akses endpoint owner-only → `403` (diverifikasi di ISSUE-004: POST /categories oleh staf = 403 `FORBIDDEN`)
- [x] Password disimpan hash (bcrypt), tidak pernah di-log

Catatan desain: sesi = JWT signed (HS256) di cookie HttpOnly/SameSite=Lax; logout membersihkan cookie di sisi klien (token stateless belum bisa dicabut server-side tanpa tabel sesi tambahan — cukup untuk MVP).

## Refs

- plan §3.1, §12 (keamanan minimum), §7 (endpoint auth)
