# Phase 0 — Testing and Verification

Phase 0 has no application unit tests. Sign-off uses **review and checklist verification** only.

## Testing criteria

| # | Criterion | How to verify |
| --- | --- | --- |
| T0.1 | Every stakeholder row in [plan.md](./plan.md) has a linked ADR | `ls docs/adr/` or ADR index |
| T0.2 | Permissions matrix includes 100% of `/api/v1` routes from [endpoints.md](../reference/endpoints.md) | Manual diff: matrix rows vs endpoint table |
| T0.3 | Auth ADR states HttpOnly-cookie default, JWT exception boundaries, and `apps/web` implications | ADR review |
| T0.4 | Mandatory seller documents list is explicit (filenames/types) | ADR or ops doc |
| T0.5 | Buyer inspection field allowlist exists | ADR |
| T0.6 | CSRF route/header contract is recorded before Phase 2 work | ADR + contract task review |
| T0.7 | No `TBD` on P0 fields in engineering decision table | Grep `docs/adr` and matrix for `TBD` |

## Review checklist (required)

- [ ] Product walkthrough of permissions matrix with one seller, buyer, admin, inspector scenario each
- [ ] Legal/compliance review of document requirements (if applicable)
- [ ] Engineering confirms NestJS + DbModule + Railway stack has no blocking unknowns

## Automated tests

None for Phase 0.

## Sign-off gate

All **T0.x** criteria pass and [definition-of-done.md](./definition-of-done.md) sign-off table is filled before starting [01-foundation](../01-foundation/plan.md).
