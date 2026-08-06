// Tactical Field Foundation v2 — TacticalGrid.
// Owns coordinate conversion (isometric diamond projection), bounds,
// occupancy queries, tile selection, and overlay drawing (reachable tiles,
// route preview, attack range). Terrain lookup delegates to TerrainRegistry;
// pathing delegates to TacticalPathfinder — this module only knows geometry
// and who's standing where.
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

  // A tile counts as occupied against `ignoreUnit` only if the occupant is
  // someone else — lets a unit's own starting tile stay "free" while it's
  // mid-selection, per the spec's explicit exception for the moving unit.
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

  // --- Overlays ---

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

  drawDiamond(g, x, y, fillColor, alpha, strokeColor, strokeAlpha) {
    const p = this.toScreen(x, y);
    const pts = this._diamondPoints(p.x, p.y);
    g.fillStyle(fillColor, alpha);
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    g.lineTo(pts[2], pts[3]);
    g.lineTo(pts[4], pts[5]);
    g.lineTo(pts[6], pts[7]);
    g.closePath();
    g.fillPath();
    if (strokeColor !== undefined) {
      g.lineStyle(1, strokeColor, strokeAlpha === undefined ? 1 : strokeAlpha);
      g.strokePath();
    }
  }

  // reachableDist: Map<"x,y", cost> from TacticalPathfinder.reachable().dist
  showReachable(reachableDist) {
    this.ensureOverlays();
    this.tileOverlay.clear();
    reachableDist.forEach((cost, k) => {
      const [x, y] = k.split(',').map(Number);
      this.drawDiamond(this.tileOverlay, x, y, 0x67c8ff, 0.28, 0x9fe0ff, 0.6);
    });
  }

  clearReachable() {
    if (this.tileOverlay) this.tileOverlay.clear();
  }

  showAttackRange(tiles) {
    this.ensureOverlays();
    this.tileOverlay.clear();
    tiles.forEach(t => {
      this.drawDiamond(this.tileOverlay, t.x, t.y, 0xff503c, 0.24, 0xffb3a8, 0.55);
    });
  }

  showPath(path) {
    this.ensureOverlays();
    this.pathOverlay.clear();
    if (!path) return;
    path.forEach(t => {
      this.drawDiamond(this.pathOverlay, t.x, t.y, 0xffe8a0, 0.35, 0xffe8a0, 0.85);
    });
  }

  clearPath() {
    if (this.pathOverlay) this.pathOverlay.clear();
  }

  clearAllOverlays() {
    this.clearReachable();
    this.clearPath();
  }
}
