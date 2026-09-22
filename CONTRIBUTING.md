# Contribuir

## Herramientas

- **pnpm exclusivamente** (no `npm install` ni `yarn` en el monorepo). Versión: `corepack enable` → pnpm 12 (ver `packageManager` en raíz).
- Node ≥ 22 (recomendado 24).

## Ramas

- Trabajo en ramas propias desde `main`.
- Convención recomendada: `cursor/<descripcion-corta>-<id>` o `feat/<tema>`.
- Un PR por tema; mantener diffs enfocados.

## Pull requests

Checklist antes de pedir revisión:

- [ ] `pnpm install` y `pnpm build` y `pnpm lint` pasan en raíz.
- [ ] Si toca API o Compose: `curl localhost:3001/health` y, si aplica, `docker compose ps` (`db` healthy).
- [ ] Sin secretos ni PII en el diff.
- [ ] Interfaces nuevas **sin** prefijo `I`.
- [ ] Cambios de producto relevantes tienen propuesta OpenSpec (`openspec/changes/`).
- [ ] Documentación actualizada si cambia stack, autorización o compose.

## OpenSpec

1. **propose** — diseño + tareas.
2. **apply** — implementación alineada a specs.
3. **sync** / **archive** — cerrar el ciclo.

Skills en `.cursor/skills/openspec-*`.

## Commits

Mensajes claros en español o inglés; preferir imperativo (“Añade healthcheck de API”).
