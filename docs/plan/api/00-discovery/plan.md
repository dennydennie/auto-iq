# Phase 0: Discovery and Decision Lock

| | |
| --- | --- |
| **Goal** | Resolve open product and engineering choices so implementation does not rework auth, visibility, or workflow rules. |
| **Depends on** | FRD, screen ZIP, [backend-implementation-plan.md](../../../backend-implementation-plan.md) §15 |
| **Blocks** | All implementation phases |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) (decisions only) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Stakeholder decisions

| Topic | Options to decide | Decision owner | Record in |
| --- | --- | --- | --- |
| Seller contact visibility | Never on platform vs after viewing confirmed | Product | [ADR 0003](../../../adr/0003-seller-contact-visibility.md) |
| Guest listing detail | Summary only vs full detail public | Product | [ADR 0004](../../../adr/0004-guest-listing-detail.md) |
| Mandatory seller documents at MVP | ID, logbook, proof of ownership list | Product + Legal | [ADR 0005](../../../adr/0005-mandatory-seller-documents.md) |
| Buyer-facing inspection fields | Field allowlist | Product + Ops | [ADR 0006](../../../adr/0006-buyer-facing-inspection-summary.md) |
| TIDA import quotations | Same pipeline as `vehicle-requests` vs separate | Product | [ADR 0007](../../../adr/0007-tida-import-quotations.md) |
| Launch notification channels | Email, SMS, WhatsApp subset | Product | [ADR 0008](../../../adr/0008-launch-notification-channels.md) |
| Who marks sold/reserved/rejected/delisted | Admin only vs seller propose | Product + Engineering | [ADR 0009](../../../adr/0009-listing-admin-actions.md) |
| No-show policy | Warnings, suspensions | Product + Ops | `docs/operations/no-show-policy.md` |

## Engineering decisions

| Topic | Recommendation | Status |
| --- | --- | --- |
| API stack | NestJS + TypeORM + PostgreSQL | Locked |
| Auth transport | HttpOnly cookies for web; JWT only for future non-browser clients | Locked by [ADR 0001](../../../adr/0001-web-auth-and-csrf.md) |
| CSRF | Required on unsafe cookie-authenticated browser requests | Locked by [ADR 0001](../../../adr/0001-web-auth-and-csrf.md) |
| Phone vs email primary | Drives OTP and unique constraints | Locked by [ADR 0010](../../../adr/0010-primary-identity-key.md) |
| Catalogue auth | Public browse vs login for detail | Public detail with role-aware payload |
| Single tenant | No SaaS tenant id in MVP | Locked |
| Contracts package | DTOs shared via `packages/contracts` | Locked |
| Hosting | Railway, Tigris, Railway Redis | Locked |

## Roles and permissions matrix

Produce a matrix before Phase 2 coding. Extend with every admin and seller route from [endpoints.md](../reference/endpoints.md).

| Action | Buyer | Seller | Inspector | Admin |
| --- | --- | --- | --- | --- |
| Register / login | ✓ | ✓ | ✓ | ✓ |
| Create listing draft | | ✓ | | |
| Submit listing | | ✓ | | |
| Publish listing | | | | ✓ |
| Assign inspection | | | | ✓ |
| Upload inspection report | | | ✓ | |
| Approve buyer summary | | | | ✓ |
| Request viewing | ✓ | | | |
| Confirm viewing | | ✓ | | ✓ |

## Implementation tasks

- [x] ADR per stakeholder decision (accepted or explicitly deferred with date)
- [x] Permissions matrix document in `docs/plan/api/reference/`
- [x] Auth, catalogue, and document mandatory-list decisions written
- [x] CSRF route/header contract reflected in `packages/contracts` before Phase 2 starts
- [x] Engineering lead + product sign-off recorded in [sign-off.md](./sign-off.md)

## Next phase

[01-foundation/plan.md](../01-foundation/plan.md)
