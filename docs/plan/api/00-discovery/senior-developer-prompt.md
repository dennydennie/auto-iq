# Senior Developer Prompt — Phase 0: Discovery and Decision Lock

You are the senior developer responsible for closing **Phase 0** before any implementation phase begins.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/endpoints.md](../reference/endpoints.md)
- [../../../backend-implementation-plan.md](../../../backend-implementation-plan.md)

## Mission

Produce the decision artifacts that remove rework risk for auth, CSRF, catalogue visibility, document requirements, inspection visibility, viewing workflow, and role/permission boundaries. This phase is documentation and alignment only. Do not write feature code, migrations, or CI changes beyond the existing scaffold.

## Mandatory questions to resolve before sign-off

Ask these explicitly if the answer is not already recorded in `docs/adr/` or `docs/operations/`:

1. Are seller contact details never shown, or only shown after a confirmed viewing?
2. Are guest users allowed to open full listing detail, or catalogue summaries only?
3. Which seller documents are mandatory at MVP launch, by exact document type?
4. Which inspection fields are buyer-facing, and which stay internal only?
5. Do TIDA import quotations share `vehicle-requests` or require a separate workflow?
6. Which channels launch in MVP: email, SMS, WhatsApp, or a subset?
7. Who can mark listings sold, reserved, rejected, and delisted?
8. What is the no-show and repeat-offender policy?
9. Does the team accept [ADR 0001](../../../adr/0001-web-auth-and-csrf.md): web auth uses HttpOnly cookies, JWT is future/non-browser only, and unsafe cookie-authenticated requests require CSRF?
10. Is phone or email the primary identity key for onboarding and OTP?

Do not guess. If any answer is still missing and blocks Phase 1 or 2, stop and ask.

## Required deliverables

1. ADRs in `docs/adr/` for every stakeholder and engineering decision listed in [plan.md](./plan.md).
2. A permissions matrix covering every route in [../reference/endpoints.md](../reference/endpoints.md).
3. An explicit MVP in/out acknowledgement aligned with [../../../backend-implementation-plan.md](../../../backend-implementation-plan.md).
4. A written decision for frontend-impact items in [frontend-wiring.md](./frontend-wiring.md), including CSRF bootstrap and retry behavior.

## Execution path

1. Read `plan.md` and extract every open decision into a checklist.
2. Compare that checklist against existing ADRs and ops docs.
3. Create or update ADRs for missing decisions. Every ADR must show status, owner, date, and revisit date if deferred.
4. Build the permissions matrix against the full `/api/v1` route set, not only currently implemented routes.
5. Verify frontend consequences for auth mode, CSRF, guest detail access, required document types, inspection allowlist, and viewing locations.
6. Run the review gates from [testing.md](./testing.md) and confirm all `T0.x` criteria.

## Frontend wiring expectations

- No API implementation in this phase.
- You must still lock the decisions that drive `apps/web/app/auth`, `apps/web/app/onboarding`, `apps/web/app/seller`, `apps/web/app/(marketplace)`, and `apps/web/app/(admin)`.
- `apps/web` must use cookie credentials by default and must not persist browser JWTs.
- If a decision changes contract shape, note the exact `@auto-iq/contracts` surface it affects.

## Testing and verification

- Follow [testing.md](./testing.md) exactly.
- Phase 0 has no automated application tests. Verification is artifact review, route-matrix coverage, and elimination of all P0 `TBD` items.

## Definition of done

Treat [definition-of-done.md](./definition-of-done.md) as mandatory. Phase 0 is not complete until there are zero P0 open questions and sign-off is recorded.

## Git checkpoint

- After all Phase 0 artifacts are complete and verification in [testing.md](./testing.md) passes, create a focused commit for Phase 0 and push the branch.
- Do not commit or push while P0 decisions, sign-off, or artifact gaps remain open.

## Completion rule

Do not finish with “follow-up needed” unless the missing item is explicitly recorded as a blocked question for product/ops/legal. If blocked, ask the missing question directly and list the exact artifact that cannot be completed without the answer.
