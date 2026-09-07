# The Prismatic Veil — Resume Anchor

Last refreshed: 2026-09-06

## Current production witness

- Promoted witness: `main-20260906-live28k11`
- Witness promotion commit: `1e65e1b34251e72b4cba3c68c9c9e7c5030ccd88`
- Current production audio install commit: `ac00a834471317edd98a60a7884a1896270be61f`
- Production battle adapter: `src/prizim/Live28K2PartyBattleScene.js`
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

The current resolver still uses existing real Auryi action poses as a temporary presentation bridge until the already-approved numbered transparent PNG frame files are reinstalled. Do not redesign the cinematic around those fallback poses.

## Approved frame/source history

- The Aurora Pulse frame material was already supplied previously.
- A prior extraction package existed as `AURYI_AURORA_PULSE_PZ_04_08.zip`.
- Its five extracted frames were approved as 900×900 transparent RGBA PNGs.
- Current-chat composite/JPEG references are visual authority only and must **not** replace the already-approved transparent production PNG bytes.
- Battle-critical art remains PNG only. **No WebP. No source-resolution downscaling.**

## Audio authority — INSTALLED

Production files now exist in MAIN:

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
- Victory calls Triumph of Light once; battle BGM fades/stops first to avoid overlap.
- The old short victory cue is fallback only when Triumph is absent.

Dropbox bridge copies also exist at `/Celestial Bloom.m4a` and `/Triumph of Light.m4a`. They were used only to transport the exact originals into GitHub.

## Safari / MAIN routing

`hybrid-main.html` rewrites the fixed nested module URLs to the current `live-build.json` build ID through an import map. Therefore the LIVE28K11 witness cache-busts:

- K battle adapter
- `PartyBattleConfig.js`
- `PartyBattleAudioController.js`
- `PartyBattleAudioConfig.js`

Do not add redundant base-file query-string surgery unless this routing actually fails on-device.

## Hard constraints

- No WebP for this production lane.
- Preserve original/full-quality source assets.
- No Auryi crown or halo inside Aurora Pulse.
- Do not alter Aurorb Slice while wiring Resonart.
- Do not alter Prismel or Kineza in the Aurora Pulse pass.
- GitHub/Pages success is not an iPhone QA pass. Real-device evidence remains the final gate.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

## Immediate next actions

1. Confirm the user sees witness `main-20260906-live28k11` on the normal iPhone MAIN route.
2. Trigger Auryi Resonart and verify: Aurora Pulse name, crownless presentation, Celestial Bloom start, compression silence, Pulse impact, camera restore, 22-damage range behavior, and clean return to idle.
3. Win the encounter and verify battle BGM gives way cleanly to Triumph of Light with no old-sting overlap.
4. Reinstall the already-approved numbered Aurora Pulse transparent PNG frame files when their exact production bytes are recoverable; do not regenerate or replace them with composite crops.
5. After real-device evidence, update this anchor with pass/fail findings and the next narrow correction only.

For a new chat: read this file first, then `PRIZIM_LIVE_NOTEPAD.md`. Resume from the witness/commit state above. Do not restart asset discovery unless a recorded authority/path actually fails.
