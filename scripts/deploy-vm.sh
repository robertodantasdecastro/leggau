#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${HOME}/leggau"

cd "${APP_ROOT}"

git pull --ff-only
chmod +x ./scripts/bootstrap-ssd-storage.sh
./scripts/bootstrap-ssd-storage.sh
if [[ -x ./scripts/sync-cloudflare-dev-alias.sh ]]; then
  ./scripts/sync-cloudflare-dev-alias.sh || true
fi
docker compose up -d --build
docker compose ps
