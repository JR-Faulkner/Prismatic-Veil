# PriZim Sequence Pipeline

Status: active production guidance
Updated: 2026-08-19

## Purpose

PriZim Sequence Lab is the phone-first QA environment for character materialization and attack sequences. Its job is to separate motion/registration problems from battlefield/camera/HUD noise, while keeping canonical art authority intact.

## Authority order

1. Approved signature authority sheet or approved per-frame production assets.
2. Canonical neutral sequence manifest.
3. QA tuning profile.
4. Bootstrap battle poses only when no signature authority asset exists.

Bootstrap poses must never silently replace an approved signature sequence. Once an authority asset exists, bootstrap playback retires for that sequence.

## Current authority set

- Prismel staff materialization: approved 6-frame authority sequence; canonical per-frame PNGs already exist in-repo and are used directly for Lab playback.
- Prismel Prismatic Shard attack: approved 6-frame 3x2 authority sheet.
- Auryi Auorb materialization: approved 6-frame 3x2 authority sheet.
- Kineza gauntlet ignition: approved 6-frame 3x2 authority sheet.

The approved sheet references are 1536x1024, arranged as a 3x2 grid of 512x512 cells in reading order. QA derivatives may be lower-resolution transport copies, but they never replace the approved master as visual authority.

## Sheet ingestion

Sequence Lab v0.2 supports sheet-backed frames directly. A manifest may define a sheet with:

- repo-relative asset path
- columns/rows
- background handling
- frame cell index

For current sheet-backed sequences:

- cols: 3
- rows: 2
- frame order: 1,2,3 top row; 4,5,6 bottom row
- background key: edge-white

The Lab crops cells deterministically. Do not manually duplicate frames merely to satisfy the tester unless a downstream runtime genuinely requires per-frame files.

## White-background rule

Approved authority sheets may arrive as JPEGs on white backgrounds. PriZim must not use a naive global white-key because Auryi contains ivory/white costume areas.

Use edge-connected white removal instead: only near-white pixels connected to a crop-cell edge are cleared. This removes the white field while preserving interior costume whites and highlights.

## Brightness / inspection rule

Sequence Lab is a QA instrument, not a cinematic grading pass. Character art must remain bright and readable.

- Do not dim sprites to fit the UI.
- Keep baseline and center guides visually subordinate to the art.
- Use stage contrast/refraction sparingly.
- Normalize visible bounds before registration tuning.

## Registration philosophy

Analyze first, then nudge.

- Normalize source padding and visible-body bounds.
- Preserve foot/baseline read.
- Treat large silhouette changes as pose transitions, not automatic scale errors.
- Use per-frame x/y/scale only after normalization.
- Do not solve local frame problems with global scale rewrites.

For Prismel, `ready_6 -> attack_1 -> attack_2 -> attack_3` remains a perceptual handoff area. 05M improved registration. 05M.1 targets cross-dissolve overlap rather than continuing blanket scale correction.

## Blend rule

Cross-dissolve is not automatically desirable. Large pose changes can create double-character ghosting.

- Heavy silhouette changes: short or zero blend.
- Similar adjacent poses: soft blend allowed.
- Judge on phone recording, not screenshots alone.

## Asset transfer rule

A repo write failure and a binary attachment transfer failure are different problems.

Before claiming GitHub/repo access is unavailable:

1. verify GitHub text/write actions directly;
2. distinguish repository access from uploaded-binary transport;
3. prefer existing in-repo assets before transporting a duplicate;
4. if canonical per-frame assets already exist, use them directly instead of re-importing a sheet;
5. if a QA derivative already exists in the active branch, reference it directly and record its authority mapping;
6. for future connector-limited QA imports, prefer ordinary text-safe transport through normal file actions over raw Git blob/tree plumbing;
7. raw Git blob probing is not part of the normal PriZim production workflow;
8. do not expose a tester as ready until assets, manifests, runtime versioning, and page entry wiring all point to the same build.

This lesson is permanent. Do not repeat the false diagnosis that repo access is lost merely because an uploaded binary cannot pass through a text-only action, and do not keep fighting the blob API when existing assets or text-safe transport solve the job more cleanly.

## v0.2 asset mapping

For the current Sequence Lab v0.2 branch:

- Prismel materialization uses `assets/poses/prismel_active_turn/prismel_ready_1.png` through `prismel_ready_6.png`.
- Prismel Prismatic Shard QA sheet uses `assets/sequences/qa/probe-1e8a.jpg`.
- Auryi Auorb QA sheet uses `assets/sequences/qa/probe-67c55.jpg`.
- Kineza gauntlet ignition QA sheet uses `assets/sequences/qa/probe-a6e4.jpg`.

The `probe-*` filenames are legacy transport names from the v0.2 recovery work. Their manifest mapping is authoritative for this QA build. Future cleanup may rename them, but renaming is not required for runtime correctness.

## Promotion rule

PriZim evolves by evidence:

- Preserve what works.
- Measure what does not.
- Improve the smallest layer necessary.
- Promote QA tuning into canonical data only after phone QA earns it.
- Add new art only when analysis shows the existing authority sequence cannot meet the intended motion quality.

## v0.2 target

Sequence Lab v0.2 must provide:

- correct Prismel materialization sequence
- correct Prismel attack authority
- correct Auryi Auorb authority
- correct Kineza ignition authority
- direct 3x2 sheet ingestion
- edge-connected white removal
- brighter readable stage
- authority-aware validator rules
- cache-busted phone test entry
