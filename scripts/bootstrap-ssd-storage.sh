#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

declare -a DIRECTORIES=(
  "$ROOT_DIR/.data/docker/postgres"
  "$ROOT_DIR/.data/docker/redis"
  "$ROOT_DIR/.data/runtime"
  "$ROOT_DIR/.data/runtime/cloudflare"
  "$ROOT_DIR/.data/uploads"
  "$ROOT_DIR/.data/backups"
  "$ROOT_DIR/.data/mobile/builds"
  "$ROOT_DIR/.data/mobile/cache"
  "$ROOT_DIR/.data/art/blender"
)

for directory in "${DIRECTORIES[@]}"; do
  mkdir -p "$directory"
  printf "ready %s\n" "$directory"
done

printf "\nSSD storage bootstrap complete under %s/.data\n" "$ROOT_DIR"
