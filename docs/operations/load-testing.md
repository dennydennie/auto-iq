# Load Testing

## Catalogue smoke

```bash
node scripts/load/catalogue-smoke.mjs
```

Environment knobs:

- `API_BASE`
- `VUS`
- `REQUESTS`

Phase 7 starting target:

- `p95Ms < 500`
- `errors = 0`

## Presign + register smoke

```bash
node scripts/load/presign-register-smoke.mjs
```

Required environment:

- `API_BASE`
- `SELLER_EMAIL`
- `SELLER_PASSWORD`
- `LISTING_ID`

Outputs include `averageMs`, `p50Ms`, `p95Ms`, and `errors` for quick Phase 7 evidence.

Phase 7 starting target:

- `p95Ms < 1000`
- `errors = 0`

## Evidence capture

Record each run with:

- command and environment
- app commit SHA or release identifier
- `averageMs`, `p50Ms`, `p95Ms`, and `errors`
- accepted waiver if a target is missed
