// 06B — Tactical View Flavor Audition.
//
// Production question: keep the proven 12x10 tactical rules and compare how
// the battlefield is PRESENTED on phone. Pathing, occupancy, ranges, terrain,
// LOS, commands, and encounter state remain inherited and untouched.
//
// Query param:
//   ?flavor=classic  -> existing 2:1 isometric baseline
//   ?flavor=shallow  -> flatter projection for stronger backyard/map read
//   ?flavor=hybrid   -> shallow projection + mild selected-hero camera push
//
// This QA wrapper intentionally does not install the temporary 06A Auryi /
// Kineza battle-pose substitutions. Their new Attack Master A art is locked
// separately and is being ingested through PriZim. 06B is a map-view audition.

import IntegratedTacticalScene05M from './IntegratedTacticalScene05M.js?v=2';

const FLAVORS = Object.freeze({
  classic: Object.freeze({
    label: 'CLASSIC ISO',
    halfW: 34,
    halfH: 17,
    landscapeZoom: 0.95,
    portraitZoom: 0.68,
    focusPush: 0
  }),
  shallow: Object.freeze({
    label: 'SHALLOW ISO',
    halfW: 34,
    halfH: 13,
    landscapeZoom: 1.02,
    portraitZoom: 0.76,
    focusPush: 0
  }),
  hybrid: Object.freeze({
    label: 'HYBRID FOCUS',
    halfW: 36,
    halfH: 13.5,
    landscapeZoom: 1.00,
    portraitZoom: 0.75,
    focusPush: 0.11
  })
});

export default class IntegratedTacticalViewFlavor06B extends IntegratedTacticalScene05M {
  constructor() {
    super();
    this._viewFlavor06B = FLAVORS.shallow;
    this._viewFlavorKey06B = 'shallow';
  }

  _readFlavor06B() {
    if (typeof window === 'undefined') return 'shallow';
    const raw = new URLSearchParams(window.location.search).get('flavor') || 'shallow';
    return Object.prototype.hasOwnProperty.call(FLAVORS, raw) ? raw : 'shallow';
  }

  _flavorZoom06B(cfg = this._viewFlavor06B) {
    const landscape = this.scale.width > this.scale.height;
    return landscape ? cfg.landscapeZoom : cfg.portraitZoom;
  }

  _stageCloseLawn06B() {
    const byHero = id => (this.heroes || []).find(h => h.id === id);
    const byEnemy = id => (this.enemies || []).find(e => e.id === id && e.alive);
    const auryi = byHero('auryi');
    const prismel = byHero('prismel');
    const kineza = byHero('kineza');
    const h1 = byEnemy('hushling_1');
    const h2 = byEnemy('hushling_2');
    const h3 = byEnemy('hushling_3');
    if (!auryi || !prismel || !kineza || !h1 || !h2 || !h3) return;

    // Same production-QA neighborhood as 06A, all on open lawn and well away
    // from Pool Splash (2,9). Close staging makes selection, ranges, overlap,
    // and camera behavior easy to compare without walking across the map.
    this._moveUnitForQa(auryi, 7, 5);
    this._moveUnitForQa(prismel, 8, 6);
    this._moveUnitForQa(kineza, 8, 7);
    this._moveUnitForQa(h1, 9, 5);
    this._moveUnitForQa(h2, 10, 6);
    this._moveUnitForQa(h3, 9, 7);

    if (this.unitController?.clearSelection) this.unitController.clearSelection();
    this.grid.clearAllOverlays();
  }

  _refreshProjection06B() {
    const cfg = this._viewFlavor06B;

    // Projection only. Logical grid coordinates remain exactly the same.
    this.grid.setOrigin(0, 0, cfg.halfW, cfg.halfH);
    this.grid.clearAllOverlays();

    // The illustrated environment transform is derived from grid.screenBounds.
    // It caches its six common-canvas layers after first construction, so the
    // QA wrapper explicitly clears that presentation cache before redrawing at
    // the new projection. No combat or map data is changed.
    if (this.environment && typeof this.environment._clearArt === 'function') {
      this.environment._clearArt();
    }

    this.heroes.forEach(u => this._placeUnitSprite(u));
    this.enemies.forEach(u => this._placeUnitSprite(u));
    this.drawBoard();
    this.drawNodes();

    this.tacticalCamera.computeBounds(220);
    this.tacticalCamera.defaultZoom = this._flavorZoom06B(cfg);
    this.tacticalCamera.setZoom(this._flavorZoom06B(cfg));
    this.tacticalCamera.focusOn(8.7, 6.2, 0);
    this.refreshHUD();
    this.setMessage(`06B VIEW AUDITION • ${cfg.label} • rules unchanged`);

    if (typeof window !== 'undefined') {
      window.__PV_TACTICAL_FLAVOR__ = {
        key: this._viewFlavorKey06B,
        label: cfg.label,
        halfW: cfg.halfW,
        halfH: cfg.halfH,
        zoom: this._flavorZoom06B(cfg),
        logicalGrid: '12x10 orthogonal unchanged'
      };
    }
  }

  selectHero(hero) {
    super.selectHero(hero);
    if (!hero || this._viewFlavorKey06B !== 'hybrid') return;

    // Hybrid keeps planning readable at the shallow-map zoom, then adds only a
    // modest selected-unit push. This is deliberately nowhere near the active-
    // turn cinematic framing; it is a bridge between map thinking and drama.
    const base = this._flavorZoom06B();
    const target = Math.min(1.35, base + this._viewFlavor06B.focusPush);
    this.cameras.main.zoomTo(target, 230, 'Sine.easeOut', true);
    this.tacticalCamera.focusOn(hero.x, hero.y, 230);
  }

  create() {
    this._viewFlavorKey06B = this._readFlavor06B();
    this._viewFlavor06B = FLAVORS[this._viewFlavorKey06B];

    super.create();
    this._stageCloseLawn06B();

    // Run after inherited create-time camera/dream-view recentering. A single
    // deterministic refresh is enough; this is an audition, not a new engine.
    this.time.delayedCall(180, () => this._refreshProjection06B());
  }
}
