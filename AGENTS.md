# The Prismatic Veil — Agent Production Rules

These instructions are mandatory for any agent modifying the live game.

## BEFORE ANY LIVE28K WRITE

Read, in this order:

1. `PV_LIVE_AUTHORITY.json` — machine-readable production authority.
2. `PV_RESUME_ANCHOR.md` — current task/witness/device evidence.
3. `PRIZIM_LIVE_NOTEPAD.md` — operational failure-prevention ledger.
4. `live-build.json` — promoted witness and live entries.
5. `hybrid-main.html` — live Hybrid router/import-map authority.
6. `hybrid-battle-live.html` — visible Hybrid HUD/state wrapper.

Then run:

```bash
python tools/prizim/preflight_live28k.py
```

If preflight fails, **fix the authority/route drift before making the requested production change. Do not code around the failure.**

## HYBRID STACK IS THE LIVE BATTLE AUTHORITY

All production battle/cinematic work must remain in the live Hybrid chain:

`index.html / story-scroll.html -> hybrid-main.html -> hybrid-battle-live.html -> numeric LIVE28K K adapters`

For numeric LIVE28K builds:

- battle adapter: `src/prizim/Live28K2PartyBattleScene.js`
- formation adapter: `src/prizim/Live28K7PartyFormationView.js`
- `src/PartyBattleScene.js` is generic/base infrastructure, not the production endpoint for new LIVE28K cinematic features.

Do not implement a live feature only in standalone Phaser/base-scene code and assume the Hybrid wrapper will inherit it correctly. Verify the Hybrid HUD/state publication and import-map path explicitly.

## AURYI CURRENT AUTHORITY

- Basic Attack: **Aurorb Slice**.
- Resonart: **Aurora Pulse**.
- Aurora Pulse composition/timing reference: `pz-a-aurora-pulse-lab.html`.
- The mock is reference authority only. Do not promote it as a live entry page.
- Port/integrate its choreography through the Hybrid/K adapter stack.
- Celestial Bloom is the approved Aurora Pulse audio and has passed iPhone playback evidence.
- Triumph of Light is the approved victory music and loops while the results screen remains open.
- Aurora Pulse remains **crownless**.
- Missing approved numbered 01–08 PNG bytes do not authorize replacing the established mock choreography with a float-only fallback or old Aurorb Slice poses.
- Future non-Aurora crown authority: match the Main Splash Screen crown as a **hovered/offset element above Auryi**, not head-worn.

## ART / RUNTIME HARD LOCKS

- No WebP for battle-critical production art.
- Preserve native/full-quality approved source assets.
- Do not reprocess already PZ-clean masters at runtime.
- Do not change Prismel/Kineza stable lanes while fixing Auryi unless explicitly required.
- Do not use old crown/halo/Auorb FX inside crownless Aurora Pulse.
- Full anatomy/part-count QA is mandatory before final extracted/harmonized animation approval.

## VALIDATION ORDER

1. Machine authority and ledgers agree.
2. `python tools/prizim/preflight_live28k.py` passes.
3. Runtime code changes are made inside the correct Hybrid/K path.
4. CI/Pages pass.
5. User validates the normal MAIN route on iPhone.

GitHub/Pages success is deployment evidence only. The user’s real iPhone MAIN evidence is the final runtime gate.

## AFTER A PRODUCTION CHANGE

Update `PV_LIVE_AUTHORITY.json` when production authority/witness changes. The PriZim sync workflow keeps the human ledgers aligned. Do not leave the machine authority, resume anchor, and PriZim notepad describing different builds.
