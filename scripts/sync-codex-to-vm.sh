#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${1:-vm2}"
REMOTE_ROOT="${2:-~/leggau}"

cd "${PROJECT_ROOT}"

ssh -o BatchMode=yes -o ConnectTimeout=8 "${REMOTE}" "mkdir -p ${REMOTE_ROOT}/.codex ${REMOTE_ROOT}/docs ${REMOTE_ROOT}/scripts"

rsync -az \
  "${PROJECT_ROOT}/AGENTS.md" \
  "${PROJECT_ROOT}/.codex/" \
  "${PROJECT_ROOT}/docs/" \
  "${PROJECT_ROOT}/scripts/" \
  "${REMOTE}:${REMOTE_ROOT}/"

echo "Synced Codex memory and operational docs to ${REMOTE}:${REMOTE_ROOT}"
