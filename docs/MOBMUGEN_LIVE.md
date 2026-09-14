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

## 2026-09-14 11:15 — E9 PHONE WITNESS: BLACK CANVAS / ENGINE ALIVE

### Witness
The phone visibly shows:
- `MOBMUGEN · RIG E · E9`
- corrected control spacing and dedicated utility strip
- `INPUT READY`
- `RUNTIME Running...`
- black gameplay canvas
- no immediate `c0000135`, `wineboot`, `DINPUT`, or `CRTDLL` error overlay

### Important interpretation
This is meaningful progress versus E8 because the prior immediate loader-failure screen did not appear.

However, `Running...` is **not yet proof that WinMUGEN rendered or reached its title screen**.

Current E9 runtime code hides the status overlay and emits `engine: Wine engine loaded` after ~1700 ms if no error text has appeared yet. Therefore the parent can show `Running...` even while the canvas remains black and WinMUGEN has not produced a visible frame.

### What E9 proves so far
- E9 is live on phone.
- New controller layout is successful and materially cleaner.
- The runtime gets farther than the E8 immediate loader crash, or at minimum no longer surfaces that crash within the initial witness window.
- The next blocker has moved from obvious missing-DLL startup failure to **black-screen / no-frame startup telemetry**.

### E10 instrumentation target
Do not call the runtime fully running merely because the Wine JS engine loaded.

E10 should split runtime state into explicit phases:
1. `FILESYSTEM READY`
2. `WINE ENGINE LOADED`
3. `WINMUGEN PROCESS STARTED`
4. `FIRST FRAME / WINDOW DETECTED`
5. `PLAYABLE`

Until phase 4, the phone status should remain amber and say something like:
`ENGINE LOADED · WAITING FOR WINMUGEN VIDEO`

Add a black-screen watchdog and keep a compact diagnostic path available so the next witness can answer:
- which full Wine candidate actually passed
- whether `wineboot/dinput/crtdll` were present in the selected image
- whether `Winmugen.exe` emitted loader/runtime output after launch
- whether a Wine title/window event occurred
- whether the canvas changed from an all-black frame
- whether the process returned or remained active

## 2026-09-14 — E9.1 runtime witness probe pushed

Runtime commit:
`dd60a19d1bc9377627553d02f5e71f2e45c8a5bf`

E9.1 is a runtime-only diagnostic subrevision. The outer shell remains E9 so the control/input layer does not churn unnecessarily.

New witness stages:
- `ENGINE LOADED · WAITING FOR WINMUGEN VIDEO`
- `WINMUGEN WINDOW · <title>` if the Wine host reports a window title
- `WINMUGEN VIDEO ✓` when the runtime canvas changes from its post-engine baseline
- `ENGINE ALIVE · BLACK/UNCHANGED VIDEO` if the canvas remains unchanged through the witness window
- `PROCESS RETURNED · NO VIDEO CONFIRMED` if Wine exits before video is confirmed

The probe captures a post-engine canvas baseline and checks for actual visual change instead of treating the JS/Wine engine merely loading as proof of gameplay.

E9.1 preserves:
- E9 full Wine payload fallback
- current portrait control layout
- HIDE/SHOW
- touch / keyboard / browser Gamepad API shared input path
- gamepad auto-hide

### Current status
**E9 shell live. E9.1 runtime probe pushed. Waiting on Pages deployment + iPhone witness to determine whether WinMUGEN creates a window/frame or stalls after Wine engine load.**
