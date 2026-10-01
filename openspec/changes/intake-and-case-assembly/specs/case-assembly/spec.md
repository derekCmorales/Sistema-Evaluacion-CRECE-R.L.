# Case assembly

## Purpose

Phase 3 of the credit process: the advisor assembles the case file (checklist, manual financial assessment, optional guarantor, control-list checks) and records who assembled it. Calculations come from the deterministic engine; nothing scores or recommends.

## ADDED Requirements

### Requirement: Editable only with the advisor
Case file changes SHALL be allowed only in `DRAFT` or `RETURNED_TO_ADVISOR`.

#### Scenario: Under review
- **WHEN** an operation is `UNDER_REVIEW`
- **THEN** recording an assessment fails with `INVARIANT_VIOLATION`

### Requirement: Manual assessment, deterministic calculation
The financial assessment SHALL be captured manually and SHALL produce `calcResult` and `hardRuleHits` through `calculateCreditMetrics` and `evaluateHardRules`, using the rate from configuration. Optional numeric fields that are present but not numeric SHALL fail instead of being dropped. No score, risk band or recommendation SHALL appear.

#### Scenario: Non-numeric guarantee value
- **WHEN** `guaranteeValue` is `"sesenta mil"`
- **THEN** the request fails with a validation error

### Requirement: Flexible guarantor
A guarantor SHALL be recordable with only a name; a provided DPI SHALL be normalized to 13 digits. With a guarantor, the case SHALL require the guarantor's financial assessment before it is complete, and the calculation SHALL include it.

#### Scenario: Guarantor without assessment
- **WHEN** a guarantor is added with only a name
- **THEN** the checklist gains the guarantor items and the case reports the gap `GUARANTOR_INCOMPLETE`

### Requirement: Control-list checks
Checks against OFAC, ONU and Guatecompras SHALL be recorded manually with source, query, result, notes and the user. Per source the most recent check SHALL apply. Only `CLEAR` SHALL count as checked; `MATCH_FOUND` SHALL require notes and SHALL leave a visible gap. Required sources SHALL come from configuration (`caseAssembly.watchlistSources`).

#### Scenario: Match found
- **WHEN** ONU returns `MATCH_FOUND` and the rest of the case is complete
- **THEN** the case reports the gap `WATCHLIST_MATCH` and cannot be marked assembled

### Requirement: Assembly status and record
The system SHALL report the case gaps (checklist pending, assessment missing, guarantor incomplete, list missing, list under manual review, list match). Missing-visible items SHALL allow advancing and SHALL be counted. Only a case without gaps SHALL be marked assembled, recording the user and time; any later change SHALL clear that record. Every step SHALL be appended to the audit log.

#### Scenario: Change after assembling
- **WHEN** a checklist item changes after the case was marked assembled
- **THEN** `assembledByUserId` and `assembledAt` are cleared

## Tests

- `packages/domain/src/case-assembly.test.ts`
- `packages/application/src/case-assembly-contracts.test.ts`
- `packages/application/src/case-file.test.ts`
- `apps/api/src/modules/capture/capture.http.test.ts`
- `apps/web/lib/view.test.ts` (presentación de estados; sin reglas)
