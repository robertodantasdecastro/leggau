# Project Memory

## Product

- Name: `Leggau`
- Mascot: `Gau`
- Concept: gamified daily-living activities for children with points and rewards

## Repository

- Root: `/Volumes/SSDExterno/Desenvolvimento/Leggau`
- Large-file root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data`
- Remote: `git@github.com:robertodantasdecastro/leggau.git`
- Published environment branches:
  - `backend`
  - `frontend-android`
  - `frontend-ios`
- Main work areas:
  - `backend/`
  - `mobile/`
  - `infra/`
  - `docs/`
  - `scripts/`
  - `.codex/agents/`

## Agent Architecture

- Mac coordinator is the primary orchestration role for this repository.
- Specialized local agent contracts live in `.codex/agents/`.
- VM backend execution is owned by the `vm-backend` contract and must run on `vm2` under `~/leggau`.
- Production agent remains planned for EC2 and should mirror VM backend patterns once production is provisioned.

## Development Focus

- Backend local remains a fallback; official dev backend target is `vm2` at `10.211.55.22`
- Backend infrastructure and services must live on the VM, not on the MacBook
- Unity mobile frontend is moving from code-first bootstrap to first imported scene and Gau asset delivery
- Remote VM development is blocked by SSH authentication
- Heavy local files must stay on the external SSD, not on the internal disk
- Unity Hub templates and downloads are now redirected to the SSD-backed project tree
- The current delivery already includes the first Gau `.blend` and `.fbx`

## Delivery Workflow

- After each completed step:
  - refresh recursive memory in `.codex/` and `AGENTS.md` when needed
  - keep status docs current
  - create a Git commit for the finished step
  - keep branch pushes synchronized for `main`, `backend`, `frontend-android` and `frontend-ios` when the delivery changes shared state
