// Dream View Full Encounter Staging — Prototype 03
//
// Presentation-only staging presets layered over the REAL Tactical units.
// Grid coordinates remain authoritative. A staging offset only moves the
// rendered unit container, never the logical unit.
//
// Activate:
//   tactical-field-v2.html?dreamview=stage&preset=fullEncounter
//
// Presets:
//   prismel | party | enemies | fullEncounter
//
// Optional calibration:
//   scale=1.00&zoom=.90&offsetX=0&offsetY=0
//
// Normal Tactical is untouched when ?dreamview=stage is absent.
export default class DreamViewStaging {
  constructor(scene) {
    this.scene = scene;
    this.params = null;
    this._base = new Map();
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dreamview') === 'stage';
  }

  _num(p, key, fallback, min, max) {
    const raw = p.get(key);
    if (raw === null || raw === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? Phaser.Math.Clamp(n, min, max) : fallback;
  }

  _bool(p, key, fallback) {
    const raw = p.get(key);
    if (raw === null) return fallback;
    return !['0', 'false', 'off'].includes(raw.toLowerCase());
  }

  _units() {
    const s = this.scene;
    const u = {};
    s.heroes.forEach(x => u[x.id] = x);
    s.enemies.forEach(x => {
      const key = x.type === 'veil_wraith' ? 'wraith' : x.type;
      if (!u[key]) u[key] = x;
    });
    return u;
  }

  _preset(name) {
    // dx/dy are visual world-pixel offsets from each unit's REAL grid
    // projection. They create composition without corrupting Tactical state.
    const presets = {
      prismel: {
        visible: ['prismel'],
        offsets: { prismel: { dx: 0, dy: 0, scale: 1.18 } },
        zoom: 1.04
      },
      party: {
        visible: ['auryi', 'prismel', 'kineza'],
        offsets: {
          auryi:   { dx: -28, dy: 10, scale: 1.00 },
          prismel: { dx:   0, dy: -4, scale: 1.00 },
          kineza:  { dx:  26, dy: 12, scale: 1.00 }
        },
        zoom: .94
      },
      enemies: {
        visible: ['wraith', 'hushling'],
        offsets: {
          wraith:   { dx: -18, dy: -16, scale: 1.00 },
          hushling: { dx:  22, dy:  10, scale: 1.00 }
        },
        zoom: .92
      },
      fullEncounter: {
        visible: ['auryi', 'prismel', 'kineza', 'wraith', 'hushling'],
        offsets: {
          // Hero wedge: Auryi left/tall, Prismel center, Kineza right/short.
          auryi:   { dx: -30, dy:  14, scale: 1.00 },
          prismel: { dx:   0, dy:   2, scale: 1.00 },
          kineza:  { dx:  28, dy:  16, scale: 1.00 },
          // Enemy contrast: Wraith gains menace from elevation; Hushling
          // gains it from breadth/mass rather than an invented weapon.
          wraith:   { dx: -24, dy: -24, scale: 1.00 },
          hushling: { dx:  28, dy:   8, scale: 1.00 }
        },
        zoom: .88
      }
    };
    return presets[name] || presets.fullEncounter;
  }

  _captureBase(unit) {
    if (!unit || !unit.sprite || this._base.has(unit)) return;
    const p = this.scene.grid.toScreen(unit.x, unit.y);
    this._base.set(unit, { x: p.x, y: p.y, scaleX: unit.sprite.scaleX, scaleY: unit.sprite.scaleY });
  }

  _applyUnit(key, unit, cfg, globalScale) {
    if (!unit || !unit.sprite) return;
    this._captureBase(unit);
    const p = this.scene.grid.toScreen(unit.x, unit.y);
    const dx = cfg?.dx || 0;
    const dy = cfg?.dy || 0;
    const localScale = cfg?.scale || 1;

    unit.sprite.setPosition(p.x + dx, p.y + dy);
    unit.sprite.setScale(globalScale * localScale);

    // Depth follows the VISUAL foot position in staging mode, so overlap
    // remains physically legible even though logical grid positions did not move.
    unit.sprite.setDepth(10 + (p.y + dy) * 0.001);
  }

  _center(keys, units, preset) {
    let x = 0, y = 0, n = 0;
    keys.forEach(key => {
      const u = units[key];
      if (!u) return;
      const p = this.scene.grid.toScreen(u.x, u.y);
      const o = preset.offsets[key] || {};
      x += p.x + (o.dx || 0);
      y += p.y + (o.dy || 0);
      n++;
    });
    return n ? { x: x/n, y: y/n } : { x: 0, y: 0 };
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

  _hideNodes() {
    (this.scene.nodeMarkers || []).forEach(m => {
      if (m?.setVisible) m.setVisible(false);
      else if (m?.container?.setVisible) m.container.setVisible(false);
    });
  }

  _readout(config) {
    const s = this.scene;
    const t = s.add.text(10, 10,
      `DREAM VIEW STAGING\npreset: ${config.name}\nzoom: ${config.zoom.toFixed(2)}  scale: ${config.scale.toFixed(2)}\nlogical grid positions unchanged`,
      {
        fontFamily: 'monospace', fontSize: '12px', color: '#f7e8b6',
        backgroundColor: '#090a14', padding: {x:8,y:8}, lineSpacing: 3
      }
    ).setDepth(9999).setScrollFactor(0);
    if (s.uiAdd) s.uiAdd(t);
  }

  apply() {
    if (!this.isEnabled()) return false;

    const s = this.scene;
    const p = new URLSearchParams(window.location.search);
    this.params = p;

    const nameRaw = p.get('preset') || 'fullEncounter';
    const allowed = new Set(['prismel','party','enemies','fullEncounter']);
    const name = allowed.has(nameRaw) ? nameRaw : 'fullEncounter';
    const preset = this._preset(name);
    const units = this._units();
    const visible = new Set(preset.visible);

    const scale = this._num(p, 'scale', 1.00, .60, 1.60);
    const zoom = this._num(p, 'zoom', preset.zoom, .45, 1.40);
    const offsetX = this._num(p, 'offsetX', 0, -500, 500);
    const offsetY = this._num(p, 'offsetY', 0, -500, 500);
    const hud = this._bool(p, 'hud', false);
    const nodes = this._bool(p, 'nodes', false);
    const labels = this._bool(p, 'labels', true);

    Object.entries(units).forEach(([key, u]) => {
      if (!u?.sprite) return;
      u.sprite.setVisible(visible.has(key));
      if (visible.has(key)) this._applyUnit(key, u, preset.offsets[key], scale);
    });

    // Re-sort the actual world container after visual depth changes.
    if (s.world) s.world.sort('depth');

    if (!hud) this._hideHud();
    if (!nodes) this._hideNodes();

    const c = this._center(preset.visible, units, preset);
    s.tacticalCamera.computeBounds(230);
    s.tacticalCamera.setZoom(zoom);
    const cam = s.cameras.main;
    cam.setScroll(
      c.x + offsetX - s.scale.width/(2*cam.zoom),
      c.y + offsetY - s.scale.height/(2*cam.zoom)
    );
    s.tacticalCamera.clamp();

    s.inputLocked = true;
    if (labels) this._readout({name, zoom, scale});

    window.__PV_DREAM_STAGE__ = {
      preset: name, zoom, scale, offsetX, offsetY,
      visible: [...preset.visible],
      offsets: JSON.parse(JSON.stringify(preset.offsets))
    };
    return true;
  }
}
