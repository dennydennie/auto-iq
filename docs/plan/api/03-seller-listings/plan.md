# Phase 3: Seller Listing Workflow

| | |
| --- | --- |
| **Goal** | Sellers complete listing wizard and submit for admin review. |
| **Depends on** | [02-identity](../02-identity/plan.md) |
| **Blocks** | [04-admin-ops](../04-admin-ops/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Data model

`vehicles`, `vehicle_status_history`, `vehicle_specs`, `vehicle_pricing`, `vehicle_images`, `vehicle_documents`.

## Modules

`listings`, `listing-media`, `listing-documents`, `storage`, `reference-data`.

## Endpoints

Implement [frontend-wiring.md](./frontend-wiring.md) — `ROUTES.listings.*`, `ROUTES.storage.*`, `ROUTES.referenceData.all`.

## Tasks

- [ ] Draft CRUD; edit only `DRAFT` / `CHANGES_REQUESTED`
- [ ] Submit → `SUBMITTED` with wizard validation
- [ ] Status history on every transition
- [ ] MinIO local; presign + register with magic-byte check
- [ ] Cover image rule; seller dashboard + timeline
- [ ] Seller cannot reach admin/published states

## Next phase

[04-admin-ops/plan.md](../04-admin-ops/plan.md)
