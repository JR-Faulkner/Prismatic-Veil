# Ikemen Lane — FAI Live Notes

Date: 2026-09-17

This file is the short live handoff for FAI. It is deliberately scoped to the current Ikemen lane status and should not be mixed with `mugen-lab/LIVE.md`, which is the separate BoxedWine/Wine lane.

## Current anchor

**Test next: RIG I13 CONTROL WITNESS.**

`https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-13.html?v=i13-control-witness`

I13 is I10 plus exactly one control-layer fix and control instrumentation.
The stuck-control defect was root-caused and fixed (see **Controls defect —
diagnosed and fixed in I13**). It passes in headless but **has not been
phone-tested yet** — until it is, I10 remains the last real-device-confirmed
build and the fallback.

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

## Controls defect — diagnosed and fixed in I13

**Root cause: `pickerOpen()` returned `true` for the entire match, so every
in-match control press was routed into the picker handler instead of the
engine.**

`startMatch()` hides the `#setup` overlay:

```js
document.getElementById('setup').classList.add('hide');
```

but `pickerOpen()` tested only the section's *own* class:

```js
const section = document.getElementById('charPickerSection');
return !!(section && !section.classList.contains('hide'));
```

`#charPickerSection` is a **child** of `#setup`. Hiding the parent never
marks the child, and nothing else re-adds `.hide` to it except
`resetForNewZip()`. So from the first zip load onward `pickerOpen()` was
permanently `true`, and `bindPress`'s `dn` took the picker branch every
time — which also explains why it returned before ever reaching
`controlKey(...)`.

That single condition produced both reported symptoms:

- **Directions stuck.** `handlePickerControl()` dispatches a bare
  `keydown` at `document` to move grid focus. It has no keyup — correctly,
  for grid navigation. Sent to a running engine it is a key pressed and
  never released, so the direction stayed held permanently.
- **Attacks did nothing.** `pickerCommit()` calls `.focus()` and `.click()`
  on an invisible roster item. Nothing is emitted to the engine at all.

It also explains why `I10 CONTROLS · released ... stuck key(s)` never
appeared in any trace: `activeControlKeys` is only written by
`controlKey()`, which the picker branch returns before reaching. The
release guard was working; it just had nothing recorded to release. **A
silent guard was evidence the emit path was never taken, not evidence the
guard was broken.**

### Measured, before and after

Driven with real multi-touch via CDP `Input.dispatchTouchEvent` against the
actual page, recording what the engine's own `document` keydown/keyup
listeners receive:

| | I10 | I13 |
|---|---|---|
| single tap on a direction | `down:ArrowLeft` and no keyup ever | `down:ArrowLeft` … `up:ArrowLeft` |
| single tap on an attack | 0 key events emitted | `down:KeyZ` … `up:KeyZ` |
| keys left held after a tap | `ArrowLeft` stuck | none |

### The fix

One condition, in the control layer:

```js
return section.offsetParent !== null;
```

`offsetParent` is `null` whenever the element **or any ancestor** is
`display:none`, so it answers the question actually being asked — is the
picker on screen right now — instead of asking whether one specific node
carries one specific class. Verified in both directions: picker presses
still drive the picker, in-match presses drive the engine, and CHANGE ZIP
puts routing back.

### Instrumentation added in I13

Every control press now logs one line, capped at 240 lines so it cannot
drown the trace:

```
I13 CTRL · press ArrowLeft routed to engine
I13 CTRL · keydown ArrowLeft -> engine | held: ArrowLeft
I13 CTRL · keyup   ArrowLeft -> engine | held: none
I13 CTRL · release via pointerup | held: none
```

**What to look for on the phone.** Every in-match press must read
`routed to engine`. A single `routed to PICKER` after START MATCH means
the fix did not take. `held:` should return to `none` after you lift. If
`held:` keeps a key listed with nothing under your thumb, the synthetic
keyup is reaching the document but not clearing Ikemen's own input state —
a different defect from this one.

No watchdog was added. A timer that force-releases keys would mask a
residual stick rather than reveal it, and the point of this build is to
find out.

## Control defects found but deliberately NOT fixed in I13

Reproduced while diagnosing the above. All three are real and all three
were left alone, because the process rule is one defect per build and the
stuck key was the defect. Each needs its own build and its own phone test.

1. **Buttons sharing a key code release each other early.** The diagonal
   macros emit the same codes as the cardinals (`DL` = `ArrowDown` +
   `ArrowLeft`), and `activeControlKeys` is a `Map` keyed by code, global
   across buttons. Hold `LEFT`, tap `DL`, release `DL` → `keyup ArrowLeft`
   fires while the `LEFT` button is still physically down. Reproduced: the
   engine ends up believing only `ArrowDown` is held. Needs a per-code
   **reference count**, not a set — release the key only when the last
   button holding it lets go.
2. **Sliding between d-pad buttons registers nothing.** Rolling a thumb
   `LEFT → DOWN` without lifting never fires `ArrowDown`; only the button
   that got `pointerdown` ever emits. This is almost certainly what the
   user means by quarter-circles being impossible — a hadouken needs
   contiguous d-pad travel. Fixing it means hit-testing pointer position
   against the d-pad on `pointermove` and swapping the active direction,
   rather than binding per button.
3. **Every press is delivered to `document` twice.** `emitKey` dispatches
   the same event at `canvas`, `document` and `window`, and the event from
   `canvas` bubbles through `document` on the way up. Harmless if Ikemen
   tracks a boolean per key; not harmless if it ever counts or toggles.
   Worth confirming against `input_js.go` before touching, since the
   triple dispatch is load-bearing for reaching the engine at all.

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

I13 is built as a **single-level wrapper over `rig-ikemen-3.js`**, applying
I10's patch set plus the one fix — deliberately not chained on top of
I10's own wrapper, since wrapper-on-wrapper is what made I11 fail to run.

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

I13 exists and is the thing to test. Do not build I14 until I13 has had a
phone test and a conclusion.

If I13 comes back clean, the next build picks **one** item from **Control
defects found but deliberately NOT fixed in I13** — recommended order: the
reference count (1), then d-pad sliding (2). Item 2 is the one the user
feels most, but it is also the larger change, so land 1 first.

If I13 still sticks, the trace answers where to look next without guessing:
read the `I13 CTRL` lines, per **What to look for on the phone**.
