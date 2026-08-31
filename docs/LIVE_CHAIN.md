# Canonical Live Chain

The Prismatic Veil has one live authority:

```text
index.html
  -> story-scroll.html
      -> hybrid-main.html
  -> pza-main.html
```

`live-build.json` is the single live deployment generation ID.

## Preserved templates

- `hybrid-battle-live.html` is the preserved Hybrid presentation template.
- `a-lab.html` is the preserved PZ-A presentation template.

The canonical wrappers load these templates using the current build ID and remap compatibility imports to the same live generation.

## Preserved historical/reference surfaces

Tactical pages, old battle tests, old attack tests, compatibility shims, and historical assets may remain in the repository as inert reference. They must not be routed from `index.html`, `story-scroll.html`, `hybrid-main.html`, or `pza-main.html` unless explicitly promoted again.

The legacy `tactical.webmanifest` remains only for backward compatibility with previously installed shortcuts. The canonical Home Screen manifest is `prismatic-veil.webmanifest`.

## Updating live

After any live JavaScript, attack, or runtime asset change:

1. Make the code or asset change.
2. Bump only the `id` in `live-build.json`.
3. Deploy `main`.
4. Verify the canonical Home flow.

Do not add feature-specific version query strings to the canonical Home or Story routes. Do not promote preserved test/history pages into the live chain without an explicit project decision.
