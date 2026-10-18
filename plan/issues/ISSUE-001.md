# ISSUE-001 — Scaffold monorepo (web + api + health check + README)

Status: done (18 Okt 2026) | Priority: P0 | Milestone: Minggu 1

## Goal

Repo `niagaflow` berjalan: frontend tampil, backend merespons `/api/v1/health`, struktur workspace siap.

## Scope

- Root: `package.json` (npm workspaces), `.gitignore`, `README.md`, `.env.example`
- `apps/api`: Express + TypeScript, endpoint health check, Prisma terpasang (schema menyusul di ISSUE-002)
- `apps/web`: Vite + React + TS + Tailwind, halaman placeholder yang menampilkan status API (via proxy)

## Acceptance Criteria

- [x] `npm install` di root berhasil untuk semua workspace
- [x] `GET /api/v1/health` mengembalikan `{ success: true, data: { status: "ok" } }` (diverifikasi via server hasil build)
- [x] `vite build` sukses; proxy `/api` → `:4000` terkonfigurasi di dev server
- [x] `.env.example` ada; `.env` masuk `.gitignore`
- [x] README berisi cara setup lokal

Catatan: PostgreSQL belum terpasang di mesin dev — `prisma migrate dev` baru bisa dijalankan setelah DB tersedia (terkait ISSUE-002).

## Refs

- plan §5 (struktur repository), §16 (cara memulai hari pertama)
