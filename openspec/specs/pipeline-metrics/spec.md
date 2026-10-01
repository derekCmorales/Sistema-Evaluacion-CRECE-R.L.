# Pipeline metrics

## Purpose

Tablero de semáforos calculado con datos propios del sistema, nunca del core contable.

## Requirements

### Requirement: Semaphore dashboard
The pipeline tablero SHALL compute six semaphores from system-owned data: waiting review, incomplete checklists, expiring documents, unjustified hard rules, monthly funnel, and fixed-term maturities. No metric SHALL read the accounting core.

#### Scenario: Dashboard sources
- **WHEN** the pipeline dashboard is computed
- **THEN** all six semaphores use system-owned data only

### Requirement: Configurable thresholds
Semaphore thresholds SHALL be read from `ConfigEntry` key `semaphore` with defaults: `waitingDaysRed`, `checklistIncompletePercent`, `docExpiryWarningDays`, `waitingReminderDays`.

#### Scenario: Threshold from config
- **WHEN** `ConfigEntry` `semaphore` changes `waitingDaysRed`
- **THEN** the dashboard uses the new value without a code change

### Requirement: Waiting reminders
Operations in `UNDER_REVIEW` with `submittedForReviewAt` older than `waitingReminderDays` SHALL trigger in-app `WAITING_REMINDER` notifications via `Notifier`.

#### Scenario: Long wait
- **WHEN** an operation stays `UNDER_REVIEW` longer than `waitingReminderDays`
- **THEN** a `WAITING_REMINDER` notification is sent through `Notifier`

## Tests

- Seed defaults in `apps/api/prisma/seed.sql` and `@crece/shared` `DEFAULT_SEMAPHORE_CONFIG`
