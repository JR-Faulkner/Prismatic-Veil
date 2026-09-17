# MOBMUGEN / RIG F — LIVE AUTHORITY

**This is the living document for the MOBMUGEN lane.** Any agent or contributor working on `mugen-lab/` reads this first and updates it after every pass.

This lane is **separate** from the Prismatic Veil game ledgers (`PV_LIVE_AUTHORITY.json`, `PV_RESUME_ANCHOR.md`, `PRIZIM_LIVE_NOTEPAD.md`, `live-build.json`). Those govern the LIVE28K Hybrid battle stack and say nothing about MOBMUGEN. Do not cross-apply their rules.

- **Last updated:** 2026-09-17
- **F10.14 build commit:** `10ae3a9` (also corrects a dead F10.13 patch, see below)
- **F10.13 build commit:** `21c1b84` page, `2d63eb2` script copy fallback, `10ae3a9` bugfix
- **F10.12 build commit:** `8415424`
- **F10.11 build commit:** `2ee8cf4`
- **Live note status:** F10.13 corrected before its first device run; F10.14 (non-JIT core, same launch shape) published alongside it
- **Awaiting:** device run of F10.13 (corrected) and F10.14
- **Goal:** real WinMUGEN in the browser at 60 FPS on iPhone Safari.

---

## Current test link

**Working baseline (runs WinMUGEN):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-1.html

**Instrumented baseline (same build + loop cost witness):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-6.html

**Corrected bare-Wine launch harness (JIT core -- run this):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-13.html?v=f1013-bare-wine-copyfix

**Non-JIT core discriminator (identical launch shape -- run this too):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-14.html?v=f1014-nonjit-core

**Previous JIT lane tests:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-12.html?v=f1012-wine-noprogram
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-11.html?v=f1011-wineserver
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-10.html?v=f1010-brokeroff
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-9.html?v=f109-jitrecord
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-8.html?v=f108-writtenjitoff
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-7.html?v=f107-faultwitness

The JIT lane is the performance work; the F10.1/F10.6 pages are the shipping path and must keep running. Never let the experiment become the only path.

### Bug found and fixed before it reached the phone

F10.13 has never been run on device. Before it was, its own explorer-fallback
patch was found to be dead: the regex targeted the wrapper's own fetched
`rig-f10-8.js` text, but the string `"explorer"` never appears there at all --
it lives inside `boxedwine-shell.js`, fetched into a local variable at
runtime. The regex matched nothing and silently changed nothing. F10.13 had
been going to launch `/bin/wine explorer /desktop=shell`, identical to F10.12,
contrary to its own name and its own trace label. Confirmed directly in
headless: command line before the fix read `/bin/wine,explorer,/desktop=shell`;
after, `/bin/wine` alone. Fixed by patching the runtime-fetched shell text
itself, with the needle asserted so a future shell change fails loudly instead
of silently reintroducing this.

### Next test: two builds, run both

**F10.13 (corrected)** goes through `/bin/wine` with no WinMUGEN program
argument and, now genuinely, no explorer/desktop=shell fallback. This sits
between F10.12's explorer-fallback path and F10.11's direct `/bin/wineserver`
harness.

**F10.14** is the discriminator this project has been missing. Every JIT-lane
test since F10.7 varied something *inside* the JIT core (toggles, then Wine
launch arguments) -- none changed the core itself, despite
`boxedwine-f83-fallback/` (non-JIT interpreter, `CPU_MODE.txt=NON_JIT_RELEASE`)
sitting in the repo unused since before this branch started. F10.14 is F10.13's
corrected launch shape with exactly one variable changed: the CPU core.

Read the pair together:

| F10.13 (JIT) | F10.14 (non-JIT) | Meaning |
| --- | --- | --- |
| Faults | Boots WinMUGEN | The fault is JIT-core-specific. The seven-test Wine-launch bisection was sound, ruling out everything except the actual JIT. |
| Faults | Faults the same way | The JIT was never the differentiator. The new shell, launch shape, or mount semantics from F10.7+ are implicated, and the bisection has been chasing the wrong subsystem. |
| Boots WinMUGEN | (moot) | The bare-wine fix alone was the whole problem; F10.12's explorer path was the actual fault trigger. Re-check F10.12 against this same corrected shape before concluding. |

If F10.13 still shows the old address table (`0000000A`/`FFFFFFFF`/`00000000`),
read it against that table as before; the corrected launch shape may still
move which address appears.

### Historical result (F10.12, pre-dates the fix above)

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

### 2026-09-17 · F10.14 (`10ae3a9`) — BUILT, AWAITING DEVICE

Non-JIT core discriminator. Same corrected bare-`/bin/wine`, no-program,
no-explorer-fallback launch shape as F10.13; the only variable changed is
`BASE`, pointed at `boxedwine-f83-fallback/` (never used by any page before
this). Heap-growth witness skipped rather than faked: its target strings do
not exist in this build's compiled output (confirmed, grep count 0).

Verified in headless Chromium: shell-text patch takes effect (command line
`/bin/wine` alone), Wine's own userland prints its usage banner, zero page
faults. Headless has never reproduced this project's device-only fault under
either core, so this is boot-path evidence only. **No device run yet.**

### 2026-09-17 · F10.13 (corrected, `10ae3a9`) — BUILT, AWAITING FIRST DEVICE RUN

Same build as originally shipped, with its dead explorer-fallback patch fixed
(see "Bug found and fixed" above). Never run on device before or after the
fix -- this is its first real test.

Verified in headless Chromium after the fix: command line is `/bin/wine` alone,
matching F10.14's launch shape exactly except for the CPU core. Wine's own
userland prints its usage banner, zero page faults. Same caveat as F10.14:
headless boot success is not a device result.

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

The old non-JIT path runs but is far too slow (~4 FPS, confirmed by F10.6; 60 needs a 15.4x speedup that no scheduling change can produce). The JIT path is the only known speed lever, but on iPhone Safari it faults before any WinMUGEN frames. The failure is not heap growth and not browser frame starvation. F10.8 proved the written/self-modified-code JIT toggle affects the crash path by moving the fault from `00000000` to `0000000A`; F10.9 proved `jit-record=true` does not move it; F10.10 proved `wasmModuleBroker=0` does not move it; F10.11 proved direct `/bin/wineserver` changes the signature to `FFFFFFFF`; F10.12 proved `/bin/wine` with no WinMUGEN program handoff returns to `0000000A`.

**Caveat on the F10.12 reading, added 2026-09-17:** F10.13's explorer-fallback removal was found to be non-functional before its first device run (see "Bug found and fixed," above) -- the regex never matched anything, so F10.13 as originally built would have launched identically to F10.12. F10.12's own result (`0000000A`) is unaffected by this, since F10.12 never claimed to remove the fallback. But it means the Wine-launch bisection has not yet actually tested a no-explorer-fallback path on device; F10.13 (corrected) is the first build that will.

F10.14 is the discriminator none of F10.7 through F10.13 provided: every one of those varied something inside the JIT core; none swapped the core itself, despite a never-used non-JIT interpreter (`boxedwine-f83-fallback/`) sitting in the repo the whole time. F10.13 (corrected) and F10.14 share an identical launch shape and differ only in CPU core -- whichever one boots WinMUGEN and whichever one doesn't will tell us, for the first time, whether this project's entire seven-test bisection has been diagnosing the JIT or diagnosing something upstream of it that both cores share.

---

## Process rules

One hypothesis → one build → one phone test → one conclusion.

Do not promote synthetic FPS, CI success, headless verification or engine initialisation as a runtime win. Headless Chromium is useful for proving a boot path deterministically and cheaply; it is **not** a performance witness and not a substitute for the phone. The iPhone Safari witness decides actual WinMUGEN stability and performance.

After a pass, update this file: the test link, the device witness log, any answered question, and any finding this pass disproved.
