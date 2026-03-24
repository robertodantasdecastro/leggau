#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BLENDER_BIN="/Applications/Blender.app/Contents/MacOS/Blender"
GAU_ROOT="$ROOT_DIR/mobile/Assets/Art/Characters/Gau"
SCRIPT_PATH="$GAU_ROOT/Source/apply_gau_pixel_texture.py"

if [[ ! -x "$BLENDER_BIN" ]]; then
  echo "Blender executable not found at $BLENDER_BIN"
  exit 1
fi

"$BLENDER_BIN" \
  --background \
  --factory-startup \
  --python "$SCRIPT_PATH" \
  -- "$GAU_ROOT"

echo "Gau pixel textured copy generated at $GAU_ROOT/PixelTextured"
