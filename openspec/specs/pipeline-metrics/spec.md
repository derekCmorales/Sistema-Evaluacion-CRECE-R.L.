# Pipeline metrics

## Requirements

### Requirement: Semaphore dashboard
The pipeline tablero SHALL compute six semaphores from system-owned data: waiting review, incomplete checklists, expiring documents, unjustified hard rules, monthly funnel, and fixed-term maturities. No metric SHALL read the accounting core.

### Requirement: Configurable thresholds
Semaphore thresholds SHALL be read from `ConfigEntry` key `semaphore` with defaults: `waitingDaysRed`, `checklistIncompletePercent`, `docExpiryWarningDays`, `waitingReminderDays`.

### Requirement: Waiting reminders
Operations in `UNDER_REVIEW` with `submittedForReviewAt` older than `waitingReminderDays` SHALL trigger in-app `WAITING_REMINDER` notifications via `Notifier`.

## Tests

- Seed defaults in `apps/api/prisma/seed.sql` and `@crece/shared` `DEFAULT_SEMAPHORE_CONFIG`
