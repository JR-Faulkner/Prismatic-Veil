// Tactical Field Foundation v2 — TacticalGrid.
// Too Quiet Cinematic Batch 01: grid logic remains authoritative, while
// visible feedback is reduced to contextual tactical cues.
//
// Owns coordinate conversion (isometric diamond projection), bounds,
// occupancy queries, tile selection, and overlay drawing. Terrain lookup
// delegates to TerrainRegistry; pathing delegates to TacticalPathfinder.
export default class TacticalGrid {
  constructor(scene, mapData, terrainRegistry) {
    this.scene = scene;
    this.terrain = terrainRegistry;
    this.columns = mapData.grid.columns;
    this.rows = mapData.grid.rows;
    this.legend = mapData.terrainLegend;
    this.terrainRows = mapData.terrainRows;

    this.originX = 0;
    this.originY = 0;
    this.tileHalfW = 34;
    this.tileHalfH = 17;

    // "x,y" -> unit reference (hero or enemy object with .x/.y)
    this.occupancy = new Map();

    this.tileOverlay = null;
    this.pathOverlay = null;
  }

  w(obj) {
    if (this.scene.worldAdd) this.scene.worldAdd(obj);
    return obj;
  }

  key(x, y) {
    return x + ',' + y;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.columns && y >= 0 && y < this.rows;
  }

  terrainAt(x, y) {
    if (!this.inBounds(x, y)) return 'barrier';
    const ch = this.terrainRows[y][x];
    return this.legend[ch] || 'open';
  }

  setOrigin(x, y, halfW, halfH) {
    this.originX = x;
    this.originY = y;
    this.tileHalfW = halfW;
    this.tileHalfH = halfH;
  }

  toScreen(x, y) {
    return {
      x: this.originX + (x - y) * this.tileHalfW,
      y: this.originY + (x + y) * this.tileHalfH
    };
  }

  // Inverse isometric projection — screen point to nearest grid tile.
  toGrid(px, py) {
    const dx = px - this.originX;
    const dy = py - this.originY;
    const a = dx / this.tileHalfW;
    const b = dy / this.tileHalfH;
    const x = Math.round((a + b) / 2);
    const y = Math.round((b - a) / 2);
    return { x, y };
  }

  // --- Occupancy ---

  setOccupant(x, y, unit) {
    this.occupancy.set(this.key(x, y), unit);
  }

  clearOccupant(x, y) {
    this.occupancy.delete(this.key(x, y));
  }

  occupantAt(x, y) {
    return this.occupancy.get(this.key(x, y)) || null;
  }

  isOccupied(x, y, ignoreUnit) {
    const o = this.occupantAt(x, y);
    return !!o && o !== ignoreUnit;
  }

  // --- Screen-space bounds of the whole board, for camera clamping ---

  screenBounds() {
    const corners = [
      this.toScreen(0, 0),
      this.toScreen(this.columns - 1, 0),
      this.toScreen(0, this.rows - 1),
      this.toScreen(this.columns - 1, this.rows - 1)
    ];
    const xs = corners.map(c => c.x);
    const ys = corners.map(c => c.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  // --- Contextual overlays ---

  ensureOverlays() {
    if (!this.tileOverlay) this.tileOverlay = this.w(this.scene.add.graphics().setDepth(5));
    if (!this.pathOverlay) this.pathOverlay = this.w(this.scene.add.graphics().setDepth(6));
  }

  _diamondPoints(cx, cy) {
    return [
      cx, cy - this.tileHalfH,
      cx + this.tileHalfW, cy,
      cx, cy + this.tileHalfH,
      cx - this.tileHalfW, cy
    ];
  }

  _traceDiamond(g, x, y) {
    const p = this.toScreen(x, y);
    const pts = this._diamondPoints(p.x, p.y);
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    g.lineTo(pts[2], pts[3]);
    g.lineTo(pts[4], pts[5]);
    g.lineTo(pts[6], pts[7]);
    g.closePath();
    return p;
  }

  drawDiamond(g, x, y, fillColor, alpha, strokeColor, strokeAlpha) {
    this._traceDiamond(g, x, y);
    g.fillStyle(fillColor, alpha);
    g.fillPath();
    if (strokeColor !== undefined) {
      g.lineStyle(1, strokeColor, strokeAlpha === undefined ? 1 : strokeAlpha);
      g.strokePath();
    }
  }

  // Reachability is now a restrained prismatic ground response rather
  // than a carpet of opaque blue diamonds. The logical reachable set is
  // unchanged; only its presentation changes.
  showReachable(reachableDist) {
    this.ensureOverlays();
    this.tileOverlay.clear();

    reachableDist.forEach((cost, k) => {
      const [x, y] = k.split(',').map(Number);
      const p = this._traceDiamond(this.tileOverlay, x, y);
      this.tileOverlay.fillStyle(0x67c8ff, 0.045);
      this.tileOverlay.fillPath();
      this.tileOverlay.lineStyle(1, 0x9fe0ff, 0.24);
      this.tileOverlay.strokePath();

      // Tiny ground glint breaks up the "tile overlay" read while keeping
      // every reachable destination discoverable on touch.
      this.tileOverlay.fillStyle(0xbfeaff, 0.16);
      this.tileOverlay.fillCircle(p.x, p.y, 1.6);
    });
  }

  clearReachable() {
    if (this.tileOverlay) this.tileOverlay.clear();
  }

  // Targeting keeps a restrained red/violet edge language with almost no
  // fill, so enemy threat/attack feedback does not obscure the battlefield.
  showAttackRange(tiles) {
    this.ensureOverlays();
    this.tileOverlay.clear();
    tiles.forEach(t => {
      this._traceDiamond(this.tileOverlay, t.x, t.y);
      this.tileOverlay.fillStyle(0xff503c, 0.025);
      this.tileOverlay.fillPath();
      this.tileOverlay.lineStyle(1.25, 0xd878ff, 0.42);
      this.tileOverlay.strokePath();
    });
  }

  // Path preview is a narrow Resonance thread through tile centers with a
  // clear destination sigil. No permanent or filled path diamonds.
  showPath(path) {
    this.ensureOverlays();
    this.pathOverlay.clear();
    if (!path || path.length === 0) return;

    const points = path.map(t => this.toScreen(t.x, t.y));

    if (points.length > 1) {
      // Soft under-thread.
      this.pathOverlay.lineStyle(7, 0x6b7dff, 0.10);
      this.pathOverlay.beginPath();
      this.pathOverlay.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.pathOverlay.lineTo(points[i].x, points[i].y);
      }
      this.pathOverlay.strokePath();

      // Crisp Resonance core.
      this.pathOverlay.lineStyle(2.4, 0x9fe0ff, 0.82);
      this.pathOverlay.beginPath();
      this.pathOverlay.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.pathOverlay.lineTo(points[i].x, points[i].y);
      }
      this.pathOverlay.strokePath();
    }

    // Destination marker, separate from the selected-unit sigil.
    const d = points[points.length - 1];
    this.pathOverlay.lineStyle(2, 0xffe8a0, 0.88);
    this.pathOverlay.strokeCircle(d.x, d.y, Math.max(6, this.tileHalfH * 0.42));
    this.pathOverlay.lineStyle(1, 0xc8a8ff, 0.62);
    this.pathOverlay.strokeCircle(d.x, d.y, Math.max(10, this.tileHalfH * 0.68));
    this.pathOverlay.fillStyle(0xffe8a0, 0.38);
    this.pathOverlay.fillCircle(d.x, d.y, 2.2);
  }

  clearPath() {
    if (this.pathOverlay) this.pathOverlay.clear();
  }

  clearAllOverlays() {
    this.clearReachable();
    this.clearPath();
  }
}
