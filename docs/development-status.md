# Development Status

## Snapshot

Date checked: `2026-03-24`

## Repository

- Local repository initialized in `/Volumes/SSDExterno/Desenvolvimento/Leggau`
- Remote `origin` configured as `git@github.com:robertodantasdecastro/leggau.git`
- Monorepo structure present: `backend`, `mobile`, `infra`, `docs`, `scripts`
- Local Codex memory structure present in `.codex/`
- SSD storage policy documented in `docs/storage-policy.md`

## Backend Local Status

- `npm run build` passes in `backend/`
- The local stack is intended as fallback only; the official dev target is now `http://10.211.55.22:8080/api`
- At the moment of this status refresh, `localhost:8080` was not responding, so the local fallback stack is currently down
- Persistence validated:
  - Compose configuration now points Postgres and Redis to `./.data/docker/` bind mounts on the external SSD
  - Uploads and backups remain under `./.data/`
  - SSD directory structure was created with `./scripts/bootstrap-ssd-storage.sh`
  - The Docker daemon still needs a controlled `docker compose down` / `up` to re-establish the local fallback stack cleanly

## vm2 Status

- SSH alias `vm2` resolves to `10.211.55.22`
- Official dev backend target: `http://10.211.55.22:8080/api`
- Current `~/.ssh/config` points `vm2` to `~/.ssh/id_ed25519`
- Authentication fails with:
  - `id_ed25519`
  - `ChaveRobertoMrQuentinha`
  - `rdc_id_rsa`
- Real status of `~/leggau`, Docker, Compose and runtime on `vm2` is still unknown because login is blocked

## Mobile Mac Status

- Docker: ready
- Java 17: installed
- Android Debug Bridge (`adb`): installed
- Unity Hub: installed
- Unity Editor `6000.0.71f1`: directory detected, and repair/revalidation is running through Unity Hub
- Blender `4.5.1 LTS`: installed
- Xcode CLI / `xcodebuild`: missing
- Full Xcode install is still blocked by system authentication
- Gau source asset generated in Blender:
  - `mobile/Assets/Art/Characters/Gau/Source/Gau.blend`
  - `mobile/Assets/Art/Characters/Gau/Exports/Gau.fbx`
- Gau source file was opened successfully in Blender for validation
- Gau visual was refined and revalidated with a rendered preview:
  - `mobile/Assets/Art/Characters/Gau/Exports/Gau-preview.png`
- Gau also has a pixel-art copy:
  - `mobile/Assets/Art/Characters/Gau/PixelArt/Gau-pixel-art.png`
- Gau now also has a 3D pixel-textured copy:
  - `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-textured.blend`
  - `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-textured.fbx`
  - `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-texture.png`
  - `mobile/Assets/Art/Characters/Gau/PixelTextured/Gau-pixel-textured-preview.png`
- The pixel-textured Gau copy was rendered and then opened in Blender for verification on `2026-03-24`
- Gau now also has a Roblox-style blocky pixel variant:
  - `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel.blend`
  - `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel.fbx`
  - `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel-texture.png`
  - `mobile/Assets/Art/Characters/Gau/RobloxPixel/Gau-roblox-pixel-preview.png`
- The Roblox-style Gau variant was rendered and reopened in Blender for verification on `2026-03-24`
- The Roblox-style Gau variant was updated with a lower-resolution atlas on `2026-03-24` to increase the visible pixel effect
- Gau now also has a rounded-pixel variant:
  - `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel.blend`
  - `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel.fbx`
  - `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel-texture.png`
  - `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel-preview.png`
- The rounded-pixel variant also has a greeting preview:
  - `mobile/Assets/Art/Characters/Gau/RoundedPixel/Gau-rounded-pixel-greeting-preview.png`
- The rounded-pixel Gau variant was rendered and reopened in Blender for verification on `2026-03-24`
- The rounded-pixel Gau variant was refined with softer bevels and a higher-density pixel atlas on `2026-03-24`
- The rounded-pixel Gau variant now exports a greeting animation as `GauRoundedPixel_Greeting`

## Current Conclusion

- Backend local remains a fallback path, but the official development backend on `vm2` is still blocked by SSH access.
- The mobile repository now has the first Gau 3D asset pipeline in place, including `.blend` and `.fbx`.
- The Gau pipeline now includes a pixel-textured 3D variant alongside the base `.blend`, `.fbx` and 2D pixel-art copy.
- The Gau pipeline now also includes a blocky Roblox-style pixel variant for alternate in-game presentation.
- The Gau pipeline now also includes a rounded-pixel variant for a softer silhouette with visible pixel detail.
- Unity tooling is much closer, and the editor repair is in progress, but the bootstrap scene still depends on that validation finishing.
- Remote backend validation on `vm2` remains blocked by SSH authentication.
- Project memory is now intended to live primarily inside the repository, not in global Codex state.
- Heavy project files are now standardized to live inside `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data`.
