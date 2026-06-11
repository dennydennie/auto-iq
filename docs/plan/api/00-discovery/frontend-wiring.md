# Phase 0 — Frontend wiring (decisions)

No API calls in Phase 0. Lock these **before** implementing `apps/web` auth and catalogue:

| Decision | Frontend impact | Contract field affected |
| --- | --- | --- |
| HttpOnly cookies + CSRF | `ApiClient` + `fetch` credentials + unsafe-method CSRF header | `LoginResponse.accessToken?` remains optional/future-client only |
| Guest catalogue detail | Route guards on listing detail page | public `GET catalogue.detail` auth optional (`PublicListingDto`) |
| Phone-first OTP | Onboarding screens after `RegisterResponse.otpRequired` | `SendOtpRequest.phone` E.164 |
| Mandatory seller documents | Wizard step 4 required `DOCUMENT_TYPES` | `DocumentPresignRequest.documentType` must include `SELLER_ID`, `REGISTRATION_BOOK`, `PURCHASE_IMPORT_DOCS` |
| Buyer inspection allowlist | Health check UI field set | `BuyerInspectionSummaryDto` only |
| Viewing locations | Pickers use `ReferenceDataResponse.viewingLocations` | `RequestViewingRequest.locationId` |

Record outcomes in ADRs; update this table if contracts change.
