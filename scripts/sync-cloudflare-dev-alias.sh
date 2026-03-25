#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.data/runtime/cloudflare"
PORTAL_ALIAS="${DEV_PORTAL_ALIAS_URL:-https://portal-dev.trycloudflare.com}"
ADMIN_ALIAS="${DEV_ADMIN_ALIAS_URL:-https://admin-dev.trycloudflare.com}"

mkdir -p "${RUNTIME_DIR}"

cat > "${RUNTIME_DIR}/portal.json" <<EOF
{"service":"portal","alias":"${PORTAL_ALIAS}","syncedAt":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","mode":"sandbox"}
EOF

cat > "${RUNTIME_DIR}/admin.json" <<EOF
{"service":"admin","alias":"${ADMIN_ALIAS}","syncedAt":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","mode":"sandbox"}
EOF

printf 'Cloudflare dev alias runtime refreshed in %s\n' "${RUNTIME_DIR}"
