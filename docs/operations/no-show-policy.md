# No-Show and Repeat-Offender Policy

## Scope

Applies to buyer and seller non-attendance handling in viewing workflows.

## Policy

1. **First no-show (within 30 days):**
   - Record `VIEWING_STATUS.NO_SHOW`.
   - Send one notification warning to the participant.
   - Rebooking remains possible.
2. **Second no-show (within rolling 90-day window):**
   - Temporary suspension from requesting or confirming viewings for 72 hours.
   - Escalate to admin review.
3. **Third no-show (within rolling 90-day window):**
   - 30-day suspension.
   - Requires admin review for unblocking.

## Enforcement

- Viewing completion workflow sets `NO_SHOW` transitions and writes an admin-visible audit event.
- Admin scheduler and notifications must include no-show reason and participant penalty status.
- Policy is logged per participant for support and dispute handling.

## Revisions

This policy is accepted for Phase 0 and revalidated at the end of beta.

