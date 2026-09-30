# Design: intake-and-case-assembly-contracts

## Architecture Overview

```
apps/web (Frontend Next.js)
    ↓ HTTP REST
apps/api (NestJS Modules)
    - PersonsModule (InMemoryPersonStore)
    - OperationsModule (InMemoryOperationStore)
    ↓ Application Layer
packages/application (Validation & Parsers)
    - person-contracts.ts
    - operation-contracts.ts
    - case-assembly-contracts.ts
    ↓ Domain Layer
packages/domain (Entities, Checklists, Calculators, Fixtures)
    - entities.ts (Person, Operation)
    - checklist-resolver.ts
    - calc-engine.ts
    - fixtures/mock-data.ts
    ↓ Shared Layer
packages/shared (Types, Brands, DTOs, Constants)
    - index.ts
```

## Key Decisions

1. **Brand Types for Identifiers**:
   - `PersonId`, `OperationId`, `UserId`, `DocumentId` are branded strings preventing cross-identifier contamination.

2. **DPI Normalization & Guatemala Validation**:
   - Guatemala National Identity Document (DPI) uses 13 digits (`CUI`). The parser normalizes spaces/hyphens and enforces exact 13 numeric digits.
   - Deduplication is enforced at the store/repository layer: lookups by DPI prevent duplicate `Person` entities.

3. **In-Memory Store Pattern**:
   - Following `InMemoryProspectStore`, both `InMemoryPersonStore` and `InMemoryOperationStore` allow full runtime operation and integration testing without requiring a live PostgreSQL instance during contract development.
   - Operations are pre-seeded with `MOCK_DRAFT_OPERATION_NO_GUARANTOR` and `MOCK_DRAFT_OPERATION_WITH_GUARANTOR`.

4. **Dynamic Checklist Resolution**:
   - `toDraftOperationEntity` calls `@crece/domain` `createChecklistItems` to resolve base requirements, product requirements, guarantee requirements, and guarantor requirements.

5. **Strict "Not Applicable" Rule**:
   - Enforced at `@crece/application` with `ValidationError` if `notApplicableReason` is not provided or shorter than 5 characters.
