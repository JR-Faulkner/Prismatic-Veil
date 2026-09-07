# The Prismatic Veil — Resume Anchor

Last refreshed: 2026-09-06

## Current production witness

- Promoted witness: `main-20260906-live28k17`
- Witness promotion commit: `0c5a59b68d832aef44e58ac48cbabb9e3c885507`
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

- Current witness: `main-20260906-live28k17`.
- K15 baseline: core Beauty presentation passed, Celestial Bloom audible, demo tail absent.
- Latest phone evidence (main-20260906-live28k17): FAIL boot gate: iPhone recording shows LIVE BATTLE BOOT ERROR · Decoding failed after audio enable. Aurora Pulse did not run, so this recording is not valid evidence for Bloom or handoff quality.
- Current pending gate: LIVE28K18: boot with no decode overlay, Celestial Bloom audibly enters, and K16 battlefield/enemy handoff remains intact.
- Machine timing authority: `PV_LIVE_AUTHORITY.json` -> `auryi.aurora_beauty_sync`.

## Hard constraints

- No WebP for this production lane.
- Preserve original/full-quality source assets.
- No Auryi crown or halo inside Aurora Pulse.
- Do not alter Aurorb Slice while wiring Resonart.
- Do not alter Prismel or Kineza in the Aurora Pulse pass.
- GitHub/Pages success is not an iPhone QA pass. Real-device evidence remains the final gate.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

## Immediate next actions

1. User checks the normal iPhone MAIN route and confirms witness `main-20260906-live28k12`.
2. Trigger Auryi Resonart and verify the visible drawer/banner says **Aurora Pulse**, Celestial Bloom remains correct, the old Aurorb Slice pose sequence no longer plays, the cinematic remains crownless, and camera/idle restore are clean.
3. Win the encounter and verify **Triumph of Light loops** on the victory/results screen with no battle-music or old-sting overlap.
4. If/when the exact approved transparent Aurora Pulse PNG bytes reappear from a new source, install them at the staged 01–08 production paths, verify RGBA + dimensions + anatomy/part-count + crownless integrity, flip `AURORA_PULSE_FRAMES_READY` true, and promote the next LIVE28K witness.
5. Do **not** re-scan the already-cleared File Library / DuoHybrid / FX runtime packages unless new evidence indicates they changed.

For a new chat: read this file first, then `PRIZIM_LIVE_NOTEPAD.md`. Resume from the witness/commit state above. Do not restart asset discovery unless a recorded authority/path actually fails.
