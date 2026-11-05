# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend SPA for church administration ("Iglesia"): members, congregations, institutions, finances, events, inventory, and users. React 19 + Vite + Zustand + TailwindCSS + React Router 7. No TypeScript, no test framework configured. UI strings and comments are in Spanish; code identifiers in English/camelCase.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # production build -> dist/
npm run lint     # ESLint over the repo
npm run preview  # serve the production build
```

The backend API base URL comes from `VITE_API_URL` (defaults to `http://localhost:3000/api` — see `src/services/api.js`). Set it in `.env` at the project root.

## Architecture

**Routing & auth gate** (`src/routes/AppRoutes.jsx`): All app routes are nested under `<PrivateRoute>` → `<Layout>`. `PrivateRoute` (`src/routes/PrivateRoute.jsx`) re-validates the JWT on mount via `authStore.fetchUser()` (calls `/auth/me`) and redirects to `/login` if unauthenticated. `Layout` (`src/components/Layout.jsx`) renders the nav + `<Outlet/>`.

**Auth & authorization** (`src/store/authStore.js`): JWT is stored in `localStorage` under `token` and attached to every request by the axios request interceptor. Authorization is role-based on three levels — `USUARIO`, `ADMIN`, `SUPERADMIN`. `getAllowedTabs(nivel)` maps each level to a list of permitted tabs (`allowedTabs`); `Layout` filters nav items against this list. When adding a new feature page, also add its tab key to the relevant levels in `getAllowedTabs` AND to `navItems` in `Layout.jsx`, or it won't be reachable.

**API layer** (`src/services/api.js`): A single shared axios instance. Request interceptor injects the bearer token; response interceptor handles `401` by clearing the token and hard-redirecting to `/login`.

**Backend `ApiResponse` envelope** — critical convention: every backend response is shaped `{ success, mensaje, data }`. Always unwrap as `response.data?.success ? response.data.data : <fallback>` and read error text from `error.response?.data?.mensaje || error.response?.data?.error`. This pattern is repeated throughout stores and pages — follow it exactly.

**State management — dual pattern (be aware):**
- `src/store/*.js` are Zustand stores (`useMemberStore`, `useAuthStore`, etc.). Async actions set `{ loading, error }` and return `{ success, message }` objects rather than throwing.
- However, several **pages do NOT use the matching store** — e.g. `Members.jsx` manages its own local `useState` and calls `api` directly, duplicating store logic. When editing a page, check whether it uses its store or local state and stay consistent with that file rather than mixing the two.

**Lazy options loading** (`src/hooks/useOpciones.js`): Dropdown/filter options (estados, tipos, etc.) are loaded on demand (e.g. when opening a modal) instead of at page load, to avoid eager `/opciones` fetches.

**Toasts**: `sonner` is mounted globally in `App.jsx`. Use `toast.error/success` for user feedback. The api response interceptor only auto-toasts genuine network errors — backend `success: false` responses are expected to be handled by the calling component.

## Conventions

- Spanish API endpoints despite English code: `/miembros`, `/auth/login`, `/miembros/listado/estados`, etc.
- Backend entity IDs use Spanish keys like `id_miembro` (not `id`) — match the field the backend returns when updating lists.
- ESLint `no-unused-vars` ignores identifiers matching `^[A-Z_]` (PascalCase/constants).
- See `AGENTS.md` for detailed code-style guidelines (import order, naming tables, store/component templates).
