# Project Memory

## Product

- Name: `Leggau`
- Mascot: `Gau`
- Concept: gamified daily-living activities for children with points and rewards

## Repository

- Root: `/Volumes/SSDExterno/Desenvolvimento/Leggau`
- Large-file root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data`
- Remote: `git@github.com:robertodantasdecastro/leggau.git`
- Main work areas:
  - `backend/`
  - `mobile/`
  - `infra/`
  - `docs/`
  - `scripts/`

## Development Focus

- Backend local remains a fallback; official dev backend target is `vm2` at `10.211.55.22`
- Unity mobile frontend is moving from code-first bootstrap to first imported scene and Gau asset delivery
- Remote VM development is blocked by SSH authentication
- Heavy local files must stay on the external SSD, not on the internal disk
- The current delivery already includes the first Gau `.blend` and `.fbx`

## Delivery Workflow

- After each completed step:
  - refresh recursive memory in `.codex/` and `AGENTS.md` when needed
  - keep status docs current
  - create a Git commit for the finished step
