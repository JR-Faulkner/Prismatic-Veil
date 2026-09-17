# Ikemen Lane — FAI Live Notes

Date: 2026-09-17

This file is the short live handoff for FAI. It is deliberately scoped to the current Ikemen lane status and should not be mixed with `mugen-lab/LIVE.md`, which is the separate BoxedWine/Wine lane.

## Current anchor

**Test next: RIG I14 DPAD ROLL.**

`https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-14.html?v=i14-dpad-roll`

I14 carries I13's routing fix plus the two remaining control defects that
were deliberately left unfixed in I13 (see **I14 — shared-key refcounting
and d-pad rolling** below). This is a departure from strict one-defect-
per-build: the user explicitly asked to get ahead of the phone test and
land both remaining control-layer fixes in one pass rather than wait for
round-trip confirmation on I13 first. Scope discipline was kept in the
dimension that matters — everything changed is still inside the control
layer (`bindPress`/`controlKey`/the new `bindDpadGroup`), nothing in zip
persistence, picker/start flow, or `select.def` handling was touched, and
I13's routing fix and instrumentation format are carried forward unchanged.

**Neither I13 nor I14 has been phone-tested.** Both pass their full
headless suites (I13: 13/13 routing checks; I14: 13/13 new-defect checks +
13/13 of I13's routing suite rerun against it, 26/26 total). I10 remains
the last real-device-confirmed build and the fallback until one of these
gets a real test.

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

## I14 — shared-key refcounting and d-pad rolling

Fixes items 1 and 2 from the list below (item 3, double dispatch, is still
untouched — no symptom has been observed from it, so it stays out).

### Fix 1: shared key codes no longer release each other early

`controlKey(k, down)` tracked keys in a `Map<id, keyTuple>` where `id` is
built from the code, so a cardinal (`ArrowLeft`) and a diagonal macro that
also emits `ArrowLeft` (`DL` = Down+Left) collapsed to the **same map
entry**. Releasing either one deleted that entry and emitted a real
`keyup`, even if the other button holding that same code was still
physically down. Reproduced exactly as described: hold `LEFT`, tap `DL`,
lift only `DL` → `ArrowLeft` went up while `LEFT` was still down.

Replaced the presence map with `keyHolders: Map<code, Set<element>>`.
`controlKey(k, el, down)` now takes the pressing element as an explicit
argument. A real `emitKey` fires only on the holder set's 0→1 transition
(press) or 1→0 transition (release) — so two different elements holding
the same code independently track their own membership, and the code only
goes up once the *last* holder lets go.

### Fix 2: rolling across the d-pad now works

The 8 direction buttons (4 cardinals + 4 diagonal macros) were each bound
independently via the same single-button `bindPress` used for action
buttons — a `pointerdown`/`pointerup` pair with no awareness of sibling
buttons. Sliding a thumb from one cell to the next produced only the
`pointerdown` of the first cell; the destination cell never received an
event because the pointer was captured to the first button.

Added `bindDpadGroup(dpadEl, macros)`, which wires all 8 buttons in one
`.dpad` together with pointer-id-keyed state instead of one closure per
button. On `pointermove`, it calls
`document.elementFromPoint(e.clientX, e.clientY)` — valid even under
`setPointerCapture`, since capture only redirects which element *receives*
the event, not what `elementFromPoint` reports for the real screen
coordinates — and if the finger has crossed into a different direction
button within the same pad, releases the old button's codes and presses
the new one's. Verified with a continuous UP→LEFT→DOWN swipe (a
quarter-circle-shaped motion) registering all three directions in order
and leaving nothing held after lift.

Action and utility buttons (X/Y/Z/A/B/C, START/ESC) are unchanged — they
still bind individually via `bindPress`, now updated only to pass `el`
into `controlKey` for the refcounting fix.

### Verified

Both fixes were reproduced as failing on I13 first (using the same CDP
multi-touch harness as the I13 diagnosis), then confirmed fixed on I14:

| | I13 | I14 |
|---|---|---|
| hold LEFT, tap+release DL | `ArrowLeft` released early | `ArrowLeft` stays held |
| roll LEFT → DOWN, no lift | only `ArrowLeft`, `ArrowDown` never fires | `ArrowLeft` releases, `ArrowDown` presses |
| UP→LEFT→DOWN continuous swipe | not tested (same failure as above) | all three directions fire in order, nothing left held |

I13's own routing suite (picker-open routes to picker, in-match routes to
engine, CHANGE ZIP restores picker routing) was rerun against I14
unmodified and passes 13/13 — the routing fix from I13 is intact.

### What to look for on the phone

Same trace format as I13, now naming which button drove each event:

```
I14 CTRL · keydown ArrowLeft [ArrowLeft] -> engine | held: ArrowLeft
I14 CTRL · roll ArrowLeft -> ArrowDown
I14 CTRL · keyup   ArrowLeft [ArrowLeft] -> engine | held: none
```

Try an actual quarter-circle motion (down, down-forward, forward + attack)
and confirm the special move comes out. That is the real test this build
exists for — headless can prove events fire in the right order, it cannot
prove Ikemen's own motion buffer reads them as a valid input within its
timing window.

## Control defects found during I13 diagnosis — status

Reproduced while diagnosing I13's routing bug. Items 1 and 2 are fixed in
I14 (see above). Item 3 remains open and untouched.

1. ~~Buttons sharing a key code release each other early.~~ **Fixed in I14**
   via per-code holder sets (`keyHolders: Map<code, Set<element>>`).
2. ~~Sliding between d-pad buttons registers nothing.~~ **Fixed in I14**
   via `bindDpadGroup()`'s pointermove hit-testing against
   `elementFromPoint()`.
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

I13 and I14 are both built as **single-level wrappers over
`rig-ikemen-3.js`**, applying I10's original patch set plus their own
fixes directly against the base — deliberately not chained on top of each
other's wrappers, since wrapper-on-wrapper is what made I11 fail to run.

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

**Deviation for I14, by explicit user instruction:** I14 lands two control
defects (refcounting + d-pad rolling) in one build rather than one at a
time, and was started before I13 got its phone test. The user asked to get
ahead of the round-trip rather than wait. The dimension of the rule that
was kept: everything touched is still inside the control layer, nothing
in zip/picker/start/`select.def`/noise was changed, and both fixes were
proven independently (separate reproduction, separate pass/fail) even
though they shipped in the same build. If I14 sticks, that bundling is the
first thing to suspect over a genuinely new defect — a headless-clean pair
of fixes tested individually can still interact in a way neither test
alone would show, on real hardware's own timing.

## What already works and should be protected

These are working enough to preserve while fixing controls:

- IndexedDB persistence stores and restores the large zip without forcing re-pick.
- The zip is stored as a `File`/`Blob`; do not use `file.arrayBuffer()` on the whole zip.
- The picker can select P1, P2, and stage.
- The start flow can launch Ikemen with correct CLI quick-match args.
- The engine can instantiate and initialize WebGL2 on iPhone Safari.

## Recommended next build

I14 exists and is the thing to test now — it supersedes I13 as the anchor.
Do not build I15 until I14 has had a phone test and a conclusion.

If I14 comes back clean: the control layer is done for now. The only
known-open control item is #3 (double dispatch to `document`), and it has
no observed symptom — leave it alone unless one shows up. Move to the next
phase (collapsing the wrapper chain into one clean file, then GUI
beautification) rather than inventing more control work.

If I14 still sticks: the trace tells you which of the two fixes to
distrust. `I14 CTRL · roll ...` lines show every cell-to-cell transition on
the d-pad — if a roll produces the wrong destination code, that's fix #2.
If `held:` shows a code that should have cleared, filter for that code's
`keydown`/`keyup` pairs — an uneven count points at fix #1's holder-set
bookkeeping rather than a new defect. Per **What to look for on the
phone**, also check for a stray `routed to PICKER` mid-match, which would
mean I13's fix regressed rather than I14's own changes being at fault.

If I14 fixes the stuck keys but quarter-circles still don't come out in
actual play, that is very likely Ikemen's own motion-buffer timing, not
this control layer — the events are landing in order now, faithfully. Get
a full trace of a failed attempt before assuming a code path is wrong.
