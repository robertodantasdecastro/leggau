# Leggau Agent Registry

This directory defines the local agent architecture for Leggau.

## Canonical Agents

- `mac-coordinator.md`: main orchestration agent on the MacBook
- `frontend-mobile.md`: Unity/mobile implementation agent
- `adult-web.md`: parent and therapist responsive web/PWA agent
- `safety-compliance.md`: compliance, moderation and security rulebook agent
- `blender-3d.md`: Gau modeling, rigging and pixel-style art agent
- `android-ios.md`: platform compatibility and build-target agent
- `api-integration.md`: frontend/backend contract and synchronization agent
- `web-portal.md`: public portal and distribution surface agent
- `web-admin.md`: technical operations, user management and billing console agent
- `vm-backend.md`: `vm2` backend and infrastructure agent
- `prod-ec2.md`: future production readiness agent

## Operating Rules

- Keep agent memory local to the repository.
- Never store real secrets, passwords, private keys or tokens.
- Treat `/Volumes/SSDExterno/Desenvolvimento/Leggau` as the canonical storage root for all heavy project files.
- Use `~/leggau` only as the remote VM root for backend operations.
- After each completed delivery:
  - update the global development plan and current status docs
  - refresh agent and sub-agent continuity files when responsibilities or phase ordering change
  - synchronize Codex memory to the VM when backend-side context changed
  - commit and push `main`, `backend`, `frontend-android` and `frontend-ios`

## Current Baton

- Phase B is completed and establishes the shared backend core on `vm2`.
- Phase C is now completed:
  - `vm-backend.md` owns the canonical runtime, the corrected VM promotion path and no-cache rebuild recovery
  - `api-integration.md` owns compatibility between Unity, the completed adult portal/admin surfaces and the multiactor namespaces
  - `adult-web.md` owns ongoing polish of the live `parent_guardian` and `therapist` shells plus their PWA behavior
  - `web-portal.md` owns the hosted experience for `/pais`, `/profissionais`, the public narrative routes and the installable shell
  - `web-admin.md` owns the live governance console for provider config, care-team review, audit, incidents, moderation and verification jobs
  - `safety-compliance.md` owns the legal gates, provider-secret handling expectations and OCR/biometric simulation rules that now back both auth and the live adult shells
- Phase D is now completed:
  - `frontend-mobile.md` delivered the responsible-activation flow, linked-minor selector and explicit `child`/`adolescent` shells with age-profile presentation
  - `adult-web.md` and `web-admin.md` remain the maintenance and product-polish companions around the now-completed adult layer
- The next critical-path baton now shifts to Phase E:
  - `frontend-mobile.md` leads the monitored interaction and policy-aware room/presence affordances on Unity
  - `api-integration.md` keeps ownership of the policy/runtime compatibility required by those Unity affordances
  - `adult-web.md` and `web-admin.md` continue as companion tracks for governance and caregiver/professional workflows
