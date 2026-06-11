# Phase 6 — Testing

Use mock `NotificationAdapter` in CI; optional real adapter in staging manual test.

## Testing criteria

| # | Criterion |
| --- | --- |
| T6.1 | Viewing request → confirm e2e |
| T6.2 | Notification payload + idempotency unit tests |
| T6.3 | Retry on provider failure |
| T6.4 | Invalid location rejected |

## Unit tests (required)

| Area | Tests |
| --- | --- |
| `ViewingStateService` | Valid transitions; `CONFIRMED` requires prior states |
| `NotificationService` | Idempotency key suppresses second send |
| `NotificationService` | Failure schedules retry; `notification_attempts` count++ |
| `ViewingService` | Location must be in approved list |

## E2E tests (required)

| ID | Flow | Expected |
| --- | --- | --- |
| E6.1 | Buyer → `POST /listings/:id/viewings` → admin confirm | Status `CONFIRMED`; participants stored |
| E6.2 | Admin reschedule | New time; status `RESCHEDULED` or per model |
| E6.3 | Admin cancel | `CANCELLED` |
| E6.4 | Mock adapter: listing submitted triggers notification record | Row in `notifications` |
| E6.5 | Same idempotency key twice | Single provider call (mock call count = 1) |

## Integration tests (required)

| ID | Test |
| --- | --- |
| I6.1 | Simulated provider throw → retry → attempts = 2 |

## E2E tests (recommended)

| ID | Flow |
| --- | --- |
| E6.6 | Seller confirm path |
| E6.7 | Reminder job fires for fixture viewing in 24h window (clock mock) |

## Manual (staging)

- [ ] One email and one SMS received for viewing confirmed (sandbox credentials)

## Sign-off gate

Required automated tests green; staging manual notification checked or waived with ticket; DOD complete.
