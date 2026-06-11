# ADR 0009: Listing Status Actions Ownership

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product + Engineering |
| Date | 2026-06-09 |
| Revisit | 2026-12-01 |

## Decision

`ADMIN` is the exclusive role allowed to execute listing lifecycle actions that change public outcomes:

- `listingReject`
- `listingDelist`
- `listingMarkSold`
- `listingMarkReserved`

Only seller-side draft/edit actions remain seller-owned.

## Consequences

- `POST /api/v1/admin/listings/:id/*` handles all trust-impacting admin transitions.
- Seller paths can only create/update draft data and submit for review.
- Any seller request to finalize states must be represented as an admin-visible internal follow-up task.

## Contract impact

- The endpoint ownership model is implemented in route guard metadata and policy checks in phase 2 and phase 4 controllers.

