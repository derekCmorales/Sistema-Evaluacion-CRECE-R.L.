# Sprint 2 — fases 4 a 7

**Del lunes 5 al viernes 16 de octubre de 2026.** Una solicitud armada en la fase 3 llega a una decisión trazable: cálculo y reglas con excepción justificada, dictamen, revisión en la que la IA solo asiste, y firma dual o voto del Consejo con su acta.

- Contrato de producto: [`openspec/changes/review-and-authorization/`](../openspec/changes/review-and-authorization/proposal.md)
- Secuencia: [`diagramas/21-secuencia-revision-autorizacion.md`](./diagramas/21-secuencia-revision-autorizacion.md)
- Pantallas objetivo (canvas de Claude Design, lo comparte Derek): P4-Calculo, P4-Excepcion, P5-Dictamen, P6-RevisionIA, P7-Bandeja, P7-Voto y P7-Acta.

## 1. Primer paso de cada integrante

1. `git checkout main && git pull`, luego `pnpm install` y `pnpm test`. Todo debe estar en verde antes de empezar.
2. Lee, en este orden: [`AGENTS.md`](../AGENTS.md), [`contexto.md`](./contexto.md), **este documento**, el change [`review-and-authorization`](../openspec/changes/review-and-authorization/) (proposal → design → tu spec → `tasks.md`), el [diagrama 21](./diagramas/21-secuencia-revision-autorizacion.md) y [`testing.md`](./testing.md).
3. Si usas un agente, pega como primer mensaje el [bloque común](#6-brief-para-agentes) y el de tu carril.
4. Crea tu primera rama desde `main` con el nombre de la tabla de la sección 3 y empieza por la tarea de dominio (R1 o B1), con la prueba primero.
5. Abre el PR en cuanto la primera tarea esté en verde, aunque sea pequeño. El seguimiento diario va en el PR, en tres líneas: qué terminé, qué sigue y qué me bloquea.

## 2. Dónde estamos

| Fase | Qué | Dueño | Estado |
|------|-----|-------|--------|
| 1–3 | Prospecto, apertura, expediente | — | En `main` |
| 4 | Cálculo y reglas con excepción justificada | Josué | Sprint 2 |
| 5 | Dictamen 5C, listo para revisión, envío | Josué | Sprint 2 |
| 6 | IA asiste: alertas con evidencia y su resolución | Derek | Sprint 2 |
| 7 | Bandeja, firma dual, voto del Consejo, acta | Benjamin | Sprint 2 |
| 8 | Documentos y cierre | — | Sprint 3 |

**Demo del viernes 16**, con datos sintéticos:

- **Caso A, firma dual.** Ferretería, Q40,000 a 24 meses. La cuota supera el 35 % del ingreso, la regla bloquea y se justifica. Luego dictamen y envío, una alerta de IA descartada con motivo, firma de la jefatura y del autorizador delegado: queda aprobada.
- **Caso B, Consejo.** Tractor, Q150,000 a 60 meses. Ruta de quórum del Consejo (semilla 3 de 3), con un voto «Aprobar con cambios» a Q130,000 que recalcula la cuota. El acta sale «en calidad de».
- **También debe fallar:**
  - votar dos veces;
  - que quien originó firme como delegado o vote como Consejo;
  - aprobar con una alerta abierta;
  - editar después del envío;
  - mandar `byUserId` u `officeCode` en el cuerpo, que se ignoran.

## 3. Carriles

| Carril | Ramas (una por PR) | Escribe en | Solo lee |
|--------|--------------------|------------|----------|
| **Derek · PR 0** (hecho) | `feat/s2-contracts` | `packages/shared/src/index.ts`, `packages/domain/src/ports.ts`, `packages/application/src/rbac.ts`, `review-deps.ts`, `apps/api/src/modules/capture/*`, `in-memory-repositories.ts`, `apps/web/app/(app)/operations/[id]/page.tsx`, `openspec/`, `docs/`, `AGENTS.md` | — |
| **Josué · fases 4–5** | `feat/s2-review-domain`, `feat/s2-review-api`, `feat/s2-review-ui` | `domain/hard-rule-exception.ts`, `domain/review-readiness.ts`, `application/review-submission.ts`, `application/case-file.ts` (solo R2), `api/modules/operations/review.controller.ts`, `web/components/case-file/calc-tab.tsx`, `exception-dialog.tsx`, `opinion-tab.tsx`, `submit-dialog.tsx` | `case-assembly.ts`, `calc-engine.ts`, `hard-rules-engine.ts` |
| **Benjamin · fase 7** | `feat/s2-authorization-domain`, `feat/s2-authorization-api`, `feat/s2-authorization-ui` | `domain/verdict-casting.ts`, `domain/minutes.ts`, `application/authorization.ts`, `api/modules/approvals/*`, `web/app/(app)/approvals/*`, `web/app/(app)/operations/[id]/vote/*`, `.../minutes/*`, `web/components/case-file/decision-tab.tsx` | `verdict-policy.ts`, `decision-factors.ts`, `calc-engine.ts` |
| **Derek · fase 6** | `feat/s2-ai-review-domain`, `feat/s2-ai-review-ui` | `domain/ai-alerts.ts`, `application/ai-review.ts`, `api/modules/ai/*`, `web/components/case-file/ai-review-tab.tsx` | `review-submission.ts` |

En la tabla, `domain` = `packages/domain/src`, `application` = `packages/application/src`, `api` = `apps/api/src`, `web` = `apps/web`. **Si necesitas un archivo que no es de tu carril, no lo edites: pídelo en el PR de su dueño o en un PR al contrato.**

Lo que ya trae `main` para cada carril:

- **Fases 4–5:** inyecta `REVIEW_DEPS` (`ReviewDeps`: los repos de captación + `facts`). En pruebas usa `fakeReviewDeps` (`packages/application/src/test-support/review-fakes.ts`); `failFacts: true` simula el motor caído.
- **Fase 7:** inyecta `AUTHORIZATION_DEPS` (`AuthorizationDeps`: repos + `decisions`). En pruebas usa `fakeAuthorizationDeps` y los actores `delegatedAuthorizer` y `secondCouncilMember`.
- **Fase 6:** se suscribe a `REVIEW_FACTS` (`InMemoryReviewFactsPublisher.subscribe`).
- **Web:** cada pestaña ya existe con un `EmptyState`. Reemplaza el contenido y conserva la firma `(props: CasePanelProps)`.
- **Bitácora:** las acciones nuevas ya están en `CaptureAuditAction` con su etiqueta. Usa `appendAudit(deps, …)`.
- **Justificaciones:** `deps.config.get(JUSTIFICATION_MIN_LENGTH_KEY, JUSTIFICATION_MIN_LENGTH_SEED)`.

## 4. Contrato: casos de uso y endpoints

| Fase | Caso de uso | Transición | Permiso | Endpoint | Bitácora | Dueño |
|------|-------------|------------|---------|----------|----------|-------|
| 4 | `justifyHardRuleException` | — (DRAFT o RETURNED) | `operation:edit` | `PUT /operations/:id/hard-rules/:ruleCode/exception` | `HARD_RULE_EXCEPTION_JUSTIFIED` | Josué |
| 5 | `saveOpinion` | — (DRAFT o RETURNED) | `operation:edit` | `PUT /operations/:id/opinion` | `OPINION_SAVED` | Josué |
| 5 | `markReadyForReview` | DRAFT o RETURNED → READY_FOR_REVIEW | `operation:submit` | `POST /operations/:id/ready` | `OPERATION_READY_FOR_REVIEW` | Josué |
| 5 | `reopenCapture` | READY o RETURNED → DRAFT | `operation:edit` | `POST /operations/:id/reopen` | `OPERATION_REOPENED` | Josué |
| 5 | `submitForReview` | READY_FOR_REVIEW → UNDER_REVIEW | `operation:submit` | `POST /operations/:id/submit` | `OPERATION_SUBMITTED` | Josué |
| 6 | `getReviewAnalysis` | — | `operation:read` | `GET /operations/:id/ai-review` | — | Derek |
| 6 | `retryReviewAnalysis` | — | `operation:submit` | `POST /operations/:id/ai-review/retry` | `AI_REVIEW_RETRIED` | Derek |
| 6 | `resolveAiAlert` | — (solo UNDER_REVIEW) | `operation:review-alerts` | `PUT /operations/:id/ai-alerts/:alertId/resolution` | `AI_ALERT_RESOLVED` | Derek |
| 7 | `listAuthorizationInbox` | — | `operation:verdict` | `GET /approvals/inbox` | — | Benjamin |
| 7 | `getAuthorizationStatus` | — | `operation:read` | `GET /operations/:id/authorization` | — | Benjamin |
| 7 | `castVerdict` | UNDER_REVIEW → APPROVED, REJECTED o RETURNED_TO_ADVISOR al cerrar la ruta | `operation:verdict` | `POST /operations/:id/verdicts` | `VERDICT_CAST` en `DecisionLog` | Benjamin |
| 7 | `getMinutes` | — | `operation:read` | `GET /operations/:id/minutes` | — | Benjamin |

`POST /approvals/resolve` recibe hoy `actorId`, `originatorId` y veredictos en el cuerpo, que es el mismo problema que B4. En B4 se retira o queda como simulador sin campos de actor.

### Invariantes que fallan en dominio (cada una con prueba de abuso)

- **Fase 4:**
  - Solo se justifica una regla que está entre los hits.
  - El motivo tiene al menos `justification.minLength` caracteres.
  - Solo en DRAFT o RETURNED_TO_ADVISOR.
  - Si cambia `inputsHash`, las excepciones se descartan.
  - Los umbrales salen de config.
- **Fase 5:**
  - «Listo» exige armado vigente, ningún BLOCK sin excepción y las cinco secciones del 5C.
  - Se envía solo desde READY_FOR_REVIEW.
  - El envío publica el hecho y nunca falla por la IA.
  - Después del envío no se edita.
- **Fase 6:**
  - Resolver exige CONFIRMED o DISMISSED con motivo, solo en UNDER_REVIEW y una sola vez.
  - La IA no escribe Verdict, CalcResult, FinancialAssessment ni Opinion5C.
- **Fase 7:**
  - Una persona cuenta una vez por operación.
  - Quien originó no firma como delegado ni vota como Consejo; sí puede firmar como jefatura.
  - El veredicto guarda el cargo ejercido.
  - `APPROVE_WITH_CHANGES` exige cambio y recalcula.
  - `RETURN` exige comentario.
  - No se aprueba con alertas sin resolver.
  - `DecisionLog` es append-only.

## 5. Tareas y calendario

Las tareas con archivos y pruebas están en [`tasks.md`](../openspec/changes/review-and-authorization/tasks.md):

- **Josué:** R1–R7.
- **Benjamin:** B1–B7.
- **Derek:** D1–D6.

Al cerrar una tarea, márcala en `tasks.md` dentro de tu PR.

| Cuándo | Qué |
|--------|-----|
| Vie 2 oct | PR 0 en `main` (hecho). Kickoff: recorrer este documento y el canvas; confirmar las decisiones de la sección 7. |
| Lun 5 – mié 7 | Dominio y application con pruebas primero (PR A de cada carril). |
| Jue 8 | Revisión con la checklist de abuso y merge de los PR A. |
| Jue 8 – vie 9 | API con `@CurrentActor` y pruebas http (PR B). |
| Lun 12 – mié 14 | Pantallas sobre el design system (PR C). |
| Jue 15 | Integración en `main`: casos A y B de punta a punta y motor conectado. |
| Vie 16 | Demo, retro y archive/sync del change. |

## 6. Brief para agentes

### Bloque común

```text
Contexto: repo Sistema-Evaluacion-CRECE-R.L., sprint 2 (fases 4 a 7 del proceso de crédito).
Lee en este orden antes de escribir código:
  1. AGENTS.md
  2. docs/contexto.md
  3. docs/sprint-2.md (plan, contrato y tu carril)
  4. openspec/changes/review-and-authorization/ (proposal, design, specs, tasks)
  5. docs/diagramas/21-secuencia-revision-autorizacion.md
  6. docs/testing.md y DESIGN.md

Reglas:
- Trabaja solo en los archivos de tu carril (docs/sprint-2.md, sección 3). Si necesitas otro, detente y dilo.
- No cambies tipos de packages/shared ni puertos de packages/domain/src/ports.ts: son contrato.
  Si falta algo, descríbelo en el PR; no lo agregues.
- El actor sale de la sesión con @CurrentActor. Nunca leas userId, byUserId, source ni officeCode del cuerpo.
- Toda precondición de estado se valida en @crece/domain, con una prueba que la hace fallar.
- Prueba primero (rojo → verde) en la capa de la regla, con al menos un caso de abuso por invariante.
- La IA no decide: nada de score, banda de riesgo ni «recomendado: aprobar».
- UI solo con componentes y tokens de design-system/ (useCrece). Textos en es-GT; identificadores en inglés; interfaces sin prefijo I.
- Datos sintéticos solo dentro de *.test.ts. Nunca DPI o nombres realistas en src.
- Antes de terminar: pnpm test && pnpm build && pnpm lint, y openspec validate review-and-authorization.
- Rama nueva desde main actualizado. No hagas push forzado, no reutilices nombres de rama y no abras PRs de otra fase.
- Marca en openspec/changes/review-and-authorization/tasks.md las tareas que cierras.
```

### Josué · fases 4 y 5

```text
Tu carril: fases 4 y 5. Tareas R1 a R7 de openspec/changes/review-and-authorization/tasks.md.
Ramas: feat/s2-review-domain (R1–R4), feat/s2-review-api (R5) y feat/s2-review-ui (R6–R7).
Orden: domain (hard-rule-exception, review-readiness) → application (review-submission) → api (review.controller) → web (pestañas Cálculo y Dictamen).
El cálculo ya existe: no reimplementes calculateCreditMetrics ni evaluateHardRules; solo pásales los umbrales de config.
Inyecta REVIEW_DEPS en la API; en pruebas usa fakeReviewDeps (failFacts: true para el motor caído).
submitForReview publica con deps.facts.publish y, si falla, el envío igual queda hecho.
```

### Benjamin · fase 7

```text
Tu carril: fase 7. Tareas B1 a B7 de openspec/changes/review-and-authorization/tasks.md.
Ramas: feat/s2-authorization-domain (B1–B3), feat/s2-authorization-api (B4) y feat/s2-authorization-ui (B5–B7).
Orden: domain (verdict-casting, minutes) → application (authorization) → api (approvals) → web (bandeja, voto móvil, decisión, acta).
Reutiliza verdict-policy.ts (resolveRoute, officeToExercise, assertOnePersonOnce, assertOriginatorCannotAuthorize, resolveFinalDecision); no dupliques sus reglas.
APPROVE_WITH_CHANGES recalcula con calculateCreditMetrics; no copies la fórmula.
Inyecta AUTHORIZATION_DEPS en la API; en pruebas usa fakeAuthorizationDeps.
Retira el actor del cuerpo en POST /approvals/resolve.
```

### Derek · fase 6

```text
Tu carril: fase 6 (D1–D6). Integra main en feat/motor-ia antes de D1; no mezcles el motor con el core.
D1 trae a main AiEvidence, AiAlert con evidencias y ai-alerts.ts desde feat/motor-ia, con motivo obligatorio y solo en UNDER_REVIEW.
El motor se suscribe a REVIEW_FACTS; escribe solo en el esquema ai y nunca escribe Verdict, CalcResult ni Opinion5C.
```

## 7. Decisiones (cerrar o confirmar en el kickoff)

| Pregunta | Decisión semilla en el contrato |
|----------|----------------------------------|
| ¿Quién resuelve las alertas de la IA? | `ADVISOR` o `BRANCH_HEAD` (`operation:review-alerts`) antes de la firma; el firmante ve la resolución. |
| ¿Largo mínimo de una justificación? | `justification.minLength`, semilla 20 (excepciones, devoluciones y alertas). |
| ¿Qué invalida una excepción? | Un cambio en la evaluación (`inputsHash`). |
| ¿El Consejo vota en la app? | Sí, cada miembro desde su teléfono; el acta se arma al cerrar el quórum. |

## 8. Checklist de revisión (antes de cada merge)

**Casos de abuso (cada uno es una prueba):**

- Sin sesión devuelve 401; con un cargo sin permiso, 403; en un estado no permitido, 409, sin mutar nada.
- `byUserId`, `officeCode` o `source` en el cuerpo no cambian nada.
- Fallan:
  - votar dos veces;
  - que quien originó firme como delegado o vote como Consejo;
  - aprobar con una alerta abierta;
  - `APPROVE_WITH_CHANGES` sin cambio;
  - `RETURN` sin comentario;
  - excepción sobre una regla que no está entre los hits;
  - enviar sin armado vigente o con un BLOCK sin excepción.

**Forma del PR:**

- Un tema y menos de ~600 líneas de código, sin contar pruebas.
- Solo archivos de su carril.
- `tasks.md` al día.
- Sin PNG, symlinks ni datos realistas fuera de pruebas.
- Componentes y tokens del design system.
- `pnpm test`, `pnpm build`, `pnpm lint` y `openspec validate` en verde.
- Descripción en español: fase, tareas, cómo probarlo y qué quedó fuera.

## 9. Lo que pasó en las fases 1–3 y la regla que lo evita

| Pasó | Regla |
|------|-------|
| Tres PRs (#3, #4, #5) y dos implementaciones de las mismas fases | Una fase, un dueño; PRs pequeños por tema |
| Cada rama inventó sus contratos | Contrato congelado en el PR 0; cambiarlo es un PR al contrato |
| La autoría salía del cuerpo de la petición | El actor sale de la sesión |
| Se editaba un expediente aprobado y se armaba con huecos | Las precondiciones viven en dominio con pruebas de abuso |
| Dos personas fusionadas por compartir teléfono | Cada invariante de identidad, autoría o estado tiene su prueba de abuso |
| Ramas con el mismo nombre, symlinks, fixtures realistas en `src` | Rama nueva desde `main`; sin symlinks; datos sintéticos solo en pruebas |
| Web sin pruebas | Todo PR con comportamiento trae pruebas en su capa |

## 10. Fuera de este sprint

- Fase 8: identidad, IVE, contratos, PDF y paquete.
- Persistencia Prisma.
- Autenticación real.
- Tablero de semáforos.
- Captaciones de ahorro.
