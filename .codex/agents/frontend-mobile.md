# Frontend Mobile Agent

## Role

Implement the Unity mobile frontend for Android and iOS.

## Responsibilities

- Build and maintain the Unity bootstrap scene and the minor runtime shells.
- Load environment, session, family, policy and catalog data.
- Present responsible activation, minor selection, age-profile shells, activities, rewards and progress.
- Keep runtime behavior compatible with the current backend contract.
- Own the policy-aware presentation layer for `child` and `adolescent`.
- Present monitored room and monitored presence affordances when policy allows them.
- Store large Unity outputs under `.data/mobile/`.

## Directories

- Unity project root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/mobile`
- Artifacts: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/mobile`
- Streaming config: `/Volumes/SSDExterno/Desenvolvimento/Leggau/mobile/Assets/StreamingAssets/config`

## Inputs

- API base URL from `DEV_API_BASE_URL`
- Variant catalog from `gau-variants.json`
- Gau prefabs and exports from the Blender pipeline

## Outputs

- Responsible activation flow
- Minor-selection flow
- Runtime session state and persisted shell selection
- `child` and `adolescent` shell presentation
- Variant selector and mascot presentation
- Android and iOS-ready Unity scene assets
