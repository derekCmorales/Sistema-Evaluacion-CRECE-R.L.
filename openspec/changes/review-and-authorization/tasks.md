# Tasks: review-and-authorization

Dueños: **Derek** (PR 0, fase 6, revisión), **Josué** (fases 4 y 5), **Benjamin** (fase 7). Sin migración de base de datos en ninguna tarea. Detalle, archivos por carril y calendario: [`docs/sprint-2.md`](../../../docs/sprint-2.md).

## 0. Contrato (Derek · PR 0 · `feat/s2-contracts`)

- [x] 0.1 [shared/domain/application] Acciones de bitácora F4–F7 con etiqueta, `OperationSubmittedForReview`, `AuthorizationInboxItem`, `MinutesView`, `JUSTIFICATION_MIN_LENGTH_*`, puerto `ReviewFactsPublisher`, `ReviewDeps`, `AuthorizationDeps`, permiso `operation:review-alerts`, fakes. Prueba: `packages/shared/src/contract.test.ts`, `packages/application/src/rbac.test.ts`, `packages/application/src/test-support/review-fakes.test.ts`.
- [x] 0.2 [openspec] Este change; `## Purpose` y escenarios en las specs estables; archivo de `intake-and-case-assembly`. Prueba: `openspec validate --all`.
- [x] 0.3 [docs] `docs/sprint-2.md`, diagrama 21, sección «Protocolo de sprint» en `AGENTS.md`.
- [x] 0.4 [api/web] `InMemoryDecisionLog`, `InMemoryReviewFactsPublisher`, tokens `REVIEW_DEPS`, `AUTHORIZATION_DEPS`, `REVIEW_FACTS`; pestañas Cálculo y reglas, Dictamen, Revisión IA y Decisión con un archivo por carril. Prueba: `apps/api/src/infrastructure/persistence/sprint2-adapters.test.ts`.

## 1. Fases 4 y 5 (Josué)

- [ ] R1 [domain] `justifyHardRuleException` (hit existente, motivo ≥ `justification.minLength`, caso editable, autor y fecha). Prueba: `packages/domain/src/hard-rule-exception.test.ts`.
- [ ] R2 [domain/application] Umbrales desde `ConfigRepository` `hardRules`; en `recordFinancialAssessment`, si cambia `inputsHash` se descartan las excepciones. Prueba: `hard-rule-exception.test.ts` y `packages/application/src/case-file.test.ts`.
- [ ] R3 [domain] `assertReadyForReview` con la lista de faltantes. Prueba: `packages/domain/src/review-readiness.test.ts`.
- [ ] R4 [application] `review-submission.ts`: `justifyHardRuleException`, `saveOpinion`, `markReadyForReview`, `reopenCapture`, `submitForReview` (publica el hecho; si falla, el envío queda). Prueba: `packages/application/src/review-submission.test.ts` con `fakeReviewDeps`.
- [ ] R5 [api] `apps/api/src/modules/operations/review.controller.ts` con `@CurrentActor` e inyección de `REVIEW_DEPS`. Prueba: `review.http.test.ts` (401, 403, 409, autor en el cuerpo ignorado).
- [ ] R6 [web] `components/case-file/calc-tab.tsx` y `exception-dialog.tsx`. Prueba: `apps/web/lib/view.test.ts`.
- [ ] R7 [web] `components/case-file/opinion-tab.tsx` y `submit-dialog.tsx`. Prueba: `apps/web/lib/view.test.ts`.

## 2. Fase 6 (Derek)

- [ ] D1 [domain/shared] Integrar `main` en `feat/motor-ia` y traer a `main` `AiEvidence`, `AiAlert` con evidencias y `ai-alerts.ts` (`resolveAiAlert`, `assertCanApprove`), agregando: solo en `UNDER_REVIEW` y motivo ≥ `justification.minLength` también al confirmar. Prueba: `packages/domain/src/ai-alerts.test.ts`.
- [ ] D2 [application/api] `ai-review.ts` (`resolveAiAlert`, `getReviewAnalysis`, `retryReviewAnalysis`) y su controlador. Prueba: `packages/application/src/ai-review.test.ts`, `apps/api/src/modules/ai/review.http.test.ts`.
- [ ] D3 [api] Suscriptor de `REVIEW_FACTS` → `AiEngine.handle` (tarea 10.2 de `ai-review-engine`). Prueba: `apps/api/src/modules/ai/subscribers.test.ts`.
- [ ] D4 [api] `CaseSnapshotSource` contra los repositorios en memoria (tarea 10.3). Prueba: contrato de `@crece/ai-engine/testing`.
- [ ] D5 [web] `components/case-file/ai-review-tab.tsx` con estado «no disponible · Reintentar». Prueba: `apps/web/lib/view.test.ts`.
- [ ] D6 [raíz] Revisión con la checklist de abuso, integración del 15 de octubre (casos A y B) y archive/sync de este change.

## 3. Fase 7 (Benjamin)

- [ ] B1 [domain] `verdict-casting.ts`: `castVerdict` con `verdict-policy`, `RETURN` con comentario, `APPROVE_WITH_CHANGES` con recálculo, `assertCanApprove`, transición al cerrar la ruta. Prueba: `packages/domain/src/verdict-casting.test.ts`.
- [ ] B2 [domain] `minutes.ts`: `buildMinutes` → `MinutesView`. Prueba: `packages/domain/src/minutes.test.ts`.
- [ ] B3 [application] `authorization.ts`: `listAuthorizationInbox`, `getAuthorizationStatus`, `castVerdict` (`DecisionLog` + bitácora), `getMinutes`. Prueba: `packages/application/src/authorization.test.ts` con `fakeAuthorizationDeps`.
- [ ] B4 [api] Módulo `approvals`: inbox, authorization, verdicts y minutes con `@CurrentActor` e inyección de `AUTHORIZATION_DEPS`; retirar el actor del cuerpo en `POST /approvals/resolve`. Prueba: `apps/api/src/modules/approvals/approvals.http.test.ts`.
- [ ] B5 [web] `app/(app)/approvals/page.tsx` (bandeja D-04). Prueba: `apps/web/lib/view.test.ts`.
- [ ] B6 [web] `app/(app)/operations/[id]/vote/page.tsx` (voto móvil D-06) y `components/case-file/decision-tab.tsx`. Prueba: `apps/web/lib/view.test.ts`.
- [ ] B7 [web] `app/(app)/operations/[id]/minutes/page.tsx` (acta D-07). Prueba: `apps/web/lib/view.test.ts`.
