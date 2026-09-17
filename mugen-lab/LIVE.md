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
- **F10.12 build commit:** `8415424`
- **F10.11 build commit:** `2ee8cf4`
- **F10.10 build commit:** `b072511`
- **Live note status:** F10.12 Wine no-program harness published
- **Awaiting:** device run of F10.12 Wine no-program harness
- **Goal:** real WinMUGEN in the browser at 60 FPS on iPhone Safari.

---

## Current test link

**Working baseline (runs WinMUGEN):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-1.html

**Instrumented baseline (same build + loop cost witness):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-6.html

**Current JIT launch harness:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-12.html?v=f1012-wine-noprogram

**Previous JIT lane tests:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-11.html?v=f1011-wineserver
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-10.html?v=f1010-brokeroff
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-9.html?v=f109-jitrecord
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-8.html?v=f108-writtenjitoff
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-7.html?v=f107-faultwitness

The JIT lane is the performance work; the F10.1/F10.6 pages are the shipping
path and must keep running. Never let the experiment become the only path.

### Next test

Run **F10.12** on the phone with the same WinMUGEN ZIP and COPY TRACE.

F10.12 is the next launch harness. It goes through `/bin/wine`, but passes no
WinMUGEN program argument, so BoxedWine should fall back to Wine's minimal
explorer/desktop path. This sits between F10.11's direct `/bin/wineserver`
harness and the normal WinMUGEN handoff.

Read the result as:

| Trace shows | Meaning | Next move |
| --- | --- | --- |
| Same `FFFFFFFF` with wineserver frames | Wine/wineserver startup itself is enough to trigger that harness fault | instrument wineserver symbols deeper or change JIT/core build |
| Returns to `0000000A` | the `/bin/wine` launch path, before WinMUGEN specifically, triggers the old fault | isolate Wine builtin/desktop startup |
| Gets farther or exits cleanly | the WinMUGEN executable handoff contributes to `0000000A` | narrow to program args / working dir / app mount |
| Heap witness fires | memory branch reopens | cap/reshape JIT heap behavior |

### Latest result

**F10.11 has now been run on the phone.** It changed the signature.

Device trace:

```
RUNTIME STATUS · WASM-JIT STARTING
F10.11 FAULTS · 905 faults · 1 distinct addr · FFFFFFFF x905
F10.11 PERF SNAPSHOT · RAF=57 DRAW=0
F10.11 HEAP · bytes=? max=? grows=0 refused=0
wineserver frames: 08071c0b / 00029c0b, 080721b1 / 0002a1b1, 0804a44e / 0000244e
```

Read: direct `/bin/wineserver` did not repeat F10.8-F10.10's `0000000A`; it
moved to `FFFFFFFF` and exposed stable wineserver frames. This means the crash
shape changes when Wine is not asked to launch WinMUGEN. The next harness runs
through `/bin/wine` with no WinMUGEN program argument.

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

### 2026-09-17 · F10.11 (`2ee8cf4`) — DEVICE FAIL, DIRECT WINESERVER MOVED FAULT TO FFFFFFFF

Harness follow-up to F10.10. Patched BoxedWine shell to launch `/bin/wineserver`
directly with no WinMUGEN program argument.

Device run reached no WinMUGEN frames:

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

Read: the direct wineserver harness changes the device fault from `0000000A` to
`FFFFFFFF`. That proves the F10.8-F10.10 signature is not merely "wineserver
exists on the JIT core"; it is tied to the Wine launch shape above direct
wineserver.

### 2026-09-17 · F10.10 (`b072511`) — DEVICE FAIL, MODULE BROKER DID NOT MOVE FAULT

Added `wasmModuleBroker=0` while keeping `jit-record=true`,
`disableWasmJitForWrittenCode=true`, same JIT core, Wine root, overlay, capsule,
fault capture and heap witness.

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

WinMUGEN running on iPhone Safari at about 4 FPS. The loop is CPU-bound;
scheduling changes cannot produce the required 15.4x speedup.

### 2026-09-16 · F10.1 — CONFIRMED WORKING, TWICE

Legacy BoxedWine/Wine path, non-JIT core. Reached actual fights on device twice.
This is the known working baseline.

---

## Current conclusion

The old non-JIT path runs but is far too slow. The JIT path is the only known
speed lever, but on iPhone Safari it faults before any WinMUGEN frames. The
failure is not heap growth and not browser frame starvation. F10.8 proved the
written/self-modified-code JIT toggle affects the crash path by moving the
fault from `00000000` to `0000000A`; F10.9 proved `jit-record=true` does not
move it; F10.10 proved `wasmModuleBroker=0` does not move it; F10.11 proved a
direct `/bin/wineserver` launch changes the signature to `FFFFFFFF`. F10.12 now
tests `/bin/wine` with no WinMUGEN program handoff.

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
