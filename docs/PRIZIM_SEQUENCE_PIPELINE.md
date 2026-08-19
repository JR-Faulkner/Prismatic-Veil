# PriZim Sequence Pipeline

Status: active production guidance
Updated: 2026-08-19

## Purpose

PriZim Sequence Lab is the phone-first QA environment for character materialization and attack sequences. Its job is to separate motion/registration problems from battlefield, camera, and HUD noise while preserving canonical art authority.

## Authority order

1. Approved signature authority sheet or approved per-frame production assets.
2. Canonical neutral sequence manifest.
3. QA tuning profile.
4. Bootstrap battle poses only when no signature authority exists.

Bootstrap poses must never silently replace an approved signature sequence. Once an authority sheet exists, bootstrap playback retires for that sequence.

## Current authority set

- Prismel staff materialization: approved six-frame 3x2 authority sheet.
- Prismel Prismatic Shard attack: approved six-frame 3x2 authority sheet.
- Auryi Auorb materialization: approved six-frame 3x2 authority sheet.
- Kineza gauntlet ignition: approved six-frame 3x2 authority sheet.

The approved source sheets are 1536x1024 with six 512x512 cells in reading order. PriZim may use lightweight QA proxies for browser/phone testing, but those proxies never replace the production masters as visual authority.

## QA proxy rule

Current Sequence Lab v0.2.1 uses lightweight WebP QA proxies under `assets/sequences/qa/`.

- QA proxies preserve the approved sheet composition and frame order.
- Production masters remain unchanged and authoritative.
- A manifest carrying `qaProxy: true` must clearly communicate that the runtime asset is a testing representation, not the canonical master.
- Replacing a QA proxy with a higher-fidelity transport asset must not require changing authored sequence timing or frame semantics.

## Sheet ingestion

Sequence Lab supports sheet-backed frames directly. A manifest may define:

- repo-relative sheet asset path
- columns and rows
- row-major frame index
- per-frame timing, cue, x/y, and scale tuning

For the current authority sheets:

- columns: 3
- rows: 2
- frame order: top row 1,2,3; bottom row 4,5,6

Do not manually duplicate sheet cells into separate runtime files unless a downstream renderer genuinely requires it.

## White-background rule

Some approved authority sources arrive on near-white backgrounds. PriZim must not globally remove every white pixel because Auryi and other characters can contain ivory, gold-white, or bright costume areas.

Use edge-connected near-white removal instead: only near-white pixels connected to the crop-cell edge are cleared. Interior costume whites and highlights remain intact.

## Brightness / inspection rule

Sequence Lab is a QA instrument, not a cinematic grading pass. Character art must remain bright and readable.

- Do not dim sprites to fit the UI.
- Keep baseline and center guides visually subordinate to the art.
- Normalize visible bounds before registration tuning.
- Apply display brightness compensation to QA proxies when dark costume values are lost on phone screens.
- Prefer lifting the inspection stage and sprite presentation before altering canonical art or sequence registration.

### v0.2.1 phone-QA correction

The 2026-08-19 iPhone recording showed that the correct Auryi and Kineza authority sequences were playing, but both characters remained underexposed in the Lab. Auryi's lavender/ivory read was especially suppressed, while Kineza's dark armor depended too heavily on green effects for readability.

v0.2.1 therefore changes presentation only:

- lifts the inspection-stage midtones;
- increases post-normalization canvas brightness;
- keeps contrast close to neutral to avoid crushing shadow detail;
- slightly preserves saturation so character accents remain readable;
- reduces guide/grid prominence;
- does not change frame timing, registration, manifests, or canonical assets.

This is the preferred order of operations for future readability problems: fix the QA presentation before changing character art or motion data.

## Registration philosophy

Analyze first, then nudge.

- Normalize source padding and visible-body bounds.
- Preserve foot/baseline read.
- Treat large silhouette changes as pose transitions, not automatic scale errors.
- Use per-frame x/y/scale only after normalization.
- Do not solve local frame problems with global scale rewrites.

For Prismel, `ready_6 -> attack_1 -> attack_2 -> attack_3` remains a perceptual handoff area. 05M improved registration. 05M.1 focuses on reducing ghosty cross-dissolve overlap instead of continuing blanket scale correction.

## Blend rule

Cross-dissolve is not automatically desirable.

- Large silhouette changes should use short or zero blend.
- Similar adjacent poses may use softer blending.
- Judge motion on phone recording, not screenshots alone.

## Asset transfer rule

A repo write failure and an uploaded-binary transfer failure are different problems.

Before claiming GitHub/repo access is unavailable:

1. verify connector read/write actions directly;
2. distinguish UTF-8 text writes from binary-transfer limitations;
3. prefer existing in-repo assets before transporting duplicates;
4. prefer lightweight QA proxy conversion through ordinary supported file workflows when browser/phone testing does not require the full production master;
5. keep temporary transfer experiments off `main`;
6. do not use raw Git blob probing as a normal PriZim production path;
7. never call a tester ready until authority assets, manifests, runtime versioning, and HTML entry wiring all resolve to the same build.

If binary transport becomes unstable, change the transport strategy rather than repeatedly retrying low-level Git blob operations. The approved master remains authoritative regardless of the QA transport format.

Do not repeat the false diagnosis that repo access is lost merely because an uploaded binary cannot be passed through a text-only action.

## Promotion rule

PriZim evolves by evidence:

- Preserve what works.
- Measure what does not.
- Improve the smallest layer necessary.
- Promote QA tuning into canonical data only after phone QA earns it.
- Add new character art only when analysis shows the existing authority sequence cannot meet the intended motion quality.

## Sequence Lab v0.2 baseline

The v0.2 baseline includes:

- correct Prismel materialization authority
- correct Prismel Prismatic Shard attack authority
- correct Auryi Auorb authority
- correct Kineza gauntlet ignition authority
- direct 3x2 sheet ingestion
- edge-connected near-white removal
- authority-aware manifest validation
- cache-versioned browser loading

v0.2.1 adds the brighter phone-readable inspection presentation without changing sequence data.
