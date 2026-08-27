# PriZim Modernization Stack

Status date: 2026-08-27

PriZim is the authority, continuity, validation, and modernization layer for The Prismatic Veil. New tooling strengthens the existing game stack; it does not become authority merely by being newer.

## Production authority

- Live renderer: Phaser 3
- Live battle shell: DOM-over-Phaser hybrid
- Live route authority: existing root/menu -> hybrid battle flow
- Current game assets/canon: explicit approved authority only
- Legacy preservation: tactical legacy and survival legacy remain preserved, never promoted accidentally

## Modernization layers

### Phase 1 — TypeScript boundaries + Vite
Status: PASS

Purpose:
- typed PriZim/game contracts
- strict compile boundaries
- modern ESM build pipeline
- hashed/isolated build outputs

Rule: existing proven JavaScript remains valid until a specific seam is deliberately migrated.

### Phase 2 — Vitest
Status: PASS

Purpose:
- fast game-rule validation independent of renderer
- command availability
- RP/Guard/Item policies
- attack-authority completeness
- deterministic logic regression gates

### Phase 3 — Playwright + Chromium/WebKit
Status: PASS

Purpose:
- browser boot smoke
- DOM/hybrid shell validation
- Chromium and WebKit coverage
- phone landscape and portrait gates

Real iPhone testing remains final device authority.

### Phase 4 — Phaser 4 renderer lab
Version: Phaser 4.2.1
Status: PASS AS ISOLATED LAB
Production promotion: NOT APPROVED

Validated:
- strict PV lab code
- Vite multi-page build
- Chromium phone
- WebKit phone
- WebKit portrait
- WebGL renderer
- Glow / Barrel / ColorMatrix filter experiment
- production Phaser 3 files unchanged

Compatibility evidence:
- Phaser 4.2.1 bundled declarations currently require an isolated vendor `skipLibCheck` boundary under TypeScript 7.0.2
- Game Object filters must be explicitly enabled before filter lists are available

Rule: Phaser 4 remains experimental until a representative PV scene proves a material quality/performance advantage over production Phaser 3.

### Phase 5 — Capacitor native-shell prototype
Version: Capacitor 8.5.0
Status: IN VERIFICATION
Production promotion: NOT APPROVED

Architecture:
- dedicated `native-shell/` source
- dedicated `dist-capacitor/` output
- no replacement of live web route
- no committed generated `ios/` or `android/` platform trees during prototype

Verified so far:
- Android wrapper generation/sync: PASS
- Android packaged native-shell asset: PASS
- Android production-runtime integrity guard: PASS
- iOS wrapper generation/sync: PASS
- iOS packaged native-shell asset: PASS
- Xcode project inspection: pending at time of this ledger revision

Current iOS ecosystem note:
Capacitor 8.x has active upstream reports involving current Apple SDK/signature freshness. Prototype compatibility and App Store submission readiness are therefore separate PriZim gates.

## Planned flow

Canon / PV Data
-> PriZim authority + Python Forge
-> TypeScript boundaries
-> Vitest logic gates
-> Vite build adapters
-> Phaser production renderer + DOM mobile shell
-> Playwright Chromium/WebKit
-> real iPhone acceptance
-> Phaser 4 renderer evidence lab
-> Capacitor native wrapper evidence

React remains optional and may later serve only as a UI-shell renderer if PV's menu/inventory/codex/save interfaces become complex enough to justify it.

## Promotion law

A newer layer never replaces a proven layer merely because it exists.

Promotion requires:
1. explicit authority decision
2. automated verification
3. no silent legacy/fallback regression
4. real-device acceptance where applicable
5. preserved rollback path
6. PriZim status update

## Repository hygiene law

- Preserve only intentional legacy/recovery refs.
- Do not rewrite published history just to cosmetically simplify the graph.
- Remove stale live branches after their unique value is either merged, explicitly archived, or proven obsolete.
- Experimental modernization branches are temporary evidence branches, not permanent parallel product lines.
