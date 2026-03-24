# Mobile Memory

## Stack

- Engine: `Unity`
- Targets: `Android`, `iOS`
- Current API base for development: `http://localhost:8080/api`
- Heavy mobile artifacts must stay under `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/mobile`

## Current Mac Status

- Docker: ready
- Java 17: installed
- `adb`: installed
- `xcodebuild`: missing
- Unity / Unity Hub: not detected

## Current Frontend Goal

- Bootstrap app environment
- Perform dev login against backend
- Load family overview
- Load activities
- Load rewards and progress
- Present dashboard flow that can evolve into actual game scenes

## Immediate Next UI Targets

1. Boot and environment loading
2. Dev authentication and session state
3. Activities dashboard and progress
4. Check-in action
5. Reward display

## Current Recommended Next Step

- Install Unity LTS with Android and iOS support, then open `mobile/` and connect the existing bootstrap scripts to the first scene.
- Keep builds, exported assets and Unity cache pointed to SSD-backed directories inside the repository.
