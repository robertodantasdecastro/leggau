#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY_HUB_APP="/Applications/Unity Hub.app"
BLENDER_APP="/Applications/Blender.app"
UNITY_EDITOR_ROOT="/Applications/Unity/Hub/Editor"

check_cmd() {
  local label="$1"
  local command_name="$2"
  if command -v "$command_name" >/dev/null 2>&1; then
    printf "[ok] %s: %s\n" "$label" "$(command -v "$command_name")"
  else
    printf "[missing] %s\n" "$label"
  fi
}

printf "Leggau mobile toolchain check\n"
printf "Project root: %s\n\n" "$ROOT_DIR"

if [[ -d "$UNITY_HUB_APP" ]]; then
  printf "[ok] Unity Hub: %s\n" "$UNITY_HUB_APP"
else
  printf "[missing] Unity Hub\n"
fi

if [[ -d "$UNITY_EDITOR_ROOT" ]]; then
  printf "[ok] Unity editors:\n"
  find "$UNITY_EDITOR_ROOT" -maxdepth 2 -name Unity.app -print | sort | sed 's/^/  - /'
else
  printf "[missing] Unity editor root\n"
fi

if [[ -d "$BLENDER_APP" ]]; then
  printf "[ok] Blender: %s\n" "$("$BLENDER_APP/Contents/MacOS/Blender" --version | head -n 1)"
else
  printf "[missing] Blender\n"
fi

check_cmd "Java" java
check_cmd "adb" adb
check_cmd "xcodes" xcodes

if xcodebuild -version >/dev/null 2>&1; then
  printf "[ok] Xcode build tools: %s\n" "$(xcodebuild -version | paste -sd ' ' -)"
else
  printf "[missing] Xcode build tools\n"
fi
