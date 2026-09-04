# PriZim Live Notepad

Last refreshed: 2026-09-04
Current promoted build: `main-20260904-live28i` — **pending real iPhone MAIN approval**.

This is the fast-moving operational notepad for current PriZim production state. It is a failure-prevention ledger, not just a diary. Expensive lessons must be promoted into Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority and is the required lane for current fixes and approval.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device video/evidence outranks code inspection, CI success, desktop assumptions, and side-harness behavior.
- LIVE28H was deployed but rejected by real iPhone MAIN evidence: Prismel rendered as a giant blue `?`; Auryi was the wrong idle presentation with a baked crown; trio scale/overall size was visibly wrong; Prismel clarity was much lower than Kineza.
- The low-quality Prismel HC `.svg` files were only 167x140 raster-in-SVG wrappers around embedded WebP. They are retired from the MAIN live preload in LIVE28I.
- LIVE28I now preloads Prismel directly from `assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png` under a fresh MAIN key. No SVG wrapper and no idle-state WebP wrapper is used.
- LIVE28I now preloads Auryi directly from `assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png` and restores the previously used LIVE27 crownless cleanup treatment without resampling the 900x900 source. Baked crown/Auorb apparatus is removed from the idle presentation; persistent runtime crown/Auorb objects remain suppressed.
- Kineza remains on the locked HC authority `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- LIVE28I fixes the scale bug at its source: the formation no longer scales heroes by the outer source canvas. It measures meaningful visible-alpha/body bounds, anchors to the actual visible body/feet, then scales by the locked trio hierarchy.
- LIVE28I visible-height calibration uses the locked lineup relationship: Auryi 520 reference units, Prismel 515, Kineza 440. Auryi target visible height is 43% of the battle viewport, with Prismel just below and Kineza clearly shortest.
- Actor x/y positions are snapped to whole pixels after visible-bound fitting to reduce avoidable subpixel softness on the iPhone renderer.
- Prismel's temporary active/passive idle *visual* distinction is intentionally suspended in LIVE28I rather than reintroducing the tiny HC wrappers. The full-resolution master remains the standby authority until a verified high-resolution active/passive pair is installed. Attack/action presentation remains separate.
- Aurora Pulse Resonart production remains on hold while MAIN Hybrid battle reliability and formation quality are repaired.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** Current production battle fixes, tests, witnesses, and approval must target the actual MAIN route reached by the user's iPhone web-app link. Do not treat a side harness or alternate HTML route as proof that MAIN is fixed.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE:** Before modifying MAIN-live behavior, read this live notepad and applicable production locks. After each meaningful live change or failure discovery, refresh this notepad with result, witness, remaining issue, and new permanent lesson.
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.** Asset integration/cleanup/scale problems are production tasks, not generation prompts.
- **NO wrapped raster sprites for battle-critical art.** Do not serve SVG files whose actual visual payload is embedded WebP/PNG/JPEG raster data. Use a direct production asset format.
- **NO WebP for battle-critical attack/state/idle art on the iPhone production path unless explicitly proven on that exact route.** Default authority is normal repo-served PNG.
- Do not use inline/base64 WebP for production combat FX or character state art.
- A previously observed iPhone/Safari asset-format failure is a standing constraint, not a fresh experiment opportunity.
- **Scale visible bodies, not source canvases.** Transparent padding/canvas size must never determine comparative hero height. Measure/read the actual body silhouette and use the locked scale hierarchy.
- Never scale heads independently. Whole-character scale only.
- CI/deployment success is not runtime QA. Never mark a build fixed until the exact live production path is tested.
- If a locked visual authority exists, later adapters/state sheets must not silently replace it during active/passive transitions.
- No baked enemies in attack/FX sheets.
- No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.
- Suspicious artifact size/output is a hard QA stop. A successful conversion workflow does not make a tiny/blank/corrupt output production-valid.

## Trio formation / scale authority

- Height order: **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Locked lineup reference used by LIVE28I: Auryi ≈ 520, Prismel ≈ 515, Kineza ≈ 440 visible-height units.
- Compare body/foot baseline, eye line, shoulder height, and native head-to-body ratio. Ignore transparent canvas padding and sparse FX when judging scale.
- Prismel's head must not read larger than Auryi's because of source-canvas differences.
- Kineza stays the most youthful/compact without becoming a miniature adult.
- Current LIVE28I target: Auryi visible body ≈43% viewport; Prismel ≈42.6%; Kineza ≈36.4%.

## Auryi

- Approved JRPG Auryi master remains the identity/costume/body authority.
- Current MAIN idle must be **crownless**. Do not show the baked crown on the normal battlefield idle.
- LIVE28I uses a native-resolution 900x900 cleanup texture derived from the approved master. It removes only baked crown/Auorb magical apparatus and preserves body, face, hair, robe, jewelry, and native source resolution.
- Persistent Phaser crown/Auorb objects are suppressed in the current clean idle path so there is no duplicate magic.
- Auryi remains tallest of the trio.
- Post-attack cleanup must restore the crownless approved body, exact home Y, visible/opaque state, and zero stray persistent magic objects.
- Basic attack: **Aurorb Slice**. Resonart: **Aurora Pulse**. Keep those presentation authorities separate.
- Aurora Pulse cinematic production is paused until MAIN battle presentation is stable.

## Prismel

- MAIN LIVE28I standby authority: `assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png`.
- The 167x140 HC raster-in-SVG active/passive wrappers are **retired from MAIN live** and must not return as a clarity or mobile-format shortcut.
- Prismel must render at the same production-quality tier as Auryi/Kineza and remain the middle-height hero.
- Until a verified high-resolution active/passive pair exists, use the high-resolution master for standby rather than degrading clarity to preserve the state distinction.
- After attack/action cleanup, restore the high-resolution master atomically.
- Do not regenerate Prismel to solve engine integration, scale, transparency, or clarity issues.

## Kineza

- Kineza's battlefield standby authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Do not substitute `KINEZA_RIGHT_FACING_IDLE_APPROVED.png`, the older state sheet, or unrelated fallback art while the HC asset exists.
- Kineza remains shortest/youngest while retaining the high clarity already observed on iPhone.
- Kineza's quality is the current on-device comparison bar for trio presentation clarity, not a reason to enlarge him above his locked height relationship.

## PZ-A / labs

- PZ-A remains useful for Animation Lab, Sound Lab, and Resonart Lab.
- PZ-A is not a substitute for MAIN iPhone battle approval.
- Registered animation heroes remain Kineza, Auryi, Prismel.

## Immediate MAIN LIVE28I QA lane

1. Confirm witness reads `main-20260904-live28i` on the user's normal iPhone web-app MAIN path.
2. Verify Prismel is a real high-resolution character, not a blue `?`, missing image, tiny wrapper, or visibly soft enlargement.
3. Verify normal Auryi idle is the approved Auryi body **without the crown on her head** and with no duplicate floating crown/Auorb layers.
4. Verify trio visible scale reads Auryi tallest, Prismel just below Auryi, Kineza clearly shortest.
5. Verify their overall battlefield size is substantially more readable than LIVE28H and no hero is being sized by transparent canvas padding.
6. Compare clarity directly: Prismel and Auryi should no longer look obviously lower-resolution than Kineza.
7. Trigger Prismel attack and verify clean return to high-resolution standby.
8. Trigger Auryi attack and verify clean crownless-body return at exact home height.
9. Trigger Kineza/Blitzer and verify HC body/clarity remain intact.
10. Run at least two full turn cycles to catch state leakage.
11. Only after the real iPhone MAIN run passes should LIVE28I be marked approved.

## Proven Patterns

- Direct repo-served PNG is the proven safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Direct runtime authority beats browser-sensitive indirection when both can safely exist.
- Visible-alpha/body-bound scaling is the correct normalization method when production art has different canvas padding.
- Reuse previously solved production cleanup logic before inventing a new asset or regeneration pass.
- Asset readiness comes before playback.

## Production efficiency rules

- One visual/audio authority per beat.
- Fix coordinate-space ownership before offset tuning.
- Use one anchor source of truth whenever practical.
- Prefer narrow adapters over broad rewrites.
- Preserve passed runtime work unless evidence shows regression.
- Runtime/mobile evidence outranks static assumptions.
- Promote costly failures into permanent Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.
- **Always read this notepad before MAIN-live work and refresh it after meaningful work.**
