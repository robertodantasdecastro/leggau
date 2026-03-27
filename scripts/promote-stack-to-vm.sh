#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${1:-vm2}"
REMOTE_ROOT="${2:-\$HOME/leggau}"
VM_IP="${3:-10.211.55.22}"
REPO_URL="${4:-git@github.com:robertodantasdecastro/leggau.git}"

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)
RSYNC_OPTS=(
  -az
  --exclude=.git/
  --exclude=.data/
  --exclude=backend/node_modules/
  --exclude=web/portal/node_modules/
  --exclude=web/admin/node_modules/
  --exclude=mobile/Library/
  --exclude=mobile/Logs/
  --exclude=mobile/Temp/
  --exclude=mobile/obj/
  --exclude=mobile/UserSettings/
  --exclude=__pycache__/
  --exclude=.DS_Store
)

cd "${PROJECT_ROOT}"

echo "[leggau] Checking SSH access to ${REMOTE}..."
ssh "${SSH_OPTS[@]}" "${REMOTE}" "printf 'remote=%s\n' \"\$(hostname)\""

echo "[leggau] Ensuring remote root ${REMOTE_ROOT}..."
ssh "${SSH_OPTS[@]}" "${REMOTE}" "mkdir -p ${REMOTE_ROOT}"

echo "[leggau] Resolving remote root path..."
REMOTE_ROOT_RESOLVED="$(ssh "${SSH_OPTS[@]}" "${REMOTE}" "cd ${REMOTE_ROOT} && pwd")"

echo "[leggau] Cloning repository on VM when needed..."
ssh "${SSH_OPTS[@]}" "${REMOTE}" "if [ ! -d ${REMOTE_ROOT_RESOLVED}/.git ]; then git clone '${REPO_URL}' ${REMOTE_ROOT_RESOLVED}; fi"

echo "[leggau] Syncing project surfaces to VM..."
ssh "${SSH_OPTS[@]}" "${REMOTE}" "
  mkdir -p \
    ${REMOTE_ROOT_RESOLVED}/backend \
    ${REMOTE_ROOT_RESOLVED}/web \
    ${REMOTE_ROOT_RESOLVED}/infra \
    ${REMOTE_ROOT_RESOLVED}/docs \
    ${REMOTE_ROOT_RESOLVED}/scripts \
    ${REMOTE_ROOT_RESOLVED}/.codex
"

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/AGENTS.md" \
  "${PROJECT_ROOT}/README.md" \
  "${PROJECT_ROOT}/docker-compose.yml" \
  "${PROJECT_ROOT}/.env.example" \
  "${REMOTE}:${REMOTE_ROOT_RESOLVED}/"

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/backend/" \
  "${REMOTE}:${REMOTE_ROOT_RESOLVED}/backend/"

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/web/" \
  "${REMOTE}:${REMOTE_ROOT_RESOLVED}/web/"

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/infra/" \
  "${REMOTE}:${REMOTE_ROOT_RESOLVED}/infra/"

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/docs/" \
  "${REMOTE}:${REMOTE_ROOT_RESOLVED}/docs/"

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/scripts/" \
  "${REMOTE}:${REMOTE_ROOT_RESOLVED}/scripts/"

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/.codex/" \
  "${REMOTE}:${REMOTE_ROOT_RESOLVED}/.codex/"

echo "[leggau] Preparing remote environment..."
ssh "${SSH_OPTS[@]}" "${REMOTE}" "
  cd ${REMOTE_ROOT_RESOLVED} && \
  chmod +x ./scripts/*.sh && \
  ./scripts/bootstrap-vm.sh '${REPO_URL}' '${VM_IP}' && \
  [ -f .env ] || cp .env.example .env && \
  perl -0pi -e 's#^DEV_API_BASE_URL=.*#DEV_API_BASE_URL=http://${VM_IP}:8080/api#m' .env && \
  (grep -q '^DEV_API_ALIAS_URL=' .env || printf '\nDEV_API_ALIAS_URL=https://api-dev.trycloudflare.com\n' >> .env) && \
  LEGGAU_SKIP_REMOTE_GIT_PULL=1 LEGGAU_CLOUDFLARE_AUTOSTART=1 ./scripts/deploy-vm.sh
"

echo "[leggau] Remote promotion finished for ${REMOTE}:${REMOTE_ROOT_RESOLVED}"
