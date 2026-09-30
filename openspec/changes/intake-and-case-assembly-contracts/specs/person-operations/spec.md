# Person & Operations (Delta)

## Requirements

### Requirement: DPI-based single person identity
The system SHALL identify persons by a unique 13-digit Guatemalan DPI. Registration SHALL prevent duplicate person profiles across different credit or savings operations. When registered by an advisor, the system SHALL record `registeredByUserId`.

### Requirement: Draft operation with dynamic checklist
A credit application SHALL be initialized in `DRAFT` state with product type, guarantee type, requested amount, term in months, purpose, and guarantor flag. The initial checklist requirements SHALL be dynamically generated using `createChecklistItems` in `@crece/domain`.

### Requirement: Checklist item non-applicable justification
When a checklist item is marked as `NOT_APPLICABLE`, the system SHALL require a non-empty explanation (`notApplicableReason` minimum 5 characters). Marking `NOT_APPLICABLE` without a justification SHALL fail with `ValidationError`.

### Requirement: Manual financial assessment and watchlist tracking
The system SHALL capture manual financial assessment fields (monthly sales, income, expenses, debt payments). The system SHALL record watchlist inquiries against control lists (OFAC, ONU, Guatecompras) with status and querying user traceability. Case assembly SHALL record the user who assembled the file (`assembledByUserId`).

## Tests

- `packages/application/src/person-contracts.test.ts`
- `packages/application/src/operation-contracts.test.ts`
- `packages/application/src/case-assembly-contracts.test.ts`
- `packages/domain/src/checklist-resolver.test.ts`
