#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/database/docker-compose.yml"

export AUTO_IQ_POSTGRES_PORT="${AUTO_IQ_POSTGRES_PORT:-55432}"
export AUTO_IQ_REDIS_PORT="${AUTO_IQ_REDIS_PORT:-56379}"
export AUTO_IQ_MINIO_PORT="${AUTO_IQ_MINIO_PORT:-59000}"
export AUTO_IQ_MINIO_CONSOLE_PORT="${AUTO_IQ_MINIO_CONSOLE_PORT:-59001}"
export AUTO_IQ_API_PORT="${AUTO_IQ_API_PORT:-4000}"

docker compose -f "$COMPOSE_FILE" up --build -d postgres redis minio minio-init api
docker compose -f "$COMPOSE_FILE" up --build seed

echo
echo "Mobile runtime is up."
echo "API:    http://localhost:${AUTO_IQ_API_PORT}/api/v1"
echo "MinIO:  http://localhost:${AUTO_IQ_MINIO_CONSOLE_PORT}"
echo
echo "Run the Android app with:"
echo "flutter run --dart-define=AUTO_IQ_API_BASE_URL=http://10.0.2.2:${AUTO_IQ_API_PORT} -d emulator-5554"
