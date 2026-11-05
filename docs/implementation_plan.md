# Plan de implementación — Completar módulos faltantes (CRM Iglesia)

> Stack real: **Backend** Express 5 + TypeScript + Prisma 7 (`church-api`) · **Frontend** React 19 + Vite + Zustand + Tailwind (`church-app`).
> El schema Prisma ya contiene los 33 modelos con sus relaciones — **no se modifica el schema**. El trabajo es: rutas API + páginas/stores + RBAC (seed) + wiring de navegación.

## Convenciones que se respetan (clonadas del código existente)

**Backend** — 1 router por dominio en `src/routes/*.ts`, montado en `src/index.ts`:
- Middlewares por handler: `authenticateToken`, `requirePermission('<recurso>','<accion>')`, filtro multi-tenant con `getCongregacionFilter(req.user)`.
- Respuestas SIEMPRE con `ApiResponse.*` + `sendResponse(res, ...)` (envelope `{ success, mensaje, data, error }`).
- Estados dinámicos: nunca hardcodear `id_estado`; resolver con `getEstadoByCodigo(entidad, codigo)`. Soft-delete = setear estado `ELIMINADO`/`BAJA`/`ANULADO`.
- Endpoints auxiliares: `/listado/estados`, `/listado/congregaciones`, etc.

**Frontend** — store Zustand por dominio (patrón `inventoryStore.js`), `api` axios singleton, unwrap `response.data?.success ? response.data.data : <fallback>`, toasts con `sonner`. Nav: agregar key a `Layout.jsx` (`navItems`) + `authStore.js` (`getAllowedTabs`) + ruta en `AppRoutes.jsx`.

---

## Entregables

### A. Backend — nuevos routers (montar en `src/index.ts`)

| # | Archivo | Endpoint base | recurso RBAC | Modelos | Estados (entidad) |
|---|---------|---------------|--------------|---------|-------------------|
| A1 | `routes/familia.ts` | `/api/familia` | `familia` | RelacionFamiliar, TipoRelacionFamiliar | — (sin estado) |
| A2 | `routes/espiritual.ts` | `/api/espiritual` | `espiritual` | HistorialEspiritual, TipoHito | — |
| A3 | `routes/pastoral.ts` | `/api/pastoral` | `pastoral` | VisitaPastoral, PeticionOracion | VISITA_PASTORAL, PETICION_ORACION |
| A4 | `routes/comunicaciones.ts` | `/api/comunicaciones` | `comunicaciones` (ya seedeado) | Comunicacion | COMUNICACION |
| A5 | `routes/documentos.ts` | `/api/documentos` | `documentos` | Documento | DOCUMENTO |
| A6 | `routes/auditoria.ts` | `/api/auditoria` | `auditoria` (solo lectura, ADMIN+) | AuditoriaLog | — |

Cada router incluye: `GET /` (listado con filtro de congregación vía relación), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` (soft-delete donde haya estado; hard-delete en relaciones puras como RelacionFamiliar), más `/listado/*` para selects. Auditoría es solo `GET` (listado + filtros por tabla/usuario/fecha).

### B. Backend — extensión de routers existentes

| # | Archivo | Agrega | Modelos |
|---|---------|--------|---------|
| B1 | `routes/eventos.ts` | sub-recursos **asistencia** (`GET/POST/DELETE /:id/asistencia`) y **servicios** (`/:id/servicios`) | AsistenciaEvento, Servicio, RolServicio |
| B2 | `routes/finanzas.ts` | **ofrendas/diezmos** (`/ofrendas`) y **presupuestos** (`/presupuestos`) | OfrendaDizmo, Presupuesto |
| B3 | `routes/instituciones.ts` | **cargos** (`/:id/cargos`) | CargoInstitucion |

### C. Seed RBAC + estados (`prisma/seed-full.ts`, y `seed.ts` si aplica)

- **Nuevas entidades de estado** (con códigos base ACTIVO/INACTIVO/… + un estado final): `VISITA_PASTORAL` (PROGRAMADA, REALIZADA, CANCELADA), `PETICION_ORACION` (ACTIVA, RESPONDIDA, CERRADA), `COMUNICACION` (BORRADOR, ENVIADA, ANULADA), `DOCUMENTO` (VIGENTE, ANULADO), `CARGO_INSTITUCION` (ACTIVO, FINALIZADO).
- **Nuevos `permiso.recurso`**: `familia`, `espiritual`, `pastoral`, `documentos`, `auditoria` (cada uno con acciones crear/leer/actualizar/eliminar; auditoria solo `leer`). Asignarlos a los roles correspondientes.
- ⚠️ Requiere re-ejecutar el seed contra la DB (`npx ts-node prisma/seed.ts`), que necesita PostgreSQL corriendo. El schema NO cambia → no hace falta `prisma db push`.

### D. Frontend — páginas + stores + wiring

| # | Página | Store | Tab key | Nivel |
|---|--------|-------|---------|-------|
| D1 | `pages/Family.jsx` | `familyStore.js` | `family` | ADMIN+ |
| D2 | `pages/Spiritual.jsx` | `spiritualStore.js` | `spiritual` | ADMIN+ |
| D3 | `pages/Pastoral.jsx` | `pastoralStore.js` | `pastoral` | ADMIN+ |
| D4 | `pages/Communications.jsx` | `communicationStore.js` | `communications` | ADMIN+ |
| D5 | `pages/Documents.jsx` | `documentStore.js` | `documents` | ADMIN+ |
| D6 | `pages/Audit.jsx` | `auditStore.js` | `audit` | SUPERADMIN |
| D7 | extender `Events.jsx` | asistencia/servicios | — | — |
| D8 | extender `Finances.jsx` | ofrendas/presupuestos | — | — |

**Wiring** (3 archivos): `AppRoutes.jsx` (rutas), `Layout.jsx` (`navItems`), `authStore.js` (`getAllowedTabs`). Mantener en sync el `getAllowedTabs` del backend (`middleware/permissions.ts`).

---

## Orden de ejecución sugerido (por fases, para revisar incrementalmente)

1. **Fase A — Familia + Espiritual + Pastoral** (núcleo pastoral/membresía): A1, A2, A3 + D1, D2, D3 + seed parcial + wiring.
2. **Fase B — Comunicaciones + Documentos + Auditoría**: A4, A5, A6 + D4, D5, D6 + seed.
3. **Fase C — Economía avanzada + Eventos**: B1, B2, B3 + D7, D8 + seed.
4. **Revisión + validación** tras cada fase: build TS (`npm run build` en church-api), lint (`npm run lint` en church-app), prueba manual de flujos.

## Riesgos / notas
- El seed necesita DB PostgreSQL activa; sin ella, el código compila pero los nuevos estados/permisos no existirán en runtime.
- `dist/` está commiteado en church-api: tras cambios hay que recompilar para que `npm start` los tome (en `dev` con ts-node no hace falta).
- Hay desincronización de idioma entre el `getAllowedTabs` del backend (claves en español) y el del frontend (inglés) — se documenta pero no se "arregla" salvo que se pida.
