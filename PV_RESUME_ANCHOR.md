# The Prismatic Veil — Resume Anchor

Last refreshed: 2026-09-06

## Current production witness

- Promoted witness: `main-20260906-live28k10`
- Witness promotion commit: `dcd62ed439393c5aa8969ce5302a709cb7bb5770`
- Current MAIN after audio-finalizer setup: `fa2ac459cb22ae88556b4f5073007f61b392ab4b`
- Production battle adapter: `src/prizim/Live28K2PartyBattleScene.js`
- Aurora Pulse resolver commit: `82b7a25607cb0cd310b6ad1ee4472c4ca0ce5c58`
- Aurora Pulse result/banner authority commit: `34c5e56789d0b950e15aed4fb0c618316571a839`
- Resonart drawer authority commit: `e9f6c54ede06aea60cfca37d4883b00657ad1109`
- Resonart damage authority commit: `d77c43455d6a0dfbbcdcbe6db4a710d4453b9222`

## Auryi command authority

- Basic Attack: **Aurorb Slice**. Do not alter while working on Resonart.
- Resonart: **Aurora Pulse**.
- Aurora Pulse damage authority: `hero.resonart.damage = 22`.
- Resonart hit chance remains 92%.
- The live K-line intercepts only `hero.id === 'auryi' && command === 'Resonart'`; all other actions delegate to the existing resolver.

## Aurora Pulse cinematic authority

Crownless Resonart. Do not use crown art, halo art, procedural crown/ellipse FX, or the older crown entry path inside Aurora Pulse.

Approved beat order:

1. 01–02: battlefield handoff / invocation / lift
2. 03–05: Aurora growth and celestial expansion
3. 06: maximum charge
4. 07: compression / hand-smash
5. brief **silence pocket** after 07
6. 08: outward Pulse
7. enemy impact / aftermath
8. smooth return to normal battle framing and Auryi idle

Current live resolver timing in `Live28K2PartyBattleScene.js`:

- lift 360ms
- bloom A 520ms
- bloom B 520ms
- max charge 420ms
- compression 260ms
- silence 170ms
- release 240ms
- aftermath 300ms
- recover 320ms

Current resolver uses existing real Auryi action poses as a temporary presentation bridge until the already-approved numbered PNG frame files are reinstalled. Do not redesign the sequence around those fallback poses.

## Approved frame/source history

- The approved Aurora Pulse frame material was already supplied previously.
- A prior production extraction package existed as `AURYI_AURORA_PULSE_PZ_04_08.zip`.
- Its five extracted frames were approved as 900×900 transparent RGBA PNGs.
- Current chat also contains approved Auryi pose/composite visual authorities, but JPEG/composite references must **not** replace the already-approved transparent production PNG bytes when those bytes are recovered.
- Battle-critical art remains PNG only. **No WebP. No source-resolution downscaling.**

## Audio authority

Original masters are currently mounted in the working session as:

- `Celestial Bloom(1).m4a`
  - duration: ~5.48 s
  - byte size: 113,740
  - SHA-256: `0e8762907bf36650cbdebab8f6497079350054f9819c81e6cb1ba4f3b14cff3d`
  - intended runtime path: `assets/music/Celestial Bloom.m4a`
- `Triumph of Light(1).m4a`
  - duration: 10.00 s
  - byte size: 186,602
  - SHA-256: `98c77e8bc536425b8da8ad4212ed26011335c5ac3b9dadbce0ec28c201cca437`
  - intended runtime path: `assets/music/Triumph of Light.m4a`

Audio rhythm:

`lift → choir bloom → compression → silence → Pulse impact`

Victory:

`battle BGM fade/stop → Triumph of Light once → no ugly overlap`

A lossless reconstruction workflow has been added at `.github/workflows/finalize-auryi-audio.yml`. It verifies the exact SHA-256 and byte sizes before committing the masters. The binary transport into that workflow is the current implementation task.

## Hard constraints

- No WebP for this production lane.
- Preserve native/full-quality source assets.
- No Auryi crown or halo inside Aurora Pulse.
- Do not alter Auryi basic Aurorb Slice while wiring Resonart.
- Do not alter Prismel or Kineza in the Aurora Pulse pass.
- Do not call GitHub/Pages success an iPhone QA pass. Real-device evidence remains the final gate.
- Full anatomy/part-count QA remains mandatory before final extraction/harmonization approval.

## Immediate next actions

1. Finish lossless binary installation of Celestial Bloom and Triumph of Light.
2. Add dedicated audio-controller hooks for Aurora Pulse bloom/silence/Pulse and Triumph victory handoff.
3. Reinstall the already-approved numbered Aurora Pulse transparent PNG frame files when recoverable; do not regenerate or replace them with JPEG/composite crops.
4. Promote the next numeric LIVE28K witness only after runtime/audio wiring is complete.
5. Verify Pages/CI, then user performs iPhone MAIN evidence pass.

For a new chat: read this file first, then `PRIZIM_LIVE_NOTEPAD.md`. Do not restart asset discovery unless the authority/path recorded here actually fails.
