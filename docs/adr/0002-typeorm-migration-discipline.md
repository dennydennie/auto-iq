# ADR 0002: TypeORM Migration Discipline

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Engineering lead |
| Date | 2026-06-04 |
| Revisit | Before replacing TypeORM or adding a second backend runtime |

## Decision

The current Auto IQ API scaffold uses NestJS with TypeORM. Database schema changes are delivered through TypeORM migrations in `apps/api`.

This is an explicit exception to the general Flyway preference in the repository rules. The exception is accepted because the current backend runtime, entity model, test harness, and deployment plan are TypeScript/NestJS-first.

## Required discipline

- Never use `synchronize: true` outside local throwaway experiments.
- Never edit an applied migration.
- Use one migration per logical schema change.
- Review generated SQL before merge.
- Run migrations against a clean test database in CI.
- Keep PostgreSQL-native integrity rules explicit: constraints, foreign keys, indexes, enum/check constraints, and `timestamptz`/`numeric` column types.
- Capture rollback/restore evidence in Phase 7 and release-time migration evidence in Phase 8.

## Consequences

- Phase prompts should say `TypeORM migrations` rather than `Flyway`.
- Any future switch to Flyway requires a new ADR and a migration ownership cutover plan.
- Reviewers must evaluate migration SQL quality, not only entity decorators.
