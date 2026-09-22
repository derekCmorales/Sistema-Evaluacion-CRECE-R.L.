# Sistema Evaluación CRECE R.L.

Monorepo greenfield para **Cooperativa CRECE Guatemala, R.L.**: captación y evaluación de crédito con arquitectura limpia, PostgreSQL y documentación en español.

- **Web:** Next.js (`apps/web`)
- **API:** NestJS (`apps/api`)
- **Shared:** `@crece/shared`
- **Especificaciones:** OpenSpec en `openspec/`

Documentación: [AGENTS.md](./AGENTS.md) · [docs/](./docs/) · [CONTRIBUTING.md](./CONTRIBUTING.md)

## Requisitos

- Node.js ≥ 22 (recomendado 24 LTS; imágenes Docker usan `node:24-alpine`)
- [pnpm](https://pnpm.io/) 12 (`corepack enable`)
- Docker y Docker Compose (para base de datos y servicios containerizados)

Versiones pinadas y peers: [docs/stack.md](./docs/stack.md). Flujo de equipo: [docs/como-trabajar.md](./docs/como-trabajar.md). Diagramas para agentes: [docs/diagramas/README.md](./docs/diagramas/README.md) (Mermaid).

## Inicio rápido (local con pnpm)

```bash
cp .env.example .env   # ajustar contraseñas si lo desea
pnpm install
pnpm --filter @crece/shared build
pnpm dev:api           # API en http://localhost:3001
# en otra terminal:
pnpm dev:web           # Web en http://localhost:3000
```

Comprobar API:

```bash
curl -s http://localhost:3001/health
```

## Docker Compose

Base de datos (siempre disponible):

```bash
docker compose up -d db
docker compose ps
```

Perfil **dev** (API + web + db, con healthchecks):

```bash
docker compose --profile dev up --build
```

Variables: ver [.env.example](./.env.example). No commitear `.env` con secretos reales.

| Servicio | Puerto por defecto | Health |
|----------|-------------------|--------|
| `db` | 5432 | `pg_isready` |
| `api` | 3001 | `GET /health` |
| `web` | 3000 | HTTP 200 en `/` |

## Estructura

```
apps/web          # UI Next.js
apps/api          # API NestJS (domain / application / infrastructure)
packages/shared   # Tipos compartidos
docs/             # Arquitectura, autorización, cómo trabajar, stack
docs/diagramas/   # Mermaid (fuente agentes) + PNG Documento 1
openspec/         # Harness spec-driven (proponer / aplicar cambios)
```

## Licencia y contexto

Proyecto académico-práctica en colaboración con CRECE. Producción y cuentas de nube son responsabilidad de la cooperativa.
