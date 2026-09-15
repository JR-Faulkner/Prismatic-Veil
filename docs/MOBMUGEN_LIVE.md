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

## Rig F F6.2 - playable shell integration
- F6.1 phone witness produced real WinMUGEN video on iPhone.
- Restores the prior portrait touch-controller layout: D-pad, LP/MP/HP, LK/MK/HK, 2P/2K, START/BACK.
- Controls are independently collapsible via HIDE/SHOW CTRL.
- Debug trace area is independently collapsible via HIDE/SHOW DEBUG or its inline COLLAPSE/EXPAND button.
- Browser Gamepad API/Xbox mapping restored with touch controls auto-hidden while a physical gamepad is connected.
- PV title/Home Screen MobMugen and Rig F shortcuts now point directly to `rig-f.html?v=f62`.

## Rig F F6.3 - performance pass
- Keeps the F6 lean app filesystem and F6.2 controller/debug shell.
- Removes `ondemand=root` so the same-origin Wine root is loaded up front, eliminating synchronous DLL range fetches during gameplay.
- Runtime-patches the pinned Emscripten main-loop setup to force requestAnimationFrame timing.
- Adds an on-screen frame presentation counter for phone witness comparison.
- Audio remains disabled during this performance isolation pass.
- PV Rig F shortcut points to `rig-f.html?v=f63`.


## Rig F F6.4 - inline engine WASM path fix
- F6.3 phone witness failed before BoxedWine startup because the fetched-and-inline-patched engine resolved `boxedwine.wasm` relative to the GitHub Pages document instead of the pinned ExeBrowser engine directory.
- F6.4 rewrites BoxedWine's `wasmBinaryFile` to the absolute pinned jsDelivr `boxedwine.wasm` URL before executing the patched engine text.
- Keeps the F6.3 performance experiment intact: lean 223.6 MB app FS, full same-origin Wine root, forced requestAnimationFrame main loop, FPS witness, sound off.


## Rig F F6.5 - EGL RAF lock
- F6.4 phone witness proved the full Wine root now loads once with an async HTTP 200 and WinMUGEN video still renders, but measured draw cadence remained about 1 FPS.
- The pinned Emscripten engine shows `_eglSwapInterval(0)` explicitly changes the main loop back to timeout timing after the initial RAF force, matching the repeated runtime warning.
- F6.5 patches `_eglSwapInterval` so interval 0 stays on requestAnimationFrame instead of timeout mode.
- Adds timing transition telemetry plus separate main-loop (`L`) and draw/present (`D`) per-second counters.
- Keeps the lean app FS, full local Wine root, pinned WASM URL, controls, collapsible debug, 16-bit video, and sound-off isolation.
- PV MobMugen shortcut targets `rig-f.html?v=f65`.


## Rig F F7 - modern upstream WASM JIT experiment
- F6.5 proved RAF timing is holding, while phone witness remained around only a few emulated frames per second.
- F7 is isolated from the F6.5 baseline and pins current upstream BoxedWine commit `940cb6fe2c771c2275d57d4fbb5a8f77bfa7b167`.
- Builds upstream single-threaded `make jit` WASM JIT so GitHub Pages does not require COOP/COEP SharedArrayBuffer headers.
- Keeps the proven lean WinMUGEN selection and old local Wine 1.7.55 root for an engine-only performance comparison.
- Copies the lean BrowserFS payload into modern BoxedWine `/d_drive` before launch, then maps it to Wine D:.
- Sound remains off. F6.5 remains the safe proven baseline.


## Rig F F7.1 - low-memory staged ingest
- F7 phone witness froze during the direct synchronous second-copy of the ~223.6 MB lean payload into modern BoxedWine `/d_drive`.
- F7.1 keeps the same compiled modern WASM JIT core.
- The D: ingest now transfers files in small batches, yields to Safari every four files, and unlinks each BrowserFS source file after copying to cap duplicate resident memory.
- F6.5 remains the safe proven baseline.


## Rig F F7.2 - direct ZIP stream ingest
- F7.1 still froze on iPhone during the handoff.
- F7.2 removes the intermediate ~223.6 MB BrowserFS payload entirely.
- The lean selector now stores only entry metadata plus the original File handle.
- Once the modern BoxedWine FS is ready, each selected ZIP entry is sliced, inflated, written directly to `/d_drive`, released, and Safari is yielded to every two files.
- Modern single-threaded WASM JIT core is unchanged from F7.
- F6.5 remains the safe baseline.


## Rig F F7.3 - picker witness
- Adds immediate visible telemetry when iOS returns a selected ZIP.
- Clears file-input value before opening so reselecting the same ZIP still fires.
- Listens to both input and change.
- Does not alter the F7.2 direct-stream or modern JIT architecture.


## Rig F F7.4 - native visible picker
- Replaces hidden label-driven ZIP input with a visible native iOS file input.
- Adds explicit START SELECTED ZIP button so file selection and boot start are separate witness points.
- Removes input-value pre-clear behavior.
- Keeps F7.2 direct stream and modern JIT architecture unchanged.


## Rig F F7.5 - start-button bootstrap witness
- Adds a dependency-free inline visual witness to the native START SELECTED ZIP button.
- Button immediately changes to START CLICKED before main boot code runs.
- Main boot handoff waits 250 ms so iOS Safari can paint the state change before ZIP indexing.
- If the button changes but boot does not advance, the failure is inside main JS/boot rather than the native tap itself.


## Rig F F7.6 - main JavaScript syntax repair
- Phone F7.5 proved the dependency-free inline START witness fired while the main application listener did not.
- CI Node syntax validation found the exact blocker at the patchShell `src+=` line: an unescaped literal newline inside a single-quoted JavaScript string.
- F7.6 encodes those newlines correctly, then validates the extracted inline script with `node --check` before commit.
- Direct ZIP streaming and the modern BoxedWine WASM JIT architecture remain unchanged.


## Rig F F7.7 - ZIP central directory fix
- F7.6 phone witness reached boot and stopped at buildLeanAppFS line 62.
- Root cause: F7.2 metadata-only planner referenced `entries` even though `entries` existed only as a local count in `inspectZip`, not as the central-directory entry array.
- F7.7 rebuilds the complete central-directory metadata array inside `buildLeanAppFS`, matching the proven F6 parser, then filters it without extracting payload bytes.
- Adds central-directory entry-count witness before lean selection.
- JS syntax validation is mandatory before commit.


## Rig F F7.8 - drive-qualified WinMUGEN launch path
- F7.7 proved the 259-file direct ZIP stream and modern BoxedWine JIT engine both start.
- Wine then resolved bare Winmugen.exe against C:\windows\system32 and failed to find it.
- F7.8 changes p= to d:\WinMugen\Winmugen.exe while preserving w=d:/WinMugen.
- Stream trace cadence reduced from every 2 files to every 25 files.
- If Wine 1.7.55 still faults after the executable is found, next branch is a modern BoxedWine-supported Wine root.


## Rig F F7.9 - BoxedWine official Wine 3.1 root
- F7.8 proved the modern JIT core can mount D:, locate D:\WinMugen\Winmugen.exe, and hand the actual executable to Wine.
- F7.8 then failed in the legacy Wine 1.7.55 layer with repeated InitCommonControlsEx aborts and c0000005 during main EXE initialization.
- F7.9 preserves the 259-file direct ZIP streamer, modern WASM JIT core, D: mount, and drive-qualified WinMUGEN launch path.
- Root changes to BoxedWine's official TinyCore15Wine3.1.zip package from https://boxedwine.org/v2/2/.
- Legacy wine1.7.55-v8-min-online.zip overlay is removed for this branch.
- If the remote root is blocked by browser CORS, the next task is same-origin packaging/proxying rather than changing WinMUGEN payload logic.


## Rig F F7.9.1 - repair actual Wine 3.1 runtime params
- Phone witness proved F7.9 labels changed but the actual runtime URL params still requested fullWine1.7.55-v8 plus the legacy overlay.
- F7.9.1 replaces buildParams directly with root=TinyCore15Wine3.1 and no overlay parameter.
- ROOT_BASE is forced to https://boxedwine.org/v2/2/ and locateOverlayBaseUrl is blanked.
- JIT core, direct 259-file D: stream and drive-qualified WinMUGEN path stay unchanged.


## Rig F F7.9.2 - same-origin split Wine 3.1 root
- F7.9.1 proved the runtime parameters were correct, but Safari returned PROMISE · Load failed before the Wine root was created.
- F7.9.2 keeps root=TinyCore15Wine3.1 and stores the verified official filesystem as three same-origin chunks under mugen-lab/assets.
- patchShell now patches upstream loadFile after boxedwine-shell.js is fetched, reconstructing the root before handing it to BoxedWine.
- Expected reconstructed size: 119229367 bytes. Expected upstream SHA-256: 09296bb395cc2b8a563fc7986f242531e485b2664bd282270eb03e12015ca693.


## Rig F F8.0 - performance + input witness
- F7.9.2 is the first proven modern WASM-JIT path to render WinMUGEN video on iPhone Safari using TinyCore15Wine3.1 and the same-origin split root.
- F8.0 locks that compatibility stack and avoids further Wine/root churn.
- Stream telemetry is reduced from every 2 files to about every 25 files.
- Top badge now shows browser RAF cadence and input status. IN SDL✓ means a synthetic touch/gamepad keyboard event reached an Emscripten/SDL listener that prevented default; IN DOM means the event dispatched but no SDL acknowledgement was observed.
- First-frame trace is renamed as an F8 JIT video witness. Audio remains disabled until performance and input are proven.


## Rig F F8.1 - suppress Wine Mono prompt
- F8.0 proved the modern JIT path still renders WinMUGEN and showed a Wine Mono Installer dialog before user interaction.
- WinMUGEN does not require Mono/.NET for this boot path, so F8.1 passes WINEDLLOVERRIDES=mscoree=d;mshtml=d through BoxedWine's supported env parameter to suppress Mono/Gecko installation prompts.
- The proven TinyCore15Wine3.1 same-origin root, 259-file stream, audio-off setting, RAF witness, and SDL input witness remain unchanged.
- Expected trace includes the env parameter and F8.1 MONO SUPPRESS after first frame.


## Rig F F8.2 - JIT stability under rewritten code
- F8.0 phone witness proved WinMUGEN accepts the on-screen controls even though the old defaultPrevented-based badge reported DOM ONLY.
- The same witness showed repeated `nested code invalidation preparation` messages followed by an out-of-bounds WASM failure before later input faults.
- F8.2 keeps modern WASM JIT enabled globally but sets `disableWasmJitForWrittenCode=true`, using BoxedWine's supported safety switch for code pages that are rewritten/self-modified.
- Input telemetry now reports SENT/DELIVERED rather than pretending defaultPrevented is an SDL acknowledgement.
- Repeated identical runtime-error lines are collapsed to preserve useful trace context. Wine 3.1, same-origin root, 259-file stream, Mono suppression, and audio-off state remain locked.
