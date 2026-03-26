# Leggau Codex Local Memory

This directory is the canonical Codex memory for the Leggau repository.

## Priority

1. Repository source code
2. `/Volumes/SSDExterno/Desenvolvimento/Leggau/AGENTS.md`
3. Files in `/Volumes/SSDExterno/Desenvolvimento/Leggau/.codex/memory/`
4. Files in `/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/`

## Purpose

- Keep Leggau-specific memory inside the project
- Avoid dependence on global Codex memory
- Preserve non-sensitive operational context for continuity
- Keep heavy project data rooted in `/Volumes/SSDExterno/Desenvolvimento/Leggau`
- Require memory refresh and Git commit at the end of each completed delivery

## Files

- `rules/leggau.rules`: stable project rules and defaults
- `agents/`: local agent contracts and responsibilities
- `memory/project.md`: product and repository context
- `memory/infra.md`: backend, Docker and remote environment context
- `memory/mobile.md`: Unity/mobile context and next implementation targets
- `memory/`: evolving project continuity for platform, infra and mobile
- `../docs/platform-blueprint.md`: multiactor platform blueprint
- `../docs/actor-matrix.md`: actor roles, permissions and supervision rules
- `../docs/compliance-rulebook.md`: compliance, security and moderation baseline
- `../docs/platform-backlog.md`: executable platform phases and work items
- `docs/art-pipeline.md`: Gau Blender to Unity workflow
