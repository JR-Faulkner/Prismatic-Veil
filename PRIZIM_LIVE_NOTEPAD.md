# PriZim Live Notepad

Last refreshed: 2026-09-01
Current live build: `main-20260901-live26`

This is the fast-moving operational notepad for current PriZim production state. It is intentionally concise and should be refreshed whenever a meaningful runtime decision, deployment, QA result, or new production direction lands.

## Current truths

- PZ-A is a production hub with Animation Lab, Sound Lab, and Live Battle access.
- PZ-A Sound Lab includes procedural prototype pads for whoosh, whisk, blink, step snap, charge, release, impact, recover, and UI micro-cues, plus current production MP3 references.
- Final SFX must be uniquely authored for The Prismatic Veil. Reference titles can inform feel only.
- LIVE26 establishes the reusable high-resolution FX integration pattern: harmonized atlas -> one runtime player/adapter -> stable source/target anchors -> mobile runtime QA.

### Auryi
- Battle-start crownless/Auorb-free lifecycle remains authoritative.
- Auryi canonical party scaling remains locked from live23.
- Persistent Auorb state remains retained from live24.
- LIVE25 crown centering/width correction remains inherited.
- LIVE26 removes cinematic camera travel from Auryi turn-entry/turn-start. Entry is locked to the normal battle camera.
- LIVE26 replaces provisional canvas-drawn Auryi attack magic with the harmonized production FX atlas.
- LIVE26 basic Auorb runtime choreography is: Charge -> Projectile -> body-centered Impact -> Recompose/Settle.
- One body-relative Auryi hand anchor remains the authority for charge origin, projectile origin, and recompose endpoint.
- The Wraith supplied body anchor remains the authority for projectile destination and impact center.
- Crown Manifest uses the production crown row during first-turn manifestation; persistent crown remains a combat-state layer afterward.

### Battle stage
- LIVE26 adds the first reusable Veil-corrupted battle backdrop/floor layer using runtime graphics only.
- Stage language: deep indigo/violet atmosphere, readable perspective floor, subdued arcane rings/cracks, muted grounding pads.
- Battlefield background must remain subordinate to characters, attack FX, and HUD readability.

### Wraith
- Subtle hover/drift is allowed.
- LIVE25 stabilizer remains active: stale alpha/visibility/transform reset, reduced idle vertical drift, guarded hit/attack transitions.
- Approved Wraith art/poses remain unchanged.

### Kineza
- Blitzer dynamic POV remains retained.
- LIVE25 caps Blitzer camera zoom at 1.28 and target blend at 0.45.
- Future locked state: gauntlets remain visibly glowing after ignition.
- Auryi's live26 production-FX integration becomes the reference architecture for Kineza FX hookup after Auryi mobile QA.

### Prismel
- Future locked state: battle starts staffless; active turn draws/materializes staff; staff persists during active-turn state.
- Auryi's live26 production-FX integration becomes the reference architecture for Prismel FX hookup after Auryi mobile QA.

## Immediate runtime QA lane

1. Verify Auryi turn entry has zero camera motion.
2. Verify Crown Manifest aligns with her visible head center without reading as attached headgear.
3. Verify Auorb Charge stays local to the shared hand anchor.
4. Verify Projectile launches from that exact anchor and travels cleanly to the Wraith body anchor.
5. Verify Impact centers on the Wraith body rather than the floor/baseline.
6. Verify Recompose returns cleanly to Auryi's hand/persistent Auorb state without duplicate FX layers.
7. Verify the new Veil floor/backdrop grounds the party and Wraith without competing with silhouettes/HUD.
8. Re-check LIVE25 Wraith stability and Kineza Blitzer safe-frame behavior for regression.
9. After Auryi passes, apply the same production-FX architecture to Kineza, then Prismel.

## Production efficiency rules

- One visual/audio authority per beat.
- Fix coordinate-space ownership before offset tuning.
- Use one anchor source of truth whenever practical.
- Prefer narrow adapters over broad rewrites.
- Preserve passed runtime work unless evidence shows regression.
- Runtime/mobile evidence outranks static assumptions.
- No baked enemies in attack/FX sheets.
- No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX must remain separate layers.
- Full anatomy/part-count QA before final extraction/harmonization approval.