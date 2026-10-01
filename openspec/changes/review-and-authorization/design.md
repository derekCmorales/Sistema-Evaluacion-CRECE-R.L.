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
Al volver a guardar la evaluación, `recordFinancialAssessment` compara `calcResult.inputsHash` antes y después: si cambió, los hits se recalculan sin excepciones y la regla vuelve a bloquear; si no cambió, se conservan. No se agregan campos a `HardRuleHit`. El largo mínimo del motivo sale de `justification.minLength` (semilla 20).

### D5. Precondiciones de revisión en dominio
`assertReadyForReview` exige armado vigente (`assembledAt` y sin cambios posteriores), ningún hit `BLOCK` sin excepción y las cinco secciones del `Opinion5C` con texto. Devuelve los faltantes para que la UI los muestre.

### D6. Quién resuelve alertas
Las resuelve quien responde por el expediente (`ADVISOR`, `BRANCH_HEAD`) con motivo, mientras la operación está `UNDER_REVIEW`. El firmante ve la resolución. Se puede firmar con alertas abiertas, pero no **aprobar** (`assertCanApprove`).

### D7. Veredicto sobre la operación
`castVerdict` reutiliza `resolveRoute`, `officeToExercise`, `assertOnePersonOnce`, `assertOriginatorCannotAuthorize`, `assertApproveWithChangesRequiresModification` y `resolveFinalDecision`. Cada voto se agrega a `DecisionLog` (append-only). Cuando la ruta se cierra, aplica `assertTransition` y el estado final; `APPROVE_WITH_CHANGES` recalcula con `calculateCreditMetrics`. `RETURN` exige comentario.

### D8. Bandeja y acta derivadas
La bandeja es una consulta: operaciones `UNDER_REVIEW` cuya ruta todavía necesita un cargo que el usuario puede ejercer en ellas. El acta (`MinutesView`) se arma desde los veredictos; el PDF es de la fase 8.

## Riesgos

- **Merge con el motor:** `feat/motor-ia` no tiene las fases 1–3 y cambia `AiAlert`. Derek integra `main` en el motor antes de D1 (conflictos mecánicos conocidos: `package.json`, `app.module.ts`, el filtro de errores, `vitest.config.ts`, `crece-ds.tsx`, lockfile).
- **Persistencia en memoria:** todo se pierde al reiniciar la API; la demo corre en una sola sesión.

## Tests

Ver `tasks.md`: cada tarea nombra su archivo de prueba en la capa dueña. Contrato del PR 0: `packages/shared/src/contract.test.ts`, `packages/application/src/rbac.test.ts`, `packages/application/src/test-support/review-fakes.test.ts`, `apps/api/src/infrastructure/persistence/sprint2-adapters.test.ts`.
