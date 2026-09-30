# The Prismatic Veil — Resume Anchor

## LIVE31K Party stat readout guard (2026-09-30)

- Party progression rendering no longer observes its own child-list writes, and the legacy decorator yields once LIVE31A mounts. This prevents the live Level/HP/RP/Core Stats readout from entering a render loop.
- The normal route remains `hybrid-party-live.html` → Growth → `hybrid-growth.html?view=book`; the Party cache tags are `live31a3` / `live31j3`. The progression renderer guards its own class writes so its class observer cannot self-trigger forever.

## LIVE31J compact shared Resonance Path (2026-09-30)

- Progression now presents one understandable loop: each level gives the selected Bearer a Focus Point for the six core stats, while the trio shares a single party-wide Resonance Path.
- The live path has three connected nodes: Resonance Link (+2% party basic Attack accuracy), Shared Lens (another +2%), and Resonance Sight (the Tower shows the shortest ring direction and remaining steps).
- The old Spectrum Atlas is archived/reference-only and no longer appears in the Party Growth route. `hybrid-growth.html` keeps the approved Prismodial Grimoire composition, hero tabs for Focus allocation, touch/keyboard/Xbox confirmation, and one shared Resonance Point counter.
- Existing per-Bearer skill points/nodes remain in `pv.progression.v1` for compatibility. A schema-3 save without `partyPath` infers at most one shared point per existing party level, so old saves are not erased or over-rewarded.
- `src/PartyBattleConfig.js` and the Tower route consume the shared path effects. The cumulative XP curve, battle authority, approved art, and audio lanes remain unchanged.

## LIVE31F Resonance Relay lore and audio (2026-09-28)

- The apparent Old Water Tower is now explicitly an ancient Resonance Relay. Its locks exist to stop Veil static, damaged memories, and a single controlling voice from being amplified into the wider world.
- The three playable locks have canonical purposes: Puzzle 1 authenticates the Grove memory's identity, Puzzle 2 preserves its integrity while amplifying it, and Puzzle 3 forms a consensus key through Prismel, Auryi, and Kineza.
- The arrival cinematic uses `Prism of Elders` as its low intro bed when browser audio is available, then crossfades into `veil_clockwork_drift` for the Tower interior. A visible audio control handles iPhone/Xbox autoplay restrictions and respects `pv.musicEnabled`.
- Existing PV Tower recordings now map directly to ring movement/alignment, harmonic search/lock, route links/errors, and final Relay resolution. All three puzzles retain touch/keyboard controls and now expose explicit Xbox/gamepad paths.
- Progression payouts, Continue snapshots, K27 battle authority, and the LIVE31D TV/Hushling fixes are unchanged.

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


## LIVE30K6 encounter-entry confirmation (2026-09-27)

- The Whispering Grove pre-battle card now stays open as a real confirmation beat instead of navigating away after 520ms.
- The card lists the Veil Wraith and Hushling, exposes a focused `BEGIN ENCOUNTER` button, and accepts tap, Enter, or Space. Navigation begins only after confirmation.
- The underlying `hybrid-main.html?pvloc=whisper&pvencounter=...` route and battle authority are unchanged.

## LIVE30K5 Overworld stage selection emphasis (2026-09-27)

- The active Overworld destination now has a high-contrast gold/cyan beacon, an explicit `SELECTED STAGE` map label, a highlighted preview, and a matching Destination Intel readout.
- Keyboard/controller navigation adds a separate cyan `LOOKING AT` focus treatment so the player can see what will be selected before confirming it.
- Selection semantics and travel routes are unchanged; this is a presentation/accessibility pass in `assets/js/pv-overworld-live30h.js`.

## LIVE30E6 stale-run cleanup (2026-09-26)\n\n- New Game now hard-clears the save snapshot, every `pv.locationClear.*` flag, Tower sync/arrival markers, progression, encounter, party, and run identity keys after the story entry loads, covering cached legacy save scripts.\n- A Tower entry from Whispering Grove without a run marker is treated as a legacy first arrival and clears old completion state before showing the cinematic and Puzzle 1.\n\n## LIVE30E5 first-encounter Hushling layout (2026-09-26)

- Whispering Grove currently fields one Hushling. Its live encounter adapter now anchors that single enemy at the screen center across landscape and portrait layouts.
- The Wraith and generic battle layouts are untouched. Multi-enemy stagger remains deliberately unimplemented until a real enemy-formation controller exists.

## LIVE30E4 party-board movement cue (2026-09-26)

- The Overworld board piece now plays one quiet step cue for every route hop after its starting position.
- The cue uses the established Overworld move sound and respects the existing music/audio toggle. Arrival remains visual so repeated travel does not become noisy.

## LIVE30E3 trailer refresh (2026-09-26)

- `trailer.html` now plays the user-supplied **Trail2** cut from `assets/video/Trail2.mp4` (`56,759,102` bytes; SHA-256 `b01d30c49a6e20ae43035a4c82f3a33257ae911f0d1cd02289d17dcb6bdd7300`).
- The MAIN-page **Trailer** entry remains unchanged and opens `trailer.html`; only the video source changed.
- The obsolete `assets/video/CineTrail.mp4` fallback has been removed; Trailer now has one authoritative Trail2 multipart path and reports an unavailable state instead of loading an old cut.

## LIVE30E2 Whispering Grove progression repair (2026-09-26)

- The first overworld encounter is **Whispering Grove**. Its clear flag already persists as `pv.locationClear.whisper`; the missing piece was the reward table key.
- `src/progression/PVProgression.js` now owns a `whisper` first-clear/repeat reward table. The legacy `echo` key remains as a back-compat alias for older direct links.
- Verified with an isolated storage test: first clear grants 100 XP each plus Veil Shard and Memory Fragment; repeat clear grants 20 XP each; the ledger persists both wins.
- Final device gate remains: complete Whispering Grove on the normal MAIN route, use **RETURN TO MAP**, confirm Resonance Tower unlocks, then reload MAIN and use **CONTINUE** rather than **NEW GAME**.

## LIVE30H canonical New Game flow (2026-09-25)

- Normal title flow is now player-facing only: **ENTER THE VEIL** when no save exists; **CONTINUE + NEW GAME** when a valid `pv.save.v1` exists.
- Direct **OVERWORLD** and **PZ-A** title shortcuts are retained for development only behind `?dev=1`; their routes were not deleted.
- Fresh-run initialization clears the prior run, location-clear flags, progression, pending encounter/result, resonance/resume state, and save snapshot, then seeds **Home** as current/last location and **Prismel** as the default selected Bearer. Missing progression resolves canonically to Level 1 / 0 XP.
- The Prologue is refreshed to the current Overworld canon and identifies **Whispering Grove** as the first active disturbance.
- Prologue exit is now **BEGIN JOURNEY → Overworld**. It no longer jumps directly into battle.
- `live-build.json` now exposes `overworld: "hybrid-overworld.html"` as a first-class route.
- K27 Hybrid battle/cinematic authority is unchanged. Battle begins only from an Overworld encounter.
- Pending final gate: iPhone lifecycle witness — NEW GAME → Prologue → Overworld/Home → Whispering Grove encounter → reward/autosave → MAIN → CONTINUE restore; then verify NEW GAME clears that run cleanly.

## LIVE30E save-state foundation (2026-09-25)

- Main exposes `CONTINUE` when the `pv.save.v1` snapshot exists; fresh players see `ENTER THE VEIL`, while saved players get `NEW GAME`. Fresh-run initialization clears the old ledger and seeds Home/Prismel before the Prologue.
- `assets/js/pv-save-state.js` snapshots the current map, progression, encounter, party, resonance, resume-audio, and dynamic location-clear keys at the Overworld boundary.
- Autosave runs on Overworld entry, route/menu interaction, visibility loss, pagehide, and a low-frequency interval. Encounter completion now snapshots `pv.save.v1` from the Hybrid result bridge too, before the player chooses Return to Map or MAIN.
- Remote iPhone validation remains pending for the new menu and New Game/Continue behavior.

## Current production witness

- Promoted witness: `main-20260909-live28k27`
- Witness promotion commit: `b2ec9cb67310c9070b99478ba58959efb6ddea09`
- Exact production audio install commit: `ac00a834471317edd98a60a7884a1896270be61f`
- Production battle adapter: `src/prizim/Live28K2PartyBattleScene.js`
- Dormant exact Aurora 01–08 runtime lane commit: `e60fd6b89c410edbd7c364acf496cf6c516f254a`
- LIVE28K12 Auryi Resonart presentation + victory-loop correction commit: `bb272c54295ced703d3e1e88c3f4c8f05953cc39`
- Aurora Pulse resolver commit: `82b7a25607cb0cd310b6ad1ee4472c4ca0ce5c58`
- Celestial Bloom synchronization commit: `fa623d615aecfb18d6038ed1b2896f58a78b1685`
- Aurora/Triumph audio-controller hooks commit: `bfa15a31f2bf84cd81d63ce5fbafc68acb17aa90`
- Exact M4A preload wiring commit: `94a7c9d4c560c68da1ca1e5b7c4bd191ec9fec6d`
- Resonart damage authority commit: `d77c43455d6a0dfbbcdcbe6db4a710d4453b9222`
- Resonart drawer authority commit: `e9f6c54ede06aea60cfca37d4883b00657ad1109`
- Resonart result/banner authority commit: `34c5e56789d0b950e15aed4fb0c618316571a839`


## LIVE28K23 Aurora Pulse V2 current lane

- Current witness: `main-20260908-live28k23`.
- Beauty V2 exact master is production Aurora Pulse.
- Battle BGM is silent during Beauty V2; V2 SFX uses native M4A; Celestial Bloom supplies only the choir-tail bridge.
- Reconnect timing: choir 9.35s, battlefield reveal 9.50s, live enemy impact 9.72s, live ownership 9.90s, video hidden 10.02s, then battle BGM restore.
- Final validation is the normal iPhone MAIN route. Preserve K22 Kineza settle-before-Victory behavior and stable Prismel/Auryi Basic/Kineza lanes.

## Auryi command authority

- Basic Attack: **Aurorb Slice**. Do not alter while working on Resonart.
- Resonart: **Aurora Pulse**.
- Aurora Pulse damage authority: `hero.resonart.damage = 22`.
- Resonart hit chance: 92%.
- The live K-line intercepts only `hero.id === 'auryi' && command === 'Resonart'`; all other actions delegate to the stable resolver.

## Aurora Pulse cinematic authority

Crownless Resonart. No crown art, halo art, procedural crown/ellipse FX, or older crown-entry FX inside Aurora Pulse.

Approved beat order:

1. 01–02: battlefield invocation / lift
2. 03–05: Aurora growth and celestial expansion
3. 06: maximum charge
4. 07: compression / hand-smash
5. brief **170ms silence pocket**
6. 08: outward Pulse
7. enemy impact / aftermath
8. smooth return to normal battle framing and Auryi idle

Current live resolver timing:

- lift 360ms
- bloom A 520ms
- bloom B 520ms
- max charge 420ms
- compression 260ms
- silence 170ms
- release 240ms
- aftermath 300ms
- recover 320ms

LIVE28K12 no longer borrows Auryi's old Basic Attack action poses for Aurora Pulse. Until the approved 01–08 PNGs return, the fallback keeps her approved primary visible and uses only Aurora-specific lift / camera / compression movement.

A dormant exact numbered-frame lane now exists in `Live28K2PartyBattleScene.js`:

- expected production paths: `assets/characters/auryi/animations/aurora_pulse/frames/Auryi_Aurora_Pulse_01.png` through `_08.png`
- direct PNG only, no WebP
- `AURORA_PULSE_FRAMES_READY = false` until the exact transparent production bytes are physically installed
- while false, the scene does not request missing frame URLs and LIVE28K12 uses the approved-primary Aurora fallback without old Basic Attack pose swaps
- once the real set exists, the frame lane switches Auryi's existing formation sprite through 01–08, fits by visible-body bounds, hides the active ring during the cinematic, then restores the approved Auryi primary and battle layout
- frame choreography is already aligned to the current audio/camera rhythm: 01→02 lift, 03→04→05 growth, 06 charge, 07 compression + frozen silence, 08 Pulse

## Future Auryi crown authority

This does **not** change crownless Aurora Pulse. When Auryi's crown is brought back in a future non-Aurora presentation pass, use the **Main Splash Screen crown** as the visual authority. It should remain **hovered / offset above Auryi rather than worn directly on her head**, matching the splash screen's crown silhouette, scale, spacing, and relationship to her head as closely as the runtime composition allows. Do not revert to the older wide/orbiting crown treatment unless the user later revises this direction.

## Approved frame/source history

- The Aurora Pulse frame material was already supplied previously.
- A prior extraction package existed as `AURYI_AURORA_PULSE_PZ_04_08.zip`.
- Its five extracted frames were approved as 900×900 transparent RGBA PNGs.
- Current-chat composite/JPEG references are visual authority only and must **not** replace the already-approved transparent production PNG bytes.
- Battle-critical art remains PNG only. **No WebP. No source-resolution downscaling.**

### Recovery pass completed 2026-09-06

File Library search for the exact Aurora package / numbered Aurora frames returned no usable file.

Dropbox exact-name/title searches for `AURYI_AURORA_PULSE_PZ_04_08` and `Aurora Pulse` returned no result.

Three older Auryi Dropbox archives remain:

- `/Auryi_DuoHybrid_Complete_Handoff.zip`
- `/Auryi_Auorb_Attack_PZ_Final_Package.zip`
- `/AURYI_FX_RUNTIME_PNGS_ONLY.zip`

A GitHub Actions archive inspector was added and used rather than guessing from ZIP names.

`/Auryi_DuoHybrid_Complete_Handoff.zip` scan:

- 72 files
- contains the older **18-frame Auorb Attack** production chain, including raw / clean / 768×768 runtime frames
- this is not the later 900×900 Aurora Pulse 01–08 sequence
- do not repurpose it as Aurora Pulse art

`/AURYI_FX_RUNTIME_PNGS_ONLY.zip` scan:

- exactly five files:
  - `01_crown_manifest_sheet.png`
  - `02_auorb_charge_sheet.png`
  - `03_auorb_projectile_sheet.png`
  - `04_auorb_impact_sheet.png`
  - `05_recompose_settle_sheet.png`
- no Aurora / Pulse / Resonart frame assets
- do not mix this crown/Auorb FX package into crownless Aurora Pulse

The scan report is stored at `AURYI_HANDOFF_SCAN.md`. The inspector workflow is `.github/workflows/inspect-auryi-handoff.yml`.

Conclusion: the exact old 900×900 Aurora Pulse production bytes have not been recovered from File Library, Dropbox, or current MAIN. Do not restart those same searches unless a new source appears.

## Audio authority — INSTALLED

Production files exist in MAIN:

- `assets/music/Celestial Bloom.m4a`
  - duration ~5.48s
  - exact byte size 113,740
  - SHA-256 `0e8762907bf36650cbdebab8f6497079350054f9819c81e6cb1ba4f3b14cff3d`
- `assets/music/Triumph of Light.m4a`
  - duration 10.00s
  - exact byte size 186,602
  - SHA-256 `98c77e8bc536425b8da8ad4212ed26011335c5ac3b9dadbce0ec28c201cca437`

GitHub Actions installed them in commit `ac00a834471317edd98a60a7884a1896270be61f` only after both SHA-256 checks and exact byte-count checks passed.

Runtime keys:

- `pv_auryi_celestial_bloom` -> `assets/music/Celestial Bloom.m4a`
- `pv_triumph_of_light` -> `assets/music/Triumph of Light.m4a`

Audio behavior:

- Celestial Bloom begins at invocation/lift.
- Generic Auryi gather/release cues are suppressed while Bloom owns the cinematic bed.
- Bloom pauses during the 170ms silence pocket after compression.
- Bloom resumes into Pulse and fades beneath aftermath/recompose.
- Physical Auryi impact + enemy hit cues remain at Pulse contact.
- Victory calls Triumph of Light after battle BGM fades/stops; LIVE28K12 loops Triumph while the victory/results screen remains open.
- The old short victory cue is fallback only when Triumph is absent.

Dropbox bridge copies also exist at `/Celestial Bloom.m4a` and `/Triumph of Light.m4a`. They were used only to transport the exact originals into GitHub.

## Real-device evidence through LIVE28K11

User iPhone test confirmed:

- **Celestial Bloom played during Aurora Pulse and sounded good.** Do not redesign or replace the Bloom audio lane.
- **Triumph of Light played on victory.** LIVE28K12 changes it to loop while the results screen remains open.
- Aurora Pulse was executing its dedicated Resonart/audio path, but the visible Hybrid drawer still said **Aurorb Slice** and the no-frame visual fallback reused old Auryi Basic Attack poses.
- LIVE28K12 corrects those two presentation defects: Hybrid Resonart UI now reads `hero.resonart`, and the Aurora fallback no longer calls Auryi's old step/gather/release/recover pose sequence.

Pages build + deployment for LIVE28K12 completed successfully. Real-device LIVE28K12 verification is the next gate.

## Safari / MAIN routing

`hybrid-main.html` rewrites the fixed nested module URLs to the current `live-build.json` build ID through an import map. Therefore the LIVE28K12 witness cache-busts:

- K battle adapter
- `PartyBattleConfig.js`
- `PartyBattleAudioController.js`
- `PartyBattleAudioConfig.js`

Do not add redundant base-file query-string surgery unless this routing actually fails on-device.

## Hybrid production safeguard

- Live battle/cinematic production must remain inside `hybrid-main.html` -> `hybrid-battle-live.html` -> numeric LIVE28K K adapters.
- Read `PV_LIVE_AUTHORITY.json` first. Run `python tools/prizim/preflight_live28k.py` before promotion.
- `pz-a-aurora-pulse-lab.html` is choreography/composition authority only; integrate it through the Hybrid stack rather than promoting it or rebuilding it in a disconnected standalone scene.

## Aurora Pulse live device gate

- Current witness: `main-20260909-live28k27`.
- K18 baseline: core Beauty presentation, native Celestial Bloom, and live battlefield/enemy handoff passed on iPhone.
- K19 phone review: full-screen title presentation was rejected because it interrupted cinematic continuity.
- K20 presentation: title removed; Hybrid camera/framing and Pulse-driven battlefield re-entry are the active polish lane.

- Latest phone evidence (main-20260908-live28k23): PASS iPhone MAIN gate: Aurora Pulse Beauty V2 cinematic played in the live Hybrid route with native V2 SFX, battle BGM silence during the video, Celestial Bloom choir-tail bridge into the battlefield reconnect, and live battle ownership restored cleanly.
- Current pending gate: LIVE28K27: verify Prismel glass-shatter beat, reflective mirror blades crossing into the live battlefield, visible shard landings around the Wraith, damage synchronized to blade impact, clean return, and unchanged Aurora Pulse + Thunder Tornado.
- Machine timing authority: `PV_LIVE_AUTHORITY.json` -> `auryi.aurora_beauty_sync`.

## Kineza victory timing gate

- K21 iPhone runtime gate passed: battle ran correctly after the cleanup-scope repair.
- K22 pending: a lethal Kineza Basic Attack must complete the Duo-Hybrid sequence, restore the exact HC idle at formation home, visibly settle for 240ms, and only then permit Victory.
- This is a timing/presentation fix only. Do not alter Kineza identity, Blitzer frames, damage markers, Aurora Pulse, Prismel, or Auryi stable lanes.

## Hard constraints

- No WebP for this production lane.
- Preserve original/full-quality source assets.
- No Auryi crown or halo inside Aurora Pulse.
- Do not alter Aurorb Slice while wiring Resonart.
- Do not alter Prismel or Kineza in the Aurora Pulse pass.
- GitHub/Pages success is not an iPhone QA pass. Real-device evidence remains the final gate.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

## Immediate next actions

1. On the normal iPhone MAIN route, advance into the Overworld and allow the new `pv.save.v1` autosave to capture a real run.
2. Return/reload MAIN and verify **CONTINUE** appears only when a valid snapshot exists, then restores location, progression, encounter/party/resonance state, resume state, and `pv.locationClear.*` flags.
3. Use **NEW GAME** and verify the save snapshot, run keys, and dynamic location-clear flags are cleared before the existing story route starts cleanly.
4. Confirm Continue/New Game do not disturb the Hybrid/K battle route or the stable `main-20260909-live28k27` Resonart authority.
5. After the iPhone witness passes, record the save flow as accepted and keep K27 as the battle authority unless a later promoted witness explicitly supersedes it.

For a new chat: read this file first, then `PRIZIM_LIVE_NOTEPAD.md`. Resume from the LIVE30E save-state iPhone gate above; do not restart old asset discovery or LIVE28K12-era QA unless a recorded current authority actually fails.


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


## LIVE28K26 Resume Anchor — Prismel Refracted-Reflections

Current witness: `main-20260909-live28k26`.

Resume from the live Hybrid/K battle route. Prismel owns the third cinematic Resonart lane: exact cinematic -> 9.35s staff/lens contact -> captured-frame mirror fracture -> deterministic shard breakup -> live battlefield enemy impact -> clean battle return. Current authority is PriZim + live witness + iPhone MAIN evidence. Do not revive retired handoff-process language. After phone acceptance, pivot to Overworld v1 with 2–3 reachable locations, then party/progression/XP loop.

## LIVE28K27 Prismel reflected-blades presentation polish

- Current promoted witness: `main-20260909-live28k27`.
- Preserve the accepted K26 exact cinematic and captured-frame fracture.
- New K27 shatter beat: procedural glass/crystal shatter fires exactly as the fractured mirror begins separating.
- New live continuation: reflective cyan/violet/gold/white mirror blades cross into the real Hybrid battlefield, converge on the Wraith, visibly strike/land around it, and remain readable on the ground before fading.
- Logical damage now resolves on the live blade impact instead of the first battlefield-reveal frame.
- Preserve battle-BGM silence through the cinematic/shatter and preserve Aurora Pulse V2 + Thunder Tornado.
- iPhone MAIN remains the final runtime/presentation gate.

## LIVE30E1 progression and lexicon pass

- Promoted build: `main-20260909-live28k27` (progression/lexicon pass retained under the stable K27 witness).
- Canonical content authority: `src/PVCanon.js`.
- Auryi title is **Aura Spoken** across BattleConfig and the live result card.
- Resonarts are sealed until Level 2; the live drawer explains the lock and the Hybrid confirm path enforces it.
- Whispering Grove first clear awards 100 XP per core Bearer, producing the first Level 2 unlock and a readable level-up result.
- This is a progression/content pass; the accepted Aurora Pulse, Thunder Tornado, and Prismel reflected-blades presentation lanes remain unchanged.
- iPhone MAIN remains the final runtime gate for this build.
## LIVE30K1 Resonance Tower first-arrival repair (2026-09-26)

- A New Game now stamps a run identity. The first Resonance Tower visit for that identity clears stale Tower sync, tower-clear, and arrival-seen values before rendering. It therefore plays the muted Tower arrival video and then opens Puzzle 1, the Echo Ring Console.
- A normal return to a partially completed Tower in the same run still resumes that exact calibration step. The old text-and-slider screen remains Puzzle 2 only; it cannot become a new-run first puzzle.
- Save and route cache tags were advanced so the main menu, prologue, Overworld, and Tower route load the matching reset logic.
## LIVE30K2 Trail2 exact multipart delivery (2026-09-26)

- GitHub's browser uploader rejects the 54 MB source file. Trail2 is therefore delivered as fourteen sub-5 MB exact byte segments and rebuilt as one local MP4 Blob before trailer playback.
- The complete reassembled bytes hash to `b01d30c49a6e20ae43035a4c82f3a33257ae911f0d1cd02289d17dcb6bdd7300`; no visual or audio re-encode was used. CineTrail remains a deployment-only fallback if a segment is temporarily unavailable.


## 2026-09-27 — Victory result presentation
- Published `hybrid-battle-live.html` commit `5cc847eafd83758bfb37f805347200e3f484e9e5` with a full-screen Overworld Victory result layer.
- Result cards now read the real encounter payout for Prismel, Kineza, and Auryi, show XP progress, item rewards, level-up handoff, and a first-clear Resonance Tower unlock.
- Visual/device gate: pending normal MAIN iPhone, iPad, and Xbox/Edge validation; no device pass is claimed from Pages deployment alone.


## 2026-09-27 — Victory result live wiring pass
- Kept the approved Victory mock as the presentation reference; no generated composite is used as a runtime text/background asset.
- `hybrid-battle-live.html` now exposes live payout state in the result presentation: bearer XP bars, XP callout, resonance status, item cards, first-clear/repeat state, level-up continuation, and the Resonance Tower unlock.
- Production commit: `b912f2fe082feb9000642a144201c19010cc09c9`. Device validation remains pending on the normal MAIN route.

## LIVE30K3 Approved Victory render runtime (2026-09-27)

- The user-approved Victory composite is now the actual result-screen visual at `assets/ui/victory/victory-screen-approved.png`.
- Live values are layered over the render for bearer XP bars, XP gain, first/repeat clear, rewards, level-up handoff, destination unlock, and the action rail.
- The result layer is fixed to one viewport with scrolling disabled; device validation remains pending on the normal MAIN route.

## LIVE30K4 Victory geometry and solo Hushling spacing (2026-09-27)

- The approved Victory composite keeps its native 16:9 ratio inside the result viewport; short landscape browser chrome no longer vertically compresses the render.
- Live XP/reward/resonance overlays now cover the matching source panels, and bearer cards cover the full source card bounds so static placeholder text cannot double underneath.
- The single Hushling remains center-stage per the encounter authority. Prismel, Auryi, and Kineza use a dedicated left-side lane for that one-enemy encounter; multi-enemy formation behavior remains unchanged.
- Pages/device validation remains pending after this geometry pass.

## LIVE30K7 Victory bearer XP display correction (2026-09-27)

- Bearer XP overlays in `hybrid-battle-live.html` now use the full 16:9 result-stage coordinate system. The previous narrow overlay container made the three cards too small and left the render's placeholder XP text visible below them.
- Prismel, Kineza, and Auryi now use per-card widths matching the approved Victory render; opaque cards cover the static placeholder text without entering the reward panel or footer.
- The result layer reads the persisted progression ledger when a legacy or incomplete encounter snapshot is missing payout fields, so a completed clear does not display `+0 XP` merely because an older snapshot omitted the payout.
- Payout authority remains `PVProgression` / `Live29FEncounterBattleScene`; no reward balance or battle timing changed.
- Pages/device validation remains pending on the normal MAIN route.

## LIVE30K8 Hushling center and Overworld masthead cleanup (2026-09-27)

- The Whispering Grove single Hushling remains the location-authoritative enemy and now uses `src/prizim/Live30E4HushlingView.js` to stay centered with a raised landscape baseline. Its full silhouette clears the fixed party strip; the target card, HP, weakness, damage, and encounter flow are unchanged.
- The Overworld map no longer injects the redundant top-left `PRISMATIC VEIL` masthead. Current Location, Destination Intel, stage selection, board-piece travel, and route semantics remain intact.
- Cache-busts were advanced through the Hybrid battle adapter and Overworld 30B layer so nested module/style changes are fetched on Pages.
- Local battle and Overworld smoke checks passed. Normal MAIN iPhone/iPad/Xbox Edge validation remains the final runtime gate.

## LIVE31F Resonance Relay audio, puzzle contracts, and battle return (2026-09-28)

- Resonance Tower now explains its three locks in-world: Identity separates the living Grove memory from Veil static, Integrity stabilizes its harmonics without changing the memory, and Consensus proves the signal can pass through all three Bearers without one voice controlling it.
- Tower arrival uses `Prism of Elders`; the interior uses `veil_clockwork_drift`; existing Tower cues cover ring turns/alignment, harmonic search/lock, route links/errors, and final Relay resolution. Puzzle 2 and Puzzle 3 also expose direct gamepad paths.
- Fixed the battle wrapper fallback that could strand a Whispering Grove clear on Echo Castle. Missing `pvreturn` now defaults to `whisper`, and the static result link uses the same return location.
- Local full three-lock Tower flow passed at desktop and 844x390 landscape with no console errors; remote Pages and real-device audio remain the final gates.

## LIVE31G Basic Attack motion polish (2026-09-30)

- Kept the approved Prismel and Kineza primary/attack assets, frame counts, marker timing, damage timing, and audio cues unchanged.
- Prismel now hands off between the primary and basic-attack sheet with a short crossfade so the sprite does not pop between layers.
- Kineza's existing 18-frame Blitzer and its Duo-Hybrid camera/placement tracks now ease between each existing frame for a more fluid read. No generated bridge frames were promoted after PriZim edge/canvas QA rejected the audition candidates.
- The K-line cache-bust is `DuoHybridSequenceDriver.js?v=duo-9-smooth` through `Live22DuoHybridSequenceDriver.js`.
- Local latest-main Hybrid/K smoke: Prismel resolved 7 damage; Kineza resolved 12 damage and returned through the normal enemy turn. No new sequence/runtime errors. Portrait-loader warnings remain pre-existing. Normal MAIN iPhone/iPad/Xbox Edge validation remains the final gate.

## LIVE31H Prismel shard impact and Victory settle (2026-09-30)

- Prismel Basic Attack now launches a crisp procedural cyan/gold prismatic shard at the existing release marker and lands it on the Hushling at the existing impact marker. The established attack sheet, marker timing, damage roll, enemy hit reaction, and audio cues remain authoritative.
- Lethal Basic Attacks hold the resolved battlefield for 1100ms before the normal turn advance so the shard landing, defeat reaction, and Victory banner do not collapse into one unreadable beat. Nonlethal turns retain the existing 500ms advance.
- Local latest-main Hybrid/K smoke showed the shard in flight and the Hushling at 44/52 after an 8-damage Prismel hit; no new runtime errors were observed. Normal MAIN iPhone/iPad/Xbox Edge remains the final device gate.

## LIVE31I Hushling lane and multi-enemy boundary check (2026-09-30)

- LIVE30E4 now uses one stable enemy-side anchor instead of separate large/small landscape positions: approximately 0.76w / 0.80h in landscape and 0.78w / 0.78h in portrait. The visible Hushling is ~0.62 of the Wraith reference height, still short and stocky but readable on phone and TV layouts.
- The live Hybrid/K encounter remains intentionally single-enemy: `PartyBattleScene` owns one `enemy` object and one `enemyView`, and LIVE29G selects one location enemy. The tactical 06A QA route can stage three Hushlings, but it is not the production battle authority. Multi-enemy production work needs a formation/target/turn-order contract before promotion.
- Device gate remains pending after the layout pass; no multi-enemy behavior is being implied by the single-enemy MAIN route.
