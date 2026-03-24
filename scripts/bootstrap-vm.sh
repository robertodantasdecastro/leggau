#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${HOME}/leggau"
REPO_URL="${1:-git@github.com:robertodantasdecastro/leggau.git}"

echo "[leggau] Creating base directories..."
mkdir -p "${APP_ROOT}"/data/{uploads,backups} "${APP_ROOT}"/logs

if ! command -v docker >/dev/null 2>&1; then
  echo "[leggau] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "${USER}"
fi

if [[ ! -d "${APP_ROOT}/.git" ]]; then
  echo "[leggau] Cloning repository into ${APP_ROOT}..."
  git clone "${REPO_URL}" "${APP_ROOT}"
fi

cd "${APP_ROOT}"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

echo "[leggau] Bootstrap complete."
echo "Next steps:"
echo "  1. Review ${APP_ROOT}/.env"
echo "  2. Run: cd ${APP_ROOT} && docker compose up -d --build"
