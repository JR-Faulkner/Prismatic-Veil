# Kineza MUGEN Prototype v0.2 Validation

Build date: 2026-09-18
Source package: I21 commit `2bba87d360c3f6b7e770959febec94350a1dafb4`
Original SFF SHA-256: `652ec567c14377f2967466064e7ddb8632949f30ca34789fd430a2dd1cc67bcc`
Repaired SFF SHA-256: `4be0c838b32b6644ff0e6b8a08d364850883917e1900b5493f6b748bbfb35ced`
v0.2 ZIP SHA-256: `f45ad7fac73b2f11412d980173fe1387fe56dae9cc39cf3995e60017167750af`

## Repair
- Recovered the untouched v0.1 SFF from I21 history.
- For each of 23 sprites, inserted exactly one PCX palette delimiter `0x0C` immediately before the existing final 768-byte RGB palette.
- Preserved every original PCX header/RLE byte and every original palette byte.
- Recomputed SFF sprite block lengths and next offsets.
- Did not use the flat-green silhouette palette.
- Retained the current phone-tested `.3` x/y scale from the live pack.

## Engine-format validation
- SFF sprites walked: **23**
- Palette delimiters at expected boundary: **23/23**
- PCX decodes completed: **23/23**
- AIR actions parsed: **48**
- AIR sprite references: **90**, missing: **0**
- Required actions 0 / 200 / 1000 / 1070: **present**
- Required states 200 / 1000 / 1070: **present and return to state 0**
- Scale: **x=.3, y=.3**
- Direct command gate: **MUGEN x -> "prototype punch" -> state 200 -> anim 200 -> state 0**
- Action 200 distinct sprite refs: **3**
- Decoded sprite dimensions observed: **[(512, 384)]**

## Pixel integrity
For every sprite, the post-repair PCX image bytes are byte-identical to v0.1 and the 768 palette bytes are byte-identical to v0.1. The validator decodes indexed pixels and reconstructs RGB output from those preserved palettes. This proves the repair changes only the missing palette boundary byte plus SFF offsets.

The exact authoritative source-PNG visual comparison remains a separate visual QA gate because those source PNGs are not stored in this repository package. Do not substitute a generated/silhouette image for that comparison.

## Reference comparison
Dropbox construction references were reviewed separately:
- G.Ken uses a one-tick direct `x` command, routes it through State -1 to State 200, State 200 uses Anim 200, and returns to State 0 on `AnimTime = 0`.
- DragonClaw uses the same one-button command discipline and an explicit State 200 attack family.
- Kineza v0.2 is validated against that clean input/state lifecycle without copying their moves or art.

## Phone gate
1. Load the v0.2 candidate through the existing MobMugen/Ikemen path.
2. Pick Kineza.
3. Confirm his body renders normally, not green blocks/noise.
4. Tap the browser button that emits keyboard **x** (current controller label: **MK / KeyX**).
5. Confirm the direct punch visibly changes animation and returns to idle.
6. Only after that, test QCF+x Momentum Fist and QCF+y Blitz Rush.
7. Record exactly: **render fixed / not fixed** and **direct action fixed / not fixed**.
