// Dream View Calibration Sandbox — Prototype 02
//
// Opt-in, presentation-only runtime calibrator for the ACTUAL shipped
// Tactical character assets and Too Quiet environment.
//
// Activate:
//   tactical-field-v2.html?dreamview=calibrate
//
// Useful params:
//   focus=prismel|auryi|kineza|wraith|hushling|party|all
//   scale=1.00        global character scale multiplier
//   zoom=0.95         Tactical camera zoom
//   offsetX=0         camera focus offset in world px
//   offsetY=0
//   hud=0|1           show/hide Tactical HUD
//   nodes=0|1         show/hide sound-node visuals
//   labels=0|1        calibration readout
//
// Per-unit scale overrides:
//   prismelScale=1.00
//   auryiScale=1.00
//   kinezaScale=1.00
//   wraithScale=1.00
//   hushlingScale=1.00
//
// Examples:
//   ?dreamview=calibrate&focus=prismel&scale=1.25&zoom=1.05
//   ?dreamview=calibrate&focus=party&zoom=.92&hud=0&nodes=0
//   ?dreamview=calibrate&focus=all&hushlingScale=1.12&wraithScale=.96
//
// This module never changes grid coordinates, stats, pathfinding, combat,
// token textures, or normal gameplay when the query parameter is absent.
export default class DreamViewCalibrationSandbox {
  constructor(scene) {
    this.scene = scene;
    this.params = null;
    this.readout = null;
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dreamview') === 'calibrate';
  }

  _num(params, key, fallback, min, max) {
    const raw = params.get(key);
    if (raw === null || raw === '') return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Phaser.Math.Clamp(n, min, max);
  }

  _bool(params, key, fallback) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    return raw !== '0' && raw !== 'false' && raw !== 'off';
  }

  _unitMap() {
    const s = this.scene;
    const byId = {};
    s.heroes.forEach(u => byId[u.id] = u);
    s.enemies.forEach(u => {
      // Friendly URL names.
      const key = u.type === 'veil_wraith' ? 'wraith' : u.type;
      if (!(key in byId)) byId[key] = u;
    });
    return byId;
  }

  _selectedUnits(focus, units) {
    if (focus === 'party') {
      return ['auryi', 'prismel', 'kineza'].map(k => units[k]).filter(Boolean);
    }
    if (focus === 'all') {
      return Object.values(units);
    }
    return units[focus] ? [units[focus]] : [units.prismel].filter(Boolean);
  }

  _centerOf(units) {
    if (!units.length) return { x: 0, y: 0 };
    const s = this.scene;
    let sx = 0, sy = 0;
    units.forEach(u => {
      const p = s.grid.toScreen(u.x, u.y);
      sx += p.x; sy += p.y;
    });
    return { x: sx / units.length, y: sy / units.length };
  }

  _hideHud() {
    const s = this.scene;
    [
      s.phaseFrame, s.turnText, s.goalFrame, s.goalPrimaryText,
      s.goalSecondaryText, s.messageText, s.heroCardsDrawer
    ].forEach(o => { if (o && o.setVisible) o.setVisible(false); });
    if (s.hudHandle && s.hudHandle.container) s.hudHandle.container.setVisible(false);
    if (s.actionMenu && s.actionMenu.container) s.actionMenu.container.setVisible(false);
    if (s.zoomControls && s.zoomControls.container) s.zoomControls.container.setVisible(false);
  }

  _hideNodes() {
    (this.scene.nodeMarkers || []).forEach(marker => {
      if (marker && marker.setVisible) marker.setVisible(false);
      else if (marker && marker.container && marker.container.setVisible) marker.container.setVisible(false);
    });
  }

  _applyScales(units, globalScale, params) {
    const perUnitKeys = {
      prismel: 'prismelScale',
      auryi: 'auryiScale',
      kineza: 'kinezaScale',
      wraith: 'wraithScale',
      hushling: 'hushlingScale'
    };

    Object.entries(units).forEach(([key, unit]) => {
      if (!unit || !unit.sprite) return;
      const local = this._num(params, perUnitKeys[key], 1, 0.55, 1.8);
      // Scale the container, preserving image + silhouette + contact shadow
      // registration authored by TacticalScene._buildCharacterToken().
      unit.sprite.setScale(globalScale * local);
    });
  }

  _setVisibility(focus, units) {
    // In "all" we see everybody. "party" shows the trio. Single-focus modes
    // show one unit so silhouette/scale can be judged in isolation.
    const selected = new Set(this._selectedUnits(focus, units));
    Object.values(units).forEach(unit => {
      if (unit && unit.sprite) unit.sprite.setVisible(selected.has(unit));
    });
  }

  _buildReadout(config) {
    const s = this.scene;
    const pad = 8;
    const lines = [
      'DREAM VIEW CALIBRATION',
      `focus: ${config.focus}`,
      `zoom: ${config.zoom.toFixed(2)}  global scale: ${config.globalScale.toFixed(2)}`,
      `offset: ${config.offsetX}, ${config.offsetY}`,
      `HUD: ${config.hud ? 'on' : 'off'}  nodes: ${config.nodes ? 'on' : 'off'}`,
      'edit URL params + reload'
    ];
    const text = s.add.text(0, 0, lines.join('\n'), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f7e8b6',
      backgroundColor: '#090a14',
      padding: { x: pad, y: pad },
      lineSpacing: 3
    }).setOrigin(0, 0).setDepth(9999).setScrollFactor(0);

    // UI layer/camera keeps readout fixed even while Tactical camera moves.
    if (s.uiAdd) s.uiAdd(text);
    this.readout = text;

    const place = () => text.setPosition(10, Math.max(10, s.scale.height - text.height - 10));
    place();
    s.scale.on('resize', place);
    s.events.once('shutdown', () => s.scale.off('resize', place));
  }

  apply() {
    if (!this.isEnabled()) return false;

    const s = this.scene;
    const params = new URLSearchParams(window.location.search);
    this.params = params;

    const units = this._unitMap();
    const focusRaw = (params.get('focus') || 'all').toLowerCase();
    const allowed = new Set(['prismel', 'auryi', 'kineza', 'wraith', 'hushling', 'party', 'all']);
    const focus = allowed.has(focusRaw) ? focusRaw : 'all';

    const globalScale = this._num(params, 'scale', 1.00, 0.55, 1.80);
    const zoom = this._num(
      params, 'zoom',
      s.scale.width > s.scale.height ? 0.96 : 0.70,
      0.45, 1.45
    );
    const offsetX = this._num(params, 'offsetX', 0, -500, 500);
    const offsetY = this._num(params, 'offsetY', 0, -500, 500);
    const hud = this._bool(params, 'hud', false);
    const nodes = this._bool(params, 'nodes', false);
    const labels = this._bool(params, 'labels', true);

    this._setVisibility(focus, units);
    this._applyScales(units, globalScale, params);
    if (!hud) this._hideHud();
    if (!nodes) this._hideNodes();

    const chosen = this._selectedUnits(focus, units);
    const center = this._centerOf(chosen);

    s.tacticalCamera.computeBounds(220);
    s.tacticalCamera.setZoom(zoom);

    const cam = s.cameras.main;
    const focusX = center.x + offsetX;
    const focusY = center.y + offsetY;
    cam.setScroll(
      focusX - s.scale.width / (2 * cam.zoom),
      focusY - s.scale.height / (2 * cam.zoom)
    );
    s.tacticalCamera.clamp();

    // Calibration is screenshot/visual QA, not gameplay. Prevent taps from
    // changing state while someone is tuning scale/framing.
    s.inputLocked = true;

    if (labels) {
      this._buildReadout({ focus, zoom, globalScale, offsetX, offsetY, hud, nodes });
    }

    // Expose the resolved values in DevTools without coupling normal gameplay.
    window.__PV_DREAM_VIEW__ = {
      focus, zoom, globalScale, offsetX, offsetY, hud, nodes,
      unitScales: {
        prismel: this._num(params, 'prismelScale', 1, .55, 1.8),
        auryi: this._num(params, 'auryiScale', 1, .55, 1.8),
        kineza: this._num(params, 'kinezaScale', 1, .55, 1.8),
        wraith: this._num(params, 'wraithScale', 1, .55, 1.8),
        hushling: this._num(params, 'hushlingScale', 1, .55, 1.8)
      }
    };

    return true;
  }
}
