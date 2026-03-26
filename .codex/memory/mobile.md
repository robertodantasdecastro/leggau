# Mobile Memory

## Stack

- Engine: `Unity`
- Targets: `Android`, `iOS`
- Current API base for development: `http://10.211.55.22:8080/api`
- Backend for mobile development must stay on `vm2`; no local API fallback is canonical now
- Heavy mobile artifacts must stay under `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/mobile`

## Current Mac Status

- Docker: ready
- Java 17: installed
- `adb`: installed
- Unity Hub: installed
- Unity editor is detected on SSD at `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unity/editors/6000.4.0f1/Unity.app`
- The Leggau project was opened successfully in the graphical editor on `2026-03-25`
- Unity generated first local project state such as `packages-lock.json` and `ProjectSettings/*.asset`
- Unity now also generated the first scene asset and Unity metadata layer:
  - `mobile/Assets/Scenes/Bootstrap/Bootstrap.unity`
  - `mobile/Assets/**/*.meta`
- Unity project configuration is now reproducible through `scripts/configure-unity-project.sh`
- Unity environment validation now writes `docs/unity-environment-status.md`
- Headless bootstrap generation now succeeds after the first graphical import, so the stable sequence is:
  - open the project in the graphical editor first
  - let the first import finish
  - retry `scripts/build-unity-bootstrap.sh`
- The SSD-backed `6000.0.71f1` editor shell currently fails macOS signature validation and should not be used yet
- Unity Hub templates are symlinked to `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unityhub/Templates`
- Blender `4.5.1 LTS`: installed
- `xcodebuild` now resolves through `/Applications/Xcode.app/Contents/Developer`
- Full Xcode app installation is complete
- `/Applications/Xcode.app` is present and selected
- The canonical editor `6000.4.0f1` now has:
  - `PlaybackEngines/AndroidPlayer`
  - `PlaybackEngines/iOSSupport`

## Current Frontend Goal

- keep Unity as the primary surface for `child` and `adolescent`
- evolve the current bootstrap into actor-aware child/adolescent shells
- preserve the VM API as the only canonical backend target
- preserve compatibility with the new Phase B multiactor backend core while adult surfaces catch up
- leave adult experiences to responsive web/PWA surfaces in the next platform wave
- follow the frozen Phase A contracts and policy boundaries while the backend multiactor core is implemented

## Immediate Next UI Targets

1. Child shell and adolescent shell split
2. Age-profile presentation system
3. Policy-aware interaction gates
4. More interactive first-home experience
5. Check-in and reward refresh
6. Keep compatibility with `guardian_links`, `policy_versions` and persistent sessions while Phase C starts on web

## Current Recommended Next Step

- Use the generated bootstrap scene as the base for the first real mobile flow and runtime validation inside the editor.
- Keep builds, exported assets and Unity cache pointed to SSD-backed directories inside the repository.
- Gau asset source now exists at `mobile/Assets/Art/Characters/Gau/Source/Gau.blend`
- Gau Unity export now exists at `mobile/Assets/Art/Characters/Gau/Exports/Gau.fbx`
- Gau source file was opened successfully in Blender on `2026-03-24`
- Gau visual was refined and revalidated from a generated preview at `mobile/Assets/Art/Characters/Gau/Exports/Gau-preview.png`
- Gau now also has a pixel-art copy at `mobile/Assets/Art/Characters/Gau/PixelArt/Gau-pixel-art.png`
- Gau now also has a 3D pixel-textured copy at `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-textured.blend`
- The pixel-textured copy exports to `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-textured.fbx`
- The pixel-textured texture atlas lives at `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-texture.png`
- The pixel-textured preview was rendered and visually validated at `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-textured-preview.png`
- Gau now also has a Roblox-style blocky pixel variant at `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel.blend`
- The Roblox-style variant exports to `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel.fbx`
- The Roblox-style pixel atlas lives at `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel-texture.png`
- The Roblox-style preview was rendered, visually validated and reopened in Blender at `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel-preview.png`
- The Roblox-style variant was repixelated with a stronger low-resolution atlas on `2026-03-24` to make the block pixels read more clearly on the model
- Gau now also has a rounded-pixel variant at `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel.blend`
- The rounded-pixel variant exports to `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel.fbx`
- The rounded-pixel atlas lives at `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel-texture.png`
- The rounded-pixel preview was rendered, visually validated and reopened in Blender at `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel-preview.png`
- The rounded-pixel variant was refined on `2026-03-24` with more rounded bevels and a denser pixel atlas for higher visible detail
- The rounded-pixel variant now includes a greeting animation exported in the FBX as `GauRoundedPixel_Greeting`
- A dedicated greeting still preview now exists at `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel-greeting-preview.png`
- Gau now also has a mario-pixel variant at `mobile/Assets/Art/Characters/Gau/MarioPixel/Gau-mario-pixel.blend`
- The mario-pixel variant exports to `mobile/Assets/Art/Characters/Gau/MarioPixel/Gau-mario-pixel.fbx`
- The mario-pixel atlas lives at `mobile/Assets/Art/Characters/Gau/MarioPixel/Gau-mario-pixel-texture.png`
- The mario-pixel preview was rendered, visually validated and reopened in Blender at `mobile/Assets/Art/Characters/Gau/MarioPixel/Gau-mario-pixel-preview.png`
- The mario-pixel variant uses a denser retro atlas so each body part carries more visible pixel information
- The mobile app now has a local Gau variants catalog in `mobile/Assets/StreamingAssets/config/gau-variants.json`
- The bootstrap now loads the local Gau variants catalog through `GauVariantsCatalogLoader`
- The bootstrap now tries `auth/register`, falls back to `auth/login` for existing accounts, records legal consents, and only then falls back to `auth/dev-login` when configured
- The bootstrap now auto-creates the first child profile through `POST /api/children` when a newly authenticated family still has no child
- The real-auth bootstrap path is now validated against `vm2` for first access: parent register -> consent -> child create -> family overview
- Unity Play Mode runtime now persists status snapshots through `BootstrapRuntimeProbe` at `.data/runtime/unity/bootstrap-playmode-status.json`
- The latest validated probe reached `ready` with:
  - `parentName=Responsavel Demo`
  - `childName=Gau`
  - `activeGauVariant=gau-rounded-pixel`
  - `activityCount=3`
  - `rewardCount=2`
- On `2026-03-26`, a batch Play Mode validation was rerun against the VM-backed API and wrote a fresh `state=ready` probe snapshot under `.data/runtime/unity/bootstrap-playmode-status.json`
- The dashboard now renders the count and style tags of the local Gau variants
- The bootstrap now supports selecting the active Gau variant with previous/next actions
- The dashboard now shows the active Gau variant name, style and recommendation
- The bootstrap scene builder now adds UI buttons for cycling between Gau variants
- The bootstrap now includes `GauVariantPreviewPresenter` to swap the mascot model instance when the active variant changes
- The bootstrap now also includes `UnityRuntimeDriver` to automate scene-open + Play Mode validation when the editor lock allows it
- The bootstrap now exposes `RetryBootstrap` so the full auth/legal/family bootstrap can be rerun during Play Mode without reopening the scene
- The generated HUD now uses card-style sections and a dedicated mascot/actions panel to make Unity iteration easier after editor or SSD interruptions
- The HUD now also shows a live bootstrap checklist for `Auth`, `Legal`, `Familia`, `Crianca`, `Atividades`, `Recompensas` and `Progresso`
- The bootstrap presentation now splits into:
  - an onboarding panel for auth, legal, child setup and home entry
  - a first-home panel for responsible, child, points, progress, activities and rewards
  - a side panel for Gau preview, variant switching, retry and dev check-in
- The onboarding is now driven by explicit scene actions instead of silent `Start()` automation
- The bootstrap scene now exposes:
  - responsible email, name and password fields
  - legal confirmation toggle
  - child naming field
  - per-step action buttons
  - a fast dev action for controlled validation against the VM backend
- The bootstrap now also persists a local session snapshot so the app can:
  - resume the pending onboarding step after reopening
  - return directly to the saved home when onboarding is already complete
  - preserve the active Gau variant between launches
- The child step now also shows whether the app will reuse an existing child profile or create a new one from the typed name
- The side panel now summarizes the next recommended action in the journey instead of showing only technical catalog information
- The side panel now also exposes a dedicated local reset action for clearing the saved onboarding/home journey
- Home cards now summarize only the most relevant daily activity, reward and progress signals
- The regenerated bootstrap scene still validates in batch against `vm2`, and the latest probe on `2026-03-26` again reached `state=ready`
- After the machine reboot on `2026-03-26`, the VM stack had to be restarted and a fresh batch validation still reached:
  - `state=ready`
  - `status=Dashboard carregado.`
  - `parentName=Responsavel Demo`
  - `childName=Gau`
  - `activeGauVariant=gau-rounded-pixel`
  - `activityCount=3`
  - `rewardCount=2`
- A graphical editor validation using `Leggau > Run Bootstrap Play Mode` was completed on `2026-03-26`
- That graphical validation reached `state=ready` against the VM-backed API with:
  - `parentName=Responsavel Demo`
  - `childName=Gau`
  - `activeGauVariant=gau-rounded-pixel`
  - `activityCount=3`
  - `rewardCount=2`
- After the persistence/resume cut later on `2026-03-26`, a new batch validation still reached:
  - `state=ready`
  - `status=Dashboard carregado.`
  - `parentName=Responsavel Demo`
  - `childName=Gau`
  - `activeGauVariant=gau-rounded-pixel`
  - `activityCount=3`
  - `rewardCount=2`
- After the child/home UX refinement later on `2026-03-26`, another batch validation still reached:
  - `state=ready`
  - `status=Dashboard carregado.`
  - `parentName=Responsavel Demo`
  - `childName=Gau`
  - `activeGauVariant=gau-rounded-pixel`
  - `activityCount=3`
  - `rewardCount=2`
- After the local-recovery/compact-home refinement later on `2026-03-26`, another batch validation still reached:
  - `state=ready`
  - `status=Dashboard carregado.`
  - `parentName=Responsavel Demo`
  - `childName=Gau`
  - `activeGauVariant=gau-rounded-pixel`
  - `activityCount=3`
  - `rewardCount=2`
- With Phase A completed, the mobile side should wait for Phase B shared contracts before introducing deeper actor-specific runtime changes beyond the current child seed flow
- With Phase B now completed in runtime, the mobile side can safely keep consuming:
  - `families/overview` backed by `guardian_links`
  - legal documents projected from `policy_versions`
  - persistent opaque sessions compatible with resume/retry behavior
  - adolescent provisioning returned through the legacy-compatible `children` projection
- The Unity workspace had to be reopened on `2026-03-26` through the canonical `-projectPath` flow after a temporary nested project folder appeared under `mobile/`; that stray folder was removed
- Local validation script: `scripts/check-gau-runtime-catalog.sh`
- Unity Hub diagnosis on `2026-03-25` found the root cause of the failed editor install: not enough disk space for the default `/Applications` destination
- `~/Library/Application Support/UnityHub/secondaryInstallPath.json` now points to `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unity/editors`
- `~/Library/Application Support/UnityHub/downloads` is now symlinked to `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unityhub/downloads`
- `~/Library/Application Support/UnityHub/Templates` is now symlinked to `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unityhub/Templates`
- `scripts/build-unity-bootstrap.sh` now prefers the SSD-backed editor before any `/Applications` shell
- Unity's SSD-backed PackageManager tree had to be cleaned of `._*` files on `2026-03-25` because they were breaking package resolution in batchmode
