# Phase 5 — Definition of Done

## Functional

- [ ] `GET /listings` returns only `PUBLISHED` listings
- [ ] `GET /listings/:id` respects guest vs auth rules from ADR
- [ ] No seller documents, internal verification, or storage keys in public JSON
- [ ] Inspection summary endpoint returns allowlisted fields only
- [ ] Buyer can save/unsave/list saved vehicles
- [ ] Buyer can create quote on published listing; admin can list/update status
- [ ] Buyer can create vehicle sourcing request; admin can triage
- [ ] Unsafe buyer/admin mutations require valid CSRF when using cookie auth

## Performance

- [ ] Catalogue query has indexes; `EXPLAIN` captured for primary filter path (doc or PR note)

## Frontend quality

- [ ] Marketplace and buyer request changes satisfy [frontend-quality.md](../reference/frontend-quality.md)

## Sign-off

| Role | Confirms |
| --- | --- |
| API dev | Tests + no private field leak |
| Frontend | Catalogue contract matches `packages/contracts` |
