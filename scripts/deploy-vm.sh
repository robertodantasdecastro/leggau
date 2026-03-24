#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${HOME}/leggau"

cd "${APP_ROOT}"

git pull --ff-only
docker compose up -d --build
docker compose ps
