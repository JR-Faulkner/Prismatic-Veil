# MOBMUGEN / RIG F — LIVE AUTHORITY

**This is the living document for the MOBMUGEN lane.** Any agent or contributor working on `mugen-lab/` reads this first and updates it after every pass.

This lane is **separate** from the Prismatic Veil game ledgers (`PV_LIVE_AUTHORITY.json`, `PV_RESUME_ANCHOR.md`, `PRIZIM_LIVE_NOTEPAD.md`, `live-build.json`). Those govern the LIVE28K Hybrid battle stack and say nothing about MOBMUGEN. Do not cross-apply their rules.

- **Last updated:** 2026-09-17
- **F10.13 build commit:** `21c1b84` page, `6a112e2` script
- **F10.12 build commit:** `8415424`
- **F10.11 build commit:** `2ee8cf4`
- **Live note status:** F10.13 bare Wine harness published
- **Awaiting:** device run of F10.13 bare Wine harness
- **Goal:** real WinMUGEN in the browser at 60 FPS on iPhone Safari.

---

## Current test link

**Working baseline (runs WinMUGEN):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-1.html

**Instrumented baseline (same build + loop cost witness):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-6.html

**Current JIT launch harness:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-13.html?v=f1013-bare-wine

**Previous JIT lane tests:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-12.html?v=f1012-wine-noprogram
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-11.html?v=f1011-wineserver
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-10.html?v=f1010-brokeroff
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-9.html?v=f109-jitrecord
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-8.html?v=f108-writtenjitoff
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-7.html?v=f107-faultwitness

The JIT lane is the performance work; the F10.1/F10.6 pages are the shipping path and must keep running. Never let the experiment become the only path.

### Next test

Run **F10.13** on the phone with the same WinMUGEN ZIP and COPY TRACE.

F10.13 is the next launch harness. It goes through `/bin/wine` with no WinMUGEN program argument and disables the shell's `explorer /desktop=shell` fallback. This sits between F10.12's `/bin/wine` no-program explorer fallback and F10.11's direct `/bin/wineserver` harness.

Read the result as:

| Trace shows | Meaning | Next move |
| --- | --- | --- |
| Same `0000000A` | bare `/bin/wine` entrypoint itself triggers the old fault | isolate Wine loader / builtin initialization before explorer |
| Moves to `FFFFFFFF` | explorer fallback caused the F10.12 `0000000A` path | instrument explorer/desktop startup |
| Gets farther or exits cleanly | shell fallback or program handoff contributes to the fault | narrow launch args / working dir / app mount |
| Heap witness fires | memory branch reopens | cap/reshape JIT heap behavior |

### Latest result

**F10.12 has now been run on the phone.** It returned to the F10.8-F10.10 signature.

Device trace:

```
RUNTIME STATUS · NO FRAMES YET · SEE TRACE
F10.12 FAULTS · 1605 faults · 1 distinct addr · 0000000A x1605
F10.12 PERF SNAPSHOT · RAF=60 DRAW=0
F10.12 HEAP · bytes=? max=? grows=0 refused=0
```

Read: `/bin/wine` with no WinMUGEN program argument still triggers `0000000A`, while F10.11 direct `/bin/wineserver` triggered `FFFFFFFF`. The boundary is between direct wineserver and the Wine launch path. F10.13 removes the shell's explorer/desktop fallback to test whether bare `/bin/wine` alone is enough.

### Standing rule: always hand over the link

Every pass that changes anything under `mugen-lab/` ends by giving the user the current test link, with the `?v=` matching what the page actually references. Not "it's pushed" — the link.

GitHub Pages serves from `main`, and it lags a push by roughly 60–90 seconds. Before handing over a link, confirm the deployed file actually contains the change; do not hand over a link to a stale cache.

---

## Device witness log

Newest first. A run only counts if it happened on the phone.

### 2026-09-17 · F10.12 (`8415424`) — DEVICE FAIL, `/bin/wine` NO-PROGRAM RETURNED TO 0000000A

Harness follow-up to F10.11. Launched through `/bin/wine` with no WinMUGEN program argument, allowing the shell to use its minimal explorer/desktop fallback.

```
RUNTIME STATUS · NO FRAMES YET · SEE TRACE
F10.12 FAULTS · 1605 faults · 1 distinct addr · 0000000A x1605
F10.12 PERF SNAPSHOT · RAF=60 DRAW=0
F10.12 HEAP · bytes=? max=? grows=0 refused=0
```

Read: direct `/bin/wineserver` moved to `FFFFFFFF`, but `/bin/wine` with no WinMUGEN handoff returned to `0000000A`. The fault is now tied to the Wine launch path before WinMUGEN specifically. Next: bare `/bin/wine` with no explorer fallback.

### 2026-09-17 · F10.11 (`2ee8cf4`) — DEVICE FAIL, DIRECT WINESERVER MOVED FAULT TO FFFFFFFF

Harness follow-up to F10.10. Patched BoxedWine shell to launch `/bin/wineserver` directly with no WinMUGEN program argument.

```
RUNTIME STATUS · WASM-JIT STARTING
F10.11 FAULTS · 905 faults · 1 distinct addr · FFFFFFFF x905
F10.11 PERF SNAPSHOT · RAF=57 DRAW=0
F10.11 HEAP · bytes=? max=? grows=0 refused=0
```

Stable repeated wineserver frames:

```
wineserver 08071c0b / 00029c0b
wineserver 080721b1 / 0002a1b1
wineserver 0804a44e / 0000244e
```

Read: the direct wineserver harness changes the device fault from `0000000A` to `FFFFFFFF`. That proves the F10.8-F10.10 signature is not merely "wineserver exists on the JIT core"; it is tied to the Wine launch shape above direct wineserver.

### 2026-09-17 · F10.10 (`b072511`) — DEVICE FAIL, MODULE BROKER DID NOT MOVE FAULT

Added `wasmModuleBroker=0` while keeping `jit-record=true`, `disableWasmJitForWrittenCode=true`, same JIT core, Wine root, overlay, capsule, fault capture and heap witness.

```
F10.10 FAULTS · 952 faults · 1 distinct addr · 0000000A x952
F10.10 PERF SNAPSHOT · RAF=60 DRAW=0
F10.10 HEAP · bytes=? max=? grows=0 refused=0
```

### 2026-09-17 · F10.9 (`1922181`) — DEVICE FAIL, JIT-RECORD DID NOT MOVE FAULT

```
F10.9 FAULTS · 604 faults · 1 distinct addr · 0000000A x604
F10.9 PERF SNAPSHOT · RAF=60 DRAW=0
F10.9 HEAP · bytes=? max=? grows=0 refused=0
```

### 2026-09-17 · F10.8 (`ea07353`) — DEVICE FAIL, FAULT MOVED TO 0000000A

```
F10.8 FAULTS · 2086 faults · 1 distinct addr · 0000000A x2086
F10.8 PERF SNAPSHOT · RAF=60 DRAW=0
F10.8 HEAP · bytes=? max=? grows=0 refused=0
```

### 2026-09-17 · F10.7 (`843a2de`) — DEVICE FAIL, NULL PAGE FAULT CAPTURED

```
F10.7 FAULTS · 2087 faults · 1 distinct addr · 00000000 x2087
F10.7 PERF SNAPSHOT · RAF=59 DRAW=0
F10.7 HEAP · bytes=? max=? grows=0 refused=0
```

### 2026-09-16 · F10.6 (`59d19e4`) — MEASURED, CPU-BOUND CONFIRMED

WinMUGEN running on iPhone Safari at about 4 FPS. The loop is CPU-bound; scheduling changes cannot produce the required 15.4x speedup.

### 2026-09-16 · F10.1 — CONFIRMED WORKING, TWICE

Legacy BoxedWine/Wine path, non-JIT core. Reached actual fights on device twice. This is the known working baseline.

---

## Current conclusion

The old non-JIT path runs but is far too slow. The JIT path is the only known speed lever, but on iPhone Safari it faults before any WinMUGEN frames. The failure is not heap growth and not browser frame starvation. F10.8 proved the written/self-modified-code JIT toggle affects the crash path by moving the fault from `00000000` to `0000000A`; F10.9 proved `jit-record=true` does not move it; F10.10 proved `wasmModuleBroker=0` does not move it; F10.11 proved direct `/bin/wineserver` changes the signature to `FFFFFFFF`; F10.12 proved `/bin/wine` with no WinMUGEN program handoff returns to `0000000A`. F10.13 now tests bare `/bin/wine` with the explorer fallback removed.

---

## Process rules

One hypothesis → one build → one phone test → one conclusion.

Do not promote synthetic FPS, CI success, headless verification or engine initialisation as a runtime win. Headless Chromium is useful for proving a boot path deterministically and cheaply; it is **not** a performance witness and not a substitute for the phone. The iPhone Safari witness decides actual WinMUGEN stability and performance.

After a pass, update this file: the test link, the device witness log, any answered question, and any finding this pass disproved.
