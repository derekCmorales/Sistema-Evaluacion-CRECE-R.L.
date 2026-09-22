# Decision factors

## Requirements

### Requirement: Configurable verdict vocabulary
Decision factors SHALL be stored in `DecisionFactor` with `code`, `label`, `active`, and `sortOrder`. Labels SHALL use the cooperative vocabulary from `docs/contexto.md` §6 (12 seeded factors).

### Requirement: No weights
The catalog SHALL NOT store numeric weights. Factor usage is observed in reports, not prescribed. A `score`, `riskBand` or auto-approve recommendation in any layer is a design bug.

### Requirement: Inactive factors
Deactivating a factor SHALL prevent new votes from selecting it but MUST NOT delete historical verdict factor references.

## Tests

- `packages/domain/src/decision-factors.test.ts`
- `apps/api/prisma/seed.sql`
