#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${HOME}/leggau"

cd "${APP_ROOT}"

git pull --ff-only
chmod +x ./scripts/bootstrap-ssd-storage.sh
./scripts/bootstrap-ssd-storage.sh
docker compose up -d --build
docker compose ps
