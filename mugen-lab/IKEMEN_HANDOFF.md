# Ikemen Lane — Handoff Briefing

This is a standalone briefing for picking up the **Ikemen GO web port**
work in a fresh session (CLI or otherwise). It is deliberately separate
from `LIVE.md`, which covers a completely different, unrelated lane in
this same repo (BoxedWine/Wine-in-WASM) — do not mix the two up, they
share nothing but the repo.

## Repo

```
git clone https://github.com/JR-Faulkner/Prismatic-Veil.git
cd Prismatic-Veil
git checkout claude/rig-f10-5-simd-jit-wine-5n8srg   # optional -- main already has everything, fast-forwarded
```

No build step. Serve the repo root over HTTP (opening the file directly
breaks ES module imports and WASM loading):

```bash
python3 -m http.server 8000
# http://localhost:8000/mugen-lab/rig-ikemen-3.html
```

Live deploy: `https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-3.html`

## What this is

A MUGEN-compatible fighting game (Ikemen GO, a Go reimplementation of
MUGEN) compiled to WebAssembly and running in mobile Safari, loading a
user-supplied MUGEN content zip (characters/stages) entirely client-side.
This is a **separate, newer, more tractable lane** than this repo's other
active effort (getting real WinMUGEN running via BoxedWine/Wine-in-WASM,
documented in `mugen-lab/LIVE.md`) — that lane hit a since-diagnosed
JIT-codegen correctness bug (`memchr()` dereferencing a near-null pointer)
in an undocumented, experimental BoxedWine build mode. This lane sidesteps
that whole problem: no x86 emulation, no Wine, just a Go program compiled
to plain WASM.

**Current state: genuinely playable.** Real matches have been played
end-to-end on a real iPhone (touch controls, real character art, sound)
against the user's own real ~1.7GB/9551-entry MUGEN install.

## Files

- `mugen-lab/rig-ikemen-3.html` / `.js` — the current playable build.
  Earlier `rig-ikemen-1`/`rig-ikemen-2` are superseded diagnostic
  checkpoints, kept for reference/history, not the thing to build on.
- `mugen-lab/assets/ikemen-web/`
  - `ikemen-v2.wasm` — the compiled engine (~24MB). Built from
    `energyjp/ikemen-go-web` (a fork of `ikemen-engine/Ikemen-GO` with a
    WebGL2/Web Audio/browser-input backend; MIT licensed) at commit
    `54305ec917c3e995f433004e2e8f7c8902bff96a`, via:
    ```
    GOEXPERIMENT=arenas GOOS=js GOARCH=wasm CGO_ENABLED=0 \
      go build -trimpath -o ikemen-v2.wasm ./src
    ```
    (Go 1.24.7; built clean first try, no source patches needed.)
  - `wasm_exec.js` — Go's own unmodified WASM runtime shim (must match
    the Go version the wasm was built with).
  - `ikemen-runtime-assets.zip` — the engine's own required-at-boot files
    (its default UI motif/screenpack, fonts, base Lua scripts). These
    ship in Ikemen's *release* distribution, not its source repo, so
    they're bundled separately here. Sourced from
    `ikemen-engine/Ikemen_GO-Elecbyte-Screenpack` (MIT code / CC-BY-3.0
    assets) + the engine repo's own `data/`, `font/`, `external/`. See
    `ikemen-runtime-assets.PROVENANCE.txt` alongside it for exact
    provenance and the rebuild command.

## How rig-ikemen-3 works

1. A custom in-memory filesystem (`globalThis.fs`, implementing the
   Node-fs subset Go's `syscall/fs_js.go` calls) is installed **before**
   `wasm_exec.js` loads, so its default all-`ENOSYS` browser stub never
   installs.
2. `ikemen-runtime-assets.zip` loads first (engine's own required files).
3. User picks a MUGEN content zip. Only shared engine-config-shaped
   entries (`data/`, `font/`, `plugins/`, root `.dll`/`.ini`/`.cfg`/`.txt`)
   load eagerly. Every `chars/*`, `stages/*`, `sound/*` entry is indexed
   (path + zip entry, bytes untouched) and decompressed **on demand** the
   moment the engine's `open()`/`stat()` actually asks for it — a full
   roster zip can be gigabytes; only material to a given match is ever
   read.
4. `data/select.def` is parsed client-side for real character/stage
   names (the engine does its own authoritative parse internally; this
   only needs candidates for the CLI quick-match args below). Each
   candidate is validated against the zip index before use.
5. Boots via Ikemen's built-in CLI quick-match (`-p1`/`-p2`/`-loadmotif`/
   `-s`/`-p2.ai`), bypassing menus entirely (native menus are known
   GC-heavy on single-threaded WASM per public prior art on this engine).
6. Touch D-pad + 6 buttons dispatch real `KeyboardEvent`s matching this
   build's own default key config (arrows, Z/X/C, A/S/D, Enter) — the
   engine listens via real `document.addEventListener`, same mechanism
   already proven on this repo's BoxedWine lane.

### Player/stage selection (no picker UI yet)

Auto-picks the first two `select.def`-listed names that actually resolve.
To choose instead:

```
rig-ikemen-3.html?p1=<name>&p2=<name>&s=<stagename>
```

Names must match a real `chars/<name>/<name>.def` in the zip (case
doesn't matter). An unresolvable override is logged and ignored, not
silently broken. The trace (COPY TRACE button) logs every resolvable
name found in the roster, capped at 60, so real names are always
discoverable without inspecting the zip separately.

## Known traps already hit and fixed (don't relearn these)

- **Canvas id must be exactly `ikemen-canvas`.** The engine's
  `system_js.go`/`render_webgl.go` look for `document.getElementById
  ("ikemen-canvas")` and silently create their own elsewhere if missing
  — renders into an element your layout never sees.
- **`-s`, not `-stage`, selects the stage.** `-stage` silently no-ops
  (main.lua reads `flags['-s']`).
- **`-r <path>` is Ikemen's OWN alternate spelling of `-loadmotif`**, not
  "rounds." `-r 1` clobbers the real motif path with the literal string
  `"1"`.
- **A MUGEN capsule's top-level wrapper folder** (e.g. `Winmugen/`) has
  to be stripped before loading — the engine's own `chars/`/`data/`/
  `stages/` lookup roots are hardcoded relative to VFS root.
- **Case-sensitivity**: MUGEN content routinely references a file by a
  different case than what's actually on disk (fine on Windows/macOS,
  breaks on a case-sensitive VFS). The VFS shim does a case-insensitive
  fallback lookup generically rather than patching each mismatch.
- **`.stage` has `overflow:hidden`** — an overlong setup-card description
  pushes CHOOSE ZIP off-screen. Verify button bounding box against stage
  clip bounds in headless across several viewport sizes before shipping
  any copy change here, not just eyeballing one size.
- **Safari bfcache** can restore this exact page (hidden setup overlay,
  already-exited WASM instance) on a simple re-tap of the same link. A
  `pageshow` listener forces `location.reload()` when `event.persisted`.
- **iOS audio autoplay policy**: the engine's audio backend (`oto`)
  already does the textbook fix (wait for a real `touchend`/`mouseup`/
  `keyup`, then `resume()`), but only starts listening after boot, and
  touch-control taps only produce *synthetic* KeyboardEvents for it to
  see. A backstop patches `AudioContext` to track every instance and
  resume on the next real (trusted) touch/click/key, independent of
  oto's own listeners.
- **Read the actual engine source before assuming CLI flag names or
  default keybinds** — an AI-written diary from a similar prior effort
  (a different project's fork) got at least one fact wrong (claimed
  upstream Ikemen ships `build/wasm.sh`; it does not, verified directly
  against `ikemen-engine/Ikemen-GO`). Trust the actual `src/*.go` and
  `external/script/main.lua` in whichever fork is actually in use, not
  secondhand descriptions.

## Suggested next steps (not started)

- **Beautification pass** — current UI is functional, not polished.
- **Real character-select screen** — the `?p1=`/`?p2=` URL override is a
  stopgap. Either try Ikemen's own native select screen first (zero new
  code, unconfirmed whether it's fast enough on single-threaded WASM —
  the fork's own docs/prior art flag native *menus* as GC-heavy, unclear
  if select screen specifically has the same issue) or build a
  lightweight custom picker (grid of roster names/portraits) backed by
  the same lazy VFS.
- **Bluetooth/USB controller support** — likely already works with zero
  changes: the engine polls `navigator.getGamepads()` every frame on its
  own (`input_js.go`), ranking real controllers ahead of junk HID
  devices. Touch controls already auto-hide in landscape orientation
  (assumption: a physical controller is in hand there). Not yet
  confirmed against a real device.
- **Sound**: character-specific SFX confirmed working after the audio
  backstop fix. Stage background music is currently out of scope — BGM
  files live under a bare `sound/` path not covered by the current
  eager-vs-lazy split logic (would need `sound/` added to the lazy
  index, same as chars/stages already are).
