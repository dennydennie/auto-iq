# Phase 6 — Frontend wiring

Import: `@auto-iq/contracts/viewings`, `@auto-iq/contracts/notifications`, `@auto-iq/contracts/reference-data`, `ROUTES`.

## Buyer — request viewing

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `ROUTES.viewings.create(listingId)` | `RequestViewingRequest` | `ViewingDto` |
| GET | `ROUTES.viewings.buyerList` | `ViewingListParams` | paginated `ViewingDto` |
| POST | `ROUTES.viewings.sellerConfirm(id)` | — | `ViewingDto` |

### `RequestViewingRequest` (required)

| Field | Format |
| --- | --- |
| `preferredDate` | ISO date `YYYY-MM-DD` |
| `preferredTime` | 24h `HH:mm` |
| `locationId` | from `ReferenceDataResponse.viewingLocations` |
| `note` | optional string |

## Admin — viewing scheduler

| Method | Path | Query / body | Response |
| --- | --- | --- | --- |
| GET | `ROUTES.admin.viewings` | `AdminViewingListParams` | paginated `ViewingDto` |
| POST | `ROUTES.admin.viewingConfirm(id)` | `ConfirmViewingRequest` | `ViewingDto` |
| POST | `ROUTES.admin.viewingReschedule(id)` | `RescheduleViewingRequest` | `ViewingDto` |
| POST | `ROUTES.admin.viewingCancel(id)` | `CancelViewingRequest` | `ViewingDto` |
| POST | `ROUTES.admin.viewingComplete(id)` | `CompleteViewingRequest` | `ViewingDto` |

### Action bodies (required fields)

| Type | Required |
| --- | --- |
| `ConfirmViewingRequest` | `confirmedAt` (ISO datetime), `locationId` |
| `RescheduleViewingRequest` | `newSlot`, `reason` |
| `CancelViewingRequest` | `reason` |
| `CompleteViewingRequest` | `outcome`: `COMPLETED` \| `NO_SHOW` |

**Calendar UI:** map `ViewingDto.confirmedSlot`, `location.name`, `listingSnapshot`.

## Admin — notifications ops

| Method | Path | Query | Response |
| --- | --- | --- | --- |
| GET | `ROUTES.admin.notifications` | `NotificationListParams` | `OffsetPaginatedResponse<NotificationDto>` |
| POST | `ROUTES.admin.notificationRetry(id)` | — | `NotificationDto` |

Display `status`, `attemptCount`, `attempts[]` for support UI.

Unsafe viewing and notification actions require `X-CSRF-Token` when using cookie auth.

## Notification templates (in-app copy keys)

Import `NOTIFICATION_TEMPLATES` — align email/SMS deep links with web routes (listing detail, viewing detail).

## Status enums

`VIEWING_STATUSES`, `NOTIFICATION_STATUSES`, `NOTIFICATION_CHANNELS`.

## Frontend quality

Viewing, calendar, and notification ops screens must satisfy [frontend-quality.md](../reference/frontend-quality.md): date/time controls are labeled, status text is externalized, and dates/times use shared locale-aware formatting.
