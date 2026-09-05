# PriZim Live Notepad

Last refreshed: 2026-09-05
Current promoted build: `main-20260905-live28k3` — **deployed to MAIN lane, pending corrected real-iPhone approval**.

This is the fast-moving operational notepad for current PriZim production state. It is a failure-prevention ledger, not just a diary.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device screenshots/video/evidence outrank code inspection, CI success, and desktop assumptions.
- Current witness: `main-20260905-live28k3`.
- LIVE28K2/K3 remains the active Hybrid adapter lineage; K3 is the cache-busted witness that carries the corrected Prismel state pair.

### Battle authorities

- Prismel passive/off-turn authority: `assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png`, native **1106×1422 PNG**.
- Prismel active/on-turn authority: `assets/party_formation/PRISMEL_LIVE28K2_STAFF_READY.png`, native **1402×1122 PNG**.
- Auryi authority: `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native **1086×1448 PNG**.
- Kineza authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- All battle-critical art stays **direct PNG only**. No WebP wrappers.
- Native source dimensions are preserved. Runtime body-height scaling is allowed; source-file downscaling is not.

### PZ / alpha status

- Prismel and Auryi full-resolution battle primaries were PZ-cleaned to transparent alpha at native dimensions in commit `4f56a74893edc6fadbb4d9a98e858a37d58264f8`.
- HC-approved Prismel staff-ready active authority ingest commit: `aa7b56d` (`Add HC-approved LIVE28K2 Prismel staff-ready authority`).
- Staff-ready source QA passed as **1402×1122 PNG**, alpha range 0–255, **883,935 fully transparent pixels**, **687,927 partial-alpha pixels**.
- Do not reintroduce opaque white mats or haloed cutouts.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

### Prismel state semantics

- **Off-turn / passive:** staffless idle, standing, facing right, using the new full-resolution Prismel identity.
- **On-turn / active:** HC-approved staff-ready Prismel using the same current identity, age, face, costume, proportions, short tight hair, and animated-master rendering.
- The old LIVE28J `assets/poses/prismel_active_turn/prismel_ready_6.png` is retired as active authority because it visibly mismatched the current Prismel identity.
- The temporary safety stopgap that used the passive pose on Prismel's turn is superseded.
- Final state behavior is now locked as:
  - off-turn -> right-facing staffless idle
  - Prismel turn begins -> HC staff-ready active
  - Prismel attack/action -> return to HC staff-ready while Prismel remains active
  - Prismel turn ends -> return to right-facing staffless idle
- Active/passive state must restore atomically after action cleanup.
- State split wiring commit: `e27b031b063b9112dd2f965e44b63594f72ae2c1`.
- Active preload wiring commit: `69edc476e2f146a1474f9d6ecd9fc3caf1b4c127`.
- K3 promotion commit: `6d4eeb8d217e05297f1624592700a474b0e47b68`.

### HUD portraits

- HUD portrait replacement commit: `0d3de35b80a976cb56ccc75c4502877a754825fb`.
- Existing HUD portrait paths were replaced in place so stale photo portraits cannot return:
  - `assets/ui/portrait_prismel.png`
  - `assets/ui/portrait_auryi.png`
  - `assets/ui/portrait_kineza.png`
- Portraits are transparent PNG derivatives from the current animated masters.
- Prismel portrait is right-facing; Auryi and Kineza preserve approved rightward presentation.
- UI portrait derivatives may be UI-sized; this never authorizes reducing battle-master source files.

### Turn rings / formation

- Turn-ring correction commit: `5a09151d46b12316b92e11b2552db1c547337619`.
- Active-turn circles anchor after final body fitting using measured readable feet/body footprint, not source-canvas center.
- Height order remains **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Body-height calibration remains Auryi = 1.000, Prismel ≈ 0.775, Kineza ≈ 0.647.
- Target body shares: Auryi ≈47%, Prismel ≈36.4%, Kineza ≈30.4% of battle viewport height.
- Scale bodies, not canvases, staff reach, robe/cape extremes, hair reach, FX, or transparent padding.

### Auryi

- Current authority: `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native 1086×1448 PNG, PZ alpha-cleaned.
- Normal MAIN idle remains **crownless**.
- Persistent runtime crown/Auorb duplicates remain suppressed.
- Post-attack cleanup must return Auryi to the approved crownless body at exact home Y.
- Basic attack: **Aurorb Slice**. Resonart: **Aurora Pulse**.
- Aurora Pulse production remains paused until core MAIN Hybrid battle reliability is approved.

### Kineza

- Locked MAIN standby authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Kineza remains the shortest hero at the locked ratio.
- Generic Kineza state sheets must not overwrite the locked HC idle.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** production battle fixes, tests, witnesses, and approval target the actual MAIN route reached by the user's iPhone.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE.**
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.** Integration, crop/extraction, transparency, scale, portrait wiring, ring placement, and runtime fixes are production tasks.
- **IDENTITY BEFORE RESOLUTION:** never substitute a different-looking high-resolution hero merely to improve clarity.
- **NO WebP for battle-critical attack/state/idle art on the iPhone production path.**
- **KEEP NATIVE SOURCE RESOLUTION** for approved battle masters.
- **HUD PORTRAITS FOLLOW CURRENT ANIMATED MASTERS.** Stale photo/headshot portraits are not authority.
- **TURN RINGS FOLLOW BODY FOOTPRINTS** after final origin/scale fitting.
- **PRISMEL STATE SPLIT IS LOCKED:** off-turn right-facing staffless idle; on-turn HC-approved staff-ready.
- **ACTIVE PRISMEL MUST MATCH CURRENT IDENTITY.** Pose correctness does not excuse face/age/body/costume drift.
- Never silently fall back to the old LIVE28J active Prismel.
- Scale bodies, not transparent canvases, FX, staff reach, hair reach, robe/cape tails, or stance width.
- Never scale heads independently. Whole-character uniform scale only.
- CI/deployment success is not runtime QA. Do not mark a build approved until the exact iPhone MAIN route passes.
- No baked enemies in attack/FX sheets. No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA remains mandatory: 1 head, 2 arms, 2 hands, 2 legs, 2 feet, correct gauntlet count where applicable, cape attachment continuity, no duplicate/fused/missing limbs, no floating armor, no orphaned FX, no accidental face/hair artifacts.

## Immediate MAIN LIVE28K3 QA lane

1. Confirm witness reads `main-20260905-live28k3` on the user's normal iPhone MAIN path.
2. Confirm Prismel/Auryi battle sprites have transparent backgrounds with no white mats or halos.
3. Confirm all three HUD boxes show the current animated-master portraits with no stale photos.
4. Confirm active-turn circle sits under the actual feet/body footprint for Prismel, Auryi, and Kineza.
5. Confirm off-turn Prismel uses `PRISMEL_LIVE28K2_RIGHT_FACING.png`.
6. Confirm Prismel switches to `PRISMEL_LIVE28K2_STAFF_READY.png` when his turn begins.
7. Confirm old LIVE28J Prismel never appears.
8. Trigger Prismel attack/action and verify cleanup returns to staff-ready while Prismel is still active.
9. End Prismel's turn and verify return to right-facing staffless idle.
10. Verify Auryi normal idle is crownless with no duplicate crown/Auorb.
11. Verify height hierarchy: Auryi tallest, Prismel middle, Kineza shortest.
12. Trigger all three attacks and verify each returns to the correct authority/size.
13. Run at least two full turn cycles to catch state leakage.
14. Only after the real iPhone MAIN run passes should LIVE28K3 be marked approved.

## Proven Patterns

- Direct repo-served PNG is the safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Identity authority outranks resolution convenience.
- State semantics and identity authority are separate requirements.
- Body-height calibration must exclude sparse props/FX and transparent padding.
- HUD derivatives should come from current approved animated masters.
- Active-turn markers should be anchored after final origin/scale fitting using readable body bounds.
- Reuse approved production art and cleanup logic before inventing a replacement.
- Asset readiness comes before playback.

## Production efficiency rules

- One visual/audio authority per beat.
- Fix coordinate-space ownership before offset tuning.
- Use one anchor source of truth whenever practical.
- Prefer narrow adapters over broad rewrites.
- Preserve passed runtime work unless evidence shows regression.
- Promote costly failures into permanent Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.
- **Always read this notepad before MAIN-live work and refresh it after meaningful work.**
