#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$ROOT_DIR/mobile"
LOG_FILE="$PROJECT_DIR/Logs/bootstrap-scene-builder.log"
UNITY_SSD_ROOT="$ROOT_DIR/.data/tooling/unity/editors"
UNITY_BIN=""

if [[ -x "$UNITY_SSD_ROOT/6000.4.0f1/Unity.app/Contents/MacOS/Unity" ]]; then
  UNITY_BIN="$UNITY_SSD_ROOT/6000.4.0f1/Unity.app/Contents/MacOS/Unity"
elif [[ -x "$UNITY_SSD_ROOT/6000.0.71f1/Unity.app/Contents/MacOS/Unity" ]]; then
  UNITY_BIN="$UNITY_SSD_ROOT/6000.0.71f1/Unity.app/Contents/MacOS/Unity"
elif [[ -x "/Applications/Unity/Hub/Editor/6000.0.71f1/Unity.app/Contents/MacOS/Unity" ]]; then
  UNITY_BIN="/Applications/Unity/Hub/Editor/6000.0.71f1/Unity.app/Contents/MacOS/Unity"
fi

if [[ -z "${UNITY_BIN:-}" ]]; then
  echo "Unity editor not found under $UNITY_SSD_ROOT or /Applications/Unity/Hub/Editor"
  exit 1
fi

UNITY_APP_ROOT="$(cd "$(dirname "$UNITY_BIN")/.." && pwd)"
PACKAGE_MANAGER_DIR="$UNITY_APP_ROOT/Contents/Resources/PackageManager"

mkdir -p "$(dirname "$LOG_FILE")"

if [[ -d "$PACKAGE_MANAGER_DIR" ]]; then
  find "$PACKAGE_MANAGER_DIR" -name '._*' -delete 2>/dev/null || true
fi

"$UNITY_BIN" \
  -batchmode \
  -accept-apiupdate \
  -nographics \
  -projectPath "$PROJECT_DIR" \
  -logFile "$LOG_FILE" \
  -executeMethod Leggau.Editor.BootstrapSceneBuilder.BuildAndExit \
  -quit

echo "Bootstrap scene build finished. Log: $LOG_FILE"
