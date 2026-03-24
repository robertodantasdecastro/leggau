# Mobile Development Setup

## Goal

Prepare the MacBook to build and iterate on the Unity frontend for:

- Android
- iOS

## Current Machine Status

- Docker: available
- Java 17: available
- `adb`: available
- Xcode: missing
- Unity / Unity Hub: missing or not detected

## Required Tooling

### Unity

- Install a recent Unity LTS editor
- Include support modules for:
  - Android Build Support
  - Android SDK & NDK Tools
  - OpenJDK if Unity manages it
  - iOS Build Support

### Apple Toolchain

- Install Xcode
- Open Xcode once and complete first-run setup
- Confirm:
  - `xcodebuild -version`
  - iOS Simulator availability if needed

### Android Toolchain

- Keep `adb` available in PATH
- Ensure Unity uses a compatible Android SDK/NDK/JDK setup

## Project Entry Point

- Open Unity with the project root at `/Volumes/SSDExterno/Desenvolvimento/Leggau/mobile`

## Runtime Config

- Development API config: `mobile/Assets/StreamingAssets/config/dev-api.json`
- Production API config: `mobile/Assets/StreamingAssets/config/prod-api.json`

## Expected First Validation

- Unity opens `mobile/` successfully
- Unity generates `.meta`, `Library/` and local derived files
- Android target can be selected in Build Settings
- iOS target becomes available after Xcode is installed
- Frontend reads `DEV_API_BASE_URL=http://localhost:8080/api`
