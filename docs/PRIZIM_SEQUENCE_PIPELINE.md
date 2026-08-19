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

Bootstrap poses must never silently replace an approved signature sequence. Once an authority sheet exists, bootstrap playback retires for that sequence.

## Current authority set

- Prismel staff materialization: approved 6-frame 3x2 authority sheet.
- Prismel Prismatic Shard attack: approved 6-frame 3x2 authority sheet.
- Auryi Auorb materialization: approved 6-frame 3x2 authority sheet.
- Kineza gauntlet ignition: approved 6-frame 3x2 authority sheet.

Each authority sheet is 1536x1024, arranged as a 3x2 grid of 512x512 cells in reading order.

## Sheet ingestion

Sequence Lab v0.2 supports sheet-backed frames directly. A manifest may define a sheet with:

- repo-relative asset path
- columns/rows
- background handling
- frame cell index

For the current authority sheets:

- cols: 3
- rows: 2
- frame order: 1,2,3 top row; 4,5,6 bottom row
- background key: edge-white

The Lab crops cells deterministically. Do not manually duplicate frames merely to satisfy the tester unless a downstream runtime genuinely requires per-frame files.

## White-background rule

The approved authority sheets are JPEGs on white backgrounds. PriZim must not use a naive global white-key because Auryi contains ivory/white costume areas.

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

## Asset transfer lesson

A repo write failure and a binary attachment transfer failure are different problems.

Before claiming GitHub/repo access is unavailable:

1. verify the GitHub connector/write actions directly;
2. distinguish text-file writes from binary transfer;
3. use Git blob/tree/commit paths when binary assets cannot go through UTF-8 file actions;
4. keep transfer probes off `main`;
5. do not expose a tester as ready until authority files, manifests, runtime versioning, and page entry wiring all point to the same build.

This lesson is permanent. Do not repeat the false diagnosis that repo access is lost merely because an uploaded binary cannot be passed through a text-only file action.

## Promotion rule

PriZim evolves by evidence:

- Preserve what works.
- Measure what does not.
- Improve the smallest layer necessary.
- Promote QA tuning into canonical data only after phone QA earns it.
- Add new art only when analysis shows the existing authority sequence cannot meet the intended motion quality.

## v0.2 target

Sequence Lab v0.2 must provide:

- correct Prismel materialization authority
- correct Prismel attack authority
- correct Auryi Auorb authority
- correct Kineza ignition authority
- direct 3x2 sheet ingestion
- edge-connected white removal
- brighter readable stage
- authority-aware validator rules
- cache-busted phone test entry
