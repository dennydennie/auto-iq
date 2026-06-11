# Runbook: Notification Failures

## Signals

- Rising `FAILED` / `DEAD_LETTER` rows in `notifications`
- Sentry issues or error logs from `NotificationService`
- Buyers or sellers not receiving OTPs or viewing reminders

## Immediate actions

1. Inspect recent failures:
   - `GET /api/v1/admin/notifications`
2. Check provider credentials and endpoint reachability.
3. Confirm Redis and storage are healthy if failures follow viewing or upload flows.

## Database spot-check

```sql
SELECT template, channel, status, count(*)
FROM notifications
GROUP BY template, channel, status
ORDER BY template, channel, status;
```

## Recovery

1. Fix provider or environment issue.
2. Retry failed rows through admin notifications retry.
3. Watch for repeated dead-letter movement.

## Escalate when

- OTP delivery fails for active onboarding traffic
- Reminder failures exceed agreed threshold
- Provider outage lasts longer than 15 minutes
