# ADR 0007: TIDA Import Quotations Route Strategy

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product |
| Date | 2026-06-09 |
| Revisit | 2026-12-01 |

## Decision

TIDA import quotations share the same lifecycle and storage model as `vehicle-requests` in MVP. No separate public API route path is created at this stage.

## Consequences

- New import-origin source records map into `VehicleRequest` domain fields via a `source` discriminator.
- Admin triage and buyer status handling remain unchanged (`admin.vehicleRequests` and `vehicleRequests.*`).
- Dedicated TIDA pipeline migration remains deferred to a follow-up phase.

## Contract impact

- No new `@auto-iq/contracts` endpoints are added in this phase.
- `VehicleRequestDto` / `VehicleRequestStatus` fields should include a source marker to support future reporting by origin channel.

