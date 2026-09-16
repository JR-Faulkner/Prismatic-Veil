# MOBMUGEN / RIG F — FAI STATUS UPDATE

Date: 2026-09-16
Repository: `JR-Faulkner/Prismatic-Veil`
Primary test device: iPhone Safari
Goal: real WinMUGEN in browser at 60 FPS, with device witness as final runtime authority.

## Current authority

The project is no longer blocked on basic browser boot. F10.1 reached an actual fight on iPhone Safari using the proven legacy BoxedWine/Wine path.

Known-good survival stack from F10.1/F10.3:
- WinMUGEN capsule: `mole` vs `G.Ken`
- stage: `cfjed_warzard`
- sound disabled
- 16 bpp
- fixed 512 MB BoxedWine heap
- lean app footprint around 203.7 MB expanded
- Wine root: `fullWine1.7.55-v8.zip`
- Wine overlay: `wine1.7.55-v8-min-online.zip`
- iPhone Safari is the final runtime witness

## F10.3 result

F10.3 used RAF hybrid scheduling and added real present instrumentation.

Device snapshot:
- `L=2`
- `GL=3`
- `SDL=0`
- `ALL=3`
- `X=4`

Interpretation: adding more emulator work inside each RAF callback did not create more visible frames. It blocked the frame callback and exposed a CPU/emulation throughput ceiling in the old web core.

## JIT investigation

A newer BoxedWine single-threaded SIMD WASM-JIT core was built from pinned upstream source:
- upstream: `danoon2/Boxedwine`
- upstream SHA: `ba68d801e40fa3fc8ceeb5eec776cf4a8bdf81cf`
- target: `make jit`
- CPU backend: `BOXEDWINE_WASM_JIT`
- SIMD: `-msimd128`
- no SharedArrayBuffer requirement for this single-threaded build

Staged runtime commit:
`1c7672bfdf220af7b5ec2ffd315b60d162ea5e31`

## F10.4 result

F10.4 proved the new JIT engine itself can initialize in iPhone Safari. The trace reached:
- `F10.4 JIT ENGINE · upstream ba68d801 · SIMD128 · single-threaded JIT`
- `WASM-JIT RUNNING`
- browser RAF witness around `61`

But F10.4 changed too many variables at once. It also switched to the modern Wine 11 root and a new mount path. That root failed to mount:
- `Could not load zip file: boxedwine-wine11.zip`
- `Could not find /bin/wine`
- BoxedWine shutdown before WinMUGEN could start

Therefore F10.4 is NOT a WinMUGEN performance result. It is only evidence that the SIMD JIT web core starts successfully on the iPhone.

## F10.5 experiment

F10.5 corrects the experiment design.

Intent:
- keep the SIMD WASM-JIT CPU core
- restore the proven Wine 1.7.55 root and overlay
- keep the same two-character capsule and stage
- keep sound off and 16 bpp
- avoid unrelated renderer/content changes

Root:
`fullWine1.7.55-v8.zip`

Overlay:
`wine1.7.55-v8-min-online.zip`

Expected page:
`mugen-lab/rig-f10-5.html`

The test is successful only if WinMUGEN itself launches and progresses. A JIT-engine boot without `/bin/wine` or without WinMUGEN video is not success.

## FAI investigation lane

FAI may independently inspect and propose improvements, but should preserve the working F10.1/F10.3 content/runtime assumptions unless a change is explicitly isolated.

Highest-value questions:
1. Can the SIMD WASM-JIT core run against the proven Wine 1.7.55 root cleanly?
2. Can the old BrowserFS/lean app mount semantics be reproduced on the new JIT core without a second full app copy in memory?
3. Is there a safe way to decouple emulator CPU work from browser presentation while retaining RAF-friendly rendering?
4. Does current upstream BoxedWine expose a faster single-threaded JIT configuration, JIT cache path, or SIMD option that works in iPhone Safari?
5. Can a multithreaded JIT path be made viable under iOS/Safari constraints without relying on unsupported cross-origin isolation assumptions?
6. Where is the actual WinMUGEN GL present path in the modern JIT build, and can it be instrumented directly for real FPS rather than proxy counters?

## Process rule

One hypothesis -> one build -> one phone test -> one conclusion.

Do not promote synthetic FPS, CI success, or engine initialization as a runtime win. The iPhone Safari witness decides actual WinMUGEN stability and performance.
