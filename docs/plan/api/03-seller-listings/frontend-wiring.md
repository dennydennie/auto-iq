# Phase 3 — Frontend wiring

Import: `@auto-iq/contracts/listings`, `@auto-iq/contracts/storage`, `@auto-iq/contracts/reference-data`, `ROUTES`.

**Auth:** All routes require seller cookie session and role `SELLER`. Unsafe methods require `X-CSRF-Token`.

## Reference data (wizard step 0)

| Method | Path | Response |
| --- | --- | --- |
| GET | `ROUTES.referenceData.all` | `ReferenceDataResponse` |

Populate dropdowns: `makes`, `bodyTypes`, `fuelTypes`, `transmissionTypes`, `driveTypes`, `viewingLocations`.

## Listing CRUD

| Method | Path | Query | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `ROUTES.listings.list` | `SellerListingsParams` | — | `OffsetPaginatedResponse<SellerListingSummaryDto>` |
| POST | `ROUTES.listings.create` | — | `CreateListingRequest` | `SellerListingDto` |
| GET | `ROUTES.listings.detail(id)` | — | — | `SellerListingDto` |
| PUT | `ROUTES.listings.upsertSpecs(id)` | — | `UpsertListingSpecsRequest` | `SellerListingDto` |
| PUT | `ROUTES.listings.upsertPricing(id)` | — | `UpsertListingPricingRequest` | `SellerListingDto` |
| POST | `ROUTES.listings.submit(id)` | — | `SubmitListingRequest` | `SellerListingDto` |
| GET | `ROUTES.listings.timeline(id)` | — | — | `ListingTimelineResponse` |

### `SellerListingsParams` (query)

`page`, `limit`, `status?`, `sortBy?` (`createdAt` \| `updatedAt` \| `askPriceUsd`), `sortDir?`.

### Wizard mapping

| UI step | API calls |
| --- | --- |
| 1 Basics | `POST create` or `PUT upsertSpecs` |
| 2 Price | `PUT upsertPricing` — `askPriceUsd`, `negotiable?` |
| 3 Photos | presign → PUT S3 → `registerImage` per slot |
| 4 Documents | presign → PUT S3 → `registerDocument` per type |
| 5 Review | `POST submit` with `SubmitListingRequest.sellerDisclosure` |

### `CreateListingRequest` required fields

All `UpsertListingSpecsRequest` fields + `askPriceUsd`; enums from `BODY_TYPES`, `FUEL_TYPES`, etc.

### `ImagePresignRequest` / register

| Field | Values |
| --- | --- |
| `slot` | `IMAGE_SLOTS` e.g. `FRONT_THREE_QUARTER` |
| `contentType` | `image/jpeg` \| `image/png` \| `image/webp` |
| `contentLength` | bytes |

`RegisterImageRequest`: `storageKey`, `slot`, `isCover?`.

### `DocumentPresignRequest` / register

| Field | Values |
| --- | --- |
| `documentType` | `DOCUMENT_TYPES` |
| `contentType` | `application/pdf` \| `image/jpeg` \| `image/png` |

`RegisterDocumentRequest`: `storageKey`, `documentType`.

## Storage routes (global presign)

| Method | Path | Body |
| --- | --- | --- |
| POST | `ROUTES.storage.imagePresign` | `ImagePresignRequest` |
| POST | `ROUTES.storage.documentPresign` | `DocumentPresignRequest` |
| POST | `ROUTES.storage.registerImage(listingId)` | `RegisterImageRequest` |
| POST | `ROUTES.storage.registerDocument(listingId)` | `RegisterDocumentRequest` |

**Upload:** `PUT` to `ImagePresignResponse.uploadUrl` with declared `Content-Type` only — no API auth headers.

## Seller UI fields from `SellerListingDto`

| UI | Field |
| --- | --- |
| Status badge | `status` |
| Admin feedback | `changesNote` when `CHANGES_REQUESTED` |
| Cover thumb | `images.find(isCover).url` |
| Docs list | `documents[]` — no `downloadUrl` on seller GET |

## Errors

`LISTING_NOT_EDITABLE`, `WIZARD_INCOMPLETE`, `INVALID_STATE_TRANSITION`, `INVALID_FILE_TYPE`, `MAX_IMAGES_EXCEEDED`, `PRESIGN_FAILED`.

## Frontend quality

Seller wizard changes must satisfy [frontend-quality.md](../reference/frontend-quality.md): labeled inputs, keyboard-safe step navigation, externalized copy, and shared price/mileage formatting.
