#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY_HUB_APP="/Applications/Unity Hub.app"
BLENDER_APP="/Applications/Blender.app"
UNITY_EDITOR_ROOTS=(
  "/Applications/Unity/Hub/Editor"
  "${ROOT_DIR}/.data/tooling/unity/editors"
)

print_unity_modules() {
  local editor_app="$1"
  local editor_label="$2"
  local playback_root="${editor_app}/Contents/PlaybackEngines"
  local binary_path="${editor_app}/Contents/MacOS/Unity"
  local android_status="missing"
  local ios_status="missing"
  local runtime_status="incomplete"

  if [[ -x "${binary_path}" ]]; then
    runtime_status="runnable"
  fi

  if [[ -d "${playback_root}/AndroidPlayer" ]]; then
    android_status="installed"
  fi

  if [[ -d "${playback_root}/iOSSupport" ]]; then
    ios_status="installed"
  fi

  printf "  - %s\n" "${editor_label}"
  printf "    runtime=%s\n" "${runtime_status}"
  printf "    android_build_support=%s\n" "${android_status}"
  printf "    ios_build_support=%s\n" "${ios_status}"
}

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

unity_editor_found=false
for unity_root in "${UNITY_EDITOR_ROOTS[@]}"; do
  if [[ -d "${unity_root}" ]]; then
    while IFS= read -r unity_app; do
      if [[ -n "${unity_app}" ]]; then
        if [[ "${unity_editor_found}" == false ]]; then
          printf "[ok] Unity editors:\n"
          unity_editor_found=true
        fi
        print_unity_modules "${unity_app}" "${unity_app}"
      fi
    done < <(find "${unity_root}" -maxdepth 2 -name Unity.app -print | sort)
  fi
done

if [[ "${unity_editor_found}" == false ]]; then
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

xcodes_installed_output=""
if command -v xcodes >/dev/null 2>&1; then
  xcodes_installed_output="$(xcodes installed || true)"
fi

if xcodebuild -version >/dev/null 2>&1; then
  printf "[ok] Xcode build tools: %s\n" "$(xcodebuild -version | paste -sd ' ' -)"
elif [[ -n "${xcodes_installed_output}" ]]; then
  printf "[partial] Xcode app present but not selected:\n"
  printf "%s\n" "${xcodes_installed_output}" | sed 's/^/  /'
else
  printf "[missing] Xcode build tools\n"
fi
