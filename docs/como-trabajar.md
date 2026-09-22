# Cómo trabajar en este repo

Guía para el equipo y para agentes. Complementa `AGENTS.md` y `CONTRIBUTING.md`.

## 1. Leer primero

1. `docs/contexto.md` — negocio e invariantes.
2. `AGENTS.md` — límites: IA no decide, sin score, interfaces sin `I`.
3. `docs/stack.md` — Next 16.3.6, Nest 12.0.4, TS 7.
4. `openspec/specs/` — contrato de producto.
5. `docs/diagramas/README.md` — Mermaid para agentes (sin imágenes nuevas).
6. `docs/testing.md` — **siempre** hay pruebas en la capa de la regla.

## 2. Flujo diario

```text
rama desde main
    → (si hay producto) openspec-propose  (incluye sección Tests)
    → código en la capa correcta
    → prueba de esa capa en rojo → verde
    → pnpm test && pnpm build && pnpm lint
    → PR a main (español, checklist CONTRIBUTING)
    → (al cerrar el change) openspec-archive / sync
```

- **pnpm only.** `corepack enable` → pnpm 12.5.1.
- Un PR = un tema.
- Un PR con comportamiento y **sin** pruebas de esa capa se rechaza. Ver [testing.md](./testing.md).

## 3. Dónde poner código

| Qué | Dónde |
|-----|--------|
| UI, rutas App Router | `apps/web/app/` |
| HTTP Nest | `apps/api/src/modules/*` |
| Casos de uso / RBAC | `packages/application` |
| Entidades, políticas, puertos, motor | `packages/domain` |
| Tipos y labels | `packages/shared` |
| Prisma | `apps/api/prisma/` |
| Specs | `openspec/changes/` luego `openspec/specs/` |
| Pruebas | junto al módulo (`.test.ts`); contrato en [testing.md](./testing.md) |

Regla: `modules → application → domain ← infrastructure`. El dominio no importa Nest ni Next.

## 4. OpenSpec

Skills en `.cursor/skills/openspec-*`. Cambio de umbral, cargos u outcomes **siempre** pasa por OpenSpec + `docs/autorizacion.md`.

## 5. Levantar el entorno

```bash
cp .env.example .env
pnpm install
pnpm --filter @crece/shared --filter @crece/domain --filter @crece/application build
pnpm compose:db
pnpm dev:api
pnpm dev:web
pnpm test
```

Detalle de la puerta de pruebas (pirámide, invariantes, OpenSpec): [testing.md](./testing.md).

Stack en contenedores: `pnpm compose:dev`. Detalle: [docker.md](./docker.md). Recorrido: [uso.md](./uso.md).

## 6. Qué no hacer

- Copiar apps del MVP local.
- Prefijo `I` en interfaces (`LlmAssistant`, no `ILlmAssistant`).
- Implementar OCR/LLM/R2 sin change OpenSpec.
- Inventar un score o “recomendado: aprobar”.
- Hardcodear Gerencia: usar `AuthorizationPolicy` + config.
- Saltar tests “porque aún es scaffold” o sustituirlos con capturas.
