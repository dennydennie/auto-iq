# Frontend API Contract (`@auto-iq/contracts`)

**Source of truth:** `packages/contracts` — routes in `src/routes.ts`, types per domain file. The API must implement these paths and shapes exactly so `apps/web` can import types and `ROUTES` without adapters.

```typescript
import { ROUTES, ApiClient } from '@auto-iq/contracts';
import type { RegisterRequest, PublicListingDto } from '@auto-iq/contracts';
```

## Global wiring

### Base URL

| Environment | Example |
| --- | --- |
| Local | `http://localhost:3001` (match `apps/api` `PORT`) |
| Staging / prod | Railway `api` service URL |

All paths are under `/api/v1`. Use `ROUTES.*` — never hardcode path strings in the web app.

### Request headers (every JSON call)

| Header | Required | Value |
| --- | --- | --- |
| `Content-Type` | Yes (if body) | `application/json` |
| `Accept` | Yes | `application/json` |
| `Authorization` | Future non-browser clients only | `Bearer <accessToken>` — not used by `apps/web` default auth |
| `X-CSRF-Token` | Unsafe cookie-authenticated methods | Token from `ROUTES.auth.csrf` |
| `X-Correlation-Id` | Optional | Client-generated UUID; echoed on response and in `ApiError.correlationId` |

### Auth modes

| Mode | Frontend behavior | Endpoints |
| --- | --- | --- |
| **HttpOnly cookies** (web default) | `fetch(..., { credentials: 'include' })`; omit `Authorization`; send `X-CSRF-Token` on unsafe methods | All authenticated browser paths |
| **JWT** (future mobile / non-browser) | Store `accessToken` / `refreshToken` in platform-secure storage only; `ApiClient` `getToken` + `onUnauthorized` → `POST ROUTES.auth.refresh` with `RefreshRequest` | Requires ADR update before browser use |

**Anonymous routes** (no `Authorization`, no session cookie required): register, login, OTP send/verify, forgot/reset password, CSRF bootstrap, `GET /health/*`, public catalogue `GET /listings*`. Cookie refresh requires the refresh cookie even though it omits `Authorization`.

### CSRF

`packages/contracts` must expose `ROUTES.auth.csrf` and `CsrfResponse` before Phase 2 closes. `apps/web` obtains a token before unsafe cookie-authenticated requests and retries once on CSRF expiry.

### Response conventions

| Status | Body |
| --- | --- |
| 2xx | Domain DTO JSON (see per-route tables) |
| 204 | No body (`logout`, `DELETE` saved vehicle) |
| 4xx / 5xx | `ApiError` — `code`, `message`, `correlationId`, `statusCode`, optional `details[]` |

Import: `ApiError`, `API_ERROR_CODES` from `@auto-iq/contracts`.

### Pagination

| Style | Query params | Response wrapper | Used on |
| --- | --- | --- | --- |
| Offset | `page`, `limit` | `OffsetPaginatedResponse<T>` | Seller listings, admin queues, inspector tasks |
| Cursor | `cursor`, `limit` | `CursorPaginatedResponse<T>` | Public catalogue |

Repeat array filters as repeated query keys or comma-separated — **API must document one style**; frontend `ApiClient.buildQueryString` sends single values per key (use `bodyType=SEDAN` or multiple keys per Nest convention).

### File upload flow (seller / inspector)

1. `POST` presign route → `uploadUrl`, `storageKey`, `expiresAt`
2. `PUT uploadUrl` **direct to storage** (no API headers; `Content-Type` = declared MIME)
3. `POST` register route with `storageKey` + metadata

---

## Phase map

| Phase | Contract modules | Phase wiring doc |
| --- | --- | --- |
| 1 | `error`, health routes | [01-foundation/frontend-wiring.md](../01-foundation/frontend-wiring.md) |
| 2 | `identity`, `enums` | [02-identity/frontend-wiring.md](../02-identity/frontend-wiring.md) |
| 3 | `listings`, `storage`, `reference-data` | [03-seller-listings/frontend-wiring.md](../03-seller-listings/frontend-wiring.md) |
| 4 | `admin`, `inspections` | [04-admin-ops/frontend-wiring.md](../04-admin-ops/frontend-wiring.md) |
| 5 | `catalogue`, `quotes`, `vehicle-requests` | [05-buyer-marketplace/frontend-wiring.md](../05-buyer-marketplace/frontend-wiring.md) |
| 6 | `viewings`, `notifications` | [06-viewings-notifications/frontend-wiring.md](../06-viewings-notifications/frontend-wiring.md) |
| 7 | All (contract tests) | [07-hardening/testing.md](../07-hardening/testing.md) |
| 8 | Smoke against deployed URL | [08-production/testing.md](../08-production/testing.md) |

---

## Full endpoint index

Detailed request/response types per phase folder `frontend-wiring.md`. Quick index:

### Health

| Method | `ROUTES` | Auth | Response |
| --- | --- | --- | --- |
| GET | `health.live` | No | `{ status: 'ok' }` (implement to match smoke scripts) |
| GET | `health.ready` | No | `{ status, checks: { db, redis, storage } }` |

### Identity — `@auto-iq/contracts/identity`

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `auth.register` | `RegisterRequest` | `RegisterResponse` |
| GET | `auth.csrf` | — | `CsrfResponse` |
| POST | `auth.login` | `LoginRequest` | `LoginResponse` |
| POST | `auth.refresh` | `RefreshRequest?` | `RefreshResponse` |
| POST | `auth.logout` | — | 204 |
| POST | `auth.sendOtp` | `SendOtpRequest` | `SendOtpResponse` |
| POST | `auth.verifyOtp` | `VerifyOtpRequest` | `VerifyOtpResponse` |
| POST | `auth.forgotPassword` | `ForgotPasswordRequest` | 204 |
| POST | `auth.resetPassword` | `ResetPasswordRequest` | 204 |
| GET | `me.profile` | — | `MeResponse` |
| PATCH | `me.profile` | `UpdateMeRequest` | `MeResponse` |
| POST | `me.consents` | `RecordConsentRequest` | `ConsentsResponse` |

### Reference data — `@auto-iq/contracts/reference-data`

| Method | Path | Response |
| --- | --- | --- |
| GET | `referenceData.all` | `ReferenceDataResponse` |

### Storage — `@auto-iq/contracts/storage`

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `storage.imagePresign` | `ImagePresignRequest` | `ImagePresignResponse` |
| POST | `storage.documentPresign` | `DocumentPresignRequest` | `DocumentPresignResponse` |
| POST | `storage.registerImage(listingId)` | `RegisterImageRequest` | `VehicleImageDto` |
| POST | `storage.registerDocument(listingId)` | `RegisterDocumentRequest` | `VehicleDocumentDto` |

### Seller listings — `@auto-iq/contracts/listings`

| Method | Path | Query / body | Response |
| --- | --- | --- | --- |
| GET | `listings.list` → `/me/listings` | `SellerListingsParams` | `OffsetPaginatedResponse<SellerListingSummaryDto>` |
| POST | `listings.create` | `CreateListingRequest` | `SellerListingDto` |
| GET | `listings.detail(id)` | — | `SellerListingDto` |
| PUT | `listings.upsertSpecs(id)` | `UpsertListingSpecsRequest` | `SellerListingDto` |
| PUT | `listings.upsertPricing(id)` | `UpsertListingPricingRequest` | `SellerListingDto` |
| PATCH | `listings.detail(id)` | `UpsertListingDisclosureRequest` | `SellerListingDto` |
| POST | `listings.submit(id)` | `SubmitListingRequest` | `SellerListingDto` |
| GET | `listings.timeline(id)` | — | `ListingTimelineResponse` |

### Catalogue & saved — `@auto-iq/contracts/catalogue`

| Method | Path | Query / body | Response |
| --- | --- | --- | --- |
| GET | `catalogue.list` | `CatalogueFilters` | `CatalogueResponse` |
| GET | `catalogue.detail(slugOrId)` | — | `PublicListingDto` |
| GET | `catalogue.inspectionSummary(slugOrId)` | — | `BuyerInspectionSummaryDto` |
| GET | `me.savedVehicles` | `OffsetPaginationParams` | `OffsetPaginatedResponse<SavedVehicleDto>` |
| POST | `me.savedVehicle(listingId)` | — | `SavedVehicleDto` |
| DELETE | `me.savedVehicle(listingId)` | — | 204 |

### Quotes — `@auto-iq/contracts/quotes`

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `quotes.create(listingId)` | `CreateQuoteRequest` | `QuoteDto` |
| GET | `quotes.buyerList` | `QuoteListParams` | `OffsetPaginatedResponse<QuoteDto>` |

### Vehicle requests — `@auto-iq/contracts/vehicle-requests`

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `vehicleRequests.create` | `CreateVehicleRequestRequest` | `VehicleRequestDto` |
| GET | `vehicleRequests.buyerList` | `VehicleRequestListParams` | `OffsetPaginatedResponse<VehicleRequestDto>` |

### Viewings — `@auto-iq/contracts/viewings`

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `viewings.create(listingId)` | `RequestViewingRequest` | `ViewingDto` |
| GET | `viewings.buyerList` | `ViewingListParams` | `OffsetPaginatedResponse<ViewingDto>` |
| POST | `viewings.sellerConfirm(id)` | — | `ViewingDto` |

### Inspectors — `@auto-iq/contracts/inspections`

| Method | Path | Query / body | Response |
| --- | --- | --- | --- |
| GET | `inspectors.taskList` | `InspectorTaskListParams` | `OffsetPaginatedResponse<InspectionTaskDto>` |
| GET | `inspectors.taskDetail(taskId)` | — | `InspectionTaskDto` + `InspectionReportDto?` |
| POST | `inspectors.submitReport(taskId)` | `SubmitInspectionReportRequest` | `InspectionReportDto` |

### Admin — `@auto-iq/contracts/admin` + inspections

| Method | `ROUTES.admin.*` | Body | Response |
| --- | --- | --- | --- |
| GET | `dashboard` | — | `AdminDashboardDto` |
| GET | `listings` | `AdminListingListParams` | `OffsetPaginatedResponse<AdminListingDto>` |
| GET | `listing(id)` | — | `AdminListingDto` |
| POST | `listingRequestChanges(id)` | `RequestChangesRequest` | `AdminListingDto` |
| POST | `listingApprove(id)` | — | `AdminListingDto` |
| POST | `listingPublish(id)` | — | `AdminListingDto` |
| POST | `listingReject(id)` | `RejectListingRequest` | `AdminListingDto` |
| POST | `listingDelist(id)` | `DelistListingRequest` | `AdminListingDto` |
| POST | `listingMarkSold(id)` | — | `AdminListingDto` |
| POST | `listingMarkReserved(id)` | — | `AdminListingDto` |
| POST | `listingCreateInspectionTask(id)` | `AssignInspectionRequest` | `InspectionTaskDto` |
| POST | `listingOwnershipVerification(id)` | TBD in API — align with ownership ADR | — |
| POST | `listingApproveSummary(id)` | `ApproveBuyerSummaryRequest` | `BuyerInspectionSummaryDto` |
| GET/PATCH | `quotes`, `quote(id)` | `AdminUpdateQuoteRequest` | `QuoteDto` |
| GET/PATCH | `vehicleRequests`, `vehicleRequest(id)` | `UpdateVehicleRequestRequest` | `VehicleRequestDto` |
| GET | `viewings` | `AdminViewingListParams` | `OffsetPaginatedResponse<ViewingDto>` |
| GET | `viewing(id)` | — | `ViewingDto` |
| POST | `viewingConfirm(id)` | `ConfirmViewingRequest` | `ViewingDto` |
| POST | `viewingReschedule(id)` | `RescheduleViewingRequest` | `ViewingDto` |
| POST | `viewingCancel(id)` | `CancelViewingRequest` | `ViewingDto` |
| POST | `viewingComplete(id)` | `CompleteViewingRequest` | `ViewingDto` |
| GET | `notifications` | `NotificationListParams` | `OffsetPaginatedResponse<NotificationDto>` |
| POST | `notificationRetry(id)` | — | `NotificationDto` |

---

## Enums (dropdowns & filters)

Import from `@auto-iq/contracts` or `@auto-iq/contracts/enums`:

`USER_ROLES`, `LISTING_STATUSES`, `BODY_TYPES`, `FUEL_TYPES`, `TRANSMISSION_TYPES`, `IMAGE_SLOTS`, `DOCUMENT_TYPES`, `QUOTE_STATUSES`, `VIEWING_STATUSES`, `VEHICLE_REQUEST_STATUSES`, `CONSENT_TYPES`, etc.

---

## Drift prevention

- API controllers return DTOs matching contract interfaces (Phase 7 contract tests).
- Path changes require updating `packages/contracts/src/routes.ts` first, then API, then web.
- Legacy paths (`/seller/listings`, `/auth/password/forgot`) are **not** in contracts — do not use in frontend.
