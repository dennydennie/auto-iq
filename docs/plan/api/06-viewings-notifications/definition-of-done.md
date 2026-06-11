# Phase 6 — Definition of Done

## Functional

- [x] Buyer can request viewing on published listing
- [x] Viewing reaches `CONFIRMED` through documented path (seller and/or admin per ADR)
- [x] Admin can reschedule, cancel, complete, record no-show
- [x] Only approved locations selectable
- [x] `notifications` + `notification_attempts` persisted per send
- [x] At least one real provider configured in **staging** (or documented sandbox); no-op acceptable in CI
- [x] Retry increments attempts; idempotency prevents duplicate sends for same event key
- [x] Unsafe viewing and notification mutations require valid CSRF when using cookie auth

## Observability

- [x] Failed notification visible in logs and DB attempts table

## Verification notes

- Admin can confirm either a direct `REQUESTED` viewing or a seller-acknowledged `PENDING_SELLER_CONFIRMATION` viewing.
- CI/local notification delivery uses `SandboxNotificationProvider` with `NOTIFICATION_ACTIVE_CHANNELS=EMAIL,SMS`; attempts are persisted and retryable through admin notification ops.

## Frontend quality

- [ ] Viewing, calendar, and notification ops changes satisfy [frontend-quality.md](../reference/frontend-quality.md)

## Sign-off

| Role | Confirms |
| --- | --- |
| API dev | E2E viewing + notification tests |
| Ops | Staging send verified manually once |
