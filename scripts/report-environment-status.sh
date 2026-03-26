#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY_HUB_ROOT="${HOME}/Library/Application Support/UnityHub"
UNITY_TEMPLATES_LINK="${UNITY_HUB_ROOT}/Templates"
UNITY_EDITOR_SSD_ROOT="${PROJECT_ROOT}/.data/tooling/unity/editors"
UNITY_EDITOR_SYSTEM_ROOT="/Applications/Unity/Hub/Editor"
REMOTE_HOST="vm2"
UNITY_EDITOR_PATHS=()

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

if [ -d "${UNITY_EDITOR_SSD_ROOT}" ]; then
  editors="$(find "${UNITY_EDITOR_SSD_ROOT}" -maxdepth 2 -name 'Unity.app' | tr '\n' ',' | sed 's/,$//')"
  if [ -n "${editors}" ]; then
    echo "unity_editors_on_ssd=${editors}"
    while IFS= read -r editor_path; do
      [ -n "${editor_path}" ] && UNITY_EDITOR_PATHS+=("${editor_path}")
    done < <(find "${UNITY_EDITOR_SSD_ROOT}" -maxdepth 2 -name 'Unity.app' -print | sort)
  else
    echo "unity_editors_on_ssd=none_detected"
  fi
else
  echo "unity_editors_on_ssd=missing"
fi

if [ -d "${UNITY_EDITOR_SYSTEM_ROOT}" ]; then
  system_editors="$(find "${UNITY_EDITOR_SYSTEM_ROOT}" -maxdepth 2 -name 'Unity.app' | tr '\n' ',' | sed 's/,$//')"
  if [ -n "${system_editors}" ]; then
    echo "unity_editors_system=${system_editors}"
    while IFS= read -r editor_path; do
      [ -n "${editor_path}" ] && UNITY_EDITOR_PATHS+=("${editor_path}")
    done < <(find "${UNITY_EDITOR_SYSTEM_ROOT}" -maxdepth 2 -name 'Unity.app' -print | sort)
  else
    echo "unity_editors_system=none_detected"
  fi
else
  echo "unity_editors_system=missing"
fi

ios_support_list=()
android_support_list=()
for editor_path in "${UNITY_EDITOR_PATHS[@]}"; do
  editor_root="$(cd "$(dirname "${editor_path}")" && pwd)"
  top_level_playback_root="${editor_root}/PlaybackEngines"
  app_playback_root="${editor_path}/Contents/PlaybackEngines"

  if [ -d "${top_level_playback_root}/iOSSupport" ]; then
    ios_support_list+=("${top_level_playback_root}/iOSSupport")
  elif [ -d "${app_playback_root}/iOSSupport" ]; then
    ios_support_list+=("${app_playback_root}/iOSSupport")
  fi

  if [ -d "${top_level_playback_root}/AndroidPlayer" ]; then
    android_support_list+=("${top_level_playback_root}/AndroidPlayer")
  elif [ -d "${app_playback_root}/AndroidPlayer" ]; then
    android_support_list+=("${app_playback_root}/AndroidPlayer")
  fi
done

if [ "${#ios_support_list[@]}" -gt 0 ]; then
  echo "unity_ios_support=$(printf '%s\n' "${ios_support_list[@]}" | tr '\n' ',' | sed 's/,$//')"
else
  echo "unity_ios_support=missing"
fi

if [ "${#android_support_list[@]}" -gt 0 ]; then
  echo "unity_android_support=$(printf '%s\n' "${android_support_list[@]}" | tr '\n' ',' | sed 's/,$//')"
else
  echo "unity_android_support=missing"
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

if command -v xcodes >/dev/null 2>&1; then
  xcodes_installed="$(xcodes installed | tr '\n' ',' | sed 's/,$//' || true)"
  echo "xcodes_installed=${xcodes_installed:-none}"
else
  echo "xcodes_installed=missing"
fi

if pgrep -if "Unity Hub --headless install" >/dev/null 2>&1; then
  echo "unity_hub_install=running"
else
  echo "unity_hub_install=idle"
fi

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
import json
import pathlib

downloads_file = pathlib.Path.home() / "Library/Application Support/UnityHub/paused-downloads.json"
if not downloads_file.exists():
    print("unity_hub_downloads=missing")
    raise SystemExit

downloads = json.loads(downloads_file.read_text()).get("downloads", [])
if not downloads:
    print("unity_hub_downloads=none")
    raise SystemExit

status_counts = {}
for item in downloads:
    status = item.get("status", "unknown")
    status_counts[status] = status_counts.get(status, 0) + 1

summary = ",".join(f"{key}:{value}" for key, value in sorted(status_counts.items()))
print(f"unity_hub_downloads={len(downloads)}")
print(f"unity_hub_download_status={summary}")
PY
else
  echo "unity_hub_downloads=python_missing"
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
