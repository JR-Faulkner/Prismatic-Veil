# PriZim Live Notepad

Last refreshed: 2026-09-01
Current live build: `main-20260901-live25`

This is the fast-moving operational notepad for current PriZim production state. It is intentionally concise and should be refreshed whenever a meaningful runtime decision, deployment, QA result, or new production direction lands.

## Current truths

- PZ-A is a production hub with Animation Lab, Sound Lab, and Live Battle access.
- PZ-A Sound Lab includes procedural prototype pads for whoosh, whisk, blink, step snap, charge, release, impact, recover, and UI micro-cues, plus current production MP3 references.
- Final SFX must be uniquely authored for The Prismatic Veil. Reference titles can inform feel only.

### Auryi
- Battle-start crownless/Auorb-free lifecycle is working.
- Auryi canonical party scaling is locked after live23 correction.
- Persistent Auorb state is retained from live24.
- LIVE25 shifts Auryi crown center toward the visible head center and widens the crown modestly without changing vertical air gap.
- LIVE25 applies the same crown correction to cinematic Auryi FX.

### Wraith
- Subtle hover/drift is allowed.
- LIVE25 routes the Wraith through a stabilizer adapter that resets stale alpha/visibility/transform state during pose transitions, reduces idle vertical drift, and guards against partial disappearance after hit/attack transitions.
- Approved Wraith art/poses remain unchanged.

### Kineza
- Blitzer dynamic POV is retained.
- LIVE25 caps Blitzer camera zoom at 1.28 and target blend at 0.45 to reduce off-screen veer while preserving the forward/contact camera language.
- Future locked state: gauntlets remain visibly glowing after ignition.

### Prismel
- Future locked state: battle starts staffless; active turn draws/materializes staff; staff persists during active-turn state.

## Immediate runtime QA lane

1. Verify Auryi crown is visually centered and modestly wider.
2. Verify Wraith remains visible and near its stable base through idle, hit, attack, and Auryi/Kineza cinematics.
3. Verify Kineza Blitzer remains dynamic but never pushes the action off-screen.
4. Sound Lab audition and selection of stronger PV motion/combat SFX recipes.
5. Authored FX sheets after runtime lanes are clean.
6. Prismel/Kineza turn-state upgrades after effects sheets.

## Production efficiency rules

- One visual/audio authority per beat.
- Fix coordinate-space ownership before offset tuning.
- Use one anchor source of truth whenever practical.
- Prefer narrow adapters over broad rewrites.
- Preserve passed runtime work unless evidence shows regression.
- Runtime/mobile evidence outranks static assumptions.
- No baked enemies in attack/FX sheets.
- Full anatomy/part-count QA before final extraction/harmonization approval.
