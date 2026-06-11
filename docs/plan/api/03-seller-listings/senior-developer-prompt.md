# Senior Developer Prompt — Phase 3: Seller Listing Workflow

You are the senior developer responsible for delivering the full **seller listing workflow** for Phase 3 across API, storage, contracts, and seller-facing frontend wiring.

## Source of truth

- [plan.md](./plan.md)
- [frontend-wiring.md](./frontend-wiring.md)
- [testing.md](./testing.md)
- [definition-of-done.md](./definition-of-done.md)
- [../reference/data-model.md](../reference/data-model.md)
- [../reference/frontend-contract.md](../reference/frontend-contract.md)
- [../../../../packages/contracts/src/listings.ts](../../../../packages/contracts/src/listings.ts)
- [../../../../packages/contracts/src/storage.ts](../../../../packages/contracts/src/storage.ts)

## Mission

Enable authenticated sellers to create and edit draft listings, upload images/documents through presigned storage flows, submit for review, and see status/timeline data without exposing private storage internals.

## Ask before coding if unresolved

1. Which document types are mandatory at MVP, by exact enum list?
2. What is the minimum photo requirement for submission?
3. Which listing fields are strictly required at draft creation versus allowed to remain incomplete until submit?
4. Is local object storage MinIO, or is there another approved S3-compatible dev target?

Do not invent wizard requirements. If the ADRs do not lock them, ask before finalizing validators and enum sets.

## Required deliverables

1. `listings`, `listing-media`, `listing-documents`, `storage`, and `reference-data` modules.
2. Phase 3 migrations for all listing and storage-related tables.
3. State-machine enforcement for `DRAFT`, `CHANGES_REQUESTED`, and `SUBMITTED`.
4. Presign + register flows with magic-byte validation and cover-image enforcement.
5. Seller list/detail/timeline endpoints matching `ROUTES.listings.*` and `ROUTES.storage.*`.
6. Reference data endpoint used by seller wizard dropdowns.

## Execution path

1. Implement the listing data model and state history first.
2. Add the wizard validation layer and reject incomplete submit transitions.
3. Implement storage presign/register flows with strict content-type and magic-byte checks.
4. Add cover image rules, document review metadata, CSRF protection on unsafe seller mutations, and timeline events.
5. Wire `apps/web/app/seller` to the exact step mapping in [frontend-wiring.md](./frontend-wiring.md).
6. Verify seller DTOs never leak raw storage keys or admin-only file links.

## Frontend wiring expectations

- Use the exact wizard/API mapping in [frontend-wiring.md](./frontend-wiring.md).
- `apps/web/app/seller` must call only `ROUTES.listings.*`, `ROUTES.storage.*`, and `ROUTES.referenceData.all`.
- Cookie-authenticated unsafe calls must send `X-CSRF-Token`; do not introduce browser bearer-token storage.
- Direct uploads must go to presigned URLs with no API auth headers on the object PUT.
- The seller UI must render status, timeline, cover image, and `changesNote` using contract DTOs only.
- Seller UI changes must satisfy [frontend-quality.md](../reference/frontend-quality.md).

## Testing and verification

- Run all required unit and e2e tests from [testing.md](./testing.md).
- Verify illegal transitions, cross-seller access denial, CSRF enforcement, bad file rejection, and submit validation failures.
- Confirm local MinIO or equivalent dev storage setup is documented and reproducible.

## Definition of done

Treat [definition-of-done.md](./definition-of-done.md) as mandatory. Phase 4 must inherit clean `SUBMITTED` listings and valid storage metadata without redesign.

## Git checkpoint

- After the seller workflow passes the required verification in [testing.md](./testing.md) and satisfies the full DOD, create a focused Phase 3 commit and push the branch.
- Do not commit or push while storage flows, wizard validation, or listing state rules are still incomplete or undocumented.

## Completion rule

Do not leave placeholder storage services, TODO validators, or undocumented document rules. If a required document/photo rule is still unclear, ask before closing the phase.
