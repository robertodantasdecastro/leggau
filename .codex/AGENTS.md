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
- Require memory refresh and Git commit at the end of each completed delivery

## Files

- `rules/leggau.rules`: stable project rules and defaults
- `memory/project.md`: product and repository context
- `memory/infra.md`: backend, Docker and remote environment context
- `memory/mobile.md`: Unity/mobile context and next implementation targets
