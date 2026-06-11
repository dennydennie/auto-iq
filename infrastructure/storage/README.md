# Storage

Phase 3 uses local MinIO as the S3-compatible object store for seller listing images and private seller documents.

## Local bootstrap

The shared compose file provisions MinIO and creates the `auto-iq-local` bucket:

```bash
docker compose -f infrastructure/database/docker-compose.yml up -d minio minio-init
```

Default endpoints:

- API endpoint: `http://localhost:9000`
- Console: `http://localhost:9001`
- Access key: value from `AUTO_IQ_MINIO_ACCESS_KEY`
- Secret key: value from `AUTO_IQ_MINIO_SECRET_KEY`
- Bucket: `auto-iq-local`

## Prefixes

- `listing-images/` for seller-facing gallery images
- `seller-documents/` for private ownership and identity documents

Uploads always follow the API flow:

1. `POST /api/v1/storage/images|documents/presign`
2. `PUT` binary bytes directly to the presigned URL
3. `POST /api/v1/listings/:id/images|documents` to register after server-side magic-byte validation
