# Unity Recovery

## Status

Date checked: `2026-03-25`

- `Unity Hub.app` is installed in `/Applications/Unity Hub.app`
- No working `Unity.app` editor binary is currently installed
- The previous Unity editor install failed because the Hub tried to validate/install into the default `/Applications` location and failed disk-space validation

## SSD Redirect

To align Unity with the Leggau storage policy, the Hub was redirected to SSD-backed paths:

- Editor install target:
  `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unity/editors`
- Hub downloads target:
  `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unityhub/downloads`

## Applied Local Changes

- `~/Library/Application Support/UnityHub/secondaryInstallPath.json`
  now points to the SSD editor path
- `~/Library/Application Support/UnityHub/downloads`
  is now a symlink to the SSD downloads path

## Remaining Blockers

- The Hub user session/license expired and needs to be re-authenticated in the Hub UI
- After signing back in, the editor install needs to be rerun

## Verification Commands

```bash
cat "$HOME/Library/Application Support/UnityHub/secondaryInstallPath.json"
ls -ld "$HOME/Library/Application Support/UnityHub/downloads"
find /Applications "$HOME/Applications" -maxdepth 4 -name Unity.app 2>/dev/null
```

## Expected Next Step

1. Open Unity Hub
2. Sign back in if prompted
3. Reinstall the chosen Unity editor version
4. Confirm a real `Unity.app` binary exists
5. Build and open the Leggau bootstrap scene
