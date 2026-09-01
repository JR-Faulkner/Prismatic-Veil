# PriZim Live Notepad

Last refreshed: 2026-09-01
Current live build: `main-20260901-live26f`

This is the fast-moving operational notepad for current PriZim production state. It is intentionally concise and should be refreshed whenever a meaningful runtime decision, deployment, QA result, or new production direction lands.

## Current truths

- PZ-A is a production hub with Animation Lab, Sound Lab, and Live Battle access.
- PZ-A Sound Lab includes procedural prototype pads for whoosh, whisk, blink, step snap, charge, release, impact, recover, and UI micro-cues, plus current production MP3 references.
- Final SFX must be uniquely authored for The Prismatic Veil. Reference titles can inform feel only.
- LIVE26 establishes the reusable high-resolution FX integration pattern: harmonized sheet -> one runtime player/adapter -> stable source/target anchors -> mobile runtime QA.
- LIVE26C records a mobile-runtime lesson: the active battle scene/formation must not depend solely on the document-write import-map bridge. The root scene loads directly and hard-enforces the live26 formation if a browser falls back to the legacy class.
- LIVE26D records a second runtime lesson: production FX readiness must be a hard gate. A production attack may not silently fall back to provisional FX when its production sheets are unavailable.
- LIVE26E confirmed the inline WebP path is unsuitable for battle-critical iPhone/Safari combat art and retired it.
- LIVE26F is the first production Auryi attack build using five normal repo-served PNG sprite strips. The Dropbox pack was imported into GitHub, dimension-verified by the importer, and the runtime now loads each PNG directly.

## Platform constraints / do-not-repeat rules

- **NO WebP for battle-critical attack sheets.** Use normal repo-served PNG unless a different format is explicitly proven on the target iPhone runtime first.
- Do not use inline/base64 WebP for production combat FX.
- Do not require `img.decode()` as the readiness gate for battle-critical mobile image assets.
- A previously observed iPhone/Safari asset-format failure is a standing platform constraint, not a fresh experiment opportunity.
- Production combat art must fail visibly if unavailable. Never silently substitute deprecated/provisional FX.
- For binary production assets that cannot pass directly through the connector, a one-shot verified GitHub Actions importer from an approved user-supplied Dropbox package is an acceptable transfer pattern. Remove the importer after successful asset commit.

### Auryi
- Battle-start crownless/Auorb-free lifecycle remains authoritative.
- Auryi canonical party scaling remains locked from live23.
- Persistent Auorb state remains retained from live24.
- LIVE25 crown centering/width correction remains inherited.
- LIVE26 removes cinematic camera travel from Auryi turn-entry/turn-start. Entry is locked to the normal battle camera.
- Basic Auorb choreography is: Charge -> Projectile -> body-centered Impact -> Recompose/Settle.
- One body-relative Auryi hand anchor remains the authority for charge origin, projectile origin, and recompose endpoint.
- The Wraith supplied body anchor remains the authority for projectile destination and impact center.
- Crown Manifest uses the production crown sheet during first-turn manifestation; persistent crown remains a combat-state layer afterward.
- Approved v3 PNG runtime set is five normal sprite strips: crown 8x256, charge 8x256, projectile 8x256, impact 8x384, recompose 6x256.
- Live PNG runtime paths:
  - `assets/fx/auryi/v3/01_crown_manifest_sheet.png`
  - `assets/fx/auryi/v3/02_auorb_charge_sheet.png`
  - `assets/fx/auryi/v3/03_auorb_projectile_sheet.png`
  - `assets/fx/auryi/v3/04_auorb_impact_sheet.png`
  - `assets/fx/auryi/v3/05_recompose_settle_sheet.png`
- Runtime authority is `Live26DuoHybridSequenceDriver.js` with repo-served PNG loading and strict geometry checks.

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
- Kineza's prior iPhone/WebP attack issue is precedent for the global PNG battle-asset rule above.
- Auryi's PNG production-FX integration becomes the reference architecture for Kineza FX hookup after Auryi mobile QA.

### Prismel
- Future locked state: battle starts staffless; active turn draws/materializes staff; staff persists during active-turn state.
- Auryi's PNG production-FX integration becomes the reference architecture for Prismel FX hookup after Auryi mobile QA.

## Immediate runtime QA lane

1. Confirm live witness reads `main-20260901-live26f`.
2. Verify Auryi turn entry has zero camera motion.
3. Verify Crown Manifest aligns with her visible head center without reading as attached headgear.
4. Verify Auorb Charge stays local to the shared hand anchor.
5. Verify Projectile launches from that exact anchor and travels cleanly to the Wraith body anchor.
6. Verify Impact centers on the Wraith body rather than the floor/baseline.
7. Verify Recompose returns cleanly to Auryi's hand/persistent Auorb state without duplicate FX layers.
8. Re-check LIVE25 Wraith stability and Kineza Blitzer safe-frame behavior for regression.
9. After Auryi passes, apply the same PNG production-FX architecture to Kineza, then Prismel.

## Resonart / Hybrid-Duo direction

- Resonarts use the cinematic/video-rendered side of the Hybrid-Duo system, not the normal runtime attack-sheet lane.
- Runtime remains authority for combat logic: targets, damage, buffs/debuffs, state, timing markers, and battle return.
- Video owns cinematic presentation: authored shots, camera cuts, escalation, close-ups, and climax.
- Preferred PV pattern is battlefield continuity -> rendered Resonart cinematic -> final hit reconnects to live enemy/game state -> clean return to battle.
- Reference-game videos may inform shot language, pacing, transition structure, and escalation only. Do not copy their authored assets or exact sequences.

## Production efficiency rules

- One visual/audio authority per beat.
- Fix coordinate-space ownership before offset tuning.
- Use one anchor source of truth whenever practical.
- Prefer narrow adapters over broad rewrites.
- Preserve passed runtime work unless evidence shows regression.
- Runtime/mobile evidence outranks static assumptions.
- Promote costly failures into permanent platform constraints, do-not-repeat rules, or proven patterns.
- Do not rely on a browser-sensitive indirection layer when a direct runtime authority can be enforced safely.
- Production assets must be ready before playback; no silent fallback to deprecated/provisional visuals.
- No baked enemies in attack/FX sheets.
- No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX must remain separate layers.
- Full anatomy/part-count QA before final extraction/harmonization approval.
