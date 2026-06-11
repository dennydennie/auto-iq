# Senior Developer Prompt — Phase 6: Viewings and Notifications

You are the senior developer responsible for delivering **viewing coordination and notification delivery** without leaving operational gaps for sellers, buyers, or admins.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/security.md](../reference/security.md)
- [../../../../packages/contracts/src/viewings.ts](../../../../packages/contracts/src/viewings.ts)
- [../../../../packages/contracts/src/notifications.ts](../../../../packages/contracts/src/notifications.ts)

## Mission

Deliver the full lifecycle for viewing requests, admin scheduling, seller confirmation rules, approved locations, reminder handling, and persisted notification attempts with retry/idempotency.

## Ask before coding if unresolved

1. Does a viewing become `CONFIRMED` by admin only, or is seller confirmation mandatory?
2. Which providers and channels are active for staging and launch?
3. What is the approved-location source of truth and who manages it?
4. What reminder timing is expected if the cron schedule is not already specified?

Do not guess on seller confirmation or provider/channel policy. Those choices affect both state transitions and notification semantics.

## Required deliverables

1. `viewings`, `notifications`, and reference-data location support.
2. Phase 6 migrations for appointments, participants, locations, notifications, and attempts.
3. Buyer viewing request flow plus buyer viewing list.
4. Admin confirm/reschedule/cancel/complete flows.
5. Notification templates, idempotency, retry handling, and reminder job.
6. Admin notification ops list and retry action.

## Execution path

1. Implement the viewing data model and state machine first.
2. Add approved-location validation and participant modeling.
3. Implement buyer create/list and admin action endpoints.
4. Build the notification service with persisted attempts, provider abstraction, idempotency keys, retry scheduling, and CSRF protection on unsafe viewing/notification actions.
5. Wire viewing and notification events from listing/admin workflows where required.
6. Connect the relevant `apps/web/app/(admin)/viewings` and buyer-facing viewing flows to the exact Phase 6 contracts.

## Frontend wiring expectations

- Follow [frontend-wiring.md](./frontend-wiring.md) exactly.
- Buyer surfaces must use `ROUTES.viewings.*`; admin scheduler must use `ROUTES.admin.viewings` and action routes.
- Cookie-authenticated unsafe calls must send `X-CSRF-Token`; do not introduce browser bearer-token storage.
- Location pickers must come from `ReferenceDataResponse.viewingLocations`.
- Admin notification support UI must render `NotificationDto` and attempt history using contract fields only.
- Viewing, calendar, and notification ops UI changes must satisfy [frontend-quality.md](../reference/frontend-quality.md).

## Testing and verification

- Run all required unit, e2e, and integration checks from [testing.md](./testing.md).
- Verify idempotency, provider failure retry, CSRF enforcement, invalid-location rejection, and viewing status transitions.
- Complete the staging manual notification check unless there is an explicit waiver ticket.

## Definition of done

Use [definition-of-done.md](./definition-of-done.md) as mandatory. This phase is incomplete if sends are not persisted, failures are invisible, or viewing confirmation rules are ambiguous.

## Git checkpoint

- After all required viewing and notification tests pass and the Phase 6 DOD is fully met, create a focused commit and push the branch.
- Do not commit or push while confirmation rules, provider behavior, retry logic, or staging notification checks are still open.

## Completion rule

Do not leave no-op providers undocumented or retry behavior unverified. If seller confirmation or launch channels remain unresolved, ask before closing the phase.
