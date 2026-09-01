# PriZim Production Direction — 2026-09-01

PriZim is the production/QA layer for The Prismatic Veil. This document is the current direction authority for runtime presentation work unless a newer dated direction supersedes it.

## Core operating rules

- One visual authority per beat. Character/body animation, authored FX, camera, audio, damage timing, and UI each keep a clear owner.
- Prefer adapters and surgical overrides over broad rewrites when a stable live path already exists.
- Preserve approved work. Do not reopen scale, camera, art, or lifecycle decisions that already passed runtime QA unless new evidence shows a regression.
- Production changes should be reversible, cache-busted, and easy to isolate by live build ID.
- Runtime/mobile evidence outranks static assumptions.
- Do not bake enemies into attack/FX assets.
- Keep safe margins on authored animation/FX frames and verify anatomy/part-count integrity before extraction/harmonization approval.

## Current live presentation direction

### Auryi
- Fresh battle starts crownless and Auorb-free.
- First Auryi turn manifests crown/Auorb.
- Crown then persists as a hovering combat-state feature, never tiara/headgear.
- Auorb persists as quiet hand-local magic after activation.
- Auryi canonical party scale is locked after live23 correction. Do not reintroduce the legacy 1.12 multiplier.
- Persistent crown/Auorb state, Wraith body targeting, and pair-centered camera are considered current approved baselines.
- Cinematic FX must begin/end at the same apparent size and anchor as persistent FX.
- Current remaining visual polish: crown centering/width may receive surgical adjustment based on runtime evidence.

### Enemy/Wraith
- Spectral idle drift is allowed.
- Enemy may not drift out of readable encounter framing or disappear because of camera/state transitions.
- Targeting uses body center rather than bottom-origin container coordinates.
- Hit/attack recovery must restore the stable base anchor before idle drift resumes.

### Kineza
- Blitzer keeps dynamic POV/foreshortening.
- Camera movement must remain clamped so Kineza and contact action stay inside safe screen bounds.
- Do not let targetMix or scroll push the hero partially off-screen.
- Kineza ignition should leave persistent gauntlet/fist glow after turn-entry ignition.

### Prismel
- Battle starts staffless.
- On his active turn, Prismel reaches behind back and draws/materializes the staff.
- Staff persists for the active-turn state.

## SFX direction

The current production MP3s are functional references, not the final quality bar.

PriZim now treats combat sound as a layered motion/energy language:

1. whoosh — fast body/camera movement
2. whisk — short limb/robe sweep
3. blink — spatial displacement / zip-pop
4. step snap — micro movement accent
5. charge — rising danger / energy build
6. release — directional commitment transient
7. impact — physical body + magical identity + short tail
8. recover — recompose / energy settle
9. UI micro-cues — target lock, turn active, ability confirm, hit confirm

### Character sonic identities

- Kineza: lower, denser, kinetic, gritty crack, physical chest/body component.
- Auryi: glassy, harmonic, airy, elegant displacement, gold/lavender energy character.
- Prismel: crystalline, spectral, prismatic flick/sweep, lighter shard-like transient.

Final assets must be unique to The Prismatic Veil. External games may be used only as feel/reference language, never as source audio to copy.

## PZ-A

PZ-A is now the production hub rather than only the Animation Lab.

Current tools:
- Animation Lab
- Sound Lab
- Live Battle route

The Sound Lab supports immediate iPhone testing of procedural prototype SFX and side-by-side listening against current production MP3 references. Procedural prototypes are temporary audition tools, not mastered shipping assets.

## Efficiency principles

- Fix coordinate-space ownership before tuning offsets.
- Reuse one anchor source of truth across idle, launch, impact, and recovery whenever possible.
- Prefer one shared event marker system over duplicate timers.
- Avoid duplicate persistent/cinematic FX ownership.
- Do not globally replace stable systems when a narrow adapter can prove the correction.
- Keep live runtime tests focused: change one lane, verify one lane, then advance.

## Current gate

1. Finish Auryi crown centering/width surgical polish if still needed.
2. Stabilize Wraith visibility/position through all attack camera states.
3. Clamp Kineza Blitzer camera so hero/contact action stays in safe bounds.
4. Use PZ-A Sound Lab to select/refine the new PV SFX vocabulary.
5. Produce authored effects sheets after runtime lanes are clean.
6. Then proceed to Prismel/Kineza turn-state upgrades.
