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
