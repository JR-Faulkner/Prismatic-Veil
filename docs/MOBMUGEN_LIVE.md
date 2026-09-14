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

## 2026-09-14 — E9 pushed to main

### E9 runtime commit
`294938559752015f320043a92c53ab951805e593`

E9 no longer assumes the legacy WinAppRunner filesystem is sufficient.

Runtime behavior:
1. download and inspect the legacy filesystem
2. verify `wineboot.exe`, `dinput.dll`, and `crtdll.dll` before launching
3. if legacy payload is incomplete, escalate automatically to a complete 32-bit Wine filesystem candidate
4. inspect every replacement payload before selecting it
5. derive the Wine executable path and builtin module directories from the selected filesystem
6. launch WinMUGEN only after a payload passes the required-module gate

Current E9 full-payload candidates:
- BoxedWine 26R1 / Wine 6 web filesystem candidate paths
- BoxedWine Debian10 / Wine 5 full filesystem fallback

Important: these are runtime download candidates, not loose DLL downloads. E9 preserves the coherent filesystem/package approach.

Useful E9 witness lines:
- `E9 FS LEGACY:`
- `E9 ESCALATION: FULL 32-BIT WINE PAYLOAD`
- `E9 FS FULL1:` / `FULL2:` / `FULL3:`
- `E9 PAYLOAD PASS:`
- `E9 mounted map:`
- `E9 env:`

If cross-origin hosting prevents one candidate from loading, E9 records the exact candidate failure and continues to the next source.

### E9 UI / controls commit
`a6de94703fccb3bae77993673f878b85939be013`

Visible label is now:
`MOBMUGEN · RIG E · E9`

Control spacing correction:
- six attack buttons remain a separate compact fight cluster
- `2P`, `2K`, `START`, `BACK` now occupy a dedicated four-column utility strip at the bottom of the controller deck
- utility buttons no longer sit on top of `LK/MK/HK`
- D-pad and attack cluster are vertically centered above the utility strip
- controller deck is slightly shorter, returning more portrait height to the gameplay viewport
- HIDE/SHOW retained
- physical gamepad auto-hide retained
- touch, keyboard, and browser Gamepad API still share one input path

### E9 witness gate
Do not infer success from the commit alone. The next authority is the phone witness.

Expected next result is one of:
1. a full Wine filesystem candidate passes and WinMUGEN reaches a deeper startup layer, or
2. E9 tells us exactly why the replacement payload could not be fetched/used.

### Current status
**E9 pushed. Waiting on Pages deployment + iPhone witness.**
