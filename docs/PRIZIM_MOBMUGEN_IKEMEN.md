# PriZim MOBMUGEN-IKEMEN Harness

PriZim provides the same three-layer validation path used for the BoxedWine lane's `rig-f7.html` (see `docs/PRIZIM_MOBMUGEN.md`), adapted for the Ikemen lane's `mugen-lab/rig-ikemen-*` (documented day-to-day in `mugen-lab/IKEMEN_FAI_LIVE_NOTES.md`). This is a separate, additional harness — it does not replace or touch the BoxedWine one.

## Why this exists

Every rig in this lane (I13 through I17 as of writing) is a single-level string-patch wrapper fetched over a shared base, `rig-ikemen-3.js`. That shape has produced its own recurring failure class: a rig's own patch text hardcoding a stale prior build number instead of the current one. It shipped in I16 in two separate spots, missed both times by a verification suite that only checked a fixed list of known label sites rather than sweeping generically. This harness makes that sweep automatic instead of something a human has to remember on every future build.

## Layer 1: static preflight

`tools/prizim/mobmugen-ikemen/preflight.py` finds the current rig (the highest-numbered `rig-ikemen-N.html` on disk — every new rig increments past every prior one, including ones the live notes mark "do not use as a base"), then checks:

- the base `rig-ikemen-3.js`'s patch points the wrapper depends on (`bindPress`, `selectItem`, `lazyMaterialize`, the `boot()` anchor, `startMatch`'s hide-and-boot line) still exist
- **no stale `I<N>` label** (N less than the current rig) anywhere in the current rig's generated patch text — the exact class of bug from I16, caught by a generic sweep rather than a fixed list
- the current rig's own page and script both fetch base `rig-ikemen-3.html`/`.js` directly, never a prior numbered rig — wrapper-on-wrapper is documented as what made I11 fail to run at all
- `IKEMEN_FAI_LIVE_NOTES.md`'s own "Test next: RIG I\<N\>" anchor line matches the highest-numbered file on disk, so the doc and the actual current build can't silently drift apart

## Layer 2: browser simulation

`tools/prizim/mobmugen-ikemen/runtime_probe.mjs` launches Chromium through Playwright, opens the current rig's actual page, and drives it through a generated synthetic fixture (`make_fixture.py` — deliberately tiny, not a stand-in for a real multi-GB roster; see the note below). It exercises:

- zip pick → character picker → touch-driven pick (both of `pickerCommit()`'s branches, plus `selectItem()`'s own) → START MATCH
- the I14 shared-key refcount fix (a diagonal releasing early while its own cardinal is still held)
- the I14 d-pad roll fix (sliding between cells switches the active key)
- the I13 routing fix (no control press reaches the picker handler once the match has started)
- the I17 load-gate fix (the overlay must never report removal with 0 real assets materialized — the exact I16 bug)
- the same stale-label sweep as Layer 1, run against the actual live trace this time

## Layer 3: real-runtime trace analysis

`tools/prizim/mobmugen-ikemen/trace_analyzer.py` classifies a real, phone-copied trace (paste the COPY TRACE output to a file, run the script against it). Every signal it checks was written against an actual trace from this lane's I13–I17 development, not invented speculatively:

- stale rig labels (the I16 bug)
- the load overlay removing itself with 0 real assets materialized (the exact I16 load-gate bug, fixed in I17)
- a control press routed to the picker after the match had already started (the I13 bug, if it ever regresses)
- a key still reported held at the end of the trace (the pre-I14 stuck-control symptom)
- **a trace whose `RUNTIME STATUS` header froze on `LOADING <N>` with no error, crash, or further milestone anywhere in the body** — the exact signature of the suspected iOS Safari memory-pressure kill found while diagnosing a real crash report. This cannot be root-caused from the trace alone (see below), but it can be flagged reliably instead of being missed in a wall of noise.

Known, deliberately-ignored noise (`Failed to add char: blank` / `Failed to add stage` spam — see the "Known runtime noise" section of the live notes) is counted but never treated as a failure signal.

## Phone witness remains authoritative

Same limitation PriZim's own BoxedWine doc states for its lane, true here for the identical reason: **this harness cannot reproduce iPhone Safari/WebKit memory pressure or the user's real multi-gigabyte roster in GitHub Actions.** A synthetic fixture with two tiny placeholder characters cannot trigger the kind of sustained decompression load a real, heavily-edited MUGEN character package does, and a CI runner's memory profile is nothing like an iPhone's. Builds that pass this harness still require a real phone test before being called mobile-stable — this harness's job is to stop the CHEAP kind of regression (a stale label, a broken patch point, a routing regression) from costing phone time, not to replace phone time.

## CI behavior

`.github/workflows/prizim-mobmugen-ikemen.yml` runs automatically when any `rig-ikemen-*` file, the live notes, or this harness itself changes. It can also be run manually via `workflow_dispatch`. Reports are uploaded as workflow artifacts, same as the BoxedWine lane's.

## Running locally

```bash
python3 tools/prizim/mobmugen-ikemen/preflight.py
python3 tools/prizim/mobmugen-ikemen/make_fixture.py
python3 -m http.server 8000 &
PZ_BASE_URL=http://localhost:8000 node tools/prizim/mobmugen-ikemen/runtime_probe.mjs
python3 tools/prizim/mobmugen-ikemen/trace_analyzer.py <path-to-a-copied-trace.txt>
```

`runtime_probe.mjs` also accepts `PZ_CHROMIUM_PATH` (point at a pre-installed browser instead of Playwright's own managed install) and `PZ_FFLATE_PATH` (serve a local copy of the fflate CDN dependency instead of reaching the real CDN) — both are for sandboxed/offline local runs; CI leaves both unset.
