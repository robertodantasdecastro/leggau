# Mobile Development Setup

## Goal

Prepare the MacBook to build and iterate on the Unity frontend for:

- Android
- iOS

## Current Machine Status

- Docker: available
- Java 17: available
- `adb`: available
- Unity Hub: installed
- Unity Editor `6000.4.0f1`: installed on the external SSD and validated as runnable
- Android Build Support: installed for `6000.4.0f1`
- iOS Build Support: installed for `6000.4.0f1`
- Unity Editor `6000.0.71f1`: still present as an older fallback, but not the preferred editor
- Blender `4.5.1 LTS`: installed
- Xcode: installed and selected (`Xcode 26.4`)
- Android emulator/AVD: not currently provisioned on this machine
- iOS simulator runtimes: no available simulator devices listed at the moment

## Required Tooling

### Unity

- Install a recent Unity LTS editor
- Include support modules for:
  - Android Build Support
  - Android SDK & NDK Tools
  - OpenJDK if Unity manages it
  - iOS Build Support

### Apple Toolchain

- Keep Xcode selected and healthy
- Confirm:
  - `xcodebuild -version`
  - iOS Simulator availability if needed for smoke runs

### Android Toolchain

- Keep `adb` available in PATH
- Ensure Unity uses a compatible Android SDK/NDK/JDK setup

## Project Entry Point

- Open Unity with the project root at `/Volumes/SSDExterno/Desenvolvimento/Leggau/mobile`
- Development should prefer `DEV_API_ALIAS_URL` over HTTPS when it is available
- The raw VM fallback remains `DEV_API_BASE_URL=http://10.211.55.22:8080/api`
- Local fallback remains `http://localhost:8080/api`

## Runtime Config

- Development API config: `mobile/Assets/StreamingAssets/config/dev-api.json`
- Production API config: `mobile/Assets/StreamingAssets/config/prod-api.json`

## Expected First Validation

- Unity opens `mobile/` successfully
- Unity generates `.meta`, `Library/` and local derived files
- Android target can be selected in Build Settings
- iOS target is available after Xcode first-run completion
- Frontend should sign off through `DEV_API_ALIAS_URL` over HTTPS
- Frontend keeps `DEV_API_BASE_URL=http://10.211.55.22:8080/api` only as editor/development fallback
- Frontend falls back to `http://localhost:8080/api` only when the VM path is unavailable during local debugging
