#!/usr/bin/env bash
set -euo pipefail

echo "[leggau] docker compose status"
docker compose ps

echo
echo "[leggau] gateway"
curl -s http://localhost:8080/

echo
echo "[leggau] health"
curl -s http://localhost:8080/api/health

echo
echo "[leggau] activities"
curl -s http://localhost:8080/api/activities
