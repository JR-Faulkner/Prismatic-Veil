# Ikemen Lane — FAI Live Notes

Date: 2026-09-17

This file is the short live handoff for FAI. It is deliberately scoped to the current Ikemen lane status and should not be mixed with `mugen-lab/LIVE.md`, which is the separate BoxedWine/Wine lane.

## Current anchor

**RIG I20 QUIET SELECT — CONFIRMED PLAYABLE ON REAL HARDWARE.**

`https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-20.html?v=i20-quiet-select`

**This is the first real, playable match this lane has ever produced on
the phone.** Real device (iPhone, iOS 18.7, Safari 26.6, saved 1.7GB
WinMugen.zip, installed as a web app), GodRugal vs G.Ken on
`stages/macalania.def`: match loaded, both characters rendered, lifebars
and round timer live, and sustained real gameplay input — the CTRL log
is full of quarter-circle motions (`ArrowDown` → `DR` → `KeyC`) and ran
long enough to hit the 240-entry `CTRL_LOG_MAX` cap. No crash, no hang,
no OS-level tab kill.

What the winning trace proves, specifically:

- `I20 SELECT TRIM · select.def [Characters] trimmed to 2 line(s) for
  this match, 766 other roster entries dropped`. Note 766, not 158 —
  `parseSelectDef` only counts *real* names (it skips
  `randomselect`/`blank`/`skipslot`), so roughly 610 of those dropped
  lines were screenpack grid placeholders. The trim removes both classes.
- **The `Failed to add char: blank` wall is completely gone.** That noise
  appeared in every prior run in this lane and was documented under
  "Known runtime noise" below as harmless; it was actually the visible
  symptom of the engine walking the full roster. Zero instances now.
- Every character warning in the trace is for GodRugal or G.Ken — the two
  picked. No un-picked character's files are opened at all, which is the
  direct fix for the I19 trace's "29 assets loaded — GodRugal.def" while
  fighting mole vs G.Ken.
- Peak own-VFS: **238.2MB across 419 files**, 52 lazy assets for the
  entire match load. The 300MB budget was never reached, so **no `EVICT`
  line fired at all this run** — compare I19, which sat pinned against
  that ceiling (12+ evictions, 299MB sustained, 75+ assets and still
  climbing at the equivalent checkpoint). I19's eviction stays armed as a
  safety net for heavier pairings; it simply had nothing to do here.

**Still open (cosmetic, not blocking):** the `Failed to add stage. File
read error: stages/.def` wall is still present — hundreds of lines. Those
are `[ExtraStages]`' own blank entries (335 extra-stage lines in this
select.def), deliberately left untouched in I20 (see **I20 — quiet
select.def** below for why). Not hurting anything at the current memory
headroom, but it does confirm the engine still walks that whole list. See
**Recommended next build** for the I21 option.

I19's own phone test (mole/G.Ken, real trace, fresh reload, closed other
apps first) proved two things at once. First, LRU eviction genuinely
works: own-VFS bytes plateaued in a tight band (276–300MB) for the entire
match-load window instead of I18's unbounded climb to 757.8MB+ — repeated
`I19 EVICT ·` lines show it actively reclaiming and re-capping, exactly
as designed. Second, it still crashed anyway (Safari's own "A problem
repeatedly occurred" recovery page), which means the real memory driver
had already moved to a pool I19 can't see or touch: the mid-load screen
read **"29 assets loaded — GodRugal.def"** — a real character nobody
picked (P1/P2 were mole/G.Ken) — proving Ikemen's own internal
full-roster reparse (previously assumed to be cheap, near-instant
failures on blank/placeholder select.def lines — see "Known runtime
noise" below) actually opens and decodes real character data for
characters never selected. Every one of those goes through Go's own
sff/sprite decode and WebGL texture upload path, which lives in WASM
linear memory and GPU memory, entirely outside `vfsFiles` — my own
`evictIfOverBudget()` was never able to touch it, capped or not.

**I20 stops the engine from ever opening those files at all**, instead of
trying to recycle copies of them after the fact. Right before `boot()` is
called (in `startMatch()`, using the already-known picked names), the
eager-resident `data/select.def` is rewritten in place: every line in its
`[Characters]` section is dropped unless its first field matches P1 or
P2 exactly (same first-field parsing `parseSelectDef` already uses, so
the two stay in lockstep). Every other section — `[Options]`,
`[ExtraStages]`, `[Music]`, anything else — passes through byte-for-byte
untouched; this build deliberately does not touch `[ExtraStages]` (see
below). Since `select.def` is eager-loaded (under `data/`), the rewrite
is a plain `vfsPutFile()` call on an already-resident path — no zip/lazy
plumbing involved. Logged as `I20 SELECT TRIM · select.def [Characters]
trimmed to N line(s) for this match, M other roster entries dropped`.

One correctness fix rode along: `vfsPutFile()` never subtracted a path's
old byte count before adding the new one on an overwrite — harmless until
now because nothing ever overwrote an existing path, but I20's trim is
the first thing that does, and `vfsMemoryBytes` accuracy matters since
eviction decisions depend on it.

**Why `[ExtraStages]` is deliberately left alone in this build:** the CLI
already gets `-s <realStagePath>` explicitly, so the match's own stage
never depends on what's listed in `[ExtraStages]` — but it isn't yet known
whether Ikemen's internal init cross-validates the CLI stage arg against
that list before accepting it. Isolating this to characters-only keeps it
to one specific, testable change, per this file's own "one defect, one
build, one phone test" rule (see below). Trimming stages is the natural
next step if characters-only doesn't fully resolve the crash.

Verified before this phone test: a standalone Node unit test of
`trimSelectDefForMatch()` against a realistic synthetic select.def
(covering comments after real fields, `[Options]`/`[ExtraStages]`/
`[Music]` surviving untouched, `randomselect`/`blank` placeholder lines,
and the P1-equals-P2 mirror-match case collapsing to one kept line, not
two); the exact runtime `.replace()` pipeline simulated in Node against
the real base file and syntax-checked; a real headless-browser run
against the PriZim synthetic fixture, which directly confirmed the
mechanism end-to-end — the fixture's own placeholder roster entries
(`zzznotreal1/2/3`, previously spamming "Failed to add char" in every
prior rig's console) no longer appear at all once `I20 SELECT TRIM` runs.
See **I20 — quiet select.def** below.

I18's instrumentation and I19's LRU eviction both carry forward
unchanged and stay active — I20 is additive, not a replacement. If I20
still crashes, the next diagnostic step is checking whether it crashes
later / at a higher asset count than I19 did (partial win, budget or
`[ExtraStages]` still contributing) or at effectively the same point
(the internal reparse touches real assets some other way this doesn't
reach, or the crash was never about the roster reparse at all).

**Also active: `tools/prizim/mobmugen-ikemen/`**, a three-layer automated
harness (static preflight, Playwright runtime probe, real-trace
analyzer) mirroring the BoxedWine lane's own PriZim setup. It catches the
recurring stale-label class of bug mechanically now — verified against a
deliberately reintroduced copy of the exact bug that shipped in I16
twice. It cannot reproduce the iOS Safari memory question I18 was built
to answer; a phone witness stays required for that, same limitation
PriZim's own BoxedWine doc already states for its lane. See
`docs/PRIZIM_MOBMUGEN_IKEMEN.md`.

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

## I17 — the overlay disappeared before the real load even started

Diagnosed from the user's own real phone trace of I16 (P1=GoD_Ryu,
P2=homero, both large, heavily-edited custom characters). Two distinct
bugs, found in the same read.

### Bug 1: the settle heuristic couldn't tell "not started" from "done"

The trace's own numbers say it directly:

```
I16 LOAD OVERLAY · shown -- ...
I16 LOAD OVERLAY · removed after 357ms (asset loading settled), 0 lazy asset(s) materialized during load
```

**Zero assets materialized, and it removed itself anyway.** The 350ms
quiet timer armed at show-time and nothing had touched `zipIndex` yet by
the time it fired — not because loading was done, but because the engine
was still churning through Ikemen's own internal re-parse of the full,
unfiltered `select.def` (the ~150 `blank`/malformed entries already
documented under **Known runtime noise** below). None of those misses
touch `zipIndex` (a `blank` slot has no real file to find), so none of
them ping the overlay's activity listener. From the overlay's point of
view, total silence for 350ms looked identical whether "nothing has
started" or "everything is finished" — it could not tell those apart, and
guessed wrong.

After that false-positive removal, the ACTUAL expensive work — Ikemen
opening `chars/GoD_Ryu/GoD_Ryu.sff` and `chars/homero/homero.sff` (full
sprite sheets) plus every `.snd`/`.cns`/`.cmd`/`.air` file each heavily-
edited character needs, each one synchronously decompressed via
`fflate.inflateSync()` inside `lazyMaterialize()` — happened on a canvas
that was already exposed, with nothing telling the player anything was
in progress. Reported directly: "shouldn't be taking 2 minute loading,"
correctly reading it as no visible sign of work happening. This is the
exact symptom I15 exists to prevent, reintroduced by a different bug in
I15's own removal logic rather than by the original reveal-point mistake
(which stayed fixed).

### The fix

1. **The settle timer may only actually remove the overlay once at least
   one real asset has been materialized.** If it fires while
   `lazyActivity.count` is still at its start-of-show value, it just
   re-arms instead of removing — silence before the first real hit no
   longer reads as "done."
2. **Quiet window widened 350ms → 900ms**, tolerating a bigger real gap
   between (for example) finishing P1's assets and starting P2's without
   misreading it as settled.
3. **Hard cap widened 4500ms → 180000ms (3 minutes).** The old value
   assumed all loading is fast; it visibly isn't, for large edited
   characters, and a premature hard-cap removal is the same bug through a
   different door. The cap still exists purely as a "something is actually
   broken" backstop — verified directly (see below) to still fire when
   nothing ever loads at all.
4. **Live progress added to the overlay itself**: an updating line
   showing asset count and the current file's name, refreshed on every
   real load, specifically because a real 1-3 minute wait with a fully
   static screen reads as broken even when it's working correctly.

### Bug 2: two more instances of the exact label-leak trap I16 documented

`selectNew`'s picker-selection logs and `bindNew`'s `pickerCommit()` log
line were STILL hardcoded `'I14 PICKER'` under I16 — confirmed directly in
the real trace (`I14 PICKER · P1 selected...` while I16 was running).
I16's own writeup diagnosed this exact class of bug for CTRL/CONTROLS
text and fixed it there — but the verification suite that shipped with
I16 only asserted on CTRL/CONTROLS strings, not PICKER strings, so a
second (and third — `pickerCommit()`'s line lives inside `bindNew`, a
different function than `selectNew`) instance of the identical mistake
shipped anyway.

Fixed the same way (bake the real label in via the `RIG` build-time
constant), but this time **the verification greps the entire generated
file for any `I<number>` literal that isn't the current rig**, rather than
checking a fixed list of known-about label sites. A fixed list is exactly
what let two instances slip through I16 despite the trap already being
documented — a generic sweep is the only check that scales as more
patches accumulate copy-pasted log lines across future rigs.

### Verified

- **Algorithm, directly**: the exact shipped overlay function was
  extracted and driven with a synthetic, time-compressed activity
  timeline (real ms constants unchanged; wall-clock scaled 60x so the
  test finishes in seconds) through four scenarios — silence before any
  real load starts (must not remove), a long real load trickling in
  (must stay up and show live progress), real settling after activity
  stops (must remove, with the correct asset count, via the settle path
  not the hard cap), and a load that never produces any activity at all
  (the hard cap must still eventually release it). All four hold on the
  actual code that ships, not a re-implementation of it.
- **Labels, generically**: grepped the whole generated file for any
  `I1[3-6]`-prefixed literal; zero found outside one intentional prose
  reference in the READY message ("on top of I13/I14/I15/I16 fixes").
- **Regression**: I14's roll fix and I13's routing (no `routed to PICKER`
  once in-match) both rerun clean against I17.

### What to look for on the phone

Same GoD_Ryu/homero pairing if possible, so the comparison to I16's trace
is direct. Check:

- Does `I17 LOAD OVERLAY · removed after <N>ms` now report a plausible
  count of real assets (dozens, for two full characters) instead of 0?
- Does the on-screen overlay text visibly update with a file name and
  count while the real ~1-3 minute load runs, instead of sitting static?
- Does the removal reason read `asset loading settled`, not
  `hard timeout`? A hard-timeout removal on a genuinely still-loading
  match means 3 minutes wasn't enough margin and the constant needs
  raising further, not that the approach is wrong.

## I18 — memory witness

Zero behavior change. Exists to answer, with real numbers instead of a
guess, the open question from the mole/G.Ken crash trace: was that
actually memory pressure.

### Why `performance.memory` alone isn't enough

`performance.memory.usedJSHeapSize` is a real, useful number where it
exists — but it is a **Chrome/Blink-only, non-standard API. iOS Safari
does not implement it.** Building instrumentation that only reports this
would ship a build that answers nothing on the one device this question
is actually about. Verified directly in the runtime probe's headless
Chromium run: `performance.memory` returns real numbers there, which is
useful for local/CI verification, but that is not evidence it will do
the same on a phone.

### The real signal: this app's own byte accounting

Nothing in this codebase ever evicts a decompressed file from `vfsFiles`
— every entry `vfsPutFile()` has ever stored stays resident for the life
of the page. That means summing `.data.length` across every call is an
**exact, platform-independent measurement of this app's own contribution
to memory pressure**, with no dependency on any experimental browser API.
It won't see WASM's own heap, WebGL texture memory, or anything Go's
runtime allocates internally — but it directly measures the exact
mechanism the crash hypothesis names: unbounded decompressed-byte
accumulation with no cleanup.

`reportMemory(label)` reports both numbers together, every time: the
VFS byte total (with file count and the single largest file, in case one
oversized sprite sheet turns out to matter more than cumulative volume),
and the JS heap figure when available, explicitly labeled as
Chrome-only/unavailable-on-iOS-Safari when it isn't. Example, from a
real run:

```
I18 MEMORY · match load asset loading settled -- own VFS: 23.7MB across
137 file(s) (largest: 8.7MB data/ikemen1/system.sff) | JS heap
(Chrome/Blink only, unavailable on iOS Safari): 162.7MB used / 4095.8MB
limit
```

### Checkpoints, and why the eager-loop one matters most

- **Every 20 files during the eager-load loop itself** — the exact loop
  that was running when the mole/G.Ken trace went silent at
  `RUNTIME STATUS · LOADING 200` with zero memory data to show for it.
  Without a checkpoint inside this specific loop, a crash here again
  would leave this build exactly as blind as I17 was.
- Once, right after eager load finishes (baseline before any
  character-specific data starts).
- Once, right when the match-load overlay first shows (baseline for
  whatever character loading follows).
- Every 15 real lazy-loaded assets during a match load, piggybacked on
  the overlay's existing progress-pin cadence rather than adding a
  second parallel reporting mechanism.
- Once, whenever the overlay is removed (settled or hard-timeout),
  labeled with the removal reason.

All of these are `pin()`ned, not just `log()`ged — the same lesson from
I16: a real roster's noise (hundreds of `blank`/`stage` lines) will
rotate a merely-logged checkpoint out of the trace before COPY TRACE is
even pressed. These survive that.

### A build-time bug this build found in itself, twice

Two real mistakes were made and caught before shipping, worth recording
because they're a variant of the recurring `I3 `-in-patch-text trap
already documented under I16, not a new class of bug:

1. **`eagerDoneOld`/`eagerDoneNew` initially kept the literal `'I3 ZIP'`
   text** in the RUNTIME constants (not just the build-time base-check
   constants) — the same "text added via a patch never sees the
   wrapper's own top-of-file `replaceAll('I3 ', 'I18 ')` pass" mistake,
   this time inside a totally different patch than the ones that had
   already been fixed. Caught by this session's own new PriZim preflight
   tool, which flagged `stale rig label(s) found in rig-ikemen-18.js: I3,
   I17` before this ever reached a browser — the first real proof that
   tool earns its keep.
2. **A contraction ("this app's own") broke a single-quoted output
   string, twice, for two different reasons.** First pass: the
   replacement text was embedded directly with a single backslash before
   the apostrophe, which is genuinely correct \'-escaping semantics in a
   *single*-quoted context — but the text was sitting inside the
   wrapper's own *double*-quoted string, where `\'` is redundant
   escaping that JS collapses back down to a bare `'`, silently eating
   the backslash before it ever reached the output. The apostrophe that
   survived into the final single-quoted `log('...')` call then closed
   the string early. Fixed by using two backslashes in the wrapper's own
   double-quoted source, so the double-quote parse leaves behind exactly
   one literal backslash + apostrophe in the resulting text, for the
   single-quoted output string to interpret correctly.

   `node --check` on the wrapper file caught neither pass, because it
   only validates the WRAPPER's own syntax — never the text its
   `replace()` calls actually produce. Confirmed by writing a small
   Playwright harness that intercepts the wrapper's own network response,
   patches in a one-line hook to capture the real `src` variable right
   before `document.head.appendChild(s)`, and runs `node --check` against
   *that* — the only way to verify what a string-patch wrapper actually
   produces, as opposed to what its own source merely parses as. Worth
   keeping as a technique for any future patch that touches a log message
   containing a contraction or possessive.

### Verified

Full pipeline (preflight, runtime probe, PriZim's stale-label sweep, I13
routing, I14 refcount/roll, I15/I17 load-gate) reruns clean against I18.
The memory report line itself was confirmed present and correctly
formatted in a real run, with both the VFS figure and the Chrome-only
heap figure populated.

### What to look for on the phone

The `I18 MEMORY ·` lines, especially the one right before whatever
happens next if the crash reproduces. On iOS Safari the `JS heap` half
will almost certainly read "unavailable on this browser" — that's
expected, not a bug — read the `own VFS:` figure instead. If the crash
reproduces again during eager load, the every-20-files checkpoints
should show the VFS total climbing right up to wherever the trace goes
silent, which is the actual answer to whether this is a memory ceiling.

## I19 — LRU eviction

I18's real trace confirmed memory pressure is genuine (757.8MB and
climbing at 510 assets, hung rather than completing). I19 is the first
attempt at the actual fix, built on the exact mechanism found while
scoping it out: `entryRaw(currentZipFile, ent)` re-derives a file's raw
bytes from the user's own local `File` object (a cheap `Blob.slice` plus
`fflate.inflateSync`) — it never re-fetches over the network and never
depends on anything else in JS-heap memory. The only thing standing
between "decompressed once" and "decompressed again on demand" was
`lazyMaterialize` discarding the tiny zip-entry metadata (`ent`:
name/offset/compressed-size/method) right after first use. Keep that,
and eviction becomes safe and cheap.

### What changed

- `vfsPutFile(path, data, zipEnt)` — new third parameter, only ever
  passed by `lazyMaterialize`. Every record now also carries
  `lastAccess` (bumped on every `fs.read()`, so eviction is a real LRU
  over what the engine actually touched recently, not creation order).
- `evictIfOverBudget()` — runs after every `lazyMaterialize()` call. If
  `vfsMemoryBytes` exceeds `VFS_MEMORY_BUDGET_BYTES` (300MB), it collects
  every `vfsFiles` entry that (a) has a `zipEnt` and (b) has no
  currently-open `fd` (`anyFdOpenFor()`), sorts by `lastAccess` ascending,
  and evicts oldest-first until back under budget. Each eviction deletes
  the entry from `vfsFiles`/`vfsFilesLower`, subtracts its bytes from
  `vfsMemoryBytes`, and puts it back into `zipIndex`/`zipIndexLower` so
  the next `open()` on that path re-materializes it exactly like a
  never-before-seen file.
- Eager-bootstrap files (`data/`, `font/`, `plugins/`, root config files)
  and anything created live via `O_CREAT` have no `zipEnt` and are never
  eviction candidates — only roster content (`chars/`, `stages/`,
  `sound/`) loaded lazily through the zip is ever evicted.
- `reportMemory()` now also prints lifetime eviction totals when any have
  happened (`evicted lifetime: N file(s), X MB reclaimed`), so a real
  trace shows whether eviction ran at all and how much it reclaimed.

### Why this shouldn't thrash a hot file

LRU by construction only evicts what's least recently touched. If the
engine is re-reading the same sff every frame during a live round, that
file's `lastAccess` keeps refreshing and it is never the oldest candidate
— only genuinely cold data (most plausibly full-roster picker portraits
the player is no longer looking at, or a previous match's leftovers) is
ever reclaimed. Worst case for a wrongly-evicted-then-reopened file is
one extra inflate + one local slice-read (CPU only), not corrupted state
or a crash — confirmed safe by fs.read() copying bytes into Go's own WASM
memory before returning, so evicting the JS-side copy afterward can never
invalidate something the engine is still using.

### Verified before the phone test

A standalone Node unit test
(`tools/prizim/mobmugen-ikemen/` does not yet include it as an automated
layer — see the note in that harness's own limitations) directly
exercises the eviction algorithm with fake `vfsFiles`/`zipIndex`/`fdTable`
maps:

- an eager (no-`zipEnt`) file is never evicted even far over budget
- given three zip-backed files over budget, the oldest-by-`lastAccess`
  is evicted first and restored to `zipIndex`, newer ones survive
- a file with a currently-open `fd` is never evicted, even when it is
  the coldest candidate by `lastAccess`
- an evicted entry's original `zipEnt` survives the round trip back into
  `zipIndex`, so a subsequent `lazyMaterialize` can find it again

This proves the algorithm's logic is correct in isolation. It does
**not** prove real-device behavior — that still needs the same
mole/G.Ken/bamboo phone test I18 ran, this time watching for: does the
`own VFS:` figure now plateau near 300MB instead of climbing past
750MB, do `I19 EVICT ·` lines appear during match load, and does the
match actually complete (or hang for a different, new reason) this time.

### What to look for on the phone

- `I19 EVICT ·` lines during match load — if they never appear at all
  even as the VFS figure approaches 300MB, `evictIfOverBudget()` isn't
  running or the budget check has a bug.
- Whether `own VFS:` plateaus near 300MB instead of repeating I18's climb
  to 750MB+.
- Whether the match actually completes this time (a real `WASM
  MILESTONE`/match-start signal, not just the load overlay settling).
- Any new symptom eviction itself could cause: a texture or sound that
  looks/sounds wrong after being evicted and re-materialized (would
  indicate a bug in the re-fetch path, not the eviction decision itself),
  or a stutter right at an eviction point (re-inflating a large evicted
  file on demand is CPU work, so a big enough file being evicted and
  immediately re-requested could cost a visible frame hitch — worth
  watching for even though it would still beat a hard stop).

## I20 — quiet select.def

I19's real phone trace proved eviction works (VFS plateaued 276–300MB
the whole match-load window, repeated `I19 EVICT ·` lines reclaiming
actively) and proved the crash had already moved beyond what eviction
can touch: the mid-load screen showed "29 assets loaded — GodRugal.def"
while fighting mole vs G.Ken — a real, un-selected character's real def
file, materialized through the exact same `lazyMaterialize()` counter
mole/G.Ken's own files use. That means Ikemen's internal reparse of the
full, unfiltered `select.def` (triggered by `-loadmotif`, needed for
fonts/screen-pack scaling regardless of the quick-match `-p1`/`-p2` args)
isn't just failing fast on blank placeholder lines the way the "Known
runtime noise" section below always assumed — it's opening and decoding
real character data for characters nobody picked, each one going through
Go's own sprite decode + WebGL texture upload path, which is invisible
to and unreachable by anything on the JS/`vfsFiles` side.

### What changed

- `trimSelectDefForMatch(keepNames)` — new function, called from
  `startMatch()` with `[charNames[0], charNames[1]]` right before
  `boot()`. Reads the current (eager, already-resident) `data/select.def`
  bytes, walks it line by line with the exact same section-tracking and
  first-comma-field parsing `parseSelectDef()` already uses (so the two
  can never drift out of sync), and drops any `[Characters]` line whose
  first field isn't one of the two picked names. Every other line —
  section headers, `[Options]`, `[ExtraStages]`, `[Music]`, comments,
  blank lines — passes through completely untouched. The result is
  written back via `vfsPutFile()` on the same path, so the next time the
  engine opens `data/select.def` (which happens inside `boot()`, right
  after this call), it only ever sees two names.
- `vfsPutFile(path, data, zipEnt)` now subtracts a path's prior byte
  count before adding the new one, instead of only ever adding. This
  didn't matter before I20 because nothing ever overwrote an existing
  VFS path; it matters now because the trim does exactly that, and
  `vfsMemoryBytes` accuracy is what I19's eviction budget decisions are
  made from.

### Why this doesn't touch anything else

`data/select.def` is eager-loaded (falls under `data/` in
`isEagerBootstrap()`), so the rewrite is a plain, synchronous
`vfsPutFile()` call on a path that's already resident — no interaction
with `zipIndex`, `lazyMaterialize()`, or I19's eviction path at all
(eager files never carry a `zipEnt` and are never eviction candidates
either way). The picker screen itself already finished reading the
*original* full select.def long before `startMatch()` runs (`allChars`/
`allStages` are cached JS arrays, populated once at zip-load time, never
re-read from the VFS), so trimming the VFS copy afterward can't affect
what the picker grid showed or any later re-pick in the same session.
"CHANGE ZIP" / a full page reload both re-run `loadZipIntoVfs()` from the
untouched real zip file, so the trimmed copy never leaks into a future
attempt or corrupts the user's stored zip — it only ever exists for the
one `boot()` call it was written for.

### Why `[ExtraStages]` is untouched in this build

The CLI already passes `-s <realStagePath>` explicitly, so the actual
stage used never depends on what `[ExtraStages]` lists. What's genuinely
unknown is whether Ikemen's internal init cross-validates that CLI stage
argument against the `[ExtraStages]` list before accepting it — if it
does, and this build had also trimmed that list down to just the picked
stage, an edge case in that validation could have introduced a new
failure mode alongside removing one. Keeping this build to characters
only, per the "one defect, one build" rule below, means a phone-test
result is unambiguous: it isolates whether characters alone (the
confirmed GodRugal-class cost) get the crash point far enough out, before
touching stages too.

### Verified before this phone test

- A standalone Node unit test of `trimSelectDefForMatch()`'s exact logic
  against a realistic synthetic `select.def`: a character line with a
  trailing comment after its real fields keeps its full original line;
  `[Options]`, `[ExtraStages]`, and `[Music]` sections survive completely
  byte-for-byte; `randomselect`/`blank` placeholder lines and full-line
  comments inside `[Characters]` are handled the same way the existing
  parser already treats them; and the P1-equals-P2 mirror-match case
  collapses to exactly one kept line, not a duplicate.
- The exact runtime `.replace()` pipeline simulated in Node against the
  real base file and syntax-checked, same technique every rig since I18
  has used, including a build-time bug this technique caught directly:
  the `select.def` path regex was first written with the `$` end-anchor
  double-escaped into a literal dollar-sign match, which would have made
  `selectPath` silently fall back to `motifPath` itself instead of
  resolving to `data/select.def` — caught by comparing the simulated
  output's resolved path against the trace's own confirmed value before
  ever reaching a browser.
- A real headless-browser run against the PriZim synthetic fixture,
  which is the strongest verification here: the fixture's own placeholder
  roster entries (`zzznotreal1`, `zzznotreal2`, `zzznotreal3`), which
  spammed "Failed to add char: zzznotrealN (DEF not found)" in every
  prior rig's console output including I19's own fixture run, do not
  appear anywhere in I20's console output. `I20 SELECT TRIM · select.def
  [Characters] trimmed to 1 line(s) for this match, 4 other roster
  entries dropped` fired, and the match completed normally. This is
  direct, real (if synthetic-roster) confirmation of the actual
  mechanism, not just of the algorithm in isolation.

### Phone-test result — PASSED

Real device, GodRugal vs G.Ken on `stages/macalania.def`. Every predicted
signal came back clean:

- `I20 SELECT TRIM · trimmed to 2 line(s) for this match, 766 other
  roster entries dropped`, fired right before `ARGV` as designed.
- No un-picked character opened anywhere in the trace. Every character
  warning names GodRugal or G.Ken only — the I19 trace's
  "29 assets loaded — GodRugal.def while fighting mole vs G.Ken" class of
  event does not recur.
- `Failed to add char: blank` — the noise wall present in every prior run
  in this lane — is entirely absent.
- Match loaded, rendered, and played: lifebars, round timer, sustained
  quarter-circle input, `CTRL_LOG_MAX` cap reached from real play. No
  crash, no hang, no tab kill.
- Peak own-VFS 238.2MB / 419 files / 52 lazy assets, budget never
  reached, zero evictions needed.
- No trim-specific side effect observed: lifebar names, HUD and round
  flow all behaved normally on a two-line select.def, confirming nothing
  outside `[Characters]` depended on the full roster list.

The one thing the trim does NOT cover, as designed: `[ExtraStages]`. The
`Failed to add stage. File read error: stages/.def` wall is still present
(hundreds of lines, from that section's own blank entries), proving the
engine still walks all 335 extra-stage lines. Harmless at current memory
headroom, and the CLI `-s` stage resolved correctly throughout.

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

After boot, Ikemen parses `select.def` internally and emits many repeated lines like:

- ~~`Failed to add char: blank (DEF not found)`~~ — **gone as of I20.**
- `Failed to add stage. File read error: stages/.def` — still present.

**Correction, recorded after I20's phone test:** this section used to
call both lines harmless cosmetic spam and warn against touching them.
That was wrong in an expensive way. The spam was the *visible symptom* of
Ikemen walking the entire unfiltered roster at match boot — and that walk
was opening and decoding real character data (real sprite decode, real
WebGL texture upload, in WASM/GPU memory that no JS-side instrumentation
could see) for characters nobody selected. It was the single largest
remaining cause of the crash chain that ran from I17 through I19. Treating
it as noise for that long cost several builds' worth of investigation
aimed at the wrong pool of memory.

The char half is fixed at the source in I20 by trimming `[Characters]`
before boot, rather than by suppressing the output — which is why the
lines vanished rather than being filtered. The stage half remains for the
same reason it was left out of I20 (see **I20 — quiet select.def**), and
is a candidate for I21.

The old warning still stands in its narrow sense: earlier attempts to
*sanitize or suppress the output* caused regressions (see I7/I8 under
"Bad builds"). Fixing what the engine is asked to load is not the same
thing as filtering what it prints — the first worked, the second didn't.
**The general lesson: a wall of repeated engine errors is evidence of
work the engine is actually doing. Before filing it as cosmetic, check
what it costs.**

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

**I20 is confirmed playable on real hardware. The crash chain that ran
from I17 through I19 is closed.** Do not re-litigate the memory work:
I18's instrumentation, I19's LRU eviction, and I20's select.def trim all
stay in, all carried forward by every future rig. I19's eviction did not
need to fire in the winning run, but it stays armed for heavier pairings
and larger rosters — do not strip it out on the grounds that "it didn't
do anything," because not firing is the correct behavior under a load
that fits in budget.

**I13, I14, and I15/I17's load-gate fix all remain DONE — real-device
confirmed.** Do not re-litigate any of them without a new, specific
symptom.

There is no longer a forced next build. What follows is a menu, roughly
in order of how much each is actually worth:

1. **Play more, on more pairings.** The single most valuable next input
   is more real matches on heavier characters (hulk, GoD_Ryu, the
   BroliSSJ3-class packages) and different stages. The whole
   instrumentation stack is still live, so any new failure arrives with
   real numbers attached instead of a guess. A heavier pairing is also
   the first thing likely to make I19's eviction actually fire — worth
   watching for an `EVICT` line as a signal the budget is being
   approached again.
2. **I21: trim `[ExtraStages]` too.** The only remaining wall of noise in
   the winning trace (hundreds of `Failed to add stage. File read error:
   stages/.def`) comes from that section's blank entries, and it proves
   the engine still walks all 335 extra-stage lines. The mechanism is
   already built and proven — it is the same line filter, applied to a
   second section, keeping only the picked stage. The open question
   I20 deliberately did not answer is whether Ikemen internally
   cross-validates the CLI `-s` stage against that list before accepting
   it; since `-s` is already passed explicitly and resolved correctly in
   the winning run, the risk is low but real. Worth doing for trace
   cleanliness and extra headroom, not because anything is broken.
3. **Collapse the wrapper chain.** I20 is a single-level string-patch
   wrapper applying ten patches to `rig-ikemen-3.js` at runtime. Now that
   the result is known-good, it is a reasonable moment to bake the
   patched output into one flat file and retire the wrapper indirection.
   Do this only with the PriZim harness green before and after, and keep
   `rig-ikemen-3.js` untouched as the historical base.
4. **GUI work.** Picker portraits, HUD styling to match the Prismatic
   Veil visual language. Explicitly deferred since I13; nothing blocks it
   now.

If a future build regresses, the fastest triage is still the same three
signals in the trace, in this order: does `SELECT TRIM` fire with a
sensible dropped count, does any un-picked character appear, and does
own-VFS stay near the 238MB-ish shape the winning run had.

If quarter-circles still don't come out in actual play despite I14's fix
holding for a hadouken already: that is very likely Ikemen's own
motion-buffer timing on a specific motion, not this control layer. Get a
full trace of the specific failed attempt before assuming a code path is
wrong — don't re-open I14.

**`tools/prizim/mobmugen-ikemen/` now exists** (see `docs/
PRIZIM_MOBMUGEN_IKEMEN.md`) and runs automatically in CI on any
`rig-ikemen-*` push. Run its preflight and runtime probe locally before
manually re-deriving the same checks by hand — that tooling exists
specifically so the label-leak class of bug (see I16 and I18's own
build-time notes above) gets caught before a build ships, not after a
phone test finds it a third time. It cannot answer the memory question
above; only a phone can.

Once I18's real numbers come back: if memory pressure is confirmed,
that becomes the next build's whole focus, ahead of anything else. If
it's ruled out, or if no crash reproduces, the control and boot-
visibility layers are done for now — move to the next phase (collapsing
the wrapper chain into one clean file, then GUI beautification) rather
than inventing more work in either system.
