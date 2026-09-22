# AGENTS.md — Sistema Evaluación CRECE R.L.

Guía para **agentes de IA y desarrolladores** en este repositorio greenfield.

**Empezar por:** [`docs/como-trabajar.md`](./docs/como-trabajar.md) (flujo diario) · [`docs/stack.md`](./docs/stack.md) (versiones) · [`docs/diagramas/README.md`](./docs/diagramas/README.md) (**Mermaid**, no PNG).

Leer también `docs/arquitectura.md`, `docs/requisitos.md` y `docs/autorizacion.md`.

> El monorepo histórico `CRECE-MVP` es **solo aprendizaje**. No copiar su código ni pegar bloques de apps antiguas.

---

## 0. Contrato

1. **IA no decide:** no aprueba, no rechaza, no genera puntaje ni “recomendado: aprobar”.
2. **Captura manual** en expediente; cálculos financieros = **código determinístico**, no LLM.
3. Identificadores en **inglés técnico**; textos de UI en **español (es-GT)**.
4. **Interfaces sin prefijo `I`** (Clean Code); puertos en `apps/api/src/domain/ports/`.
5. Secretos solo en variables de entorno; nunca PII en repos ni en prompts innecesarios.
6. **OpenSpec** para cambios de producto: `propose` → revisar → `apply` → `archive` / `sync` (harness en `.cursor/`, `.agents/`, `openspec/`).
7. Ramas propias y **PR a `main`**; ver `CONTRIBUTING.md`.
8. Configurable en DB (umbrales, vocabulario, plantillas) — no constantes de negocio en código.

---

## 1. Stack

| Pieza | Ubicación |
|-------|-----------|
| Web | `apps/web` — Next.js **16.3.6** (latest estable), React 19.3, TypeScript **7.0.2** |
| API | `apps/api` — NestJS **12.0.4** (latest estable), capas domain / application / infrastructure |
| Shared | `packages/shared` — tipos mínimos compartidos |
| DB | PostgreSQL 18 vía Docker Compose |
| Specs | `openspec/` — spec-driven |
| Versiones | `docs/stack.md` — pnpm 12, peers y notas de build |

---

## 2. Arquitectura

```
apps/web (UI)
    → HTTP → apps/api/modules/* (adaptadores HTTP)
                  → application (use cases, futuro)
                  → domain (entidades, políticas, ports)
                  ← infrastructure (ORM, R2, OCR, LLM)
```

**Dependency rule:** el dominio no importa NestJS, Next ni SDKs de nube.

Módulos Nest actuales (stubs): `prospects`, `operations`, `approvals`, `health`.

Puertos IA/almacenamiento documentados en `domain/ports/README.md` — **no implementar OCR/LLM/R2** hasta un change OpenSpec explícito.

---

## 3. Autorización

Política **AuthorizationPolicy** (configurable):

- **&lt; umbral** (ref. Q100k): dos firmas distintas — `BRANCH_HEAD` + `DELEGATED_AUTHORIZER`; quien preparó el caso ≠ delegado.
- **≥ umbral:** Consejo hasta **quórum** (N de M en config).
- Outcomes: `APPROVE` | `APPROVE_WITH_CHANGES` | `REJECT` | `RETURN` + bitácora.

Stub: `apps/api/src/domain/policies/authorization-policy.ts`.

---

## 4. Modelo mental (breve)

- Centro: **Person**; operaciones N por persona.
- Tres folders: identidad (naranja, post-aprobación), operación (azul), custodia (natural).
- Decisión en **tres capas**: cálculo, reglas duras, asistencia IA en revisión — **no** fórmula de pesos 85/70/60.

---

## 5. Flujo de trabajo

Ver el detalle en [`docs/como-trabajar.md`](./docs/como-trabajar.md). Resumen:

1. Rama propia desde `main`.
2. Cambio de producto: **openspec-propose** → `openspec/changes/`.
3. Código en la capa correcta (nunca reglas en React; nunca infra en domain).
4. `pnpm install && pnpm build && pnpm lint`.
5. PR a `main` con checklist de `CONTRIBUTING.md`.

---

## 6. Anti-objetivos

- Copiar apps del MVP local.
- `ISomething` interfaces en código nuevo.
- Score, risk band, auto-approve.
- Integración contable CENSYT.
- Lógica de negocio en componentes React.

---

## 7. Referencias

- Diagramas **Mermaid**: `docs/diagramas/README.md` (PNG solo archivo visual)
- Cómo trabajar: `docs/como-trabajar.md`
- Marca: `DESIGN.md`
- Contexto OpenSpec: `openspec/config.yaml`
