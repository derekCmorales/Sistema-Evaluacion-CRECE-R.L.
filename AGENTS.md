# AGENTS.md — Sistema Evaluación CRECE R.L.

Guía para **agentes de IA y desarrolladores**.

**Empezar por:** [`docs/README.md`](./docs/README.md) → [`docs/contexto.md`](./docs/contexto.md) → [`docs/como-trabajar.md`](./docs/como-trabajar.md) → specs en `openspec/specs/`.

> El monorepo histórico `CRECE-MVP` es **solo aprendizaje**. No copiar sus apps. El conocimiento de negocio **sí** aplica: contexto, invariantes, RF y estos paquetes de dominio.

---

## 0. Contrato

1. **IA no decide:** no aprueba, no rechaza, no genera puntaje ni “recomendado: aprobar”.
2. **Captura manual** en expediente; cálculos financieros = **código determinístico** (`@crece/domain` `calculateCreditMetrics`).
3. Identificadores en **inglés técnico**; textos de UI en **español (es-GT)**.
4. **Interfaces sin prefijo `I`**. Puertos en `packages/domain/src/ports.ts`.
5. Secretos solo en variables de entorno; nunca PII en repos ni en prompts innecesarios.
6. **OpenSpec** para cambios de producto: `propose` → revisar → `apply` → `archive` / `sync`.
7. Ramas propias y **PR a `main`**; ver `CONTRIBUTING.md`.
8. Configurable en DB (umbrales, vocabulario, plantillas) — no constantes de negocio en código (las semillas van etiquetadas como seed).
9. Cuando dudes entre bloquear o avisar, **avisa con excepción justificada**.
10. Ningún dato del core contable CENSYT entra al sistema.
11. **Siempre hay tests** en la capa de la regla antes del PR. Ver [`docs/testing.md`](./docs/testing.md). Una captura no sustituye aserciones. No agregar PNG: diagramas en Mermaid.
12. **UI solo desde el design system:** tokens semánticos, componentes y patrones de `design-system/` (ver `DESIGN.md`). Nada de colores, fuentes o componentes fuera de él.

---

## 1. Stack

| Pieza | Ubicación |
|-------|-----------|
| Web | `apps/web` — Next.js **16.3.6**, React 19.3 |
| API | `apps/api` — NestJS **12.0.4** (adaptadores HTTP) |
| Domain | `packages/domain` — puro, testeable, sin Nest |
| Application | `packages/application` — casos de uso + RBAC |
| Shared | `packages/shared` — tipos, labels, errores |
| DB | PostgreSQL 18 · esquema Prisma en `apps/api/prisma/` (aún no cableado al runtime salvo Compose) |
| Specs | `openspec/specs/` |
| Design system | `design-system/` — guía madre y única de la UI (copia de Claude Design; no editar a mano) |

---

## 2. Arquitectura

```
apps/web (UI)
    → HTTP → apps/api/modules/* (adaptadores)
                  → @crece/application
                  → @crece/domain
                  ← infrastructure (Prisma, R2, OCR, LLM — futuro)
```

**Dependency rule:** el dominio no importa NestJS, Next ni SDKs de nube.

Módulos HTTP: `health`, `catalog`, `prospects`, `operations`, `approvals`.

---

## 3. Autorización

Ver `docs/autorizacion.md` y `openspec/specs/authorization-policy/spec.md`.

Implementación: `packages/domain/src/verdict-policy.ts`. Semilla: `DEFAULT_AUTHORIZATION_POLICY`.

---

## 4. Modelo mental

- Centro: **Person**; operaciones N por persona.
- Tres folders: identidad (naranja, post-aprobación), operación (azul), custodia (natural).
- Tres capas: cálculo, reglas duras, asistencia IA — **no** fórmula 85/70/60.
- Prospecto público ≠ operación.

Invariantes (deben fallar en dominio, no solo en UI): `docs/contexto.md` y `openspec/specs/`.

---

## 5. Flujo de trabajo

Ver [`docs/como-trabajar.md`](./docs/como-trabajar.md).

```bash
pnpm test          # obligatorio; ver docs/testing.md
pnpm build && pnpm lint
```

---

## 6. Anti-objetivos

- Copiar apps del MVP (`apps/web`, `apps/landing`, JSON-blob SQLite).
- `ISomething` en código nuevo.
- Score, risk band, auto-approve, Gerencia como cargo.
- Integración contable CENSYT (nivel B).
- Lógica de negocio en componentes React.
- Colores, tipografías o componentes de UI inventados fuera de `design-system/`.
- Implementar OCR/LLM/R2 sin change OpenSpec.
- PR de comportamiento sin tests de esa capa, o diagramas como imagen.

---

## 7. Referencias

- Contexto: `docs/contexto.md`
- Uso / API: `docs/uso.md`
- Testing (siempre): `docs/testing.md`
- Pantallas objetivo: `docs/pantallas.md`
- Diagramas Mermaid: `docs/diagramas/README.md`
- UI / marca: **`design-system/`** es la guía madre y única de la UI (entrada: `DESIGN.md`)
