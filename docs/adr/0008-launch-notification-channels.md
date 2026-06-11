# ADR 0008: Launch Notification Channel Set

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product |
| Date | 2026-06-09 |
| Revisit | 2026-11-01 |

## Decision

MVP launch notifications use `EMAIL` and `SMS` only. `WHATSAPP` remains disabled until channel onboarding and compliance review are complete.

## Consequences

- Production phase 6 notification jobs must only enqueue email/SMS templates.
- `WHATSAPP` in `NOTIFICATION_CHANNELS` remains an enum for future extension and is not enabled in default provider settings.
- Admin retry and failure dashboards track only channels that are active.

## Contract impact

- No contract changes required for this phase.
- Any future WhatsApp connector is behind feature flags and a dedicated rollout ADR.

