#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BLENDER_BIN="/Applications/Blender.app/Contents/MacOS/Blender"
ASSET_ROOT="$ROOT_DIR/mobile/Assets/Art/Characters/Gau"
SCRIPT_PATH="$ASSET_ROOT/Source/generate_gau_rounded_pixel_style.py"

if [[ ! -x "$BLENDER_BIN" ]]; then
  echo "Blender executable not found at $BLENDER_BIN"
  exit 1
fi

"$BLENDER_BIN" \
  --background \
  --factory-startup \
  --python "$SCRIPT_PATH" \
  -- "$ASSET_ROOT"

echo "Gau rounded pixel variant generated at $ASSET_ROOT/RoundedPixel"
