# PriZim Engineering Guardrails — Sequence Lab v0.2 Addendum

Updated: 2026-08-19

## Permanent memory from current QA cycle

- Prismel, Auryi, and Kineza signature sequence testing must use the approved authority sequences, not convenient bootstrap battle poses.
- Prismel uses two linked 6-frame authorities: staff materialization and Prismatic Shard attack.
- Auryi uses the approved 6-frame Auorb sequence.
- Kineza uses the approved 6-frame gauntlet ignition sequence.
- Current authority sheets are 1536x1024, arranged 3x2, with six 512x512 cells in reading order.
- Sequence Lab v0.1 was too dim. QA presentation must keep character art bright/readable and treat guides as secondary.
- JPEG authority sheets require edge-connected white removal, not naive global white-keying, so ivory/white costume areas survive.
- Prismel's remaining movement after 05M is primarily a transition/cross-dissolve/pose-footprint issue, not a reason to restart global scale normalization.
- A GitHub binary-transfer failure is not evidence that repo access is lost. Verify connector write access before making that claim.
- When binary upload through text file APIs fails, use Git blob/tree/commit plumbing on an isolated branch and keep `main` clean until the full chain is verified.
- Cache busting remains end-to-end: HTML entry -> wrapper/runtime -> manifest/assets.
- PriZim evolves by evidence. Preserve working layers, measure failures, modify the smallest necessary layer, then promote only after phone QA.

## Required pre-handoff checks for Sequence Lab

1. Correct authority asset exists at the repo path used by the manifest.
2. Manifest references the exact authority sequence, not a bootstrap substitute.
3. 3x2 cell order is correct.
4. Edge-white removal does not erase costume whites/highlights.
5. Character brightness is visually readable on iPhone.
6. Baseline/normalization guides remain subordinate to art.
7. Frame hold/blend/cue values are shown in Lab readout.
8. Prismel materialization and attack remain distinguishable but linked.
9. Runtime/manifests/page are cache-busted together.
10. Phone QA verifies the result before promotion to canonical production tuning.
