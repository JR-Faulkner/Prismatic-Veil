# Core of More Status

Last updated: 2026-09-17

## Scope

Core of More is a standalone Dungeon Core add-on reached from the Prismatic Veil site at `core-of-more.html`.

It is not MOBMUGEN and it is not the live PV battle/overworld authority. Keep its state and notes separate from `mugen-lab/`, `PV_LIVE_AUTHORITY.json`, `PV_RESUME_ANCHOR.md`, `PRIZIM_LIVE_NOTEPAD.md`, and `live-build.json` unless a future change explicitly promotes cross-game integration.

## Current Build

- Prototype page: `core-of-more.html`.
- Intended main-page entry: bottom-right `CORE OF MORE` badge in `index.html`.
- Save key: `pv_core_of_more_v2`.
- Current direction: living dungeon board with connected rooms, essence economy, visitor pressure, minion jobs, room synergies, and light PV seasoning only where it supports the larger setting.

## Design Direction

Core of More should mostly stand on its own. A pinch of PV flavor is allowed: Veil-touched rooms, faint Prism/Rift/Echo language, or future hooks into optional PV rumors/rewards. Avoid turning it into a PV subsystem too early.

The central identity is escalation: small dungeon elements become more than expected. A room becomes an ecosystem, a minion becomes a faction, treasure becomes bait, and visitors become recurring pressure.

## Current Gameplay Loop

1. Gather essence.
2. Excavate connected rooms from available neighboring chambers.
3. Assign minions to jobs.
4. Study visitors to improve insight.
5. End the day to resolve visitor pressure and passive room/minion income.

## Next Good Steps

- Add named visitor parties with traits and memory.
- Add route planning through connected rooms.
- Add treasure/bait decisions and visitor satisfaction/fear outcomes.
- Add room upgrade tiers.
- Add one or two Core-specific minion personalities.
- Add a richer visual board once the system loop feels right.

## Validation

After edits, verify:

- `core-of-more.html` loads locally and on GitHub Pages.
- Room/build/action buttons update state.
- Inline JavaScript compiles.
- PV preflight still passes if `index.html` or other PV route-adjacent files changed.
