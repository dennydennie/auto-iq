# Database

Reserved for PostgreSQL bootstrap assets, extensions, local database tooling, and ops SQL. Application schema migrations live in `apps/api` via TypeORM.

## Local services

Start PostgreSQL, Redis, and MinIO for seller-listing development:

```bash
docker compose -f infrastructure/database/docker-compose.yml up -d
```

If default ports are already taken, override host ports:

```bash
AUTO_IQ_POSTGRES_PORT=55432 AUTO_IQ_REDIS_PORT=56379 \
AUTO_IQ_MINIO_PORT=59000 AUTO_IQ_MINIO_CONSOLE_PORT=59001 \
  docker compose -f infrastructure/database/docker-compose.yml up -d
```

The local database, Redis, and object-storage defaults match the root `.env.example`.

MinIO console: `http://localhost:9001` unless overridden.

Run the baseline migration from the repo root:

```bash
pnpm --filter api migration:run
```
