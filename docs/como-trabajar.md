# Cómo trabajar en este repo

Guía para el equipo y para agentes. Complementa `AGENTS.md` (contrato de dominio) y `CONTRIBUTING.md` (checklist de PR).

## 1. Leer primero

1. `AGENTS.md` — límites: IA no decide, sin score, interfaces sin `I`, OpenSpec.
2. `docs/stack.md` — versiones reales (Next 16.3.6, Nest 12.0.4).
3. `docs/autorizacion.md` — `AuthorizationPolicy`.
4. `docs/diagramas/README.md` — **Mermaid es la fuente para agentes**; PNG es archivo visual del Documento 1.

## 2. Flujo diario

```text
rama desde main
    → (si hay producto) openspec-propose
    → código en la capa correcta
    → pnpm install && pnpm build && pnpm lint
    → PR a main (español, checklist CONTRIBUTING)
    → (al cerrar el change) openspec-archive / sync
```

- **pnpm only.** `corepack enable` usa `packageManager` = pnpm 12.5.1.
- Ramas: `feat/<tema>` o `cursor/<descripcion>-<id>`.
- Un PR = un tema. No mezclar docs de marca con un endpoint.

## 3. Dónde poner código

| Qué | Dónde |
|-----|--------|
| UI, rutas App Router | `apps/web/app/` |
| HTTP Nest (controllers) | `apps/api/src/modules/*` |
| Casos de uso | `apps/api/src/application/` |
| Entidades, políticas, **ports** | `apps/api/src/domain/` |
| ORM, R2, OCR, LLM (cuando existan) | `apps/api/src/infrastructure/` |
| Tipos compartidos | `packages/shared` |
| Specs de producto | `openspec/changes/` luego `openspec/specs/` |

Regla: `modules → application → domain ← infrastructure`. El dominio no importa Nest ni Next.

## 4. OpenSpec

Skills en `.cursor/skills/openspec-*` (también `.agents`, `.claude`, `.gemini`, `.opencode`).

1. **propose** — diseño, no objetivos, tareas.
2. **apply** — implementar el change.
3. **archive / sync** — specs estables en `openspec/specs/`.

Cambio de umbral, roles o outcomes **siempre** pasa por OpenSpec + `docs/autorizacion.md`.

## 5. Levantar el entorno

```bash
cp .env.example .env
pnpm install
pnpm --filter @crece/shared build
pnpm dev:api    # http://localhost:3001/health
pnpm dev:web    # http://localhost:3000
```

Docker: `docker compose up -d db` y `docker compose --profile dev up --build`.

## 6. Qué no hacer

- Copiar apps del MVP local.
- Prefijo `I` en interfaces (`LlmAssistant`, no `ILlmAssistant`).
- Implementar OCR/LLM/R2 sin change OpenSpec.
- Inventar un score o “recomendado: aprobar”.
- Hardcodear Gerencia: usar `AuthorizationPolicy` + config.
