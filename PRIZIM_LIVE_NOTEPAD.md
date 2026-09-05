# PriZim Live Notepad

Last refreshed: 2026-09-05
Current promoted build: `main-20260905-live28k6` — **MAIN lane promoted, pending real-iPhone crown QA**.

This is the fast operational failure-prevention ledger for PriZim production.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device screenshots/video/evidence outrank code inspection, CI success, and desktop assumptions.
- Current witness: `main-20260905-live28k6`.
- Any numeric `LIVE28K` witness stays on the high-quality `Live28K2PartyBattleScene.js` + `Live28K2PartyFormationView.js` lineage through future-proof routing. Router commit: `781e68f94118ff4ba4272b43899dc1b6dc0a26b1`.

## Battle authorities

- Prismel passive/off-turn: `assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png`, native **1106×1422 PNG**.
- Prismel active/on-turn: `assets/party_formation/PRISMEL_LIVE28K2_STAFF_READY.png`, native **1402×1122 PNG**.
- Auryi: `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native **1086×1448 PNG**.
- Kineza: `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Battle-critical art stays **direct PNG only**. No WebP wrappers.
- Native source dimensions remain preserved. Runtime display scaling is allowed; source-file downscaling is not.

## PZ / alpha status

- Prismel and Auryi full-resolution battle primaries were PZ-cleaned to transparent alpha at native dimensions in commit `4f56a74893edc6fadbb4d9a98e858a37d58264f8`.
- The original supplied Auryi source was opaque, but the MAIN primary path now contains the PZ-clean transparent 1086×1448 version. Do not replace it with the opaque source.
- HC-approved Prismel staff-ready ingest commit: `aa7b56d8771013e8fb572c676d978bc67ae7f98a`.
- Prismel staff-ready QA: **1402×1122 PNG**, alpha 0–255, 883,935 fully transparent pixels, 687,927 partial-alpha pixels.
- K5 iPhone witness still showed a small **white fringe/white-space remnant on Prismel's passive idle**. Treat this as a narrow PZ cleanup defect only. Do not regenerate or change the approved pose/identity.
- Do not reintroduce white mats, haloed cutouts, WebP, or source downscaling.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

## Prismel state semantics

- **Off-turn / passive:** right-facing staffless idle using the current full-resolution Prismel identity.
- **On-turn / active:** HC-approved staff-ready Prismel using the same identity, age, face, costume, proportions, short tight hair, and animated-master rendering.
- Old LIVE28J `assets/poses/prismel_active_turn/prismel_ready_6.png` is retired as active authority.
- Locked behavior:
  - off-turn -> right-facing staffless idle
  - Prismel turn begins -> HC staff-ready active
  - Prismel action/attack -> return to HC staff-ready while Prismel remains active
  - Prismel turn ends -> right-facing staffless idle
- State split wiring commit: `e27b031b063b9112dd2f965e44b63594f72ae2c1`.
- Active preload wiring commit: `69edc476e2f146a1474f9d6ecd9fc3caf1b4c127`.
- K3/K5 real-device witnesses passed the Prismel active-authority behavior.

## K5 real-device witness

The real iPhone witness from `main-20260905-live28k5` showed the core battle stack is now largely stable.

**Passed / good:**
- All three hero attacks read well on-device.
- Correct HC staff-ready Prismel remains authoritative on his turn.
- Auryi direct-primary presentation is substantially improved and no longer needs an immediate HC body-art pass.
- Kineza remains intact and on the correct HC identity.
- Portrait framing is improved enough to continue production.

**Remaining defects:**
- Small white-space/fringe remnant on Prismel passive idle.
- Auryi crown manifestation is visually wrong and off-center because the production entry path still used procedural Phaser/canvas crown drawing rather than the approved animated crown art.

## HUD portraits

- Paths remain stable:
  - `assets/ui/portrait_prismel.png`
  - `assets/ui/portrait_auryi.png`
  - `assets/ui/portrait_kineza.png`
- They are transparent animated-master derivatives, not legacy photos.
- Portrait focal commit: `20c91a2b3af85ac56bb3e1661f88aa1ea6620d00`.
- Prismel gets strongest focal zoom, Auryi moderate, Kineza light.
- Portrait framing is UI-only and never authorizes reducing battle-master source files.

## Turn rings / formation

- Original body-footprint ring correction: `5a09151d46b12316b92e11b2552db1c547337619`.
- Ring hardening commit: `b8233caf4aa90514fe85a42c1a3537c5d1c93c01`.
- Selected hero ring is explicitly resynchronized after turn swaps/layout/state restoration.
- Rings remain anchored to measured feet/body footprint after final scale/origin fitting.
- Height order remains **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Body calibration: Auryi 1.000 / Prismel ≈0.775 / Kineza ≈0.647.

## Auryi K5 direct-primary correction

- Current authority remains `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native **1086×1448 transparent PNG**.
- K5 retired the old runtime crown/orb pixel-strip pass and now uses the already PZ-clean MAIN primary directly.
- Direct-primary correction commit: `bd83ebd4e9745784a3aa75b3e344b23d83c6002a`.
- Duplicate persistent crown/Auorb objects remain suppressed.
- Auryi remains tallest and returns to the direct PZ-clean primary after attacks.

## Auryi K6 crown authority

- **Do not convert the proven Auryi basic attack or Auorb attack to PNG by default.** They remain on the proven Phaser/canvas path.
- The production defect was specifically the **crown manifestation**.
- Approved animated crown source already exists in MAIN: `assets/fx/auryi/v3/01_crown_manifest_sheet.png`, 8 frames at 256×256 per frame.
- K6 uses a **hybrid entry path**:
  - crown = approved animated PNG crown sheet
  - entry Auorb = proven Phaser/canvas choreography
  - normal/basic attack + Auorb attack = proven Phaser/canvas path, unchanged
  - full-PNG attack stack remains opt-in QA only via `?auryiFx=png`
- K6 removes the old LIVE25 `+9% body-width` crown shift and centers the crown over Auryi's actor/head line.
- Crown hybrid commit: `338dbd8a441bac25d4d349a215cb38b42993f974`.
- K6 promotion commit: `9dc1e1792b4a44aa28a207071bfb7fe22b48bd6b`.
- K6 binds the fresh hybrid crown driver directly at the K formation boundary so Safari cannot reuse the old nested `live26g` driver URL. K-adapter driver binding commit: `2cf6ddd54872c70df835c2e2e4b6959b49c4cd6b`.
- K6 battle scene cache-busts the K formation import with `?v=live28k6-crown`. Cache-guard commit: `ecb83dae62b19919e0d1759383e0e9facf7264ec`.

## Auryi Resonart / Aurora Pulse next lane

- **Aurora Pulse Resonart resumes immediately after the K6 crown manifestation passes real-iPhone QA.**
- Use the previously supplied/approved Auryi Resonart video as the motion/timing authority for the next production pass.
- Do not reopen stable basic attack/Auorb behavior while building Resonart.
- Preserve current Auryi identity, direct-primary body authority, crown asset language, pair-centered camera behavior, and return-to-idle semantics.

## Kineza

- Locked standby authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Kineza remains shortest at the locked body ratio.
- Generic Kineza state sheets must not overwrite the HC idle.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** production fixes/tests/approval target the actual MAIN route reached by the user's iPhone.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE.**
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.**
- **IDENTITY BEFORE RESOLUTION:** never substitute a different-looking hero merely to improve clarity.
- **NO WebP** for battle-critical attack/state/idle art on the iPhone production path.
- **KEEP NATIVE SOURCE RESOLUTION** for approved battle masters.
- **DO NOT RE-PROCESS AN ALREADY PZ-CLEAN MASTER AT RUNTIME.**
- **HUD PORTRAITS FOLLOW CURRENT ANIMATED MASTERS.**
- **TURN RINGS FOLLOW BODY FOOTPRINTS** after final origin/scale fitting.
- **ACTIVE RING VISIBILITY FOLLOWS TURN STATE** explicitly.
- **BUILD WITNESS MUST MAP TO ADAPTER LINEAGE.** Numeric LIVE28K promotions stay on the K production adapter lineage automatically.
- **NESTED SAFARI MODULES NEED EXPLICIT K-LINE CACHE BUSTS WHEN CHANGED.** A new top-level witness alone does not prove a deep fixed-query module URL was refreshed.
- **PRISMEL STATE SPLIT IS LOCKED:** off-turn right-facing staffless idle; on-turn HC staff-ready.
- **AURYI CROWN IS ASSET-DRIVEN:** do not revert to a procedural ellipse/crown drawing as production authority when approved animated crown art exists.
- **AURYI ATTACK FX STAY PHASER BY DEFAULT:** crown correction must not silently replace proven basic/Auorb attack choreography with the full PNG QA path.
- Scale bodies, not transparent canvases, FX, staff reach, hair reach, robe/cape tails, or stance width.
- Never scale heads independently. Whole-character uniform scale only.
- CI/deployment success is not runtime QA. Do not approve until the exact iPhone MAIN route passes.
- No baked enemies in attack/FX sheets. No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA remains mandatory.

## Immediate MAIN LIVE28K6 QA lane

1. Confirm witness reads `main-20260905-live28k6` on the normal iPhone MAIN path.
2. Trigger Auryi's turn entry and confirm the crown uses the approved animated crown art, not procedural Phaser ellipses.
3. Confirm the crown is centered over Auryi's head/body line with a clean air gap and no face overlap.
4. Confirm Auryi's entry Auorb still uses the proven Phaser/canvas presentation.
5. Trigger Auryi basic/Auorb attack and confirm attack visuals remain unchanged from the K5 pass.
6. Confirm Auryi returns to the direct PZ-clean primary at exact home position after attack.
7. Confirm Prismel passive still uses the right-facing idle; note any remaining white fringe for the next narrow PZ cleanup.
8. Confirm Prismel active staff-ready state still switches correctly.
9. Confirm Kineza remains on locked HC idle and active ring behavior remains correct.
10. Once crown QA passes, resume **Aurora Pulse Resonart video production**.

## Proven patterns

- Direct repo-served PNG is the safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Identity authority outranks resolution convenience.
- Approved alpha-clean masters should be consumed directly instead of repeatedly color-keyed or pixel-stripped at runtime.
- Hybrid FX can be the right production choice: asset-driven crown + proven Phaser Auorb/attack preserves visual authority without destabilizing passed choreography.
- HUD focal framing can be corrected independently from portrait identity.
- Active-turn markers must be resynchronized to turn state after layout/state restores.
- Future cache-busted LIVE28K witnesses remain on the intended adapter lineage through a generic numeric matcher.
- Prefer narrow adapters over broad rewrites and preserve passed runtime work.
