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

- Official dev backend target is `vm2` at `10.211.55.22`
- Backend infrastructure and services must live on the VM, not on the MacBook
- Unity mobile frontend is moving from code-first bootstrap to first imported scene and Gau asset delivery
- Portal institucional and web admin now exist as repository surfaces and must be treated as first-class parts of the MVP
- Billing enters in sandbox mode only during this phase
- Portal and admin Next.js builds have already passed locally
- Remote VM development is now operational through SSH on `vm2`
- Heavy local files must stay on the external SSD, not on the internal disk
- Unity Hub templates and downloads are now redirected to the SSD-backed project tree
- The canonical validated Unity editor is now `6000.4.0f1` on the SSD-backed install tree
- The Leggau Unity project now opens successfully in the graphical editor
- The first bootstrap scene now builds successfully through `./scripts/build-unity-bootstrap.sh`
- Unity project setup and validation are now reproducible through `./scripts/configure-unity-project.sh`
- The mobile bootstrap now covers first-access auth, legal consent and initial child creation against the backend
- Unity bootstrap runtime validation now uses a persisted probe file under `.data/runtime/unity/bootstrap-playmode-status.json`
- The latest validated bootstrap runtime reached `ready` against the VM-backed API with dashboard data loaded
- The bootstrap scene now includes an in-editor retry path and a more structured HUD for faster Play Mode iteration after interruptions or environment restarts
- The bootstrap HUD now tracks the onboarding pipeline step-by-step so auth/legal/family progress is visible during Play Mode
- The bootstrap presentation now also includes a persistent onboarding panel and a first-home panel, so the MVP no longer depends on a purely technical HUD for the main mobile flow
- The onboarding flow is now explicit and action-driven:
  - responsible auth submit
  - legal confirmation submit
  - child creation/reuse submit
  - enter-home submit
  - fast dev path for validation without silent auto-run on scene start
- The bootstrap scene now has interactive fields for responsible credentials, legal confirmation and child naming
- The Unity editor driver now supports a development-flow validation pass that reuses the real VM backend while preserving the manual UX in normal Play Mode
- As of `2026-03-26`, mobile development should no longer depend on a local backend fallback; VM remains the only canonical backend target
- Unity mobile build modules are now present in the validated editor install through the editor-root `PlaybackEngines/` layout
- A second SSD-backed shell for `6000.0.71f1` exists, but it currently fails signature validation and should not be used until it is reinstalled cleanly
- Full Xcode is now installed and selected through `/Applications/Xcode.app`
- The current delivery already includes the first Gau `.blend` and `.fbx`
- VM promotion is now validated through `./scripts/promote-stack-to-vm.sh`
- Phase 0 operational unlock is now complete:
  - VM backend is running on `vm2`
  - canonical Unity editor has Android/iOS support
  - graphical bootstrap sign-off reached `state=ready` against the VM runtime
- After the machine reboot later on `2026-03-26`, `vm2` had to be started again from `~/leggau`, and the refreshed batch validation still reached:
  - `state=ready`
  - `parentName=Responsavel Demo`
  - `childName=Gau`
  - `activeGauVariant=gau-rounded-pixel`
  - `activityCount=3`
  - `rewardCount=2`

## Delivery Workflow

- After each completed step:
  - refresh recursive memory in `.codex/` and `AGENTS.md` when needed
  - keep status docs current
  - keep `docs/mvp-timeline.md` aligned with the current checkpoint
  - create a Git commit for the finished step
  - keep branch pushes synchronized for `main`, `backend`, `frontend-android` and `frontend-ios` when the delivery changes shared state
