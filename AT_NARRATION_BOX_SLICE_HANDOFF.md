# A+T: Narrative / Action Log box resize — handoff for DAI

## The ask
Right now both boxes are locked to a fixed frame size. Long text scrolls inside
them with the scrollbar hidden, which reads as "the text got cut off" rather
than "scroll for more." We want the boxes to grow taller to fit their text
instead of scrolling — without distorting the painted frame art.

## Files
- `narration_panel_shell_v4216.svg` — native viewBox `0 0 884 330`
- `action_log_panel_shell_v4217.svg` — native viewBox `0 0 884 250`
- both under `assets/ui/behemoth2/production/`

## Current state (why this needs new art, not just CSS)
Both boxes are currently forced to `aspect-ratio:884/429` in
`assets/at-game-v42114.css` (`.narrationShell` / `.actionLogShell`), and the
SVG is drawn via `object-fit:fill` inside that box. That means:
- Narration art is already being stretched ~1.3x vertically past its native
  330 height (884/330 → 884/429).
- Action Log art is being stretched ~1.7x vertically past its native 250
  height (884/250 → 884/429).

Both still look OK because the panels are mostly flat metal with a border,
but this is the ceiling of how far a flat stretch can go before the corner
bevels and rivets visibly warp. Making the box grow further with plain
`object-fit:fill` will start distorting the frame.

## What we need instead
A slice-based frame, not a flat stretch: fixed-size corners, a rail that
tiles or stretches along one axis only, and a flat center fill that can
grow freely in height. This repo has already hit this exact problem once —
see `CLAUDE.md`, the trap entry **"Painted panel art does not nine-slice"**
(command window sheet 04A in the other Prismatic Veil project). The fix
there was: one corner slice, flipped four ways, plus a stretchable rail —
not a naive CSS nine-slice or a flat scale. Same approach applies here.

Concretely, for each panel we need either:
- Separate corner/edge/fill image slices DAI can export directly, or
- The full panel re-authored tall enough to cover the worst-case text
  length we'll hand over, with the same corner/rivet detail scaled
  correctly (no stretching) at that larger size.

## Current CSS contract (so the new art drops in cleanly)
- `.narrationShell` / `.actionLogShell` — the frame's outer box
- `.narrationViewport` / `.actionViewport` — the text-safe inset, currently
  percentage-based: narration `top:19% bottom:21% left:7.5% right:8%`,
  action log `top:27% bottom:23% left:8.3% right:14.5%`
- These insets will need to be re-measured against whatever new art comes
  back, the same way the current ones were derived from the existing SVGs.

## Verification expected back
Whatever DAI sends back, we'll re-derive the viewport insets from the new
art's actual geometry (not eyeballed) and confirm the corners/rivets stay
undistorted at both a short line of text and a long, multi-paragraph one,
before it goes live.
