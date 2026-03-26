#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${HOME}/leggau"

cd "${APP_ROOT}"

if [[ "${LEGGAU_SKIP_REMOTE_GIT_PULL:-0}" != "1" ]]; then
  git pull --ff-only
fi
chmod +x ./scripts/bootstrap-ssd-storage.sh
./scripts/bootstrap-ssd-storage.sh
if [[ -x ./scripts/sync-cloudflare-dev-alias.sh ]]; then
  ./scripts/sync-cloudflare-dev-alias.sh || true
fi
docker compose up -d --build
docker compose ps
