# Phase 5 — Testing

Fixtures: at least one `PUBLISHED` listing from Phase 4; one `SUBMITTED` not in catalogue.

## Testing criteria

| # | Criterion |
| --- | --- |
| T5.1 | Unpublished listing absent from catalogue |
| T5.2 | `PublicListingDto` / `PublicListingCardDto` snapshot — no keys outside contract |
| T5.3 | Saved vehicles e2e |
| T5.4 | Quote + admin triage e2e |
| T5.5 | Vehicle request e2e |

## Unit tests (required)

| Area | Tests |
| --- | --- |
| `CatalogueQueryService` | SQL/QueryBuilder filters `status = PUBLISHED` only |
| `PublicListingMapper` | Strips private fields; maps inspection summary allowlist |
| `QuoteService` | Creates `NEW`; status transitions valid |
| `SavedVehiclesService` | Duplicate save idempotent or 409 per design |

## E2E tests (required)

| ID | Flow | Expected |
| --- | --- | --- |
| E5.1 | `GET /listings` | Submitted listing id absent |
| E5.2 | `GET /listings/:publishedId` | 200; no `document`, `verification`, `private` keys |
| E5.3 | `GET /listings/:id/inspection-summary` (approved) | 200; only allowlisted fields |
| E5.4 | Buyer login → save → list saved → delete | Consistent state |
| E5.5 | Buyer → `POST .../quotes` → admin `GET /admin/quotes` → `PATCH` assigned | Status updates |
| E5.6 | `POST /vehicle-requests` → admin list → patch triaged | Status updates |
| E5.7 | Guest `GET /listings/:id` per ADR | Matches public/gated rule |

## E2E tests (recommended)

| ID | Flow |
| --- | --- |
| E5.8 | Catalogue pagination/filters (price, make) |
| E5.9 | Quote rate limit 429 |

## Sign-off gate

Required tests green; DOD complete.
