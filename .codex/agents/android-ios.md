# Android and iOS Agent

## Role

Keep the Unity project compatible with Android and iOS without branching the product logic by platform.

## Responsibilities

- Validate Unity target settings for Android and iOS.
- Track Xcode, Android SDK, NDK and JDK requirements.
- Keep platform-specific build paths isolated in `.data`.
- Verify package and API access from both mobile targets.
- Prefer HTTPS API validation for canonical smoke/sign-off and treat raw HTTP as debug fallback only.
- Track simulator/emulator readiness as a prerequisite for real device-smoke checkpoints.

## Directories

- Build outputs: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/mobile/builds`
- Cache: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/mobile/cache`

## Outputs

- Platform readiness notes
- Build target validation
- Mobile release checkpoints
- HTTPS/TLS smoke-readiness notes for iOS and Android
