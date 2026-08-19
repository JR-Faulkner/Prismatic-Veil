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

Current Sequence Lab v0.3 uses lightweight WebP QA proxies under `assets/sequences/qa/`.

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
- QA exposure may be raised aggressively when a transport proxy crushes shadow detail.
- Lower display contrast when needed to reveal dark costume structure without rewriting the underlying art.
- Prefer lifting the inspection stage and sprite presentation before altering canonical art or sequence registration.
- A brighter QA render is an inspection aid only and must never be treated as production color grading.

### v0.2.1 phone-QA correction

The 2026-08-19 iPhone recording showed that the correct Auryi and Kineza authority sequences were playing, but both characters remained underexposed in the Lab. Auryi's lavender/ivory read was especially suppressed, while Kineza's dark armor depended too heavily on green effects for readability.

v0.2.1 therefore changed presentation only:

- lifted the inspection-stage midtones;
- increased post-normalization canvas brightness;
- kept contrast close to neutral to avoid crushing shadow detail;
- slightly preserved saturation so character accents remained readable;
- reduced guide/grid prominence;
- did not change frame timing, registration, manifests, or canonical assets.

### v0.2.2 visibility correction

Phone feedback after v0.2.1 still reported materially dark character presentation. v0.2.2 intentionally made the QA view much brighter rather than continuing small adjustments.

- canvas brightness was raised to approximately 1.55x;
- display contrast was reduced to approximately 0.94 to open shadow detail;
- the stage center and overall stage midtones were significantly lighter;
- guide/grid prominence was reduced again;
- sequence timing, registration, manifests, and canonical assets remained unchanged.

### v0.2.3 root-cause correction

The v0.2.2 screenshot proved the darkness was not primarily a sprite or proxy-exposure problem because even the HTML stage title and baseline label were dimmed.

Root cause: the loading overlay remained visually mounted after loading completed. `setLoading('')` cleared its text and set the `hidden` attribute, but the authored `.loading { display:grid; ... }` rule kept the empty overlay rendered above the stage. Because the overlay had a dark semi-opaque background and `z-index:20`, it dimmed the character canvases, stage background, title, guides, and labels together.

v0.2.3 fixes the actual cause:

- `.loading[hidden]{display:none!important}` explicitly removes the overlay after loading;
- emergency canvas brightness is reduced from 1.55x to a normal QA correction near 1.18x;
- contrast returns to neutral;
- the stage remains bright enough for inspection;
- sequence timing, registration, manifests, QA proxies, and canonical art remain unchanged.

### Loading-overlay guardrail

A cleared loading message is not proof that a loading layer has been removed.

For PriZim QA interfaces:

1. loading overlays must have an explicit hidden-state CSS rule such as `.loading[hidden]{display:none!important}`;
2. verify overlay removal by checking content outside the sprite itself, such as headings, guides, and stage background;
3. if both DOM text and canvas art are dimmed together, inspect stacking/overlay state before changing assets, exposure, registration, or timing;
4. do not diagnose proxy darkness from a screenshot until UI layers above the canvas have been ruled out.

This is now a permanent debugging guardrail.

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

- Large silhouette changes should use short or low-overlap blends.
- Similar adjacent poses may use softer blending.
- Judge motion on phone recording, not screenshots alone.
- Blend duration is not the whole animation. Translation, scale settling, easing, and overlap shape are separate motion concerns.

## Motion Bridge rule

Sequence Lab v0.2.4 introduced the PriZim Motion Bridge layer. Its purpose is to extract the best possible animation read from locked canon frames before requesting new bridge art.

Motion Bridge rules:

1. Playback timing must use `requestAnimationFrame` for active transitions and frame holds rather than relying on CSS opacity transitions plus `sleep()` as the primary animation clock.
2. Canon frames remain untouched. Motion Bridge only changes how approved frames travel, overlap, ease, and settle between authored poses.
3. Per-frame registration remains authoritative for final pose placement. Motion Bridge may interpolate toward that placement, but must settle on the authored x/y/scale values.
4. Crossfade overlap is character- and transition-specific. Heavy silhouette changes should reduce simultaneous double-image time instead of increasing blur.
5. A short settle phase may add controlled overshoot or float without changing the source frame.
6. Motion behavior belongs in neutral manifest data, not scattered magic numbers in the renderer.
7. If Motion Bridge cannot make a specific handoff read naturally on phone, PriZim may recommend one or two bridge poses. It must not automatically generate or request them before the existing authority sequence has been measured and tested.

### Current motion profiles

- Prismel: `controlled` profile. Horizontal micro-travel, restrained scale change, medium-low overlap, short settle. Goal: deliberate sorcerer control without ghosting the staff handoff.
- Auryi: `float` profile. Vertical rise, softer easing, high overlap, long settle. Goal: hovering, aura-driven continuity rather than hard pose switching.
- Kineza: `impact` profile. Vertical landing motion, lower overlap, stronger scale settle, fast ease-out. Goal: kinetic weight and snap without mushy double silhouettes.

`tools/pv_forge/sequence_check.py` validates Motion Bridge profile ranges so an invalid QA profile cannot silently enter the tester.

## Continuity Gate rule

Sequence Lab v0.3 adds PriZim Continuity Gate after Motion Bridge.

The pipeline order is:

**Authority frames → Motion Bridge → Continuity Gate → PASS / TUNE / BRIDGE CANDIDATE → constrained repair or generation only when earned → Continuity Gate again → phone QA**

Continuity Gate v0.3 measures adjacent authority-frame pairs for:

- visible height delta
- silhouette width delta
- baseline delta
- visible-body center delta
- lower-body anchor delta
- visible alpha-mass delta
- whole-cell silhouette distance

Each character has its own `continuityGate` thresholds in neutral manifest data. This prevents PriZim from treating legitimate aura bloom or impact effects as the same kind of geometry change as unwanted character drift.

Gate decisions:

- `PASS`: do not generate new character art. Runtime motion may still be tuned if phone QA requests it.
- `TUNE`: try registration, timing, overlap, or motion-profile correction before new art.
- `BRIDGE CANDIDATE`: measured discontinuity is large enough to justify manual review for a surgical bridge pose.

A BRIDGE CANDIDATE is not automatic permission to generate. Phone QA and the Gate result must agree that the handoff is materially distracting.

### Generation handoff

Continuity Gate can emit a bridge specification for any adjacent pair. The specification locks:

- identity and costume
- camera/crop/orientation
- target baseline
- visible center X
- visible height and width envelopes
- lower-body anchor
- source-to-target prop/effect trajectory
- a 50% interpolation target
- post-generation acceptance score

Both neighboring canon frames must be used as strict references. Generation should change only the regions required by the transition.

If a generated bridge fails the Gate, repair from the nearer canon endpoint rather than recreating the whole character from scratch.

The full production contract is documented in `docs/PRIZIM_CONTINUITY_GATE.md`.

`tools/pv_forge/sequence_check.py` validates Continuity Gate threshold ranges and score ordering.

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

## Sequence Lab version history

The v0.2 baseline includes:

- correct Prismel materialization authority
- correct Prismel Prismatic Shard attack authority
- correct Auryi Auorb authority
- correct Kineza gauntlet ignition authority
- direct 3x2 sheet ingestion
- edge-connected near-white removal
- authority-aware manifest validation
- cache-versioned browser loading

v0.2.1 added the brighter phone-readable inspection presentation without changing sequence data.

v0.2.2 added the aggressive visibility experiment that exposed the real stage-layer problem.

v0.2.3 removes the stale loading overlay and restores normal QA exposure while preserving all sequence data and canonical art.

v0.2.4 replaces CSS/sleep-driven pose swapping with the data-driven PriZim Motion Bridge: requestAnimationFrame timing, eased translation/scale interpolation, selective overlap, and character-specific settle behavior. No new character art is introduced in this pass.

v0.3 adds Continuity Gate: measured adjacent-frame scoring, character-specific tolerances, PASS/TUNE/BRIDGE CANDIDATE recommendations, and copyable bridge-generation specifications. Canon art remains unchanged.
