# Phase 3 — Testing

Requires MinIO (or S3 mock) in e2e setup.

## Testing criteria

| # | Criterion |
| --- | --- |
| T3.1 | Full seller submit path e2e |
| T3.2 | Illegal status transition rejected |
| T3.3 | Cross-seller IDOR returns 404 |
| T3.4 | Invalid magic bytes rejected on register |
| T3.5 | Submit without required wizard data returns 400/422 |
| T3.6 | Unsafe seller mutations reject missing/invalid CSRF |

## Unit tests (required)

| Area | Tests |
| --- | --- |
| `ListingStateService` | `DRAFT`→`SUBMITTED` ok; `SUBMITTED`→`DRAFT` fails; seller cannot `PUBLISH` |
| `ListingWizardValidator` | Missing photos/docs/price fails with field errors |
| `ListingMediaService` | Only one `is_cover`; replacing cover clears previous |
| `StorageService` | Presign TTL and key prefix correct (mock S3 client) |

## E2E tests (required)

| ID | Flow | Expected |
| --- | --- | --- |
| E3.1 | Seller login → create listing → patch basics → presign image → register image → presign doc → register doc → submit | 200; DB status `SUBMITTED`; history row |
| E3.2 | Seller A session → `GET /api/v1/listings/{sellerBListingId}` | 404 |
| E3.3 | Submit listing in `SUBMITTED` → `PATCH` basics | 409 |
| E3.4 | Register image with wrong content-type / magic bytes | 400 |
| E3.5 | `GET /api/v1/listings/:id` | No private storage keys in JSON |
| E3.6 | `GET /api/v1/listings/:id/timeline` | Ordered events include submit |
| E3.7 | Unsafe seller mutation without CSRF | 403 |

## E2E tests (recommended)

| ID | Flow |
| --- | --- |
| E3.8 | Submit without minimum photos |
| E3.9 | `CHANGES_REQUESTED` (seeded) → edit → resubmit |

## Sign-off gate

Required unit + e2e green; [definition-of-done.md](./definition-of-done.md) complete.
