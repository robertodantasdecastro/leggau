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
  - `web/portal/`
  - `web/admin/`
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
- Portal institucional and web admin now exist as repository surfaces and must be treated as first-class parts of the MVP
- Billing enters in sandbox mode only during this phase
- Portal and admin Next.js builds have already passed locally
- Remote VM development is blocked by SSH authentication
- Heavy local files must stay on the external SSD, not on the internal disk
- Unity Hub templates and downloads are now redirected to the SSD-backed project tree
- The canonical validated Unity editor is now `6000.4.0f1` on the SSD-backed install tree
- The Leggau Unity project now opens successfully in the graphical editor
- The first bootstrap scene now builds successfully through `./scripts/build-unity-bootstrap.sh`
- Unity project setup and validation are now reproducible through `./scripts/configure-unity-project.sh`
- Unity mobile build modules are still not present in the validated editor install
- A second SSD-backed shell for `6000.0.71f1` exists, but it currently fails signature validation and should not be used until it is reinstalled cleanly
- Full Xcode is still not installed; `xcodes` is available and is the preferred reproducible path for downloading to the SSD-backed tooling tree
- The current delivery already includes the first Gau `.blend` and `.fbx`
- VM promotion should now prefer `./scripts/promote-stack-to-vm.sh` once SSH access is restored

## Delivery Workflow

- After each completed step:
  - refresh recursive memory in `.codex/` and `AGENTS.md` when needed
  - keep status docs current
  - keep `docs/mvp-timeline.md` aligned with the current checkpoint
  - create a Git commit for the finished step
  - keep branch pushes synchronized for `main`, `backend`, `frontend-android` and `frontend-ios` when the delivery changes shared state
