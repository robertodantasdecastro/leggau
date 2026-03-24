# Art Pipeline

## Goal

Freeze the first Leggau 3D pipeline as:

- Blender `4.5.1 LTS` as the authoritative DCC tool
- `FBX` as the export format used by Unity
- Unity importing only exported assets, not acting as the source of truth

## Directory Layout

- `mobile/Assets/Art/Characters/Gau/Source/`
- `mobile/Assets/Art/Characters/Gau/Exports/`
- `mobile/Assets/Art/Animations/Gau/`
- `mobile/Assets/Art/Materials/`

## Gau Asset Workflow

1. Author or regenerate the Gau source asset in Blender.
2. Save the authoritative `.blend` file in `mobile/Assets/Art/Characters/Gau/Source/`.
3. Export the Unity-facing `.fbx` file to `mobile/Assets/Art/Characters/Gau/Exports/`.
4. Let Unity import the `.fbx` and keep generated metadata inside the Unity project.

## Current Prototype Automation

- Script: `scripts/build-gau-asset.sh`
- Blender source generator: `mobile/Assets/Art/Characters/Gau/Source/generate_gau_asset.py`

The current generator creates a first mobile-friendly Gau prototype with:

- low-poly rigid-bone structure
- stable bone naming
- three animations:
  - `Gau_Idle`
  - `Gau_Celebrate`
  - `Gau_Prompt`

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
