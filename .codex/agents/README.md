# Leggau Agent Registry

This directory defines the local agent architecture for Leggau.

## Canonical Agents

- `mac-coordinator.md`: main orchestration agent on the MacBook
- `frontend-mobile.md`: Unity/mobile implementation agent
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
- Update recursive memory and commit after each completed delivery.
