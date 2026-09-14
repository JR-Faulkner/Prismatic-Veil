# MOBMUGEN LIVE CONTINUITY

**Authority:** phone witness first, repo state second.

## Live route
- PV homepage route: `./mugen-lab/`
- MobMugen page: `mugen-lab/index.html`
- Runtime: `mugen-lab/runtime.html`
- Rig F prototype: `mugen-lab/rig-f.html`

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

E9.4 restored that contract while preserving the full 32-bit Wine payload fallback and runtime telemetry.

#### 2026-09-14 12:51 phone witness
Visible title: `MOBMUGEN · RIG E · E9.4`

Result:

```text
ENGINE ALIVE · NO WINMUGEN PROCESS EVIDENCE
```

Decision: stop spending primary effort on the legacy WinAppRunner engine. Rig E remains available as a reference/fallback, but the active path moves to modern BoxedWine.

# RIG F — MODERN BOXEDWINE

## F1 prototype
Prototype commit:
`c97251db1b1c6597b8a3e4fdfaf0055d1f92876a`

Route:
`mugen-lab/rig-f.html`

F1 is intentionally isolated from Rig E so a failed experiment cannot break the known shell.

Architecture:
- current ExeBrowser/BoxedWine browser runtime pinned to upstream commit `c6049f9684f3c6895c8f31f361a0a29462793f41`
- runtime JS/WASM served from pinned jsDelivr GitHub assets
- 50 MB Wine root range-fetched from ExeBrowser's BoxedWine asset worker
- `wine1.7.55-v8-min-online.zip` + patch overlay from pinned upstream assets
- user-selected WinMUGEN folder packed into an in-memory ZIP
- BoxedWine shell patched at runtime so the in-memory MUGEN ZIP mounts directly as drive D:
- launch target: `Winmugen.exe`
- working directory: `D:\`
- 16-bit video first-pass, sound disabled for boot isolation

### F1 phone witness
On iPhone, Rig F loaded and displayed:

```text
WAITING FOR FOLDER
```

The page itself loaded, but the mobile directory-picker path did not advance the runtime. This is treated as an input-package handoff issue, not a BoxedWine failure.

## F2 iPhone ZIP loader
Commit:
`582946715c2b38c11315cbf42641a1423579fa3e`

F2 keeps folder support but adds a dedicated iPhone-friendly ZIP path.

F2 behavior:
- visible title `MOBMUGEN · RIG F · F2`
- primary button: `CHOOSE WINMUGEN ZIP`
- secondary button: `CHOOSE FOLDER`
- ZIP is parsed in-browser with JSZip
- finds `Winmugen.exe` at archive root or inside one enclosing directory
- strips that enclosing directory when needed
- rebuilds a normalized in-memory app ZIP with `Winmugen.exe` at drive-D root
- hands the normalized package to the same modern BoxedWine launch path
- keeps Wine root range-fetching, overlays, 16-bit first-pass video, and sound-off isolation

### F2 witness target
Useful next states:

```text
READING WINMUGEN ZIP
F2 ZIP ROOT · <path>
F2 APP ZIP READY
FETCHING MODERN BOXEDWINE SHELL
LOADING BOXEDWINE SHELL
LOADING BOXEDWINE WASM
BOXEDWINE ENGINE STARTED
```

### Current status
**Rig F F2 pushed to main. Waiting on Pages deployment + iPhone ZIP witness.**

## Rig F F6 - lean streamed app filesystem
- Removes the 1.72 GB full `file.arrayBuffer()` app mount.
- Selectively extracts WinMUGEN executable, root DLL/config files, data, font, sound, and plugins.
- Uses per-entry ZIP slicing + fflate so the whole archive is never resident as one ArrayBuffer.
- Builds a BrowserFS in-memory D: drive and preserves the nested WinMugen path.
- Keeps the proven same-origin on-demand Wine root.

## Rig F F6.1 - same-origin late root rewrite
- F6 phone witness reached `Launching "/bin/wine" "Winmugen.exe"`.
- Wine then requested `dinput.dll` through ExeBrowser BrowserFS' hardcoded `/api/fs/fullWine1.7.55-v8.zip` path and got 404.
- F6.1 rewrites any `/api/fs/*` XHR to `./assets/*`, preserving Range headers and the proven same-origin 206 path.
- Goal: allow late wineboot/DLL reads to continue past the first real Wine process launch.
