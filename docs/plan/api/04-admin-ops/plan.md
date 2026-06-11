# Phase 4: Admin Ops, Inspection, and Verification

| | |
| --- | --- |
| **Goal** | Admins and inspectors process listings through verification, inspection, approval, and publish. |
| **Depends on** | [03-seller-listings](../03-seller-listings/plan.md) |
| **Blocks** | [05-buyer-marketplace](../05-buyer-marketplace/plan.md) |
| **Frontend contract** | [frontend-wiring.md](./frontend-wiring.md) |
| **Sign-off** | [definition-of-done.md](./definition-of-done.md) · [testing.md](./testing.md) |

## Data model

`inspection_tasks`, `inspection_reports`, `inspection_findings`, `ownership_verifications`, `admin_action_logs`.

## Modules

`admin-ops`, `ownership-verification`, `inspections`, `audit`.

## Endpoints

Implement [frontend-wiring.md](./frontend-wiring.md) — `ROUTES.admin.*`, `ROUTES.inspectors.*`.

## Tasks

- [ ] Admin queues and dashboard counts
- [ ] Request changes, approve, publish, reject, delist, sold, reserved
- [ ] Ownership verification lifecycle
- [ ] Inspection assign, report upload, buyer summary approval
- [ ] Inspector scoped to assigned tasks only
- [ ] Seed at least one `PUBLISHED` listing for Phase 5

## Next phase

[05-buyer-marketplace/plan.md](../05-buyer-marketplace/plan.md)
