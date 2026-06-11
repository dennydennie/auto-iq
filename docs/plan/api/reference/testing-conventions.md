# Testing Conventions

Shared rules for phase sign-off across `apps/api`.

## Layout

| Type | Location | Runner |
| --- | --- | --- |
| Unit | `src/**/*.spec.ts` next to source or `test/unit/` | `pnpm --filter api test` |
| E2E | `test/e2e/*.e2e-spec.ts` | `pnpm --filter api test:e2e` (with Postgres + Redis; MinIO when storage phase+) |

## Environment

- E2E uses a dedicated database (`auto_iq_test`) or schema; migrations run in `beforeAll`.
- Redis required from Phase 2 onward; MinIO or S3 mock from Phase 3 onward.
- Do not run E2E against production or shared staging without explicit approval.

## Sign-off rules

- All **required** tests in the phase `testing.md` pass in CI on the release branch.
- No skipped (`xit` / `xdescribe`) required tests without a linked ticket and phase lead approval.
- Coverage is not gated by percentage in MVP; critical paths listed per phase must have at least one automated test.

## Phase folder structure

Each numbered phase includes:

- `plan.md` — scope and implementation tasks
- `definition-of-done.md` — objective completion criteria
- `testing.md` — unit/E2E cases required before sign-off
