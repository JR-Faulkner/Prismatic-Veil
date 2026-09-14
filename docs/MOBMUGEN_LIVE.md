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

The old `c0000135` loader failure was therefore traced to an incomplete Wine payload, not simply a bad search path.

### E9
Runtime commit: `294938559752015f320043a92c53ab951805e593`
UI commit: `a6de94703fccb3bae77993673f878b85939be013`

E9 added full 32-bit Wine filesystem fallback candidates and stopped launching until a payload passed the `wineboot / dinput / crtdll` gate.

Phone witness at 11:15:
- shell visibly E9
- old DLL crash no longer surfaced
- Wine engine remained alive
- gameplay canvas stayed black

### E9.1
Runtime commit: `dd60a19d1bc9377627553d02f5e71f2e45c8a5bf`

Added video-stage telemetry.

Phone witness at 11:25:

```text
ENGINE LOADED · WAITING FOR WINMUGEN VIDEO
→
ENGINE ALIVE · BLACK/UNCHANGED VIDEO
```

No WinMUGEN window/title evidence appeared.

### E9.2
Runtime commit: `bb8e8f97852c869abfc2ddfddda741ee3540b27c`

Added process-stage telemetry:
- confirms mounted `Winmugen.exe`
- records Wine + WinMUGEN argv
- watches Wine stdout/stderr for WinMUGEN process evidence
- watches host/window title events
- distinguishes process/no-process/window/video states

Phone screen recording witness at 12:07 confirmed:

```text
ENGINE ALIVE · NO WINMUGEN PROCESS EVIDENCE
```

Meaning:
- Wine engine is alive
- old missing-DLL crash has not returned
- WinMUGEN process/window evidence is still absent
- black canvas is downstream of the handoff not occurring

## 2026-09-14 12:32 — E9.3 explicit WinMUGEN handoff pushed

Runtime commit:
`65fa85d8c0051e985e385863c0fd475208b0dba5`

### E9.3 change
E9.3 stops treating the old relative `Winmugen.exe` handoff as sufficient.

It now:
1. verifies `/root/home/username/files/Winmugen.exe` after mount
2. derives whether the selected full filesystem contains `/bin/sh`
3. prefers a shell-assisted launch when available:

```text
/bin/sh -lc "cd /home/username/files && exec <wineBinary> ./Winmugen.exe"
```

4. falls back to direct absolute launch when `/bin/sh` is unavailable:

```text
<wineBinary> /home/username/files/Winmugen.exe
```

5. enables Wine `+process,+module,+loaddll,+file` tracing
6. reports launch mode and exact argv to the phone witness
7. preserves process/window/video detection from E9.2
8. updates the visible shell marker to `E9.3`

### E9.3 witness targets
Useful phone statuses now include:

```text
DISPATCHING WINMUGEN.EXE · SHELL EXEC
DISPATCHING WINMUGEN.EXE · DIRECT ABSOLUTE
WINMUGEN PROCESS EVIDENCE · WAITING FOR VIDEO
WINDOW EXISTS · BLACK/UNCHANGED VIDEO
WINMUGEN VIDEO ✓
ENGINE ALIVE · NO WINMUGEN PROCESS EVIDENCE
LAUNCH RETURNED · NO WINMUGEN PROCESS EVIDENCE
```

### Current status
**E9.3 pushed to main. Waiting on Pages deployment + iPhone witness.**
