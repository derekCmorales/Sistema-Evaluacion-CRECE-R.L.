# Decision factors

## Purpose

Vocabulario de factores que acompaña cada voto, sin pesos ni puntaje.

## Requirements

### Requirement: Configurable verdict vocabulary
Decision factors SHALL be stored in `DecisionFactor` with `code`, `label`, `active`, and `sortOrder`. Labels SHALL use the cooperative vocabulary from `docs/contexto.md` §6 (12 seeded factors).

#### Scenario: Factor chips
- **WHEN** a vote form loads
- **THEN** it offers the active `DecisionFactor` labels in `sortOrder`

### Requirement: No weights
The catalog SHALL NOT store numeric weights. Factor usage is observed in reports, not prescribed. A `score`, `riskBand` or auto-approve recommendation in any layer is a design bug.

#### Scenario: No score anywhere
- **WHEN** a factor is stored or reported
- **THEN** no numeric weight, score or risk band is stored or shown

### Requirement: Inactive factors
Deactivating a factor SHALL prevent new votes from selecting it but MUST NOT delete historical verdict factor references.

#### Scenario: Deactivated factor
- **WHEN** a factor is deactivated
- **THEN** new votes cannot select it
- **AND** historical verdicts keep their reference to it

## Tests

- `packages/domain/src/decision-factors.test.ts`
- `apps/api/prisma/seed.sql`
