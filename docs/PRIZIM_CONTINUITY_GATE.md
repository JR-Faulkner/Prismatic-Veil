# PriZim Continuity Gate

Status: active QA / generation-prep guidance  
Version: v0.3.1  
Updated: 2026-08-19

## Purpose

Continuity Gate is the PriZim layer that measures whether two approved character frames agree well enough to be connected by runtime motion alone, need registration/timing tuning, or justify a new bridge pose.

It exists to reduce unnecessary generation and to make any required generation much more constrained.

The sequence pipeline becomes:

**Authority frames → Motion Bridge → Continuity Gate → PASS / TUNE / BRIDGE CANDIDATE → constrained repair/generation only when earned → Gate again → phone QA**

## Gate decisions

### PASS

The measured handoff is within the character's continuity tolerances and is visually clean enough to be considered shippable geometry for the current sequence. PASS must not mean merely "nothing exceeded a generous maximum." Do not generate new character art for a true PASS. Improve playback only if phone QA still reports a motion problem.

### TUNE

The handoff is close enough that registration, timing, overlap, or motion-profile tuning should be tried before new art.

### BRIDGE CANDIDATE

The endpoint frames disagree enough that runtime interpolation alone may not hide the discontinuity. This is a recommendation for review, not automatic permission to generate.

A bridge is created only after phone QA and the measured Gate result agree that the handoff is materially distracting.

## Measurements in v0.3

Continuity Gate measures each adjacent authority-frame pair using the alpha-visible subject after PriZim edge-white cleanup.

Current measurements:

- visible body/silhouette height delta
- silhouette width delta
- baseline delta
- visible-body center X delta
- lower-body anchor X delta
- visible alpha-mass delta
- whole-cell silhouette distance

The current score is a geometry/continuity score. It is not yet a complete identity score.

## Character-aware tolerances

Each sequence manifest may define a `continuityGate` profile.

This is required because legitimate motion has different geometry:

- Prismel uses tighter controlled tolerances because staff materialization and casting should preserve a planted sorcerer read.
- Auryi permits more silhouette and visible-mass expansion because crown, robes, hair, and Auorb energy legitimately bloom around her.
- Kineza permits temporary mass/width changes because stomp impacts, kinetic cracks, arm spread, and emerald ignition are intentionally explosive, but body stance and lower-anchor drift must still be judged strictly enough to catch visible character discontinuity.

PriZim should never use one universal threshold set for every hero or every action.

## v0.3.1 phone-QA calibration

The first phone test showed the Gate was useful but slightly too generous with PASS, especially on Kineza. Visual review showed real discontinuity in Kineza's stance, cape footprint, leg spread, torso lean, and lower-body anchor even where the original profile still allowed a PASS.

v0.3.1 therefore recalibrates the manifest data rather than rewriting the Gate engine:

- PASS thresholds are raised across all three heroes so PASS means closer to shippable continuity rather than merely acceptable tolerance;
- Prismel receives slightly tighter height, width, baseline, center, lower-anchor, visible-mass, and silhouette allowances;
- Auryi remains the most forgiving where aura/robe/hair expansion is legitimate, but her PASS score is raised and several geometry tolerances are tightened slightly;
- Kineza receives the strongest correction: width tolerance drops from 32% to 25%, lower-anchor tolerance from 12% to 8.5%, visible-mass tolerance from 42% to 34%, silhouette tolerance from 0.88 to 0.78, and PASS rises from 76 to 84;
- BRIDGE remains deliberately harder to trigger than TUNE so the Gate does not over-prescribe new art.

Calibration rule: when phone QA and Gate output disagree, prefer changing the smallest data layer first. Do not change the renderer, canonical art, or generation policy merely to make the score agree with the eye.

## Bridge specification

For every measured handoff, the Lab can emit a constrained bridge specification.

The specification includes:

- exact source and target authority beats
- measured target baseline
- measured center X target
- target visible height and width envelopes
- lower-body anchor target
- current failed/weak continuity metrics
- strict identity/costume/camera locks
- explicit instruction to create a 50% interpolation pose rather than a third unrelated pose
- post-generation Gate target

This specification is intended to be used with both neighboring canon frames as strict visual references.

## Anti-drift generation rule

Do not ask a generation system to recreate the entire character freely when the task is only to bridge two canon poses.

Preferred order:

1. use both approved endpoint frames as strict references;
2. preserve identity, costume, materials, colors, camera, crop, and unaffected body regions;
3. change only the body/prop/effect regions required by the measured transition;
4. target the measured midpoint geometry supplied by Continuity Gate;
5. run the generated candidate back through Continuity Gate;
6. if it fails, repair from the nearer approved endpoint rather than regenerating the full character from scratch.

The goal is constrained transformation, not reinterpretation.

## Hybrid repair direction

PriZim should increasingly prefer:

**canon endpoint → deterministic alignment/warp where safe → generative repair of only damaged transition regions → Continuity Gate → manual phone QA**

Safe deterministic operations may include:

- translation and scale normalization
- limited prop/limb anchor movement
- cloth/effect mask alignment
- localized warp for small geometric gaps

Do not use whole-character optical flow across large pose changes when it produces stretched anatomy or costume distortion.

Generation should repair the smallest region necessary.

## What v0.3.1 does not yet prove

Continuity Gate remains deliberately conservative about its claims.

It does not yet automatically validate:

- exact face/identity likeness
- costume-detail correctness at semantic level
- hand/finger anatomy
- exact staff/orb/gauntlet shape identity
- color palette drift independent of legitimate magical effects
- hair-detail consistency independent of silhouette

Those are future Asset Intelligence layers and still require visual review today.

A high Gate score therefore means geometric continuity is strong. It does not mean the frame is automatically canon-safe.

## Production guardrails

- Canon endpoint frames remain immutable visual authority.
- A generated bridge never replaces either endpoint.
- Gate thresholds are data, not hard-coded character assumptions.
- Runtime Motion Bridge gets a chance before new art.
- PASS must correlate with phone-visible quality, not only numeric tolerance.
- One bridge frame is preferred over a new full sequence when one bridge solves the measured gap.
- If multiple adjacent handoffs fail for different reasons, analyze each separately rather than generating a blanket in-between strip.
- Phone recording remains final motion-quality authority.

## v0.3.1 success condition

Continuity Gate proves its worth when it can turn a vague complaint such as "this part jumps" into:

- the exact failing handoff;
- the specific geometry that changed too much;
- a PASS / TUNE / BRIDGE CANDIDATE recommendation that agrees reasonably well with phone review;
- a constrained bridge specification that reduces generation freedom;
- a measurable post-generation acceptance target.

That is the bridge between PriZim analysis and controlled character generation.
