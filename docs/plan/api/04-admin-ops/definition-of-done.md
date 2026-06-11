# Phase 4 — Definition of Done

## Functional

- [ ] Admin can list/filter `SUBMITTED` and in-progress queues
- [ ] Admin detail includes presigned private document URLs
- [ ] Request changes → seller can edit (Phase 3 rules)
- [ ] Happy path: submitted → verification + inspection → approve → publish
- [ ] `PUBLISHED` only via explicit admin publish action
- [ ] Buyer-safe inspection summary exists only after admin approval step
- [ ] Inspector cannot read/update unassigned tasks
- [ ] `admin_action_logs` / `audit_logs` record publish, reject, verification outcomes
- [ ] Unsafe admin/inspector mutations require valid CSRF when using cookie auth

## Data

- [ ] Phase 4 migrations applied; repos in `DbModule`

## Demo data

- [ ] Seed or e2e fixture leaves ≥1 `PUBLISHED` listing with approved summary for Phase 5

## Frontend quality

- [ ] Admin and inspector changes satisfy [frontend-quality.md](../reference/frontend-quality.md)

## Sign-off

| Role | Confirms |
| --- | --- |
| API dev | All required tests |
| Product/Ops | Queue filters match operational language |
