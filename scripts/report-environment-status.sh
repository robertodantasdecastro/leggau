#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY_HUB_ROOT="${HOME}/Library/Application Support/UnityHub"
UNITY_TEMPLATES_LINK="${UNITY_HUB_ROOT}/Templates"
UNITY_EDITOR_ROOT="${PROJECT_ROOT}/.data/tooling/unity/editors"
REMOTE_HOST="vm2"

cd "${PROJECT_ROOT}"

echo "Leggau environment report"
echo "date=$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "project_root=${PROJECT_ROOT}"
echo "branch=$(git branch --show-current)"
echo "head=$(git rev-parse --short HEAD)"

if [ -x "/Applications/Blender.app/Contents/MacOS/Blender" ]; then
  echo "blender=$(/Applications/Blender.app/Contents/MacOS/Blender --version 2>/dev/null | head -n 1)"
elif command -v blender >/dev/null 2>&1; then
  echo "blender=$(blender --version 2>/dev/null | head -n 1)"
else
  echo "blender=missing"
fi

if [ -d "${UNITY_EDITOR_ROOT}" ]; then
  editors="$(find "${UNITY_EDITOR_ROOT}" -maxdepth 2 -name 'Unity.app' | tr '\n' ',' | sed 's/,$//')"
  if [ -n "${editors}" ]; then
    echo "unity_editors_on_ssd=${editors}"
  else
    echo "unity_editors_on_ssd=none_detected"
  fi
else
  echo "unity_editors_on_ssd=missing"
fi

if [ -L "${UNITY_TEMPLATES_LINK}" ]; then
  echo "unity_hub_templates_link=$(readlink "${UNITY_TEMPLATES_LINK}")"
else
  echo "unity_hub_templates_link=not_symlinked"
fi

if command -v xcodebuild >/dev/null 2>&1; then
  xcode_output="$(xcodebuild -version 2>&1 || true)"
  if printf '%s' "${xcode_output}" | grep -q "requires Xcode"; then
    echo "xcode=command_line_tools_only"
  else
    echo "xcode=$(printf '%s' "${xcode_output}" | paste -sd ' | ' -)"
  fi
else
  echo "xcode=missing"
fi

if command -v adb >/dev/null 2>&1; then
  echo "adb=installed"
else
  echo "adb=missing"
fi

if command -v java >/dev/null 2>&1; then
  echo "java=$(java -version 2>&1 | head -n 1)"
else
  echo "java=missing"
fi

if ssh -o BatchMode=yes -o ConnectTimeout=5 "${REMOTE_HOST}" 'hostname >/dev/null' 2>/dev/null; then
  echo "vm2_ssh=ok"
else
  echo "vm2_ssh=blocked"
fi
