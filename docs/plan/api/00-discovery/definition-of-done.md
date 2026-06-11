# Phase 0 — Definition of Done

Phase 0 is complete when planning artifacts exist and no **P0** decision blocks schema, auth, or Phase 1 work.

## Required artifacts

| Artifact | Location | Done when |
| --- | --- | --- |
| Stakeholder ADRs | `docs/adr/` | Each MVP decision has ADR `accepted` or `deferred` with owner and revisit date |
| Permissions matrix | `docs/adr/` or `docs/plan/api/reference/` | Covers all routes in [endpoints.md](../reference/endpoints.md) |
| Auth transport decision | [ADR 0001](../../../adr/0001-web-auth-and-csrf.md) | HttpOnly-cookie web default and JWT exception boundaries documented |
| CSRF contract decision | [ADR 0001](../../../adr/0001-web-auth-and-csrf.md) | Route/header contract documented before Phase 2 |
| Catalogue visibility decision | ADR | Guest vs auth detail documented |
| No-show policy | [docs/operations/no-show-policy.md](../../operations/no-show-policy.md) | Repeated no-show enforcement rules documented |
| MVP in/out list | [backend-implementation-plan.md](../../../backend-implementation-plan.md) or ADR | Product acknowledges exclusions (payments, escrow, etc.) |

## Quality bar

- Zero open questions labeled **P0** in the decision log.
- Phase 1–8 folders reviewed; team agrees order and scope.
- Inspector and admin roles have explicit deny rules for seller-only and buyer-only routes.

## Sign-off

| Role | Responsibility |
| --- | --- |
| Product | Stakeholder decisions and matrix |
| Engineering lead | Stack, hosting, and feasibility |
| Tech lead (API) | Permissions matrix completeness vs endpoints |

Record sign-off: date, names, and link to ticket or PR in this repo or planning tool.

### Phase 0 sign-off

| Role | Status | Record |
| --- | --- | --- |
| Product | Approved | [docs/plan/api/00-discovery/sign-off.md](./sign-off.md) |
| Engineering lead | Approved | [docs/plan/api/00-discovery/sign-off.md](./sign-off.md) |
| Tech lead (API) | Approved | [docs/plan/api/00-discovery/sign-off.md](./sign-off.md) |

## Out of scope for Phase 0

- Application code, migrations, or CI beyond what already exists in the monorepo scaffold.
