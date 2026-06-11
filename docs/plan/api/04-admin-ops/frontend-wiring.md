# Phase 4 — Frontend wiring

Import: `@auto-iq/contracts/admin`, `@auto-iq/contracts/inspections`, `ROUTES`.

**Auth:** Cookie session with `ADMIN` or `INSPECTOR` role (inspector routes only). Unsafe methods require `X-CSRF-Token`.

## Admin dashboard

| Method | Path | Response |
| --- | --- | --- |
| GET | `ROUTES.admin.dashboard` | `AdminDashboardDto` |

Bind cards to `queues.pendingReview`, `inspectionPending`, `readyToPublish`, etc.

## Listing queue

| Method | Path | Query | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `ROUTES.admin.listings` | `AdminListingListParams` | — | `OffsetPaginatedResponse<AdminListingDto>` |
| GET | `ROUTES.admin.listing(id)` | — | — | `AdminListingDto` |
| POST | `ROUTES.admin.listingRequestChanges(id)` | — | `RequestChangesRequest` | `AdminListingDto` |
| POST | `ROUTES.admin.listingApprove(id)` | — | — | `AdminListingDto` |
| POST | `ROUTES.admin.listingPublish(id)` | — | — | `AdminListingDto` |
| POST | `ROUTES.admin.listingReject(id)` | — | `RejectListingRequest` | `AdminListingDto` |
| POST | `ROUTES.admin.listingDelist(id)` | — | `DelistListingRequest` | `AdminListingDto` |
| POST | `ROUTES.admin.listingMarkSold(id)` | — | — | `AdminListingDto` |
| POST | `ROUTES.admin.listingMarkReserved(id)` | — | — | `AdminListingDto` |

### `AdminListingListParams`

`page`, `limit`, `status?`, `sellerId?`, `search?`, `sortBy?`, `sortDir?`.

### `AdminListingDto` extras vs seller

- `documents[].downloadUrl` may be present for admin download
- `adminNotes` internal only

## Inspection

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `ROUTES.admin.listingCreateInspectionTask(id)` | `AssignInspectionRequest` | `InspectionTaskDto` |
| POST | `ROUTES.admin.listingApproveSummary(id)` | `ApproveBuyerSummaryRequest` | buyer summary DTO |
| POST | `ROUTES.admin.listingOwnershipVerification(id)` | *(define in API; align ADR)* | — |

### `AssignInspectionRequest` (required)

`inspectorId`, `scheduledAt` (ISO 8601); optional `locationNote`.

## Inspector app

| Method | Path | Query | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `ROUTES.inspectors.taskList` | `InspectorTaskListParams` | — | paginated `InspectionTaskDto` |
| GET | `ROUTES.inspectors.taskDetail(taskId)` | — | — | task + report |
| POST | `ROUTES.inspectors.submitReport(taskId)` | `SubmitInspectionReportRequest` | `InspectionReportDto` |

### `SubmitInspectionReportRequest` (required)

`findings[]` (`category`, `label`, `rating`, optional `note`, `photoStorageKey`), `inspectorNote`, `roadworthy`; optional `overallScore`.

## Enums for UI

`LISTING_STATUSES`, `INSPECTION_TASK_STATUSES`, `OWNERSHIP_VERIFICATION_STATUSES`, `INSPECTION_FINDING_RATINGS`, `INSPECTION_CATEGORIES`.

## Frontend quality

Admin and inspector screens must satisfy [frontend-quality.md](../reference/frontend-quality.md): table controls are keyboard reachable, filters have labels, status text is externalized, and dates use shared formatting.
