# Tasks: review-and-authorization

Dueños: **Derek** (PR 0, fase 6, revisión), **Josué** (fases 4 y 5), **Benjamin** (fase 7). Sin migración de base de datos en ninguna tarea. Detalle, archivos por carril y calendario: [`docs/sprint-2.md`](../../../docs/sprint-2.md).

## 0. Contrato (Derek · PR 0 · `feat/s2-contracts`)

- [x] D0.1 [shared/domain/application] Acciones de bitácora F4–F7 con etiqueta, `OperationSubmittedForReview` (misma forma que el esquema del motor), `AuthorizationInboxItem`, `MinutesView`, `JUSTIFICATION_MIN_LENGTH_*`, `AiEvidence` y `AiAlert` con `id` y evidencias, `ai-alerts.ts` traído de `feat/motor-ia` (`assertCanApprove` sale de `verdict-policy.ts`), puertos `ReviewFactsPublisher` y `UserDirectory`, `ReviewDeps`, `AuthorizationDeps` (política, directorio, factores), permiso `operation:review-alerts`, fakes. Prueba: `packages/shared/src/contract.test.ts`, `packages/domain/src/ai-alerts.test.ts`, `packages/application/src/rbac.test.ts`, `packages/application/src/test-support/review-fakes.test.ts`.
- [x] D0.2 [openspec] Este change; `## Purpose` y escenarios en las specs estables; archivo de `intake-and-case-assembly`. Prueba: `openspec validate --all`.
- [x] D0.3 [docs] `docs/sprint-2.md`, diagrama 21, sección «Protocolo de sprint» en `AGENTS.md`.
- [x] D0.4 [api/web] `InMemoryDecisionLog`, `InMemoryReviewFactsPublisher` (no espera a los suscriptores), `InMemoryUserDirectory` con los usuarios de la sesión de desarrollo (tres del Consejo), `InMemoryDecisionFactorRepository`; tokens `REVIEW_DEPS`, `AUTHORIZATION_DEPS`, `REVIEW_FACTS`; `ReviewController` vacío registrado en `OperationsModule`; pestañas Cálculo y reglas, Dictamen, Revisión IA y Decisión; página `/approvals` y entrada «Por firmar» en el menú. Prueba: `apps/api/src/infrastructure/persistence/sprint2-adapters.test.ts`.

## 1. Fases 4 y 5 (Josué)

- [ ] R1 [domain] `justifyHardRuleException` (hit existente, motivo ≥ `justification.minLength`, caso editable, autor y fecha). Prueba: `packages/domain/src/hard-rule-exception.test.ts`.
- [ ] R2 [domain/application] Umbrales desde `ConfigRepository` llave `hardRules` (objeto `Partial<HardRulesConfig>`); en `recalculate` de `case-file.ts` (la usan la evaluación y el fiador), si cambia `inputsHash` se descartan las excepciones. Prueba: `hard-rule-exception.test.ts` y `packages/application/src/case-file.test.ts`.
- [ ] R3 [domain] `assertReadyForReview` con la lista de faltantes. Prueba: `packages/domain/src/review-readiness.test.ts`.
- [ ] R4 [application] `review-submission.ts`: `justifyHardRuleException`, `saveOpinion` (ninguno de los dos borra `assembledAt`: no usar el `save()` de `case-file.ts`), `markReadyForReview`, `reopenCapture`, `submitForReview` (abre ronda nueva vaciando `verdicts`; publica el hecho; si falla, el envío queda). Prueba: `packages/application/src/review-submission.test.ts` con `fakeReviewDeps`.
- [ ] R5 [api] `apps/api/src/modules/operations/review.controller.ts` con `@CurrentActor` e inyección de `REVIEW_DEPS`. Prueba: `review.http.test.ts` (401, 403, 409, autor en el cuerpo ignorado).
- [ ] R6 [web] `components/case-file/calc-tab.tsx` y `exception-dialog.tsx`. Prueba: `apps/web/lib/review-view.test.ts`.
- [ ] R7 [web] `components/case-file/opinion-tab.tsx` y `submit-dialog.tsx`. Prueba: `apps/web/lib/review-view.test.ts`.

## 2. Fase 6 (Derek)

- [ ] D1 [domain] Integrar `main` en `feat/motor-ia` (el PR 0 ya trajo `ai-alerts.ts` y `AiEvidence` idénticos a los del motor). Agregar a `resolveAiAlert`: solo en `UNDER_REVIEW` y motivo ≥ `justification.minLength` también al confirmar. Prueba: `packages/domain/src/ai-alerts.test.ts`.
- [ ] D2 [application/api] `ai-review.ts` (`resolveAiAlert`, `getReviewAnalysis`, `retryReviewAnalysis`) y su controlador. Prueba: `packages/application/src/ai-review.test.ts`, `apps/api/src/modules/ai/review.http.test.ts`.
- [ ] D3 [api] Suscriptor de `REVIEW_FACTS` → `AiEngine.handle` (tarea 10.2 de `ai-review-engine`). El análisis real depende de los grupos 5–7 del motor (chunking, base de conocimiento, `Pseudonymizer`, prompts, `GeminiLlmProvider`, `RunReviewAnalysis`), que siguen en `feat/motor-ia/openspec/changes/ai-review-engine/tasks.md`. Prueba: `apps/api/src/modules/ai/subscribers.test.ts`.
- [ ] D4 [api] `CaseSnapshotSource` contra los repositorios en memoria (tarea 10.3). Prueba: contrato de `@crece/ai-engine/testing`.
- [ ] D5 [web] `components/case-file/ai-review-tab.tsx` con estado «no disponible · Reintentar». Prueba: `apps/web/lib/ai-review-view.test.ts`.
- [ ] D6 [api] Plan de demo: si el grupo 7 del motor no está listo el 14 de octubre, el suscriptor usa un análisis falso basado en los fakes de `@crece/ai-engine/testing` (alertas sintéticas con evidencia) detrás del flag de IA, y la UI lo marca como «análisis de prueba». Prueba: `subscribers.test.ts`.
- [ ] D7 [raíz] Revisión con la checklist de abuso, integración del 15 de octubre (casos A y B) y archive/sync de este change.

## 3. Fase 7 (Benjamin)

- [ ] B1 [domain] `verdict-casting.ts`: `castVerdict` con `verdict-policy`, factores contra el catálogo activo, `RETURN` y `REJECT` con motivo, `APPROVE_WITH_CHANGES` con recálculo, regla de votos mixtos (menor monto y menor plazo; la banda no cambia), `assertCanApprove`, transición al cerrar la ruta. Prueba: `packages/domain/src/verdict-casting.test.ts`.
- [ ] B2 [domain] `minutes.ts`: `buildMinutes` → `MinutesView`. Prueba: `packages/domain/src/minutes.test.ts`.
- [ ] B3 [application] `authorization.ts`: `listAuthorizationInbox`, `getAuthorizationStatus`, `castVerdict` (`DecisionLog` + bitácora; `councilMemberCount` desde `deps.directory`), `getMinutes` (nombres desde `deps.directory`). Prueba: `packages/application/src/authorization.test.ts` con `fakeAuthorizationDeps`.
- [ ] B4 [api] Módulo `approvals` (ya registrado): inbox, authorization, verdicts y minutes con `@CurrentActor` e inyección de `AUTHORIZATION_DEPS`; retirar el actor del cuerpo en `POST /approvals/resolve`. Prueba: `apps/api/src/modules/approvals/approvals.http.test.ts`.
- [ ] B5 [web] `app/(app)/approvals/page.tsx` (reemplaza el esqueleto, bandeja D-04). Prueba: `apps/web/lib/authorization-view.test.ts`.
- [ ] B6 [web] `app/(app)/operations/[id]/vote/page.tsx` (voto móvil D-06) y `components/case-file/decision-tab.tsx`. Prueba: `apps/web/lib/authorization-view.test.ts`.
- [ ] B7 [web] `app/(app)/operations/[id]/minutes/page.tsx` (acta D-07). Prueba: `apps/web/lib/authorization-view.test.ts`.
