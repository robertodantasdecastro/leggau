#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.data/runtime/cloudflare"
TOOLING_DIR="${ROOT_DIR}/.data/tooling/cloudflared"
AUTOSTART="${LEGGAU_CLOUDFLARE_AUTOSTART:-0}"
ORIGIN_URL="${LEGGAU_CLOUDFLARE_ORIGIN_URL:-http://127.0.0.1:${NGINX_HTTP_PORT:-8080}}"
MODE="sandbox"

mkdir -p "${RUNTIME_DIR}" "${TOOLING_DIR}"

ensure_cloudflared() {
  local binary="${TOOLING_DIR}/cloudflared"
  local artifact=""

  if [[ -x "${binary}" ]]; then
    printf '%s\n' "${binary}"
    return 0
  fi

  if [[ "$(uname -s)" != "Linux" ]]; then
    return 1
  fi

  case "$(uname -m)" in
    x86_64|amd64)
      artifact="cloudflared-linux-amd64"
      ;;
    aarch64|arm64)
      artifact="cloudflared-linux-arm64"
      ;;
    *)
      return 1
      ;;
  esac

  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/${artifact}" \
    -o "${binary}"
  chmod +x "${binary}"
  printf '%s\n' "${binary}"
}

start_or_reuse_tunnel() {
  local binary="${1}"
  local origin="${2}"
  local pid_file="${RUNTIME_DIR}/tunnel.pid"
  local log_file="${RUNTIME_DIR}/tunnel.log"
  local alias_file="${RUNTIME_DIR}/base-url.txt"

  if [[ -f "${pid_file}" ]]; then
    local existing_pid
    existing_pid="$(cat "${pid_file}")"
    if kill -0 "${existing_pid}" >/dev/null 2>&1 && [[ -f "${alias_file}" ]]; then
      cat "${alias_file}"
      return 0
    fi
  fi

  rm -f "${pid_file}" "${log_file}" "${alias_file}"
  nohup "${binary}" tunnel --no-autoupdate --url "${origin}" >"${log_file}" 2>&1 &
  local tunnel_pid=$!
  printf '%s\n' "${tunnel_pid}" >"${pid_file}"

  for _ in $(seq 1 60); do
    local alias
    alias="$(grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' "${log_file}" | head -n 1 || true)"
    if [[ -n "${alias}" ]]; then
      printf '%s\n' "${alias}" >"${alias_file}"
      printf '%s\n' "${alias}"
      return 0
    fi

    if ! kill -0 "${tunnel_pid}" >/dev/null 2>&1; then
      break
    fi

    sleep 1
  done

  return 1
}

upsert_env_value() {
  local key="${1}"
  local value="${2}"
  local env_file="${ROOT_DIR}/.env"

  [[ -f "${env_file}" ]] || return 0

  if grep -q "^${key}=" "${env_file}"; then
    perl -0pi -e "s#^${key}=.*#${key}=${value}#m" "${env_file}"
  else
    printf '\n%s=%s\n' "${key}" "${value}" >>"${env_file}"
  fi
}

PORTAL_ALIAS="${DEV_PORTAL_ALIAS_URL:-https://portal-dev.trycloudflare.com}"
ADMIN_ALIAS="${DEV_ADMIN_ALIAS_URL:-https://admin-dev.trycloudflare.com}"
API_ALIAS="${DEV_API_ALIAS_URL:-https://api-dev.trycloudflare.com}"

if [[ "${AUTOSTART}" == "1" ]]; then
  if binary_path="$(ensure_cloudflared)" && host_alias="$(start_or_reuse_tunnel "${binary_path}" "${ORIGIN_URL}")"; then
    host_alias="${host_alias%/}"
    PORTAL_ALIAS="${host_alias}"
    ADMIN_ALIAS="${host_alias}/admin"
    API_ALIAS="${host_alias}/api"
    MODE="live"
  fi
fi

upsert_env_value "DEV_PORTAL_ALIAS_URL" "${PORTAL_ALIAS}"
upsert_env_value "DEV_ADMIN_ALIAS_URL" "${ADMIN_ALIAS}"
upsert_env_value "DEV_API_ALIAS_URL" "${API_ALIAS}"

cat > "${RUNTIME_DIR}/portal.json" <<EOF
{"service":"portal","alias":"${PORTAL_ALIAS}","syncedAt":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","mode":"${MODE}"}
EOF

cat > "${RUNTIME_DIR}/admin.json" <<EOF
{"service":"admin","alias":"${ADMIN_ALIAS}","syncedAt":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","mode":"${MODE}"}
EOF

cat > "${RUNTIME_DIR}/api.json" <<EOF
{"service":"api","alias":"${API_ALIAS}","syncedAt":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","mode":"${MODE}"}
EOF

printf 'Cloudflare dev alias runtime refreshed in %s\n' "${RUNTIME_DIR}"
printf ' portal=%s\n admin=%s\n api=%s\n' "${PORTAL_ALIAS}" "${ADMIN_ALIAS}" "${API_ALIAS}"
