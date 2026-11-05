<div align="center">

# Iglesia App

**Sistema de gestión para iglesias — multi-congregación, multi-tenant.**

React 19 · Express 5 · TypeScript · PostgreSQL · Docker

</div>

---

## Requisitos

- [Docker](https://www.docker.com/) + Docker Compose v2

---

## Inicio rápido

### 1. Configurar el entorno

```bash
cp api/.env.example api/.env
```

Editá `api/.env` y completá como mínimo:

```env
DATABASE_URL="postgresql://usuario:contraseña@host:5432/base_de_datos"
JWT_SECRET="una-clave-secreta-larga"
JWT_REFRESH_SECRET="otra-clave-secreta-larga"
```

### 2. Levantar

**Con base de datos externa o local** (el `DATABASE_URL` apunta a tu propio PostgreSQL):

```bash
docker compose up --build
```

**Con el PostgreSQL incluido en Docker:**

```bash
docker compose --profile db up --build
```

> Si usás el postgres interno, el `DATABASE_URL` debe ser:
> ```
> postgresql://church_user:church_pass@postgres:5432/church_db
> ```

### 3. Acceder

| Servicio | URL                  |
|----------|----------------------|
| App      | http://localhost     |
| API      | http://localhost/api |

> En el primer arranque la API ejecuta `prisma db push` (crea todas las tablas) y `npm run seed` (carga roles y datos base). Esperá ~15 segundos.

---

## Qué pasa al iniciar

```
postgres  →  listo
api       →  prisma db push  →  npm run seed  →  node dist/index.js
web       →  nginx sirve la SPA, proxy /api/*  →  api:3000
```

---

## Desarrollo local (sin Docker)

```bash
# Terminal 1 — API
cd api && npm install && npm run dev    # http://localhost:3000

# Terminal 2 — Web
cd web && npm install && npm run dev    # http://localhost:5173
```

Ambos requieren `api/.env` con un `DATABASE_URL` accesible.

---

## Variables de entorno

Todas viven en `api/.env`. Ver `api/.env.example` para la lista completa.

| Variable                 | Requerida | Descripción                               |
|--------------------------|:---------:|-------------------------------------------|
| `DATABASE_URL`           | ✓         | Cadena de conexión PostgreSQL             |
| `JWT_SECRET`             | ✓         | Clave para firmar el access token         |
| `JWT_REFRESH_SECRET`     | ✓         | Clave para firmar el refresh token        |
| `JWT_EXPIRES_IN`         |           | TTL del access token (default `15m`)      |
| `JWT_REFRESH_EXPIRES_IN` |           | TTL del refresh token (default `7d`)      |
| `PORT`                   |           | Puerto de la API en el container (`3000`) |

---

## Estructura del proyecto

```
iglesia-app/
├── api/               # Backend — Express 5 + TypeScript + Prisma
├── web/               # Frontend — React 19 + Vite + TailwindCSS
├── docker-compose.yml # Orquestación de servicios
└── README.md
```
