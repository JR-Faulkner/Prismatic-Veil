# Ikemen Lane — FAI Live Notes

Date: 2026-09-17

This file is the short live handoff for FAI. It is deliberately scoped to the current Ikemen lane status and should not be mixed with `mugen-lab/LIVE.md`, which is the separate BoxedWine/Wine lane.

## Current anchor

Use **RIG I10 CONTROL RELEASE** as the current known-good anchor:

`https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-10.html?v=i10-control-release`

I10 is the last real-device build that confirmed the important path still works:

- iPhone Safari reused the saved `WinMugen.zip` from IndexedDB.
- The real zip was `WinMugen.zip`, 1723.6 MB, 9551 entries.
- Runtime assets loaded: 129 files.
- Zip load indexed 3549 roster files and eagerly loaded 245 engine config files.
- Roster parse found 147 playable characters and 8 stages.
- Picker worked: user selected `hulk` vs `GoD_Ryu`, stage `stages/cfjed_warzard.def`.
- CLI args were correct:
  `['ikemen','-p1','hulk','-p2','GoD_Ryu','-loadmotif','data/system.def','-s','stages/cfjed_warzard.def','-p2.ai','5']`
- WASM instantiated.
- WebGL2 initialized on mobile Safari.
- Runtime reached `STILL RUNNING AFTER 5s · NO JS CRASH`.

## Active defect

The current defect to work on is **touch controls sticking or responding incorrectly after the match is running**.

Do not change zip persistence, picker flow, start flow, stage selection, `select.def`, or trace behavior while working this defect unless the test is explicitly about that area.

The next build should be I10 plus only control input instrumentation or a control fix.

Useful trace marker from I10:

`I10 CONTROLS · released ... stuck key(s)`

If the controls stick again, collect whether that marker appears. If it does not appear, the release guard is not seeing the lost/canceled touch. If it appears and the engine still behaves as if a direction/button is held, the synthetic key-up path is not clearing the Ikemen input state.

## Known runtime noise

After boot, Ikemen still parses the original `select.def` internally and emits many repeated lines like:

- `Failed to add char: blank (DEF not found)`
- `Failed to add stage. File read error: stages/.def`

This spam is real and makes the trace huge, but it is not the next target. Do not try to solve it until the active controls defect is resolved.

Earlier attempts to sanitize or suppress this caused regressions. Leave it alone unless the explicit task is roster cleanup.

## Bad builds / do not continue from these

Do not use these as bases:

- I7: attempted to sanitize `select.def` and caused picker/start regression.
- I8: preserved more of `select.def` but regressed saved-zip/start behavior; got stuck at `WAITING FOR ZIP`.
- I11: attempted trace/noise suppression as wrapper-on-wrapper and caused a non-running error.
- I12: safe-noise guard follow-up exists, but it was created after the user called out the process problem. Do not continue from it unless the explicit focus is trace/noise suppression.

## Process rule from live testing

The user explicitly corrected the process: work on the specific broken thing only.

Going forward:

1. One specific defect.
2. One specific change.
3. One build.
4. One phone test.
5. One conclusion.

Do not alter working systems while testing a different system. For example:

- If the bug is controls, do not touch zip persistence.
- If the bug is controls, do not touch picker/start.
- If the bug is controls, do not touch `select.def`.
- If the bug is controls, do not touch trace/noise cleanup.

## What already works and should be protected

These are working enough to preserve while fixing controls:

- IndexedDB persistence stores and restores the large zip without forcing re-pick.
- The zip is stored as a `File`/`Blob`; do not use `file.arrayBuffer()` on the whole zip.
- The picker can select P1, P2, and stage.
- The start flow can launch Ikemen with correct CLI quick-match args.
- The engine can instantiate and initialize WebGL2 on iPhone Safari.

## Recommended next build

Create a new build from I10, not I11/I12.

Suggested name:

`RIG I13 CONTROL WITNESS`

Goal: instrument and fix the stuck-control issue only.

Possible scoped probes:

- Log pointer lifecycle for each control button: `pointerdown`, `pointerup`, `pointercancel`, `pointerleave`, `lostpointercapture`.
- Log each synthetic keydown/keyup by code.
- Add a visible emergency `RELEASE KEYS` button only if needed for diagnosis.
- Consider a short watchdog that releases all active synthetic keys if no pointer is currently down, but only in the control layer.

Do not change any zip, picker, match-start, `select.def`, runtime asset, or noise-suppression code in that build.
