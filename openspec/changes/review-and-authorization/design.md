# Design: review-and-authorization

## Contexto

`main` tiene las fases 1–3 (`person-intake`, `case-file`, `case-assembly`), el motor de cálculo y reglas, y `verdict-policy` con las invariantes de autorización ya probadas como funciones puras. Falta llevarlas a casos de uso sobre la operación, con sesión, bitácora y UI. El motor de IA vive en `feat/motor-ia` y entra por un hecho, sin acoplarse al core.

## Decisiones

### D1. Contrato congelado en un PR 0
Los tipos compartidos, los puertos, los permisos, los tokens de inyección y el registro de pestañas se cambian solo en el PR 0. Los carriles escriben en archivos propios (tabla en `docs/sprint-2.md`). Un cambio de contrato es un PR aparte que se revisa antes de usarlo. **Por qué:** en las fases 1–3 cada rama inventó sus tipos y los archivos compartidos generaron conflictos y dos implementaciones.

### D2. El actor sale de la sesión
Todo endpoint nuevo usa `@CurrentActor`. Ningún DTO lleva `userId`, `byUserId`, `source` ni `officeCode`; el cargo ejercido lo calcula `officeToExercise`. `POST /approvals/resolve` deja de leer `actorId`, `originatorId` y veredictos del cuerpo.

### D3. Hecho de envío sin acoplamiento
`submitForReview` publica `OperationSubmittedForReview` por `ReviewFactsPublisher`. Si la publicación falla, el envío ya quedó hecho y se registra el fallo; la operación muestra «análisis no disponible» y se puede reintentar. La fase 6 se suscribe al publicador en `apps/api`.

### D4. Excepciones atadas a la evaluación
Cada vez que se recalculan los hits (`recalculate` en `case-file.ts`, que usan la evaluación y el fiador) se compara `calcResult.inputsHash` antes y después: si cambió, los hits se recalculan sin excepciones y la regla vuelve a bloquear; si no cambió, se conservan. No se agregan campos a `HardRuleHit`. El largo mínimo del motivo sale de `justification.minLength` (semilla 20).

### D5. Precondiciones de revisión en dominio
`assertReadyForReview` exige armado vigente (`assembledAt` presente; solo los cambios del expediente —checklist, evaluación, fiador, listas— lo borran, no el dictamen ni las excepciones), ningún hit `BLOCK` sin excepción y las cinco secciones del `Opinion5C` con texto. Devuelve los faltantes para que la UI los muestre.

### D6. Hecho de envío con la forma del motor
`OperationSubmittedForReview` lleva `type`, `operationId`, `submittedBy` y `occurredAt`, igual que `OperationSubmittedForReviewSchema` de `@crece/ai-engine`. La idempotencia por `eventId` aplica a los eventos que el motor emite, no a este hecho.

### D6b. Quién resuelve alertas
Las resuelve quien responde por el expediente (`ADVISOR`, `BRANCH_HEAD`) con motivo, mientras la operación está `UNDER_REVIEW`. El firmante ve la resolución. Se puede firmar con alertas abiertas, pero no **aprobar** (`assertCanApprove`).

### D7. Veredicto sobre la operación
`AuthorizationDeps` trae la política (`getAuthorizationPolicy`), un `UserDirectory` (nombre para el acta y miembros activos del Consejo para `resolveFinalDecision`) y el catálogo de factores activos. `castVerdict` reutiliza `resolveRoute`, `officeToExercise`, `assertOnePersonOnce`, `assertOriginatorCannotAuthorize`, `assertApproveWithChangesRequiresModification` y `resolveFinalDecision`. Cada voto se agrega a `DecisionLog` (append-only). Cuando la ruta se cierra, aplica `assertTransition` y el estado final; `APPROVE_WITH_CHANGES` recalcula con `calculateCreditMetrics`. `RETURN` y `REJECT` exigen motivo.

### D7b. Rondas y votos mixtos
`submitForReview` abre una ronda nueva: vacía `verdicts`; la historia de rondas anteriores queda en `DecisionLog`. La banda se fija con el monto solicitado al enviar. Si la ruta cierra aprobada y algún voto aprobatorio trae cambios, se aprueba con el menor monto y el menor plazo propuestos y se recalcula; la banda no se vuelve a calcular. (Semilla de decisión; se confirma en el kickoff.)

### D8. Bandeja y acta derivadas
La bandeja es una consulta: operaciones `UNDER_REVIEW` cuya ruta todavía necesita un cargo que el usuario puede ejercer en ellas. El acta (`MinutesView`) se arma desde los veredictos; el PDF es de la fase 8.

## Riesgos

- **Merge con el motor:** `feat/motor-ia` no tiene las fases 1–3. El PR 0 ya trajo `ai-alerts.ts`, `AiEvidence` y el nuevo `AiAlert` idénticos a los del motor para que no choquen. Quedan conflictos mecánicos conocidos al integrar `main` en el motor: `package.json`, `app.module.ts`, el filtro de errores, `vitest.config.ts`, `crece-ds.tsx`, lockfile.
- **Alcance de la fase 6:** el análisis real necesita los grupos 5–7 del motor, aún pendientes. La demo tiene plan B (D6): análisis falso detrás del flag, marcado en la UI.
- **Persistencia en memoria:** todo se pierde al reiniciar la API; la demo corre en una sola sesión.

## Tests

Ver `tasks.md`: cada tarea nombra su archivo de prueba en la capa dueña. Contrato del PR 0: `packages/shared/src/contract.test.ts`, `packages/application/src/rbac.test.ts`, `packages/application/src/test-support/review-fakes.test.ts`, `apps/api/src/infrastructure/persistence/sprint2-adapters.test.ts`.
