# Auto IQ API Delivery Plan

End-to-end plan for `apps/api` (NestJS, TypeORM, PostgreSQL) from discovery through production on Railway.

**Frontend integration:** types and routes live in `packages/contracts`. Each phase includes [frontend-wiring.md](./00-discovery/frontend-wiring.md) with exact headers, query params, and request/response bodies. Master index: [reference/frontend-contract.md](./reference/frontend-contract.md).

Parent reference: [backend-implementation-plan.md](../../backend-implementation-plan.md).

## How to use

Work through numbered phases in order. Each phase folder contains:

| File | Purpose |
| --- | --- |
| [plan.md](./00-discovery/plan.md) | Scope, tasks, dependencies |
| [frontend-wiring.md](./02-identity/frontend-wiring.md) | Exact API contract for `apps/web` (per phase) |
| [definition-of-done.md](./00-discovery/definition-of-done.md) | Completion criteria and sign-off |
| [testing.md](./00-discovery/testing.md) | Unit/E2E required before sign-off |

Do not start phase **N+1** until phase **N** DOD and testing gates pass.

## Delivery roadmap

| Order | Folder | Outcome |
| --- | --- | --- |
| 0 | [00-discovery/](./00-discovery/) | Decisions locked |
| 1 | [01-foundation/](./01-foundation/) | DB, Redis, DbModule, health, CI |
| 2 | [02-identity/](./02-identity/) | Auth, profiles, consents |
| 3 | [03-seller-listings/](./03-seller-listings/) | Listing wizard and submit |
| 4 | [04-admin-ops/](./04-admin-ops/) | Review, inspection, publish |
| 5 | [05-buyer-marketplace/](./05-buyer-marketplace/) | Catalogue, quotes, sourcing |
| 6 | [06-viewings-notifications/](./06-viewings-notifications/) | Viewings and messaging |
| 7 | [07-hardening/](./07-hardening/) | Security, full E2E, Sentry |
| 8 | [08-production/](./08-production/) | Railway + Tigris deploy |

## Cross-cutting reference

| Document | Topic |
| --- | --- |
| [reference/frontend-contract.md](./reference/frontend-contract.md) | **Frontend ↔ API contract (primary)** |
| [reference/architecture.md](./reference/architecture.md) | Stack, DbModule |
| [reference/data-model.md](./reference/data-model.md) | Tables, enums |
| [reference/endpoints.md](./reference/endpoints.md) | Route index → contracts |
| [reference/route-permissions.md](./reference/route-permissions.md) | Discovery permissions matrix |
| [reference/security.md](./reference/security.md) | Authz, rate limits |
| [reference/observability.md](./reference/observability.md) | Logs, Sentry |
| [reference/frontend-quality.md](./reference/frontend-quality.md) | Accessibility, i18n, and web quality gates |
| [reference/testing-conventions.md](./reference/testing-conventions.md) | Test layout |

## MVP scope

**In:** trust workflow from onboarding through published listings, buyer requests, admin ops, audit, notifications.

**Out:** payments, escrow, loans, insurance, AV, AI damage, native mobile beyond shared contracts.
