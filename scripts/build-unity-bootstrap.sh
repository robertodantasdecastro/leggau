#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$ROOT_DIR/mobile"
LOG_FILE="$PROJECT_DIR/Logs/bootstrap-scene-builder.log"

UNITY_BIN=""
if [[ -x "/Applications/Unity/Hub/Editor/6000.0.71f1/Unity.app/Contents/MacOS/Unity" ]]; then
  UNITY_BIN="/Applications/Unity/Hub/Editor/6000.0.71f1/Unity.app/Contents/MacOS/Unity"
else
  UNITY_BIN="$(find /Applications/Unity/Hub/Editor -type f -path '*/Unity.app/Contents/MacOS/Unity' | sort | tail -n 1)"
fi

if [[ -z "${UNITY_BIN:-}" ]]; then
  echo "Unity editor not found under /Applications/Unity/Hub/Editor"
  exit 1
fi

mkdir -p "$(dirname "$LOG_FILE")"

"$UNITY_BIN" \
  -batchmode \
  -nographics \
  -projectPath "$PROJECT_DIR" \
  -logFile "$LOG_FILE" \
  -executeMethod Leggau.Editor.BootstrapSceneBuilder.BuildAndExit \
  -quit

echo "Bootstrap scene build finished. Log: $LOG_FILE"
