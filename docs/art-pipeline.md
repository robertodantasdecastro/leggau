# Art Pipeline

## Goal

Freeze the first Leggau 3D pipeline as:

- Blender `4.5.1 LTS` as the authoritative DCC tool
- `FBX` as the export format used by Unity
- Unity importing only exported assets, not acting as the source of truth

## Directory Layout

- `mobile/Assets/Art/Characters/Gau/Source/`
- `mobile/Assets/Art/Characters/Gau/Exports/`
- `mobile/Assets/Art/Characters/Gau/PixelTextured/`
- `mobile/Assets/Art/Characters/Gau/RobloxPixel/`
- `mobile/Assets/Art/Animations/Gau/`
- `mobile/Assets/Art/Materials/`

## Gau Asset Workflow

1. Author or regenerate the Gau source asset in Blender.
2. Save the authoritative `.blend` file in `mobile/Assets/Art/Characters/Gau/Source/`.
3. Export the Unity-facing `.fbx` file to `mobile/Assets/Art/Characters/Gau/Exports/`.
4. Let Unity import the `.fbx` and keep generated metadata inside the Unity project.
5. When a stylized pixel variant is needed, generate a separate textured copy under `mobile/Assets/Art/Characters/Gau/PixelTextured/` instead of replacing the canonical source.

## Current Prototype Automation

- Script: `scripts/build-gau-asset.sh`
- Blender source generator: `mobile/Assets/Art/Characters/Gau/Source/generate_gau_asset.py`
- Pixel-textured copy builder: `scripts/build-gau-pixel-textured.sh`
- Pixel-textured Blender transformer: `mobile/Assets/Art/Characters/Gau/Source/apply_gau_pixel_texture.py`
- Roblox-style variant builder: `scripts/build-gau-roblox-style.sh`
- Roblox-style Blender generator: `mobile/Assets/Art/Characters/Gau/Source/generate_gau_roblox_style.py`

The current generator creates a first mobile-friendly Gau prototype with:

- low-poly rigid-bone structure
- stable bone naming
- three animations:
  - `Gau_Idle`
  - `Gau_Celebrate`
  - `Gau_Prompt`

The pixel-textured copy keeps the same rig and silhouette while adding:

- a small texture atlas with nearest-neighbor sampling
- UV-projected block color regions for a pixel-art feel
- a separate `.blend`, `.fbx` and preview render for Unity experimentation

The Roblox-style pixel variant changes the silhouette more aggressively and adds:

- a blocky articulated body inspired by toy/avatar proportions
- a dedicated low-resolution pixel atlas for cubic surfaces
- separate idle, celebrate and prompt actions exported in the `.fbx`
- an alternate `.blend`, `.fbx` and preview for style exploration in Unity

## Naming Conventions

- Armature: `GauArmature`
- Root bone: `Root`
- Main bones:
  - `Spine`
  - `Neck`
  - `Head`
  - `Wing.L`
  - `Wing.R`
  - `Leg.L`
  - `Leg.R`

## Notes

- Real production art can replace the generated prototype later without breaking the pipeline.
- The `.blend` file remains the canonical editable source.
- Unity should consume exported files and scene prefabs built from those exports.
