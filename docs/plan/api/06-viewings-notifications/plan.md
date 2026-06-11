# Phase 6: Viewings and Notifications

| | |
| --- | --- |
| **Goal** | Viewing coordination and reliable email/SMS notifications. |
| **Depends on** | [05-buyer-marketplace](../05-buyer-marketplace/plan.md), [02-identity](../02-identity/plan.md) adapters |
| **Blocks** | [07-hardening](../07-hardening/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Data model

`viewing_appointments`, `viewing_participants`, `approved_viewing_locations`, `notifications`, `notification_attempts`.

## Modules

`viewings`, `notifications`, `reference-data` (locations).

## Tasks

- [x] Viewing lifecycle per [data-model](../reference/data-model.md)
- [x] Seller confirm path (per ADR)
- [x] Admin confirm/reschedule/cancel/complete/no-show
- [x] Email + SMS adapters; templates; retry + idempotency
- [x] Reminder job (cron) for upcoming viewings
- [x] Wire listing/OTP/viewing events to notification service

## Next phase

[07-hardening/plan.md](../07-hardening/plan.md)
