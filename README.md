# Iglesia App

Church management system — multi-congregation, multi-tenant.
React 19 + Vite frontend · Express 5 + TypeScript API · PostgreSQL.

## Requirements

- Docker + Docker Compose v2

## Quickstart

### 1. Configure environment

```bash
cp api/.env.example api/.env
```

Edit `api/.env` and set at minimum:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="a-long-random-secret"
JWT_REFRESH_SECRET="another-long-random-secret"
```

### 2. Launch

**With an external or local database** (DATABASE_URL points to your own postgres):

```bash
docker compose up --build
```

**With the included postgres container:**

```bash
docker compose --profile db up --build
```

When using the internal postgres, set `DATABASE_URL` in `.env` to:

```
postgresql://church_user:church_pass@postgres:5432/church_db
```

### 3. Access

| Service  | URL                   |
|----------|-----------------------|
| App      | http://localhost      |
| API      | http://localhost/api  |

On first boot the API runs `prisma db push` (creates all tables) and `npm run seed` (loads base data and roles). This takes ~10–15 seconds.

## What happens on startup

```
postgres  → ready
api       → prisma db push → npm run seed → node dist/index.js
app       → nginx serves the SPA, proxies /api/* → api:3000
```

## Development (without Docker)

```bash
# Terminal 1 — API
cd api && npm install && npm run dev   # http://localhost:3000

# Terminal 2 — App
cd web && npm install && npm run dev   # http://localhost:5173
```

Both require `api/.env` with a reachable `DATABASE_URL`.

## Environment variables

All variables live in `api/.env`. See `api/.env.example` for the full list.

| Variable               | Required | Description                        |
|------------------------|----------|------------------------------------|
| `DATABASE_URL`         | ✓        | PostgreSQL connection string       |
| `JWT_SECRET`           | ✓        | Access token signing secret        |
| `JWT_REFRESH_SECRET`   | ✓        | Refresh token signing secret       |
| `JWT_EXPIRES_IN`       |          | Access token TTL (default `15m`)   |
| `JWT_REFRESH_EXPIRES_IN` |        | Refresh token TTL (default `7d`)   |
| `PORT`                 |          | API port inside container (`3000`) |
