// Dream View Tactical Feedback Overlay — Prototype 04
//
// Opt-in visual QA layer for the ACTUAL runtime battlefield.
// It demonstrates the intended contextual tactical language without changing
// combat/pathfinding state.
//
// Activate:
//   tactical-field-v2.html?dreamview=feedback
//
// Optional:
//   hero=prismel|auryi|kineza
//   nodeState=dormant|mixed|restored
//   hud=0|1
//   labels=0|1
//
// Normal Tactical is untouched when absent.
export default class DreamViewTacticalFeedback {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dreamview') === 'feedback';
  }

  _bool(params, key, fallback) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    return !['0','false','off'].includes(raw.toLowerCase());
  }

  _worldGraphics(depth) {
    const g = this.scene.add.graphics().setDepth(depth);
    this.scene.worldAdd(g);
    this.layers.push(g);
    return g;
  }

  // Sampled quadratic-bezier line-to. Graphics has no quadraticBezierTo of
  // its own (that lives on the unrelated Phaser.Curves.Path class) — this
  // assumes an open path already has its moveTo() called and appends
  // straight segments approximating the curve from (x0,y0) through control
  // (cx,cy) to (x1,y1).
  _quadTo(g, x0, y0, cx, cy, x1, y1, segments = 8) {
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const mt = 1 - t;
      const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
      const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
      g.lineTo(x, y);
    }
  }

  _hideHud() {
    const s = this.scene;
    [s.phaseFrame, s.turnText, s.goalFrame, s.goalPrimaryText,
     s.goalSecondaryText, s.messageText, s.heroCardsDrawer]
      .forEach(o => { if (o?.setVisible) o.setVisible(false); });
    if (s.hudHandle?.container) s.hudHandle.container.setVisible(false);
    if (s.actionMenu?.container) s.actionMenu.container.setVisible(false);
    if (s.zoomControls?.container) s.zoomControls.container.setVisible(false);
  }

  _selectionSigil(hero) {
    const s = this.scene;
    const p = s.grid.toScreen(hero.x, hero.y);
    const g = this._worldGraphics(9.1);

    // Dark grounding basin, then two restrained prismatic rings.
    g.fillStyle(0x05060a, 0.22);
    g.fillEllipse(p.x, p.y + 1, 46, 14);

    g.lineStyle(1.4, hero.accent || 0x9fe0ff, 0.68);
    g.strokeEllipse(p.x, p.y, 48, 18);

    g.lineStyle(1, 0xffe8a0, 0.42);
    g.strokeEllipse(p.x, p.y, 58, 22);

    // Four tiny facets, enough to read as authored selection without a plate.
    const facets = [
      [p.x, p.y - 12], [p.x + 31, p.y], [p.x, p.y + 12], [p.x - 31, p.y]
    ];
    g.fillStyle(0xc8a8ff, 0.62);
    facets.forEach(([x,y]) => {
      g.beginPath();
      g.moveTo(x, y - 2.5);
      g.lineTo(x + 2.5, y);
      g.lineTo(x, y + 2.5);
      g.lineTo(x - 2.5, y);
      g.closePath();
      g.fillPath();
    });
  }

  _reachable(hero) {
    const s = this.scene;
    // Use the real Pathfinder rather than inventing a visual-only movement set.
    const reachable = s.pathfinder.reachable(hero.x, hero.y, hero.move, hero);
    // showReachable() walks the {dist, ...} result's own dist Map (see
    // UnitController's identical call) — passing the whole object silently
    // matched the earlier no-args stub during authoring but throws for real
    // once it runs against the live TacticalGrid implementation.
    s.grid.showReachable(reachable.dist);
    return reachable;
  }

  _sampleDestination(hero, reachable) {
    // Prefer a point ahead/right from the party so the demo line is readable.
    const candidates = [
      {x: hero.x + 2, y: hero.y - 1},
      {x: hero.x + 1, y: hero.y - 2},
      {x: hero.x + 2, y: hero.y},
      {x: hero.x + 1, y: hero.y - 1}
    ];
    for (const c of candidates) {
      if (reachable.dist.has(`${c.x},${c.y}`)) return c;
    }
    const first = [...reachable.dist.keys()].find(k => k !== `${hero.x},${hero.y}`);
    if (!first) return {x:hero.x,y:hero.y};
    const [x,y] = first.split(',').map(Number);
    return {x,y};
  }

  _path(hero, destination, reachable) {
    const s = this.scene;
    // TacticalPathfinder has no findPath() — routeTo() reconstructs the
    // shortest path from the reachable() result already computed above,
    // the same call UnitController makes for a real move.
    const path = s.pathfinder.routeTo(hero.x, hero.y, destination.x, destination.y, reachable);
    if (path && path.length) s.grid.showPath(path);
  }

  _targetRing(hero) {
    const s = this.scene;
    // Pick the nearest alive enemy that lies in the hero's real attack range.
    const tiles = s.attackRangeTiles(hero);
    s.grid.showAttackRange(tiles);
    const valid = s.enemies.filter(e => e.alive && tiles.some(t => t.x === e.x && t.y === e.y));
    const enemy = valid[0] || s.enemies.find(e => e.alive);
    if (!enemy) return;

    const p = s.grid.toScreen(enemy.x, enemy.y);
    const g = this._worldGraphics(9.15);
    g.lineStyle(2, 0xd878ff, 0.72);
    g.strokeEllipse(p.x, p.y + 1, 54, 18);
    g.lineStyle(1, 0xff503c, 0.56);
    g.strokeEllipse(p.x, p.y + 1, 64, 22);
    g.fillStyle(0xff503c, 0.40);
    g.fillCircle(p.x, p.y + 1, 2.2);
  }

  _nodeFeedback(state) {
    const s = this.scene;
    const g = this._worldGraphics(7.6);

    const nodeStateFor = id => {
      if (state === 'restored') return 'restored';
      if (state === 'dormant') return 'dormant';
      // mixed: Dogs dormant, Pool restored, Laughter dormant.
      return id === 'pool' ? 'restored' : 'dormant';
    };

    s.nodes.forEach(node => {
      const p = s.grid.toScreen(node.x, node.y);
      const ns = nodeStateFor(node.id);

      if (ns === 'restored') {
        // Warm/prismatic outward response: quiet, local, readable.
        g.lineStyle(1.4, 0xffe8a0, 0.54);
        g.strokeEllipse(p.x, p.y, 34, 12);
        g.lineStyle(1, 0x9fe0ff, 0.40);
        g.strokeEllipse(p.x, p.y, 46, 16);
        g.fillStyle(0xbfeaff, 0.34);
        g.fillCircle(p.x, p.y, 2.2);
      } else {
        // Dormant node is a subtle violet distortion, never a crystal pedestal.
        // Graphics has no quadraticBezierTo (that's Curves.Path, a different
        // class) — approximate the same two-arc squiggle with sampled points.
        g.lineStyle(1.2, 0x9f78ff, 0.46);
        g.beginPath();
        g.moveTo(p.x - 18, p.y + 1);
        this._quadTo(g, p.x - 18, p.y + 1, p.x - 8, p.y - 5, p.x, p.y + 1);
        this._quadTo(g, p.x, p.y + 1, p.x + 8, p.y + 7, p.x + 18, p.y + 1);
        g.strokePath();
        g.fillStyle(0x7f5cff, 0.16);
        g.fillEllipse(p.x, p.y + 2, 26, 8);
      }
    });
  }

  _readout(hero, nodeState) {
    const s = this.scene;
    const txt = s.add.text(10, 10,
      `TACTICAL FEEDBACK QA\nhero: ${hero.name}\nnode state: ${nodeState}\ncontextual overlays only`,
      {
        fontFamily:'monospace', fontSize:'12px', color:'#f7e8b6',
        backgroundColor:'#090a14', padding:{x:8,y:8}, lineSpacing:3
      }
    ).setDepth(9999).setScrollFactor(0);
    s.uiAdd(txt);
  }

  apply() {
    if (!this.isEnabled()) return false;

    const s = this.scene;
    const params = new URLSearchParams(window.location.search);
    const heroId = (params.get('hero') || 'prismel').toLowerCase();
    const hero = s.heroes.find(h => h.id === heroId) || s.heroes.find(h => h.id === 'prismel');
    if (!hero) return false;

    const hud = this._bool(params,'hud',false);
    const labels = this._bool(params,'labels',true);
    const nodeRaw = (params.get('nodeState') || 'mixed').toLowerCase();
    const nodeState = ['dormant','mixed','restored'].includes(nodeRaw) ? nodeRaw : 'mixed';

    if (!hud) this._hideHud();

    // Ensure standard overlays start from a known blank state.
    s.grid.clearAllOverlays();

    this._selectionSigil(hero);
    const reachable = this._reachable(hero);
    const destination = this._sampleDestination(hero, reachable);
    this._path(hero, destination, reachable);
    this._targetRing(hero);
    this._nodeFeedback(nodeState);

    // Frame hero + playable center, not a cinematic close-up.
    s.tacticalCamera.computeBounds(220);
    const landscape = s.scale.width > s.scale.height;
    s.tacticalCamera.setZoom(landscape ? 0.94 : 0.70);
    s.tacticalCamera.focusOn(hero.x + 2, Math.max(0, hero.y - 2), 0);

    // Visual QA only. Prevent state mutation while screenshotting.
    s.inputLocked = true;

    if (labels) this._readout(hero, nodeState);

    window.__PV_TACTICAL_FEEDBACK__ = {
      hero: hero.id,
      destination,
      nodeState,
      reachableCount: reachable.dist.size
    };

    return true;
  }
}
