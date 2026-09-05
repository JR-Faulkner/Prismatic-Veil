# PriZim Live Notepad

Last refreshed: 2026-09-05
Current promoted build: `main-20260904-live28k2` — **deployed to MAIN, pending corrected real-iPhone approval**.

This is the fast-moving operational notepad for current PriZim production state. It is a failure-prevention ledger, not just a diary. Expensive lessons must be promoted into Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority and is the required lane for current fixes and approval.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device screenshots/video/evidence outrank code inspection, CI success, desktop assumptions, and side-harness behavior.
- `main-20260904-live28k2` is now the promoted witness on MAIN.
- LIVE28K2 full-resolution primary asset commit: `38b6439835b188e1aa1a388194997ef25771c91c`.
- LIVE28K2 Prismel primary: `assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png`, native 1106×1422.
- LIVE28K2 Auryi primary: `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native 1086×1448.
- Both battle-critical primaries are **PNG-only and must remain at native source resolution**. Runtime display scaling is allowed; source-file downscaling is not.
- The first LIVE28K2 iPhone witness confirmed the build loaded and the new Auryi primary appeared, but exposed failures: opaque white source backgrounds, incorrect Prismel active-state authority, stale HUD portraits, and turn-ring placement needing body-footprint anchoring.
- LIVE28K2 turn-ring correction commit: `5a09151d46b12316b92e11b2552db1c547337619`. Turn rings now re-center after high-resolution body fitting using the measured readable body/footprint rather than source-canvas center.
- LIVE28K2 HUD portrait replacement commit: `0d3de35b80a976cb56ccc75c4502877a754825fb`.
- HUD portrait paths remain stable and were replaced **in place** so stale photo portraits cannot silently return:
  - `assets/ui/portrait_prismel.png`
  - `assets/ui/portrait_auryi.png`
  - `assets/ui/portrait_kineza.png`
- The HUD portraits are PZ-clean transparent PNG derivatives cut from the user's supplied current animated masters. Prismel is explicitly right-facing; Auryi and Kineza preserve their approved rightward presentation. No white opaque portrait mats and no WebP.
- HUD portrait derivatives may be UI-sized; this does **not** authorize reducing the native battle-master source files.
- The white source backgrounds on the full battle primaries are asset-alpha cleanup problems, not scale or identity problems. Remove only the background into transparency, preserve native resolution, preserve character pixels, and keep PNG.
- Prismel has **two distinct required battle states** and they must never be collapsed into one pose:
  - **Off-turn / passive:** staffless idle, standing, facing right, using the new full-resolution LIVE28K2 Prismel identity.
  - **On-turn / active:** staff-ready Prismel, using the **same current Prismel identity, age, face, costume, proportions, and rendering authority**.
- The old LIVE28J active texture `assets/poses/prismel_active_turn/prismel_ready_6.png` visibly mismatched the new LIVE28K2 Prismel identity on-device and is therefore **not acceptable as the current active-turn identity authority**.
- Do **not** solve that mismatch by making the off-turn right-facing idle also serve as the final active-turn pose. The active state still needs to be staff-ready.
- Commit `dde90ae4dbb92445d21f9f27e59b00cece8af642` temporarily retired the old active authority to stop the wrong Prismel from reappearing. This is a **safety stopgap, not final state semantics**. Next Prismel runtime correction must restore the two-state split with a correct-identity staff-ready active source.
- `assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png` remains retired as MAIN Prismel identity authority.
- The old raster-in-SVG/WebP wrappers remain retired from MAIN.
- Auryi's LIVE28K2 primary replaces the older 900x900 runtime authority. Normal idle remains crownless with duplicate runtime crown/Auorb suppressed.
- Kineza remains on the locked HC authority `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png` and must remain untouched by this Prismel/Auryi correction.
- Height order remains **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Body-height calibration remains Auryi = 1.000, Prismel ≈ 0.775, Kineza ≈ 0.647. Auryi body target remains ~47% of battle viewport, Prismel ~36.4%, Kineza ~30.4%.
- Scale measurement must reject narrow props, sparse FX, transparent padding, staff reach, hair reach, robe/cape reach, and stance width.
- Aurora Pulse Resonart remains on hold while MAIN Hybrid battle reliability/formation quality are repaired.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** Current production battle fixes, tests, witnesses, and approval must target the actual MAIN route reached by the user's iPhone web-app link.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE:** Read this notepad and applicable production locks before modifying MAIN-live behavior. Refresh them after meaningful live work or failure discovery.
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.** Asset integration, cleanup, crop/extraction, scale, identity, transparency, portrait wiring, ring placement, and clarity problems are production tasks.
- **IDENTITY BEFORE RESOLUTION:** Never substitute a different-looking high-resolution hero merely to improve clarity. The correct locked character authority wins.
- **NO wrapped raster sprites for battle-critical art.** Do not serve SVG files whose real payload is embedded WebP/PNG/JPEG raster data.
- **NO WebP for battle-critical attack/state/idle art on the iPhone production path.** Default authority is direct repo-served PNG.
- **KEEP NATIVE SOURCE RESOLUTION:** Do not reduce the source dimensions of the approved Prismel/Auryi primaries. Runtime display scaling does not count as source-file reduction.
- **HUD PORTRAITS FOLLOW CURRENT ANIMATED MASTERS:** Character-box portraits must be cut from current approved animated/master art, transparent PNG, and oriented consistently rightward. Stale photo/headshot assets are not authority.
- **TURN RINGS FOLLOW BODY FOOTPRINTS:** Active-turn circles must anchor to measured feet/body bounds after final sprite scale/origin fitting, never transparent/source-canvas center.
- **PRISMEL STATE SPLIT IS LOCKED:** off-turn = right-facing staffless idle; on-turn = staff-ready. Never flatten both states into one pose.
- **ACTIVE PRISMEL MUST MATCH CURRENT IDENTITY:** a staff-ready pose that changes his face, age, body, costume, or overall identity is invalid even if the state/action is correct.
- If the correct active-turn Prismel asset is not yet wired, do not silently fall back to a mismatched older active texture.
- A previously observed iPhone/Safari asset-format failure is a standing constraint, not a fresh experiment opportunity.
- **Scale bodies, not canvases or FX.** Transparent padding, staff reach, hair reach, robe/cape tails, particles, and stance width must not determine comparative hero height.
- Never scale heads independently. Whole-character uniform scale only.
- CI/deployment success is not runtime QA. Never mark a build fixed/approved until the exact iPhone MAIN route passes.
- If a locked visual authority exists, later adapters/state sheets must not silently replace it during active/passive transitions.
- No baked enemies in attack/FX sheets. No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

## Trio formation / scale authority

- Height order: **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Calibration: **Auryi 1.000 / Prismel ~0.775 / Kineza ~0.647** body height.
- Current target body shares at phone battle height: Auryi ≈47%, Prismel ≈36.4%, Kineza ≈30.4%.
- Compare foot baseline, eye line, shoulder height, body height, and native head-to-body ratio.
- Ignore FX, staff, robe/cape reach, hair reach, stance width, and transparent padding when judging body height.
- Prismel's head must not read larger than Auryi's because of normalization. Kineza remains the most youthful/compact without becoming a miniature adult.
- LIVE28K2 ring placement is post-fit body-footprint anchored by commit `5a09151d46b12316b92e11b2552db1c547337619`.

## Prismel

- Current passive/off-turn authority: `assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png`, native 1106×1422 PNG.
- Passive/off-turn presentation is **staffless, standing, facing right**.
- Active/on-turn presentation is **staff-ready**.
- Active and passive must be two separate states but must read as the exact same Prismel identity.
- The old LIVE28J active source `assets/poses/prismel_active_turn/prismel_ready_6.png` is not acceptable if it produces the mismatched Prismel seen in the LIVE28K2 phone witness.
- Commit `dde90ae4dbb92445d21f9f27e59b00cece8af642` is only a temporary wrong-identity guard. It is not final approval to use the passive idle during Prismel's active turn.
- Final correction target: **off-turn new right-facing idle -> turn begins -> correct-identity staff-ready Prismel -> attack/action -> return to correct state based on whose turn it is**.
- Active/passive state must restore atomically after attack/action cleanup.
- HUD portrait authority is now `assets/ui/portrait_prismel.png`, cut from the supplied current Prismel animated master, transparent PNG and right-facing.
- The 167x140 raster-in-SVG HC wrappers remain prohibited on MAIN.
- Do not regenerate Prismel to solve runtime integration, scale, transparency, portrait, or clarity issues.

## Auryi

- Current LIVE28K2 authority: `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native 1086×1448 PNG.
- Normal MAIN idle is **crownless**. Do not show a baked crown on her head.
- The new full-res primary currently needs its opaque white background removed to alpha at native resolution before approval.
- Persistent Phaser crown/Auorb objects remain suppressed so there is no duplicate magic.
- Auryi remains tallest and post-attack cleanup must return her to the crownless approved body at exact home Y.
- HUD portrait authority is now `assets/ui/portrait_auryi.png`, cut from the supplied current Auryi animated master with transparent alpha.
- Basic attack: **Aurorb Slice**. Resonart: **Aurora Pulse**. Aurora Pulse production is currently paused.

## Kineza

- Locked MAIN standby authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Kineza's clarity remains the current on-device presentation benchmark, but he must remain the shortest hero at the locked body-height ratio.
- HUD portrait authority is now `assets/ui/portrait_kineza.png`, cut from the supplied current Kineza animated master with transparent alpha.
- Generic Kineza state sheets must not overwrite the locked HC idle.

## Immediate MAIN LIVE28K2 QA lane

1. Confirm witness reads `main-20260904-live28k2` on the user's normal iPhone web-app MAIN path.
2. Verify all three character boxes show the new master-derived transparent portraits; Prismel must face right and no stale photo portrait may appear.
3. Verify the active-turn circle sits under the actual measured feet/body footprint for Prismel, Auryi, and Kineza after scaling.
4. Remove Prismel and Auryi opaque white **battle-sprite** backgrounds into transparency while preserving exact native dimensions and PNG delivery.
5. Confirm off-turn Prismel uses the new full-res right-facing staffless idle.
6. Confirm Prismel switches to a **correct-identity staff-ready state** when his turn begins.
7. Confirm the old mismatched LIVE28J active Prismel never appears again.
8. Confirm attack/action cleanup returns Prismel to staff-ready while his turn is still active, then back to right-facing idle once his turn ends.
9. Verify normal Auryi idle remains crownless with no duplicate crown/Auorb.
10. Verify body hierarchy reads clearly: Auryi tallest, Prismel middle, Kineza shortest.
11. Judge height by feet/eyes/shoulders/body, not staff/robe/FX reach.
12. Trigger all three attacks and verify each returns to the correct authority/size.
13. Run at least two full turn cycles to catch state leakage.
14. Only after the real iPhone MAIN run passes should LIVE28K2 be marked approved.

## Proven Patterns

- Direct repo-served PNG is the safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Identity authority outranks resolution convenience.
- State semantics and identity authority are separate requirements: the pose can be correct while the character identity is wrong.
- Body-height calibration must exclude sparse props/FX and transparent padding.
- HUD derivatives should be created from current approved animated masters rather than unrelated legacy headshots.
- Active-turn markers should be anchored after final origin/scale fitting using readable body bounds.
- Reuse previously approved production art and cleanup logic before inventing a replacement.
- Asset readiness comes before playback.

## Production efficiency rules

- One visual/audio authority per beat.
- Fix coordinate-space ownership before offset tuning.
- Use one anchor source of truth whenever practical.
- Prefer narrow adapters over broad rewrites.
- Preserve passed runtime work unless evidence shows regression.
- Promote costly failures into permanent Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.
- **Always read this notepad before MAIN-live work and refresh it after meaningful work.**
