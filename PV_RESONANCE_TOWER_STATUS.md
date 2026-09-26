# Resonance Tower — ring interaction v7

Updated 2026-09-26. Scope: `resonance-tower-complete.html`, Puzzle 1 input and layout. Approved PNG ring/core assets and chamber background are retained without reprocessing. Hybrid battle witness remains `main-20260909-live28k27`.

## Phone report and correction

The user's iPhone landscape evidence rejected the previous interaction: flat ring PNGs rotated in the screen plane by 24 degrees per state, crossed adjacent rings, and clipped behind the header/footer. Earlier 3-degree motion and pointerup-only swipes also failed the user's usability gate. Earlier assistant statements calling desktop screenshots iPhone validation were too strong; they are not device evidence.

Puzzle 1 now holds the physical ring art level. Six live glyphs orbit each band's ellipse and align at its fixed front notch. Drag distance controls continuous glyph travel; release snaps to the nearest glyph. The PNG ring geometry does not rotate in 3D. Touch surfaces remain stationary and do not overlap. Left/right buttons provide single-step input; a tap on a band also advances one step. Pointer cancellation settles back to the starting step, and synthetic pointer clicks do not double-advance. Unbounded turn positions make wraparound move the short distance in either direction.

Keyboard: up/down selects a band, left/right turns, Enter/Space advances. Standard-mapping gamepad: D-pad or left stick selects/turns; A advances, or stabilizes when all three match. Physical Xbox controller testing is pending.

The status area uses its own reserved row below all rings. At 3/3 the player must choose STABILIZE SIGNAL to advance to Puzzle 2; alignment no longer automatically changes screens. Existing `fresh=1` test behavior resets Tower sync and clear flags on load. Normal links resume saved Tower progress. Do not imply the fresh test is a non-destructive preview.

## Validation and next gate

- Canonical `tools/prizim/preflight_live28k.py`: PASS using bundled Python.
- Inline JavaScript syntax and Git whitespace checks: PASS.
- Local browser at 844x320: long swipe advanced the outer ring two positions; backward/forward buttons completed 3/3; explicit stabilization advanced to Calibration 2/3. Backward wrap 0 -> 5 and keyboard forward 5 -> 0 passed.
- Portrait 390x740: all three band targets, six 46px arrow buttons, status, and stabilization button fit; inspected screenshot and DOM bounds.
- These are desktop browser viewport checks, not Safari/iPhone touch validation. Real iPhone MAIN-route acceptance remains pending. Physical controller, interrupted multi-touch and Safari browser chrome transitions still require device evidence.
- Preserve this behavior during subsequent art improvements. Do not restore screen-plane image tilting to simulate ring rotation.

Publishing is from the latest remote main tree; remote Pages and the new live interaction must be checked before reporting deployment complete.

## User feedback after orbit7

The user subsequently reported "Works pretty well. I like it!" in the continuing iPhone test. The Puzzle 1 interaction direction is accepted. This feedback does not establish physical controller testing or a complete normal-MAIN traversal. The follow-up plan for puzzles 2/3, specific audio, progression and story is approved for planning. See `PV_TOWER_ROADMAP.md` and the separate `tower-design-review.html` mock and sound review. Those new visuals and sounds await approval before live integration.
