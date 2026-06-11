# Senior Developer Prompt — Phase 5: Buyer Marketplace and Requests

You are the senior developer responsible for delivering the **public marketplace**, saved vehicles, quote requests, and vehicle sourcing requests for buyers and admins.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/frontend-contract.md](../reference/frontend-contract.md)
- [../../../../packages/contracts/src/catalogue.ts](../../../../packages/contracts/src/catalogue.ts)
- [../../../../packages/contracts/src/quotes.ts](../../../../packages/contracts/src/quotes.ts)
- [../../../../packages/contracts/src/vehicle-requests.ts](../../../../packages/contracts/src/vehicle-requests.ts)

## Mission

Expose only safe, published marketplace data to guests/buyers and enable buyer engagement flows without leaking seller documents, internal verification data, or hidden storage metadata.

## Ask before coding if unresolved

1. Is listing detail public to guests or gated behind login?
2. Is the buyer inspection summary allowlist already approved in ADRs?
3. Are duplicate saves idempotent or expected to return `409`?
4. Are quote status names and payment-plan values final, or still subject to product revision?

Do not guess on public visibility or safe-field rules. Those decisions materially change the public API.

## Required deliverables

1. Public catalogue list/detail/inspection summary endpoints.
2. Saved vehicle CRUD under `ROUTES.me.savedVehicles`.
3. Quote creation plus admin quote list/update support.
4. Vehicle sourcing request creation plus admin triage support.
5. Index-aware catalogue queries with pagination and filter support.

## Execution path

1. Implement the Phase 5 tables and domain services first.
2. Build the public listing projection layer and strictly separate it from seller/admin representations.
3. Implement saved vehicles and buyer-auth flows.
4. Implement quote and vehicle-request creation, then admin triage updates.
5. Add rate limits and CSRF protection for buyer inquiry endpoints.
6. Wire `apps/web/app/(marketplace)` and related buyer-facing screens to the exact contract types and paths.

## Frontend wiring expectations

- Follow [frontend-wiring.md](./frontend-wiring.md) exactly.
- `apps/web/app/(marketplace)` must use only `ROUTES.catalogue.*`, `ROUTES.me.savedVehicle*`, `ROUTES.quotes.*`, and `ROUTES.vehicleRequests.*`.
- Cookie-authenticated unsafe calls must send `X-CSRF-Token`; do not introduce browser bearer-token storage.
- Render only fields present in `PublicListingDto` and `BuyerInspectionSummaryDto`.
- Do not introduce frontend-only assumptions about hidden seller PII or unpublished listings.
- Marketplace and buyer request UI changes must satisfy [frontend-quality.md](../reference/frontend-quality.md).

## Testing and verification

- Run all required unit and e2e tests from [testing.md](./testing.md).
- Verify unpublished listings never appear in catalogue data.
- Verify CSRF enforcement on saved vehicle, quote, and vehicle-request mutations.
- Snapshot or schema-test the public DTOs to prove no private fields leak.
- Capture and document the primary catalogue `EXPLAIN` path per the DOD.

## Definition of done

Treat [definition-of-done.md](./definition-of-done.md) as mandatory. The marketplace is not done until public payload safety and admin triage flows are both verified.

## Git checkpoint

- After the marketplace, saved vehicles, quotes, and sourcing flows pass required tests and satisfy the DOD, create a focused Phase 5 commit and push the branch.
- Do not commit or push while public DTO safety, guest visibility rules, or admin triage behavior remain unverified.

## Completion rule

Do not ship a “working” catalogue that still leaks verification fields or depends on unpublished fixtures. If guest-detail behavior is not finalized, ask before closing the phase.
