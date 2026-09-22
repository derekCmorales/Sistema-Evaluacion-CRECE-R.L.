# Sistema Evaluación CRECE R.L.

Monorepo greenfield para **Cooperativa CRECE Guatemala, R.L.**: captación y evaluación de crédito (Next.js + NestJS + PostgreSQL).

Documentación en orden: **[docs/README.md](./docs/README.md)**. Contexto de negocio: **[docs/contexto.md](./docs/contexto.md)**.

## Requisitos

- Node.js ≥ 22 (recomendado **24 LTS**; imágenes `node:24-alpine`)
- pnpm 12 (`corepack enable` → `packageManager` 12.5.1)
- Docker Compose v2 (Postgres siempre; web+api con perfil `dev`)

## Inicio rápido e2e

```bash
cp .env.example .env
pnpm install
pnpm --filter @crece/shared --filter @crece/domain --filter @crece/application build

pnpm compose:db
pnpm dev:api          # http://localhost:3001/health
pnpm dev:web          # http://localhost:3000
pnpm test             # dominio + application + shared
```

```bash
curl -s http://localhost:3001/health
curl -s http://localhost:3001/approvals/policy
curl -s -X POST http://localhost:3001/operations/calc \
  -H 'content-type: application/json' \
  -d '{"amount":40000,"termMonths":24,"purpose":"Capital de trabajo ferretería","assessment":{"monthlySales":45000,"monthlyIncome":18000,"monthlyExpenses":9000,"existingDebtPayment":1500,"guaranteeValue":80000}}'
```

**Todo en Docker:** `pnpm compose:dev`. Detalle: **[docs/docker.md](./docs/docker.md)**.

## Estructura

```
apps/web                 Next.js 16.3.6
apps/api                 NestJS 12.0.4 (adaptadores HTTP + prisma/)
packages/domain          motor, política, checklist, puertos (testeable)
packages/application     RBAC y casos de uso
packages/shared          tipos y labels
openspec/specs/          contrato de producto
docs/                    índice e2e, contexto, uso, diagramas
```
