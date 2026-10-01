# 21 — Secuencia de revisión y autorización (fases 4–7)

Continúa la [secuencia de captación](./20-secuencia-captacion.md) desde un expediente armado. Contrato y dueños: [sprint-2.md](../sprint-2.md) y `openspec/changes/review-and-authorization/`. Todo endpoint toma el actor de la sesión (`@CurrentActor`) y cada caso de uso deja su entrada en la bitácora.

```mermaid
sequenceDiagram
  actor Asesor
  actor Firmante as Jefatura / Delegado / Consejo
  participant Web as apps/web
  participant API as apps/api (controllers)
  participant App as application (review-submission, ai-review, authorization)
  participant Dom as domain (hard-rules, review-readiness, ai-alerts, verdict-policy)
  participant Facts as ReviewFactsPublisher
  participant IA as Motor de IA (feat/motor-ia)
  participant Log as AuditLog / DecisionLog

  Note over Asesor,Log: Fase 4 — cálculo y reglas (Josué)
  Asesor->>Web: pestaña «Cálculo y reglas»
  Web->>API: GET /operations/:id
  API->>App: getCaseFile
  App->>Dom: calculateCreditMetrics + evaluateHardRules (umbrales de config hardRules)
  opt regla que bloquea
    Asesor->>Web: justificar excepción
    Web->>API: PUT /operations/:id/hard-rules/:ruleCode/exception
    App->>Dom: justifyHardRuleException (hit existente, motivo, caso editable)
    App->>Log: HARD_RULE_EXCEPTION_JUSTIFIED
  end

  Note over Asesor,Log: Fase 5 — dictamen y envío (Josué)
  Web->>API: PUT /operations/:id/opinion
  App->>Log: OPINION_SAVED
  Web->>API: POST /operations/:id/ready
  App->>Dom: assertReadyForReview (armado vigente, BLOCK con excepción, 5C completo)
  App->>Log: OPERATION_READY_FOR_REVIEW
  Web->>API: POST /operations/:id/submit
  App->>Dom: assertTransition(READY_FOR_REVIEW → UNDER_REVIEW), ronda nueva (verdicts vacío)
  App->>Log: OPERATION_SUBMITTED
  App-)Facts: OperationSubmittedForReview { operationId, submittedBy, occurredAt }
  Note right of Facts: si falla, el envío ya quedó hecho

  Note over Asesor,Log: Fase 6 — la IA asiste (Derek)
  Facts-)IA: AiEngine.handle → RunReviewAnalysis
  IA-->>API: ReviewAnalysisCompleted (resumen + alertas con evidencia) o AiRunFailed
  Asesor->>Web: pestaña «Revisión IA»
  alt análisis disponible
    Web->>API: PUT /operations/:id/ai-alerts/:alertId/resolution
    App->>Dom: resolveAiAlert (CONFIRMED / DISMISSED con motivo)
    App->>Log: AI_ALERT_RESOLVED
  else no disponible
    Web->>API: POST /operations/:id/ai-review/retry
    App->>Log: AI_REVIEW_RETRIED
  end

  Note over Firmante,Log: Fase 7 — autorización (Benjamin)
  Firmante->>Web: bandeja «Por firmar»
  Web->>API: GET /approvals/inbox
  Firmante->>Web: veredicto + factores + motivo (+ cambios)
  Web->>API: POST /operations/:id/verdicts
  App->>Dom: resolveRoute, officeToExercise, una persona una vez, originador, factores activos, assertCanApprove
  opt APPROVE_WITH_CHANGES
    App->>Dom: calculateCreditMetrics con el menor monto y plazo propuestos (la banda no cambia)
  end
  App->>Log: VERDICT_CAST (DecisionLog, cargo ejercido)
  alt la ruta se cierra
    App->>Dom: resolveFinalDecision + assertTransition
    API-->>Web: APPROVED / REJECTED / RETURNED_TO_ADVISOR
  end
  Web->>API: GET /operations/:id/minutes
  API-->>Web: MinutesView («en calidad de»)
```
