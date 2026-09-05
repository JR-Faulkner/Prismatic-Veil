# PriZim Live Notepad

Last refreshed: 2026-09-05
Current promoted build: `main-20260905-live28k5` — **MAIN lane promoted, pending corrected real-iPhone approval**.

This is the fast operational failure-prevention ledger for PriZim production.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device screenshots/video/evidence outrank code inspection, CI success, and desktop assumptions.
- Current witness: `main-20260905-live28k5`.
- Any numeric `LIVE28K` witness now stays on the high-quality `Live28K2PartyBattleScene.js` + `Live28K2PartyFormationView.js` lineage through future-proof routing. Router commit: `781e68f94118ff4ba4272b43899dc1b6dc0a26b1`.

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
- K3 real-device witness passed the Prismel active-authority check.

## K3 real-device witness

The real iPhone screenshot/video from `main-20260905-live28k3` proved:

**Passed**
- Correct K3 witness loaded.
- Prismel/Auryi no longer showed opaque white mats.
- Correct HC staff-ready Prismel appeared on Prismel's turn.
- Old mismatched LIVE28J Prismel did not return.
- Auryi and Kineza remained intact.
- Height order still read Auryi tallest -> Prismel middle -> Kineza shortest.

**Failed / follow-up**
- HUD portraits were framed too loosely at phone size.
- Kineza's cyan active ring disappeared during his turn even though Auryi/Prismel rings appeared.
- Auryi's battlefield presentation looked noticeably worse than her supplied master and required stack inspection before considering another HC art pass.

## HUD portraits

- Paths remain stable:
  - `assets/ui/portrait_prismel.png`
  - `assets/ui/portrait_auryi.png`
  - `assets/ui/portrait_kineza.png`
- They are transparent animated-master derivatives, not legacy photos.
- K4/K5 corrects their **HUD focal framing in code** rather than changing identity art.
- Portrait focal commit: `20c91a2b3af85ac56bb3e1661f88aa1ea6620d00`.
- Prismel gets strongest focal zoom, Auryi moderate, Kineza light.
- Portrait framing is UI-only and never authorizes reducing battle-master source files.

## Turn rings / formation

- Original body-footprint ring correction: `5a09151d46b12316b92e11b2552db1c547337619`.
- K3 video showed Kineza's active ring could lose visibility.
- Ring hardening commit: `b8233caf4aa90514fe85a42c1a3537c5d1c93c01`.
- Selected hero ring is explicitly resynchronized after turn swaps/layout/state restoration.
- Rings remain anchored to measured feet/body footprint after final scale/origin fitting.
- Height order remains **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Body calibration: Auryi 1.000 / Prismel ≈0.775 / Kineza ≈0.647.
- Approximate viewport body targets: Auryi 47%, Prismel 36.4%, Kineza 30.4%.

## Auryi K5 correction

- Current authority remains `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native **1086×1448 transparent PNG**.
- The art itself is not being regenerated for K5.
- Root runtime problem found: K2/K3/K4 still copied the already PZ-cleaned Auryi primary into a canvas and ran the old crown/orb color-removal processor across it. That processing was unnecessary for the current crownless master and could damage/soften valid face, hair, gold trim, violet robe, and edge pixels.
- **K5 retires that runtime pixel-strip step.** Auryi now uses the PZ-clean MAIN primary directly at native resolution.
- Direct-primary correction commit: `bd83ebd4e9745784a3aa75b3e344b23d83c6002a`.
- Duplicate Phaser crown/Auorb suppression remains active. Only the destructive image processor is removed.
- K5 explicitly re-fits the direct primary by readable body height after the inherited layout, preserving Auryi as tallest.
- Normal MAIN idle remains crownless.
- Post-attack cleanup must return Auryi to this exact direct primary at home Y.
- Another HC art pass is **not justified unless the direct-primary K5 iPhone witness still fails visually**.
- Basic attack: **Aurorb Slice**. Resonart: **Aurora Pulse**. Aurora Pulse remains paused until core Hybrid presentation passes.

## Kineza

- Locked standby authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Kineza remains shortest at the locked body ratio.
- Generic Kineza state sheets must not overwrite the HC idle.
- K5 must prove his cyan active ring remains visible through idle turn and after Blitzer cleanup.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** production fixes/tests/approval target the actual MAIN route reached by the user's iPhone.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE.**
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.**
- **IDENTITY BEFORE RESOLUTION:** never substitute a different-looking hero merely to improve clarity.
- **NO WebP** for battle-critical attack/state/idle art on the iPhone production path.
- **KEEP NATIVE SOURCE RESOLUTION** for approved battle masters.
- **DO NOT RE-PROCESS AN ALREADY PZ-CLEAN MASTER AT RUNTIME.** If a direct approved transparent PNG already exists, use it directly unless a separately approved derived state is genuinely required.
- **HUD PORTRAITS FOLLOW CURRENT ANIMATED MASTERS.** Stale photo/headshot art is not authority.
- **PORTRAIT FRAMING IS A UI PROBLEM** when the correct portrait identity exists but reads poorly at small size.
- **TURN RINGS FOLLOW BODY FOOTPRINTS** after final origin/scale fitting.
- **ACTIVE RING VISIBILITY FOLLOWS TURN STATE** explicitly; do not trust stale tween alpha.
- **BUILD WITNESS MUST MAP TO ADAPTER LINEAGE.** Numeric LIVE28K promotions stay on the K production adapter lineage automatically.
- **PRISMEL STATE SPLIT IS LOCKED:** off-turn right-facing staffless idle; on-turn HC staff-ready.
- Never silently fall back to old LIVE28J active Prismel.
- Scale bodies, not transparent canvases, FX, staff reach, hair reach, robe/cape tails, or stance width.
- Never scale heads independently. Whole-character uniform scale only.
- CI/deployment success is not runtime QA. Do not approve until the exact iPhone MAIN route passes.
- No baked enemies in attack/FX sheets. No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA remains mandatory: 1 head, 2 arms, 2 hands, 2 legs, 2 feet, correct gauntlet count where applicable, cape attachment continuity, no duplicate/fused/missing limbs, no floating armor, no orphaned FX, no accidental face/hair artifacts.

## Immediate MAIN LIVE28K5 QA lane

1. Confirm witness reads `main-20260905-live28k5` on the normal iPhone MAIN path.
2. Confirm Auryi now visually matches the clean supplied master much more closely: face, curls, robe/gold detail, hands, and silhouette should remain crisp and intact.
3. Confirm Auryi has no white matte/halo and no duplicate crown/Auorb.
4. Confirm Auryi remains tallest and her ring sits under the body/feet footprint.
5. Confirm Prismel HUD portrait is readable, not a forehead sliver.
6. Confirm Auryi/Kineza HUD portraits are readable and correctly framed.
7. Confirm Kineza cyan active ring appears and stays visible on his turn, including after Blitzer.
8. Confirm Prismel active ring appears under his body footprint.
9. Confirm Prismel off-turn uses right-facing staffless idle.
10. Confirm Prismel on-turn uses HC staff-ready authority.
11. Trigger Prismel attack/action and verify return to staff-ready while still active, then passive after turn ends.
12. Trigger Auryi attack and verify exact return to the direct PZ-clean primary at home Y.
13. Verify Kineza remains on locked HC idle after action cleanup.
14. Run at least two full turn cycles to catch state leakage.
15. Only after the real iPhone K5 witness passes should K5 be marked approved.

## Proven patterns

- Direct repo-served PNG is the safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Identity authority outranks resolution convenience.
- State semantics and identity authority are separate requirements.
- Body-height calibration must exclude sparse props/FX and transparent padding.
- Approved alpha-clean masters should be consumed directly instead of repeatedly color-keyed or pixel-stripped at runtime.
- HUD focal framing can be corrected independently from portrait identity.
- Active-turn markers must be resynchronized to turn state after layout/state restores.
- Future cache-busted LIVE28K witnesses remain on the intended adapter lineage through a generic numeric matcher.
- Prefer narrow adapters over broad rewrites and preserve passed runtime work.
