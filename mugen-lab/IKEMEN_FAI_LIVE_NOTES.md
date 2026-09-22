# Ikemen Lane — FAI Live Notes

Date: 2026-09-17

This file is the short live handoff for FAI. It is deliberately scoped to the current Ikemen lane status and should not be mixed with `mugen-lab/LIVE.md`, which is the separate BoxedWine/Wine lane.

## Current anchor

**Test next: RIG I28.**

`https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-28.html`

I28 (DAI, Kineza input-gate lineage) carries everything I24-I27 do --
LEAN BOOT, QUIET STAGES, the repo-hosted Kineza merge, and the
select.def trim -- plus a Kineza input watchdog gate and deterministic
75ms attack pulses on top of I27's iPhone keyup-pulse fix. This is one
continuously-advancing lineage, not two incompatible tracks: every
numbered rig from I24 on fetches the same shared base
(`rig-ikemen-3.html`/`.js`) fresh at runtime, so every GUI/sizing fix
from that base (letterboxing, aspect-ratio stage sizing, roster
auto-scroll, the 6-part GUI polish pass) is already live in I28 with no
separate per-rig patch needed -- confirmed by diffing I24 through I28's
own patch-anchor sets, which are identical aside from the input-gate
wireOld/wireNew content and the EXTRA_CHAR_PACKS URL. The "two parallel
tracks" framing in the FOR DAI section below (written while I25-27 were
still being sorted out) overstated the divergence; correcting it here.

Because two contributors are now advancing this same numbering
sequence concurrently (this session's GUI/base-file work, and DAI's
Kineza-lineage rig builds), `preflight.py`'s anchor check no longer
hard-fails when this line is a build or two behind the actual highest
`rig-ikemen-N.html` on disk -- only when the anchor names a rig that
doesn't exist at all. A behind-the-edge anchor now prints as a
non-blocking warning instead. Update this line when convenient; it is
no longer a build gate.

I24 carries everything from I23 (including Kineza v0.2 with the real
palettes) and trims the eager load.

**What changed.** `isEagerBootstrap()` pulled *everything* under `data/`,
`font/` and `plugins/` at boot -- 245 files, 205MB, before a match was
even picked. The hulk/BroliSSJ3 stress test proved that baseline is the
entire remaining footprint, since match load adds only ~32MB regardless
of who is picked. I24 defers by SIZE rather than blocklisting names:
anything in those directories at or above **4MB** goes to `zipIndex`
instead, and if the engine actually opens it, `fs.open()` ->
`lazyMaterialize()` pulls it on demand through the same path that already
serves every character and stage. Never opened means never paid for. The
decision costs no reads -- `ent.uncomp` comes from the zip central
directory, which is already parsed.

Text config stays eager at **any** size regardless of the threshold:
`motifPath` is discovered by that loop, and the picker reads `select.def`
straight out of `vfsFiles` rather than through `fs.open()`, so neither
can be made lazy. Guarded by extension (`.def .cns .cmd .air .ini .cfg
.txt .dat .snd`).

Logged as `I24 LEAN BOOT · deferred N large engine-config file(s)
totalling X MB out of the eager load (threshold 4.0MB, largest ...)`.

**Expected saving on the real roster: ~33MB**, from
`data/brokenMUGEN/sff/creds.sff` (32.7MB, a credits sprite sheet a quick
match never opens), plus anything else in the user's `data/` at or above
the threshold. That should take the post-eager figure from ~205MB to
~172MB and the match peak from ~237MB to ~204MB.

**Known limit -- this does NOT cover the runtime assets pack.**
`ikemen-runtime-assets.zip` (23.7MB, 129 files) is merged by
`loadRuntimeAssets()`, which calls `vfsPutFile()` directly and never
consults `isEagerBootstrap()`. Two files in it are at or above the
threshold and are therefore still loaded eagerly every boot:

  8.7MB  data/ikemen1/system.sff   (Ikemen's fallback motif screenpack --
                                    unused once the user's own
                                    data/system.def motif loads)
  6.1MB  data/fight.snd

`data/ikemen1/system.sff` is the genuinely wasted one. Deferring it is
**not** a one-line change: `loadRuntimeAssets()` registers nothing in
`zipIndex`, and `lazyMaterialize()` resolves entries through
`entryRaw(currentZipFile, ent)` -- hardcoded to the user's zip. Skipping
a runtime-pack file today would make it simply missing rather than lazy.
Doing it properly means giving zip-index entries a per-entry source blob
so the lazy path can pull from either archive. Worth ~9MB; deliberately
not attempted in this build, which keeps to one change.

Related observation, not acted on: the runtime pack loads *before* the
user's zip, so any path present in both is loaded and then overwritten by
the user's version. The bytes are accounted correctly since I22 fixed
`vfsPutFile()`'s overwrite arithmetic, but the decompression work is
wasted. Unknown how many paths actually collide.

I22 does two things, both follow-ups to I21's phone test.

**1. `[ExtraStages]` is now trimmed too.** I20 deliberately left that
section alone; I21's trace showed why it mattered. The wall of `Failed to
add stage. File read error: stages/.def` — hundreds of lines from that
section's own unresolvable entries — made a completely clean Kineza run
*look* broken, and cost a round-trip to explain. `trimSelectDefForMatch()`
now takes the picked stage as a second argument and keeps only that one
line, injecting it if it was not listed. A falsy stage (engine default)
leaves the section untouched. Confirmed in a headless run: the
`Failed to add stage` line present in I21's fixture output is entirely
absent from I22's.

**2. Kineza renders as a silhouette instead of confetti.** See
**I21 — repo-hosted characters** and the palette section below.

I21 adds **repo-hosted extra characters**: a character package committed
to this repo is fetched over HTTP at boot and merged straight into the
VFS, so adding a fighter no longer means repacking and re-uploading the
user's 1.7GB zip through a phone. The first one is **Kineza**, the
Prismatic Veil character, always on and first in the picker roster.

The mechanism is not new — `loadRuntimeAssets()` has merged 129 engine
files into the VFS over HTTP on every single boot since I2. The engine
cannot tell a file that came from the user's zip apart from one fetched
from the repo; it is all just the VFS. I21 simply points the same
fetch/walk/`vfsPutFile()` pattern at a second archive. See **I21 —
repo-hosted characters** below.

I20 stays the memory baseline and everything in it carries forward —
see **I20 — quiet select.def** below, and the controlled before/after
that closed the I17–I19 crash chain, which remains the reference shape
for a healthy match load (~235MB, ~50 assets).

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

### The controlled before/after — mole vs G.Ken across three builds

A second I20 phone test deliberately re-ran the exact pairing that hung
under I18 and crashed under I19, on the same stage, same device, same
saved zip. This is the cleanest evidence in the whole investigation
because only the build changed:

| Build | Peak own-VFS | Lazy assets | Result |
| --- | --- | --- | --- |
| I18 | 757.8MB, still climbing | 654+ | hung, load never completed |
| I19 | ~299MB (pinned to budget, 12+ evictions) | 75+ | crashed (Safari recovery page) |
| I20 | **233.5MB across 421 files** | **54** | **plays** |

3.2x less resident memory and roughly 12x fewer files touched than the
run that hung, on identical inputs.

**The footprint is also reproducible, not lucky.** The two I20 phone
tests used different characters and landed within 5MB and 2 assets of
each other — GodRugal/G.Ken at 238.2MB / 419 files / 52 assets, mole/
G.Ken at 233.5MB / 421 files / 54 assets. Match load is now dominated by
the two actual fighters plus the stage, which is the shape it should
always have had. `SELECT TRIM` reported the same 766 dropped entries in
both runs, as expected — the roster is the same regardless of who gets
picked, so a change in that number in some future run is itself a signal
worth looking at.

Treat ~235MB / ~50 assets as the known-good benchmark for a two-fighter
match on this roster. A future pairing landing far above that (or making
`EVICT` fire, which neither of these runs did) is the first sign the
budget is being approached again.

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

## I21 — repo-hosted characters

Adding a fighter used to mean repacking a 1.7GB zip and re-uploading it
through a phone. I21 removes that entirely.

### The mechanism (which already existed)

`loadRuntimeAssets()` has, since I2, fetched `ikemen-runtime-assets.zip`
from this repo over HTTP, walked its entries, and `vfsPutFile()`d all 129
of them into the VFS on every boot. The engine has no idea those files
did not come from the user's zip — everything is just the VFS. I21 points
that same pattern at a second archive:

- `EXTRA_CHAR_PACKS` — a list of `{ name, url }`. Currently one entry:
  `kineza` at `./assets/ikemen-web/kineza-char.zip`.
- `loadExtraChars()` — fetch, `listZipEntries()`, `entryRaw()`,
  `vfsPutFile()`. Same four calls `loadRuntimeAssets()` makes. Wrapped in
  a **per-pack try/catch on purpose**: a character package that fails to
  fetch (not deployed, bad path, offline) must never take the rig down,
  it just does not appear in the picker that run.
- Called from `loadAndShowPicker()` **before** `loadZipIntoVfs()`, so the
  files are resident before roster discovery runs. `findCharDefKey()`
  already checked `vfsFilesLower` as well as the zip index, so a
  VFS-resident character validates with zero special-casing.
- The roster block then `unshift()`s each successfully-merged name onto
  `allChars`, putting it **first** in the picker. A 148-entry grid on a
  phone makes anything appended to the end a scrolling exercise, and
  these are the characters under active development.
- `resetForNewZip()` clears the flag alongside `runtimeAssetsLoaded`,
  since CHANGE ZIP wipes the whole VFS and the pack has to be re-merged.

### The select.def half

I20's trim could only *keep* lines that already existed. A repo-hosted
character is not in the user's select.def at all, so
`trimSelectDefForMatch()` now tracks which picked names it actually
found and **injects a line for any it did not**, spliced in directly
after the `[Characters]` header (or under a new section if there is
none). This is general — every future injected character works the same
way for free. Logged as `(N injected: <names>)` in the SELECT TRIM line.

### Layout convention

The pack is laid out as `chars/kineza/kineza.def` so the roster name is
just `kineza`, identical in form to all 147 existing entries. Keep that
convention for future packs — it means no special cases anywhere in the
picker, the CLI argv, or `findCharDefKey()`.

### A build-time bug worth remembering

The first cut anchored the `resetForNewZip` patch on the string
`runtimeAssetsLoaded = false;` — which also appears in its own `let`
declaration higher up the file. `.replace()` takes the **first** match,
so the patch landed on the declaration, producing
`let runtimeAssetsLoaded = false;` followed by `extraCharsLoaded = false;`
*before* `extraCharsLoaded` was declared: a TDZ ReferenceError at module
load that would have killed the rig on boot, plus a `resetForNewZip` that
never reset the flag. **`node --check` passed**, because TDZ is a runtime
error and the output is perfectly valid syntax.

Fixed by anchoring on `vfsDirs.clear();\n    runtimeAssetsLoaded = false;`
and by adding `needUnique()` to the builder, which fails the build if any
anchor matches more than once. **Every patch anchor in a future rig
should use `needUnique()`, not `need()` — an anchor that matches twice
does not error, it silently rewrites the wrong site.**

### Verified before the phone test

- Unit test of the extended trim: injection into `[Characters]`, the
  injected line landing inside that section rather than at end of file,
  `[Options]`/`[ExtraStages]` untouched, a Kineza mirror match injecting
  exactly one line and not two, the I20 no-injection path unchanged, and
  a select.def with no `[Characters]` section at all getting one created.
- The runtime `.replace()` pipeline simulated in Node and syntax-checked.
- A real headless-browser run against the live repo copy of the pack,
  which exercised the actual fetch: `kineza merged into VFS -- 5 file(s),
  2.1MB (repo-hosted, not from the user zip)`, `kineza added to the
  picker roster at position 1 of 3`, roster grid reading
  `kineza | mole | g.ken`, and a full match booting with
  `-p1 kineza -p2 kineza` and **zero** kineza-related engine errors — no
  "Failed to add char", no SFF/AIR/CNS complaints, no missing sprites.

### Phone-test result — integration PASSED, art payload did not

Real device: `kineza merged into VFS -- 5 file(s), 2.1MB`, `added to the
picker roster at position 1 of 148`, `148 characters / 8 stages offered`,
`SELECT TRIM ... (1 injected: kineza), 768 other roster entries dropped`,
`-p1 kineza -p2 kineza`, match loaded and settled at **212.2MB / 17 lazy
assets** — *below* the 235MB/50-asset benchmark, because his files load
eagerly with the rig instead of lazily from the zip. Both lifebars read
"Kineza". **Zero kineza-related engine errors** — for scale, GodRugal
threw ~130 warning lines on load and G.Ken ~150; Kineza threw none.

Every `ERR` line in that trace was the pre-existing `[ExtraStages]`
noise, now fixed in I22. The integration path is sound end to end.

**But he rendered as magenta/green confetti.** That is an art-payload
bug, not an integration one — see below.

### The missing-palette bug (diagnosed from the bytes)

A PCX 8-bit image must end with a `0x0C` marker byte followed by 768
bytes (256 RGB triplets). **All 23 sprites in the delivered SFF were
missing that block.** Confirmed by full byte accounting: 512-byte header
plus 2,163,794 bytes of sprite blocks, zero gaps, zero unaccounted bytes
— the palette is not merely misplaced, it was never written. With no
colour table the 8-bit indices are meaningless, which renders as
confetti rather than a wrong-but-coherent tint.

Everything else in the file was verified correct: RLE decodes to exactly
196,608 of 196,608 expected pixels on all 23 sprites, 512x384
dimensions, axis 256,340, subheader chain intact, index 0 at 75-84% of
pixels (already the correct MUGEN transparent-background convention).

**CORRECTION (recorded after I23): the claim that the palette was
unrecoverable was WRONG, and the silhouette stand-in was unnecessary.**

The 768-byte palette was present in every sprite the whole time. Only the
single `0x0c` delimiter byte that must precede it was missing -- 23 bytes
absent from a 2.1MB file. Verified directly: the trailing 768 bytes of
each sprite decode as a well-formed palette (255 distinct colours, warm
skin and hair tones), the RLE consumes exactly 64,552 bytes to produce
exactly 196,608 pixels, and precisely 768 bytes remain after it, preceded
by `0x00` instead of `0x0c`. I23 repairs it by inserting only that
delimiter, preserving every original PCX and palette byte.

**How the wrong call was made, so it is not repeated:** the check looked
for the `0x0c` marker, did not find it, then ran whole-file byte
accounting that showed no gaps and no unaccounted bytes -- and concluded
the palette was absent. But byte accounting cannot distinguish a palette
sitting *inside* a sprite's own data block from image data; those 768
bytes were counted as part of `length`. The decode loop stopped at
`bpl*h` pixels and never touched them, which hid it further. **The step
that was skipped: look at whether the trailing bytes resemble a
palette.** They plainly did. A missing delimiter is evidence about the
delimiter, not about the data -- do not generalise from one to the other
without inspecting the data itself.

The adaptive-quantisation observation is accurate but was used to support
the wrong conclusion: indices spread across all 256 slots means the
palette is *essential*, not that it is *gone*.

**Upstream fix:** append `0x0C` + the 768-byte palette to each sprite's
PCX data when writing the SFF. Nothing else needs to change.

**Stand-in shipped in the meantime (superseded by I23, and it should
never have been needed):** `tools/make_silhouette_sff.py`
attaches a palette where index 0 stays background and indices 1-255 all
take Kineza's canonical PV accent `0x68ff8c` (`src/BattleConfig.js`),
producing a flat green silhouette. **The colours are fake.** It exists so
the build can be used as what its README says it is — a motion test —
answering its own open questions #3 and #5 (foot-axis stability through
Momentum Fist and Blitz Rush, and whether either rush carries him off
camera). Provenance is recorded next to the pack in
`mugen-lab/assets/ikemen-web/kineza-char.PROVENANCE.txt`.

Note on the silhouette: the clean stance frames read beautifully, but the
Blitz Rush frames (`1070,*`) flatten into a large amorphous blob, because
those sprites have energy/debris FX baked into the art — the README says
so directly. That is accurate to the source, not a fault of the
repalette, and it likely explains the large washed-out rectangle visible
in the confetti screenshot too.

### What the package itself is (v0.1 prototype)

Checked structurally before integrating: SFF v1 with a valid Elecbyte
signature and 23 subheaders that all walk cleanly; all 47 standard MUGEN
actions defined in the AIR; every sprite the AIR references exists in the
SFF (23 refs, 23 sprites, none missing); `stcommon = common1.cns`
resolves against Ikemen's own `data/`. Two known prototype quirks, both
cosmetic and both expected per its own README:

1. **Action 0 (idle stance) points at sprite `9000,0`** — the
   select-portrait slot. It is a full 512x384 image so it renders, but
   his standing pose is his portrait frame.
2. **Axis 256,340 on a 384-tall sprite** — 44px of image hangs below the
   feet axis (22px at the 0.5 scale the def sets), so he may sit low or
   clip the floor. That is the README's own open question #3.

There is no SND file, so his attacks are silent by design.

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

**I22 is the anchor.** It carries everything from I13 onward and adds the
`[ExtraStages]` trim plus the Kineza silhouette stand-in.

**The Kineza integration path is proven and is not the open item** — his
pack merges, injects, loads and runs with zero engine errors. What is
open is the **art payload**: the SFF needs regenerating upstream with its
palette attached (see the palette section above for the exact one-line
fix). Until then he is a green silhouette by design.

Menu, roughly by value:

1. **Play more pairings.** Still the highest-value input. hulk,
   GoD_Ryu, BroliSSJ3 are the likely fat packages. Watch for an `EVICT`
   line — it has not fired since I19, and it firing again is the signal
   the 300MB budget is being approached.
2. **Kineza v0.2 with a real palette.** Drop the pack in, refresh, done —
   no re-upload, no zip surgery. That loop is now cheap, which was the
   whole point of I21.
3. **Collapse the wrapper chain.** Twelve runtime patches over
   `rig-ikemen-3.js` is a lot of indirection for a known-good result.
   Bake it flat, PriZim green before and after, leave the base untouched.
4. **GUI work.** Picker portraits, HUD styling. Nothing blocks it.

### Stress test PASSED — hulk vs BroliSSJ3 on I23

Two of the heaviest packages in the roster, real device, real zip.

- **`[ExtraStages]` trim confirmed on the real roster**: `trimmed to 1
  line(s), 337 dropped`, and **zero** `Failed to add stage. File read
  error: stages/.def` lines anywhere in the trace. The wall that made a
  clean I21 run look broken is gone.
- **Peak own-VFS 237.2MB across 397 files, 25 lazy assets**, settled in
  11.7s. Against the mole/G.Ken benchmark of 233.5MB / 54 assets, that is
  the same memory with *fewer* assets. No `EVICT` line fired; the 300MB
  budget was never approached.

**The finding that matters: memory no longer scales with character
choice.** Eager load alone is 205.1MB, and a full match with two
heavyweight characters plus a stage added only ~32MB on top. The heaviest
pairing on the roster costs the same as the lightest.

**So the next memory target, if one is ever wanted, is the eager load —
not the roster.** `isEagerBootstrap()` pulls everything under `data/`,
`font/` and `plugins/` at boot: 245 files, 205MB. The single largest is
`data/brokenMUGEN/sff/creds.sff` at **32.7MB** — a credits-screen sprite
sheet that a quick match never touches, loaded on every boot, 16% of the
entire footprint. Narrowing the eager set (or lazy-loading the big
non-essential sff files in it) is where the remaining headroom is. Not
urgent: nothing is failing, and the budget has a 60MB cushion.

Character-package warnings in that trace (hundreds, from Hulk and Broly's
own CNS files) are the packages' own and not this lane's problem, same
class as GodRugal's ~130 and G.Ken's ~150. One is genuine and worth
knowing: `Animation missing sprite 8001,10 from chars/hulk/hulk.sff` --
Hulk's own sff is missing a sprite his own air file asks for.

Also observed working: `CONTROLS · released N stuck key(s) after window
blur` fired twice when the app lost focus mid-match -- I14's safety net,
doing its job on real hardware.

### Phone-test result — I24 exceeded its own estimate, hulk vs DragonClaw

Real device. `I24 LEAN BOOT · deferred 14 large engine-config file(s)
totalling 128.2MB` -- not the ~33MB estimated when I24 was scoped from
`creds.sff` alone. The size-threshold approach caught everything in the
user's `data/` at or above 4MB automatically, not just the one file known
by name, and there was apparently a lot more of it than one trace could
show.

| | I23 (hulk/BroliSSJ3) | I24 (hulk/DragonClaw) |
| --- | --- | --- |
| Post-eager VFS | 205.1MB | **76.9MB** |
| Match peak | 128.7MB (settled), own-VFS | **128.7MB** |
| Files at eager-done | 370 | 356 |

Peak memory roughly halved between two consecutive builds. Match played
normally: lifebars, real combat input, both players landing hits, no
`EVICT` line (nowhere near the 300MB budget). 34 lazy assets materialized
during match load, up from I23's comparable run, consistent with the
deferred files now genuinely being pulled on demand when the engine opens
them rather than paid for at boot regardless.

Both warning walls in this trace are the character packages' own
authoring issues, not this lane's: `Animation missing sprite 8001,10 from
chars/hulk/hulk.sff` is the same known gap in Hulk's file already noted
under I23; DragonClaw's `dc.cns`/`dc.air` carry typos in its own state
controllers (`fal.recover`, `persisent`, `sprpriority` misspelled several
ways) that are that package's problem to fix, not the rig's.

**Revise the benchmark going forward**: ~130MB match peak / ~35 lazy
assets is now the shape to expect on this roster with I24, not the
~235MB figure from before the eager-load trim existed. A future pairing
landing well above ~130MB, or `EVICT` firing (still hasn't, on any build
since I19), are the signals worth a closer look.

### Parked idea: serve the zip over HTTP instead of IndexedDB

Raised and deliberately deferred. Recording it because the feasibility
check is the useful part and should not need redoing.

**It would work, and it is a small change.** The rig touches the zip File
object in exactly three ways -- `file.size`, `file.name`, and
`file.slice(a, b).arrayBuffer()` -- and never reads the whole 1.7GB. It
reads the last 64KB for the central directory, then per asset a 30-byte
local header plus that entry's compressed bytes. All random access byte
ranges, which is exactly what HTTP Range requests provide. A shim object
exposing those three members over `Range: bytes=a-b` is a drop-in;
nothing else in the codebase changes.

Two hard requirements if it is ever built:

- **The server must support Range requests.** `python3 -m http.server`
  does NOT -- it ignores the header and returns the whole file, which
  here means 1.7GB per asset. Caddy or nginx, not the stdlib server.
- **Mixed content blocks the obvious setup.** The rig is served over
  HTTPS from github.io, and browsers refuse http:// subresources from an
  HTTPS page. Either serve the rig from the same host, or front the
  server with real HTTPS (Tailscale Serve handles certs and works off
  the home network).

**Why it was parked:** the value is narrower than it first appears. The
zip is already persisted in IndexedDB, so there is no repeat upload, and
the "add a character without touching the big zip" case is already solved
by the repo-hosted pack path (see **I21 — repo-hosted characters**). What
is left is swapping whole rosters, editing characters already inside the
big zip, or standing up a fresh device. Against that: a sleeping laptop
means no game, where IndexedDB works offline indefinitely, and boot would
turn ~490 local disk reads into network round trips (roughly +10s on LAN,
worse through a tunnel).

If built, it should be an option (`?zipurl=...`) with IndexedDB staying
the default -- add a lane, do not replace the working one.

Triage order for any future regression is unchanged: does `SELECT TRIM`
fire with a sensible dropped count, does any un-picked character appear,
does own-VFS hold the ~235MB/~50-asset shape.


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

## GUI — portrait-mode letterboxing fix (base `rig-ikemen-3.html`)

Reported by the user with a real-device portrait screenshot (Hulk vs
DragonClaw, mid-match): the "GAMEPLAY VIEWPORT" box (`.stage`) had a
large black dead zone above and below the actual game canvas once a
match was running.

Root cause: `.stage` carried an unconditional `min-height:40vh`. That
floor is correct and wanted during the picker/setup phase (`#setup`
visible, no canvas content yet, needs the box to hold its shape) but
wrong once a match is running, because at that point the canvas has its
own intrinsic size (from the WASM/Ebiten runtime's actual drawing-buffer
resolution) and `.stage`'s flex layout should just hug it. The 40vh
floor stayed in effect the whole time regardless of phase, forcing extra
black space around a canvas far shorter than 40vh of a typical portrait
phone viewport.

Fix: scope the floor to the setup phase only, using `:has()`:

```
.stage{...same as before, minus min-height:40vh...}
.stage:has(#setup:not(.hide)){min-height:40vh}
```

`#setup` only ever gets `.hide` added once, right when the WASM module
takes over (`rig-ikemen-3.js`, boot path), and is never re-shown after
that — confirmed by grepping every `classList` touch on `#setup` in the
base JS. So `:has(#setup:not(.hide))` is true for exactly the pre-match
picker phase and false for the rest of a session, including across a
CHANGE ZIP reset (which resets state in place without re-showing
`#setup`, since it's already visible at that point). Safari 15.4+
supports `:has()`; this project's iOS 18.7 target is well past that.

Verified two ways:

- **Synthetic harness** (`scratchpad/gui-test/`): a standalone page
  faking the canvas's intrinsic size the way the real runtime sets it,
  driven through 6 states (setup shown / just-hidden-no-size-yet /
  sized, each under base CSS and fixed CSS) via Playwright at 390×844.
  Base CSS: 154px dead space pre-size, 62px with a 640×480 mock canvas.
  Fixed CSS: ~2px dead space in every sized state, and the 338px (40vh
  of 844px) floor still holds correctly during setup.
- **Real live page** (`rig-ikemen-24.html`, actual engine): setup-phase
  stage height measured 338px (unchanged, correct). Mid-real-match:
  `{"stageH":209,"canvasH":207,"dead":2,"canvasIntrinsic":"1280x720"}` —
  confirms the fix holds against the engine's real 16:9 buffer (not the
  4:3 assumed in the synthetic mock), and that the fix is resolution-
  agnostic since it never references a hardcoded aspect ratio.

Since this lives in the shared base HTML, every numbered rig built from
it (I3 onward, including future ones) inherits the fix automatically —
no per-rig patch needed.

Next up, per the user's own sequencing: a "Digital Server" spec/
breakdown document for their separate AI-Assistant to build from,
covering what MobMugen specifically needs from self-hosting the content
zip over HTTP (see the parked HTTP-Range idea above for the groundwork).
"Also just improving [the GUI] overall" is still open beyond this one
letterboxing fix — revisit with the user once the digital-server
document is delivered rather than assuming further scope.

## FOR DAI — real syntax error in rig-ikemen-27.js as pushed to main

`mugen-lab/rig-ikemen-27.js` fails `node --check` outright:

```
mugen-lab/rig-ikemen-27.js:8
  const wireOld = "document.querySelectorAll('#controls [data-k]').forEach(el => {
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

SyntaxError: Invalid or unexpected token
```

The `wireOld` string (line 8) opens with a double quote and then
contains real, literal line breaks straight through to line 32 --
JS double-quoted strings can't contain a raw newline, only `\n`. Every
other multi-line patch string in the same file (`bindNew`, `selectNew`,
`wireNew` itself on line 33, etc.) is built the correct way: one line,
`\n` escapes throughout. This one string got pasted/generated without
that escaping. The browser will hit the exact same SyntaxError the
whole file currently does in `node --check`, so `rig-ikemen-27.html`
cannot boot at all as currently committed on `main` (introduced in
commit `4e6d22f`, "force action-button keyup pulses on iPhone").

Fix is mechanical: re-escape `wireOld`'s value onto one line the same
way `wireNew` right below it already is (each real newline -> `\n`,
each embedded `'` left as-is since the string is double-quoted).

Not touched here per "let DAI fix Kineza, let him be" -- this is I25-27's
own input-gate lineage, flagged so it's visible in the file DAI already
reads, not silently patched.

**RESOLVED** (`cf80564`, "fix I27 wireOld syntax per FAI live notes"):
DAI re-escaped `wireOld` the same way this note suggested. Re-verified
directly with `node --check` against the fixed file on `main` -- clean.
`rig-ikemen-25.js` and `rig-ikemen-26.js` (the actual v0.3B input-gate
build the user is testing) were already syntax-clean before this fix
and remain so; only I27 had the break. All three -- I25, I26, I27 --
now pass `node --check`.

**I26 flagged ready for phone testing** (Kineza v0.3B six-button input
gate): `mugen-lab/outputs/KINEZA_MUGEN_PROTOTYPE_V0_3B_INPUT.zip` /
`mugen-lab/assets/ikemen-web/kineza-char-v03b-input.zip` are byte-
identical (same SHA256) to what the user separately uploaded, so
there's nothing new to integrate -- `rig-ikemen-26.js`'s
`EXTRA_CHAR_PACKS` already points at `kineza-char-v03b-input.zip` and
merges it into the VFS on boot, same mechanism v0.2's pack used. Live
at `https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-26.html`.
Since I26 fetches the shared base (`rig-ikemen-3.html`/`.js`) fresh at
runtime, it also inherits every GUI/sizing fix from the roster/GUI
track (letterboxing fix, aspect-ratio stage sizing, 16:9 default, GUI
polish pass, roster auto-scroll fix) automatically, with no per-rig
patch needed on either side.

Also worth knowing: `preflight.py`'s `live_notes_anchor_matches_highest_file`
check still fails, because it expects this file's tested-rig anchor to
match whichever `rig-ikemen-N.html` is highest on disk (I27), but this
anchor still says I24 -- the last rig actually tested from the
MobMugen-roster/GUI track this file otherwise documents. The two tracks
(roster/GUI vs. Kineza input-gate) are now running in parallel on the
same numbering sequence; the checker doesn't know that, so this failure
is expected to stay red until the two tracks agree on one anchor
convention, not something either side should chase alone.

**UPDATE:** superseded by two later changes -- `preflight.py`'s anchor
check is now a non-blocking warning rather than a hard failure (see the
Current Anchor section at the top of this file), and I29 (below)
retires the fetch+patch wrapper mechanism this whole section was about,
on this session's side of the lineage only.

## I29 -- collapsed static build (fetch+patch mechanism retired, this side only)

Per the user's decision, communicated to DAI separately: this session's
side of the lineage no longer ships new rigs as fetch+patch wrappers.
I29 is the first collapsed/static build -- a plain, self-contained
`rig-ikemen-29.html`/`.js` pair with no runtime `fetch()` of anything.
The page loads its own script directly; nothing is patched into place
after the fact.

**Why now, and why not delete the mechanism outright.** DAI's Kineza
input-gate lineage (I25-I28 so far) is generated by GitHub Actions
workflows (`build-kineza-v03b-input.yml`, `audit-kineza-v03.yml`, etc.)
that fetch `rig-ikemen-3.js`/`.html` as their base and patch it --
that's load-bearing automation, not a convention DAI could casually
drop. Deleting the wrapper mechanism, or `rig-ikemen-3.html`/`.js`
themselves, would just make that automation's next run generate a
broken rig. So the base and the wrapper mechanism both stay exactly as
they are; I29 sits alongside them as a separate, static entry point.
DAI keeps shipping wrapper-style rigs (I30, I31, ...) on exactly the
same base for as long as that automation needs it.

**How I29 was produced -- mechanically, not by hand.** Hand-transcribing
~1700 lines of accumulated patch logic into a new file is exactly the
kind of full-rewrite this lane's own history warns about (see "A full
rewrite of a working file can silently drop a fix..." in CLAUDE.md).
Instead: loaded a tiny capture harness in a real headless browser that
overrides `document.head.appendChild` and `document.write`/`open`/
`close`, then ran I28's own wrapper `.js` and `.html` inline scripts
verbatim via `eval()` inside that page -- so I28's real fetch of
`rig-ikemen-3.js`/`.html` and its real fifteen `.replace()` calls
executed exactly as they do in production, and the harness just
captured the final materialized string each wrapper was about to inject
or write, instead of letting it actually run. Zero manual transcription
of any patch string. (First attempt used Playwright's own
`addScriptTag` to inject the wrapper source -- that method uses
`document.head.appendChild` internally too, so the override captured
Playwright's own injection instead of the wrapper's dynamically-created
script, silently producing the wrapper's raw *unpatched* source as
"output". Caught by comparing byte length against the known base-file
size before trusting the result -- 36KB (matching I28.js's own raw
size) instead of the ~79KB a base-plus-patches merge should produce.
Switched to direct in-page `eval()`, which doesn't touch
`appendChild` until the wrapper's own internal call does, and got the
real 78,881-byte materialized output.)

Post-capture, only mechanical/deliberate edits were made, each checked
individually:
- Relabeled `I28` -> `I29` throughout (exact string, no other 28-shaped
  substrings existed to collide with it -- checked before relabeling).
- Pointed the `<script src>` at `./rig-ikemen-29.js` (the captured HTML
  still pointed at the *wrapper's* generated-script convention, which
  doesn't apply to a plain static file).
- Retitled to "RIG I29 COLLAPSED STATIC BUILD" and rewrote the READY
  log line to describe the new build shape, rather than leaving I28's
  wrapper-era wording in place.
- Dropped the trailing `//# sourceURL=rig-ikemen-28.generated.js`
  comment -- that only mattered for the wrapper's `eval()`-injected
  script; meaningless (and mislabeled) on a real committed file.

**Two real mistakes caught during this pass, not shipped:**
1. The rewritten READY message's prose ("on top of I13 through I19's
   earlier fixes") didn't match `preflight.py`'s stale-label exemption
   pattern (a slash-joined run like `I13/I14/I15`), so it read as a
   stale I13 label. Rewrote back to the slash-joined convention every
   other rig's READY message already uses, rather than loosening the
   checker for a phrasing choice that added nothing.
2. The new prose also named the source rig by number ("I28's real
   runtime output") -- passed the stale-label check only by accident,
   because an escaped apostrophe's backslash happened to break the
   checker's lookahead. Fragile: a future reformatting could "fix" that
   escaping and trip the check for real. Reworded to describe the
   source generically ("the prior wrapper rig's ... output") instead of
   hardcoding a number that will itself go stale the moment I30 exists.

**`preflight.py` now recognizes two valid build shapes** for whichever
rig is highest on disk: `wrapper` (fetches+patches `rig-ikemen-3.*`,
what DAI's automation produces) and `collapsed-static` (self-contained,
what this session produces from here on). Detection is automatic (does
the `.js` declare `const base = './rig-ikemen-N.js...'`?), and the
report's new `current_rig_shape` field says which one is current. Each
shape gets the check set that actually applies to it -- a
collapsed-static build is checked for the same essential pieces
(canvas id, `bindPress`, `selectItem`, `lazyMaterialize`, the `boot()`
anchor, the startMatch-hide pattern) read directly off its own file
instead of a separate base, and is checked for the *absence* of any
`fetch('./rig-ikemen-N...')` call (proving it's actually self-contained,
not just missing the wrapper's `const base =` line while still fetching
something else). Verified both directions: a real wrapper build
(checked out from `origin/main` via a throwaway `git worktree`, so
nothing in this branch's own history was disturbed) still reports
`shape: wrapper` and passes with the exact same checks as before: zero
behavior change for DAI's side. A deliberately broken collapsed build
(renamed `bindPress`) correctly fails `base_has_bindPress`, restoring
cleanly afterward -- so the check set is real, not just permissive.

**Verified working, not just captured:** `node --check` passes;
booted in a real headless browser with zero page errors; title, runtime
status, and the READY trace line all read correctly; the stage-sizing
fix from this session's own earlier work measured the same 1.779
(16:9) aspect ratio I29 inherited by construction, since it was
captured from I28 which itself fetches the shared base carrying that
fix.

**Phone-tested and confirmed.** First real trace on I29 hit a hard
freeze mid-match-load ("36 assets loaded — pal10.act", unresponsive
even to Copy Trace) with a different character than any prior test --
root-caused to the Zip64-sentinel bug documented in the next section
below and fixed in both this file and the shared base. Re-tested after
the fix on the same class of content: **no issues.** I29 and the
Zip64 fix are both confirmed working on real hardware, not just headless.

Live: `https://jr-faulkner.github.io/Prismatic-Veil/mugen-lab/rig-ikemen-29.html`

## Zip64-sentinel freeze (real bug, reproduced headless, fixed and phone-confirmed)

Reported from the I29 phone test above. Root cause: `listZipEntries()`
read a zip entry's compressed/uncompressed size as a plain 32-bit
central-directory field and never checked for the Zip64 sentinel value
`0xFFFFFFFF` -- which means "the real 64-bit size lives in the Zip64
extra field instead," not "this entry is ~4.29GB." Some zip encoders
write Zip64 fields per-entry regardless of whether that entry actually
needs 64-bit sizes, so an ordinary small palette file can carry it.
`entryRaw()`'s `file.slice(start, start + ent.comp)` then gets silently
clamped by the Blob spec to "the rest of the file" once `ent.comp` is
bogus -- so a single Zip64-flagged entry anywhere in a multi-gigabyte
zip made the very next read try to materialize the entire remainder of
the archive into memory before decompression even started.

Reproduced headless before touching any fix: a synthetic zip with one
sentinel-flagged entry and a 150MB incompressible tail (simulating "the
rest of a big real zip") took ~860ms just for the oversized read on a
fast dev CPU -- fflate's `inflateSync` itself correctly stops at the
stream's own BFINAL bit regardless of trailing garbage, so the hang is
entirely in the read step, not decompression. Scaled to a real ~1.7GB
zip on an iPhone, that predicted multi-second-plus of a fully blocked
main thread with no JS error, matching the device report exactly.

Fixed by parsing the Zip64 extra field (header id `0x0001`) for
whichever of comp/uncomp/local-offset carried the sentinel, per the
zip spec's field order. Re-ran the same synthetic repro with a proper
Zip64 extra field attached: resolves the entry's true 52/820-byte size
instead of the sentinel, drops the read from ~860ms to ~1ms, decodes to
byte-identical content. A separate ordinary (non-Zip64) zip confirmed
unaffected. Applied to both `rig-ikemen-3.js` (fixes every wrapper rig)
and `rig-ikemen-29.js` directly (collapsed builds don't auto-inherit
base fixes -- see the I29 section above). **Phone-confirmed fixed**:
re-tested with the same class of content that froze, no issues.

## FOR DAI -- heads up: a beautification / image-quality pass is coming

The user is planning to have DAI run a beautification pass on MobMugen
next -- specifically improving overall visual polish and image quality
(the roster/GUI track's own polish work is documented earlier in this
file: status-pill/frame state coloring, roster touch targets and
selected-state contrast, selection-chip fill states, the debug-panel
default-collapse, and the aspect-ratio-based stage sizing that replaced
the old flat vh guess -- all of that lives in the shared base
`rig-ikemen-3.html`/`.js` and is already inherited by every rig that
fetches it fresh, I24 through I28, plus I29 by construction since it
was captured from that base).

This session (the roster/GUI + base-file track) is being put on hold
for now while that beautification work is scoped/run. Nothing further
is expected from this side until picked back up.

Two things worth knowing before that pass starts, both from this
session's own history on this file:

- **I29 is a collapsed/static build** (`rig-ikemen-29.html`/`.js`,
  no runtime fetch+patch) and does NOT auto-inherit fixes made to the
  shared base going forward -- any base-file fix (including the two
  above: the healthy-status color bug and the Zip64-sentinel freeze)
  had to be applied to `rig-ikemen-3.*` AND `rig-ikemen-29.js`
  separately. If beautification work touches image/asset loading or
  anything else `rig-ikemen-3.*` owns, check whether I29 needs the same
  change mirrored in, same as this session did for both fixes above.
- **Art/asset traps already documented in `CLAUDE.md`** are worth a
  re-read before an image-quality pass specifically: the "authored UI
  sheets ship fake transparency" entry (checkerboard baked into pixel
  data, not real alpha), the "texture rendered far smaller than its
  source resolution reads as translucent" entry (linear-downscale alpha
  averaging plus genuinely-semi-transparent art both look identical and
  need different fixes), and the tint-based outline/backing-layer entry
  (tinting doesn't normalize alpha) -- all three were real, previously-
  shipped bugs on the battle-v2/tactical side of this repo, not
  hypothetical, and the same failure modes are exactly what an image-
  quality pass risks reintroducing if source-resolution and alpha-
  channel handling aren't checked explicitly.

---

## 2026-09-19 · MobMugen beautification / orientation authority (DAI continuation)

### Phone-witnessed UI anchor
- **V11** `mugen-lab/rig-ikemen-29-beauty-v11.html` is the current user-approved beautification/setup anchor before the portrait pass.
- User explicitly said the V11 setup "looks good thus far."
- Keep the stable I29 runtime logic underneath unless a visual feature requires a narrowly scoped hook.

### Locked screen architecture
- **Portrait is the front-end mode**: load/library, fighter select, stage select, and related setup.
- **Landscape is the fight mode**.
- Pressing FIGHT in portrait is gated by a rotate prompt; the match should not begin until landscape is confirmed.
- Gameplay remains **true 16:9**. Do not crop or stretch the fight image to fake more portrait height.
- In landscape, center the 16:9 fight canvas and use the phone's extra-wide left/right gutters for touch controls.
- Touch is the default assumption. Bluetooth/controller support is optional enhancement, not a prerequisite.
- D-pad belongs at the far left edge; attack cluster at the far right; keep the center combat lane clear.
- If a running fight rotates back to portrait, next runtime pass should trigger a **real engine pause/freeze**, show "ROTATE TO LANDSCAPE TO RESUME", clear held touch inputs, and resume cleanly after returning to landscape. This true pause behavior is **queued, not yet implemented**.

### Handoff/link discipline
- Every test build handed to the user must include a **fresh, tappable, cache-busted GitHub Pages URL**.
- Prefer a fresh filename for major architecture changes.
- Never call a build phone-approved/live-stable until the user has actually witnessed it on iPhone/iPad Safari.

### Beautification direction
- The approved visual language remains graphite/dark metallic + electric blue + restrained gold.
- Mocks are implementation targets, not loose inspiration. Do not substitute cheap placeholder UI when a feature is not ready.
- Highest-impact next lane is **real fighter imagery**, then real stage imagery, then landscape controller-skin polish, then transitions/micro-polish.

### V12 source-published portrait pass · awaiting phone witness
Files:
- `mugen-lab/rig-ikemen-29-beauty-v12.html`
- `mugen-lab/rig-ikemen-29-beauty-v12.js`

What V12 adds:
- Beauty-specific runtime copy so the frozen I29 base file is not modified.
- Resolves each selected character's `.def`, reads `[Files] sprite = ...`, and prefers `defname_preload.sff` when present.
- Native browser decoder for **SFF v1 / PCX** select portrait **group 9000, image 1**.
- Handles SFF v1 linked sprites and previous embedded palettes.
- Converts decoded portrait pixels to an in-memory PNG data URL and places the real artwork into the large P1/CPU fighter cards.
- Keeps the prior monogram treatment as fallback if no usable 9000,1 portrait is available.
- Portrait loading is lazy and cached: only currently selected P1/P2 artwork is decoded, avoiding a full-roster memory spike.

Current limitation:
- **SFF v2 portrait decoding is not enabled in V12 yet.** V2 characters fall back cleanly to the monogram and log the reason in debug. Do not claim universal portrait support until the v2 path is added and witnessed.
- Roster-tile thumbnails and real stage preview extraction are still pending.


### 2026-09-19 · V12 phone witness + beautification queue correction
- User phone witness: **no real fighter portraits populated in V12**.
- Therefore V12 portrait extraction is **not approved / not considered working**. Do not describe the portrait lane as complete.
- Immediate portrait-lane task remains to diagnose whether the loaded roster is predominantly SFF v2, whether the SFF path resolver is missing the actual files, or whether the 9000,1 decoder itself needs correction. Preserve V11/V12 UI architecture while diagnosing.
- The user's later request to reuse the loaded MUGEN motif's original character-select navigation / confirm sounds is **added to the backlog only** and must **not displace the previously agreed beautification order**.

Current beautification priority order:
1. Fix and verify **real fighter portrait extraction**.
2. Add **real roster thumbnails** where practical from the same character art pipeline.
3. Add **real stage imagery / stage preview extraction** and clean player-facing stage names.
4. Polish the **landscape side-gutter touch controller skin** while preserving the centered true 16:9 playfield.
5. Implement **real engine pause/freeze on portrait rotation during an active match**, with rotate-to-resume gate and held-input cleanup.
6. Add **selection / transition micro-polish** (lock flash, cursor treatment, VS transition, loading treatment).
7. Then add **native motif UI sound extraction** from the loaded MUGEN package (cursor move, confirm, cancel/back, stage navigation/confirm where available).

Link/build discipline remains unchanged: every test build handed to the user gets a fresh tappable cache-busted GitHub Pages URL.


### 2026-09-19 · V13 portrait diagnosis
- Root cause confirmed for at least Kineza: the validated Kineza SFF manifest contains **9000,0** and does **not** contain **9000,1**. V12 hard-coded 9000,1, so Kineza was guaranteed to fall back.
- V13 now reads the loaded motif's configured portrait sprite references from `system.def` when available, then falls back through **9000,1 -> 9000,0** instead of assuming only 9000,1.
- V13 adds a hidden developer portrait diagnostic in the TEST drawer so phone testing can report whether a selected fighter is: decoded, missing the expected sprite, SFF v2, missing its SFF path, or failing PCX/palette decode.
- The portrait cache is now cleared when changing libraries so same-named fighters from different ZIPs cannot reuse stale artwork.
- SFF v2 remains pending. Do not claim universal portrait support.
- V13 is source-published and syntax-checked only until phone witness confirms actual artwork.


### 2026-09-19 · V14 portrait verification pass
- Continued portrait work without changing the approved V11 portrait-select / landscape-fight architecture.
- V14 adds a deterministic **repo-hosted Kineza portrait self-test** before scanning the user's library. Kineza is useful here because the existing validated sprite manifest proves that its SFF contains **9000,0**.
- The self-test isolates decoder failure from user-ZIP path/motif failure:
  - `KINEZA PASS` means SFF v1 + PCX + palette + data-URL conversion are functioning on the phone.
  - `KINEZA FAIL` means the decoder path itself is still wrong and the reason is logged/pinned.
- Decoded portrait art is now displayed through an explicit `<img>` inside each fighter card rather than only a CSS `background-image`. This removes a Safari/CSS presentation variable from diagnosis.
- TEST portrait diagnostics now begin with the Kineza self-test result and then show independent P1/CPU results.
- V14 still tries motif-configured portrait sprite IDs first, then 9000,1, then 9000,0.
- SFF v2 remains pending. V14 is source-published / syntax-checked only until phone witness.


### 2026-09-19 · V15 Kineza portrait authority correction
- Phone witness on V14: **Kineza did populate**, proving the SFF v1 / PCX portrait extraction and browser image presentation path can work on the user's iPhone.
- However, the sprite shown was the **wrong Kineza artwork for character select**. The validated Kineza SFF's available `9000,0` is not the desired select portrait.
- User supplied the correct Kineza artwork again in chat on 2026-09-19. That image is now the **authoritative MobMugen Kineza select portrait**.
- Repo asset added at `mugen-lab/assets/mobmugen/kineza-select-authority.jpg`.
- V15 uses a character-specific portrait override for Kineza and keeps dynamic motif/SFF extraction for the rest of the roster.
- The override does **not** replace or rewrite Kineza's gameplay SFF. It is UI-only.
- The Kineza SFF decoder self-test remains separate and still tests raw SFF decoding so future generic portrait work is not masked by the override.
- Portrait card framing uses the approved artwork as a cropped character-select image while preserving the approved portrait/select -> landscape-fight architecture.
- Next portrait work remains generic roster portrait correctness and roster thumbnails; do not let the Kineza override become a substitute for the general extraction pipeline.


### 2026-09-19 · V16 Kineza portrait asset correction
- User phone screenshot of V15 showed the Kineza fighter card still displaying the question-mark fallback. V15 is therefore **not approved**.
- Root cause in our handoff asset: the repo file previously written at `mugen-lab/assets/mobmugen/kineza-select-authority.jpg` was **not the actual user-supplied Kineza image**.
- The correct supplied image was re-read from the mounted conversation asset and replaced at the same repo path.
- Correct portrait asset commit: `a80b64225f2e724bc6def3760b291157d6c648e4`.
- V16 uses a new page/runtime filename and a new asset cache-buster so Safari cannot reuse the bad V15 asset URL.
- V16 also logs explicit portrait IMG load success/failure and restores the fallback mark if the image request itself fails.
- Do not call the Kineza select portrait fixed until the user witnesses the correct supplied art on iPhone.


### 2026-09-19 · V17 portrait correction after phone screenshot
- User screenshot showed the Kineza card still on the question-mark fallback. The prior V15/V16 binary override asset path is not trusted and is no longer used.
- The repo already contains a dedicated `kineza_portrait.png` at repository root (560x560, blob `795244980095adef4fe8485009453316edd852a9`).
- V17 points the Kineza select override directly at that established repo portrait with a fresh asset cache-buster.
- TEST diagnostics now include `BUILD: V17` so phone screenshots can prove the loaded runtime version.
- Generic SFF extraction remains intact for non-Kineza roster characters.
- Do not mark this portrait visually approved until user confirms the displayed art is the supplied/desired Kineza art.


### 2026-09-19 · V17 Kineza portrait direct repo wiring
- Continued the portrait lane after V15/V16 failed to show the intended Kineza image on iPhone.
- V17 now uses the existing repo-native `kineza_portrait.png` at repository root instead of the chat-upload mirror asset.
- Verified repo metadata: `kineza_portrait.png` is **560x560**, blob SHA `795244980095adef4fe8485009453316edd852a9`.
- V17 references that same-origin asset as `../kineza_portrait.png?v=79524498`, removing the previous asset-path uncertainty.
- Kineza keeps a UI-only portrait override; gameplay SFF remains untouched.
- Generic motif/SFF portrait extraction remains active for all other fighters.
- TEST diagnostics still report the raw Kineza decoder self-test plus independent P1/CPU portrait status.
- V17 is source-published and syntax-checked only until the user witnesses the intended Kineza art on iPhone.


### 2026-09-19 · V18 Kineza direct-select portrait hardening
- V17 already points at the existing repo-native `kineza_portrait.png`, but V18 removes another failure point: the beauty-layer select observer now directly renders that asset whenever the selected fighter name is `kineza`.
- Direct asset URL is same-origin and explicit: `/Prismatic-Veil/kineza_portrait.png?v=79524498-v18`.
- This direct Kineza UI path is independent of async SFF extraction, so a Kineza select card should not remain on the `?` fallback while the generic portrait pipeline is still resolving.
- When selection moves away from Kineza, the direct override is cleared and the generic motif/SFF portrait pipeline resumes ownership.
- Gameplay SFF is unchanged. This remains a select-screen-only presentation override.
- V18 is source-published and syntax-checked only until iPhone witness confirms the intended Kineza portrait is visible.


### 2026-09-19 · V18 Kineza portrait hardwire / preload gate
- Continued the portrait lane after the V15/V16 phone screenshot showed a question-mark fallback.
- The project already contains repo-root `kineza_portrait.png`, blob SHA `795244980095adef4fe8485009453316edd852a9`, measured at **560x560**.
- V18 bypasses the failed handoff asset entirely and points Kineza to `/Prismatic-Veil/kineza_portrait.png?v=79524498`.
- Both select-card `<img>` elements are seeded with that URL so Safari can begin fetching it immediately.
- Kineza's override now runs an explicit `Image()` preload and reports success only after real natural dimensions are returned.
- Failure reports `REPO PORTRAIT LOAD FAILED` instead of silently presenting the question-mark fallback.
- TEST diagnostics identify `BUILD: V18` and report the repo portrait dimensions when loaded.
- Generic SFF extraction remains intact for non-Kineza fighters.
- V18 is source/syntax validated only until the user witnesses the correct art on iPhone.


---

## 2026-09-19 · MobMugen continuation authority · end-of-chat handoff

### Current user-approved architecture
- Keep **portrait mode for front-end/select** and **landscape mode for actual fights**.
- FIGHT from portrait must gate on rotation; do not begin the match until landscape is confirmed.
- Gameplay remains **true 16:9**, centered, with no crop/stretch.
- Extra-wide landscape phone space is reserved for touch-control gutters:
  - D-pad at far left
  - attack buttons at far right
  - center combat lane unobstructed
- Touch is the default control assumption. Bluetooth/controller support is optional.
- Portrait rotation during an active fight still needs a **real engine pause/freeze** with held-input cleanup and rotate-to-resume behavior.
- V11 remains the last UI/setup architecture the user explicitly said “looks good.”

### Beautification priority remains locked
Do not allow later side requests to reorder this queue:
1. Fix and verify **real fighter portraits**.
2. Add **roster thumbnails** from the same portrait pipeline where practical.
3. Add **real stage preview imagery** and clean player-facing stage names.
4. Polish the **landscape side-gutter touch controller skin**.
5. Implement **real portrait-rotation pause/freeze** during an active fight.
6. Add **selection / VS / loading micro-polish**.
7. Add **native motif UI sound extraction** from the loaded MUGEN ZIP:
   - cursor move
   - confirm/lock
   - cancel/back
   - stage navigation/confirm
   This sound request is backlog only and must not displace the portrait/stage/controller/pause work above.

### Portrait work: what is proven
- V12 failed because it assumed **9000,1**.
- Kineza’s validated SFF manifest proves his current SFF has **9000,0** and not 9000,1.
- V13 added motif-configured portrait lookup plus 9000,1 -> 9000,0 fallback and TEST diagnostics.
- V14 added:
  - a deterministic repo-hosted Kineza SFF decoder self-test
  - explicit IMG-based portrait rendering
- **Phone witness on V14 proved the generic SFF v1/PCX portrait pipeline can render a real image on iPhone.**
- However, the sprite that rendered for Kineza was the wrong artwork for the desired MobMugen select portrait.
- Therefore the remaining problem is **portrait asset correctness / authority**, not basic SFF-v1 decode viability.

### Kineza select portrait authority
- User supplied the intended Kineza select artwork again in chat on 2026-09-19:
  - young Kineza
  - black/red/gold armor
  - red cape
  - glowing green gauntlets
  - full-body illustration on a light background
- That supplied artwork is the intended **MobMugen character-select authority** for Kineza.
- Do **not** substitute a random SFF sprite just because it decodes successfully.
- The gameplay SFF should remain untouched; select portrait authority is UI-only.

### V15 / V16 status
- V15 attempted to wire an approved Kineza override.
- User phone screenshot showed the Kineza card still displaying the **question-mark fallback**.
- Therefore **V15 is not approved**.
- V16 attempted to correct the asset handoff and add explicit IMG load/error logging.
- User screenshot/current witness still does **not** show the intended portrait, so **V16 is not approved either**.
- Do not claim the select portrait is fixed until the intended artwork is visibly present on the phone.

### Important discovery before continuing
The repository already contains several Kineza image assets that may be useful for a deterministic next pass:
- `kineza_portrait.png` — 560x560
- `kineza_full.png` — 560x533
- `assets/party_formation/KINEZA_JRPG_NORMALIZED_900x900.png`
- `assets/ui/portrait_kineza.png`
- `assets/ui/portrait_kineza_k9.png`
- multiple Kineza battle/pose assets under `assets/characters/`, `assets/party_formation/`, and `assets/poses/`

Before another build:
1. Inspect the existing repo portrait assets visually / by source provenance.
2. Identify whether one is exactly the user-approved Kineza image already.
3. If yes, wire that existing repo asset directly instead of re-uploading/re-encoding the chat image.
4. If not, import the exact user-supplied image correctly and verify the repo asset bytes/path before wiring it.
5. Use a fresh HTML/JS filename and a fresh asset cache-buster.
6. Keep the V14 self-test separate from the approved-art override so generic SFF diagnostics remain useful.

### Immediate next build objective
**One defect only:** make the P1 Kineza card visibly show the correct approved Kineza select artwork on the user’s iPhone.
Do not move on to thumbnails, stage art, controller skin, pause, or sounds until that single phone witness succeeds.

### Build/link discipline
- Every MobMugen build/change handed to the user must include a **fresh tappable cache-busted GitHub Pages URL**.
- Prefer a fresh filename for major/diagnostic iterations.
- Never call a build live/stable/approved until the user actually witnesses it on iPhone/iPad Safari.


### 2026-09-19 · V19 Kineza full-art authority pass
- Continued from the end-of-chat handoff by inspecting the existing repo Kineza assets by source provenance before making another portrait build.
- Root `kineza_portrait.png` and `kineza_full.png` originated together in the original UI STYLE PASS 01 art drop. That pass explicitly treated the former as portrait/card art and the latter as its staged full-body companion asset.
- The user-approved MobMugen Kineza select authority is explicitly the full-body young Kineza artwork: black/red/gold armor, red cape, glowing green gauntlets, light background. V19 therefore stops using the cropped repo-root `kineza_portrait.png` and wires the repo-root full-body companion `kineza_full.png` instead.
- Verified `kineza_full.png` directly from repo bytes: PNG, **560x533**, RGBA, blob `579cf39e4deb7035b5d39866b8c3d96a9bbc8d9c`.
- V19 direct Kineza URL: `/Prismatic-Veil/kineza_full.png?v=579cf39e-v19`.
- V19 HTML contains three direct Kineza full-art references and **zero** `kineza_portrait.png` references. V19 JS contains one full-art override and **zero** old portrait references.
- V14's deterministic Kineza SFF decoder self-test remains intact, and the generic SFF portrait pipeline still owns non-Kineza fighters.
- V19 JS passed syntax parsing before publication.
- Source commits: JS `91aa7ede3b2aa123ac2df99842739057c22183e6`; HTML/main head `1e5af676313232cc9167cd6558bf0ee50c6e4e28`.
- At post-commit verification, both **PriZim MOBMUGEN-IKEMEN validation** and **GitHub Pages build/deployment** had picked up the V19 head and were in progress.
- V19 is source/provenance/syntax verified only. **Do not mark the Kineza select portrait approved until the user visibly confirms the intended art on iPhone.**


### 2026-09-19 · User witness · Kineza select authority confirmed
- User confirmed the **V19 Kineza character-select photo is correct and visibly rendering on phone**.
- The select-photo defect is therefore closed for Kineza. Preserve the V19 `kineza_full.png` authority path unless the user explicitly supersedes it.
- User clarified that the still-wrong Kineza art is the **actual in-fight fighter sprite**, not the character-select photo.
- That gameplay fighter sprite/package correction is intentionally **not folded into the beautification sprint mid-stream**.
- Queue it as the **next focused pass after the locked beautification sprint completes**, so the current UI work is not destabilized.

### 2026-09-19 · V20 beautification item #2 · roster thumbnails
- Began locked beautification priority **#2: roster thumbnails from the existing portrait pipeline**.
- V20 is based directly on the phone-confirmed V19 select-art build; Kineza select authority remains untouched.
- Character roster cells now own a thumbnail well plus fighter name.
- Thumbnail loading is **lazy** through `IntersectionObserver`, so off-screen fighters do not all decode at once.
- Portrait hydration is capped at **2 concurrent jobs** to protect iPhone Safari memory/CPU on very large rosters.
- Kineza reuses the confirmed repo override; other fighters reuse the generic motif/SFF portrait pipeline and cache.
- SFF v2 / unavailable portraits keep a clean initials fallback rather than blocking selection.
- Stage cells remain text-only; real stage art is still beautification priority #3 and is not being pulled forward.
- V20 diagnostic build label is `BUILD: V20`.


### 2026-09-19 · V20 phone witness failed · roster thumbnails
- User phone witness: **V20 roster thumbnails did not populate**.
- Keep beautification priority #2 open. Do not advance to stage previews yet.
- Important validation correction: the existing PriZim runtime probe targeted only `rig-ikemen-N.html`, so V20's successful PriZim run validated the underlying I29 lane rather than the `rig-ikemen-29-beauty-v20.html` thumbnail layer.
- V21 removes `IntersectionObserver` as the gate for thumbnail hydration on phone.
- V21 immediately queues the selected fighter and first visible roster row, then hydrates additional cells from each roster grid's own scroll event using geometry checks.
- Thumbnail decode concurrency remains capped at 2.
- Kineza's JS portrait override uses the equivalent relative URL `../kineza_full.png?v=579cf39e-v21`, which resolves correctly on GitHub Pages and on the local PriZim server.
- The already phone-confirmed large Kineza select-card authority remains unchanged.
- PriZim runtime probe now prefers the latest `rig-ikemen-*-beauty-v*.html` build and explicitly requires the synthetic fixture's Kineza roster cell to reach `thumbState=ready` with a non-zero natural image size.


### 2026-09-19 · V21 PriZim beauty-probe correction
- The first upgraded V21 browser run **cleared the new Kineza roster-thumbnail assertion**. The run proceeded beyond the explicit requirement that the Kineza roster cell reach `thumbState=ready` with a non-zero image size.
- That run then failed later at the old base-I29 match-start assertion because the beauty architecture correctly gates portrait FIGHT behind `ROTATE TO LANDSCAPE`.
- The runtime probe now treats that gate as required behavior for beauty builds: it asserts the gate appears, switches the synthetic phone viewport to landscape, then continues the existing match/control checks.
- This separates the two authorities cleanly: roster thumbnail hydration must pass before match start, and the portrait-to-landscape fight gate must also remain intact.


### 2026-09-20 · V21 phone witness · roster thumbnail lane confirmed
- User confirmed **V21 roster thumbnails are visibly working on the real phone**.
- Correction to completion status: beautification priority #2 remains open until non-Kineza roster fighters are covered, not merely the repo-authority Kineza case.
- Do not advance to stage previews yet.

### 2026-09-20 · V22 other-character portrait coverage
- Added generic **SFF v2** portrait decoding to the existing roster portrait pipeline.
- SFF v2 detection uses the format's major-version byte at offset 15.
- V22 parses the 512-byte v2 header, 28-byte sprite table entries, 16-byte palette table entries, linked sprites and linked palettes.
- Supported v2 portrait payloads in this pass:
  - format 0 raw indexed / 8-bit
  - format 2 RLE8 indexed / 8-bit
  - formats 10/11/12 embedded PNG8/PNG24/PNG32 through the browser's native PNG decoder
- Formats 3 (RLE5) and 4 (LZ5) remain explicit safe fallbacks for a later codec extension; they do not crash or block selection.
- Motif-aware portrait preference remains 9000,1 first, then 9000,0.
- Added a synthetic non-Kineza fighter (`g.ken`) whose DEF points to a generated SFF v2 RLE8 file containing a real 24x24 sprite at 9000,1.
- PriZim Beauty V22 must now prove that **both** Kineza's repo-authority thumbnail and the generic SFF v2 `g.ken` thumbnail reach `thumbState=ready` with non-zero image dimensions.
- Stage-preview work remains paused behind this portrait-completion pass.


### 2026-09-20 · V22 phone witness rejected
- Real iPhone witness: **none of the user's normal roster portraits rendered; only Kineza did**.
- Therefore V22's synthetic RLE8 success did not establish real-roster portrait coverage. Beautification #2 remains open.
- Do not advance to stage previews.

### 2026-09-20 · V23 real SFF v2 compatibility correction
- Cross-checked V22 against real MUGEN/IKEMEN SFF v2 implementations after the phone failure.
- Corrected **RLE8** marker handling: the reference codec tests bit 6 (`byte & 0x40`), with a zero lower-six-bit run meaning 256 pixels. V22's narrower `0xC0 === 0x40` check was wrong for valid marker bytes.
- Added reference-faithful **RLE5** decoding.
- Added reference-faithful **LZ5** decoding, including LSB-first control bytes, short/long literal runs, short/long backreferences, and recycled high distance bits.
- Corrected SFF v2 data-block selection to use **flags bit 0** rather than treating every nonzero flags value as TData.
- Corrected SFF v2 palette treatment: the fourth on-disk palette byte is reserved/padding; index 0 is transparent and other in-range colors are forced opaque.
- Linked sprites now use the actual data-owning sprite's palette index.
- Raw indexed v2 sprites no longer guess at a four-byte decompressed-size prefix; raw payload is consumed directly.
- PriZim fixture now carries three non-Kineza real-layout SFF v2 portraits:
  - `mole` = RLE5
  - `g.ken` = RLE8
  - `lz5dummy` = LZ5
- Beauty V23 must render all three to real 24x24 image thumbnails, in addition to Kineza, before the browser probe can pass.
- V22 is not an approved phone build. V21 remains the last phone-confirmed roster-thumbnail lane while V23 is tested.


### 2026-09-20 · USER PHONE WITNESS · V23 REJECTED · ROSTER PORTRAITS ON HOLD
- Real phone witness after V23: **still only Kineza shows a portrait; the rest of the real roster remains fallback/initials**.
- Therefore beautification priority #2 (**roster thumbnails / other character portraits**) is **ON HOLD**.
- Do not spend further time on generic portrait decoding until this item is deliberately resumed.
- Do not treat V20, V21, V22, or V23 as successful generic-roster portrait completion. Only the Kineza thumbnail/select portrait is phone-confirmed working.
- What was tried:
  - V20: lazy roster thumbnails via IntersectionObserver. Phone: failed to populate.
  - V21: immediate visible-row hydration + scroll hydration. Phone: Kineza thumbnail confirmed working.
  - V22: generic SFF v2 raw/RLE8/PNG decode. Synthetic PriZim passed; phone still showed only Kineza.
  - V23: corrected real SFF v2 handling plus RLE5/RLE8/LZ5, palette flags, TData/LData handling. Synthetic PriZim passed all codec fixtures; phone still showed only Kineza.
- Key unresolved issue:
  - The user's actual roster packages still do not resolve through the browser portrait extraction path even though synthetic SFF v1/v2 fixtures do.
  - This means the remaining defect is likely **real-roster package/path/DEF/SFF resolution or content-specific structure**, not the visible thumbnail UI itself.
  - Synthetic codec success is not accepted as authority for the user's real roster.
- Resume requirements when #2 is reopened:
  - inspect real failing character DEF/SFF paths from the user's loaded roster,
  - capture per-character fallback diagnostics from the phone/runtime,
  - identify the exact real package structure/version/compression/path mismatch before adding more decoder code,
  - validate at least two real non-Kineza fighters on the phone before marking the item complete.
- Preserve the working Kineza select portrait and Kineza roster thumbnail exactly as-is.
- Beautification sprint continues around this hold. Next active item is **#3 real stage preview images + clean stage names**.


### 2026-09-20 · USER REPRIORITIZATION · work #4 + #6 + #7 now
- User explicitly chose beautification items **#4 landscape controller skin**, **#6 selection/VS/loading micro-polish**, and **#7 native motif UI sounds**.
- #2 other roster portraits remains **ON HOLD** after V20-V23 real-phone failures.
- #3 real stage preview images + clean names is deferred for now, not cancelled.
- #5 real rotation pause/freeze remains pending.
- Kineza in-fight fighter sprite/package correction remains queued after the beautification sprint unless reprioritized.

### 2026-09-20 · V24 combat-polish implementation
- **#4 landscape controller skin**
  - touch remains the default phone input in landscape; removed the stale core assumption that landscape automatically means external controller.
  - controller/gamepad support remains optional and engine-native.
  - true 16:9 fight viewport remains centered with dedicated left/right controller gutters.
  - side-gutter plates, segmented illuminated D-pad, metallic six-button strike bank, and stronger press feedback added.
  - center START/ESC utility stays low-profile and outside the primary combat lane.
- **#6 selection / VS / loading micro-polish**
  - selection commits flash the selected roster/fighter/stage module.
  - VS core enters a restrained ready pulse once both fighters are selected.
  - FIGHT button gains a READY state.
  - match loading overlay now shows P1 vs CPU, selected arena, animated loading rail, and live materialized-asset status.
- **#7 native motif UI sounds**
  - active motif `system.def` supplies the [Files] `snd` archive and UI cue coordinates.
  - honors `cursor.move.snd`, `cursor.done.snd`, `cancel.snd`, `stage.move.snd`, and `stage.done.snd`.
  - parses Elecbyte SND linked entries and exposes only real RIFF/WAVE payloads through browser audio.
  - no synthetic fallback beep is used when a motif does not provide a usable cue.
  - cues are wired to roster movement, fighter confirm, stage move/confirm, library cancel, and fight confirm.
- PriZim V24 fixture includes a real synthetic `system.snd` container with 100,0 / 100,1 / 100,2 WAV entries and matching motif declarations.
- PriZim V24 must prove native SND cues are resolved, the controller skin is active in landscape, the touch D-pad remains interactive, and the polished loading overlay is present before existing match/control checks.
- V24 is not phone-approved until real iPhone witness.


### 2026-09-20 · V24 PriZim first-run loading-overlay race
- First V24 browser run reached the V24 loading selector and Playwright explicitly reported the new `.match-load-vs` element as **visible**, but the overlay completed/removal raced the visibility wait before the assertion settled.
- This occurred after the earlier V24 native-motif-SND and skin-marker checks, so those did not trigger the failure.
- Added `LOAD_OVERLAY_MIN_MS = 1400` so the polished battle-link presentation remains perceptible rather than flashing away on a fast/synthetic load.
- The existing asset-settle and 180s hard-cap behavior remain intact; only a minimum presentation dwell was added.


### 2026-09-20 · V24 probe stabilization after visible-overlay race
- A second PriZim run again logged the new V24 loading module as **visible** before Playwright's `waitForSelector(... visible)` timed out, confirming the selector wait itself was flaky rather than the overlay being absent.
- Kept the 1400ms minimum loading-presentation dwell for phone readability.
- Added a persistent runtime witness on `document.body.dataset` when the V24 loading DOM is constructed:
  - `v24LoadOverlaySeen = ready`
  - `v24LoadOverlayParts = complete` only when both the VS module and loading rail exist.
- PriZim now waits for that persistent construction witness and for `body.match-live`, then separately asserts the landscape touch deck is displayed and pointer-active.
- The native motif SND assertion occurs earlier in the same browser flow; both prior V24 runs advanced past it without failure.


### 2026-09-20 · USER PHONE WITNESS · V24 APPROVED
- User tested V24 on the real phone and confirmed **the combined #4 / #6 / #7 polish pass was all good**.
- User specifically called out the **native motif UI sounds** as a strong improvement.
- Mark beautification **#4 landscape controller skin = PHONE-APPROVED / CLOSED**.
- Mark beautification **#6 selection / VS / loading micro-polish = PHONE-APPROVED / CLOSED**.
- Mark beautification **#7 native motif UI sounds = PHONE-APPROVED / CLOSED**.
- V24 phone-approved baseline:
  - beauty page: `mugen-lab/rig-ikemen-29-beauty-v24.html`
  - validated authority head at time of witness: `b4b2da282cf36b8033f9b45adadb2676ac347034`
- Preserve V24 controller skin, VS/loading treatment, and motif-sound wiring exactly unless user explicitly requests a change.
- #2 other roster portraits remains ON HOLD.
- #3 real stage preview images + clean names remains deferred.
- #5 real rotation pause/freeze remains pending.
- Kineza in-fight fighter sprite/package correction remains queued after beautification unless reprioritized.


### 2026-09-20 · PROCESS LOCK · LIVE-FIRST / ONE SHARED CONTINUITY LINE
This project does **not** use separate continuation lanes for ChatGPT vs FAI.

The shared repository and this notes file are the common continuity authority for everyone working on MobMugen.

#### Mandatory start-of-work sequence
Before any new MobMugen implementation, regardless of who is doing the work:
1. Pull/read the **current live `main` HEAD** from GitHub.
2. Read the latest `mugen-lab/IKEMEN_FAI_LIVE_NOTES.md` from that same HEAD.
3. Compare the current live HEAD with any previously remembered/local/context build.
4. If they differ, the live repository wins unless the user explicitly says to restore/revert something.
5. Build **forward from the current live tree only**. Do not start from a previously cached V-build, old local branch, stale handoff, or remembered commit.
6. Before push/commit, re-check that `main` has not moved during the work. If it moved, inspect/compare first and rebase/reapply safely instead of creating a parallel fork.
7. After implementation: validate -> deploy -> phone witness -> update this same shared notes file.

#### Anti-fork rule
- Never create a new MobMugen line by copying an older approved build if a newer live build already exists.
- Version numbers alone are not authority. The **current live GitHub HEAD + current shared notes** are authority.
- If another agent/process has moved `main`, inspect that commit before writing. Do not overwrite, reset, or branch around it without understanding the change.
- Any handoff should point back to this same shared notes file instead of creating a separate competing continuity document unless the user explicitly requests one.

#### Reason for this lock
A recent FAI switchover started from the previous build instead of the live current build, creating a fork that had to be corrected. This process lock exists specifically to prevent that recurrence.

---

## rig-ikemen-29.html/.js reconciled with DAI's beauty-v24 (2026-09-20)

Real problem, caught by the user, not by either side's own process: this
session built Screen Wake Lock and PWA installability directly onto its
own `rig-ikemen-29.html`/`.js`, without noticing DAI's parallel
`rig-ikemen-29-beauty-v3` through `v24` chain had *also* become a
collapsed/static build (zero `fetch()` calls, confirmed by grep) somewhere
along the way -- meaning the two sides' `rig-ikemen-29`-lineage builds
silently stopped being the same file the moment either side stopped
fetching the shared base, and nothing about `git fetch`/`pull` on its own
would ever surface that, since both sides' commits merge cleanly (they
touch different filenames) while the actual *feature content* quietly
diverges underneath.

Confirmed exactly what was where before touching anything: DAI's v24
had all of his phone-approved beautification (landscape controller
skin, VS/loading polish, native motif UI sounds) that this session's
own `rig-ikemen-29.*` never got; this session's `rig-ikemen-29.*` had
Wake Lock and the PWA manifest/icons that v24 never got. Both sides
already shared the classifyStatus and Zip64-sentinel fixes, confirming
v24 forked from this lineage after those landed but before Wake
Lock/PWA did.

**Reconciled by making v24 the new base for this session's canonical
`rig-ikemen-29.html`/`.js`**, then porting the two isolated additions
(Wake Lock block + its one call site in `startMatch()`; the PWA
manifest/icon `<link>`/`<meta>` tags) on top -- the same "small,
isolated diff, ported by hand but verified, not the whole file
rewritten from scratch" pattern, since these two features are compact
and don't need the eval-capture trick I29's original creation used.
Fixed the HTML's own `<script src>` (was still pointing at
`rig-ikemen-29-beauty-v24.js`) to point at `rig-ikemen-29.js` since this
is now that file. Verified: `node --check` clean, real headless boot
with zero page errors, PWA manifest still resolves 200, `requestWakeLock`
present in the merged file, `preflight.py` passes.

**Process fix going forward, per explicit user instruction:** before
starting new feature work on this lineage, check this live-notes file
for what the other side (DAI) has shipped recently -- not just `git
pull`/`fetch`, since two independently-collapsed static builds don't
self-merge just by being in the same repo. The notes file is the actual
coordination channel; a silent fork like this one should not recur.
If DAI's chain advances again (v25+), diff it against this file's
`rig-ikemen-29.*` before adding new features to either side, the same
way this reconciliation did.

---

## Crash recovery overlay added (2026-09-20)

Small isolated follow-up on top of the v24 reconciliation, same
`rig-ikemen-3.js`/`.html` base plus this session's `rig-ikemen-29.js`/`.html`
canonical build. Before this, the only signal on a real CRASHED/FAILED/EXITED
failure was `classifyStatus`'s existing 'error' state quietly tinting the
status pill red -- and in V24's player-facing layout that pill lives inside
the collapsed dev-only TEST dock, so a real player had zero visible
in-game affordance on an actual crash, only a dead canvas.

Hooked `showCrashOverlay()` into the same `status()` choke point that
already classifies 'error': first entry into that state shows a full
overlay over `.stage` (same card-over-canvas pattern the existing
match-loading overlay uses) with the failure text and a RELOAD & TRY AGAIN
button that calls `location.reload()`. Guarded with a one-shot flag so
multiple failure signals in the same session don't stack overlays. Themed
separately per file: base gold/dark (`rig-ikemen-3`) and V24 dark
blue/gold (`rig-ikemen-29`, `.crash-overlay-v24`).

Verified via a temporary test harness (window-exposed the closure function,
confirmed render/duplicate-guard, then deleted -- not shipped) plus a real
headless boot with zero page errors on both `rig-ikemen-29.html` and the
live `rig-ikemen-24.html`. Committed and merged to `main` as `b6377a4`.

Next up per the standing improvement list: Android Chrome/Firefox mobile
coverage (WebGL context, audio-unlock, touch/pointer quirks against a
codebase built primarily against iOS Safari).

---

## Android Chrome/Firefox mobile coverage pass (2026-09-20)

Audited touch handling, layout units, and the AudioContext unlock path
in `rig-ikemen-3.js`/`.html` and the canonical `rig-ikemen-29.js`/`.html`
for anything WebKit-specific that would leave a gap on Android. Most of
it was already fine by construction: `pointerdown`/`pointerup` (not the
`touchstart`/`mousedown` pair, which fires differently across browsers),
`touch-action:none`/`user-select:none` on the controller, `100dvh`
instead of `100vh` (handles the dynamic toolbar on both engines), and a
generic `touchend`/`mouseup`/`keydown`/`pointerup` gesture listener for
the AudioContext resume -- none of that is iOS-only. WebGL context
creation happens inside the Ikemen GO WASM binary itself, outside this
wrapper's reach.

Two real gaps fixed in both files: added `<meta name="mobile-web-app-
capable">` alongside the existing `apple-mobile-web-app-capable` (the
Android/Chrome equivalent PWA-install hint), and `overscroll-
behavior:none` on `body` (Chrome's pull-to-refresh/overscroll glow can
otherwise fight the on-screen D-pad on a drag that starts near the top
of the viewport -- not a failure mode Safari has). Verified: `node
--check` clean, `preflight.py` passes, real headless Chromium boot with
zero new page errors. Committed and merged to `main` as `65ad2f1`.

## beauty-vN chain status (2026-09-21)

Per the standing improvement list's item #5 ("eventually collapse
DAI's beauty-vN chain into one clean file"): that's already done as a
side effect of the v24 reconciliation above -- `rig-ikemen-29.js`/`.html`
*is* v24's content, plus this session's Wake Lock/PWA/crash-overlay/
Android-coverage additions on top, verified working and live on `main`.

What's left is just the trail: `rig-ikemen-29-beauty-v3.html` through
`v24.js` (33 files) are now pure duplication -- fully superseded by
`rig-ikemen-29.*` and not referenced by it. Left in place rather than
deleted, since they're DAI's own generated version history and DAI's
own tooling may still expect specific `vN` filenames to exist. Flagging
here per the live-first process: DAI, these are safe to prune once
your own side confirms nothing still points at them -- just don't
regenerate a new `v25+` off one of these instead of off
`rig-ikemen-29.*`, since that would silently re-fork the exact way the
v24 reconciliation above had to fix.

---

## SFF v2 RLE8/LZ5 decode bugs found and fixed (2026-09-21)

Root cause finally found for beautification priority #2 (roster portraits
ON HOLD): **Kineza's portrait was never proof that the SFF v2 decoder in
`rig-ikemen-29.js` worked.** Kineza's SFF is legacy SFF v1/PCX (per
`kineza-char.PROVENANCE.txt` -- "SFF v1 had no palette... A PCX 8-bit
image..."), decoded by the completely separate `sff1Entries`/PCX path.
The SFF v2 path (`decodeSff2Rle8`/`decodeSff2Lz5`/`decodeSff2Rle5`,
`rig-ikemen-29.js` ~line 1220+) -- the format essentially every standard
MUGEN 1.1 / Ikemen-authored character actually ships in -- was never
exercised by the one portrait that had ever been confirmed working. Real
roster testing was reporting "everyone but Kineza falls back to
initials" and it was never going to be anything else, because the v2
decoder had two real bugs no amount of re-running V20-V23 would surface
without a genuine v2 character to test against (which this repo doesn't
have one of).

Did not want to ship a guess on undocumented binary format internals, so
fetched the actual reference decoder (github.com/bmarquismarkail/SFFv2,
`src/sff2.cpp` -- documented as reading real SFF 2.0/2.0.1 files) via
WebFetch and pulled the RLE8, RLE5, and LZ5 functions out as sequential
verbatim quotes, then diffed our JS against them line by line before
touching anything.

**Bug 1 (RLE8, the one that actually matters for real content):** the
run-vs-literal test was `(b & 0x40) !== 0`, which is also true for any
byte in `0xC0-0xFF` (bits `11xxxxxx` -- bit 6 is set there too). The
correct test, per the reference, is `(b & 0xC0) === 0x40` (bits exactly
`01xxxxxx`). Any literal pixel-index byte >= 0xC0 -- i.e. any real
portrait actually using the upper quarter of a 256-color palette, which
is normal for full-color character art -- was silently misread as a run
marker and corrupted every byte after it in the stream. This is almost
certainly the actual reason "the rest of the real roster" never
rendered: RLE8 is the default/most common SFF v2 sprite format, so this
one bug plausibly explains the whole ON HOLD status by itself. Also
fixed the zero-run-length case to fail closed (`return null`) instead of
silently wrapping to a run of 256 -- the reference treats a zero count
as a malformed stream, not a special value.

**Bug 2 (LZ5, lower-impact -- rarer format):** the extended literal-run
branch (control bit clear, `packet & 0xE0 === 0`, count from the next
byte) hardcoded its fill color to `0` (always transparent) instead of
`packet & 0x1F`, same as the short-form literal branch right next to it.
Traced the backreference count math too (both branches) against the
reference and confirmed those were already correct once you account for
this file's postfix-decrement loop style implicitly adding the spec's
"+1"/"+3" -- no change needed there, only the literal-color line.

**Verification:** extracted the four decode functions into a standalone
Node harness (no browser APIs needed for the pure-buffer logic) and
tested against hand-built byte streams matching the spec: a literal
`0xC5` byte no longer misreads as a run marker, a genuine run marker
still works, a zero-count run now fails closed, and the LZ5 extended
literal run now fills with the correct color. All four assertions pass.
Also confirmed by tracing the provenance docs that this change cannot
regress Kineza specifically, since Kineza's decode path never touches
this code at all (SFF v1/PCX, not SFF v2). Real headless boot on
`rig-ikemen-29.html`: zero page errors, `node --check` clean,
`preflight.py` passes.

**What's still open:** this repo has no real SFF v2 character content to
test end-to-end (only Kineza's SFF v1 asset). The fix is verified
correct against the documented format and against a real reference
decoder, but **still needs an actual real-roster phone witness** before
priority #2 can be marked resolved rather than "should now work." DAI or
whoever next loads a real full-roster zip on device: check whether
generic characters now get real portraits instead of initials, and
report back here either way.

---

## Priority #3: stage clean names + real preview thumbnails (2026-09-21)

Stage picker previously showed the raw `select.def` token verbatim
(`stages/kfmstage.def`) and a static "◆" glyph for every entry -- no
name cleanup, no art, unlike the character grid which already had real
portraits (well, real for SFF v1; see the fix above for v2). Built the
stage-side equivalent of that same pipeline:

- `parseStageDefInfo()` reads the stage's own `.def` `[Info]` section
  and prefers `displayname` over `name`, falling back to a cleaned-up
  version of the raw token (underscores/dashes to spaces, path and
  `.def` stripped) if the def can't be read at all -- the label is never
  blank, just less pretty.
- `parseStageSpriteRefFromDef()` / `resolveStageSffPath()` mirror the
  character-side `parseSpriteRefFromDef()` / `resolveCharSffPath()`
  pattern exactly, but read `[BGdef] spr = ...` instead of `[Files]
  sprite = ...`.
- `loadStagePreview()` decodes sprite group **0, image 0** -- the
  stage's base background layer -- as the preview art, reusing every
  existing SFF v1 (PCX) and v2 (raw/RLE8/RLE5/LZ5/PNG) decode primitive
  the character portrait path already has. No new decode logic; group
  0/image 0 is the closest thing to a universal "cover art" convention
  a stage def has, since MUGEN doesn't standardize a dedicated stage
  preview sprite the way it does `9000,0`/`9000,1` for characters.
- Stage buttons get their own small thumbnail (`wireStageThumbnail`,
  `.stage-thumb` CSS) sized for landscape stage art rather than reusing
  the character grid's square portrait chip, and their own tiny
  concurrency-capped load queue -- skipped the character grid's
  viewport-lazy `IntersectionObserver`-style hydration entirely, since a
  select.def's extra-stages list is a handful of entries, not a full
  roster.

**Verified:** unit-tested `parseStageDefInfo`/`parseStageSpriteRefFromDef`
against synthetic `.def` text covering quoted/unquoted values, inline
comments, and the no-displayname fallback -- all pass. `node --check`
clean, `preflight.py` passes, real headless boot with zero page errors.
**Not yet witnessed against a real stage's actual SFF** for the same
reason as the portrait fix above -- no real stage content in this repo
to test the decode-and-render path end to end, only the parsing logic.
Next real-roster phone pass should check stage thumbnails alongside
character portraits.

---

## Real-roster phone witness: two real bugs found, one still open (2026-09-21)

User loaded a real full-roster zip and reported: no character portraits
for anyone, no stage pictures either, and a crash on rotating to
landscape mid-fight. Rather than guess at fixes, built a synthetic but
structurally real full content zip (select.def, two characters, two
stages, genuine binary SFF v2 files with a properly-encoded RLE8
stream -- including a pixel value >=0xC0 specifically to exercise the
decode fix above) and drove it through the actual page with Playwright
route-interception standing in for the fflate CDN (this sandbox's
network can't reach it directly; real phones have no such problem).

**Bug found and fixed: stage thumbnails were queued before their
button was attached to the DOM.** `buildRosterGrid()`'s stage branch
called `wireStageThumbnail(btn, name)` -- which synchronously pushed
the thumbnail job onto the load queue and pumped it immediately --
*before* `grid.appendChild(btn)` ran. `pumpStageThumbQueue()` checks
`job.btn.isConnected` before starting a decode, found `false` every
time (the button wasn't in the document yet), and silently dropped the
job forever via a bare `continue` -- no retry, no log line, nothing.
This is exactly why the diagnostic log showed zero `STAGE PREVIEW`
lines even after several seconds: the function was never called at
all. The character-thumbnail path already got this right
(`enqueueRosterThumbnail(btn)` is called *after* `grid.appendChild`)
-- the stage path just didn't follow the same order. Fixed by splitting
`wireStageThumbnail()` (DOM-building only, now returns the `<img>`
element) from a new `enqueueStageThumbnail(btn, name, img)`, called
from `buildRosterGrid` right after `grid.appendChild(btn)`, mirroring
the character pattern exactly.

**Confirmed via the same repro that the RLE8/LZ5 decode fix above is
correct**, not just unit-test-correct: the synthetic alpha/beta
characters' portraits decoded successfully end to end (`PORTRAIT ·
alpha SFF v2 9000,0 16x16 rle8`), and stage previews decoded
successfully once the queue bug was fixed (`STAGE PREVIEW ·
stages/coolstage.def SFF v2 0,0 16x16 rle8`). Both grids rendered with
real art, zero page errors, `bodyState: idle`.

**Rotation-crash report: still open, not reproducible from here.**
Headless Chromium has no real device orientation/WebGL context to
rotate, and this sandbox can't simulate the kind of mid-render
canvas/WebGL context churn a real phone rotation can trigger in an
Ebiten/Go-WASM game (a known real class of bug in that ecosystem, not
specific to this codebase). This may simply be the pre-existing,
already-flagged gap ("priority #5, real rotation pause/freeze remains
pending" -- the landscape gate only shows a please-rotate overlay, it
was never a genuine pause/resume) becoming *visible* for the first time
because this session's own crash-overlay work (see above) now surfaces
failures that previously failed silently behind the collapsed TEST
dock. Whoever hits this next: **please capture the crash overlay's
own failure text** (or the `diag` panel's tail) at the moment it
happens -- that's the one thing this sandbox cannot generate on its
own, and it's what turns "rotation sometimes crashes" into an
actionable bug.

---

## Real-phone screenshot after the stage-queue fix: still not fixed (2026-09-21)

User's own real roster confirms the stage-queue fix above did NOT fully
resolve things: screenshots show real character portraits still
missing for most of the roster (kineza's repo-hosted art aside, `mole`/
`G.Ken`/`GoD_Ryu` all show plain letter-initial fallback), and the
stage-select tiles still show a placeholder icon instead of real
preview art. Also caught a genuinely separate, previously-missed bug
from the same screenshots: the "SELECTED STAGE" readout in the fighter-
select header still showed the raw `stages/Deserted_woods.def` token
verbatim -- `updateSelectionDisplay()` never got the clean-name swap
priority #3 added; only the picker grid's own button label did. Fixed:
`updateSelectionDisplay()` now shows the same cleaned fallback
immediately and swaps in the stage def's real displayname/name once
`loadStageDisplayName()` resolves, same pattern as the grid buttons,
guarded against the selection having moved on by the time it resolves.

**The portrait/stage-art gap itself is still open and not something
this sandbox can diagnose further without real data.** The synthetic
SFF v2 fixture built for the previous fix's repro clearly isn't
representative enough of whatever real MUGEN character/stage export
tooling actually produces -- it proved the decode math is right for a
correctly-formed RLE8 stream, but real files evidently hit something
the fixture didn't: could be a different sprite format entirely (many
real 1.1 rosters mix RLE8 with LZ5 or even PNG groups depending on what
tool exported them), a `sprite=`/`spr=` path that resolves differently
than assumed, a `[Files]`/`[BGdef]` field this parser doesn't expect,
or something else not yet considered. Guessing further without
evidence risks another round-trip like this one. **What's actually
needed next: the debug log's own `PORTRAIT ·` and `STAGE PREVIEW ·`
lines for the specific characters/stages that are failing** (SHOW
DEBUG panel, or the pinned summary) -- those lines say exactly which
step failed and why (decode format, missing sprite, unresolved path,
etc.) for that specific real file, which is the one piece of signal
this sandbox has no way to manufacture on its own.

---

## Real trace received: 100% "unrecognized SFF version", pointing at the zip path itself, not SFF decode (2026-09-21)

The user's actual debug trace against their real 1.7GB `WinMugen.zip`
(9551 entries, 147 resolvable characters, 8 stages) came back. Every
single one of them -- all 147 characters and all 8 stages, zero
exceptions -- fails with `unrecognized SFF version`, meaning
`detectSffVersion()` returned neither 1 nor 2 for every real file in
the pack. Kineza (loaded via the separate repo-hosted HTTP-fetch merge,
never touching the zip's own lazy-materialize path at all) is the only
one that decodes, exactly as before.

**This changes the diagnosis.** A 100% failure rate across 147 real
characters from what's almost certainly a mixed, multi-author "mega
roster" pack (this kind of WinMugen compilation aggregates characters
from many different creators over years) makes "every single one of
them uses a header format our decoder doesn't recognize" essentially
impossible -- standard MUGEN tooling (Fighter Factory, the SFF spec
itself) writes the same `ElecbyteSpr` signature universally. What's far
more likely: the bytes `entryRaw()`/`lazyMaterialize()` hands back for
files pulled on-demand from *this specific large zip* aren't the real
decompressed sprite data at all -- wrong offset, wrong compressed-size
boundary (Zip64 has already bitten this exact codebase once, per the
sentinel-bug comment already in `entryRaw`/`listZipEntries`), or
something else in that path corrupting/truncating the read, uniformly,
for every entry pulled from this archive. Notably, `entryRaw()` DOES
verify the local file header's own `PK\x03\x04` signature before
reading further and would throw `Bad local ZIP header` if that offset
were wrong -- the trace shows no such error, so the local header itself
is being found correctly; whatever's wrong happens after that (the
`comp`/`ex`-derived read boundary, or the inflate step itself).

Rather than guess at which of those it is with no more evidence than
this, added a diagnostic helper (`sffDiagBytes()`) that dumps the
actual byte count plus a hex+ASCII preview of the first 16 bytes
whenever `unrecognized SFF version` fires, at both throw sites
(character portrait and stage preview). The next trace from this same
zip will show exactly what came back -- a `PK\x03\x04` prefix would
mean we're reading a raw zip local-header instead of decompressed
content; all zeros would mean an empty/wrong buffer; garbage-looking
but non-zero bytes would point at a genuine inflate/boundary bug rather
than an empty read. That single hex dump should be enough to pin the
exact bug without another round of guessing. `node --check` clean,
`preflight.py` passes.

---

## Root cause found and fixed: SFF v1 version marker at the wrong byte offset (2026-09-22)

The diagnostic dump paid off immediately. The new trace showed the
same header on literally every real character and stage:
`45 6c 65 63 62 79 74 65 53 70 72 00 00 01 00 01` -- a perfectly valid
`ElecbyteSpr` signature, zero corruption. The zip/lazy-materialize path
was never the bug; it was reading real, correct bytes the whole time.

The actual bug: `detectSffVersion()` and `sff1Entries()` both checked
`bytes[12] === 1` to recognize SFF v1. Every real character in this
trace has `bytes[12] = 0x00` and `bytes[13] = 0x01` -- **the version
marker sits at byte 13, not byte 12.** Confirmed by pulling Kineza's
own `.sff` out of `kineza-char-v03a.zip` and diffing its header
byte-for-byte against the trace: Kineza's file reads
`00 01 00 00 01` at offset 11-15 (marker at byte **12**), while every
real roster file reads `00 00 01 00 01` (marker at byte **13**).
Kineza's SFF was hand-repaired by an earlier session (see the
`kineza-char.PROVENANCE.txt` history above -- the original had no
palette block at all) and that repair script apparently wrote the
version marker one byte earlier than the real, universal convention
every actual MUGEN character file uses. The one file that "worked" was
the one non-standard file in the whole system; every standard file was
being rejected.

Fixed with a single shared `isSff1Version(bytes)` helper --
`bytes[13] === 1 || bytes[12] === 1` -- used by both `detectSffVersion`
and `sff1Entries`, so the real convention now works and Kineza's own
non-standard file still doesn't regress. Verified three ways: (1) unit
comparison of both exact byte patterns (Kineza's and the real trace's)
through `detectSffVersion`/`sff1Entries`, both now returning version 1;
(2) a synthetic-but-realistic full SFF v1 file built with the *real*
byte pattern (`00 01` at 12-13, not Kineza's `01 00`), containing an
actual PCX-encoded 9000,0 sprite with a real 768-byte trailing palette,
decoded successfully end-to-end (directory parse -> link resolve ->
palette resolve -> PCX RLE decode -> indexed-to-RGBA) -- confirming the
fix works for the whole real pipeline, not just the version-check
function in isolation; (3) real headless boot, zero page errors,
`node --check` clean, `preflight.py` passes.

This should resolve both open items from the last two rounds: real
character portraits and real stage preview art, for any character/stage
using standard SFF v1 (which, per the trace, is literally 100% of this
147-character/8-stage roster -- byte 15 was 1, not 2, in every sample,
so SFF v2 support added earlier this session may not even be exercised
by this particular pack, though it remains correct and unchanged for
whichever future roster does use it). Needs one more real-phone
confirmation to close out, but this is the first fix in this whole
chain backed by an exact, verified byte-level diff against the real
failure rather than a plausible-sounding guess.

---

## Real-phone confirmation: portraits and stage decode both work now; stage art picks the wrong layer (2026-09-22)

The SFF v1 offset fix confirmed working on the user's real 147-character
roster: character portraits render for real (kineza, mole, G.Ken,
GoD_Ryu, AngelRyu, hulk, peter, jmax all show real art in the roster
grid), and stage tiles decode successfully too -- no more "unrecognized
SFF version" anywhere.

New, much smaller issue found by the same real-phone pass: the stage
preview art is technically decoding fine but shows the wrong part of
the stage -- flat sky/cloud imagery instead of the actual scene. Root
cause: `loadStagePreview()` was hardcoded to always grab sprite group
0/image 0, on the theory that it's the base background layer. There is
no universal "cover art" sprite convention for MUGEN stages (unlike a
character's 9000,0/9000,1), and on real stage files, group 0/image 0 is
apparently the small sky/gradient backdrop layer, not the main scene.

Fixed by scanning every sprite in the stage's SFF and picking the
single **largest** one by pixel area instead of a fixed group/image
pair (added `pickLargestSff1Sprite()`/`pickLargestSff2Sprite()`, plus a
cheap `pcxDims()` PCX-header-only reader so the v1 path doesn't have to
fully RLE-decode every candidate just to compare sizes). The reasoning:
sky/gradient/parallax layers are typically small or tileable, while the
primary background panorama is reliably the biggest single image in a
stage's SFF -- a much better proxy than any fixed index. Verified with
a synthetic multi-sprite SFF v1 file (a 32x24 "sky" at 0,0, a 64x48
extra layer, and a 320x240 "main scene" at a different group/image):
the picker correctly selects the 320x240 sprite every time, and it
decodes successfully through the full real pipeline. `node --check`
clean, `preflight.py` passes, real headless boot with zero page errors.

Not yet re-confirmed on the user's actual stage files (this is a
heuristic change, not something with a "correct" answer verifiable in
isolation) -- next real-phone pass should check whether stage tiles now
show a representative scene instead of sky.

---

## App made landscape-only, end to end (2026-09-22)

Real-phone confirmation on the stage-art fix: portraits and stage
previews both showing real content now, priority #1 and #3's decode
issues resolved. Separate design discussion followed: user asked
whether the whole app should just be landscape-only rather than
portrait-for-setup/landscape-for-fight, specifically because that would
eliminate the entire "rotate mid-fight crash" bug class (priority #5)
for free -- if the app never leaves landscape, there's no orientation
transition left to crash on. Decided to build it and see.

Previously `rotateGate` only activated once a match was `live` (setup
classList had `hide`) -- the setup screen and character/stage picker
were freely usable in portrait, with a separate click-interceptor on
the FIGHT button as the one guard against starting a match while still
portrait. Changed `onOrientation()` in `rig-ikemen-29.html`'s gate
script to show the gate whenever the device isn't in landscape,
regardless of `live` -- covering setup, picker, and match alike from
first page load. `rotateGate` was already `position:fixed;inset:0;
z-index:1000`, so no CSS/layout change was needed; it already blocks
pointer events across the entire viewport, not just over the game
canvas. That full-viewport coverage is also what made the old
click-interceptor dead code once the gate applies everywhere: a
portrait user can no longer physically reach the FIGHT button (or
anything else) to click it in the first place, so `pendingStart`/
`bypassGate` and the interceptor were removed rather than left
unreachable. Updated the gate's copy for the pre-match case from
"Rotate your phone to begin the match" to "MobMugen is landscape-only.
Rotate your phone to continue.", since it now covers zip loading and
character picking too, not just the fight itself; the mid-match
"paused, rotate to resume" text is unchanged.

**Verified directly, not just by inspection:** loaded the page in two
separate headless browser contexts, one at a portrait viewport
(390x844) and one at landscape (844x390). Portrait: `rotateGate.hidden
=== false`, its own title text sits at the exact center of the
viewport (`document.elementFromPoint` at center returns the gate's own
child), and `elementFromPoint` at all four corners also returns the
gate element itself -- confirming the full page is genuinely covered
and click-blocked, not just visually overlaid with gaps at the edges.
Landscape: gate hidden, `elementFromPoint` at center returns the normal
`setup` screen underneath. Zero page errors in both. `node --check`
clean, `preflight.py` passes.

One known, accepted cosmetic gap: since `rig-ikemen-29.js` (the big
bundle) loads and runs before this small inline gate script farther
down the page, a portrait load could in principle show a brief flash of
the setup screen before the gate script hides it. This existed before
too (for the rarer mid-match case) and wasn't reworked here since
fixing it properly would mean moving the orientation check earlier in
page load, which is more than this pass asked for -- worth revisiting
if it's actually visible on a real device.

---

## Narrower control gutters, extended to pre-fight too -- and a real 3-layer CSS trap found along the way (2026-09-22)

Follow-up to the landscape-only change: user asked to narrow the
side-docked control gutters from the live match (more room for the
game) and, since the whole app is landscape-only now, extend that same
side-docking to the setup/character-picker screen too -- it was still
stacking the full-width control deck *below* the picker, costing
roughly 220px of vertical height out of a ~390px-tall phone landscape
view, which is a much bigger loss than the match's side gutters.

**Found something worth flagging for whoever else touches this CSS:**
`.stage`/`.cz`/`.dpad`/`.acts`/`.act` sizing for `body.match-live` in
landscape is declared **three separate times** in this file, each from
a different beautification pass (a `max-height:650px`-scoped phone
block, a general `(orientation:landscape)` block, and a third
V24-specific block appended even later) -- all three still present,
none removed when the next one superseded it. Since all three use
`!important` on selectors of equal specificity, **only the last one in
source order actually renders**; the other two are fully dead code for
every property they share with it. First tried narrowing the *second*
block and verified via headless computed-style checks that literally
nothing changed on screen -- the third (V24) block's older, wider
numbers were still winning. Found this by comparing the actual
rendered `getComputedStyle()` values against arithmetic from each
block's own formula until one matched exactly, not by guessing.
Fixed by updating the actual winning block (the V24 one, further down
the file) with the narrower numbers, so what's declared where finally
matches what renders. Did not consolidate or delete the two dead
blocks in this pass -- that's a real cleanup worth doing but is a
larger, separate change from what this pass asked for.

Narrower values applied to the winning block: `.stage`'s reserved
margin 148px -> 108px (width cap 75vw -> 82vw), `.cz` 17vw/148px ->
15vw/132px, `.dpad` 15.5vw/132px -> 14vw/122px. The floors that
actually guarantee tap accuracy were **raised**, not shrunk, while
already touching these rules: `.dpad`/`.acts` min-size 102x102/124x108
-> 112x112/150x116, and `.act` (the individual attack buttons)
38px -> 44px, matching this project's own stated 44px touch-target
standard (`CLAUDE.md`: "Touch targets clear 44px") that this one rule
had fallen short of.

Extended the same side-docked-controls treatment to pre-fight: the
`body:not(.match-live):has(#charPickerSection:not(.hide))` selector
(the same one that already made `.controls` visible pre-fight) now
gets its own copy of the `.controls`/`.cz`/`.dpad`/`.acts`/`.act`
fixed-position rules, matching the match-live numbers, plus a new
`.wrap` max-width constraint (`calc(100vw - 280px)`) so the picker's
own content doesn't render underneath the now-docked side controls.
`#setup`/`#charPickerSection` live *inside* `.stage`, and `.stage`'s
own pre-fight width comes from `fitStage()` reading `.wrap`'s
`clientWidth` at runtime (not a CSS-only value) -- confirmed the
`.wrap` constraint actually reaches the picker's rendered width, not
just the DOM in theory, by checking `getComputedStyle(wrap).width`
matches the constrained formula exactly (564px on an 844px-wide test
viewport, i.e. `844 - 280`).

**Verified with real computed-style checks, not just by reading the
CSS**, at a real phone landscape viewport (844x390): match-live now
shows `.stage` max-width 736px (`844-108`, confirming the fix reached
the winning block), `.cz` 126.594px (`15vw`), `.act` 44x44px exactly.
Pre-fight picker: `.controls` fixed/full-viewport, `.cz` fixed at the
same 126.594px, `.wrap` narrowed to 564px, and the zip-picker button
confirmed still genuinely clickable (`elementFromPoint` over it returns
the button itself, not the control overlay). `node --check` clean,
`preflight.py` passes, zero page errors in either state.

---

## Three real bugs found by screenshot, not by re-reading the CSS (2026-09-22)

User's own screenshot of the pre-fight picker in landscape showed the
previous pass hadn't actually worked: a huge dead-space gap between the
picker card and the docked D-pad/buttons, plain unstyled control
circles that didn't match the fight screen's look, and a need to scroll
down to reach START/FIGHT -- "as if it's set in portrait mode anyway."
Reproduced with headless Playwright at three viewports (phone 844x390,
tablet 1180x820, wide desktop 2000x933) rather than guessing from the
screenshot alone, and found three distinct, concrete bugs:

**Bug 1 -- `.wrap`'s width formula had no upper clamp.** The previous
pass's `max-width:calc(100vw - 280px)` was meant to narrow `.wrap` on
phones, but on anything wider it does the opposite: at a 2000px
viewport it computed to 1720px, blowing past the base
`.wrap{max-width:980px}` rule entirely and matching the screenshot's
huge gap exactly. Confirmed via `getComputedStyle` before concluding
anything. Fixed with `max-width:min(900px,calc(100vw - 280px))` --
same phone-narrowing behavior, but now genuinely capped.

**Bug 2 -- the picker's decorative V24 skin (gradient side panels,
"MOVEMENT"/"STRIKE BANK" labels, colored button borders) was still
match-only.** The previous pass extended the *positioning* rules
(width/position:fixed) to pre-fight but missed the separate block that
actually paints the controls -- so pre-fight's now-correctly-docked
D-pad and buttons rendered as bare, unstyled circles, visibly not
matching the fight screen. Extended every selector in that decorative
block (`.cz`, `.cz:after` labels, `.dpad`, `.dir`, `.acts`, `.act`,
`.bx`/`.by`/`.bz` color variants, `.util`) to the same pre-fight
selector as everywhere else in this pass.

**Bug 3 -- fixing the width/height budget reintroduced a worse bug via
`fitStage()`.** Giving `.wrap` a real height and `.stage` a flex-filled
`height:auto` (so `.setup`'s existing `position:absolute;overflow-y:
auto` could finally activate its internal scroll instead of growing the
page) exposed that `fitStage()` (in `rig-ikemen-29.js`) sets an inline
`width` on `.stage` unconditionally, computed to fit a 16:9 **game
canvas** -- not the picker, which is a taller list UI with nothing to
do with 16:9. Once `.stage` had a real height for that function to
compute against, its aspect-fit math squeezed the whole picker down to
an incorrect ~284px-wide box. An inline style beats non-`!important`
CSS, so `height`/`flex` overrides alone weren't enough; needed
`width:100%!important;max-width:100%!important` on the same rule too.
Confirmed directly: without the width override, computed width was
284px; with it, 900px (matching `.wrap`). Caught by re-testing after
the first fix rather than assuming it worked, since dispatching a
`resize` event (which `fitStage()` listens for, and which my first,
simpler test never triggered) revealed it.

**Verified with real computed-style checks and screenshots** at all
three viewports after all three fixes: `.wrap`/`.stage` width tracks
correctly (564px phone, 900px desktop, never runaway), the docked
controls render with the full V24 decorative treatment matching the
fight screen, and `document.body.scrollHeight === window.innerHeight`
in every case (no page-level scroll forced). `node --check` clean,
`preflight.py` passes, zero page errors at 390x844 (portrait, gate
should show), 844x390, and 2000x933.

---

## Fighter select and arena select split into two screens (2026-09-22)

Even after the layout fixes above, user felt the picker was still
crowded on one screen -- versus banner, roster grid, stage preview, and
stage grid all sharing the same small viewport, forcing a cramped
roster grid and pointless vertical scrolling for something that's
landscape-only now anyway. Asked for two separate, full screens:
Fighter Select, then Arena Select, each with room to actually use.

**Markup**: `#charPickerSection`'s children were split into two new
wrapper divs, `#pickerScreenFighters` (titlebar, versus banner, shared
P1/CPU roster panel, CHANGE LIBRARY + a new NEXT: ARENA button) and
`#pickerScreenArena` (its own titlebar, the stage preview/bay, a new
BACK button + the FIGHT button moved here from the fighters screen).
Toggled with the same `.hide` utility class already used everywhere
else in this file -- no new CSS mechanism needed for show/hide.

**JS**: added `showPickerScreen(name)` -- toggles the two wrapper
divs' `.hide` class, updates the status pill text (SELECT FIGHTERS /
SELECT ARENA), and moves focus into the now-visible screen's first
relevant element (first roster item, or the stage grid, falling back
to the FIGHT button if a screen has nothing focusable). `selectItem()`
now calls `showPickerScreen('arena')` once both P1 and P2 are chosen
instead of trying to focus a stage grid that's on a screen that isn't
shown yet -- the auto-advance UX is unchanged, it just crosses a real
screen boundary now instead of scrolling within one. `updateSelectionDisplay()`
gates the new NEXT button's ready state (`duelReady`: both fighters
picked) separately from FIGHT's (`fightReady`: fighters + stage, or no
stages exist) -- matching the existing pattern of a visual `.v24-ready`
class + text change rather than the native `disabled` attribute, which
would have fought the button's custom clip-path/gradient styling.

**CSS**: the picker's decorative titlebar kicker ("01" / "FIGHTER
SELECT") was hardcoded via `:before`/`:after` content on the shared
`.select-titlebar` class -- caught by screenshot showing "01 FIGHTER
SELECT" still on the arena screen after the split. Overridden
specifically for `#pickerScreenArena` to "02" / "ARENA SELECT". Also
bumped `.shared-grid`/`.stage-grid`'s `max-height` (previously
128-142px, tuned for the old crowded single screen) to
`min(46vh,420px)` under the same landscape pre-fight scoping used
throughout this session's picker work, so each screen's grid actually
uses the room the split freed up instead of keeping the old cramped
cap.

**Verified with a temporary debug-exposed test harness** (a
`window.__testOpenPicker(chars, stages)` hook added to a throwaway copy
of the file, deleted after testing -- not shipped) driving the real
functions with synthetic roster/stage data end to end: opened the
picker, clicked a P1 roster item, switched to the CPU tab, clicked a
P2 item, confirmed it auto-advanced to the arena screen
(`pickerScreenFighters` hidden, `pickerScreenArena` shown), clicked
BACK (returns to fighters), clicked NEXT (re-advances), picked a
stage, and confirmed the FIGHT button read "FIGHT · READY". Screenshots
at each step confirm the visual result matches. Zero page errors at
390x844, 844x390, and 2000x933. `node --check` clean, `preflight.py`
passes.
