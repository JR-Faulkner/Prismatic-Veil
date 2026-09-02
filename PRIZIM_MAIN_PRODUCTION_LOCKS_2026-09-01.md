# PriZim MAIN Production Locks — 2026-09-01

These rules are production constraints, not suggestions.

## Deployment scope
- MAIN is the default destination for approved game/runtime changes.
- Do not push a change to PZ-A unless the user explicitly asks for PZ-A.
- PZ-A remains a lab/tooling surface and must not silently become the production destination.

## Tooling / do-not-repeat
- Do not invoke image generation during runtime/code/debug discussion unless the user explicitly requests generation (`generate`, `G:`, pasted generation prompt, or equivalent).
- Never claim a binary asset exists in the repo because code references its filename. Verify the binary path itself.
- Never claim a build is live until GitHub Pages completed successfully for the exact promoted head SHA.
- Mobile/runtime evidence outranks static assumptions.

## Current MAIN witness
- `main-20260901-live28c`
- Pages run 707 (`33579819439`) completed successfully for `bc7e57b998c87c01c67fa31d3f69de87ee67f038`.

## Formation authorities
### Prismel
- Current production placeholder is the approved JRPG idle `party_prismel` / `PRISMEL_JRPG_NORMALIZED_900x900.png`.
- Prismel faces the enemy/right in battle.
- `stateSheetConfig` and `stateAnimKey` are disabled in the LIVE28C formation adapter so generic active/passive state logic cannot replace the locked idle.
- Future active-turn upgrade: reach/opening -> staff materialization/pull -> ready. Do not bake this into passive idle.

### Auryi
- Approved JRPG Auryi body is rendered intact. Do not destructively erase crown pixels at runtime because that produced visible splotching.
- Duplicate persistent Phaser crown/Auorb graphics are suppressed when the intact approved presentation is in use. Never show two crowns.
- MAIN formation height target is 45% viewport in LIVE28C after 40% read too small on-device.
- Basic attack motion remains home hover -> rise -> attack elevated -> return to exact home hover.
- Phaser attack presentation remains the preferred family-tested path unless the user changes direction.

### Kineza
- Locked MAIN idle authority is the final HC-approved right-facing JRPG battle idle with quieter gauntlet FX, focused mouth/eyes, compact child proportions, two gauntlets, continuous torn red cape, and no anatomy artifacts.
- Intended repo path: `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- LIVE28C preloads that asset first and uses Blitzer Frame 01 only as an emergency safety fallback while the HC binary is not yet physically present.
- Generic Kineza state-sheet active/passive logic is disabled in the LIVE28C formation adapter so it cannot overwrite the locked standby.
- Do not substitute `KINEZA_RIGHT_FACING_IDLE_APPROVED.png`, the old battle-state sheet, or a low-quality unrelated standby as the production authority.

## Binary asset truth
- Kineza HC PNG is not considered installed until `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png` is verified in the repository.
- `Prism of Elders.mp3` is not considered installed until its repo path is verified.
- Code-side fallback/preload preparation does not equal binary installation.
