# PriZim Live Notepad

Last refreshed: 2026-09-04
Current promoted build: `main-20260904-live28j` — **pending real iPhone MAIN approval**.

This is the fast-moving operational notepad for current PriZim production state. It is a failure-prevention ledger, not just a diary. Expensive lessons must be promoted into Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority and is the required lane for current fixes and approval.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device video/evidence outranks code inspection, CI success, desktop assumptions, and side-harness behavior.
- LIVE28I real-device result: **clarity improved**, the blue Prismel placeholder was gone, and Auryi's crown cleanup read better. However the build still FAILED because the trio sizing was wrong and the 900x900 Prismel stand-in was the **wrong Prismel identity/authority**.
- `assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png` is therefore **retired as MAIN Prismel identity authority**. Resolution/clarity may never override character identity.
- The recent PZ Prismel wire authority still defines the correct state semantics: **passive/off-turn idle** and **active/on-turn staff idle** are separate approved Prismel states.
- LIVE28J restores Prismel to existing approved direct-PNG lineage already in the repository: passive/off-turn uses `assets/prismel/walk/prismel_walk_01_contact_a.png`; active/on-turn uses the approved final staff-materialization ready pose `assets/poses/prismel_active_turn/prismel_ready_6.png`.
- The old 167x140 HC raster-in-SVG/WebP wrappers remain retired from MAIN. LIVE28J uses direct PNG only.
- Auryi remains on the approved 900x900 JRPG source with the crown/Auorb cleanup at native resolution and persistent duplicate runtime crown/Auorb suppressed.
- Kineza remains on the locked HC authority `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- LIVE28I's scale constants were themselves wrong: Prismel was targeted at ~99% of Auryi height and Kineza ~85%, which contradicted the locked lineup and explains the phone evidence.
- LIVE28J restores the documented body-height calibration: Auryi = 1.00, Prismel ≈ 1/1.29 ≈ 0.775, Kineza ≈ 0.647. Auryi body target is 47% of battle viewport, yielding approximately Prismel 36.4% and Kineza 30.4%.
- Scale measurement now rejects narrow staff shafts, isolated particles, and sparse FX before calculating body bounds. Compare body/feet/eye line/shoulder line, not staff, FX, hair reach, robe/cape reach, stance width, or transparent canvas padding.
- Aurora Pulse Resonart production remains on hold while MAIN Hybrid battle reliability and formation quality are repaired.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** Current production battle fixes, tests, witnesses, and approval must target the actual MAIN route reached by the user's iPhone web-app link.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE:** Read this notepad and applicable production locks before modifying MAIN-live behavior. Refresh them after meaningful live work or failure discovery.
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.** Asset integration, cleanup, scale, identity, and clarity problems are production tasks.
- **IDENTITY BEFORE RESOLUTION:** Never substitute a different-looking high-resolution hero merely to improve clarity. The correct locked character authority wins; improve delivery/format without changing the person.
- **NO wrapped raster sprites for battle-critical art.** Do not serve SVG files whose real payload is embedded WebP/PNG/JPEG raster data.
- **NO WebP for battle-critical attack/state/idle art on the iPhone production path unless explicitly proven on that exact route.** Default authority is normal repo-served PNG.
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
- Documented calibration currently used by LIVE28J: **Auryi 1.000 / Prismel ~0.775 / Kineza ~0.647** body height.
- Current target body shares at phone battle height: Auryi ≈47%, Prismel ≈36.4%, Kineza ≈30.4%.
- Compare foot baseline, eye line, shoulder height, body height, and native head-to-body ratio.
- Ignore FX, staff, robe/cape reach, hair reach, stance width, and transparent padding when judging body height.
- Prismel's head must not read larger than Auryi's because of normalization. Kineza remains the most youthful/compact without becoming a miniature adult.

## Prismel

- LIVE28I's `PRISMEL_JRPG_NORMALIZED_900x900.png` stand-in is **wrong Prismel for this battle authority and is retired**.
- LIVE28J passive/off-turn source: `assets/prismel/walk/prismel_walk_01_contact_a.png` (approved high-resolution Prismel movement-master lineage).
- LIVE28J active/on-turn source: `assets/poses/prismel_active_turn/prismel_ready_6.png` (approved staff-materialization final ready pose).
- Active/passive state is restored atomically after attack/action cleanup.
- The 167x140 raster-in-SVG HC wrappers remain prohibited on MAIN.
- The recent PZ passive/active wire test remains the semantic/identity reference when judging whether the repo-backed direct-PNG pair is acceptable on device.
- Do not regenerate Prismel to solve runtime integration, scale, transparency, or clarity issues.

## Auryi

- Approved JRPG Auryi master remains the identity/costume/body authority.
- Normal MAIN idle is **crownless**. Do not show the baked crown on her head.
- LIVE28J keeps the native-resolution crown/Auorb cleanup from the direct 900x900 source; body, face, hair, robe and jewelry remain intact.
- Persistent Phaser crown/Auorb objects remain suppressed so there is no duplicate magic.
- Auryi remains tallest and post-attack cleanup must return her to the crownless approved body at exact home Y.
- Basic attack: **Aurorb Slice**. Resonart: **Aurora Pulse**. Aurora Pulse production is currently paused.

## Kineza

- Locked MAIN standby authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Kineza's clarity remains the current on-device presentation benchmark, but he must remain the shortest hero at the locked body-height ratio.
- Generic Kineza state sheets must not overwrite the locked HC idle.

## Immediate MAIN LIVE28J QA lane

1. Confirm witness reads `main-20260904-live28j` on the user's normal iPhone web-app MAIN path.
2. Confirm Prismel is the correct youthful Prismel lineage, not the LIVE28I generic 900x900 stand-in.
3. Confirm passive/off-turn Prismel is staffless/standby and active/on-turn Prismel changes to the approved staff-ready state.
4. Verify normal Auryi idle remains crownless with no duplicate crown/Auorb.
5. Verify body hierarchy now reads clearly: Auryi tallest, Prismel materially shorter, Kineza clearly shortest.
6. Judge height by feet/eyes/shoulders/body, not staff/robe/FX reach.
7. Compare clarity directly against Kineza; no blue placeholder or raster-wrapper softness may return.
8. Trigger all three attacks and verify each returns to the correct authority/size.
9. Run at least two full turn cycles to catch state leakage.
10. Only after the real iPhone MAIN run passes should LIVE28J be marked approved.

## Proven Patterns

- Direct repo-served PNG is the safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Identity authority outranks resolution convenience.
- Body-height calibration must exclude sparse props/FX and transparent padding.
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
