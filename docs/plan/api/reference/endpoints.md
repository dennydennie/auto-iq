# API Endpoints (`/api/v1`)

**Canonical source:** `packages/contracts/src/routes.ts` (`ROUTES`) and [frontend-contract.md](./frontend-contract.md).

Do not use legacy paths from early planning (`/seller/listings`, `/auth/password/forgot`). The API and `apps/web` must match contracts.

## Quick reference by phase

| Phase | Wiring doc |
| --- | --- |
| 0 | [00-discovery/frontend-wiring.md](../00-discovery/frontend-wiring.md) |
| 1 | [01-foundation/frontend-wiring.md](../01-foundation/frontend-wiring.md) |
| 2 | [02-identity/frontend-wiring.md](../02-identity/frontend-wiring.md) |
| 3 | [03-seller-listings/frontend-wiring.md](../03-seller-listings/frontend-wiring.md) |
| 4 | [04-admin-ops/frontend-wiring.md](../04-admin-ops/frontend-wiring.md) |
| 5 | [05-buyer-marketplace/frontend-wiring.md](../05-buyer-marketplace/frontend-wiring.md) |
| 6 | [06-viewings-notifications/frontend-wiring.md](../06-viewings-notifications/frontend-wiring.md) |
| 7–8 | [frontend-contract.md](./frontend-contract.md) |

## Contract package exports

```text
@auto-iq/contracts          → index (enums, error, pagination, ROUTES, ApiClient)
@auto-iq/contracts/identity
@auto-iq/contracts/listings
@auto-iq/contracts/catalogue
@auto-iq/contracts/storage
@auto-iq/contracts/admin
@auto-iq/contracts/inspections
@auto-iq/contracts/quotes
@auto-iq/contracts/viewings
@auto-iq/contracts/vehicle-requests
@auto-iq/contracts/notifications
@auto-iq/contracts/reference-data
@auto-iq/contracts/routes
@auto-iq/contracts/client
```

## OpenAPI

Swagger in `apps/api` should generate from the same DTOs as contracts. Phase 7 optional gate: OpenAPI diff vs contract types.
