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
- **F10.10 build commit:** `b072511`
- **F10.9 build commit:** `1922181`
- **F10.8 build commit:** `ea07353`
- **Live note status:** F10.10 module-broker-off test published
- **Awaiting:** device run of F10.10 module-broker-off test
- **Goal:** real WinMUGEN in the browser at 60 FPS on iPhone Safari.

---

## Current test link

**Working baseline (runs WinMUGEN):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-1.html

**Instrumented baseline (same build + loop cost witness):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-6.html

**JIT lane — current module broker test:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-10.html?v=f1010-brokeroff

**JIT lane — previous recorder witness:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-9.html?v=f109-jitrecord

**JIT lane — previous mitigation test:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-8.html?v=f108-writtenjitoff

**JIT lane — previous diagnostic:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-7.html?v=f107-faultwitness

The JIT lane is the performance work; the F10.1/F10.6 pages are the shipping
path and must keep running. Never let the experiment become the only path.

### Next test

Run **F10.10** on the phone with the same WinMUGEN ZIP and COPY TRACE.

F10.10 changes exactly one runtime variable from F10.9: it adds
`wasmModuleBroker=0`. It keeps F10.9's `jit-record=true`, F10.8's
`disableWasmJitForWrittenCode=true`, root, overlay, app capsule, page-fault
capture and heap-growth witness.

Read the result as:

| Trace shows | Meaning | Next move |
| --- | --- | --- |
| Fault changes, recorder emits extra clue, or Wine gets farther | module broker path is implicated | narrow around broker/JSC interaction |
| Same `0000000A`, `grows=0 refused=0` | broker is not the lever | stop toggling runtime params; isolate `wineserver` harness or change core build |
| Heap witness fires | memory branch reopens | cap/reshape JIT heap behavior |

### Latest result

**F10.9 has now been run on the phone.** It repeated F10.8's signature.

Device trace:

```
RUNTIME STATUS · WASM-JIT STARTING
F10.9 FAULTS · 604 faults · 1 distinct addr · 0000000A x604
F10.9 PERF SNAPSHOT · RAF=60 DRAW=0
F10.9 HEAP · bytes=? max=? grows=0 refused=0
mapped: /bin/wineserver and /lib/libwine.so.1.0 only
```

Read: `jit-record=true` did not move the failure. The crash still sits in the
early `wineserver` / `libwine.so.1.0` loop at `0000000A`, with the browser event
loop healthy and no heap growth. The next single-variable probe is
`wasmModuleBroker=0` while keeping written-code JIT off and jit-record on.

### Standing rule: always hand over the link

Every pass that changes anything under `mugen-lab/` ends by giving the user the
current test link, with the `?v=` matching what the page actually references.
Not "it's pushed" — the link.

GitHub Pages serves from `main`, and it lags a push by roughly 60–90 seconds.
Before handing over a link, confirm the deployed file actually contains the
change; do not hand over a link to a stale cache.

---

## Device witness log

Newest first. A run only counts if it happened on the phone.

### 2026-09-17 · F10.9 (`1922181`) — DEVICE FAIL, JIT-RECORD DID NOT MOVE FAULT

One-switch follow-up to F10.8. Flipped `jit-record=false` to `jit-record=true`
while keeping `disableWasmJitForWrittenCode=true`, same JIT core, Wine root,
overlay, capsule, fault capture and heap witness.

Device run reached no WinMUGEN frames:

```
RUNTIME STATUS · WASM-JIT STARTING
F10.9 FAULTS · 604 faults · 1 distinct addr · 0000000A x604
F10.9 PERF SNAPSHOT · RAF=60 DRAW=0
F10.9 HEAP · bytes=? max=? grows=0 refused=0
```

Read: F10.9 repeated F10.8's `0000000A` fault and did not expose a new recorder
clue in the copied trace. Heap growth still did not fire. Next test is
`wasmModuleBroker=0` while keeping F10.9's other toggles.

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
early wineserver/libwine loop, and heap growth still did not fire.

### 2026-09-17 · F10.7 (`843a2de`) — DEVICE FAIL, NULL PAGE FAULT CAPTURED

JIT-lane diagnostic. Device run reached no WinMUGEN frames:

```
RUNTIME STATUS · NO FRAMES YET · SEE TRACE
F10.7 FAULTS · 2087 faults · 1 distinct addr · 00000000 x2087
F10.7 PERF SNAPSHOT · RAF=59 DRAW=0
F10.7 HEAP · bytes=? max=? grows=0 refused=0
JS ERROR · RuntimeError: Out of bounds memory access (evaluating 'func()')
```

Memory map repeated only `/bin/wineserver` and `/lib/libwine.so.1.0`. This
closed the heap-growth branch for this failure and identified a stable early
wineserver fault on the JIT core.

### 2026-09-16 · F10.6 (`59d19e4`) — MEASURED, CPU-BOUND CONFIRMED

WinMUGEN running on iPhone Safari at about 4 FPS:

```
L=4  RAF=8  D=0  BUSY=103%  MS_PER_ITER=257.0ms  LOOP_TIMER=armed
```

The loop is CPU-bound; scheduling changes cannot produce the required 15.4x
speedup.

### 2026-09-16 · F10.1 — CONFIRMED WORKING, TWICE

Legacy BoxedWine/Wine path, non-JIT core. Reached actual fights on device twice.
This is the known working baseline.

---

## Current conclusion

The old non-JIT path runs but is far too slow. The JIT path is the only known
speed lever, but on iPhone Safari it currently faults in early `wineserver`
before any WinMUGEN frames. The failure is not heap growth and not browser frame
starvation. F10.8 proved the written/self-modified-code JIT toggle affects the
crash path by moving the fault from `00000000` to `0000000A`; F10.9 proved
`jit-record=true` does not move it further. F10.10 tests the remaining exposed
module broker toggle.

---

## Process rules

One hypothesis → one build → one phone test → one conclusion.

Do not promote synthetic FPS, CI success, headless verification or engine
initialisation as a runtime win. Headless Chromium is useful for proving a boot
path deterministically and cheaply; it is **not** a performance witness and not
a substitute for the phone. The iPhone Safari witness decides actual WinMUGEN
stability and performance.

After a pass, update this file: the test link, the device witness log, any
answered question, and any finding this pass disproved.
