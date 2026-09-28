# PriZim Live Notepad

## LIVE31E cumulative XP and Tower progression (2026-09-28)

- `pv.progression.v1` advances to schema 3 without changing the storage key. Level thresholds are now cumulative: Level 2 at 100 total XP, Level 3 at 235, Level 4 at 417, and Level 5 at 663. The current curve contract is locked against accidental regression.
- Schema-1/2 migration preserves every earned level, XP value, Focus allocation, skill node, item, clear, and claim. If an old non-cumulative threshold produced a higher level, migration raises XP to the equivalent cumulative threshold rather than lowering that Bearer.
- The playable journey now awards progression beyond battle: Resonance Tower locks grant +20, +20, and +35 XP to each active Bearer. Whispering Grove first clear plus all three Tower locks totals 175 XP each, keeping the party at Level 2 and leaving meaningful room before Level 3 at 235.
- Tower rewards are one-time and duplicate-safe, use the authentic Tower memory-link cue, show a live XP notice, and immediately refresh `pv.save.v1` so MAIN → CONTINUE cannot restore a pre-puzzle ledger.
- Echo Castle and Frigid Hills remain movement/story locations, so they do not fabricate XP before their encounters exist. K27 Hybrid battle/cinematic authority is unchanged.

## LIVE31D TV encounter stability (2026-09-28)

- TV/browser witness exposed two separate first-encounter defects: the Whispering Grove handoff could race map/controller input and leave the party positioned at Echo Castle instead of entering battle, and the single Hushling was forced to geometric screen center where it overlapped Kineza's foreground lane.
- Whispering Grove launch is now atomic: once travel begins, map/controller click targets are locked; travel animation/audio is presentation-only and cannot block routing; `pv.lastLocation` preserves the true origin; `pv.currentLocation` commits to `whisper` before the confirmation card; Enter/Space confirmation captures at window level so map handlers cannot also consume it.
- `Live30E4HushlingView` moves the single Hushling to the enemy-side lane on landscape, with a higher TV-safe baseline. K27 party formation, enemy identity/stats, combat logic, progression, and Resonart lanes are unchanged.
- Pending gates: branch encounter guard + canonical PriZim preflight + Pages, then real TV/iPhone witness.

Last refreshed: 2026-09-28

## LIVE31B Prismel growth polish (2026-09-28)

- Resonance Ascension and both growth views retain the approved full-screen compositions while adding restrained prismatic entry, natural-growth, node-ready, and commit animation layers.
- `assets/js/pv-growth-audio.js` uses existing Overworld and Resonance Tower recordings for navigation, preview, locked, Focus, Skill, and Ascension feedback. It contains no oscillator synthesis or generic arcade bloops and respects the existing audio-off preference.
- Prismel's first nodes now have live effects: Prism Focus raises his basic Attack accuracy by 4%; Guiding Light raises party basic Attack accuracy by 2% while Prismel is Leader; Resonance Sight reveals the shortest ring direction and step count in Tower Puzzle 1.
- CI now guards the sound-source files, skill-aware accuracy path, Tower hint, and Hybrid battle identity handoff. K27 Hybrid/cinematic authority is unchanged; MAIN device audition remains the user-facing sound and feel gate.

## LIVE31A Resonance growth interface (2026-09-27)

- The three approved progression mocks are now production assets rather than visual references: Resonance Ascension, the Prismodial Grimoire growth map, and the Spectrum Atlas. Their full PNG compositions remain the visible screen foundation while live values and controls layer over them.
- Whispering Grove's first clear now reaches the real `hybrid-level-up.html` handoff. Natural stat gains, one Focus Point per level, and one Skill Point on even levels persist through schema 2 of the existing `pv.progression.v1` save.
- `hybrid-growth.html` provides the Grimoire and Atlas views with hero switching, stat allocation, prerequisite-aware skill nodes, touch/keyboard/Xbox navigation, and explicit confirmation. The live Party Growth command opens the Atlas.
- Existing XP, encounter claims, inventory, clear history, save key, K27 Hybrid battle authority, and approved Victory composition remain intact. Pages and normal MAIN device validation remain the final user-facing gate.

Current promoted build: `main-20260909-live28k27` — **Hybrid production authority; iPhone evidence remains final runtime gate.**

## LIVE30K6 encounter-entry confirmation (2026-09-27)

- The Whispering Grove pre-battle curtain no longer auto-advances after a short flash. It remains visible until the player confirms `BEGIN ENCOUNTER`.
- Tap, Enter, and Space are supported; the confirmation button is focused when the card opens so a controller/browser action can confirm it.
- Local validation held the card for more than one second and then reached `hybrid-main.html?pvloc=whisper&pvencounter=first-clear` only after the button click. Pages/device validation remains separate.

## LIVE30K5 Overworld stage selection emphasis (2026-09-27)

- Added a final Overworld selection layer in `assets/js/pv-overworld-live30h.js`.
- Committed destination nodes use a larger prismatic beacon, double ring, glow pulse, and `SELECTED STAGE` label; controller/keyboard focus uses a distinct cyan `LOOKING AT` state.
- Destination Intel now receives a selected-stage readout, highlighted preview/card, and active travel treatment. No location, unlock, or route logic changed.
- Local validation passed at the default viewport and an 844×390 landscape viewport with Whispering Grove selection and no horizontal/vertical page overflow. Pages and device validation remain separate gates.

## LIVE30E6 stale-run cleanup (2026-09-26)\n\n- New Game now performs a cache-safe hard reset after the story entry loads, clearing the save snapshot, all `pv.locationClear.*` flags, Tower sync/arrival markers, progression, encounter, party, and run identity keys before seeding Home.\n- The Tower treats a direct Whispering Grove entry without a run marker as a legacy first visit, clears stale completion state, and opens the arrival cinematic plus Puzzle 1. Same-run re-entry still resumes calibration.\n\n## LIVE30E5 first-encounter Hushling layout (2026-09-26)

- The Whispering Grove route presently uses one Hushling, so LIVE29G now resolves its visual through `Live30E4HushlingView` at horizontal center.
- This is a live encounter-adapter change only: no Wraith movement, no base-scene change, and no pretend multi-enemy staggering before that system exists.

## LIVE30E4 party-board movement cue (2026-09-26)

- `assets/js/pv-overworld-live30g.js` plays the established Overworld move cue once per actual board-piece hop after the starting tile.
- The route token remains readable, the arrival treatment stays visual, and the cue respects the existing Overworld audio toggle.

## LIVE30E3 trailer refresh (2026-09-26)

- The MAIN-page **Trailer** entry continues to open `trailer.html`; it now streams `assets/video/Trail2.mp4` with a new cache version.
- Source provenance: user Dropbox `/Prismatic Veil/Trail2.mp4`; `56,759,102` bytes; SHA-256 `b01d30c49a6e20ae43035a4c82f3a33257ae911f0d1cd02289d17dcb6bdd7300`.
- The obsolete `assets/video/CineTrail.mp4` fallback has been removed. Trailer playback now uses only the exact Trail2 multipart reconstruction; a failed segment load stays visibly unavailable instead of silently serving an old cut.

## LIVE30E2 Whispering Grove progression repair (2026-09-26)

- The live bridge was writing `pv.locationClear.whisper`, but the progression reward table only recognized the retired `echo` key. Whispering Grove now has the authoritative first-clear/repeat reward entry; `echo` remains a compatibility alias.
- Local verification passed: first clear `+100 XP` each plus `Veil Shard` and `Memory Fragment`; repeat clear `+20 XP` each; both wins persist in `pv.progression.v1`.
- Validate on device through **RETURN TO MAP**, then confirm the Resonance Tower route is revealed. Returning to MAIN and selecting **NEW GAME** intentionally clears the run; **CONTINUE** restores it.

This is the fast operational failure-prevention ledger for PriZim production.

## LIVE30H canonical New Game flow (2026-09-25)

- Normal title flow is now player-facing only: **ENTER THE VEIL** when no save exists; **CONTINUE + NEW GAME** when a valid `pv.save.v1` exists.
- Direct **OVERWORLD** and **PZ-A** title shortcuts are retained for development only behind `?dev=1`; their routes were not deleted.
- Fresh-run initialization clears the prior run, location-clear flags, progression, pending encounter/result, resonance/resume state, and save snapshot, then seeds **Home** as current/last location and **Prismel** as the default selected Bearer. Missing progression resolves canonically to Level 1 / 0 XP.
- The Prologue is refreshed to the current Overworld canon and identifies **Whispering Grove** as the first active disturbance.
- Prologue exit is now **BEGIN JOURNEY → Overworld**. It no longer jumps directly into battle.
- `live-build.json` now exposes `overworld: "hybrid-overworld.html"` as a first-class route.
- K27 Hybrid battle/cinematic authority is unchanged. Battle begins only from an Overworld encounter.
- Pending final gate: iPhone lifecycle witness — NEW GAME → Prologue → Overworld/Home → Whispering Grove encounter → reward/autosave → MAIN → CONTINUE restore; then verify NEW GAME clears that run cleanly.

## LIVE30E save-state foundation

- `pv.save.v1` is the snapshot key for the current run. Main shows `CONTINUE` only when that snapshot exists.
- `NEW GAME` clears the run keys and all `pv.locationClear.*` flags, seeds the clean Home/Prismel start, then enters the refreshed Prologue; the Prologue exits to Overworld.
- Autosave remains owned by the Overworld shell, with an explicit Hybrid result-bridge snapshot after encounter resolution so leaving the victory screen for MAIN cannot restore a pre-battle snapshot.
- Verify the normal MAIN route on iPhone before treating this as a witnessed user-facing save flow.


## LIVE28K23 Aurora Pulse V2

- Promoted witness: `main-20260908-live28k23`.
- Exact Beauty V2 is production Aurora Pulse: 910×512, 30 FPS, 10.033333s, SHA-256 `57101593d7bee82ab444f3f556dd634ad71928975f43cf1a4eebadce020825ac`.
- Exact packet-copied native V2 SFX SHA-256: `9d3da298c2f5712e3a52446ecaca9b7eb3100e030d0d3acf04f6e041b1f727d0`.
- Battle BGM is fully silent during the cinematic. Celestial Bloom enters only as the final choir-tail bridge.
- Timing: choir 9.35s → battlefield reveal 9.50s → live enemy impact 9.72s → live ownership 9.90s → video hidden 10.02s → battle BGM restore.
- Aurora remains crownless; Aurorb Slice remains separate; K22 Kineza settle-before-Victory remains locked.
- Pending final gate: normal iPhone MAIN route.

## Current truths

- The user's normal validation path is the **iPhone web-app link into MAIN**. MAIN is the production/runtime authority.
- A green GitHub Pages deployment proves deployment only. It does **not** prove the live iPhone runtime is correct.
- Real-device screenshots/video/evidence outrank code inspection, CI success, and desktop assumptions.
- Current witness: `main-20260909-live28k27`.
- Any numeric `LIVE28K` witness stays on the high-quality `Live28K2PartyBattleScene.js` + `Live28K2PartyFormationView.js` lineage through future-proof routing. Router commit: `781e68f94118ff4ba4272b43899dc1b6dc0a26b1`.

## HYBRID STACK HARD GATE

- **ALL live battle/cinematic production work stays inside the Hybrid stack.**
- Canonical live chain: `index.html` / `story-scroll.html` -> `hybrid-main.html` -> `hybrid-battle-live.html` -> import-map rewrite -> numeric LIVE28K K adapters.
- Numeric LIVE28K battle authority: `src/prizim/Live28K2PartyBattleScene.js`.
- Numeric LIVE28K formation authority: `src/prizim/Live28K7PartyFormationView.js`.
- `src/PartyBattleScene.js` is a generic/base scene, **not** the production endpoint for new LIVE28K cinematic features.
- `pz-a-aurora-pulse-lab.html` is the approved Aurora Pulse composition/timing mock. It is reference authority, not a live entry page. Integrate its choreography through the Hybrid/K adapter stack while preserving Hybrid HUD/state publication, audio controller, camera ownership, targeting/damage, and return-to-battle semantics.
- Before any live cinematic write, read `PV_LIVE_AUTHORITY.json`, `PV_RESUME_ANCHOR.md`, `PRIZIM_LIVE_NOTEPAD.md`, `live-build.json`, `hybrid-main.html`, and `hybrid-battle-live.html`. If those are not checked, **do not write production code yet**.
- Run `python tools/prizim/preflight_live28k.py` before promotion. CI runs the same contract automatically.
- `.github/workflows/prizim-hybrid-stack-guard.yml` rejects Hybrid-route regressions.

## Battle authorities

- Prismel passive/off-turn: `assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png`, native **1106×1422 PNG**.
- Prismel active/on-turn: `assets/party_formation/PRISMEL_LIVE28K2_STAFF_READY.png`, native **1402×1122 PNG**.
- Auryi: `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native **1086×1448 PNG**.
- Kineza: `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Battle-critical art stays **direct PNG only**. No WebP wrappers.
- Native source dimensions remain preserved. Runtime display scaling is allowed; source-file downscaling is not.

## PZ / alpha status

- Prismel and Auryi full-resolution battle primaries were PZ-cleaned to transparent alpha at native dimensions in commit `4f56a74893edc6fadbb4d9a98e858a37d58264f8`.
- The original supplied Auryi source was opaque, but the MAIN primary path now contains the PZ-clean transparent 1086×1448 version. Do not replace it with the opaque source.
- HC-approved Prismel staff-ready ingest commit: `aa7b56d8771013e8fb572c676d978bc67ae7f98a`.
- Prismel staff-ready QA: **1402×1122 PNG**, alpha 0–255, 883,935 fully transparent pixels, 687,927 partial-alpha pixels.
- K5 iPhone witness still showed a small **white fringe/white-space remnant on Prismel's passive idle**. Treat this as a narrow PZ cleanup defect only. Do not regenerate or change the approved pose/identity.
- Do not reintroduce white mats, haloed cutouts, WebP, or source downscaling.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

## Prismel state semantics

- **Off-turn / passive:** right-facing staffless idle using the current full-resolution Prismel identity.
- **On-turn / active:** HC-approved staff-ready Prismel using the same identity, age, face, costume, proportions, short tight hair, and animated-master rendering.
- Old LIVE28J `assets/poses/prismel_active_turn/prismel_ready_6.png` is retired as active authority.
- Locked behavior:
  - off-turn -> right-facing staffless idle
  - Prismel turn begins -> HC staff-ready active
  - Prismel action/attack -> return to HC staff-ready while Prismel remains active
  - Prismel turn ends -> right-facing staffless idle
- State split wiring commit: `e27b031b063b9112dd2f965e44b63594f72ae2c1`.
- Active preload wiring commit: `69edc476e2f146a1474f9d6ecd9fc3caf1b4c127`.
- K3/K5 real-device witnesses passed the Prismel active-authority behavior.

## K5 real-device witness

The real iPhone witness from `main-20260905-live28k5` showed the core battle stack is now largely stable.

**Passed / good:**
- All three hero attacks read well on-device.
- Correct HC staff-ready Prismel remains authoritative on his turn.
- Auryi direct-primary presentation is substantially improved and no longer needs an immediate HC body-art pass.
- Kineza remains intact and on the correct HC identity.
- Portrait framing is improved enough to continue production.

**Remaining defects:**
- Small white-space/fringe remnant on Prismel passive idle.
- Auryi crown manifestation is visually wrong and off-center because the production entry path still used procedural Phaser/canvas crown drawing rather than the approved animated crown art.

## HUD portraits

- Paths remain stable:
  - `assets/ui/portrait_prismel.png`
  - `assets/ui/portrait_auryi.png`
  - `assets/ui/portrait_kineza.png`
- They are transparent animated-master derivatives, not legacy photos.
- Portrait focal commit: `20c91a2b3af85ac56bb3e1661f88aa1ea6620d00`.
- Prismel gets strongest focal zoom, Auryi moderate, Kineza light.
- Portrait framing is UI-only and never authorizes reducing battle-master source files.

## Turn rings / formation

- Original body-footprint ring correction: `5a09151d46b12316b92e11b2552db1c547337619`.
- Ring hardening commit: `b8233caf4aa90514fe85a42c1a3537c5d1c93c01`.
- Selected hero ring is explicitly resynchronized after turn swaps/layout/state restoration.
- Rings remain anchored to measured feet/body footprint after final scale/origin fitting.
- Height order remains **Auryi tallest -> Prismel middle -> Kineza shortest**.
- Body calibration: Auryi 1.000 / Prismel ≈0.775 / Kineza ≈0.647.

## Auryi K5 direct-primary correction

- Current authority remains `assets/party_formation/AURYI_LIVE28K2_PRIMARY.png`, native **1086×1448 transparent PNG**.
- K5 retired the old runtime crown/orb pixel-strip pass and now uses the already PZ-clean MAIN primary directly.
- Direct-primary correction commit: `bd83ebd4e9745784a3aa75b3e344b23d83c6002a`.
- Duplicate persistent crown/Auorb objects remain suppressed.
- Auryi remains tallest and returns to the direct PZ-clean primary after attacks.

## Auryi K6 crown authority

- **Do not convert the proven Auryi basic attack or Auorb attack to PNG by default.** They remain on the proven Phaser/canvas path.
- The production defect was specifically the **crown manifestation**.
- Approved animated crown source already exists in MAIN: `assets/fx/auryi/v3/01_crown_manifest_sheet.png`, 8 frames at 256×256 per frame.
- K6 uses a **hybrid entry path**:
  - crown = approved animated PNG crown sheet
  - entry Auorb = proven Phaser/canvas choreography
  - normal/basic attack + Auorb attack = proven Phaser/canvas path, unchanged
  - full-PNG attack stack remains opt-in QA only via `?auryiFx=png`
- K6 removes the old LIVE25 `+9% body-width` crown shift and centers the crown over Auryi's actor/head line.
- Crown hybrid commit: `338dbd8a441bac25d4d349a215cb38b42993f974`.
- K6 promotion commit: `9dc1e1792b4a44aa28a207071bfb7fe22b48bd6b`.
- K6 binds the fresh hybrid crown driver directly at the K formation boundary so Safari cannot reuse the old nested `live26g` driver URL. K-adapter driver binding commit: `2cf6ddd54872c70df835c2e2e4b6959b49c4cd6b`.
- K6 battle scene cache-busts the K formation import with `?v=live28k6-crown`. Cache-guard commit: `ecb83dae62b19919e0d1759383e0e9facf7264ec`.

## Auryi Resonart / Aurora Pulse current lane

- Basic Attack authority remains **Aurorb Slice**.
- Resonart authority is **Aurora Pulse**.
- Aurora Pulse live production belongs in the Hybrid/K adapter stack, not standalone `PartyBattleScene.js`.
- Approved composition/timing reference: `pz-a-aurora-pulse-lab.html`.
- **Primary live presentation:** exact `Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4` inside the Hybrid/K adapter. Verified 1920×1080 H.264, 24 FPS, 7.375s, SHA-256 `e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a`.
- **K20 cinematic presentation:** no move-title card. Hybrid directs the exact Beauty V1 master with live-camera commitment, expansion/compression framing, Pulse-driven reconnect, Auryi re-entry wave, live enemy reaction, and residual Aurora afterglow.
- The K19 title-card PNG is retained as an archived/reference asset only and is not loaded by Aurora Pulse runtime.
- Live sync is derived from `PV_LIVE_AUTHORITY.json`: Bloom 0.70s -> silence 4.56s -> Pulse/damage logic 5.18s -> battlefield reveal 9.50s -> live enemy impact 9.72s -> reconnect 9.90s -> Beauty hidden 6.65s.
- The real Hybrid battlefield owns the final handoff and enemy reaction; the Beauty master's baked demo reconnect tail is never displayed.
- The Phaser Aurora mock is fail-safe presentation only if native video playback fails. The old Aurorb Slice pose sequence is never an Aurora Pulse fallback.
- Celestial Bloom owns the cinematic foreground mix; normal battle BGM clears underneath it.
- Triumph of Light loops while the victory/results screen remains open.
- Aurora Pulse itself remains **crownless**.
- LIVE28K18 core presentation is recorded as passed: boot clean = True; Bloom audible = True; battlefield/enemy handoff accepted = True.
- Latest phone evidence (main-20260908-live28k23): PASS iPhone MAIN gate: Aurora Pulse Beauty V2 cinematic played in the live Hybrid route with native V2 SFX, battle BGM silence during the video, Celestial Bloom choir-tail bridge into the battlefield reconnect, and live battle ownership restored cleanly.
- Current pending gate: LIVE28K27: verify Prismel glass-shatter beat, reflective mirror blades crossing into the live battlefield, visible shard landings around the Wraith, damage synchronized to blade impact, clean return, and unchanged Aurora Pulse + Thunder Tornado.
- Future non-Aurora crown authority: match the Main Splash Screen crown as a **hovered/offset element above Auryi**, not head-worn.

## Kineza

- Locked standby authority remains `assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png`.
- Kineza remains shortest at the locked body ratio.
- Generic Kineza state sheets must not overwrite the HC idle.
- K22 lethal-victory gate: Blitzer must finish, Kineza must restore to exact HC formation home, and a 240ms visible settle beat must complete before Victory can be scheduled.

## Platform Constraints / Do-Not-Repeat Rules

- **MAIN FIRST:** production fixes/tests/approval target the actual MAIN route reached by the user's iPhone.
- **CHECK NOTES BEFORE CHANGE / WRITE NOTES AFTER CHANGE.**
- **NO IMAGE GENERATION DURING RUNTIME FIXES unless the user explicitly requests generation.**
- **IDENTITY BEFORE RESOLUTION:** never substitute a different-looking hero merely to improve clarity.
- **NO WebP** for battle-critical attack/state/idle art on the iPhone production path.
- **KEEP NATIVE SOURCE RESOLUTION** for approved battle masters.
- **DO NOT RE-PROCESS AN ALREADY PZ-CLEAN MASTER AT RUNTIME.**
- **HUD PORTRAITS FOLLOW CURRENT ANIMATED MASTERS.**
- **TURN RINGS FOLLOW BODY FOOTPRINTS** after final origin/scale fitting.
- **ACTIVE RING VISIBILITY FOLLOWS TURN STATE** explicitly.
- **BUILD WITNESS MUST MAP TO ADAPTER LINEAGE.** Numeric LIVE28K promotions stay on the K production adapter lineage automatically.
- **NESTED SAFARI MODULES NEED EXPLICIT K-LINE CACHE BUSTS WHEN CHANGED.** A new top-level witness alone does not prove a deep fixed-query module URL was refreshed.
- **PRISMEL STATE SPLIT IS LOCKED:** off-turn right-facing staffless idle; on-turn HC staff-ready.
- **AURYI CROWN IS ASSET-DRIVEN:** do not revert to a procedural ellipse/crown drawing as production authority when approved animated crown art exists.
- **AURYI ATTACK FX STAY PHASER BY DEFAULT:** crown correction must not silently replace proven basic/Auorb attack choreography with the full PNG QA path.
- Scale bodies, not transparent canvases, FX, staff reach, hair reach, robe/cape tails, or stance width.
- Never scale heads independently. Whole-character uniform scale only.
- CI/deployment success is not runtime QA. Do not approve until the exact iPhone MAIN route passes.
- No baked enemies in attack/FX sheets. No baked camera movement in attack/FX sheets.
- Persistent-state FX and cinematic/attack FX remain separate layers.
- Full anatomy/part-count QA remains mandatory.

## Immediate MAIN LIVE28K6 QA lane

1. Confirm witness reads `main-20260905-live28k6` on the normal iPhone MAIN path.
2. Trigger Auryi's turn entry and confirm the crown uses the approved animated crown art, not procedural Phaser ellipses.
3. Confirm the crown is centered over Auryi's head/body line with a clean air gap and no face overlap.
4. Confirm Auryi's entry Auorb still uses the proven Phaser/canvas presentation.
5. Trigger Auryi basic/Auorb attack and confirm attack visuals remain unchanged from the K5 pass.
6. Confirm Auryi returns to the direct PZ-clean primary at exact home position after attack.
7. Confirm Prismel passive still uses the right-facing idle; note any remaining white fringe for the next narrow PZ cleanup.
8. Confirm Prismel active staff-ready state still switches correctly.
9. Confirm Kineza remains on locked HC idle and active ring behavior remains correct.
10. Once crown QA passes, resume **Aurora Pulse Resonart video production**.

## Proven patterns

- Direct repo-served PNG is the safe battle-art default for the iPhone path.
- Runtime/mobile evidence outranks static assumptions.
- Identity authority outranks resolution convenience.
- Approved alpha-clean masters should be consumed directly instead of repeatedly color-keyed or pixel-stripped at runtime.
- Hybrid FX can be the right production choice: asset-driven crown + proven Phaser Auorb/attack preserves visual authority without destabilizing passed choreography.
- HUD focal framing can be corrected independently from portrait identity.
- Active-turn markers must be resynchronized to turn state after layout/state restores.
- Future cache-busted LIVE28K witnesses remain on the intended adapter lineage through a generic numeric matcher.
- Prefer narrow adapters over broad rewrites and preserve passed runtime work.


## LIVE28K24 Kineza Thunder Tornado

- Current promoted witness: `main-20260908-live28k24`.
- Accepted baseline: LIVE28K23 Auryi Aurora Pulse V2 iPhone MAIN pass.
- Kineza Resonart: **Thunder Tornado**.
- Exact master: `assets/characters/kineza/animations/thunder_tornado/cinematic/Kineza_ThunderTornado_Resonart_MASTER.mp4` · SHA-256 `77e8fe6e9fcf430d013f0189355b0f725e150c850b240fd5b53060a4f94f9b93` · 6,312,497 bytes · 910×512 · ~30 FPS · 10.006667s.
- Generated clip has SFX only, no generated music/vocals, and no enemy.
- Hybrid handoff: reveal 9.18s → live tornado pass 9.40s → real enemy impact 9.66s → movie hidden 9.92s → live tornado exits → Kineza returns home.
- Lethal finish preserves the K22 240ms readable home settle before Victory.
- iPhone MAIN remains the final gate.


## LIVE28K25 Thunder Tornado handoff harmonization

- Current promoted witness: `main-20260908-live28k25`.
- Scope is visual handoff only. Thunder Tornado cinematic master/timing/damage authority remain unchanged.
- Live continuation style: `structured-spiral-v2`.
- Narrow luminous core + separated emerald/white spiral bands + reduced opaque green wash + faster forward enemy pass.
- Preserve K22 240ms lethal Kineza home settle and LIVE28K23 Aurora V2.
- iPhone MAIN remains the final gate.


## LIVE28K26 Prismel Refracted-Reflections

- Current promoted witness: `main-20260909-live28k26`.
- Prismel Resonart: **Refracted-Reflections**.
- Exact cinematic authority: `assets/characters/prismel/animations/refracted_reflections/cinematic/Prismel_RefractedReflections_Resonart_MASTER.mp4` · 6,270,745 bytes · SHA-256 `9d36b9ad4ad67c44ea7f12a1356ffb1e855511ac6496e840f0fe4f6398367fd8`.
- Hybrid/K takeover: 9.35s staff-to-lens contact.
- Presentation: 95ms contact hold -> 190ms radial crack -> 65ms fractured hold -> 520ms 16-piece captured-frame shatter.
- Real Hybrid battlefield is underneath; live enemy damage/recoil resolves at 34% shatter progress.
- Audio: embedded cinematic SFX only, no music/language; battle BGM fully silent until reconnect.
- Preserve Aurora Pulse V2 and Thunder Tornado unchanged.
- iPhone MAIN remains the final runtime/presentation gate.

## LIVE30E1 progression and lexicon

- The stable `main-20260909-live28k27` witness now also carries the shared `src/PVCanon.js` manifest and normalizes Auryi to **Aura Spoken**.
- All three Bearer Resonarts are locked until Level 2. The first Whispering Grove clear pays 100 XP to Prismel, Auryi, and Kineza, so the reward screen demonstrates the unlock.
- The Hybrid drawer shows the sealed state before Level 2; the live wrapper and encounter adapter both reject an early confirm.
- No battle cinematic authority or approved battle-critical art changed in this pass.
- Fresh iPhone MAIN verification is still pending.

## LIVE28K27 Prismel reflected-blades presentation polish

- Current promoted witness: `main-20260909-live28k27`.
- Preserve the accepted K26 exact cinematic and captured-frame fracture.
- New K27 shatter beat: procedural glass/crystal shatter fires exactly as the fractured mirror begins separating.
- New live continuation: reflective cyan/violet/gold/white mirror blades cross into the real Hybrid battlefield, converge on the Wraith, visibly strike/land around it, and remain readable on the ground before fading.
- Logical damage now resolves on the live blade impact instead of the first battlefield-reveal frame.
- Preserve battle-BGM silence through the cinematic/shatter and preserve Aurora Pulse V2 + Thunder Tornado.
- iPhone MAIN remains the final runtime/presentation gate.
## LIVE30K1 Resonance Tower first-arrival repair (2026-09-26)

- A New Game now stamps a run identity. The first Resonance Tower visit for that identity clears stale Tower sync, tower-clear, and arrival-seen values before rendering. It therefore plays the muted Tower arrival video and then opens Puzzle 1, the Echo Ring Console.
- A normal return to a partially completed Tower in the same run still resumes that exact calibration step. The old text-and-slider screen remains Puzzle 2 only; it cannot become a new-run first puzzle.
- Save and route cache tags were advanced so the main menu, prologue, Overworld, and Tower route load the matching reset logic.
## LIVE30K2 Trail2 exact multipart delivery (2026-09-26)

- GitHub's browser uploader rejects the 54 MB source file. Trail2 is therefore delivered as fourteen sub-5 MB exact byte segments and rebuilt as one local MP4 Blob before trailer playback.
- The complete reassembled bytes hash to `b01d30c49a6e20ae43035a4c82f3a33257ae911f0d1cd02289d17dcb6bdd7300`; no visual or audio re-encode was used. CineTrail remains a deployment-only fallback if a segment is temporarily unavailable.


## 2026-09-27 — Victory screen pass
- `hybrid-battle-live.html` now replaces the compact placeholder result card with the approved Overworld Victory presentation: party XP cards, real reward items, level-up continuation, and the Resonance Tower first-clear destination unlock.
- Party mock remains reference for the existing Party screen; this pass is limited to the post-battle result layer.
- Pages/deployment evidence is separate from user device validation; verify the MAIN route on iPhone/iPad and Xbox Edge before promoting the witness.


## 2026-09-27 — Victory result live wiring pass
- Approved Victory visual retained as the reference; live UI pieces remain data-driven from `PVProgression` and `Live29FEncounterBattleScene` payout snapshots.
- Added dynamic resonance status strip alongside XP, reward cards, progress bars, level-up handoff, and the first-clear Resonance Tower unlock.
- Production commit: `b912f2fe082feb9000642a144201c19010cc09c9`; validate on iPhone/iPad/Xbox Edge after Pages promotion.

## LIVE30K3 Approved Victory render runtime (2026-09-27)

- The approved Victory render is the actual `hybrid-battle-live.html` result screen; it is no longer only a presentation reference.
- Live payout overlays remain authoritative from `PVProgression` and `Live29FEncounterBattleScene`, while the image supplies the full visual composition and party art.
- The result surface is fixed to the viewport with no page scroll; Continue, Party, Journal, and Menu hit targets remain interactive.
- Pages deployment is not device evidence; normal MAIN iPhone, iPad, and Xbox Edge validation remains pending.

## LIVE30K4 Victory geometry and solo Hushling spacing (2026-09-27)

- Corrected the Victory render presentation by fitting the approved 16:9 composite to the available viewport and anchoring live overlays to the render's actual XP, resonance, rewards, and bearer-card panels.
- The Hushling is still the centered single enemy; the party shifts left only for the Hushling encounter so the enemy no longer sits under Auryi/Kineza. No multi-enemy stagger was introduced.
- This is a presentation/layout pass. Progression payout authority and battle cinematic lanes remain unchanged.
- Device validation remains pending on MAIN iPhone, iPad, and Xbox Edge.

## LIVE30K7 Victory bearer XP display correction (2026-09-27)

- Corrected the result-layer bearer cards in `hybrid-battle-live.html`: the card container now spans the full fitted 16:9 render, and each card has a source-matched width/offset. This removes the clipped XP lines that were falling into the footer and prevents the Auryi card from crossing into Rewards.
- Cards are opaque over the approved render's static placeholder text, so live level/role/XP values appear once and remain readable.
- Added a progression-ledger fallback for legacy result records with no payout object. Completed encounter results now use the canonical encounter XP table and current hero ledger rather than rendering placeholder `0` values.
- No battle adapter, enemy, cinematic, reward balance, or route semantics changed. Pages/device validation remains pending on MAIN iPhone, iPad, and Xbox Edge.

## LIVE30K8 Hushling center and Overworld masthead cleanup (2026-09-27)

- Presentation-only patch on the existing `main-20260909-live28k27` witness. `Live30E4HushlingView` keeps the first single Hushling centered and raises it on landscape screens so the full art clears the party cards; no multi-enemy stagger or encounter logic changed.
- `pv-overworld-live30b.js` no longer creates the repeated top-left `PRISMATIC VEIL` title. The map, Current Location panel, Destination Intel, selected-stage beacon, and travel routes remain live.
- Hybrid battle/Overworld cache-busts were advanced for the nested module and layer updates. Local smoke checks passed; Pages and real-device MAIN validation remain required before calling the presentation gate complete.
