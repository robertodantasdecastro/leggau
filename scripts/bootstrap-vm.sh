#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${HOME}/leggau"
REPO_URL="${1:-git@github.com:robertodantasdecastro/leggau.git}"
VM_IP="${2:-10.211.55.22}"

echo "[leggau] Creating base directories..."
mkdir -p "${APP_ROOT}"/.data/docker/{postgres,redis}
mkdir -p "${APP_ROOT}"/.data/{uploads,backups,runtime}
mkdir -p "${APP_ROOT}"/.data/runtime/cloudflare
mkdir -p "${APP_ROOT}"/.data/mobile/{builds,cache}
mkdir -p "${APP_ROOT}"/.data/art/blender "${APP_ROOT}"/logs

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

if grep -q '^DEV_API_BASE_URL=' .env; then
  perl -0pi -e "s#^DEV_API_BASE_URL=.*#DEV_API_BASE_URL=http://${VM_IP}:8080/api#m" .env
fi

echo "[leggau] Bootstrap complete."
echo "Next steps:"
echo "  1. Review ${APP_ROOT}/.env"
echo "  2. Run: cd ${APP_ROOT} && docker compose up -d --build"
