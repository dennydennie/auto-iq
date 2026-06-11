# Phase 5 — Frontend wiring

Import: `@auto-iq/contracts/catalogue`, `@auto-iq/contracts/quotes`, `@auto-iq/contracts/vehicle-requests`, `ROUTES`.

## Public catalogue (guest or auth)

| Method | Path | Query | Auth | Response |
| --- | --- | --- | --- | --- |
| GET | `ROUTES.catalogue.list` | `CatalogueFilters` | Optional | `CatalogueResponse` |
| GET | `ROUTES.catalogue.detail(slugOrId)` | — | Optional | `PublicListingDto` |
| GET | `ROUTES.catalogue.inspectionSummary(slugOrId)` | — | Optional | `BuyerInspectionSummaryDto` |

### `CatalogueFilters` (query)

`cursor`, `limit`, `bodyType`, `make`, `model`, `yearMin`, `yearMax`, `priceMin`, `priceMax`, `mileageMax`, `transmission`, `fuelType`, `city`, `bisellVerified`, `sortBy`, `sortDir`.

**Card grid:** `PublicListingCardDto` — `coverImageUrl`, `bisellVerified`, `inspectionScore`, `daysListed`.

**Detail:** `PublicListingDto` — must not render fields absent from type (no seller PII). `inspectionSummary` may be null; use dedicated endpoint for full health check.

## Saved vehicles (auth required)

| Method | Path | Query | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `ROUTES.me.savedVehicles` | `page`, `limit` | — | `OffsetPaginatedResponse<SavedVehicleDto>` |
| POST | `ROUTES.me.savedVehicle(listingId)` | — | — | `SavedVehicleDto` |
| DELETE | `ROUTES.me.savedVehicle(listingId)` | — | — | 204 |

## Quotes (buyer auth)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `ROUTES.quotes.create(listingId)` | `CreateQuoteRequest` | `QuoteDto` |
| GET | `ROUTES.quotes.buyerList` | `QuoteListParams` query | paginated `QuoteDto` |

### `CreateQuoteRequest` (required)

`offerPriceUsd`, `paymentPlan` (`FULL_CASH` \| `BANK_TRANSFER` \| `OTHER`); optional `message`.

## Vehicle sourcing (buyer auth)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `ROUTES.vehicleRequests.create` | `CreateVehicleRequestRequest` | `VehicleRequestDto` |
| GET | `ROUTES.vehicleRequests.buyerList` | `VehicleRequestListParams` | paginated `VehicleRequestDto` |

### `CreateVehicleRequestRequest` (required)

`maxBudgetCents`, `urgency` (`ASAP` \| `ONE_MONTH` \| `BROWSING`); optional make/model/year/odometer filters.

## Admin triage (same phase API)

| Method | Path | Body |
| --- | --- | --- |
| GET/PATCH | `ROUTES.admin.quotes`, `quote(id)` | `AdminUpdateQuoteRequest` |
| GET/PATCH | `ROUTES.admin.vehicleRequests`, `vehicleRequest(id)` | `UpdateVehicleRequestRequest` |

See [04-admin-ops/frontend-wiring.md](../04-admin-ops/frontend-wiring.md) for admin query params.

Unsafe buyer/admin mutations require `X-CSRF-Token` when using cookie auth.

## Frontend quality

Marketplace and buyer request screens must satisfy [frontend-quality.md](../reference/frontend-quality.md): cards and filters are keyboard usable, labels are visible, copy is externalized, and price/mileage/date formatting uses shared helpers.
