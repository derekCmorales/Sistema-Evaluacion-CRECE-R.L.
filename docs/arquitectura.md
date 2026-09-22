# Arquitectura

Monorepo **pnpm** para Cooperativa CRECE Guatemala, R.L. — sistema interno de captación y evaluación (greenfield).

## Contenedores

```
┌──────────────┐     HTTPS      ┌─────────────────┐
│ Landing       │ ─────────────► │ apps/web         │
│ (repo aparte) │   prospecto    │ Next.js App Router│
└──────────────┘                 └────────┬─────────┘
                                          │ REST
                                 ┌────────▼─────────┐
                                 │ apps/api NestJS   │
                                 │ modules → application → domain
                                 └────────┬─────────┘
                                          │
                                 ┌────────▼─────────┐
                                 │ PostgreSQL 18     │
                                 └──────────────────┘
```

```
packages/shared        tipos, labels, errores
packages/domain        motor, estados, política, checklist, puertos
packages/application   RBAC, parsePublicProspect, prepareVerdict
apps/api               adaptadores HTTP + (futuro) Prisma
apps/web               UI es-GT, sin reglas de negocio
```

Servicios externos (producción, **puertos documentados, no implementados**): object storage, OCR, embeddings, LLM de asistencia, PDF.

## Regla de dependencias

`modules (Nest)` → `@crece/application` → `@crece/domain` ← infrastructure

- **domain**: entidades, políticas, puertos (`interface` sin prefijo `I`), servicios puros. Vitest.
- **application**: casos de uso; orquestan puertos. Vitest.
- **infrastructure**: ORM, R2, proveedores IA, PDF.
- **apps/web**: UI; llama a la API. No importa `@crece/domain` para decidir crédito.

## Módulos API

| Módulo Nest | Bounded context | Estado |
|-------------|-----------------|--------|
| `health` | Salud | `GET /health` |
| `catalog` | Cargos, factores, semillas | `GET /catalog` |
| `prospects` | Personas / prospectos | `POST /public/prospects` (memoria) |
| `operations` | Checklist + cálculo | `GET /operations/checklist`, `POST /operations/calc` |
| `approvals` | Autorización | `GET /approvals/policy`, `POST /approvals/resolve` |

## Principios

1. IA asiste; no decide. Puertos `LlmAssistant`, `OcrProvider`.
2. Tres capas de decisión, no una fórmula.
3. Sin score ni bandas de riesgo.
4. Trazabilidad append-only.
5. Configuración versionada en DB.

Prisma: `apps/api/prisma/schema.prisma` (PostgreSQL, cargos en `UserOffice`, veredictos y checklist relacionales). Runtime de operaciones aún no usa el cliente Prisma.
