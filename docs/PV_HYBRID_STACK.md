# Prismatic Veil Hybrid Stack

Status: **LOCKED production direction** (2026-08-19)

The project is engine-independent by design. Phaser is the current renderer, not the definition of the game.

## Stack

1. **Python / PV Forge**
   - asset inspection and normalization
   - animation registration/anchor analysis
   - data validation
   - balance and tactical simulations
   - build-time generation of renderer adapters

2. **Neutral PV Data**
   - JSON is the canonical source for character, ability, encounter, animation, and presentation metadata
   - data must not depend on Phaser, Unity, Godot, or iOS APIs

3. **TypeScript Game Core**
   - combat rules
   - turn/state logic
   - tactical rules
   - typed contracts between game data and renderers
   - migration is incremental; validated JavaScript is not rewritten merely for style

4. **Current Runtime**
   - Phaser: battlefield, actors, camera, world-space targeting, animation, particles/FX
   - PV Mobile Shell (HTML/CSS): phone-first HUD, menus, readable/tappable UI

5. **Future Renderers**
   - Unity/C#, Godot/GDScript, or another client may consume the same neutral PV data
   - engine migration is optional and must be proven by a vertical slice before full commitment

## Rules

- New presentation UI should be phone-first and PV-specific, not generic mobile UI.
- PV identity comes from prismatic geometry, navy/violet/gold materials, restrained spectral motion, and character-specific accents.
- Keep world-space information in the renderer; keep reading/tapping interface in the Mobile Shell.
- Build-time analysis belongs in Python whenever possible instead of doing expensive or fragile image analysis on the phone.
- Canonical data lives outside renderer-specific code.
- Generated adapter files are replaceable outputs, not canonical sources.
- Short, testable vertical slices remain the default delivery unit.

## First implementation

`pv-data/animations/prismel_active_turn.registration.json` is the first canonical neutral animation-registration record.

`tools/pv_forge/pv_forge.py` validates that data and generates the Phaser adapter consumed by the active-turn presenter.

This lets the current Prismel registration problem improve the production pipeline at the same time.
