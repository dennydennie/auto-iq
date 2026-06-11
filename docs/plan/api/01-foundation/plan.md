# Phase 1: Foundation

| | |
| --- | --- |
| **Goal** | `apps/api` runs locally and in CI with PostgreSQL, TypeORM, Redis, config validation, health checks, and team conventions. |
| **Depends on** | [00-discovery](../00-discovery/plan.md) (engineering decisions) |
| **Blocks** | [02-identity](../02-identity/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Tasks

### Dependencies and config

- [ ] Add `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`, `class-validator`, `class-transformer`
- [ ] Env schema: `DATABASE_URL`, `REDIS_URL`, `PORT`, `NODE_ENV`, `CORS_ORIGINS`, CSRF cookie/header names if configurable
- [ ] `ConfigModule` global with fail-fast validation on boot
- [ ] TypeORM `DataSource` for CLI migrations

### Database ([architecture](../reference/architecture.md) DbModule)

- [ ] `config/database.config.ts` — `registerAs('typeorm')` + `DataSource` for CLI
- [ ] `TypeOrmModule.forRootAsync` in `AppModule`
- [ ] `db/db.module.ts`, `abstract.repository.ts`, concrete entity/repository imports (no app-internal barrel imports)
- [ ] Local PostgreSQL via Docker Compose or `infrastructure/database`
- [ ] Initial migration: `pgcrypto` extension
- [ ] `scripts/dev/` local bootstrap documented

### Application shell

- [ ] Global validation pipe (`whitelist`, `forbidNonWhitelisted`)
- [ ] Global exception filter → error envelope with `correlationId`
- [ ] Correlation id middleware / interceptor
- [ ] API prefix `/api/v1`
- [ ] CORS for `apps/web` dev origin
- [ ] Cookie/CORS baseline matches [ADR 0001](../../../adr/0001-web-auth-and-csrf.md)
- [ ] CSRF middleware/guard design documented for Phase 2 unsafe routes

### Health and observability stub

- [ ] `HealthModule`: `/health/live`, `/health/ready` (DB + Redis)
- [ ] `@nestjs/swagger` (env-gated)
- [ ] Redis module
- [ ] Sentry `instrument.ts` gated on `SENTRY_DSN`

### Monorepo

- [ ] `packages/contracts` error envelope stub
- [ ] Turbo: `api#build`, `api#test`, `api#typecheck` in CI
- [ ] Feature module stubs import `DbModule` only

## Next phase

[02-identity/plan.md](../02-identity/plan.md)
