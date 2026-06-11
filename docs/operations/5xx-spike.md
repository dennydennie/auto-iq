# Runbook: 5xx Spike

## Signals

- Sentry spike alert
- Readiness still green but 5xx > 1%
- API logs show repeated `INTERNAL_ERROR`

## Immediate actions

1. Identify the top failing route from Sentry and logs.
2. Capture one `correlationId` from a failing request.
3. Check whether failures are isolated to:
   - auth/session
   - storage/presign
   - admin workflow
   - notifications

## Triage order

1. Readiness (`db`, `redis`, `storage`)
2. Recent deploy / release hash
3. Error fingerprint in Sentry
4. Queue growth in admin dashboard counts

## Stabilization

- Roll back if the issue started with the latest release and is user-facing
- Pause non-essential background work if notification retries are amplifying load
- If only one route is broken, gate that route at the edge or temporarily disable the path

## Exit criteria

- 5xx rate returns to baseline for 15 minutes
- Sentry issue is triaged
- Root cause and follow-up item recorded
