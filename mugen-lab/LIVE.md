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

- **Last updated:** 2026-09-17
- **F10.9 build commit:** `1922181`
- **F10.8 build commit:** `ea07353`
- **F10.7 build commit:** `843a2de`
- **Live note status:** F10.9 jit-record witness published
- **Awaiting:** device run of F10.9 jit-record witness
- **Goal:** real WinMUGEN in the browser at 60 FPS on iPhone Safari.

---

## Current test link

**Working baseline (runs WinMUGEN):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-1.html

**Instrumented baseline (same build + loop cost witness):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-6.html

**JIT lane — current recorder witness:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-9.html?v=f109-jitrecord

**JIT lane — previous mitigation test (failed usefully on device):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-8.html?v=f108-writtenjitoff

**JIT lane — previous diagnostic (failed usefully on device):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-7.html?v=f107-faultwitness

**JIT lane — previous (does not boot, superseded by F10.7):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-5.html?v=f105b-deferstart

The JIT lane is the performance work; the F10.1/F10.6 pages are the shipping
path and must keep running. Never let the experiment become the only path.

### Next test

Run **F10.9** on the phone with the same WinMUGEN ZIP and COPY TRACE.

F10.9 changes exactly one runtime variable from F10.8: it flips
`jit-record=false` to `jit-record=true`. It keeps F10.8's
`disableWasmJitForWrittenCode=true`, root, overlay, app capsule, page-fault
capture and heap-growth witness.

Read the result as:

| Trace shows | Meaning | Next move |
| --- | --- | --- |
| Fault address changes again, recorder emits extra clue, or Wine gets farther | recorder path is exposing the failing JIT edge | narrow to the emitted record / wineserver transition |
| Same `0000000A`, `grows=0 refused=0` | written-code JIT and recorder are not enough | test `wasmModuleBroker=0` next |
| Heap witness fires | memory branch reopens | cap/reshape JIT heap behavior |

### Latest result

**F10.8 has now been run on the phone.** It failed before WinMUGEN frames, but
it changed the signature.

Device trace:

```
RUNTIME STATUS · NO FRAMES YET · SEE TRACE
F10.8 FAULTS · 2086 faults · 1 distinct addr · 0000000A x2086
F10.8 PERF SNAPSHOT · RAF=60 DRAW=0
F10.8 HEAP · bytes=? max=? grows=0 refused=0
JS ERROR · RuntimeError: Out of bounds memory access (evaluating 'func()')
mapped: /bin/wineserver and /lib/libwine.so.1.0 only
```

Read: `disableWasmJitForWrittenCode=true` changed the stable fault address from
`00000000` to `0000000A`, so it touches the crash path, but it does not solve
it. Heap growth remains closed (`grows=0 refused=0`). The next single-variable
probe is `jit-record=true` while keeping the F10.8 written-code JIT-off switch.

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

### 2026-09-17 · F10.8 (`ea07353`) — DEVICE FAIL, FAULT MOVED TO 0000000A

One-switch follow-up to F10.7. Added `disableWasmJitForWrittenCode=true` while
keeping the same JIT core, Wine root, overlay, capsule, fault capture and heap
witness.

Device run reached no WinMUGEN frames:

```
RUNTIME STATUS · NO FRAMES YET · SEE TRACE
F10.8 FAULTS · 2086 faults · 1 distinct addr · 0000000A x2086
F10.8 PERF SNAPSHOT · RAF=60 DRAW=0
F10.8 HEAP · bytes=? max=? grows=0 refused=0
JS ERROR · RuntimeError: Out of bounds memory access (evaluating 'func()')
```

Read: the written-code JIT toggle affects the failing path because the stable
fault address moved from `00000000` to `0000000A`. It did not get past the same
early wineserver/libwine loop, and heap growth still did not fire. Next test is
`jit-record=true` while keeping written-code JIT disabled.

### 2026-09-17 · F10.7 (`843a2de`) — DEVICE FAIL, NULL PAGE FAULT CAPTURED

JIT-lane diagnostic. Same core/root/overlay/capsule as F10.5; expected to fail
the same way. Adds page-fault address capture (F10.5's console filter dropped
the `Page Fault at` line while keeping the memory-map lines, which survive only
because they contain "wine"), collapses repeat dumps to two verbatim plus a
periodic address histogram, and witnesses `growMemory` / `_emscripten_resize_heap`
so a refused heap growth is visible.

Verified in headless Chromium: witness armed, Wine boots, JIT executes 1000
blocks `failed=0`, and a replayed 200-fault dump in the real BoxedWine shape
produced two verbatim dumps plus the histogram, taking the trace from 642 lines
to 48. The instrument is proven; the reading is not — headless boots this JIT
fine and cannot reproduce the device crash.

iPhone OS 18.7, Safari 26.6. Device run reached no WinMUGEN frames:

```
RUNTIME STATUS · NO FRAMES YET · SEE TRACE
F10.7 FAULTS · 2087 faults · 1 distinct addr · 00000000 x2087
F10.7 PERF SNAPSHOT · RAF=59 DRAW=0
F10.7 HEAP · bytes=? max=? grows=0 refused=0
JS ERROR · RuntimeError: Out of bounds memory access (evaluating 'func()')
```

Memory map repeated only `/bin/wineserver` and `/lib/libwine.so.1.0`. This
closes the heap-growth branch for this failure: `grows=0 refused=0`, and there
is no `HEAP GROW REFUSED` / `HEAP OVER MAX` line. The device failure is a
stable null page fault in early `wineserver` on the JIT core, followed by
JavaScriptCore's Wasm out-of-bounds exception. The browser itself is healthy
(`RAF=59`), so this is not a renderer stall or main-thread starvation result.

### 2026-09-16 · F10.6 (`59d19e4`) — MEASURED, CPU-BOUND CONFIRMED

iPhone OS 18.7, Safari 26.6. WinMUGEN running (THE THING vs GOD KEN).

```
L=4  RAF=8  D=0  BUSY=103%  MS_PER_ITER=257.0ms  LOOP_TIMER=armed
SCHEDULER · mode=0 value=4
```

Self-consistent: 4 iterations x 257ms = 1028ms, i.e. the main thread is fully
saturated, and RAF collapsed 60 -> 8 because emulator work starves the
browser's own frame callbacks. The loop is NOT under-scheduled; the 4ms timer
is asking for ~250 iterations/sec and getting 4 because that is the ceiling.

**L is the frame rate. The device runs WinMUGEN at ~4 FPS.** Reaching 60 needs
257ms -> 16.7ms, a 15.4x speedup. No scheduling change can produce that.

### 2026-09-16 · F10.1 (`?v=` none) — CONFIRMED WORKING, TWICE

Reached an actual fight on device on two separate runs, screenshot evidence
both times. Run 1: iPhone OS 18.7 / Safari 26.6. Run 2: iPhone OS 26.6 /
Edge (EdgiOS 153). Same WebKit underneath; the badge read `L 4 · D 0` in
both. Browser and OS differ between runs and are recorded as changed
variables, but did not move the number.

### 2026-09-16 · F10.5 (`4dc011f`, `?v=f105-jit-oldwine`) — FAIL

iPhone OS 18.7, Safari 26.6. Black screen, no WinMUGEN. Status line claimed
`WASM-JIT RUNNING` while the engine was already dead. Trace showed
`Could not load zip file` → `Could not find /bin/wine` → `Boxedwine shutdown`,
with the zip `File created://` lines arriving **after** shutdown.

Root-caused and fixed in `04317e3`. See corrections ledger.

### 2026-09-16 · F10.5 (`04317e3`, `?v=f105b-deferstart`) — FAIL, DIFFERENT FAILURE

Loader race fixed: zips load, `/bin/wine` is found, Wine starts. Then
`wineserver` page-faults repeatedly and forever. Only `/bin/wineserver` and
`/lib/libwine.so.1.0` are ever mapped, so it dies very early in wineserver
startup, long before MUGEN. `RAF=61` throughout — the browser is healthy, the
emulator is in a crash loop.

The faulting address was NOT captured: BoxedWine prints `Page Fault at %.8X`
above the memory-map dump, and `rig-f10-5.js`'s console filter
(`/wine|mugen|jit|wasm|.../`) drops that line while keeping the map entries,
which happen to contain "wine". The next JIT build must capture the full dump.

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

### The L/GL/SDL/ALL/X present counters measure stubs — WITHDRAWN (2026-09-16)

`D` (and F10.3's `GL`) counts `_eglSwapBuffers`, which in this engine is:

```js
function _eglSwapBuffers(){
  if(!EGL.defaultDisplayInitialized) ... else if(!Module.ctx) ...
  else if(Module.ctx.isContextLost()) ... else { EGL.setErrorCode(12288); return 1 }
}
```

It sets an error code and returns. It draws nothing. The other counted path is
SDL2's `putImageData`, which this build never calls, and the second
`ctx.putImageData` call site in the engine is the mouse-cursor builder, not a
present. `SDL_GL_SwapBuffers`, `SDL_Flip`, `SDL_UpdateRect` and
`SDL_UpdateWindowSurface` do not appear in the engine at all.

Presentation is implicit browser compositing when the main loop yields. There
is no present call to count, so `D`/`GL` can only ever read ~0 while the game
visibly runs. **`L` — main loop iterations per second — is the frame rate.**

F10.3's "L=2 GL=3 ... exposed a CPU/emulation throughput ceiling" reached the
right conclusion from instruments pointed at stubs. The conclusion happened to
be correct; the evidence for it was not.

### "It's presentation scheduling, not throughput" — WITHDRAWN (2026-09-16)

Argued mid-session that `GL=3` meant presents were bottlenecked by scheduling
and that the emscripten RAF advisory was the lever. F10.6 measured it and the
opposite is true: `MS_PER_ITER=257ms`, `BUSY=103%`, `RAF` collapsed 60 -> 8.
The thread is saturated, the timer already fires faster than the work
completes, and RAF caps at 60/sec when the build cannot reach 4.

RAF scheduling, `skipFrameFPS` and timer tuning are all dead ends for this
bottleneck. The JIT lane is the only lever that moves a 15.4x requirement.
F10.4/F10.5 were aimed at the correct problem and failed on execution, not
on premise.

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
| 1 | Can the SIMD WASM-JIT core run against the proven Wine 1.7.55 root cleanly? | **Answered NO on device** (2026-09-16). Headless Chromium (V8) boots Wine and executes 1000 JIT blocks, `failed=0` — but iPhone Safari (JavaScriptCore) page-faults in `wineserver` on the same wasm. An earlier "answered yes" here was called off a headless run and is withdrawn: headless proves a boot path, never the device. **This is now the project's critical path.** |
| 2 | Can the old BrowserFS/lean app mount semantics be reproduced on the JIT core without a second full app copy in memory? | Open. The in-memory `fetch` shim for `userapp.zip` works; peak memory not yet measured. |
| 3 | Is there a safe way to decouple emulator CPU work from browser presentation? | **Answered — the question does not apply** (2026-09-16). There is nothing to decouple: presentation is implicit compositing and costs effectively nothing. F10.6 measured 257ms/iteration with the thread 103% busy. `skipFrameFPS`, RAF scheduling and timer tuning cannot help a workload that is CPU-bound by 15.4x. Closed. |
| 4 | Does upstream expose a faster single-threaded JIT config, JIT cache path, or SIMD option for iPhone Safari? | Open. `jit-record=true` is the current F10.9 probe; `wasmModuleBroker=0` is next if F10.9 repeats the F10.8 fault. |
| 5 | Can a multithreaded JIT path work under iOS/Safari without cross-origin isolation? | Open, not started. Current build is single-threaded by design. |
| 6 | Where is the real WinMUGEN GL present path, and can it be instrumented for true FPS? | **Answered: there isn't one** (2026-09-16). `eglSwapBuffers` is a status stub; SDL2's `putImageData` is never called; `SDL_GL_SwapBuffers`/`SDL_Flip`/`SDL_UpdateRect`/`SDL_UpdateWindowSurface` are absent from the engine. Emscripten composites implicitly on main-loop yield. **Measure `L` (main loop iterations/sec) as the frame rate — it is the only honest number.** Closed. |

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
