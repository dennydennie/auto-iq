# Phase 4 — Testing

Use helpers to create submitted listing (from Phase 3 fixtures).

## Testing criteria

| # | Criterion |
| --- | --- |
| T4.1 | Happy path to `PUBLISHED` e2e |
| T4.2 | Request-changes loop e2e |
| T4.3 | Inspector isolation e2e |
| T4.4 | Non-admin cannot publish |
| T4.5 | Approve blocked until verification/inspection gates met |

## Unit tests (required)

| Area | Tests |
| --- | --- |
| `ListingStateService` (admin transitions) | publish requires `APPROVED`; reject from `SUBMITTED` |
| `OwnershipVerificationService` | Status transitions per [data-model](../reference/data-model.md) |
| `InspectionService` | Assign sets `SCHEDULED`; report upload sets `REPORT_UPLOADED` |
| `AdminOpsGuard` | Non-admin denied |

## E2E tests (required)

| ID | Flow | Expected |
| --- | --- | --- |
| E4.1 | Submitted listing → admin assign inspection → inspector upload report → admin approve summary → admin approve listing → publish | Final status `PUBLISHED`; public summary record exists |
| E4.2 | Submitted → `request-changes` → seller patch → resubmit → publish | History shows loop |
| E4.3 | Inspector B token → task assigned to Inspector A | 404 |
| E4.4 | Seller token → `POST .../publish` | 403 |
| E4.5 | `GET /admin/dashboard` | Non-zero counts when fixtures exist |
| E4.6 | `POST .../reject` on submitted | `REJECTED`; not in publish path |

## E2E tests (recommended)

| ID | Flow |
| --- | --- |
| E4.7 | Ownership `NEEDS_CLARIFICATION` path |
| E4.8 | `mark-sold` / `mark-reserved` on published listing |

## Sign-off gate

Required tests green; published seed available; DOD complete.
