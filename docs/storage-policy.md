# Storage Policy

## Goal

Keep all heavy Leggau project files on the external SSD at:

- `/Volumes/SSDExterno/Desenvolvimento/Leggau`

## Canonical Local Storage Root

- Runtime and generated large files: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data`

## Current SSD-backed Paths

- Postgres data: `./.data/docker/postgres`
- Redis data: `./.data/docker/redis`
- Uploads: `./.data/uploads`
- Backups: `./.data/backups`
- Mobile builds: `./.data/mobile/builds`
- Unity cache: `./.data/mobile/cache`
- Blender and art exports: `./.data/art/blender`

## Rules

- Do not place large generated project files on the internal disk when there is a project-local SSD path available.
- Prefer bind mounts and project-local directories over opaque tool-managed storage.
- Keep secrets out of this policy document.

## Notes

- Tool installations such as Unity Hub, Unity Editor and Xcode may still live under system paths unless they are explicitly relocated later.
- The project runtime data itself should remain SSD-backed through the repository-local `.data/` structure.
