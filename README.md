# Auto IQ Monorepo

This repository bootstraps Auto IQ with the same monorepo shape used in `blue`.

- `apps/api` for the backend API
- `apps/web` for the buyer, seller, and admin web surface
- `apps/mobile` for the Flutter mobile shell
- `packages/types` for shared TypeScript contracts
- `packages/config` for shared config presets
- `docs` for planning and architecture
- `infrastructure` for database, storage, and observability assets
- `scripts` for smoke and utility scripts

## Workspace Layout

```text
apps/
  api/
  web/
  mobile/
packages/
  config/
  types/
docs/
  adr/
  api/
  plan/api/     # phased API plans (plan, definition-of-done, testing per phase)
  operations/
infrastructure/
  database/
  storage/
  observability/
scripts/
```

## Bootstrap Notes

- The workspace mirrors `blue` at the root level with `pnpm` and `turbo`.
- `apps/api` is a NestJS-ready shell so backend implementation can start without reworking the workspace.
- `apps/web` is a minimal Next.js App Router shell.
- `apps/mobile` is a wired Flutter Android client for buyer and seller flows. Use `./scripts/dev/start-mobile-stack.sh` to bring up the local backend runtime before launching the emulator build.
