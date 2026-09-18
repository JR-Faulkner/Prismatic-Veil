# Ikemen Lane — FAI Live Notes

Date: 2026-09-17

This file is the short live handoff for FAI. It is deliberately scoped to the current Ikemen lane status and should not be mixed with `mugen-lab/LIVE.md`, which is the separate BoxedWine/Wine lane.

## Current anchor

**Test next: RIG I16 TRACE PIN.**

`https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-16.html?v=i16-trace-pin`

**I13 and I14 got their first real phone test on I15, and both held.**
The user played a full round on the real 1.7GB roster (P1=G.Ken vs
P2=Peter Griffin) and landed an actual quarter-circle-forward special
move — confirmed directly in the returned trace: `ArrowDown` rolling into
the `DR` diagonal, rolling into pure `ArrowRight`, then a punch, exactly
the motion I14's d-pad-roll fix exists to enable. I13's routing fix also
held with zero `routed to PICKER` lines appearing mid-match. **Both are
now real-device confirmed, not just headless-clean.**

I15's load-gate overlay also displayed correctly on the phone (screenshot
confirmed "NOW LOADING…" rendered over a black canvas), but the user still
reported the match felt delayed — plausibly the same main-thread-block
question I15's own diagnosis flagged as unconfirmed, but this could not be
verified because **the load-overlay's own timing lines never made it into
the returned trace** — a wall of ~300 "Failed to add stage"/"blank" roster
noise lines (already-documented, don't-fix) rotated them out of the
700-line rolling buffer before COPY TRACE was pressed. Separately, the
control trace lines all read `I14 CTRL`/`I14 CONTROLS` despite running on
I15 — cosmetic (I15's own code was genuinely running; the label was a
build artifact), but confusing and needed fixing at the root before it
kept recurring on every future build.

I16 fixes both, with zero behavior changes: the load-overlay shown/removed
events are now `pin()`ned (the same append-capped, rotation-proof
mechanism every other milestone in this file already uses), and every
`I<N>`-prefixed log line — including the ones this session itself
introduced — is now baked into the patch text with the correct final
label at Node build time, not left depending on a runtime `replaceAll`
pass that patch-injected text can never actually reach (see the trap note
below; it bit three separate times across I15 and this build before being
fixed at the root instead of patched around again).

**Still needed from a phone test:** the actual `I<N> LOAD OVERLAY ·
removed after <N>ms` number, now that it will actually survive to
COPY TRACE.

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

## I15 — load gate (canvas-exposed-before-ready)

**Reported by the user directly, from a real phone test of I14**: "the
screen itself and game load was delayed the match started, but I was
already getting hit (black screen before)." Not a control defect — this
is a different system (boot/reveal timing), so it gets its own build per
the same one-system-at-a-time discipline, even though it landed the same
day as I14.

### Root cause

`#setup` (the overlay holding the file picker and character picker) gets
hidden — which is what exposes the canvas underneath — the INSTANT
`startMatch()` runs, in `startMatch()` itself:

```js
document.getElementById('setup').classList.add('hide');
boot();
```

`boot()` is only just starting at that point: it hasn't fetched
`wasm_exec.js`, hasn't fetched or instantiated the `.wasm` module, and the
Go engine hasn't run a single frame. All of that — WASM instantiation,
`go.run()` starting, the engine's own round setup, and on a real roster
zip, the lazy-VFS decompression of both fighters' full sprite/sound data
the first time the engine opens those files — happens on a canvas that is
already visible and already black, with nothing telling the player
anything is in progress. There's a SECOND, redundant `setup.classList
.add('hide')` later in `boot()` right after WASM instantiates, which does
nothing (already hidden) — worth knowing about since it's easy to mistake
for the real reveal point, which is what the first pass of this diagnosis
did.

### The fix

A `LOADING MATCH…` overlay (`position:absolute;inset:0;z-index:6`,
appended into `.stage`, above both the canvas and `#setup`'s own z-index)
is shown by `showMatchLoadingOverlay()` at the exact same statement that
hides `#setup`:

```js
document.getElementById('setup').classList.add('hide');
showMatchLoadingOverlay();
boot();
```

It removes itself once loading looks settled: `lazyMaterialize()` (the
function that decompresses a chars/stages/sound entry on first access) now
pings a small listener list on every call, and the overlay arms a 350ms
"quiet" timer on every ping, removing itself once 350ms passes with no new
activity. A 4500ms hard cap exists as a fallback in case nothing ever
pings (e.g. every needed asset was already loaded eagerly).

Verified directly with a `MutationObserver` timing the real DOM, not
polling from outside: the overlay is added **7–8ms** after `startMatch()`
runs, reproduced twice, consistent — meaning it paints before any of the
heavy work below begins. It is confirmed to be the actual topmost element
over the canvas center (not just present in the DOM), shows readable text,
and removes itself correctly with the reason logged to trace.

### A separate, bigger finding this surfaced

While verifying settle timing, a heartbeat probe (a free-running
`setInterval` alongside boot) found the main JS thread **synchronously
blocked for ~10.6 seconds** during `boot()` — on the tiny 2-character test
zip, in this headless/software-rendered container, not the user's real
install. During a genuine synchronous block, **no DOM change can be
painted, regardless of what JS exists** — this is a hard browser
constraint, not something any amount of overlay code can work around.

This reframes what the fix actually guarantees: the overlay can't make
loading *faster*, and it can't guarantee it's visible *throughout* a
block the browser itself can't paint during — what it guarantees is that
it is already painted **before** such a block begins (confirmed: 7–8ms,
long before any heavy work starts) and remains queued for removal the
moment the browser can act again. A stuck "LOADING MATCH…" screen for the
full length of a real block is the *correct* outcome here, not a bug — the
alternative is exactly the reported symptom, an unmarked black screen the
player can be hit behind.

**This 10.6s block itself is unverified against real hardware and may be a
headless/software-rendering artifact specific to this container** — this
codebase has already hit that exact class of false signal once before (see
the root `CLAUDE.md`'s note on a single black screenshot during a
different game's camera push, which turned out to be a software-WebGL
timing artifact, not a real bug). It could equally be a genuine
`WebAssembly.instantiateStreaming` cost that's just smaller on real
hardware, or something else specific to this environment. It has NOT been
chased further — diagnosing it precisely would mean instrumenting inside
`boot()`'s WASM instantiate/`go.run()` call, which starts to cross into
territory this session didn't have time to fully isolate. If the load gate
still looks stuck for many seconds on the real 1.7GB zip, that block is
the next thing to measure directly (a phone-side heartbeat probe, same
technique used here), not something to guess at.

### Verified

13/14 automated checks pass. The one non-pass is the test's own wrong
assumption — it asserted overlay removal would happen in well under
4000ms on a small zip, which turned out to depend on the same ~10.6s
main-thread block above, not on anything the fix does. The correctness
properties that actually matter — right reveal point patched, appears in
the same tick as `#setup` hiding (confirmed 7–8ms via `MutationObserver`,
reproduced twice), is genuinely the topmost visible element, removes
itself with a logged reason, and I14's control fixes still pass 3/3
regression checks rerun against I15 — all hold.

### What to look for on the phone

```
I15 LOAD OVERLAY · shown -- covering canvas until asset loading settles ...
I15 LOAD OVERLAY · removed after <N>ms (<reason>), <M> lazy asset(s) materialized during load
```

The real questions this build exists to answer: does `<N>` come back
reasonable on the real zip (hundreds of ms to a few seconds, not tens of
seconds), and — the actual bug report — is there ANY window between
tapping START MATCH and the loading screen appearing where a black canvas
is visible? If `<N>` is large, that's the same main-thread-block question
above, now with real data instead of a headless guess.

## I16 — trace pin + the recurring "I3 " patch-text trap

Small, zero-behavior-change build fixing two observability gaps found
while reading I15's real phone-test trace.

### What was wrong

1. **Load-overlay events weren't pinned.** `showMatchLoadingOverlay()`
   used `log(...)` only. On a real ~1.7GB roster the "known runtime noise"
   (hundreds of `Failed to add stage`/`Failed to add char: blank` lines,
   already documented above as real-but-not-the-target) floods the
   rolling 700-line `lines` buffer fast enough that the load-timing
   evidence — the entire point of I15 — rotated out before COPY TRACE was
   even pressed. `pin()` (append-only, capped at 60, exists specifically
   to survive this) already covers every other milestone in this file;
   the overlay should have used it from the start.
2. **Control trace lines read `I14 CTRL`/`I14 CONTROLS` while running
   I15.** Not a functional bug — I15's own code was genuinely executing —
   but confusing, and it would have kept happening on every future build
   built the same way (extracting a prior rig's already-generated control
   patch and reusing it verbatim).

### The actual trap, and why it took three tries

Every rig wrapper does this at the top, once, against the freshly fetched
base text:

```js
src = src.replaceAll('I3 ', 'I16 ');
```

That pass runs over the ORIGINAL fetched `rig-ikemen-3.js` source. Any
`src.replace(patchOld, patchNew)` call comes AFTER it. So if `patchNew`
— text a build script is INJECTING, not text already present in the base
file — contains a literal `'I3 '` or a stale prior rig's number, **it
never goes through that relabeling pass and keeps whatever string was
typed into the patch, forever.**

This bit three times in a row before being fixed at the root:

- I15's WASM-instantiated reveal-point patch initially said `'I3 WASM
  INSTANTIATED'` in its own replacement text, expecting the top-of-file
  pass to relabel it — it doesn't, because the patch is spliced in after
  that pass already ran. (Caught and fixed same-session, before shipping.)
- I16's first draft copied I14's hardcoded `'I14 CTRL'` text and tried to
  "fix" it by swapping in a generic `'I3 CTRL'` placeholder, hoping the
  same top-of-file pass would relabel it in I16 — it doesn't, for the
  identical reason. (Caught by the verification suite before shipping:
  the trace literally read `I3 LOAD OVERLAY · removed...`.)
- The load-overlay's own `pin()`/`log()` calls made the exact same mistake
  independently, in the same build.

**The only correct fix**: any label text a build script generates for
NEW patch content must have the real, final rig number baked in directly
at Node build time (a `const RIG = 'I16'` in the build script, used via
string concatenation when constructing the patch's replacement text) —
never left as a runtime placeholder hoping a `replaceAll` will reach it.
Text that was ALREADY part of the base file before any patching (like the
base's own `'I3 WASM INSTANTIATED'` log line, untouched) is fine and does
get relabeled correctly by the existing top-of-file pass — the trap is
specifically about text a patch is ADDING.

**Whoever builds I17+ this same way (extracting a prior rig's already-
generated patch text and reusing it) needs to grep the extracted text for
any `I<number> ` literal before splicing it into a new build**, or use a
`RIG` constant and rebuild the label from a generic template kept
separately, rather than extracting post-substitution text repeatedly.

### Verified

9/9 checks: labels correctly read `I16 CTRL`/`I16 LOAD OVERLAY` with zero
stale `I14`/`I15`/`I3` text; the pinned load-overlay shown/removed lines
survive an injected flood of 900 noise lines (simulating the real
device's roster noise) in both the PINNED section and the clipboard-copy
path; I14's refcount and roll fixes both rerun clean. No behavior changed
— this build only affects what the trace reports, not what the engine or
controls do.

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

I16 exists and is the thing to test now — it supersedes I15 as the anchor.
Do not build I17 until I16 has had a phone test.

**I13 and I14 are DONE — real-device confirmed, per the anchor section
above.** A real quarter-circle special move landed on the actual phone,
against the actual 1.7GB roster. Do not re-litigate the routing fix or
the refcount/roll fixes without a new, specific symptom; treat them as
closed.

**I15's load-gate fix is functionally unconfirmed** — the overlay itself
displayed correctly (screenshot evidence), but whether its timing is
reasonable is still unknown, because the one number that would answer
that got rotated out of the trace before it could be read. That is the
single thing I16 exists to fix, and it changes nothing else. The next
phone test's whole job is: report the `I<N> LOAD OVERLAY · removed after
<N>ms (<reason>)` line from the PINNED section.

- A reasonable `<N>` (hundreds of ms to a couple seconds) closes I15's
  defect outright — the perceived "delayed, started before I could see
  it" feeling was likely just... loading taking a few real seconds, now
  correctly covered, not a new bug.
- A large `<N>` (many seconds) means the main-thread-block finding from
  I15's diagnosis is real on hardware, not a headless artifact. That
  becomes its own follow-up (instrumenting inside `boot()`'s WASM
  instantiate / `go.run()` call) — genuinely harder, and should get its
  own dedicated build once confirmed necessary, not be guessed at now.

If quarter-circles still don't come out in actual play despite I14's fix
holding for a hadouken already: that is very likely Ikemen's own
motion-buffer timing on a specific motion, not this control layer. Get a
full trace of the specific failed attempt before assuming a code path is
wrong — don't re-open I14.

Once I16's number comes back and I15's status is known either way: the
control and boot-visibility layers are done for now. Move to the next
phase (collapsing the wrapper chain into one clean file, then GUI
beautification) rather than inventing more work in either system.
