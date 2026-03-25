#!/usr/bin/env bash
set -euo pipefail

ssh -o BatchMode=yes -o ConnectTimeout=5 vm2 '
set -e
printf "host=%s\n" "$(hostname)"
printf "user=%s\n" "$USER"
printf "pwd=%s\n" "$(pwd)"
printf "app_root_exists=%s\n" "$([ -d "$HOME/leggau" ] && echo yes || echo no)"
if command -v docker >/dev/null 2>&1; then
  printf "docker=%s\n" "$(docker --version)"
else
  printf "docker=missing\n"
fi
if docker compose version >/dev/null 2>&1; then
  printf "docker_compose=%s\n" "$(docker compose version)"
else
  printf "docker_compose=missing\n"
fi
printf "disk_home=%s\n" "$(df -h "$HOME" | tail -n 1 | awk '"'"'{print $4 " free on " $1}'"'"')"
'
echo "fingerprint_expected=SHA256:Q1Z01LuZT82w7xYeXdICxgqqcVGPUKu4Fx6Vz2f6tYo"
