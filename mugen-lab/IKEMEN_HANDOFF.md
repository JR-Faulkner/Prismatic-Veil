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

Since that milestone the setup flow was replaced: there is now a
character/stage picker instead of a hardcoded pair, and the picked zip is
remembered in IndexedDB so the file only gets chosen once. Both are
covered by an automated behavioural suite (see **Verifying a change**),
but **neither has been confirmed on the user's real device against the
real 1.7GB zip yet** — that is the first thing worth doing. The numbers
below come from a 400MB synthetic zip in headless Chromium, not from
iOS Safari, and Safari's storage quota in particular is the open
question (see the quota trap).

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
3. **Zip persistence (IndexedDB)**: the picked zip is saved so the file is
   only chosen once. The record stores the **`File` object itself** —
   never `file.arrayBuffer()` — keyed by a fingerprint folded over the
   zip's entry table. On load, `autoLoadStoredZip()` probes the restored
   File with a 1-byte ranged read before trusting it and falls back to the
   picker if the browser has evicted its backing. Persisting happens
   *after* the picker is already up, and failure to persist is logged and
   shrugged off rather than propagated — the match is playable either way.
   See the trap about `arrayBuffer()` before touching any of this.
4. Only shared engine-config-shaped entries (`data/`, `font/`, `plugins/`,
   root `.dll`/`.ini`/`.cfg`/`.txt`) load eagerly. Every `chars/*`,
   `stages/*`, `sound/*` entry is indexed (path + zip entry, bytes untouched)
   and decompressed **on demand** the moment the engine's `open()`/`stat()`
   actually asks for it — a full roster zip can be gigabytes; only material
   to a given match is ever read.
5. `data/select.def` is parsed client-side to discover real character and
   stage names (the engine does its own authoritative parse internally; this
   only needs candidates for roster display and CLI quick-match args).
   All resolvable names are shown in a grid-based **character picker UI**
   where the user selects P1, P2 (CPU), and stage with D-pad navigation or
   touch/mouse clicks. Each choice is validated against the zip index before
   use.
6. Boots via Ikemen's built-in CLI quick-match (`-p1`/`-p2`/`-loadmotif`/
   `-s`/`-p2.ai`), bypassing menus entirely (native menus are known
   GC-heavy on single-threaded WASM per public prior art on this engine).
7. Touch D-pad + 6 buttons dispatch real `KeyboardEvent`s matching this
   build's own default key config (arrows, Z/X/C, A/S/D, Enter) — the
   engine listens via real `document.addEventListener`, same mechanism
   already proven on this repo's BoxedWine lane.

### Character picker UI

Three grids — P1, P2 (CPU), stage — listing every `select.def` name that
resolves to a real file in the zip. START MATCH boots with the current
picks; CHANGE ZIP clears the saved copy and returns to the file input.

Input works three ways, all through the same path: mouse/touch clicks;
arrow keys; and the on-screen touch controller, whose D-pad and attack
buttons already dispatch real `KeyboardEvent`s at the document. While the
picker is open the engine isn't running, so those same events drive the
grid — **D-pad moves, any attack button or START commits.** A real gamepad
reaches it the same way once the browser maps it (untested on hardware).

Keep that property in mind when changing the picker: it is what makes the
screen usable on a controller without a second input abstraction.

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
- **Never call `file.arrayBuffer()` (or `.text()`, or `new Response(file)
  .arrayBuffer()`) on the content zip.** It materializes the entire zip in
  the JS heap. Measured on a 400MB zip: `arrayBuffer()` grows the heap by
  399.9MB — 100% of the file — against 25.4MB for the whole load when the
  `File` is passed around by reference. The target install is 1.7GB; on an
  iPhone that allocation is a tab crash, not a caught error, and it dies
  *before* it ever gets far enough to be a quota problem. `File`/`Blob` are
  structured-cloneable, so IndexedDB stores them in WebKit's own on-disk
  blob store and hands back a reference. Everything downstream already
  works off ranged `file.slice()` reads (`listZipEntries`, `entryRaw`), so
  nothing needs the whole zip resident — keep it that way. This shipped
  once in the first persistence cut and was caught only because the user
  tested on the real device.
- **An empty result is not the same as a failure, and silence reads as
  neither.** The first version of `autoLoadStoredZip()` logged on error and
  on success but fell through silently when the store was simply empty —
  so a first-ever visit and a broken IndexedDB produced an identical,
  information-free `WAITING FOR ZIP`. The user's screenshot of exactly that
  state is what prompted the review that found the `arrayBuffer()` bug.
  Log the empty case explicitly.
- **A restored `File` can outlive its bytes.** Safari may evict the blob
  backing while leaving the IndexedDB record intact, so `rec.file` exists,
  reports a plausible `.size`, and throws only once something reads it —
  deep inside the zip reader, where the error looks like zip corruption.
  Probe with a 1-byte `slice(0,1).arrayBuffer()` before trusting a restored
  File, and clear the record and fall back to the picker when it fails.
- **Storage quota on iOS Safari is the open risk for a multi-GB zip.**
  `navigator.storage.persist()` is requested and `estimate()` is logged, but
  a 1.7GB write may still be refused. A refused write is deliberately
  non-fatal: it happens *after* the picker is already showing, is caught,
  and only costs the convenience of skipping the file input next visit.
  Keep that ordering — don't move persistence ahead of the playable state.
- **`setInteractive`-style double-binding applies to plain DOM too.**
  `showCharacterPicker()` runs again after CHANGE ZIP; its first version
  re-added the START/CHANGE ZIP `click` listeners on every run, so one tap
  of START fired `startMatch()` once per zip the session had ever loaded.
  Bind once behind a flag (or store a reference and `removeEventListener`
  first) — same lesson as the `.on('resize', …)` leak documented in the
  root `CLAUDE.md`.
- **CSS `auto-fill` column count is not derivable from the item count.**
  Grid navigation first computed columns as `ceil(sqrt(n))`, which is
  unrelated to what the browser actually laid out at a given width — so
  up/down jumped by the wrong stride at every viewport except by accident.
  Read `getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length`.
- **Scope a selection highlight to its own container.** Clearing
  `.roster-item.selected` document-wide before re-marking meant picking a
  P2 fighter silently erased the P1 and stage marks; only the most recent
  pick ever looked chosen, across three grids that are all independently
  meaningful.

## Verifying a change

There is no build, no package.json and no test runner in this repo. The
Ikemen lane is verified by driving the real page in headless Chromium.
Two scratch harnesses were used for the picker/persistence pass and are
worth recreating (they were not committed — they live outside the repo):

- **Behavioural suite** — 22 checks: cold start with an empty store, pick,
  save, restore across a reload, eviction fallback, CHANGE ZIP clearing
  storage, no listener stacking, grid navigation, attack-key commit,
  selection isolation across the three grids. Serve the repo root on a
  port, intercept the fflate CDN request with a local copy, and drive the
  page with Playwright.
- **Heap measurement** — build a large synthetic zip (a small real one plus
  incompressible `ZIP_STORED` filler under `chars/`), launch with
  `--js-flags=--expose-gc`, and compare `performance.memory.usedJSHeapSize`
  across the load. This is what caught the `arrayBuffer()` bug, and it
  compares the current path against the old one *on the same file* rather
  than asserting the improvement.

Both ran against a synthetic zip. **Neither substitutes for one real
playthrough on the user's device with the real 1.7GB install** — the root
`CLAUDE.md` standard ("play one full round before shipping") applies here
too, and every genuinely surprising bug in this lane so far surfaced on
hardware, not in headless.

Also syntax-check before committing:

```bash
node --check mugen-lab/rig-ikemen-3.js
```

`bash pv-check.sh` (the repo-wide pre-commit check) currently prints
`ERROR: could not extract JS from index.html` and still exits 0. That is
**pre-existing and unrelated to this lane** — it reproduces at commits
predating this work and concerns the legacy survival prototype, not
`mugen-lab/`. Don't let it read as something this lane broke; don't fix it
as part of an Ikemen change either.

## Suggested next steps

Roughly in priority order:

1. **Confirm the picker and persistence on the real device against the
   real 1.7GB zip.** This is the open question, not a formality. Watch for:
   does Safari accept a 1.7GB IndexedDB write at all (the trace logs the
   quota estimate and whether persistence was granted); does the restored
   File survive a browser restart, not just a reload; is the picker usable
   with ~150 names in a grid on a phone-sized screen. Everything below is
   lower value until this is known.
2. **GUI beautification.** The picker, setup card and HUD are functional
   and plain. If this ships alongside Prismatic Veil, align with the
   battle UI's visual language. The picker grid is the obvious first
   target — 150 text buttons is a list, not a character select screen.
3. **Character portraits in the picker.** MUGEN chars carry portraits in
   their `.sff` sprite packs; extracting those means an SFF reader, which
   is real work but would turn the grid into something worth looking at.
   Check whether the roster zip has loose portrait PNGs first — much
   cheaper if so. Note the lazy VFS makes this affordable: portraits can
   be materialized on demand exactly like everything else.
4. **Bluetooth/USB controller.** Likely already works with zero changes —
   the engine polls `navigator.getGamepads()` every frame (`input_js.go`),
   ranking real controllers ahead of junk HID devices, and touch controls
   already auto-hide in landscape. The picker should also be drivable from
   a gamepad via the existing key path. All of this is **unconfirmed
   against real hardware.**
5. **Stage background music.** Character SFX work; BGM files live under a
   bare `sound/` path that the eager-vs-lazy split doesn't currently route
   into the lazy index. Should be a small change to `isEagerBootstrap()`'s
   complement, but verify the engine actually requests those paths.
