# PriZim MAIN Production Locks — refreshed 2026-09-04

These rules are production constraints, not suggestions.

## Deployment scope
- MAIN is the default destination for approved game/runtime changes.
- The user's normal production-validation route is the iPhone web-app link into MAIN.
- Do not push a change to PZ-A unless the user explicitly asks for PZ-A.
- PZ-A remains a lab/tooling surface and must not silently become the production destination.

## Tooling / do-not-repeat
- Do not invoke image generation during runtime/code/debug discussion unless the user explicitly requests generation (`generate`, `G:`, pasted generation prompt, or equivalent).
- Before MAIN-live work, read `PRIZIM_LIVE_NOTEPAD.md` and these locks. After meaningful live work, update the notepad.
- Never claim a binary asset exists in the repo because code references its filename. Verify the binary path itself.
- Never claim a build is live until GitHub Pages completed successfully for the exact promoted head SHA.
- Never claim a live build is fixed/approved until the exact iPhone MAIN route passes real-device QA.
- Mobile/runtime evidence outranks static assumptions.
- Battle-critical character art defaults to direct repo-served PNG. No raster-in-SVG wrappers or WebP state/idle shortcuts on MAIN unless explicitly proven on the exact iPhone route.
- Scale heroes by visible body/silhouette bounds, not transparent source-canvas dimensions.

## Current MAIN witness
- Promoted witness: `main-20260904-live28i`.
- Approval state: **pending iPhone MAIN validation**.
- LIVE28H is rejected as a production presentation pass because the iPhone recording showed Prismel placeholder failure, wrong/crowned Auryi idle, and incorrect trio scale/clarity balance.

## Formation scale authority
- Height order is locked: **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Locked visible-height reference relationship: Auryi ≈ 520, Prismel ≈ 515, Kineza ≈ 440.
- Compare actual body/feet/eye-line/shoulder-height, not transparent padding, FX reach, robe/cape tails, or outer canvas size.
- Whole-character uniform scale only. Never scale heads independently.
- LIVE28I target visible heights are approximately Auryi 43% viewport, Prismel 42.6%, Kineza 36.4%.

## Formation authorities
### Prismel
- Current MAIN standby authority is the direct high-resolution PNG `assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png`.
- The 167x140 `prismel_idle_passive_hc.svg` / `prismel_idle_active_hc.svg` files are raster-in-SVG WebP wrappers and are **retired from MAIN live**.
- Do not sacrifice production clarity to preserve active/passive state differentiation. Until a verified high-resolution state pair exists, the 900x900 master remains the standby authority.
- Attack/action presentation remains separate. After actions, restore the high-resolution master atomically.
- Do not regenerate Prismel to solve transparency, scale, clarity, or runtime-integration issues.

### Auryi
- Approved JRPG Auryi master remains the identity, face, hair, costume, and body authority.
- Normal MAIN battlefield idle is **crownless**. Do not show the baked crown on her head.
- LIVE28I preloads the direct 900x900 approved PNG and applies the previously proven crown/Auorb cleanup at native source resolution without resampling.
- Persistent runtime crown/Auorb graphics are suppressed in the current clean idle lane. Never show duplicate magic.
- Basic attack motion remains home hover -> rise -> attack elevated -> return to exact home hover.
- Post-action restore must return the crownless approved body, exact home position, visible/opaque state, and no stray persistent magic.

### Kineza
- Locked MAIN idle authority is `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- The HC asset remains the production-quality/clarity comparison bar for the trio.
- Generic Kineza state-sheet active/passive logic must not overwrite the locked standby.
- Do not substitute `KINEZA_RIGHT_FACING_IDLE_APPROVED.png`, an older state sheet, or a low-quality unrelated standby while the HC asset exists.
- Kineza remains shortest/youngest. High visual detail does not justify increasing him above the locked scale relationship.

## Binary asset truth
- `assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png` is the live Prismel standby source for LIVE28I.
- `assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png` is the live Auryi source used to derive the crownless presentation.
- `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png` is the live Kineza standby source.
- Code-side fallback/preload preparation does not equal binary installation.
- Suspiciously tiny conversion output is rejected even if its workflow succeeds.
