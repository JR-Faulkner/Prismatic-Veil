# PriZim Live Notepad

Last refreshed: 2026-09-01
Current live build: `main-20260901-live27`

This is the fast-moving operational notepad for current PriZim production state. It is a failure-prevention ledger, not just a diary. Expensive lessons must be promoted into Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.

## Current truths

- PZ-A is the production hub for Animation Lab, Sound Lab, Resonart Lab, and Live Battle.
- PZ-A Resonart Lab contains the playable Auryi `Aurora Pulse` timing/composition animatic.
- LIVE26 established the reusable high-resolution FX integration pattern: harmonized sheet -> one runtime adapter -> stable anchors -> mobile runtime QA.
- LIVE26C proved the live scene/formation cannot depend only on a browser-sensitive import-map bridge. The active runtime must be directly enforceable.
- LIVE26D proved production FX readiness must be a hard gate. Do not silently mask a failed production asset with a provisional visual.
- LIVE26E retired inline/base64 WebP for battle-critical iPhone/Safari combat art.
- LIVE26F moved Auryi FX to normal repo-served PNG sheets.
- LIVE26G added explicit `auryiFx=png` and `auryiFx=phaser` paths.
- LIVE27 makes the proven Phaser-drawn Auryi presentation the default/preferred family-demo path while preserving PNG as an explicit QA path.
- LIVE27 repairs PZ-A Animation Lab so Kineza, Auryi, and Prismel are all registered and the hero selector preserves the requested hero instead of reloading back to Kineza.
- LIVE27 makes Auryi rise clearly before Aurorb Slice, perform the attack at the raised height, then settle back to her normal battle height.
- LIVE27 replaces the wrong alternate Auryi crownless body source with a crownless runtime derivation of the approved JRPG Auryi master.
- LIVE27 replaces Kineza's mismatched standing/state-sheet body with the approved Stylized-JRPG enemy-facing ready frame. The state sheet may not silently replace the locked battlefield body.

## Platform Constraints / Do-Not-Repeat Rules

- **NO WebP for battle-critical attack sheets.** Use normal repo-served PNG unless another format is explicitly proven on the exact target iPhone path first.
- Do not use inline/base64 WebP for production combat FX.
- Do not require `img.decode()` as the readiness gate for battle-critical mobile images.
- A previously observed iPhone/Safari asset-format failure is a standing constraint, not a fresh experiment opportunity.
- Production combat art must fail visibly if unavailable. Never silently substitute deprecated/provisional FX in the production lane.
- A labeled safe/demo mode is allowed. It must not masquerade as a successful production-FX validation.
- If a locked visual authority exists, later adapters/state sheets must not silently replace it during active/passive transitions.
- PZ-A must expose every currently registered production hero. A selector must preserve its chosen hero across reloads and cache-busting.
- No baked enemies in attack/FX sheets.
- No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA is mandatory before final extraction/harmonization approval.

## Auryi

### Identity / battlefield authority
- The user-supplied approved JRPG Auryi master is the visual authority for battlefield body, face, hair, costume, proportions, and Resonart work.
- Do not substitute older alternate Auryi interpretations for the battlefield body.
- Battle start is crownless and Auorb-free.
- First Auryi turn manifests crown/Auorb; persistent magic remains after manifestation unless game state removes it.
- Crown/Auorb are runtime-owned layers, not baked battlefield-body authority.
- Auryi remains tallest of the younger trio and targets about 40% viewport content height.

### Naming
- Basic attack: **Aurorb Slice**.
- Resonart: **Aurora Pulse**.
- Basic and Resonart are separate metadata/presentation authorities. Never reuse `hero.attack` as the Resonart label/source when `hero.resonart` exists.

### Preferred basic-attack presentation
- Default/family-demo mode: `auryiFx=phaser`.
- Explicit PNG QA mode: `auryiFx=png`.
- Phaser mode intentionally uses the inherited proven procedural/canvas entry + attack FX while persistent crown/Auorb remain formation-owned Phaser graphics.
- PNG mode remains available for continued persistence/readability QA and is not deleted.
- Open PNG issue remains: real-device testing showed the new PNG crown/attack presentation did not remain/read on screen as reliably as the older Phaser presentation.
- Aurorb Slice choreography remains Charge -> Projectile -> body-centered Impact -> Recompose/Settle.
- LIVE27 motion rule: **home hover -> rise clearly -> attack while raised -> settle back to exact home hover**. Crown/Auorb anchors must follow Auryi during the vertical tween.

### PNG production set retained for QA
- `assets/fx/auryi/v3/01_crown_manifest_sheet.png`
- `assets/fx/auryi/v3/02_auorb_charge_sheet.png`
- `assets/fx/auryi/v3/03_auorb_projectile_sheet.png`
- `assets/fx/auryi/v3/04_auorb_impact_sheet.png`
- `assets/fx/auryi/v3/05_recompose_settle_sheet.png`

### Aurora Pulse Resonart
- Aurora Pulse uses Hybrid-Duo **Cinematic / video-rendered mode**, not the normal attack-sheet lane.
- Semantic ladder: Aura = Auryi magic system; Auorb = condensed orb; Aurora = Resonart-scale expanded aura phenomenon.
- Cinematic grammar: battlefield continuity -> Auryi rises -> Aurora expands beyond body scale -> Auryi crushes/smashes it inward with both hands -> compressed silence beat -> huge circular Aurora Pulse -> live battlefield impact/state reconnect.
- Final cinematic uses approved JRPG Auryi identity/costume authority, animation-friendly layers, authored camera motion, hair/robe motion, separate Aurora FX, audio cues, then a rendered video asset.

## Kineza

- Kineza's battlefield standby authority is the approved **Stylized JRPG, right-facing side/rear 3/4 gameplay orientation**, looking toward the enemy.
- LIVE27 uses the proven JRPG Sprint-A/attack-master ready frame as the battlefield standby source instead of the mismatched state-sheet body.
- Do not let active/passive state logic overwrite that locked JRPG standby with a different-looking body.
- Kineza remains shortest/youngest, with youthful proportions, red/black/gold armor, oversized green kinetic gauntlets, heavy boots, and red worn cape.
- Blitzer dynamic POV remains retained; LIVE25 caps zoom at 1.28 and target blend at 0.45.
- Kineza's previous iPhone/WebP failure remains precedent for the global PNG rule.

## Prismel

- Prismel remains registered in PZ-A Animation Lab and must not disappear because another hero was selected.
- Future locked battle state: starts staffless; active turn draws/materializes staff; staff persists during active-turn state.

## PZ-A Animation Lab

- Registered heroes: **Kineza, Auryi, Prismel**.
- Kineza: Blitzer 18F authority.
- Auryi: Aurorb Slice 18 individual PNG frames from `assets/characters/auryi/animations/attack/frames/`.
- Prismel: current 12-frame basic attack authority.
- Auryi Lab playback includes a visible rise/hold/settle motion so the same vertical choreography can be evaluated outside battle.
- Selection is persisted by URL (`?hero=`) before reload. Do not reintroduce an unconditional default-to-Kineza reload.

## Battle stage / Wraith

- LIVE26 Veil-corrupted backdrop/floor remains inherited: deep indigo/violet atmosphere, perspective floor, subdued arcane rings/cracks, muted grounding pads.
- Background remains subordinate to characters, FX, and HUD.
- Wraith LIVE25 stability remains inherited: stale alpha/visibility/transform reset, reduced idle drift, guarded hit/attack transitions.

## Immediate LIVE27 QA lane

1. Confirm build witness reads `main-20260901-live27`.
2. Enter PZ-A `LIVE BATTLE · PHASER FX · PREFERRED`.
3. Verify Auryi battlefield body matches the approved JRPG master rather than the older alternate crownless source.
4. Verify battle begins crownless/Auorb-free and first-turn manifestation still works.
5. Trigger Aurorb Slice and verify Auryi rises clearly, attacks while elevated, then returns to the exact prior hover height.
6. Verify Phaser crown/Auorb/basic-attack FX remain readable/persistent through the attack.
7. Verify Kineza stands in the Stylized-JRPG enemy-facing ready pose and does not switch to the mismatched state-sheet body on active/passive changes.
8. Open Animation Lab and verify Kineza, Auryi, and Prismel can each be selected and played.
9. Verify Auryi Lab label is `Aurorb Slice` and battle Resonart label is `Aurora Pulse`.
10. Separately use `LIVE BATTLE · PNG FX · QA` only when testing PNG persistence. Do not block family/demo use on that path.

## Production efficiency rules

- One visual/audio authority per beat.
- Fix coordinate-space ownership before offset tuning.
- Use one anchor source of truth whenever practical.
- Prefer narrow adapters over broad rewrites.
- Preserve passed runtime work unless evidence shows regression.
- Runtime/mobile evidence outranks static assumptions.
- Promote costly failures into permanent Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.
- Direct runtime authority beats browser-sensitive indirection when both can safely exist.
- Asset readiness comes before playback.
