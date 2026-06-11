# Local API Boot

Phase 1 local foundation:

```bash
cp .env.example .env
docker compose -f infrastructure/database/docker-compose.yml up -d
pnpm --filter api migration:run
pnpm --filter api dev
```

Health endpoints:

```bash
curl http://localhost:4000/api/v1/health/live
curl http://localhost:4000/api/v1/health/ready
```

Phase 4 published-listing fixture:

```bash
scripts/dev/seed-phase4-published-listing.sh
```

Phase 7 hardening smoke:

```bash
scripts/dev/phase7-hardening-smoke.sh
```

The script assumes:

- local API is running
- local Postgres, Redis, and MinIO match `.env.example`
- `psql` is available locally
