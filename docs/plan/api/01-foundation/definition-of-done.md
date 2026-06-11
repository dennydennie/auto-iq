# Phase 1 — Definition of Done

## Functional

- [ ] `pnpm --filter api dev` starts API against local PostgreSQL and Redis
- [ ] `pnpm --filter api` migration run succeeds on empty database
- [ ] `GET /api/v1/health/live` returns 200 without external deps
- [ ] `GET /api/v1/health/ready` returns 200 when DB + Redis up; 503 when either down
- [ ] Invalid env (missing `DATABASE_URL`) fails fast at boot with clear message
- [ ] Swagger UI reachable when enabled in dev
- [ ] Cookie/CORS defaults support `apps/web` credentialed requests only for configured origins

## Structural

- [ ] `DbModule` pattern matches [architecture.md](../reference/architecture.md); no `forFeature` in feature modules
- [ ] TypeORM migration setup follows [ADR 0002](../../../adr/0002-typeorm-migration-discipline.md)
- [ ] No app-internal barrel import pattern is introduced under `apps/api/src/db`
- [ ] Empty feature modules wired in `AppModule`
- [ ] `scripts/dev/` documents one-command local boot (or Makefile equivalent)

## CI

- [ ] PR pipeline runs lint, typecheck, unit tests, e2e smoke
- [ ] CI uses isolated test database

## Documentation

- [ ] Env vars listed in `apps/api` README or `.env.example`
- [ ] Phase 2 CSRF implementation task is documented if not already implemented in Phase 1

## Sign-off

| Role | Confirms |
| --- | --- |
| API dev | Local boot + tests green |
| DevOps / lead | CI pipeline and test DB strategy |

Phase 2 may start only after [testing.md](./testing.md) required tests pass.
