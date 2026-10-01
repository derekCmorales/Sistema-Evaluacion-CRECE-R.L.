# Proposal: review-and-authorization

## Why

Las fases 1–3 dejan un expediente armado, pero la solicitud todavía no llega a una decisión: falta exceptuar con motivo una regla que bloquea, escribir el dictamen, enviar a revisión con la IA como asistente y registrar la firma dual o el voto del Consejo con su acta. En el sprint de las fases 1–3 hubo tres PRs paralelos para lo mismo, contratos inventados en cada rama y autoría tomada del cuerpo de la petición. Este change fija el contrato de las fases 4 a 7 **antes** de que alguien programe, reparte el trabajo en carriles con dueño y deja cada invariante en el dominio con su prueba.

Plan completo, carriles, calendario y brief para agentes: [`docs/sprint-2.md`](../../../docs/sprint-2.md). Secuencia: [`docs/diagramas/21-secuencia-revision-autorizacion.md`](../../../docs/diagramas/21-secuencia-revision-autorizacion.md).

## What Changes

- **Contrato (PR 0, ya incluido):** acciones de bitácora de las fases 4–7 con etiqueta es-GT; `OperationSubmittedForReview`, `AuthorizationInboxItem`, `MinutesView`; semilla `justification.minLength = 20`; puerto `ReviewFactsPublisher`; `ReviewDeps` y `AuthorizationDeps`; permiso `operation:review-alerts`; adaptadores en memoria de `DecisionLog` y del publicador; tokens `REVIEW_DEPS`, `AUTHORIZATION_DEPS`, `REVIEW_FACTS`; una pestaña por carril en `/operations/[id]`.
- **Fase 4 · Cálculo y reglas (Josué):** umbrales de reglas duras desde `ConfigRepository`; excepción justificada sobre una regla que está entre los hits; una excepción se invalida si cambia la evaluación (`inputsHash`).
- **Fase 5 · Dictamen y envío (Josué):** dictamen 5C escrito por la persona; `markReadyForReview` con precondiciones en dominio; `reopenCapture`; `submitForReview` que fija `submittedForReviewAt`, publica el hecho y nunca falla por la IA.
- **Fase 6 · IA asiste (Derek):** las alertas con evidencia y `resolveAiAlert` que ya existen en `feat/motor-ia` llegan a `main`; resolución con motivo antes de la firma; reintento del análisis; el motor se suscribe al hecho del envío.
- **Fase 7 · Autorización (Benjamin):** bandeja por firmar, `castVerdict` sobre la operación con las invariantes de `verdict-policy`, `APPROVE_WITH_CHANGES` con recálculo, `RETURN` con comentario, `DecisionLog` append-only y acta con el cargo ejercido. `POST /approvals/resolve` deja de aceptar actor en el cuerpo.

## Capas afectadas

- `packages/shared`, `packages/domain` (`ports.ts` + módulos nuevos por carril), `packages/application`, `apps/api` (módulos `operations`, `ai`, `approvals`; persistencia en memoria), `apps/web` (pestañas del expediente, bandeja, voto, acta).
- Sin migración de base de datos: la persistencia sigue en memoria de proceso (change aparte).

## No objetivos

- Fase 8 (folder de identidad, IVE, contratos, PDF, paquete).
- Persistencia Prisma, autenticación real (`AuthGateway`), tablero de semáforos y captaciones de ahorro.
- Nuevos proveedores de IA: el motor vive en el change `ai-review-engine` (rama `feat/motor-ia`).

## Límites de IA

- La IA no aprueba, no rechaza, no puntúa ni recomienda. No escribe `Verdict`, `CalcResult`, `FinancialAssessment` ni `Opinion5C`.
- El borrador 5C es una sugerencia a pedido; el dictamen lo escribe una persona.
- Si la IA no está disponible, el envío a revisión y las firmas siguen; solo «Aprobar» espera a que se resuelvan las alertas existentes.
