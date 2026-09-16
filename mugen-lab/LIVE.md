# MOBMUGEN / RIG F — LIVE AUTHORITY

**This is the living document for the MOBMUGEN lane.** Any agent or contributor
working on `mugen-lab/` reads this first and updates it after every pass.

It is deliberately vendor-neutral. It is not tied to any one assistant, tool or
session. If you change something in `mugen-lab/`, you update this file — that is
the rule regardless of who or what you are.

This lane is **separate** from the Prismatic Veil game ledgers
(`PV_LIVE_AUTHORITY.json`, `PV_RESUME_ANCHOR.md`, `PRIZIM_LIVE_NOTEPAD.md`,
`live-build.json`). Those govern the LIVE28K Hybrid battle stack and say nothing
about MOBMUGEN. Do not cross-apply their rules, and do not assume a change here
is covered by `AGENTS.md`'s Hybrid preflight.

- **Last updated:** 2026-09-16
- **Live commit:** `04317e3`
- **Goal:** real WinMUGEN in the browser at 60 FPS on iPhone Safari.

---

## Current test link

**https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-5.html?v=f105b-deferstart**

Status: **awaiting device witness.** Boot path verified in headless Chromium;
no iPhone run against this build yet.

### Standing rule: always hand over the link

Every pass that changes anything under `mugen-lab/` ends by giving the user the
current test link, with the `?v=` matching what the page actually references.
Not "it's pushed" — the link.

GitHub Pages serves from `main`, and it lags a push by roughly 60–90 seconds.
Before handing over a link, confirm the deployed file actually contains the
change; do not hand over a link to a stale cache.

---

## Known-good stack

Do not change more than one of these per experiment.

| Element | Value |
| --- | --- |
| CPU core | BoxedWine SIMD WASM-JIT, single-threaded (no SharedArrayBuffer) |
| Upstream | `danoon2/Boxedwine` @ `ba68d801e40fa3fc8ceeb5eec776cf4a8bdf81cf`, `make jit`, `-msimd128` |
| Runtime path | `mugen-lab/assets/boxedwine-jit/` |
| Wine root | `fullWine1.7.55-v8.zip` (repo-local, `mugen-lab/assets/`) |
| Wine overlay | `wine1.7.55-v8-min-online.zip` (jsdelivr, `exebrowser@c6049f96`) |
| Capsule | `mole` vs `G.Ken` |
| Stage | `cfjed_warzard` |
| Sound | off |
| Colour depth | 16 bpp |
| Lean app footprint | ~203.7 MB expanded / ~123.1 MB repacked |
| Final runtime authority | iPhone Safari |

---

## Device witness log

Newest first. A run only counts if it happened on the phone.

### 2026-09-16 · F10.5 (`4dc011f`, `?v=f105-jit-oldwine`) — FAIL

iPhone OS 18.7, Safari 26.6. Black screen, no WinMUGEN. Status line claimed
`WASM-JIT RUNNING` while the engine was already dead. Trace showed
`Could not load zip file` → `Could not find /bin/wine` → `Boxedwine shutdown`,
with the zip `File created://` lines arriving **after** shutdown.

Root-caused and fixed in `04317e3`. See corrections ledger.

### 2026-09-16 · F10.4 — FAIL (conclusion since withdrawn)

JIT engine initialised, RAF witness ~61, but no WinMUGEN. Recorded at the time
as "the Wine 11 root failed to mount." That conclusion is withdrawn — see
corrections ledger.

### F10.3 — partial

RAF hybrid scheduling plus present instrumentation. `L=2 GL=3 SDL=0 ALL=3 X=4`.
Read at the time as a CPU/emulation throughput ceiling in the old non-JIT core.
Note this was measured on the old core and has never been re-measured against a
working JIT build, so it is not a valid baseline for the JIT lane yet.

### F10.1 — reached an actual fight

Legacy BoxedWine/Wine path, non-JIT core. This is the last build known to have
put WinMUGEN on screen on the device.

---

## Corrections ledger

Findings that entered the record and were later disproven. Record the
correction here rather than writing a new snapshot document — a dated status
file cannot be corrected by the pass that disproves it.

### F10.4's "the Wine 11 root failed to mount" — WITHDRAWN (2026-09-16)

`rig-f10-4.js` and `rig-f10-5.js` both called `__F105_start()` /
`__F104_start()` on a zero-delay timer as soon as the engine script loaded.
That calls `start()` → `startEmulator()` → `removeRunDependency("setupBoxedWine")`,
which releases `main()` immediately — while `boxedwine-shell.js`'s
`initialSetup()` is still asynchronously downloading the root, overlay and app
zips onto the emscripten filesystem.

`main()` therefore ran against an empty filesystem and reported exactly what it
found: no root zip, no `/bin/wine`. The zips landed afterwards, in
overlay → app → root order, matching the callback nesting in `initialSetup()`.
When the real chain finished and called `start()` properly, the `isRunning`
guard made it a silent no-op. Black screen, permanently.

Wine 11 was never given a chance to mount. The `bin/wine.link` indirection in
`boxedwine-wine11.zip` (Wine 11 puts the real binary at `opt/wine/bin/wine`) is
a real structural difference from the 1.7.55 root, but it is **not established**
as the cause of anything and should not be recorded as one.

The manual start call was never needed: `auto=true` makes
`buildBrowserFileSystem()` call `start()` itself, at the correct time, once the
root zip is on the filesystem.

### F10.3's "fixed 512 MB BoxedWine heap" — DOES NOT APPLY TO THE JIT CORE

F10.3's "512 MB" was an OOM *witness* patched into the engine, not a heap
setting. The needle it patched — `function abortOnCannotGrowMemory(requestedSize){abort("OOM")}` —
does not exist anywhere in the JIT build, so copying that code forward would
silently no-op.

The JIT build ships `ALLOW_MEMORY_GROWTH` with `getHeapMax = () => 3221225472`
(3 GB) and fails through `growMemory`'s `catch` instead. Treat "fixed 512 MB
heap" as a property of the old core only. The JIT lane currently has **no**
memory witness — an OOM on device will surface as a bare abort with no reason
in the trace.

---

## Open questions

| # | Question | State |
| --- | --- | --- |
| 1 | Can the SIMD WASM-JIT core run against the proven Wine 1.7.55 root cleanly? | **Answered yes** (2026-09-16). Wine boots, JIT compiled and executed 1000 blocks, `failed=0`. Verified in headless Chromium; device witness still outstanding. |
| 2 | Can the old BrowserFS/lean app mount semantics be reproduced on the JIT core without a second full app copy in memory? | Open. The in-memory `fetch` shim for `userapp.zip` works; peak memory not yet measured. |
| 3 | Is there a safe way to decouple emulator CPU work from browser presentation? | Open. `skipFrameFPS` is already plumbed as a URL param and currently sits at `0` — untested lever, no rebuild required. |
| 4 | Does upstream expose a faster single-threaded JIT config, JIT cache path, or SIMD option for iPhone Safari? | Open. `jit-record` and `wasmModuleBroker` params exist and are untested; `jit-record` is currently `false`. |
| 5 | Can a multithreaded JIT path work under iOS/Safari without cross-origin isolation? | Open, not started. Current build is single-threaded by design. |
| 6 | Where is the real WinMUGEN GL present path, and can it be instrumented for true FPS? | Partially addressed. `rig-f10-5.js` hooks `putImageData` and `drawArrays`/`drawElements`, and the badge's `D` counter is a real draw count rather than a proxy. Not yet validated against a running MUGEN. |

---

## Known debris

Not blocking, but do not let these rot further.

- `mugen-lab/assets/boxedwine-jit/boxedwine-wine11.zip` — 48 MB, no longer
  referenced by any page, still deploying to Pages.
- `mugen-lab/assets/boxedwine-jit/BUILD_INFO.txt` — still claims
  `Wine root: official 26R1 Wine11/boxedwine.zip`. F10.5 uses the 1.7.55 root.
- The Wine overlay is fetched from jsdelivr at runtime while the root is
  repo-local. Mixed origins; the repo's own standard elsewhere is zero CDN.
- `pv-check.sh` fails on a clean tree (`could not extract JS from index.html`):
  `index.html` has its whole inline script on one line with the `<script>` tag,
  and the extractor's `awk` does `next` on that line. Unrelated to this lane,
  and no pre-commit hook is currently installed — but the check is not actually
  guarding anything right now.

---

## Process rules

One hypothesis → one build → one phone test → one conclusion.

Do not promote synthetic FPS, CI success, headless verification or engine
initialisation as a runtime win. Headless Chromium is useful for proving a boot
path deterministically and cheaply; it is **not** a performance witness and not
a substitute for the phone. The iPhone Safari witness decides actual WinMUGEN
stability and performance.

When a pass changes a file for any reason, that file goes back in the return
bundle in full. "Functionally identical, not re-included" is a claim the next
author has no way to verify, and it has already cost this project a regression.

After a pass, update this file: the test link, the device witness log, any
answered question, and any finding this pass disproved.
