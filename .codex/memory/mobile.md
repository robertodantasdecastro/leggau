# Mobile Memory

## Stack

- Engine: `Unity`
- Targets: `Android`, `iOS`
- Current API base for development: `http://10.211.55.22:8080/api`
- Local API fallback: `http://localhost:8080/api`
- Heavy mobile artifacts must stay under `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/mobile`

## Current Mac Status

- Docker: ready
- Java 17: installed
- `adb`: installed
- Unity Hub: installed
- Unity Editor `6000.0.71f1`: install directory detected, repair/revalidation running via Unity Hub
- Blender `4.5.1 LTS`: installed
- `xcodebuild`: missing
- Xcode installation is still blocked by system authentication / full Xcode app absence

## Current Frontend Goal

- Bootstrap app environment
- Perform dev login against backend
- Load family overview
- Load activities
- Load assets catalog
- Load rewards and progress
- Present dashboard flow that can evolve into actual game scenes
- Place the Gau mascot in the first bootstrap scene
- Keep the VM API as primary and localhost as fallback

## Immediate Next UI Targets

1. Boot and environment loading
2. Dev authentication and session state
3. Activities dashboard and progress
4. Check-in action
5. Reward display

## Current Recommended Next Step

- Validate the Unity editor binary, import the Gau asset and build the first bootstrap scene.
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
