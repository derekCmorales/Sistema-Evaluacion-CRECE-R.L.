# Docker (Compose + imágenes)

Hay **tres servicios** en [`docker-compose.yml`](../docker-compose.yml):

| Servicio | Imagen / build | Puerto | Healthcheck | Cuándo arranca |
|----------|----------------|--------|-------------|----------------|
| `db` | `postgres:18-alpine` | 5432 | `pg_isready` | Siempre (`docker compose up`) |
| `api` | [`apps/api/Dockerfile`](../apps/api/Dockerfile) | 3001 | `GET /health` → `"status":"ok"` | Perfil **`dev`** |
| `web` | [`apps/web/Dockerfile`](../apps/web/Dockerfile) | 3000 | HTML de `/` contiene `CRECE` | Perfil **`dev`** (espera API healthy) |

`docker compose up` **sin perfil solo levanta Postgres**. Eso es intencional: desarrollo local con `pnpm dev:api` + `pnpm dev:web` contra la DB en Docker.

## Recorrido e2e

**A. Solo base de datos + apps en el host (día a día)**

```bash
cp .env.example .env
# DATABASE_URL ya apunta a localhost:5432
docker compose up -d db
docker compose ps   # db healthy
pnpm install
pnpm --filter @crece/shared --filter @crece/domain --filter @crece/application build
pnpm dev:api        # http://localhost:3001/health
pnpm dev:web        # http://localhost:3000
curl -s http://localhost:3001/health
```

**B. Stack completo en contenedores**

Compose inyecta `DATABASE_URL` con host `db` (no hace falta editar `.env` para eso).

```bash
cp .env.example .env
docker compose --profile dev up --build
# db → api (health) → web (health)
curl -s http://localhost:3001/health
curl -sI http://localhost:3000
```

Atajos desde la raíz: `pnpm compose:db` y `pnpm compose:dev`.

## Archivos

| Archivo | Rol |
|---------|-----|
| `docker-compose.yml` | Orquestación, healthchecks, volumen PG 18 |
| `apps/api/Dockerfile` | Build pnpm + `pnpm deploy` → `node dist/main.js` |
| `apps/web/Dockerfile` | Next `output: "standalone"` |
| `.dockerignore` | Evita mandar `node_modules`, `.next`, PNG, harness al contexto |
| `.env.example` | Variables sin secretos; host `localhost` para el flujo A |

## PostgreSQL 18

El volumen **debe** montarse en `/var/lib/postgresql` (cambio oficial de la imagen 18). No usar `/var/lib/postgresql/data`.

## Notas

- Node en imágenes: **24-alpine** (LTS). pnpm **12.5.1** vía corepack.
- `NEXT_PUBLIC_API_URL=http://localhost:3001`: el **navegador** llama a la API en el host.
- API escucha `0.0.0.0` (`apps/api/src/main.ts`) para healthchecks y Compose.
- No hay ORM todavía: `DATABASE_URL` queda cableada para cuando exista persistencia.
