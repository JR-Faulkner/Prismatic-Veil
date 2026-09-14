# MOBMUGEN LIVE CONTINUITY

**Authority:** phone witness first, repo state second.

## 2026-09-14 — E8 pushed to main

### Live route
- PV homepage route: `./mugen-lab/`
- MobMugen page: `mugen-lab/index.html`
- Runtime: `mugen-lab/runtime.html`

### E8 commits
- UI/input/spacing: `d18e68262602f9c93de03ba69c4ac3156ff9d385`
- Wine loader-path runtime: `d1943ec188a73a99ae1d067d1abd75c0263e26ca`

### E8 UI/input changes
- Visible build label: `MobMugen · Rig E · E8`
- Tighter portrait spacing and larger gameplay viewport
- HIDE/SHOW on-screen controls
- Auto-hide controls when browser Gamepad API reports a physical controller
- Shared touch / keyboard / gamepad input route
- Xbox-style mapping:
  - D-pad / left stick = movement
  - X = LP
  - Y = MP
  - RB = HP
  - A = LK
  - B = MK
  - RT = HK
  - View = BACK
  - Menu = START

## 2026-09-14 11:04 — E8 phone witness CONFIRMED LIVE

### Witness result
E8 is visibly live on the iPhone and the new controls/UI are active.

Runtime output:

```text
E8 env: WINEPREFIX=/home/username/.wine WINEARCH=win32
WINEDLLPATH=/usr/lib/wine/fakedlls:/usr/lib/i386-linux-gnu/wine/fakedlls:/usr/lib32/wine/fakedlls:/usr/lib/wine
E8 loader map: wineboot=MISS dinput=MISS crtdll=MISS moduleDirs=
E8 gates: wineboot ✗ · dinput ✗ · crtdll ✗ · sys32 ✓
E8 DIAGNOSIS: INCOMPLETE 32-BIT WINE PAYLOAD
```

Launch then still fails with:

```text
wine: cannot find L"C:\\windows\\system32\\wineboot.exe"
err:process:start_wineboot failed to start wineboot, err 2
err:module:import_dll Library DINPUT.dll ... not found
err:module:import_dll Library CRTDLL.dll ... not found
err:module:LdrInitializeThunk ... status c0000135
```

### What E8 proves
- This is no longer a generic path-mismatch theory.
- The mounted WinAppRunner system image simply does not expose the required 32-bit Wine builtin payload in any of the candidate locations E8 searched.
- `system32` exists, but the actual builtin modules are absent from the mounted payload.
- `WINEDLLPATH` cannot fix files that are not present in the mounted runtime image.

### Strongest diagnosis
**Current WinAppRunnerSystem.zip / BoxedWine-era runtime payload is incomplete for WinMUGEN's 32-bit dependency chain.**

E8 did its job: it converted uncertainty into a concrete missing-runtime-payload result.

### UI witness notes
The portrait layout is improved, but the action-button cluster still wastes space and crowds the macro row.

Next UI pass should:
- move the six attack buttons into a cleaner compact hex/arc with more even spacing
- move `2P`, `2K`, `START`, `BACK` into a dedicated lower utility strip
- reduce overlap between `MK/LK/HK` and utility controls
- keep D-pad and attacks vertically centered against each other
- preserve HIDE/SHOW and gamepad auto-hide behavior

## E9 direction

### Runtime
Do **not** spend E9 searching the same missing paths again.

E9 should investigate replacing or augmenting the old WinAppRunner system payload with a browser-compatible BoxedWine/Wine image that actually contains the 32-bit builtin module family required by WinMUGEN.

Minimum payload requirement includes coherent 32-bit equivalents of:
- `wineboot.exe`
- `dinput.dll`
- `crtdll.dll`
- core Wine PE/builtin support needed by those modules

The next runtime witness should either:
1. load those modules successfully and advance into graphics/input/audio initialization, or
2. explicitly prove the replacement runtime image still lacks them.

### Controls
Preserve the shared touch / keyboard / Gamepad API architecture. Xbox/browser support remains part of MOBMUGEN itself, not PV-only behavior.

### Current status
**E8 live and witnessed. Runtime blocker narrowed to incomplete 32-bit Wine payload. UI needs one more spacing/presentation pass.**
