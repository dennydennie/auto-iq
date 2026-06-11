# ADR 0004: Guest Listing Detail Scope

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product |
| Date | 2026-06-09 |
| Revisit | 2026-10-01 |

## Decision

Guest users can view full public listing detail for published records via `GET /api/v1/listings/:slugOrId` (same path used by catalogue detail). Buyer-specific state and user actions remain protected.

The seller-owned route `GET /api/v1/listings/:slugOrId` may also return listing management data when authenticated with seller context; the response shape is therefore role-driven and privacy-safe.

## Consequences

- `ROUTES.catalogue.detail` is treated as optional-auth for detail pages.
- The public endpoint must only return `PublicListingDto` fields, and never return private documents or contact channels.
- Actions such as save, quote, and viewing requests remain auth-protected in phase 5/6.

## Contract impact

- `apps/web` detail page route guards can remain optional for detail render, but mutation actions still require authentication in `apps/web` and `apps/mobile`.

