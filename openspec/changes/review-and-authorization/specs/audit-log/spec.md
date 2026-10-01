# Audit log (delta)

## ADDED Requirements

### Requirement: Review and authorization trail
The actions `HARD_RULE_EXCEPTION_JUSTIFIED`, `OPINION_SAVED`, `OPERATION_READY_FOR_REVIEW`, `OPERATION_REOPENED`, `OPERATION_SUBMITTED`, `AI_ALERT_RESOLVED` and `AI_REVIEW_RETRIED` SHALL be appended to `AuditLog` with the session user and an es-GT label from `CAPTURE_AUDIT_ACTION_LABELS`. Verdicts SHALL be appended to `DecisionLog`; neither log exposes update or delete.

#### Scenario: Label for every action
- **WHEN** the operation history lists a sprint 2 action
- **THEN** it shows its Spanish label and the user who did it

## Tests

- `packages/shared/src/contract.test.ts`
- `apps/api/src/infrastructure/persistence/sprint2-adapters.test.ts`
