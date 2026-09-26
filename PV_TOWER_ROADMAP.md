# PV Tower and story roadmap

Updated 2026-09-26. Applies only to Prismatic Veil. Review page: `tower-design-review.html`. Keep Core of More and MOBMUGEN separate.

## Accepted foundation

The user reported that Puzzle 1 orbit7 "Works pretty well. I like it!" after the iPhone interaction corrections. This accepts that interaction direction; it does not establish physical controller testing or full normal-MAIN route coverage. Preserve fixed ring geometry, live orbiting glyphs, pointer-move tracking, snap on release, minimum 44px controls, independent art/HUD layers, and explicit stabilization. See `PV_RESONANCE_TOWER_STATUS.md`.

## Current deliverable: proposals for review

- Puzzle 2 high-fidelity mock: `assets/ui/tower/review-v1/harmonic-calibration.png`.
- Puzzle 3 high-fidelity mock: `assets/ui/tower/review-v1/resonance-routing.png`.
- Seven original synthetic sound-effect concepts plus full audition WAV under `assets/audio/tower/audition-v1/`. Reproducible source: `tools/tower_sound_audition.py`. They have NOT been approved or wired into live game hooks.
- Image-generation prompts retained in `assets/ui/tower/review-v1/prompts.json`. Built-in image generation uses the existing Tower chamber as style reference. These images are visual targets, not production sprites or implemented screens.

## Order and acceptance gates

1. User reviews mocks and remotely playable sounds. Preserve approved art; generate the necessary separate production assets only after visual approval.
2. Puzzle 2: replace the range-input presentation with tactile tuning instruments, live waveforms, marked tolerance windows and stable-state feedback. Retain 62/38/76 targets and ±4 tolerance initially. Low/mid/high are signal bands, not elements. Require explicit Lock Calibration.
3. Puzzle 3: build a readable network around Grove → Prismel → Auryi → Kineza → Tower core. Show clues that justify each connection. Support tap source/tap destination, drag as optional shortcut, controller focus, Undo and explicit Confirm Route. Preserve completed links after mistakes. The current live puzzle resets its route on a mistake; change that deliberately in this pass.
4. Tower payoff: resolution scene → reward summary → Grimoire entry → visible next objective. Decide exact XP, item and route unlock requirements after auditing existing progression. Do not invent grants here.
5. Progression audit: inventory Home, Whispering Grove, Resonance Tower, Glassway Bridge, Echo Castle, Frigid Hills and Veil Rift. For every reachable path record current trigger, encounter/puzzle, payout, repeat-clear policy, save behavior and next story beat. Reconcile actual implementation before adding gates.
6. Story continuation: proposed incomplete Grove memory points toward Echo Castle; Frigid Hills supplies a separate lead. This is an approved planning direction, not a finalized canonical revelation. Draft the three Bearers' reactions, next objective and Grimoire text together before implementation.

## Input and presentation contract

- Phone landscape with browser chrome: reserve header, playable controls and footer; do not put controls under overlay panels. Test 844x320 and smaller supported layouts explicitly.
- Portrait: use stacked instruments/network layout, readable labels and safe-area spacing. Larger devices can use a wider instrument arrangement.
- Pointer movement must visibly respond while held; snapping and progress must agree. Cancel gestures must recover safely. No image-plane tilting as a substitute for physical rotation.
- Keyboard/controller target selection and tuning use the same state transitions as touch. Physical Xbox and iPhone tests remain separate evidence gates.
- Audio is optional reinforcement. Every cue has a visual counterpart. Honor the game's mute setting and duck/stop loops during exits and interruption. Native playback must be user-gesture unlocked on Safari.
- Throttle movement ticks; fire alignment sounds on transitions rather than every render; rate-limit error tones. Preserve separate music and SFX controls if present.
- Explicit completion avoids unexpected page changes. Keep normal saved progression; clearly label fresh test links that clear Tower progress.
- Hybrid battle/cinematic authority and approved battle assets are unchanged by this proposal phase.

## Sound hook proposal

| Cue | Hook | Constraint |
| --- | --- | --- |
| ring-turn | A deliberate snapped ring step | Rate limit during dragging |
| ring-align | A band newly becomes aligned | Once per transition |
| harmonic-search | Active adjustment outside tolerance | Quiet; stop on release/exit |
| harmonic-lock | A band settles inside tolerance | Pair with waveform/outline feedback |
| memory-link | A valid link completes | Sync with traveling pulse |
| route-release | Invalid attempt or Undo | Gentle, non-punitive; rate limit |
| tower-resolve | Confirmed Tower completion | Once per completion, no overlay conflict |

## Completion evidence

Mocks require visual approval. Audition playback requires user listening approval. Browser viewport tests are not physical iPhone or Xbox tests. Pages success plus live asset and control inspection is deployment evidence; normal MAIN-route device feedback is the final runtime gate.
