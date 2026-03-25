# Agent Sync

This document defines how Leggau agents exchange state without duplicating source of truth.

## Sync Cadence

- Update project memory after every completed delivery.
- Refresh status docs before handoff.
- Create a git commit for each finished delivery.
- Push the environment branches after shared-state deliveries.

## Source of Truth

- Code lives in the repository.
- Memory lives in `.codex/` and `AGENTS.md`.
- Execution state lives on the active environment:
  - Mac for coordination, Unity and Blender
  - `vm2` for backend runtime
  - EC2 later for production

## Handoff Flow

1. Mac coordinator scopes the task.
2. Specialized agent performs the work.
3. Relevant docs and memory are updated inside the repository.
4. Coordinator verifies the output and logs status.
5. VM-facing memory is synchronized with `./scripts/sync-codex-to-vm.sh` when SSH is available.
6. Changes are committed and published on the correct branch.

## Branch Routing

- `backend` branch: backend and VM infrastructure changes
- `frontend-android` branch: Android frontend work
- `frontend-ios` branch: iOS frontend work
- `main` branch: synchronized project state and memory

## Handoff Checklist

- Verify no real secrets are added.
- Verify large files remain under the SSD-backed project root.
- Verify the remote API target is correct for the current environment.
- Verify the correct branch receives the commit.
- Verify recursive memory is updated before the push.
- Run `./scripts/report-environment-status.sh` to refresh the coordinator view.
- Run `./scripts/cleanup-dev-storage.sh` when reclaiming local space or before large Unity installs.
