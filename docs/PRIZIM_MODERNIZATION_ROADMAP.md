# PriZim Modernization Roadmap

Status: **ACTIVE**

PriZim remains the project-wide authority/continuity system. Modernization strengthens that system incrementally; it does not replace the working Phaser + DOM game with a framework rewrite.

## Modernization sequence

1. **TypeScript boundaries**
   - define typed contracts at seams first
   - existing proven JavaScript remains valid
   - migrate implementation only when touched for real work

2. **Vite build/dev layer**
   - fast ESM development server
   - production asset hashing and source maps
   - eliminate hand-maintained cache-query generations when production routing migrates
   - first landing is an isolated modernization probe, not the live game

3. **Vitest logic gates**
   - battle-state contracts
   - command availability
   - attack-authority validation
   - legacy/current route boundaries
   - natural victory/defeat state transitions

4. **Playwright + WebKit acceptance automation**
   - Chromium + WebKit
   - phone landscape and portrait gates
   - DOM/Phaser bridge smoke
   - attack-size regression checks where measurable
   - real iPhone remains final acceptance authority

5. **Phaser 4 renderer lab**
   - isolated renderer experiment only
   - prove one vertical slice before migration
   - focus on Veil filters, spectral distortion, prismatic FX, camera/presentation quality
   - neutral PV data/core stay renderer-independent

6. **Capacitor mobile prototype**
   - package the proven web client as native iOS/Android shell
   - evaluate native audio session, haptics, filesystem/save, app lifecycle
   - no Swift/Kotlin rewrite of the game core

## Non-goals

- no React requirement
- no rewrite-first TypeScript migration
- no new global state library without a proven need
- no ECS framework without scale pressure that justifies it
- no Phaser 4 migration before renderer-lab acceptance
- no Capacitor packaging before the web runtime is stable under automated WebKit checks

## PriZim authority rule

The canonical flow is:

`Canon / Neutral PV Data -> typed contracts + validation -> game core -> renderer adapter -> Phaser world + PV DOM shell -> automated browser gates -> real-device acceptance`

Current and preserved-legacy surfaces must be explicitly identified. A fallback may preserve function, but it must never masquerade as current authority.

## Phase 1 acceptance

Phase 1 is complete only when:

- `npm install` succeeds on supported Node
- `npm run typecheck` passes
- `npm run build:modern` builds the isolated probe
- existing live `index.html` and battle routes are unchanged
- modernization branch contains no generated `dist-modernization/` output

After that, Phase 2 moves the first real runtime boundary into TypeScript and adds Vitest.
