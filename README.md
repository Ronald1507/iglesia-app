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

Editá `api/.env` con tus valores:

```env
DATABASE_URL="postgresql://church_user:church_pass@postgres:5432/church_db"
JWT_SECRET="una-clave-secreta-larga"
JWT_REFRESH_SECRET="otra-clave-secreta-larga"
```

> `postgres` es el nombre del servicio dentro de Docker — no cambiar ese host.

### 2. Levantar

```bash
docker compose up --build
```

### 3. Acceder

| Servicio | URL                  |
|----------|----------------------|
| App      | http://localhost     |
| API      | http://localhost/api |

> En el primer arranque la API crea todas las tablas y carga los datos base. Esperá ~15 segundos.

---

## Qué levanta Docker

```
postgres  →  base de datos (puerto 5432)
api       →  prisma db push → seed → Express en puerto 3000
web       →  nginx sirve la SPA, proxy /api/* → api:3000
```

Cada servicio corre en su propio contenedor. Los datos de postgres se persisten en un volumen Docker.

---

## Desarrollo local (sin Docker)

```bash
# Terminal 1 — API
cd api && npm install && npm run dev    # http://localhost:3000

# Terminal 2 — Web
cd web && npm install && npm run dev    # http://localhost:5173
```

Requiere `api/.env` con un `DATABASE_URL` accesible desde tu máquina.

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
├── docker-compose.yml # Orquesta los 3 contenedores
└── README.md
```
