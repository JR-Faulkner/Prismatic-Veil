# PriZim Live Notepad

Last refreshed: 2026-09-05
Current promoted build: `main-20260905-live28k4` — **deployed to MAIN lane, pending corrected real-iPhone approval**.

This is the fast-moving operational notepad for current PriZim production state. It is a failure-prevention ledger, not just a diary.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device screenshots/video/evidence outrank code inspection, CI success, and desktop assumptions.
- Current witness: `main-20260905-live28k4`.
- LIVE28K2/K3/K4 remains the active Hybrid adapter lineage; K4 is the cache-busted witness carrying the corrected Prismel state pair plus the HUD portrait focal patch and turn-ring hardening.
- Hybrid lineage-router correction commit: `29b370d986edbe517e277452e6e5f0a21f47f075`. K2/K3/K4 witnesses must route through `Live28K2PartyBattleScene.js` + `Live28K2PartyFormationView.js`.

### Battle authorities

- Prismel passive/off-turn authority: `assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png`, native **1106×1422 PNG**.
- Prismel active/on-turn authority: `assets/party_formation/PRISMEL_LIVE28K2_STAFF_READY.png`, native **1402×1122 PNG**.
- Auryi authority: `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native **1086×1448 PNG**.
- Kineza authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- All battle-critical art stays **direct PNG only**. No WebP wrappers.
- Native source dimensions are preserved. Runtime body-height scaling is allowed; source-file downscaling is not.

### PZ / alpha status

- Prismel and Auryi full-resolution battle primaries were PZ-cleaned to transparent alpha at native dimensions in commit `4f56a74893edc6fadbb4d9a98e858a37d58264f8`.
- HC-approved Prismel staff-ready active authority ingest commit: `aa7b56d8771013e8fb572c676d978bc67ae7f98a`.
- Staff-ready source QA passed as **1402×1122 PNG**, alpha range 0–255, **883,935 fully transparent pixels**, **687,927 partial-alpha pixels**.
- Exact-byte verification: MAIN `PRISMEL_LIVE28K2_STAFF_READY.png` Git blob SHA is `518e151f4cced1a11b2db2d6b9721adb1b9f2886`.
- Do not reintroduce opaque white mats or haloed cutouts.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

### Prismel state semantics

- **Off-turn / passive:** staffless idle, standing, facing right, using the new full-resolution Prismel identity.
- **On-turn / active:** HC-approved staff-ready Prismel using the same current identity, age, face, costume, proportions, short tight hair, and animated-master rendering.
- The old LIVE28J `assets/poses/prismel_active_turn/prismel_ready_6.png` is retired as active authority.
- Final state behavior is locked as:
  - off-turn -> right-facing staffless idle
  - Prismel turn begins -> HC staff-ready active
  - Prismel attack/action -> return to HC staff-ready while Prismel remains active
  - Prismel turn ends -> return to right-facing staffless idle
- State split wiring commit: `e27b031b063b9112dd2f965e44b63594f72ae2c1`.
- Active preload wiring commit: `69edc476e2f146a1474f9d6ecd9fc3caf1b4c127`.
- K3 iPhone witness **passed the Prismel active-authority check**: the new HC staff-ready Prismel appeared on his turn and the old LIVE28J identity did not reappear.

### K3 real-device witness findings

The user supplied a real iPhone screenshot plus ~21 s screen recording from `main-20260905-live28k3`.

**Passed on-device:**
- K3 witness loaded correctly.
- Prismel/Auryi battle sprites showed no opaque white source mats.
- HC staff-ready Prismel appeared correctly on Prismel's turn.
- Auryi and Kineza remained intact.
- Height order still read Auryi tallest -> Prismel middle -> Kineza shortest.

**Failed / needs correction:**
- HUD portraits are the correct animated-master derivatives but are framed too loosely at 72×72 presentation scale: Prismel reads as a forehead/hood sliver, Auryi and Kineza read too tiny in the portrait boxes.
- Auryi's active-turn ring appeared; Prismel's active-turn ring appeared; **Kineza's active-turn ring disappeared on his turn** in the real-device recording.
- These are presentation/state-display defects, not battle-asset identity defects.

### HUD portraits

- HUD portrait replacement commit: `0d3de35b80a976cb56ccc75c4502877a754825fb`.
- Existing HUD portrait paths remain stable:
  - `assets/ui/portrait_prismel.png`
  - `assets/ui/portrait_auryi.png`
  - `assets/ui/portrait_kineza.png`
- Portraits are transparent PNG derivatives from the current animated masters and already preserve the correct rightward presentation.
- LIVE28K4 fixes their **focal framing in the HUD**, not their identity, by zooming the current transparent animated-master derivatives inside the existing 36 px portrait boxes.
- Portrait focal-framing commit: `20c91a2b3af85ac56bb3e1661f88aa1ea6620d00`.
- Prismel receives the strongest focal zoom, Auryi moderate, Kineza light, preserving faces and rightward read.
- UI portrait derivatives may be UI-sized; this never authorizes reducing battle-master source files.

### Turn rings / formation

- Original body-footprint turn-ring correction commit: `5a09151d46b12316b92e11b2552db1c547337619`.
- K3 real-device recording proved Kineza's active ring could still lose visibility even while his HUD card/turn state was active.
- LIVE28K4 hardens ring state by explicitly restoring selected-hero ring visibility/alpha/stroke after every turn swap and layout/state restoration.
- Ring hardening commit: `b8233caf4aa90514fe85a42c1a3537c5d1c93c01`.
- Active-turn circles continue to anchor after final body fitting using measured readable feet/body footprint, not source-canvas center.
- Height order remains **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Body-height calibration remains Auryi = 1.000, Prismel ≈ 0.775, Kineza ≈ 0.647.
- Target body shares: Auryi ≈47%, Prismel ≈36.4%, Kineza ≈30.4% of battle viewport height.

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
- K4 must specifically prove Kineza's cyan active-turn ring remains visible on his idle turn and returns correctly after Blitzer.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** production battle fixes, tests, witnesses, and approval target the actual MAIN route reached by the user's iPhone.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE.**
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.**
- **IDENTITY BEFORE RESOLUTION:** never substitute a different-looking high-resolution hero merely to improve clarity.
- **NO WebP for battle-critical attack/state/idle art on the iPhone production path.**
- **KEEP NATIVE SOURCE RESOLUTION** for approved battle masters.
- **HUD PORTRAITS FOLLOW CURRENT ANIMATED MASTERS.** Stale photo/headshot portraits are not authority.
- **PORTRAIT FRAMING IS A UI PROBLEM:** when the correct transparent master-derived portrait is present but unreadable at small size, correct focal crop/zoom before replacing identity art.
- **TURN RINGS FOLLOW BODY FOOTPRINTS** after final origin/scale fitting.
- **ACTIVE RING VISIBILITY MUST FOLLOW TURN STATE:** the selected hero's ring must be explicitly visible after turn swaps/restores; do not trust stale tween state alone.
- **BUILD WITNESS MUST MAP TO ADAPTER LINEAGE.** New cache-busted K witnesses must stay on the intended high-quality adapters.
- **PRISMEL STATE SPLIT IS LOCKED:** off-turn right-facing staffless idle; on-turn HC-approved staff-ready.
- **ACTIVE PRISMEL MUST MATCH CURRENT IDENTITY.**
- Never silently fall back to the old LIVE28J active Prismel.
- Scale bodies, not transparent canvases, FX, staff reach, hair reach, robe/cape tails, or stance width.
- Never scale heads independently. Whole-character uniform scale only.
- CI/deployment success is not runtime QA. Do not mark a build approved until the exact iPhone MAIN route passes.
- No baked enemies in attack/FX sheets. No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA remains mandatory: 1 head, 2 arms, 2 hands, 2 legs, 2 feet, correct gauntlet count where applicable, cape attachment continuity, no duplicate/fused/missing limbs, no floating armor, no orphaned FX, no accidental face/hair artifacts.

## Immediate MAIN LIVE28K4 QA lane

1. Confirm witness reads `main-20260905-live28k4` on the user's normal iPhone MAIN path.
2. Confirm Prismel/Auryi battle sprites still have transparent backgrounds with no white mats/halos.
3. Confirm Prismel HUD portrait now shows a readable face/head-and-shoulders animated-master crop, not a forehead sliver.
4. Confirm Auryi and Kineza HUD portraits are large/readable enough in their boxes and remain rightward-facing.
5. Confirm Auryi active ring appears under her feet/body footprint.
6. Confirm **Kineza active ring appears and stays visible throughout his idle turn**, then returns after Blitzer.
7. Confirm Prismel active ring appears under his measured feet/body footprint.
8. Confirm off-turn Prismel uses `PRISMEL_LIVE28K2_RIGHT_FACING.png`.
9. Confirm Prismel switches to `PRISMEL_LIVE28K2_STAFF_READY.png` when his turn begins.
10. Trigger Prismel attack/action and verify cleanup returns to staff-ready while Prismel is still active.
11. End Prismel's turn and verify return to right-facing staffless idle.
12. Verify Auryi normal idle is crownless with no duplicate crown/Auorb.
13. Verify height hierarchy: Auryi tallest, Prismel middle, Kineza shortest.
14. Run at least two full turn cycles to catch state leakage.
15. Only after the real iPhone MAIN run passes should LIVE28K4 be marked approved.

## Proven Patterns

- Direct repo-served PNG is the safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Identity authority outranks resolution convenience.
- State semantics and identity authority are separate requirements.
- Body-height calibration must exclude sparse props/FX and transparent padding.
- HUD derivatives should come from current approved animated masters; focal framing can be corrected independently in UI.
- Active-turn markers should be anchored after final origin/scale fitting using readable body bounds and explicitly resynchronized to turn state.
- Build witnesses are cache/deployment identifiers, not automatic adapter selectors unless explicitly mapped to the intended lineage.
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
