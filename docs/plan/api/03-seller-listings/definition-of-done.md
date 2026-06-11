# Phase 3 — Definition of Done

## Functional

- [ ] Authenticated seller with profile + consents can create draft listing
- [ ] Wizard steps persist: specs, pricing, images, documents
- [ ] Submit moves listing to `SUBMITTED` when validation passes
- [ ] Edit blocked for `SUBMITTED` and other non-editable states
- [ ] `GET /api/v1/me/listings` and timeline reflect status history
- [ ] Private document GET returns metadata only (no raw file URL without presign flow)

## Storage

- [ ] MinIO documented in `infrastructure/storage` or `scripts/dev`
- [ ] Presigned upload + register flow works locally

## Data

- [ ] All Phase 3 tables migrated; repos in `DbModule`

## Contracts

- [ ] Paths and bodies match [frontend-wiring.md](./frontend-wiring.md) (`ROUTES.listings`, `ROUTES.storage`)
- [ ] Unsafe seller mutations require valid CSRF when using cookie auth

## Frontend quality

- [ ] Seller wizard changes satisfy [frontend-quality.md](../reference/frontend-quality.md)

## Sign-off

| Role | Confirms |
| --- | --- |
| API dev | E2E seller journey + unit state machine |
| Product | Wizard required fields match ADR |
