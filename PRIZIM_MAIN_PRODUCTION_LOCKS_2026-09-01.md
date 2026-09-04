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
- Never claim a binary asset exists because code references its filename. Verify the binary path itself.
- Never claim a build is live until GitHub Pages completes successfully for the exact promoted head SHA.
- Never claim a live build is fixed/approved until the exact iPhone MAIN route passes real-device QA.
- Mobile/runtime evidence outranks static assumptions.
- Battle-critical character art defaults to direct repo-served PNG. No raster-in-SVG wrappers or WebP state/idle shortcuts on MAIN unless explicitly proven on the exact iPhone route.
- **Identity authority outranks resolution convenience.** Never replace the locked person with a different-looking higher-resolution sprite to solve clarity.
- Scale heroes by actual body hierarchy, not transparent canvas size, staff/FX reach, hair reach, robe/cape tails, or stance width.

## Current MAIN witness
- Promoted witness: `main-20260904-live28j`.
- Approval state: **pending iPhone MAIN validation**.
- LIVE28I is rejected as a final formation pass: real-device evidence showed improved clarity but wrong Prismel identity and incorrect trio sizing.

## Formation scale authority
- Height order is locked: **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Current documented body-height calibration: **Auryi 1.000 / Prismel ~0.775 / Kineza ~0.647**.
- LIVE28J target body shares: Auryi ≈47% viewport, Prismel ≈36.4%, Kineza ≈30.4%.
- Compare feet, eye line, shoulder height, body height, and native head-to-body ratio.
- Ignore staff, FX, hair reach, robe/cape reach, stance width, and transparent padding.
- Whole-character uniform scale only. Never scale heads independently.

## Formation authorities
### Prismel
- `assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png` is **not** the correct MAIN Prismel identity authority and is retired from the live formation.
- LIVE28J passive/off-turn authority: `assets/prismel/walk/prismel_walk_01_contact_a.png`.
- LIVE28J active/on-turn authority: `assets/poses/prismel_active_turn/prismel_ready_6.png`.
- Those sources are existing approved direct-PNG Prismel lineage and preserve the intended passive -> staff-ready state distinction without returning to the 167x140 wrappers.
- The 167x140 `prismel_idle_passive_hc.svg` / `prismel_idle_active_hc.svg` raster-in-SVG WebP wrappers are **retired from MAIN live**.
- After Prismel actions, restore whichever passive/active state is currently required, atomically.
- Do not regenerate Prismel to solve transparency, scale, clarity, or runtime-integration issues.

### Auryi
- Approved JRPG Auryi master remains the identity, face, hair, costume, and body authority.
- Normal MAIN battlefield idle is **crownless**. Do not show the baked crown on her head.
- LIVE28J keeps the direct 900x900 approved PNG and applies the proven crown/Auorb cleanup at native source resolution without resampling.
- Persistent runtime crown/Auorb graphics are suppressed in the clean idle lane. Never show duplicate magic.
- Basic attack motion remains home hover -> rise -> attack elevated -> return to exact home hover.
- Post-action restore must return the crownless approved body, exact home position, visible/opaque state, and no stray persistent magic.

### Kineza
- Locked MAIN idle authority is `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- The HC asset remains the production-quality/clarity comparison bar for the trio.
- Generic Kineza state-sheet active/passive logic must not overwrite the locked standby.
- Kineza remains shortest/youngest at the locked body-height ratio. High detail does not justify enlarging him.

## Binary asset truth
- `assets/prismel/walk/prismel_walk_01_contact_a.png` is the LIVE28J Prismel passive/off-turn source.
- `assets/poses/prismel_active_turn/prismel_ready_6.png` is the LIVE28J Prismel active/on-turn source.
- `assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png` is the Auryi source used to derive the crownless presentation.
- `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png` is the Kineza standby source.
- Code-side fallback/preload preparation does not equal binary installation.
- Suspiciously tiny conversion output is rejected even if its workflow succeeds.
