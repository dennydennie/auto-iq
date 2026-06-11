# Backup and Restore Notes

## Scope

Phase 7 requires one restore drill before production promote.

## Baseline

- Railway Postgres backups enabled
- Restore target can be a temporary staging database
- Validate against the same app SHA when possible

## Drill steps

1. Trigger or identify the backup snapshot.
2. Restore to a temporary database instance.
3. Point a temporary API instance at the restored `DATABASE_URL`.
4. Verify:
   - `GET /api/v1/health/ready`
   - admin dashboard
   - one published listing
   - one notification row
5. Record restore duration and any migration mismatch.

## Evidence to keep

- backup timestamp
- restore start/end time
- restored environment identifier
- health check output
