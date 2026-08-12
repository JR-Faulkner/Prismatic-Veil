// Too Quiet Cinematic Environment Layer — Batch 01
//
// Presentation-only. TacticalGrid remains the source of truth for movement,
// occupancy, hit testing, terrain, pathfinding, and line of sight.
//
// This first batch deliberately ships without new runtime environment art.
// It removes the permanent grid-carpet read now, creates environment-aware
// sound-node motifs, and establishes the insertion point for future layered
// backyard masters without forcing a rewrite of TacticalScene.
export default class TacticalEnvironmentLayer {
  constructor(scene, grid, mapData) {
    this.scene = scene;
    this.grid = grid;
    this.mapData = mapData;
    this.nodeObjects = [];
  }

  // One continuous lawn plane replaces 120 individually-outlined visible
  // grid cells. Terrain exceptions remain as quiet local cues.
  drawBattlefield(g) {
    g.clear();

    const hw = this.grid.tileHalfW;
    const hh = this.grid.tileHalfH;
    const top = this.grid.toScreen(0, 0);
    const right = this.grid.toScreen(this.grid.columns - 1, 0);
    const bottom = this.grid.toScreen(this.grid.columns - 1, this.grid.rows - 1);
    const left = this.grid.toScreen(0, this.grid.rows - 1);

    // Night lawn / suburban ground foundation.
    g.fillStyle(0x172719, 0.96);
    g.beginPath();
    g.moveTo(top.x, top.y - hh);
    g.lineTo(right.x + hw, right.y);
    g.lineTo(bottom.x, bottom.y + hh);
    g.lineTo(left.x - hw, left.y);
    g.closePath();
    g.fillPath();

    // Soft moonlit wash to keep the center readable.
    g.fillStyle(0x28364b, 0.16);
    g.beginPath();
    g.moveTo(top.x, top.y - hh * 0.7);
    g.lineTo(right.x + hw * 0.75, right.y);
    g.lineTo(bottom.x, bottom.y + hh * 0.55);
    g.lineTo(left.x - hw * 0.75, left.y);
    g.closePath();
    g.fillPath();

    for (let y = 0; y < this.grid.rows; y++) {
      for (let x = 0; x < this.grid.columns; x++) {
        const type = this.grid.terrainAt(x, y);
        if (type === 'open') continue;

        if (type === 'difficult') {
          // Subtle disturbed-earth / clutter patch.
          this.grid.drawDiamond(g, x, y, 0x5b4a34, 0.23);
        } else if (type === 'barrier') {
          // Barrier logic stays exact, but the rendering is a quiet
          // shadowed footprint rather than an obvious "blocked tile".
          this.grid.drawDiamond(g, x, y, 0x090b11, 0.34);
        } else if (type === 'resonance') {
          this._drawResonanceCrack(g, x, y);
        }
      }
    }
  }

  _drawResonanceCrack(g, x, y) {
    const p = this.grid.toScreen(x, y);
    const hw = this.grid.tileHalfW;
    const hh = this.grid.tileHalfH;

    g.lineStyle(5, 0x8a45ff, 0.08);
    g.beginPath();
    g.moveTo(p.x - hw * 0.45, p.y + hh * 0.10);
    g.lineTo(p.x - hw * 0.10, p.y - hh * 0.18);
    g.lineTo(p.x + hw * 0.10, p.y + hh * 0.02);
    g.lineTo(p.x + hw * 0.46, p.y - hh * 0.25);
    g.strokePath();

    g.lineStyle(1.5, 0xc8a8ff, 0.55);
    g.beginPath();
    g.moveTo(p.x - hw * 0.45, p.y + hh * 0.10);
    g.lineTo(p.x - hw * 0.10, p.y - hh * 0.18);
    g.lineTo(p.x + hw * 0.10, p.y + hh * 0.02);
    g.lineTo(p.x + hw * 0.46, p.y - hh * 0.25);
    g.strokePath();
  }

  clearNodes() {
    this.nodeObjects.forEach(o => o.destroy());
    this.nodeObjects = [];
  }

  drawNodes(nodes) {
    this.clearNodes();
    nodes.forEach(node => this._buildNode(node));
    return this.nodeObjects;
  }

  _addNodeObject(obj) {
    obj.setDepth(4);
    this.scene.worldAdd(obj);
    this.nodeObjects.push(obj);
    return obj;
  }

  _buildNode(node) {
    const p = this.grid.toScreen(node.x, node.y);
    const restored = !!node.restored;
    const main = restored ? 0xffd56a : 0x9f78ff;
    const soft = restored ? 0xfff3c8 : 0xc8a8ff;

    // Each objective has its own environmental visual language. These are
    // intentionally not three interchangeable floating crystals.
    if (node.id === 'dogs') {
      this._buildDogsNode(p, main, soft, restored);
    } else if (node.id === 'pool') {
      this._buildPoolNode(p, main, soft, restored);
    } else if (node.id === 'laughter') {
      this._buildLaughterNode(p, main, soft, restored);
    } else {
      const fallback = this.scene.add.circle(p.x, p.y - 4, 6, main, 0.18)
        .setStrokeStyle(1.5, soft, 0.55);
      this._addNodeObject(fallback);
    }
  }

  _buildDogsNode(p, main, soft, restored) {
    const g = this.scene.add.graphics();
    g.lineStyle(1.5, soft, restored ? 0.78 : 0.44);

    // Fence/air vibration: three short wave arcs biased to one side.
    for (let i = 0; i < 3; i++) {
      const r = 7 + i * 5;
      g.beginPath();
      g.arc(p.x - 5, p.y - 5, r, -0.72, 0.72, false);
      g.strokePath();
    }

    // A grounded pulse at the fence-line location.
    g.lineStyle(1, main, restored ? 0.7 : 0.28);
    g.beginPath();
    g.moveTo(p.x - 18, p.y + 5);
    g.lineTo(p.x + 17, p.y + 5);
    g.strokePath();

    this._addNodeObject(g);
  }

  _buildPoolNode(p, main, soft, restored) {
    const g = this.scene.add.graphics();

    // Unnatural silent-water ripples, flattened to feel embedded in a pool
    // surface rather than hovering above the battlefield.
    for (let i = 0; i < 3; i++) {
      const w = 16 + i * 11;
      const h = 5 + i * 3;
      g.lineStyle(i === 0 ? 1.7 : 1, i === 0 ? soft : main,
        restored ? (0.82 - i * 0.15) : (0.48 - i * 0.10));
      g.strokeEllipse(p.x, p.y - 2, w, h);
    }

    this._addNodeObject(g);
  }

  _buildLaughterNode(p, main, soft, restored) {
    const g = this.scene.add.graphics();

    // Harmonic echo around the social/play area: broken arcs plus a few
    // quiet suspended motes, deliberately different from Dogs Barking.
    g.lineStyle(1.25, soft, restored ? 0.75 : 0.38);
    for (let i = 0; i < 3; i++) {
      const r = 7 + i * 6;
      g.beginPath();
      g.arc(p.x, p.y - 4, r, Math.PI * 1.08, Math.PI * 1.82, false);
      g.strokePath();
    }

    g.fillStyle(main, restored ? 0.65 : 0.30);
    g.fillCircle(p.x - 11, p.y - 13, 1.5);
    g.fillCircle(p.x + 8, p.y - 17, 1.2);
    g.fillCircle(p.x + 14, p.y - 9, 1.0);

    this._addNodeObject(g);
  }

  // Future art hook. Once the approved environment is separated into
  // clean PNG layers, TacticalScene can call this without changing any
  // gameplay code. Objects returned here should use world depths below
  // units (roughly 0-9) or explicit foreground occluder depths above them.
  attachTextureLayer(textureKey, depth, options = {}) {
    if (!this.scene.textures.exists(textureKey)) return null;
    const img = this.scene.add.image(
      options.x || 0,
      options.y || 0,
      textureKey
    ).setOrigin(
      options.originX === undefined ? 0.5 : options.originX,
      options.originY === undefined ? 0.5 : options.originY
    ).setDepth(depth);

    if (options.scale !== undefined) img.setScale(options.scale);
    if (options.alpha !== undefined) img.setAlpha(options.alpha);
    this.scene.worldAdd(img);
    return img;
  }
}
