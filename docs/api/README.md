# API Contracts

Generate OpenAPI JSON from the Nest application with:

```bash
pnpm --filter api openapi:export
```

Default output path:

- `docs/api/openapi.json`

Typed request and response contracts remain in `packages/contracts`.

Phase 7 verification:

```bash
pnpm --filter api openapi:export
```

Treat the generated `docs/api/openapi.json` diff as the contract freshness check before launch sign-off.
