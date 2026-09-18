# Kineza v0.3 Production Blueprint

Date: 2026-09-18
Status: BUILD AUTHORITY FOR NEXT KINEZA PASS
Runtime authority: MobMugen / Ikemen RIG I24 memory lane
Character base: KINEZA_MUGEN_PROTOTYPE_V0_2

## Locked inputs

- v0.2 repaired SFF: 23/23 PCX sprites decode successfully.
- v0.2 scale remains x=.3 / y=.3.
- Original command naming remains intact: physical x -> "prototype punch" -> State 200.
- Existing v0.2 sprite inventory:
  - 9000,0 portrait/reference
  - 9020,0 portrait/reference
  - 1000,0
  - 1002,0
  - 1003,0
  - 1070,0 through 1070,17
- All current sprites use a 512x384 source canvas with axis 256,340.
- Current repaired palettes and image payloads are authoritative until a source-art replacement is explicitly approved.
- Browser controller / MobMugen runtime is not part of this art pass.

## Production principle

Kineza is built as animation families, not as a loose sprite dump.

For every family:
1. choose canonical body frames,
2. normalize scale and root/foot axis,
3. separate body from detachable FX,
4. define AIR timing,
5. define CLSN1/CLSN2,
6. define state lifecycle,
7. phone-test readability and motion,
8. generate missing in-betweens only when the existing approved art cannot bridge the motion cleanly.

No generated frame becomes production art without comparison against the supplied Kineza references.

## SFF / AIR / State map

| Family | SFF plan | AIR / State | Initial frame target | Existing source status | Generation status |
|---|---|---|---:|---|---|
| Idle / Ready | 0,0-3 | Action 0 / State 0 | 3-4 | canonical standing refs supplied; current package can provide base pose | MAY NEED 2-3 subtle in-betweens |
| Turn | 5,0-1 | Action 5 | 2 | derive from idle/body authority | DEFER unless turn looks abrupt |
| Crouch transition | 10,0-2 | Action 10 | 2-3 | no clean dedicated family confirmed | LIKELY generation later |
| Walk forward | 20,0-5 | Action 20 | 4-6 | no clean dedicated family confirmed | LIKELY generation later |
| Walk backward | 21,0-5 | Action 21 | 4-6 | no clean dedicated family confirmed | LIKELY generation later |
| Jump family | 40-47,* | standard jump actions | launch/rise/fall/land | no clean dedicated family confirmed | DEFER to phase 2 |
| Direct Punch | 200,0-5 | Action 200 / State 200 | 6 | six-frame supplied punch reference + current 3-frame prototype | BUILD NOW, no generation unless bridge fails |
| Heavy Normal | 210,0-5 | Action 210 / State 210 | 4-6 | strong heavy-impact refs exist | DEFER until punch gate passes |
| Momentum Fist | 1000,0-7 | Action 1000 / State 1000 | 6-8 body frames | current package has 1000/1002/1003 source + supplied powered-strike refs | BUILD AFTER punch; generation optional for transition only |
| Blitzer | 1070,0-17 | Action 1070 / State 1070 | 18 currently | full 18-frame family already exists and decodes | RETIME / RECLASSIFY first, do not generate yet |
| Hit reactions | 5000+ | standard get-hit actions | compact first set | not authoritative yet | DEFER |
| Guard | 120/130/140 families | standard guard states | compact set | not authoritative yet | DEFER |
| Detached FX | 6000+ | Explod/Helper | variable | green rings/trails/debris/impact refs supplied | EXTRACT/SEPARATE before generating new FX |

## Phase A: direct punch quality gate

Goal: turn State 200 from prototype into the visual quality bar for all future Kineza normals.

Proposed six-beat motion:
1. Ready / anticipation
2. Chamber
3. Forward drive
4. Contact / maximum extension
5. Recoil
6. Return toward neutral

Initial AIR timing target:
- frame 0: 2 ticks
- frame 1: 2 ticks
- frame 2: 2 ticks
- frame 3: 3 ticks
- frame 4: 2 ticks
- frame 5: 2 ticks

This is a starting point, not a locked feel target. Phone witness decides final timing.

State 200 requirements:
- physical x retains command name "prototype punch".
- standing/controlled trigger only for first quality gate.
- Anim = 200.
- HitDef active only during the intended contact window.
- no body-root teleporting between frames.
- return to State 0 at AnimTime = 0.
- one clear CLSN1 attack region on contact frames only.
- CLSN2 follows torso/head/legs, not the 512x384 canvas.
- any gauntlet energy ring that exceeds the hand silhouette becomes detached FX.

Acceptance:
- readable anticipation,
- obvious contact,
- no scale pumping,
- no foot skating,
- no cape pop,
- clean return to idle.

## Phase B: idle quality gate

Idle should feel alive without becoming noisy.

Target:
- 3-4 body frames.
- feet and lower-body root remain essentially fixed.
- motion limited to breathing, shoulder shift, gauntlet pulse and controlled cape settle.
- no perspective change that changes perceived height.
- optional detached low-intensity gauntlet glow.

Generation trigger:
Generate only if the supplied canonical standing frames cannot produce at least three visually coherent phases without warping or duplicated-looking holds.

## Phase C: Momentum Fist

Momentum Fist must feel heavier than State 200, not simply greener.

Motion:
1. compression,
2. gauntlet charge,
3. forward drive,
4. impact,
5. energy bloom,
6. follow-through,
7. recoil,
8. neutral recovery if needed.

Body and FX:
- body motion lives in group 1000.
- detachable gauntlet bloom / ring / debris moves to 6000+.
- FX is never allowed to dictate the body's root axis.

Generation trigger:
Only if a clean body transition is missing between charge -> drive or impact -> recoil.

## Phase D: Blitzer

Current group 1070 already contains 18 repaired sprites. Do not regenerate the family until the existing sequence is classified and retimed.

Production classification:
- setup / compression frames,
- launch frames,
- travel/smear frames,
- contact frames,
- brake/replant frames,
- recovery frames.

Rules:
- smear frames are short-duration travel punctuation, never long holds.
- frames with extreme FX are reviewed for body/FX separation.
- any source frame that alters apparent scale is normalized through placement/crop before replacement is considered.
- current 18-frame set remains the source of truth until a phone witness proves a specific transition cannot be made smooth through AIR timing/axis work.

Generation trigger:
Only after a retimed phone pass identifies a specific broken bridge between two named frames.

## Reference-character lessons applied

### G.Ken
Use:
- clear command -> State -1 -> attack-state lifecycle,
- conventional normal attack readability,
- compact timing and predictable recovery.

Do not copy:
- artwork, move identity, damage balance, or Ken-specific combo logic.

### DragonClaw
Use:
- special-movement states with strong visual identity,
- deliberate separation of unique mobility from standard movement,
- visual/audible signalling and explicit bug-fix discipline.

Important mobile lesson from DragonClaw documentation:
large numbers of afterimages/layered sprites/explods can become memory-heavy. Kineza FX should therefore prefer a small number of purposeful layers over persistent effect spam.

### DudleyStreets
Use:
- grounded combo readability,
- fast normals with deliberate chain rules,
- movement that feels character-specific without requiring excessive aerial complexity.

Do not copy:
- Dudley's exact chain map or move behavior.

## Runtime / memory guardrail

RIG I24 real-device result established approximately:
- post-eager own-VFS: 76.9 MB,
- match peak: 128.7 MB,
- no eviction in the tested match.

This gives Kineza more headroom than the earlier ~235 MB benchmark, but it is not permission to inflate the character carelessly.

For v0.3:
- reuse body frames where appropriate,
- detach FX only when it improves reuse/readability,
- avoid hundreds of redundant full-canvas sprites,
- keep effect lifetimes short,
- avoid large persistent full-screen alpha layers unless a signature move truly requires them.

## Generation decision gate

Do NOT generate yet for:
- Blitzer: 18 source frames already exist.
- Direct punch: supplied six-frame reference is sufficient for first construction pass.
- Momentum Fist: enough source direction exists to attempt a first assembly.
- FX: enough source material exists to separate/reuse initial effects.

Generation is first likely needed for:
1. Idle breathing/cape in-betweens, if 3 coherent frames cannot be derived cleanly.
2. Walk forward/back, because dedicated locomotion source coverage is currently weak.
3. Crouch/jump transitions later.
4. A specific Momentum Fist or Blitzer bridge only if phone testing proves timing/axis work cannot solve it.

When generation is required, request one animation family at a time and use the supplied canonical Kineza standing/body references plus the neighboring approved frames as image references.

## v0.3 build order

1. Preserve v0.2 as rollback.
2. Create production SFF numbering map.
3. Rebuild/polish Direct Punch to six beats.
4. Add compact idle pass.
5. Phone-test idle + direct punch.
6. Only if those pass, polish Momentum Fist.
7. Retiming/body-FX classification pass on existing 18-frame Blitzer.
8. Phone-test the four-family vertical slice.
9. Expand movement/hit/guard families afterward.

## Phone acceptance format

For each family record:
- ART: pass / fail
- SCALE: pass / fail
- AXIS: pass / fail
- SMOOTHNESS: pass / fail
- INPUT/STATE: pass / fail
- FX READABILITY: pass / fail
- NOTES: one concrete defect at a time

No family is promoted because it merely loads.
