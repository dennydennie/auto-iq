# Runbook: Database Down

## Signals

- `/api/v1/health/ready` returns `db=down`
- Railway or Postgres alert on failed connections
- 5xx spike on authenticated and write paths

## Immediate actions

1. Confirm app readiness:
   - `curl $API_BASE/api/v1/health/ready`
2. Check Postgres service state in Railway.
3. Validate `DATABASE_URL` has not drifted.
4. Check connection exhaustion before restarting the API.

## Recovery

1. Restore Postgres availability first.
2. Re-run readiness.
3. Spot-check:
   - login
   - catalogue
   - admin dashboard
4. If schema drift is suspected, compare `migrations` table to the deployed SHA.

## Escalate when

- Postgres stays unavailable for more than 10 minutes
- Restore requires snapshot recovery
- Migration rollback is needed
