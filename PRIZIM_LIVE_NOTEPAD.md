# PriZim Live Notepad

Last refreshed: 2026-09-01
Current live build: `main-20260901-live24`

This is the fast-moving operational notepad for current PriZim production state. It is intentionally concise and should be refreshed whenever a meaningful runtime decision, deployment, QA result, or new production direction lands.

## Current truths

- PZ-A is now a production hub with Animation Lab, Sound Lab, and Live Battle access.
- PZ-A Sound Lab includes procedural prototype pads for whoosh, whisk, blink, step snap, charge, release, impact, recover, and UI micro-cues, plus current production MP3 references.
- Final SFX must be uniquely authored for The Prismatic Veil. Reference titles can inform feel only.

### Auryi
- Battle-start crownless/Auorb-free lifecycle is working.
- Auryi canonical party scaling is locked after live23 correction.
- Persistent crown/Auorb state is substantially improved.
- Wraith body targeting and pair-centered Auryi attack camera are substantially improved.
- Remaining user-noted polish: crown is slightly off-center and should be widened somewhat.

### Wraith
- Subtle hover/drift is allowed.
- User reports occasional excessive float or full disappearance. Runtime visibility/position stabilization remains open.

### Kineza
- Blitzer dynamic POV is retained.
- User reports camera sometimes veers too far and can push Kineza/action partially off-screen. Safe-frame camera clamp remains open.
- Future locked state: gauntlets remain visibly glowing after ignition.

### Prismel
- Future locked state: battle starts staffless; active turn draws/materializes staff; staff persists during active-turn state.

## Immediate next implementation lane

1. Surgical Auryi crown center + modest width correction.
2. Wraith visibility/base-anchor guard through camera/attack transitions.
3. Kineza Blitzer camera safe-frame clamp.
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
