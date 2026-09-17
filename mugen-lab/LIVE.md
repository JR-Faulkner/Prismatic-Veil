# MOBMUGEN / RIG F — LIVE AUTHORITY

**This is the living document for the MOBMUGEN lane.** Any agent or contributor working on `mugen-lab/` reads this first and updates it after every pass.

This lane is **separate** from the Prismatic Veil game ledgers (`PV_LIVE_AUTHORITY.json`, `PV_RESUME_ANCHOR.md`, `PRIZIM_LIVE_NOTEPAD.md`, `live-build.json`). Those govern the LIVE28K Hybrid battle stack and say nothing about MOBMUGEN. Do not cross-apply their rules.

- **Last updated:** 2026-09-17
- **F10.13 device result:** FIRST FAULT-FREE JIT-LANE DEVICE RUN. See witness log.
- **F10.13 build commit:** `21c1b84` page, `2d63eb2` script copy fallback, `10ae3a9`+`dd00bfd` bugfixes
- **F10.14 build commit:** `10ae3a9`, copy-fix `dd00bfd` -- now lower priority, see "Current conclusion"
- **Live note status:** the crash is narrowed to PE-program execution (explorer.exe or WinMugen.exe), not Wine's own loader
- **Awaiting:** device run of F10.15 (wine cmd.exe /c echo)
- **F10.15 build commit:** `93f6286`
- **Goal:** real WinMUGEN in the browser at 60 FPS on iPhone Safari.

---

## Current test link

**Working baseline (runs WinMUGEN):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-1.html

**Instrumented baseline (same build + loop cost witness):**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-6.html

**F10.13, corrected (JIT core, bare /bin/wine, no program) -- CONFIRMED FAULT-FREE ON DEVICE:**
https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-f10-13.html?v=f1013-bare-wine-copyfix

**F10.14 (non-JIT core, identical shape) -- optional now, see "Current conclusion":**
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

### F10.13 device result: first fault-free JIT-lane run

Corrected F10.13 -- bare `/bin/wine`, no program, no explorer fallback -- ran
clean on device (iPhone OS 18.7, Safari 26.6): zero page faults, Wine's own
userland printed its usage banner. See the witness log entry above for the
full trace.

This resolves the F10.13/F10.14 question before F10.14 needed to run: bare
Wine with nothing to execute was never going to exercise the code path that
faults, on either core, so F10.14 in its current form is now low information
value. It's still fine to run for completeness (expect it to also boot
clean), but it is no longer the priority.

### Next test: F10.15, find the PE-execution boundary

Every device fault this project has ever produced (F10.7-F10.10 via
`WinMugen.exe`, F10.11 via direct `/bin/wineserver`, F10.12 via the explorer
fallback) happened only once Wine tried to actually **run a PE program**.
Bare `/bin/wine` with nothing to execute does not reach that code at all --
`Config.Program.length` gates it: empty goes down the bare-wine branch just
proven clean; non-empty (`WinMugen.exe`, or `explorer.exe` via F10.12's
fallback) goes down the program-launch branch every fault has come from.

F10.15 tests the next narrower hypothesis: is the fault tied to **any PE
program actually running**, or specifically to a program that **creates a
window** (GUI/user32/GDI init, which both `WinMugen.exe` and `explorer.exe`
do)? Launch Wine against a genuine console-only PE binary already present in
the root -- `windows/system32/cmd.exe` (confirmed present at its real
`drive_c` path, not just the `lib/wine/fakedlls/` stub) -- with something
trivial like `cmd.exe /c echo F10.15-alive`.

| F10.15 result | Meaning |
| --- | --- |
| Faults (any address) | The fault is in PE loading / process creation itself (ntdll, kernel32), not GUI-specific. Every prior fault address becomes evidence about the PE loader, not about windowing. |
| Runs clean, prints output | The fault is specific to window/GUI subsystem init. Next step narrows further inside user32/GDI startup, which is where WinMUGEN's own crash would then be expected to originate. |

Same root, overlay, capsule-adjacent mount, fault witness and heap witness as
F10.13. Only the program argument changes, from empty to `cmd.exe /c echo
F10.15-alive`.

### Historical result (F10.12, superseded by the bugfix and F10.13's clean run above)

**F10.12 was run on the phone before the F10.13 explorer-fallback bug was found.**

```
RUNTIME STATUS · NO FRAMES YET · SEE TRACE
F10.12 FAULTS · 1605 faults · 1 distinct addr · 0000000A x1605
F10.12 PERF SNAPSHOT · RAF=60 DRAW=0
F10.12 HEAP · bytes=? max=? grows=0 refused=0
```

Read at the time: `/bin/wine` with no WinMUGEN program argument still
triggers `0000000A`. **Correction, 2026-09-17:** F10.12's own launch (via the
explorer fallback, since it never supplied a program either) is now known to
be a program-launch path, not a no-program path -- it and WinMUGEN.exe's
`0000000A`/`00000000` faults are both instances of "Wine ran a PE program,"
consistent with each other. F10.13's genuinely-bare run is the first real
no-program data point, and it is clean.

### Standing rule: always hand over the link

Every pass that changes anything under `mugen-lab/` ends by giving the user the current test link, with the `?v=` matching what the page actually references. Not "it's pushed" — the link.

GitHub Pages serves from `main`, and it lags a push by roughly 60–90 seconds. Before handing over a link, confirm the deployed file actually contains the change; do not hand over a link to a stale cache.

---

## Device witness log

Newest first. A run only counts if it happened on the phone.

### 2026-09-17 · F10.13 (corrected, `10ae3a9`) — DEVICE PASS, FIRST FAULT-FREE JIT-LANE RUN

iPhone OS 18.7, Safari 26.6. Same JIT core as every F10.7-F10.12 test. Only
difference from those: bare `/bin/wine` with **no** program argument and, now
genuinely (see bugfix above), **no** explorer/desktop=shell fallback.

```
Loaded fullWine1.7.55-v8.zip in 18 ms
Loaded wine1.7.55-v8-min-online.zip in 1 ms
Mounted userapp.zip in 5 ms
Launching "/bin/wine"
[WASM JIT] first JIT block executed, tableIdx: 9248
Usage: wine PROGRAM [ARGUMENTS...]   Run the specified program
       wine --help                   Display this help and exit
       wine --version                Output version information and exit
```

Zero page faults. Zero heap-witness events. Wine's own userland ran far enough
to parse argv and print its usage banner -- the JIT executed real guest code
on real hardware and did not crash.

**This narrows the fault, it does not resolve it.** Every prior JIT-lane fault
(F10.7-F10.10 via WinMUGEN.exe, F10.11 via direct wineserver, F10.12 via the
explorer fallback) happened when Wine tried to actually run a PE program.
`Config.Program.length` gates the emulator-params branch: empty means the
bare-wine path just taken; non-empty (WinMUGEN.exe, or explorer.exe via the
F10.12 fallback) means the program-launch path every prior fault came from.
**The crash lives somewhere between "no program" and "a program that creates
a window," not in Wine's own loader or the JIT core's basic operation.**

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

The old non-JIT path runs but is far too slow (~4 FPS, confirmed by F10.6; 60 needs a 15.4x speedup that no scheduling change can produce). The JIT path is the only known speed lever, and **as of F10.13 the JIT core itself is confirmed to run cleanly on device** -- Wine's loader, the SIMD codegen, and the basic emulation path all execute real guest code without faulting when there is no PE program to run. Every fault this project has ever produced on device happened specifically when Wine tried to run a PE program: `WinMugen.exe` (F10.7-F10.10, `00000000`/`0000000A`), direct `/bin/wineserver` (F10.11, `FFFFFFFF`), or `explorer.exe` via the fallback (F10.12, `0000000A`).

**Correction, 2026-09-17:** F10.13's explorer-fallback removal was found to be non-functional before its first device run (see "Bug found and fixed," above) -- the regex never matched anything, so F10.13 as originally built would have launched identically to F10.12. F10.12's own recorded result stands, since it never claimed to remove the fallback; F10.13 (corrected) is what actually tested the no-explorer, no-program path, and it is the first clean result the JIT lane has ever produced.

The open question is no longer "does the JIT fault" -- it does, but only once Wine executes a program. It is now: does it fault on **any** PE program (a PE-loader/process-creation bug), or specifically on programs that **create a window** (a GUI/user32/GDI-subsystem bug, which both `WinMugen.exe` and `explorer.exe` are)? F10.15 tests that directly with a console-only PE binary already present in the root. F10.14 (non-JIT core, same bare-no-program shape as F10.13) is now expected to also boot clean regardless of core, since that shape doesn't reach the code that faults on either core -- it remains useful as a confirmatory data point, not as the priority.

---

## Process rules

One hypothesis → one build → one phone test → one conclusion.

Do not promote synthetic FPS, CI success, headless verification or engine initialisation as a runtime win. Headless Chromium is useful for proving a boot path deterministically and cheaply; it is **not** a performance witness and not a substitute for the phone. The iPhone Safari witness decides actual WinMUGEN stability and performance.

After a pass, update this file: the test link, the device witness log, any answered question, and any finding this pass disproved.
