# Phase 5: Buyer Marketplace and Requests

| | |
| --- | --- |
| **Goal** | Public catalogue, saved vehicles, quotes, and vehicle sourcing requests. |
| **Depends on** | [04-admin-ops](../04-admin-ops/plan.md) (`PUBLISHED` listings) |
| **Blocks** | [06-viewings-notifications](../06-viewings-notifications/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Data model

`quote_requests`, `vehicle_requests`, `saved_vehicles`.

## Modules

`listings` (public projection), `quotes`, `vehicle-requests`, `buyer-profiles`.

## Endpoints

Implement [frontend-wiring.md](./frontend-wiring.md) — `ROUTES.catalogue.*`, `ROUTES.me.savedVehicles`, `ROUTES.quotes.*`, `ROUTES.vehicleRequests.*`.

## Tasks

- [ ] Catalogue only `PUBLISHED`; filters + pagination
- [ ] Public DTO has no private/verification fields
- [ ] Inspection summary gated on approval
- [ ] Saved vehicles CRUD
- [ ] Quote and vehicle-request creation + admin triage
- [ ] Rate limits on buyer inquiry endpoints

## Next phase

[06-viewings-notifications/plan.md](../06-viewings-notifications/plan.md)
