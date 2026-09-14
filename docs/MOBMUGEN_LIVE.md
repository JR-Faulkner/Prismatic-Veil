# MOBMUGEN LIVE CONTINUITY

**Authority:** phone witness first, repo state second.

## Live route
- PV homepage route: `./mugen-lab/`
- MobMugen page: `mugen-lab/index.html`
- Runtime: `mugen-lab/runtime.html`

## Current shell
- Portrait MOBMUGEN controller shell
- HIDE/SHOW controls
- Physical gamepad auto-hide
- Shared touch / keyboard / browser Gamepad API path
- Xbox-style mapping preserved
- Dedicated `2P / 2K / START / BACK` utility row

## Runtime history

### E8
Commits:
- UI/input: `d18e68262602f9c93de03ba69c4ac3156ff9d385`
- runtime: `d1943ec188a73a99ae1d067d1abd75c0263e26ca`

Phone witness proved the mounted legacy runtime lacked the required 32-bit Wine builtin family:

```text
wineboot=MISS
dinput=MISS
crtdll=MISS
E8 DIAGNOSIS: INCOMPLETE 32-BIT WINE PAYLOAD
```

### E9
Runtime: `294938559752015f320043a92c53ab951805e593`
UI: `a6de94703fccb3bae77993673f878b85939be013`

Added full 32-bit Wine filesystem fallbacks. Phone witness cleared the immediate E8 DLL crash but left a black canvas with Wine engine alive.

### E9.1
Runtime: `dd60a19d1bc9377627553d02f5e71f2e45c8a5bf`

Phone witness:

```text
ENGINE LOADED · WAITING FOR WINMUGEN VIDEO
→ ENGINE ALIVE · BLACK/UNCHANGED VIDEO
```

### E9.2
Runtime: `bb8e8f97852c869abfc2ddfddda741ee3540b27c`

Added mounted EXE/process/window telemetry. Phone recording confirmed:

```text
ENGINE ALIVE · NO WINMUGEN PROCESS EVIDENCE
```

### E9.3
Runtime: `65fa85d8c0051e985e385863c0fd475208b0dba5`

Tried shell-assisted / absolute EXE handoff with Wine process tracing.

#### 2026-09-14 12:42 phone witness
Visible title: `MOBMUGEN · RIG E · E9.3`

Result:

```text
ENGINE ALIVE · NO WINMUGEN PROCESS EVIDENCE
```

Therefore shell/absolute-path handoff did not improve process creation.

## E9.4 canonical WinAppRunner handoff
Runtime commit: `d0e2fb9df0ebeabf6b4df3447c563edc38f6b9b9`

Upstream `lrusso/WinAppRunner` was checked directly. Its native launch contract is:

```text
-root /root -m 64 -w /home/username/files/ /usr/bin/wine <exeFilename>
```

E9.4 restores that contract instead of shell/absolute-path launching while preserving:
- full 32-bit Wine payload fallback
- exact selected payload identity (`LEGACY`, `FULL1`, `FULL2`, `FULL3`)
- selected Wine binary path
- `+process,+module,+loaddll,+file` tracing
- process/window/video watchdogs
- current E9 controller/Xbox/browser UI

### E9.4 decision point
If canonical handoff still yields no WinMUGEN process evidence, the leading suspect becomes compatibility between the legacy `WinAppRunnerSystem.js/.wasm` engine and the newer replacement Wine filesystem payload rather than the EXE path itself.

### Current status
**E9.4 pushed to main. Waiting on Pages deployment + iPhone witness.**
