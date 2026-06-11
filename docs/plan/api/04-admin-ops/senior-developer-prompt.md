# Senior Developer Prompt — Phase 4: Admin Ops, Inspection, and Verification

You are the senior developer responsible for delivering the operational heart of the marketplace: **admin review, ownership verification, inspection workflow, approval, and publication**.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/data-model.md](../reference/data-model.md)
- [../../../../packages/contracts/src/admin.ts](../../../../packages/contracts/src/admin.ts)
- [../../../../packages/contracts/src/inspections.ts](../../../../packages/contracts/src/inspections.ts)
- [../../../../packages/contracts/src/routes.ts](../../../../packages/contracts/src/routes.ts)

## Mission

Allow admins and inspectors to move seller-submitted listings through verification, inspection, request-changes loops, approval, and explicit publication while preserving strict role isolation and auditability.

## Ask before coding if unresolved

1. Is the ownership verification route and request/response shape fully defined, or does it still need an ADR update?
2. Which fields belong in the buyer-safe inspection summary allowlist?
3. Who is allowed to mark sold, reserved, rejected, and delisted if seller proposals exist?
4. What operational labels should appear in admin queue filters so they match real ops language?

If the ownership-verification API is still unresolved, stop and ask before freezing the controller and contract surface.

## Required deliverables

1. `admin-ops`, `ownership-verification`, `inspections`, and `audit` modules.
2. Phase 4 migrations for inspection, verification, and admin action tables.
3. Admin dashboard counts, queue endpoints, and listing detail with admin-only document access.
4. Inspection task assignment, inspector task list/detail, and report submission flow.
5. Buyer-summary approval gate and explicit publish gate.
6. Seed/fixture path that leaves at least one `PUBLISHED` listing for Phase 5.

## Execution path

1. Implement the Phase 4 tables and register them in `DbModule`.
2. Add admin queue, detail, and action endpoints first.
3. Implement ownership verification lifecycle and inspector assignment/report flows.
4. Enforce inspector scoping so unassigned tasks are unreadable and unmodifiable.
5. Add buyer-summary approval, CSRF protection on unsafe admin/inspector mutations, and publish gating on top of verification/inspection completion.
6. Wire the admin and inspector web surfaces under `apps/web/app/(admin)` to the Phase 4 contracts.

## Frontend wiring expectations

- Follow [frontend-wiring.md](./frontend-wiring.md) exactly.
- `apps/web/app/(admin)` must consume `AdminDashboardDto`, `AdminListingDto`, and inspection DTOs from `@auto-iq/contracts`.
- Cookie-authenticated unsafe calls must send `X-CSRF-Token`; do not introduce browser bearer-token storage.
- Admin-only document download URLs may exist in admin DTOs; seller/buyer DTOs must remain private.
- Keep queue filtering, inspection actions, and enum rendering aligned with the documented admin language.
- Admin and inspector UI changes must satisfy [frontend-quality.md](../reference/frontend-quality.md).

## Testing and verification

- Run all required unit and e2e tests from [testing.md](./testing.md).
- Verify the request-changes loop, happy path to `PUBLISHED`, CSRF enforcement, inspector isolation, and publish restrictions.
- Confirm audit/admin action logs are written for verification and publish events.

## Definition of done

Use [definition-of-done.md](./definition-of-done.md) as the hard sign-off gate. Phase 5 cannot start without a valid published listing fixture and approved buyer summary.

## Git checkpoint

- After the Phase 4 queue, inspection, verification, and publish flows pass required tests and meet the DOD, create a focused commit and push the branch.
- Do not commit or push while the ownership-verification contract, publish gating, or audit trail behavior is still unresolved.

## Completion rule

Do not leave route-shape ambiguity, seeded fake admin logic, or partial publish flow. If ownership verification semantics are not finalized, ask first and block closure.
