#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY_HUB_ROOT="${HOME}/Library/Application Support/UnityHub"
UNITY_TEMPLATES_LINK="${UNITY_HUB_ROOT}/Templates"
UNITY_TEMPLATES_TARGET="${PROJECT_ROOT}/.data/tooling/unityhub/Templates"
UNITY_DOWNLOADS_ROOT="${PROJECT_ROOT}/.data/tooling/unityhub/downloads"

cd "${PROJECT_ROOT}"

echo "Cleaning project temp files in ${PROJECT_ROOT}"
find mobile/Assets/Art/Characters/Gau -type f -name '._*' -delete 2>/dev/null || true
for scan_root in backend mobile docs scripts .codex infra; do
  if [ -d "${scan_root}" ]; then
    find "${scan_root}" -type f \( -name '.DS_Store' -o -name '*.blend1' -o -name '*.blend2' \) -delete 2>/dev/null || true
  fi
done
find .data/tools -type d -name '__pycache__' -prune -exec rm -rf {} + 2>/dev/null || true

mkdir -p "${PROJECT_ROOT}/.data/tooling/unityhub"
mkdir -p "${UNITY_DOWNLOADS_ROOT}"

if [ -d "${UNITY_TEMPLATES_LINK}" ] && [ ! -L "${UNITY_TEMPLATES_LINK}" ]; then
  rm -rf "${UNITY_TEMPLATES_TARGET}"
  mv "${UNITY_TEMPLATES_LINK}" "${UNITY_TEMPLATES_TARGET}"
  ln -s "${UNITY_TEMPLATES_TARGET}" "${UNITY_TEMPLATES_LINK}"
  echo "Moved Unity Hub Templates to SSD"
fi

if [ -L "${HOME}/Library/Application Support/UnityHub/downloads" ]; then
  find "${UNITY_DOWNLOADS_ROOT}" -mindepth 1 -maxdepth 1 -print -exec rm -rf {} +
  echo "Cleared Unity Hub cached downloads from SSD mirror"
fi

echo
echo "Post-clean summary:"
echo "gau_appledouble_files=$(find mobile/Assets/Art/Characters/Gau -type f -name '._*' | wc -l | tr -d ' ')"
ds_count=0
blend_count=0
for scan_root in backend mobile docs scripts .codex infra; do
  if [ -d "${scan_root}" ]; then
    ds_count=$((ds_count + $(find "${scan_root}" -type f -name '.DS_Store' | wc -l | tr -d ' ')))
    blend_count=$((blend_count + $(find "${scan_root}" -type f \( -name '*.blend1' -o -name '*.blend2' \) | wc -l | tr -d ' ')))
  fi
done
echo "ds_store_files=${ds_count}"
echo "blend_backup_files=${blend_count}"
if [ -d ".data/tools" ]; then
  echo "pycache_dirs=$(find .data/tools -type d -name '__pycache__' | wc -l | tr -d ' ')"
else
  echo "pycache_dirs=0"
fi
