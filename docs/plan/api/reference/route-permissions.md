# Discovery Phase Permissions Matrix (`/api/v1`)

## Scope

Source of truth: `packages/contracts/src/routes.ts` and frontend wiring docs.

- `✓` = explicit access allowed
- `—` = not allowed in current phase
- `S` = depends on role-context or state checks

## Public Health

| Route alias | Method | Path | Anonymous | Buyer | Seller | Inspector | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health.live | GET | `/api/v1/health/live` | ✓ | ✓ | ✓ | ✓ | ✓ | Liveness probe |
| health.ready | GET | `/api/v1/health/ready` | ✓ | ✓ | ✓ | ✓ | ✓ | Readiness probe |

## Identity

| Route alias | Method | Path | Anonymous | Buyer | Seller | Inspector | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| auth.register | POST | `/api/v1/auth/register` | ✓ | ✓ | ✓ | ✓ | ✓ | account creation |
| auth.csrf | GET | `/api/v1/auth/csrf` | ✓ | ✓ | ✓ | ✓ | ✓ | required by phase-2 cookie clients |
| auth.login | POST | `/api/v1/auth/login` | ✓ | ✓ | ✓ | ✓ | ✓ | returns session cookie for web |
| auth.refresh | POST | `/api/v1/auth/refresh` | ✓ | ✓ | ✓ | ✓ | ✓ | cookie required for web |
| auth.logout | POST | `/api/v1/auth/logout` | — | ✓ | ✓ | ✓ | ✓ | unsafe cookie-auth route |
| auth.sendOtp | POST | `/api/v1/auth/otp/send` | ✓ | ✓ | ✓ | ✓ | ✓ | phone OTP bootstrap |
| auth.verifyOtp | POST | `/api/v1/auth/otp/verify` | ✓ | ✓ | ✓ | ✓ | ✓ | otp exchange |
| auth.forgotPassword | POST | `/api/v1/auth/forgot-password` | ✓ | ✓ | ✓ | ✓ | ✓ | email flow |
| auth.resetPassword | POST | `/api/v1/auth/reset-password` | ✓ | ✓ | ✓ | ✓ | ✓ | token flow |
| me.profile | GET | `/api/v1/me` | — | ✓ | ✓ | ✓ | ✓ | signed-in profile |
| me.profile | PATCH | `/api/v1/me` | — | ✓ | ✓ | ✓ | ✓ | profile update |
| me.consents | POST | `/api/v1/me/consents` | — | ✓ | ✓ | ✓ | ✓ | consent ledger |
| me.savedVehicles | GET | `/api/v1/me/saved-vehicles` | — | ✓ | — | — | — | buyer only |
| me.savedVehicle | DELETE | `/api/v1/me/saved-vehicles/:listingId` | — | ✓ | — | — | — | buyer only |
| me.savedVehicle | POST | `/api/v1/me/saved-vehicles/:listingId` | — | ✓ | — | — | — | buyer only |

## Seller listing management

| Route alias | Method | Path | Anonymous | Buyer | Seller | Inspector | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenceData.all | GET | `/api/v1/reference-data` | — | ✓ | ✓ | ✓ | ✓ | dropdowns + viewing locations |
| storage.imagePresign | POST | `/api/v1/storage/images/presign` | — | — | ✓ | — | — | seller uploads only |
| storage.documentPresign | POST | `/api/v1/storage/documents/presign` | — | — | ✓ | — | — | seller uploads only |
| storage.registerImage | POST | `/api/v1/listings/:listingId/images` | — | — | ✓ | — | — | seller draft/listing content |
| storage.registerDocument | POST | `/api/v1/listings/:listingId/documents` | — | — | ✓ | — | — | seller draft/listing content |
| listings.list | GET | `/api/v1/me/listings` | — | ✓ | ✓ | — | — | seller dashboard list |
| listings.create | POST | `/api/v1/listings` | — | — | ✓ | — | — | seller draft creation |
| listings.detail | GET/PATCH | `/api/v1/listings/:id` | S | S | ✓ | — | — | seller owner view / admin may use admin route instead |
| listings.upsertSpecs | PUT | `/api/v1/listings/:id/specs` | — | — | ✓ | — | — | draft + editable states |
| listings.upsertPricing | PUT | `/api/v1/listings/:id/pricing` | — | — | ✓ | — | — | draft + editable states |
| listings.submit | POST | `/api/v1/listings/:id/submit` | — | — | ✓ | — | — | requires mandatory docs |
| listings.timeline | GET | `/api/v1/listings/:id/timeline` | — | ✓ | ✓ | — | ✓ | status audit for owner/admin |

## Public marketplace

| Route alias | Method | Path | Anonymous | Buyer | Seller | Inspector | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| catalogue.list | GET | `/api/v1/listings` | ✓ | ✓ | ✓ | ✓ | ✓ | public browse |
| catalogue.detail | GET | `/api/v1/listings/:slugOrId` | ✓ | ✓ | ✓ | ✓ | ✓ | role-aware projection |
| catalogue.inspectionSummary | GET | `/api/v1/listings/:slugOrId/inspection-summary` | ✓ | ✓ | ✓ | ✓ | ✓ | summary DTO only |
| quotes.create | POST | `/api/v1/listings/:listingId/quotes` | — | ✓ | — | — | — | requires auth & buyer profile |
| quotes.buyerList | GET | `/api/v1/me/quotes` | — | ✓ | — | — | — | buyer quote list |
| vehicleRequests.create | POST | `/api/v1/vehicle-requests` | — | ✓ | — | — | — | buyer sourcing |
| vehicleRequests.buyerList | GET | `/api/v1/me/vehicle-requests` | — | ✓ | — | — | — | buyer sourcing list |

## Viewings and scheduling

| Route alias | Method | Path | Anonymous | Buyer | Seller | Inspector | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| viewings.create | POST | `/api/v1/listings/:listingId/viewings` | — | ✓ | — | — | — | buyer request flow |
| viewings.buyerList | GET | `/api/v1/me/viewings` | — | ✓ | — | — | — | buyer list |
| viewings.sellerConfirm | POST | `/api/v1/me/viewings/:id/seller-confirm` | — | — | ✓ | — | — | seller accepts requested viewing before admin final confirmation |
| admin.viewings | GET | `/api/v1/admin/viewings` | — | — | — | — | ✓ | admin scheduler queue |
| admin.viewing | GET | `/api/v1/admin/viewings/:id` | — | — | — | — | ✓ | admin single-viewing detail |
| admin.viewingConfirm | POST | `/api/v1/admin/viewings/:id/confirm` | — | — | — | — | ✓ | admin action |
| admin.viewingReschedule | POST | `/api/v1/admin/viewings/:id/reschedule` | — | — | — | — | ✓ | admin action |
| admin.viewingCancel | POST | `/api/v1/admin/viewings/:id/cancel` | — | — | — | — | ✓ | admin action |
| admin.viewingComplete | POST | `/api/v1/admin/viewings/:id/complete` | — | — | — | — | ✓ | admin action |

## Inspector operations

| Route alias | Method | Path | Anonymous | Buyer | Seller | Inspector | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inspectors.taskList | GET | `/api/v1/inspectors/inspection-tasks` | — | — | — | ✓ | — | inspector queue |
| inspectors.taskDetail | GET | `/api/v1/inspectors/inspection-tasks/:taskId` | — | — | — | ✓ | — | inspector queue |
| inspectors.submitReport | POST | `/api/v1/inspectors/inspection-tasks/:taskId/report` | — | — | — | ✓ | — | inspector-only submission |

## Admin operations

| Route alias | Method | Path | Anonymous | Buyer | Seller | Inspector | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin.dashboard | GET | `/api/v1/admin/dashboard` | — | — | — | — | ✓ | analytics + queue summary |
| admin.listings | GET | `/api/v1/admin/listings` | — | — | — | — | ✓ | admin queue list |
| admin.listing | GET | `/api/v1/admin/listings/:listingId` | — | — | — | — | ✓ | admin listing view |
| admin.listingRequestChanges | POST | `/api/v1/admin/listings/:listingId/request-changes` | — | — | — | — | ✓ | admin only |
| admin.listingApprove | POST | `/api/v1/admin/listings/:listingId/approve` | — | — | — | — | ✓ | admin only |
| admin.listingPublish | POST | `/api/v1/admin/listings/:listingId/publish` | — | — | — | — | ✓ | admin only |
| admin.listingReject | POST | `/api/v1/admin/listings/:listingId/reject` | — | — | — | — | ✓ | admin only |
| admin.listingDelist | POST | `/api/v1/admin/listings/:listingId/delist` | — | — | — | — | ✓ | admin only |
| admin.listingMarkSold | POST | `/api/v1/admin/listings/:listingId/mark-sold` | — | — | — | — | ✓ | admin only |
| admin.listingMarkReserved | POST | `/api/v1/admin/listings/:listingId/mark-reserved` | — | — | — | — | ✓ | admin only |
| admin.listingCreateInspectionTask | POST | `/api/v1/admin/listings/:listingId/inspection-tasks` | — | — | — | — | ✓ | admin only |
| admin.listingOwnershipVerification | POST | `/api/v1/admin/listings/:listingId/ownership-verification` | — | — | — | — | ✓ | admin only |
| admin.listingApproveSummary | POST | `/api/v1/admin/listings/:listingId/inspection-summary/approve` | — | — | — | — | ✓ | admin only |
| admin.quotes | GET | `/api/v1/admin/quotes` | — | — | — | — | ✓ | admin triage |
| admin.quote | GET/PATCH | `/api/v1/admin/quotes/:quoteId` | — | — | — | — | ✓ | admin triage |
| admin.vehicleRequests | GET | `/api/v1/admin/vehicle-requests` | — | — | — | — | ✓ | admin triage |
| admin.vehicleRequest | GET/PATCH | `/api/v1/admin/vehicle-requests/:requestId` | — | — | — | — | ✓ | admin triage |
| admin.notifications | GET | `/api/v1/admin/notifications` | — | — | — | — | ✓ | admin notification ops |
| admin.notificationRetry | POST | `/api/v1/admin/notifications/:notificationId/retry` | — | — | — | — | ✓ | admin retry |
