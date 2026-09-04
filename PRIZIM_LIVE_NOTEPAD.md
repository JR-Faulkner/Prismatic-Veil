# PriZim Live Notepad

Last refreshed: 2026-09-04
Current live build: `main-20260904-live28h` — deployed, but **NOT APPROVED** because real iPhone MAIN testing still shows Prismel as a blue `?` placeholder.

This is the fast-moving operational notepad for current PriZim production state. It is a failure-prevention ledger, not just a diary. Expensive lessons must be promoted into Platform Constraints, Do-Not-Repeat Rules, or Proven Patterns.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority and must be the lane used for current fixes and approval.
- A green GitHub Pages deployment only proves deployment succeeded. It does **not** prove the live iPhone runtime is correct.
- Real-device video evidence outranks code inspection, CI success, or desktop assumptions.
- LIVE28H successfully deployed, but the 2026-09-04 iPhone MAIN recording still shows Prismel as a giant blue `?` placeholder in battle.
- The Prismel HC active/passive assets currently stored as `.svg` files are wrappers around embedded base64 WebP raster data rather than normal vector artwork.
- That wrapped/embedded raster arrangement violates an already-known mobile production constraint and is the leading root cause of the Prismel placeholder on iPhone/Safari.
- The active Prismel HC wrapper converted to a plausible PNG in the first one-shot converter, but the passive result was only 187 bytes and was rejected before live wiring. Do not ship suspicious conversion output merely because the workflow itself succeeded.
- A direct embedded-pixel extraction attempt failed because the SVG's base64 payload required padding normalization. Repair must continue from the exact approved pixels, not regeneration.
- PZ-A remains useful for Animation Lab, Sound Lab, and Resonart Lab, but battle-production approval is now anchored to the user's MAIN iPhone web-app path.
- Aurora Pulse Resonart work is intentionally on hold while Hybrid/Main battle reliability is repaired.
- Kineza's locked HC battle idle exists on MAIN and remains the authority.
- Prismel HC active/passive state logic has been hardened across action snapshots, but asset delivery must be fixed before that logic can be considered passed.
- Auryi's duplicate persistent crown/Auorb runtime objects were removed in LIVE28G/H, and post-attack restoration now reasserts the approved master body.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** Current production battle fixes, tests, witnesses, and approval must target the actual MAIN route reached by the user's iPhone web-app link. Do not treat a side harness or alternate HTML route as proof that MAIN is fixed.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE:** Before modifying MAIN-live behavior, read this live notepad and applicable production locks. After each meaningful live change or failure discovery, refresh this notepad with result, witness, remaining issue, and new permanent lesson.
- **NO wrapped raster sprites for battle-critical art.** Do not serve SVG files whose actual visual payload is embedded WebP/PNG/JPEG raster data. Use a direct production asset format instead.
- **NO WebP for battle-critical attack/state/idle art on the iPhone production path unless explicitly proven on that exact route.** Default authority is normal repo-served PNG.
- Do not use inline/base64 WebP for production combat FX or character state art.
- Do not require `img.decode()` as the readiness gate for battle-critical mobile images.
- A previously observed iPhone/Safari asset-format failure is a standing constraint, not a fresh experiment opportunity.
- CI/deployment success is not runtime QA. Never mark a build fixed until the exact live production path is tested.
- Production combat art must fail visibly if unavailable. Never silently substitute deprecated/provisional FX in the production lane.
- A labeled safe/demo mode is allowed. It must not masquerade as a successful production-FX validation.
- If a locked visual authority exists, later adapters/state sheets must not silently replace it during active/passive transitions.
- PZ-A must expose every currently registered production hero. A selector must preserve its chosen hero across reloads and cache-busting.
- No baked enemies in attack/FX sheets.
- No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA is mandatory before final extraction/harmonization approval.
- Suspicious artifact size/output is a hard QA stop. A successful conversion workflow does not make a tiny/blank/corrupt output production-valid.

## Auryi

### Identity / battlefield authority
- The user-supplied approved JRPG Auryi master is the visual authority for battlefield body, face, hair, costume, proportions, and Resonart work.
- Do not substitute older alternate Auryi interpretations for the battlefield body.
- Current Hybrid/Main correction removes inherited duplicate persistent crown/Auorb objects from the idle presentation.
- Auryi remains tallest of the younger trio.
- LIVE28H post-attack cleanup must restore the approved body, exact home Y, visible/opaque state, and zero stray persistent magic objects.

### Naming
- Basic attack: **Aurorb Slice**.
- Resonart: **Aurora Pulse**.
- Basic and Resonart are separate metadata/presentation authorities. Never reuse `hero.attack` as the Resonart label/source when `hero.resonart` exists.

### Aurora Pulse Resonart
- Aurora Pulse uses Hybrid-Duo **Cinematic / video-rendered mode**, not the normal attack-sheet lane.
- Semantic ladder: Aura = Auryi magic system; Auorb = condensed orb; Aurora = Resonart-scale expanded aura phenomenon.
- Cinematic grammar: battlefield continuity -> Auryi rises -> Aurora expands beyond body scale -> Auryi crushes/smashes it inward with both hands -> compressed silence beat -> huge circular Aurora Pulse -> live battlefield impact/state reconnect.
- Resonart production is currently paused while MAIN Hybrid battle reliability is repaired.

## Kineza

- Kineza's battlefield standby authority is the approved **Stylized JRPG, right-facing side/rear 3/4 gameplay orientation**, looking toward the enemy.
- MAIN production asset: `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Do not let active/passive state logic overwrite that locked JRPG standby with a different-looking body.
- Kineza remains shortest/youngest, with youthful proportions, red/black/gold armor, oversized green kinetic gauntlets, heavy boots, and red worn cape.
- Kineza's previous iPhone/WebP failure remains precedent for the global direct-PNG rule.

## Prismel

- Prismel's approved HC passive/active pair is the current battlefield state authority.
- Intended state behavior: passive/off-turn idle when not active; active/staff state on Prismel's turn; after attack/action cleanup, restore the current desired HC state atomically.
- LIVE28G/H hardened the state restore path, but real iPhone MAIN evidence proves asset delivery is still broken.
- **Open blocker:** `prismel_idle_passive_hc.svg` and `prismel_idle_active_hc.svg` are raster-in-SVG wrappers around embedded WebP. They must be replaced in the live preload path by verified normal PNG outputs preserving the exact approved pixels.
- Do not regenerate Prismel to solve this issue. This is a format/delivery repair only.
- First SVG renderer pass produced active PNG 17,448 bytes and passive PNG 187 bytes. Passive output is rejected as suspicious/invalid until verified.
- Direct extraction workflow failed on base64 padding. Next extraction must normalize padding before decode, verify decoded WebP signature, verify output image dimensions, and require a sane minimum PNG byte size before commit.

## PZ-A Animation Lab

- Registered heroes: **Kineza, Auryi, Prismel**.
- Kineza: Blitzer 18F authority.
- Auryi: Aurorb Slice current attack authority.
- Prismel: current 12-frame basic attack authority.
- PZ-A is not a substitute for MAIN iPhone battle approval.

## Battle stage / Wraith

- LIVE26 Veil-corrupted backdrop/floor remains inherited: deep indigo/violet atmosphere, perspective floor, subdued arcane rings/cracks, muted grounding pads.
- Background remains subordinate to characters, FX, and HUD.
- Wraith LIVE25 stability remains inherited: stale alpha/visibility/transform reset, reduced idle drift, guarded hit/attack transitions.

## Immediate MAIN QA lane

1. Repair Prismel HC assets into **verified direct PNG files** from the exact approved embedded pixels.
2. Verify both PNGs have sane dimensions, alpha/readability, nontrivial byte size, and expected signatures before live wiring.
3. Point `Live28PartyBattleScene.js` MAIN preload directly at the PNG files. No SVG wrapper, no embedded WebP path.
4. Bump the live witness only after asset verification and code wiring are both committed.
5. Confirm GitHub Pages deployment is green.
6. Open the user's normal **iPhone web-app MAIN link**.
7. Verify Prismel appears correctly at battle start, on active turn, after attack, on next hero turn, and after returning to Prismel.
8. Run at least two complete turn cycles to catch state leakage.
9. Verify Auryi returns to approved body/home position with no duplicate magic.
10. Verify Kineza remains on the locked HC idle.
11. Only after the real iPhone MAIN run passes should the build be marked approved.

## Proven Patterns

- Dropbox connector temporary byte-download URL -> one-shot GitHub Actions ingest -> signature/size validation -> commit MAIN -> delete importer is proven for binary asset ingestion.
- Runtime/mobile evidence outranks static assumptions.
- Direct repo-served PNG is the proven safe battle-art default for the iPhone path.
- Direct runtime authority beats browser-sensitive indirection when both can safely exist.
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
