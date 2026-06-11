# Phase 7 — Frontend wiring

No new routes. Verify **full app** uses only `ROUTES` + contract DTOs from Phases 1–6.

## Contract test targets (`packages/contracts`)

| Export | Assert |
| --- | --- |
| `PublicListingDto` | Snapshot / schema — no forbidden keys |
| `MeResponse` | Required fields after login |
| `ApiError` | Shape on mocked 422 |
| `CatalogueResponse` | `meta.nextCursor`, `meta.hasMore` |

## Cross-cutting UI

- [ ] Error toast shows `ApiError.correlationId`
- [ ] Sentry browser SDK tags `correlationId` from response header
- [ ] All list screens use correct pagination type (cursor vs offset)
- [ ] Unsafe cookie-authenticated requests use `X-CSRF-Token`; no browser JWT persistence exists
- [ ] Full app satisfies [frontend-quality.md](../reference/frontend-quality.md)

See [testing.md](./testing.md) contract test IDs C7.x.
