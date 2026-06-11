# Phase 8 — Testing

Phase 8 validates **deployed environments**, not new feature logic. Re-run critical e2e against **staging URL** before production promote.

## Testing criteria

| # | Criterion |
| --- | --- |
| T8.1 | Staging smoke script passes against Railway URL |
| T8.2 | Production smoke passes within 15 min of deploy |
| T8.3 | Rollback restores service; health green |
| T8.4 | Tigris presign upload works in staging/production |
| T8.5 | Sentry event tagged with correct `environment` and `release` |

## Staging smoke (required — run before prod)

| ID | Check | Expected |
| --- | --- | --- |
| S8.1 | `GET {STAGING_URL}/api/v1/health/live` | 200 |
| S8.2 | `GET .../health/ready` | 200 |
| S8.3 | Register/login smoke (script or Postman) | 200 |
| S8.4 | `GET .../listings` | 200 JSON |
| S8.5 | Admin login + `GET .../admin/dashboard` | 200 |
| S8.6 | Presign image upload to Tigris + register | Object in bucket; DB row |
| S8.7 | Cookie login + CSRF-protected mutation from staging web origin | Cookie set, CSRF accepted, mutation succeeds |
| S8.7 | Trigger controlled 500 in staging (test route) | Event in Sentry |

Automate in `scripts/smoke-staging.sh` or CI workflow `workflow_dispatch`.

## Production smoke (required — run after prod deploy)

| ID | Check | Expected |
| --- | --- | --- |
| P8.1 | Health live + ready | 200 |
| P8.2 | Read-only catalogue `GET /listings` | 200 |
| P8.3 | Auth login with smoke test user | 200 |
| P8.4 | No new Sentry issues in 15 min window (or triaged) | — |

## Rollback test (required on staging before prod)

| ID | Steps | Expected |
| --- | --- | --- |
| R8.1 | Deploy known-good revision N | Healthy |
| R8.2 | Deploy bad revision N+1 (e.g. broken env) | Ready fails or app errors |
| R8.3 | Railway rollback to N | Ready 200 within 5 min |

## Regression (required)

- [ ] Full CI suite green on release tag SHA before production deploy
- [ ] Phase 7 `trust-workflow` e2e green on same SHA

## Unit / E2E

No new unit tests required in Phase 8 unless smoke scripts are added as e2e against remote URL (optional `test/smoke-remote/`).

## Sign-off gate

Staging smoke + rollback + production smoke complete; [definition-of-done.md](./definition-of-done.md) sign-offs recorded.
