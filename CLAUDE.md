# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace layout

This directory ("Proyecto Iglesia") is a workspace for a multi-congregation church management system, split into two **separately git-versioned** projects (each has its own `.git`, `.env`, and `node_modules` — the workspace root is not itself a repo):

- **`api/`** — REST API backend. Express 5 + TypeScript, Prisma 7 over PostgreSQL. Runs on port 3000. See `api/CLAUDE.md`.
- **`web/`** — Frontend SPA. React 19 + Vite + Zustand + TailwindCSS + React Router 7 (no TypeScript). Runs on port 5173. See `web/CLAUDE.md`.

Each subproject has its own `CLAUDE.md` (architecture) and `AGENTS.md` (code-style templates). **Read the relevant subproject's `CLAUDE.md` before working in it** — those files carry the detail; this one only covers what spans both.

There is no shared root `package.json` — `npm install`/`npm run *` are run from inside each subproject, not the root.

## Running the full stack

Two terminals, started backend-first (the app calls the API):

```bash
cd api && npm run dev    # API at http://localhost:3000  (ts-node, no build step)
cd web && npm run dev    # SPA at http://localhost:5173  (Vite)
```

The frontend's `VITE_API_URL` must point at the backend (defaults to `http://localhost:3000/api`).

Neither project has a test runner or (for the backend) a linter configured. Frontend lint: `cd web && npm run lint`.

## Conventions that cross the API/app boundary

These must stay in sync on both sides — changing one side usually means changing the other:

- **Spanish domain language.** Models, API endpoints, DB columns, and user-facing strings are Spanish (`/miembros`, `id_miembro`, `mensaje`); code identifiers are English camelCase. Keep new code consistent.
- **`ApiResponse` envelope.** Every backend response is `{ success, mensaje, data, error }` (backend builds it via `src/utils/response.ts`; frontend unwraps as `response.data?.success ? response.data.data : <fallback>`). Don't return raw JSON from a route or assume an unwrapped shape on the client.
- **Three-tier auth.** Levels are `USUARIO` < `ADMIN` < `SUPERADMIN`. The JWT is issued by the API and stored in the browser's `localStorage` under `token`, sent as `Authorization: Bearer <token>`. ADMIN/SUPERADMIN bypass fine-grained permission checks; only `USUARIO` accounts are gated by RBAC. The frontend mirrors these levels in `getAllowedTabs` to decide which nav tabs/pages are reachable.
- **Congregation multi-tenancy.** Most data is scoped to a `congregacion`; non-admins only see their own. The backend enforces this in every query (`getCongregacionFilter`); the frontend assumes results are already scoped.
- **Adding a feature end-to-end** typically touches: a backend route in `api/src/routes/` (mounted in `src/index.ts`) + any `estado` codes, and a frontend page/store plus its tab registration in `getAllowedTabs` and `Layout.jsx`.
