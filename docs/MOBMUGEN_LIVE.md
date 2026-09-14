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

### E8 runtime changes
E7 proved the seed/probe could see `wineboot.exe`, `dinput.dll`, and `crtdll.dll` while Wine itself could not resolve them.

E8 now:
- searches Wine `i386-windows` and `fakedlls` candidate trees
- records exact module paths
- derives `WINEDLLPATH` from the directories actually containing the modules
- sets `WINEARCH=win32`
- keeps `WINEPREFIX=/home/username/.wine`
- enables Wine loader tracing for module/file resolution
- reports E8 loader-map and gate diagnostics in the phone witness

### Current witness status
Last confirmed phone witness was E7 with `c0000135` after unresolved `wineboot.exe`, `DINPUT.dll`, and `CRTDLL.dll`.

### Next witness
Run the normal Home Screen / PV MobMugen route. The page should visibly identify itself as **E8** after GitHub Pages updates. If the phone still shows E7, use a cache-busted route once, then re-open the normal route/Home Screen app.

Expected useful E8 output includes lines beginning with:
- `E8 loader map:`
- `E8 gates:`
- `E8 env:`

Do not regress to forced landscape or remove the shared gamepad/touch input architecture.
