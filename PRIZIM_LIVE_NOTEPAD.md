# PriZim Live Notepad

Last refreshed: 2026-09-01
Current live build: `main-20260901-live26g`

This is the fast-moving operational notepad for current PriZim production state. It is intentionally concise and should be refreshed whenever a meaningful runtime decision, deployment, QA result, or new production direction lands.

## Current truths

- PZ-A is a production hub with Animation Lab, Sound Lab, Resonart Lab, and Live Battle access.
- PZ-A Sound Lab includes procedural prototype pads for whoosh, whisk, blink, step snap, charge, release, impact, recover, and UI micro-cues, plus current production MP3 references.
- PZ-A Resonart Lab includes the playable Auryi `Aurora Pulse` timing/composition prototype at `pz-a-aurora-pulse-lab.html`.
- Final SFX must be uniquely authored for The Prismatic Veil. Reference titles can inform feel only.
- LIVE26 establishes the reusable high-resolution FX integration pattern: harmonized sheet -> one runtime player/adapter -> stable source/target anchors -> mobile runtime QA.
- LIVE26C records a mobile-runtime lesson: the active battle scene/formation must not depend solely on the document-write import-map bridge. The root scene loads directly and hard-enforces the live26 formation if a browser falls back to the legacy class.
- LIVE26D records a second runtime lesson: production FX readiness must be a hard gate. A production attack may not silently fall back to provisional FX when its production sheets are unavailable.
- LIVE26E confirmed the inline WebP path is unsuitable for battle-critical iPhone/Safari combat art and retired it.
- LIVE26F is the first production Auryi attack build using five normal repo-served PNG sprite strips.
- LIVE26G adds an explicit Auryi FX runtime selector. `auryiFx=png` uses the production PNG sheets; `auryiFx=phaser` uses the inherited proven Phaser/procedural Auryi presentation and skips PNG readiness/loading for Auryi.
- PZ-A exposes both `LIVE BATTLE · PNG FX` and `LIVE BATTLE · PHASER SAFE` so family/demo use does not depend on the still-under-QA PNG persistence behavior.

## Platform constraints / do-not-repeat rules

- **NO WebP for battle-critical attack sheets.** Use normal repo-served PNG unless a different format is explicitly proven on the target iPhone runtime first.
- Do not use inline/base64 WebP for production combat FX.
- Do not require `img.decode()` as the readiness gate for battle-critical mobile image assets.
- A previously observed iPhone/Safari asset-format failure is a standing platform constraint, not a fresh experiment opportunity.
- Production combat art must fail visibly if unavailable. Never silently substitute deprecated/provisional FX in the production lane.
- A user-selectable safe/demo mode is allowed when explicitly labeled and intentionally routed. It must not masquerade as a successful production-FX pass.
- For binary production assets that cannot pass directly through the connector, a one-shot verified GitHub Actions importer from an approved user-supplied Dropbox package is an acceptable transfer pattern. Remove the importer after successful asset commit.

### Auryi
- Battle-start crownless/Auorb-free lifecycle remains authoritative.
- Auryi canonical party scaling remains locked from live23.
- Persistent Auorb state remains retained from live24.
- LIVE25 crown centering/width correction remains inherited.
- LIVE26 removes cinematic camera travel from Auryi turn-entry/turn-start. Entry is locked to the normal battle camera.
- Auryi's player-facing basic attack name is **Aurorb Slice**.
- Auryi's Resonart name is **Aurora Pulse**.
- `Aurora Pulse` and `Aurorb Slice` are separate metadata and presentation authorities. Do not reuse the basic attack object as Resonart data.
- Basic Aurorb Slice choreography remains: Charge -> Projectile -> body-centered Impact -> Recompose/Settle.
- One body-relative Auryi hand anchor remains the authority for charge origin, projectile origin, and recompose endpoint.
- The Wraith supplied body anchor remains the authority for projectile destination and impact center.
- Approved v3 PNG runtime set is five normal sprite strips: crown 8x256, charge 8x256, projectile 8x256, impact 8x384, recompose 6x256.
- Live PNG runtime paths:
  - `assets/fx/auryi/v3/01_crown_manifest_sheet.png`
  - `assets/fx/auryi/v3/02_auorb_charge_sheet.png`
  - `assets/fx/auryi/v3/03_auorb_projectile_sheet.png`
  - `assets/fx/auryi/v3/04_auorb_impact_sheet.png`
  - `assets/fx/auryi/v3/05_recompose_settle_sheet.png`
- Runtime authority is `Live26DuoHybridSequenceDriver.js`.
- Production mode: `auryiFx=png`. Normal repo-served PNGs remain the intended production presentation.
- Safe/demo mode: `auryiFx=phaser`. Auryi entry/basic attack intentionally route through the inherited procedural/Phaser implementation, while persistent crown/Auorb remain formation-owned Phaser graphics.
- **Open QA issue:** user real-device testing reports that the new PNG crown/attack presentation does not remain/read on screen reliably enough, while the older Phaser-drawn presentation does. LIVE26G provides the safe fallback but does NOT mark PNG persistence as solved.
- The newly supplied approved JRPG Auryi master is the visual identity/costume authority for battlefield and Resonart work. Do not substitute older alternate interpretations.
- Aurora Pulse key-pose production uses the approved JRPG master plus each previously approved key pose as continuity authority. Pose changes only; zero redesign.
- Aurora Pulse semantic ladder: Aura = Auryi's magic system; Auorb = condensed orb manifestation; Aurora = Resonart-scale expanded aura phenomenon.
- Aurora Pulse cinematic grammar: battlefield continuity -> Auryi rises -> Aurora expands well beyond body scale -> Auryi smashes/crushes the Aurora inward with both hands -> brief compression/silence beat -> enormous circular Aurora Pulse -> reconnect to live battlefield impact/state.
- Aurora Pulse presentation target is `hybrid-video`, not the runtime attack-sheet lane.

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
- Auryi's PNG production-FX integration becomes the reference architecture for Kineza FX hookup only after Auryi mobile QA passes.

### Prismel
- Future locked state: battle starts staffless; active turn draws/materializes staff; staff persists during active-turn state.
- Auryi's PNG production-FX integration becomes the reference architecture for Prismel FX hookup only after Auryi mobile QA passes.

## Immediate runtime QA lane

1. Confirm live witness reads `main-20260901-live26g`.
2. For family/demo use, enter through PZ-A `LIVE BATTLE · PHASER SAFE` and verify Auryi crown/Auorb and basic attack remain clearly readable.
3. Separately test PZ-A `LIVE BATTLE · PNG FX` and capture exact persistence/readability behavior without changing the safe mode.
4. Verify Auryi turn entry has zero camera motion in both modes.
5. In PNG mode, verify Crown Manifest alignment, Aurorb Slice Charge, Projectile, body-centered Impact, and Recompose.
6. Verify persistent crown/Auorb return after Auryi attack.
7. Re-check LIVE25 Wraith stability and Kineza Blitzer safe-frame behavior for regression.
8. Keep Aurora Pulse prototype iteration isolated in PZ-A until its timing/composition is approved.
9. After Auryi basic-attack production QA passes, apply the proven production-FX architecture to Kineza, then Prismel.

## Resonart / Hybrid-Duo direction

- Resonarts use the cinematic/video-rendered side of the Hybrid-Duo system, not the normal runtime attack-sheet lane.
- Runtime remains authority for combat logic: targets, damage, buffs/debuffs, state, timing markers, and battle return.
- Video owns cinematic presentation: authored shots, camera cuts, escalation, close-ups, and climax.
- Preferred PV pattern is battlefield continuity -> rendered Resonart cinematic -> final hit reconnects to live enemy/game state -> clean return to battle.
- Reference-game videos may inform shot language, pacing, transition structure, and escalation only. Do not copy their authored assets or exact sequences.
- PZ-A `RESONART LAB · AURORA PULSE` is the current playable composition/timing proof. It is an animatic, not final footage.
- Once prototype timing is approved, formalize a reusable Hybrid-Duo Resonart video player/adapter and route Auryi's Resonart through `hero.resonart`, not `hero.attack`.
- Final Aurora Pulse production uses approved JRPG Auryi as identity/costume authority, animation-friendly character layers, independent hair/robe/body motion, authored camera movement, final Aurora FX, audio markers, and a rendered cinematic asset.

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
