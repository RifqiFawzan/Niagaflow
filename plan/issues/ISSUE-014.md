# ISSUE-014 — Keamanan + OpenAPI + deployment

Status: todo | Priority: P1 | Milestone: Minggu 7

## Goal

MVP diamankan, terdokumentasi (OpenAPI), dan bisa didemokan online.

## Scope

- Rate limiting login penuh, CORS hanya untuk origin web, cookie `HttpOnly`/`SameSite`, `Secure` di production
- Dokumentasi API OpenAPI/Swagger dari skema Zod yang ada
- Deploy: frontend + backend + PostgreSQL terkelola; env vars diatur di hosting; akun demo fiktif
- README final: screenshot, ERD, cara setup, cara test, link demo

## Acceptance Criteria

- [ ] Tidak ada secret di Git (cek `git log -p` untuk `.env`)
- [ ] Swagger UI bisa dibuka dan semua endpoint terdaftar
- [ ] Demo online bisa login dengan akun demo dan menjalankan alur pesanan utama
- [ ] Rate limit login aktif (percobaan berulang dibatasi)

## Refs

- plan §12 (keamanan), §14 (isi README), §9 Minggu 7
