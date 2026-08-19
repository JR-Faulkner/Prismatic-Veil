# PriZim Engineering Guardrails

Status: active project guardrails

These rules capture lessons from real phone QA. They are not optional polish notes. They exist to stop known regressions from repeating.

## Module and cache chain

- When a browser-facing module changes, bust the cache at every import layer between the HTML entry page and the changed module.
- Updating only an inner JavaScript file is not enough if the outer page still imports a cached wrapper URL.
- For phone QA, verify the HTML entry imports the current wrapper version, and the wrapper imports the current presenter version.

## Phaser container visibility

- Prismel's active-turn cut-in lives inside a parent hero rig/container.
- A visible child sprite inside a parent container with `alpha: 0` is still invisible.
- Any custom intro/materialization override must preserve or explicitly restore the parent rig alpha and relevant child/FX alphas.
- Before handoff to phone QA, verify parent container alpha, sprite alpha, position, scale, and active/visible state.

## Inheritance and presentation calls

- Do not bypass the inheritance chain by calling a guessed prototype implementation.
- Use normal `super` dispatch unless the exact owning prototype has been verified.
- If a method is inherited through several presentation layers, inspect the actual chain before overriding or delegating.

## Animation registration

- Do not re-solve a local pose problem with another global scale rewrite.
- Use PriZim neutral registration data for frame-specific tuning.
- Treat `ready_6 -> attack_1 -> attack_2 -> attack_3` as a perceptual handoff, not merely equal alpha silhouette height.
- Preserve foot baseline, apparent body mass, cloak footprint, and head-to-foot read.

## Materialization and future audio

- Staff materialization timing belongs in neutral PriZim data, not scattered Phaser magic numbers.
- Preserve named cue points for future sound attachment so animation does not need to be retimed when audio is added.
- Current Prismel cue vocabulary includes shimmer, staff emergence, staff draw, and staff lock.

## Mobile shell

- Mobile Shell remains phone-first and PV-specific.
- Keep readable/tappable interface in DOM/CSS and world-space visuals in Phaser.
- Avoid generic rounded-card drift. PV identity should come from prismatic geometry, navy/violet/gold materials, spectral refraction, restrained Veil motion, and character-specific accents.
- Do not grow UI panels merely to add identity.

## Signature authority sheets

- Approved signature sheets outrank bootstrap battle poses.
- Once an approved signature authority exists, bootstrap playback must retire for that sequence.
- QA proxies may represent authority sheets in the browser, but the proxy is never the production master.
- Keep frame order, labels, cues, timing, and registration in neutral sequence data rather than baking behavior into the proxy image.
- For current six-frame sheets, use row-major 3x2 ingestion unless a later authority explicitly differs.
- If white-background removal is needed, use edge-connected near-white removal rather than a global white key so ivory/white costume regions survive.

## Binary asset transfer

- A binary attachment-transfer failure is not evidence that GitHub/repo access is unavailable.
- Verify connector read/write actions directly before diagnosing repo access.
- Distinguish UTF-8 text-file operations from binary blob operations.
- For binaries, use Git blob/tree/commit paths or a documented QA-proxy path when direct file transport is unavailable.
- Keep transfer probes off `main` and promote only verified permanent asset paths.
- Never wire manifests to temporary probe names.
- If a newer `main` implementation solves the same problem more cleanly, treat current `main` as source of truth and salvage only non-conflicting guardrails/documentation from the older branch.

## Branch and merge safety

- Before moving a long-running QA branch onto `main`, compare the branch against current `main`.
- Do not fast-forward or force-update if the histories have diverged.
- Inspect overlapping files before merging. If `main` already contains a newer implementation of the same subsystem, do not layer an older workaround on top of it.
- Prefer preserving newer working runtime code and merging only unique documentation, validation, or guardrail improvements.

## QA handoff checklist

Before calling a phone build ready:

1. Confirm the intended HTML page exists on `main`.
2. Confirm the page imports the newest runtime/wrapper version.
3. Confirm the runtime loads the intended neutral manifests.
4. Confirm every manifest-referenced authority/QA asset exists at its permanent repo path.
5. Confirm Prismel's hero rig is visible and nonzero alpha during intro and attack when testing the battle slice.
6. Confirm Hushling/environment/shell still render in the battle slice.
7. Confirm attack frames execute and damage resolves exactly once.
8. Confirm `?battleslice=1` remains the fast battle QA path.
9. Keep the prior numbered build intact when the change is large enough to need comparison.
10. For Sequence Lab changes, confirm the page/runtime cache version, authority labels, frame count, and playback source all agree.

The point of PriZim is not only to move faster. It is to turn mistakes into reusable safeguards.