# Sistema Evaluación CRECE R.L.

Monorepo greenfield para **Cooperativa CRECE Guatemala, R.L.**: captación y evaluación de crédito (Next.js + NestJS + PostgreSQL).

Documentación en orden: **[docs/README.md](./docs/README.md)** (índice e2e).

## Requisitos

- Node.js ≥ 22 (recomendado **24 LTS**; imágenes `node:24-alpine`)
- pnpm 12 (`corepack enable` → `packageManager` 12.5.1)
- Docker Compose v2 (Postgres siempre; web+api con perfil `dev`)

## Inicio rápido e2e

```bash
cp .env.example .env
pnpm install
pnpm --filter @crece/shared build

# 1) Postgres
pnpm compose:db
# 2) API y web en el host
pnpm dev:api          # http://localhost:3001/health
pnpm dev:web          # http://localhost:3000
```

```bash
curl -s http://localhost:3001/health
# {"status":"ok","service":"crece-api",...}
```

**Todo en Docker** (build de imágenes + healthchecks encadenados):

```bash
pnpm compose:dev
# equivale a: docker compose --profile dev up --build
```

Detalle de servicios, volúmenes PG 18 y `.env`: **[docs/docker.md](./docs/docker.md)**.

| Servicio Compose | Puerto | Health |
|------------------|--------|--------|
| `db` | 5432 | `pg_isready` |
| `api` (perfil `dev`) | 3001 | `GET /health` |
| `web` (perfil `dev`) | 3000 | `/` contiene CRECE |

`docker compose up` **sin** `--profile dev` solo arranca **Postgres**.

## Estructura

```
apps/web              Next.js 16.3.6
apps/api              NestJS 12.0.4 (domain / application / infrastructure)
packages/shared       Tipos compartidos
docker-compose.yml    db + api + web
docs/                 Índice e2e, stack, docker, dominio
docs/diagramas/       Mermaid (agentes) + PNG Documento 1
openspec/             Harness spec-driven
```
