#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${HOME}/leggau"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${APP_ROOT}/data/backups/${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}"

docker compose -f "${APP_ROOT}/docker-compose.yml" exec -T postgres \
  pg_dump -U "${DB_USER:-leggau}" "${DB_NAME:-leggau}" > "${BACKUP_DIR}/db.sql"

tar -czf "${BACKUP_DIR}/uploads.tar.gz" -C "${APP_ROOT}/data" uploads

echo "[leggau] Backup created at ${BACKUP_DIR}"
