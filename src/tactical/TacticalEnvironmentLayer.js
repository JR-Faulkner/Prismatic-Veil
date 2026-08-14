// Too Quiet Cinematic Environment Layer — Batch 02B
//
// Premium layered-art runtime pass with validated 02A procedural fallback.
//
// This remains presentation-only. TacticalGrid is still the source of truth
// for movement, occupancy, hit testing, terrain, pathfinding, line of sight,
// node coordinates, and all combat rules.
//
// Batch 02A's purpose is to prove the authored backyard composition inside the
// real Tactical camera before replacing these procedural shapes with final
// illustrated PNG layers. It deliberately uses normal suburban objects rather
// than fantasy architecture.
export default class TacticalEnvironmentLayer {
  constructor(scene, grid, mapData) {
    this.scene = scene;
    this.grid = grid;
    this.mapData = mapData;

    this.nodeObjects = [];
    this.sceneryObjects = [];

    this.backScenery = null;
    this.midScenery = null;
    this.ambientOverlay = null;
    this.frontScenery = null;

    // Batch 02B aligned environment masters. All six PNGs share a
    // 1536x1024 transparent canvas. One shared transform preserves
    // registration across the entire environment stack.
    this.artObjects = [];
    this.artReady = null;
  }

  // ---------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------

  _worldGraphics(depth) {
    const g = this.scene.add.graphics().setDepth(depth);
    this.scene.worldAdd(g);
    this.sceneryObjects.push(g);
    return g;
  }

  _ensureSceneryLayers() {
    if (!this.backScenery) this.backScenery = this._worldGraphics(-5);
    if (!this.midScenery) this.midScenery = this._worldGraphics(1);
    if (!this.ambientOverlay) this.ambientOverlay = this._worldGraphics(7.2);

    // A very restrained front-occlusion layer. It sits above ordinary units
    // (their dynamic depth is ~10.xx) only where individual front props are
    // explicitly drawn with their own object depth; this shared graphics
    // layer therefore stays below units and is safe by default.
    if (!this.frontScenery) this.frontScenery = this._worldGraphics(8.7);
  }

  destroy() {
    this.clearNodes();
    this._clearArt();
    this.sceneryObjects.forEach(o => {
      if (o && o.destroy) o.destroy();
    });
    this.sceneryObjects = [];
    this.backScenery = null;
    this.midScenery = null;
    this.ambientOverlay = null;
    this.frontScenery = null;
  }

  // ---------------------------------------------------------------------
  // Geometry helpers
  // ---------------------------------------------------------------------

  p(x, y) {
    return this.grid.toScreen(x, y);
  }

  lerpPoint(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }

  drawQuad(g, pts, fill, alpha = 1, stroke, strokeAlpha = 1, strokeWidth = 1) {
    g.fillStyle(fill, alpha);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath();
    g.fillPath();
    if (stroke !== undefined) {
      g.lineStyle(strokeWidth, stroke, strokeAlpha);
      g.strokePath();
    }
  }

  boardCorners() {
    const hw = this.grid.tileHalfW;
    const hh = this.grid.tileHalfH;
    const top = this.p(0, 0);
    const right = this.p(this.grid.columns - 1, 0);
    const bottom = this.p(this.grid.columns - 1, this.grid.rows - 1);
    const left = this.p(0, this.grid.rows - 1);
    return {
      top: { x: top.x, y: top.y - hh },
      right: { x: right.x + hw, y: right.y },
      bottom: { x: bottom.x, y: bottom.y + hh },
      left: { x: left.x - hw, y: left.y }
    };
  }

  // ---------------------------------------------------------------------
  // Batch 02B illustrated environment
  // ---------------------------------------------------------------------

  _hasArtTextures() {
    const keys = [
      'too_quiet_far_backyards',
      'too_quiet_house_fence',
      'too_quiet_ground_pool',
      'too_quiet_props_back',
      'too_quiet_veil_corruption',
      'too_quiet_props_front'
    ];
    return keys.every(key => this.scene.textures.exists(key));
  }

  _clearArt() {
    this.artObjects.forEach(o => {
      if (o && o.destroy) o.destroy();
    });
    this.artObjects = [];
    this.artReady = null;
  }

  _artTransform() {
    const b = this.grid.screenBounds();
    const boardW = b.maxX - b.minX;
    const boardH = b.maxY - b.minY;

    // Art intentionally extends beyond the logical board so the house,
    // fence, neighboring homes, trees, and foreground patio can breathe.
    // Reported directly: at desktop width the art left bare black canvas
    // exposed on the right edge. The original 1.30 factor was sized only
    // against the board's own logical width, not against how far the
    // camera can actually zoom out at a wide viewport (TacticalCamera's
    // defaultZoomFor() goes as low as 0.62) — same class of gap already
    // fixed once before in Battle Presentation's own background layers
    // (coverage tied to a fixed multiplier instead of the camera's real
    // possible view). Bumped with real headroom rather than just enough
    // to patch the one observed case.
    const worldW = boardW * 2.0;
    const scale = worldW / 1536;

    return {
      x: (b.minX + b.maxX) / 2,
      y: (b.minY + b.maxY) / 2 - boardH * 0.22,
      scale
    };
  }

  _attachAlignedArt(textureKey, depth, alpha = 1) {
    const t = this._artTransform();
    const img = this.scene.add.image(t.x, t.y, textureKey)
      .setOrigin(0.5)
      .setScale(t.scale)
      // The generated stack places the large pool on image-right while
      // the validated logical Too Quiet map places Pool Splash toward the
      // front-left. Mirror the WHOLE stack, never individual layers.
      .setFlipX(true)
      .setAlpha(alpha)
      .setDepth(depth);

    this.scene.worldAdd(img);
    this.artObjects.push(img);
    return img;
  }

  _ensureArt() {
    if (this.artReady === true && this.artObjects.length === 6) return true;
    if (!this._hasArtTextures()) {
      this.artReady = false;
      return false;
    }

    this._clearArt();

    this._attachAlignedArt('too_quiet_far_backyards', -8, 1.00);
    this._attachAlignedArt('too_quiet_house_fence', -6, 1.00);
    this._attachAlignedArt('too_quiet_ground_pool', -4, 1.00);
    this._attachAlignedArt('too_quiet_props_back', 2.5, 0.92);
    this._attachAlignedArt('too_quiet_veil_corruption', 7.0, 0.67);
    // Reported directly and confirmed by sampling this texture's own
    // alpha against every board tile: at the spec'd depth 12 (above
    // units' ~10.xx), the patio-couch cluster alone is near-fully-opaque
    // (alpha 238-253) across ~13% of the board (roughly columns 9-11),
    // and a unit standing there is almost entirely hidden — a direct hit
    // on this package's own checklist item 7 ("foreground props do not
    // hide full units"), not a hypothetical edge case. Held below units
    // (matching Batch 02A's already-proven-safe front layer) as an
    // interim mitigation rather than shipping the confirmed regression;
    // the "walk behind furniture" depth effect this depth was meant to
    // buy is the one visual trade-off, not full unit visibility.
    this._attachAlignedArt('too_quiet_props_front', 8.8, 0.88);

    this.artReady = true;
    return true;
  }

  // ---------------------------------------------------------------------
  // Battlefield
  // ---------------------------------------------------------------------

  drawBattlefield(g) {
    // Prefer the premium common-canvas stack. If any texture is missing,
    // retain the already-validated 02A procedural backyard as a safe fallback.
    if (this._ensureArt()) {
      g.clear();
      [this.backScenery, this.midScenery, this.ambientOverlay, this.frontScenery]
        .filter(Boolean)
        .forEach(layer => layer.clear());
      return;
    }

    this._ensureSceneryLayers();

    g.clear();
    this.backScenery.clear();
    this.midScenery.clear();
    this.ambientOverlay.clear();
    this.frontScenery.clear();

    this._drawGround(g);
    this._drawFarNeighborhood(this.backScenery);
    this._drawFence(this.backScenery);
    this._drawHouseAndDeck(this.backScenery);
    this._drawPool(this.midScenery);
    this._drawPatioSocialArea(this.midScenery);
    this._drawDogArea(this.midScenery);
    this._drawBackyardProps(this.midScenery);
    this._drawTerrainHints(this.midScenery);
    this._drawVeilCorruption(this.ambientOverlay);
    this._drawForegroundAccents(this.frontScenery);
  }

  _drawGround(g) {
    const c = this.boardCorners();

    // One continuous lawn plane. The grid exists underneath but is not the
    // visual identity of the battlefield.
    this.drawQuad(
      g,
      [c.top, c.right, c.bottom, c.left],
      0x18331f,
      0.98,
      0x243c31,
      0.45,
      1
    );

    // Broad night wash with a cooler back-yard/top edge.
    const topA = this.lerpPoint(c.left, c.top, 0.22);
    const topB = this.lerpPoint(c.top, c.right, 0.78);
    const lowerB = this.lerpPoint(c.right, c.bottom, 0.48);
    const lowerA = this.lerpPoint(c.bottom, c.left, 0.48);
    this.drawQuad(g, [topA, topB, lowerB, lowerA], 0x20364d, 0.12);

    // Patchy lawn texture without turning into tile outlines.
    g.fillStyle(0x284a2d, 0.16);
    [
      [2, 5, 24, 8], [4, 3, 18, 5], [7, 7, 26, 7],
      [8, 4, 16, 5], [5, 8, 22, 6]
    ].forEach(([x, y, w, h]) => {
      const p = this.p(x, y);
      g.fillEllipse(p.x, p.y, w, h);
    });
  }

  _drawFarNeighborhood(g) {
    const top = this.p(0, 0);
    const right = this.p(this.grid.columns - 1, 0);

    // Neighbor houses: low-contrast silhouettes, clearly modern residential.
    const houses = [
      { x: top.x - 120, y: top.y - 126, w: 104, h: 58, roof: 28 },
      { x: top.x + 15, y: top.y - 153, w: 125, h: 66, roof: 32 },
      { x: right.x + 72, y: right.y - 118, w: 110, h: 60, roof: 28 }
    ];

    houses.forEach((h, i) => {
      g.fillStyle(i === 1 ? 0x17202a : 0x111820, 0.92);
      g.fillRect(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h);

      g.fillStyle(0x0c1118, 0.96);
      g.beginPath();
      g.moveTo(h.x - h.w * 0.58, h.y - h.h / 2);
      g.lineTo(h.x, h.y - h.h / 2 - h.roof);
      g.lineTo(h.x + h.w * 0.58, h.y - h.h / 2);
      g.closePath();
      g.fillPath();

      // A few believable warm windows, no fantasy glow.
      g.fillStyle(0xd3a86b, 0.35);
      g.fillRect(h.x - h.w * 0.30, h.y - 10, 13, 12);
      g.fillRect(h.x + h.w * 0.14, h.y - 8, 14, 13);
    });

    // Trees framing the property.
    [
      { x: top.x - 215, y: top.y - 98, s: 1.15 },
      { x: top.x - 63, y: top.y - 118, s: 0.85 },
      { x: right.x + 185, y: right.y - 88, s: 1.10 }
    ].forEach(t => {
      g.fillStyle(0x09120e, 0.92);
      g.fillRect(t.x - 4 * t.s, t.y, 8 * t.s, 65 * t.s);
      g.fillStyle(0x0c1d16, 0.98);
      g.fillCircle(t.x, t.y - 5, 27 * t.s);
      g.fillCircle(t.x - 20 * t.s, t.y + 4, 20 * t.s);
      g.fillCircle(t.x + 20 * t.s, t.y + 3, 22 * t.s);
    });

    // Utility pole + lines, one of the little suburban tells from the master.
    const poleX = right.x + 125;
    const poleTopY = right.y - 165;
    g.lineStyle(4, 0x111316, 0.95);
    g.beginPath();
    g.moveTo(poleX, poleTopY);
    g.lineTo(poleX, right.y + 45);
    g.strokePath();

    g.lineStyle(1.2, 0x17191c, 0.90);
    g.beginPath();
    g.moveTo(top.x - 210, poleTopY + 12);
    g.lineTo(poleX + 20, poleTopY + 5);
    g.strokePath();
    g.beginPath();
    g.moveTo(top.x - 160, poleTopY + 24);
    g.lineTo(poleX + 25, poleTopY + 17);
    g.strokePath();
  }

  _drawFence(g) {
    const backLeft = this.p(0, 1);
    const backRight = this.p(10, 0);
    const sideRight = this.p(11, 7);

    // Back fence follows the board's far projected edge.
    g.lineStyle(7, 0x4b3d31, 0.96);
    g.beginPath();
    g.moveTo(backLeft.x - 35, backLeft.y - 26);
    g.lineTo(backRight.x + 30, backRight.y - 27);
    g.strokePath();

    g.lineStyle(2, 0x76604b, 0.75);
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = backLeft.x - 35 + (backRight.x + 65 - backLeft.x) * t;
      const y = backLeft.y - 27 + (backRight.y - backLeft.y - 1) * t;
      g.beginPath();
      g.moveTo(x, y - 21);
      g.lineTo(x, y + 10);
      g.strokePath();
    }

    // Right-side property fence.
    g.lineStyle(7, 0x46382d, 0.92);
    g.beginPath();
    g.moveTo(backRight.x + 30, backRight.y - 27);
    g.lineTo(sideRight.x + 31, sideRight.y + 8);
    g.strokePath();

    g.lineStyle(1.5, 0x765f4a, 0.68);
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = backRight.x + 30 + (sideRight.x + 1 - backRight.x) * t;
      const y = backRight.y - 27 + (sideRight.y + 35 - backRight.y) * t;
      g.beginPath();
      g.moveTo(x, y - 18);
      g.lineTo(x, y + 9);
      g.strokePath();
    }
  }

  _drawHouseAndDeck(g) {
    // Main family house occupies the far-left/back portion without covering
    // the whole playable board.
    const a = this.p(0, 0);
    const b = this.p(5, 0);

    const houseX = (a.x + b.x) / 2 - 36;
    const houseY = (a.y + b.y) / 2 - 88;
    const w = 235;
    const h = 98;

    // House body.
    g.fillStyle(0x5a5b5b, 0.98);
    g.fillRect(houseX - w / 2, houseY - h / 2, w, h);

    // Roof.
    g.fillStyle(0x24252a, 1);
    g.beginPath();
    g.moveTo(houseX - w * 0.58, houseY - h / 2);
    g.lineTo(houseX - 30, houseY - h / 2 - 55);
    g.lineTo(houseX + w * 0.55, houseY - h / 2);
    g.closePath();
    g.fillPath();

    // Back door and windows.
    g.fillStyle(0x1f262b, 0.95);
    g.fillRect(houseX + 38, houseY - 15, 35, 59);
    g.fillStyle(0xc9945a, 0.43);
    g.fillRect(houseX - 82, houseY - 20, 39, 31);
    g.fillRect(houseX - 22, houseY - 20, 39, 31);
    g.fillRect(houseX + 92, houseY - 19, 31, 30);

    // Warm porch light.
    g.fillStyle(0xffd58e, 0.68);
    g.fillCircle(houseX + 58, houseY - 26, 4);
    g.fillStyle(0xffd58e, 0.07);
    g.fillCircle(houseX + 58, houseY - 26, 25);

    // Deck / patio boards.
    const d0 = this.p(2, 2);
    const d1 = this.p(6, 2);
    const d2 = this.p(6, 4);
    const d3 = this.p(2, 4);
    this.drawQuad(g, [d0, d1, d2, d3], 0x5b4b3a, 0.82, 0x836b50, 0.55, 1);

    // Deck rail.
    g.lineStyle(2, 0xa17e58, 0.62);
    const railA = this.lerpPoint(d0, d1, 0.12);
    const railB = this.lerpPoint(d0, d1, 0.88);
    g.beginPath();
    g.moveTo(railA.x, railA.y - 18);
    g.lineTo(railB.x, railB.y - 18);
    g.strokePath();
  }

  _drawPool(g) {
    // Pool objective is data-anchored at (2,9). The pool itself is larger
    // than the node marker and reads as an actual backyard feature.
    const c = this.p(2, 9);

    g.fillStyle(0x8e979b, 0.95);
    g.fillEllipse(c.x, c.y + 3, 112, 47);

    g.fillStyle(0x143d55, 0.98);
    g.fillEllipse(c.x, c.y + 2, 98, 37);

    // Normal water highlight.
    g.lineStyle(1.2, 0x6f9fb8, 0.48);
    g.strokeEllipse(c.x, c.y + 2, 86, 29);

    // Pool ladder.
    g.lineStyle(2, 0xb4b9bc, 0.65);
    g.beginPath();
    g.moveTo(c.x + 38, c.y - 12);
    g.lineTo(c.x + 46, c.y + 5);
    g.moveTo(c.x + 45, c.y - 13);
    g.lineTo(c.x + 53, c.y + 3);
    g.strokePath();
  }

  _drawPatioSocialArea(g) {
    // Backyard Laughter lives at (9,8), so the social space surrounds that
    // coordinate: table, chairs, small play item.
    const c = this.p(9, 8);

    // Patio slab.
    g.fillStyle(0x6b6b67, 0.40);
    g.fillEllipse(c.x, c.y + 4, 118, 52);

    // Table.
    g.fillStyle(0x383736, 0.95);
    g.fillEllipse(c.x - 4, c.y - 6, 44, 17);
    g.fillRect(c.x - 6, c.y - 5, 4, 23);

    // Chairs.
    const chairs = [
      [c.x - 34, c.y - 5], [c.x + 30, c.y - 3], [c.x - 5, c.y + 19]
    ];
    chairs.forEach(([x, y]) => {
      g.fillStyle(0x4a4741, 0.94);
      g.fillRect(x - 7, y - 7, 14, 12);
      g.lineStyle(2, 0x403d38, 0.95);
      g.beginPath();
      g.moveTo(x - 5, y + 5);
      g.lineTo(x - 7, y + 16);
      g.moveTo(x + 5, y + 5);
      g.lineTo(x + 7, y + 16);
      g.strokePath();
    });

    // Children's ball / play object.
    g.fillStyle(0xb44f4d, 0.75);
    g.fillCircle(c.x + 47, c.y + 10, 5);
    g.lineStyle(1, 0xe0b26c, 0.55);
    g.strokeCircle(c.x + 47, c.y + 10, 5);
  }

  _drawDogArea(g) {
    const c = this.p(2, 2);

    // Doghouse, fence-adjacent.
    g.fillStyle(0x5a3828, 0.95);
    g.fillRect(c.x - 36, c.y - 28, 39, 29);
    g.fillStyle(0x3c241b, 0.98);
    g.beginPath();
    g.moveTo(c.x - 43, c.y - 28);
    g.lineTo(c.x - 17, c.y - 48);
    g.lineTo(c.x + 10, c.y - 28);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x111317, 0.92);
    g.fillCircle(c.x - 17, c.y - 10, 8);

    // Dog bowl grounds the location in ordinary domestic life.
    g.fillStyle(0x777f83, 0.80);
    g.fillEllipse(c.x + 12, c.y + 2, 15, 5);
  }

  _drawBackyardProps(g) {
    // Grill near deck.
    const grill = this.p(6, 4);
    g.fillStyle(0x24272a, 0.98);
    g.fillEllipse(grill.x + 14, grill.y - 11, 25, 13);
    g.fillRect(grill.x + 3, grill.y - 10, 22, 15);
    g.lineStyle(2, 0x1e2022, 0.95);
    g.beginPath();
    g.moveTo(grill.x + 7, grill.y + 4);
    g.lineTo(grill.x + 3, grill.y + 20);
    g.moveTo(grill.x + 22, grill.y + 4);
    g.lineTo(grill.x + 26, grill.y + 20);
    g.strokePath();

    // Small plastic toy bin / yard clutter.
    const toy = this.p(7, 7);
    g.fillStyle(0x31598b, 0.72);
    g.fillRect(toy.x - 10, toy.y - 5, 20, 11);
    g.fillStyle(0xe1ad49, 0.75);
    g.fillCircle(toy.x + 15, toy.y + 2, 4);

    // Hose reel near house edge.
    const hose = this.p(5, 3);
    g.lineStyle(2, 0x2d5d43, 0.68);
    g.strokeCircle(hose.x - 16, hose.y - 8, 7);
    g.beginPath();
    g.moveTo(hose.x - 9, hose.y - 5);
    g.lineTo(hose.x + 5, hose.y + 4);
    g.strokePath();
  }

  _drawTerrainHints(g) {
    // Difficult/barrier/resonance still come from map data. These cues are
    // intentionally tiny and material-like, never full-cell borders.
    for (let y = 0; y < this.grid.rows; y++) {
      for (let x = 0; x < this.grid.columns; x++) {
        const type = this.grid.terrainAt(x, y);
        if (type === 'open') continue;

        const p = this.p(x, y);

        if (type === 'difficult') {
          g.fillStyle(0x433b2d, 0.18);
          g.fillEllipse(p.x, p.y + 4, 26, 9);
          g.fillStyle(0x6b5940, 0.20);
          g.fillCircle(p.x - 8, p.y + 1, 2);
          g.fillCircle(p.x + 7, p.y + 5, 2);
        } else if (type === 'barrier') {
          // Quiet grounding shadow only. Collision remains logical.
          g.fillStyle(0x06080b, 0.18);
          g.fillEllipse(p.x, p.y + 5, 31, 10);
        }
      }
    }
  }

  _drawVeilCorruption(g) {
    // Localized corruption around resonance cells and objectives. It invades
    // the backyard; it does not transform the backyard into a temple.
    for (let y = 0; y < this.grid.rows; y++) {
      for (let x = 0; x < this.grid.columns; x++) {
        if (this.grid.terrainAt(x, y) === 'resonance') {
          this._drawResonanceCrack(g, x, y, 1);
        }
      }
    }

    // Sparse extra hairline fractures.
    [
      [4.7, 6.2, 0.75],
      [7.6, 3.3, 0.65],
      [10.0, 5.7, 0.55]
    ].forEach(([x, y, mul]) => {
      const p = this.p(Math.round(x), Math.round(y));
      this._drawFreeCrack(g, p.x + (x % 1) * 20, p.y + (y % 1) * 10, mul);
    });

    // A few tiny crystalline protrusions at the periphery only.
    const crystals = [
      { p: this.p(0, 7), dx: -18, dy: 1, s: 0.65 },
      { p: this.p(10, 1), dx: 19, dy: -9, s: 0.55 },
      { p: this.p(11, 8), dx: 14, dy: 2, s: 0.60 }
    ];
    crystals.forEach(c => this._drawCrystalCluster(g, c.p.x + c.dx, c.p.y + c.dy, c.s));

    // Pool gets a faint impossible violet reflection separate from the node
    // ripple itself.
    const pool = this.p(2, 9);
    g.fillStyle(0x874dff, 0.09);
    g.fillEllipse(pool.x + 7, pool.y + 1, 68, 19);
  }

  _drawResonanceCrack(g, x, y, mul = 1) {
    const p = this.p(x, y);
    const hw = this.grid.tileHalfW * mul;
    const hh = this.grid.tileHalfH * mul;

    g.lineStyle(5, 0x8a45ff, 0.07);
    g.beginPath();
    g.moveTo(p.x - hw * 0.45, p.y + hh * 0.10);
    g.lineTo(p.x - hw * 0.10, p.y - hh * 0.18);
    g.lineTo(p.x + hw * 0.10, p.y + hh * 0.02);
    g.lineTo(p.x + hw * 0.46, p.y - hh * 0.25);
    g.strokePath();

    g.lineStyle(1.3, 0xc8a8ff, 0.50);
    g.beginPath();
    g.moveTo(p.x - hw * 0.45, p.y + hh * 0.10);
    g.lineTo(p.x - hw * 0.10, p.y - hh * 0.18);
    g.lineTo(p.x + hw * 0.10, p.y + hh * 0.02);
    g.lineTo(p.x + hw * 0.46, p.y - hh * 0.25);
    g.strokePath();
  }

  _drawFreeCrack(g, x, y, mul) {
    g.lineStyle(1.1, 0xab7dff, 0.34);
    g.beginPath();
    g.moveTo(x - 15 * mul, y + 2);
    g.lineTo(x - 4 * mul, y - 5 * mul);
    g.lineTo(x + 3 * mul, y + 2 * mul);
    g.lineTo(x + 14 * mul, y - 6 * mul);
    g.strokePath();
  }

  _drawCrystalCluster(g, x, y, s) {
    const shards = [
      { dx: 0, h: 20, w: 6 },
      { dx: -7, h: 12, w: 5 },
      { dx: 8, h: 15, w: 5 }
    ];
    shards.forEach(sh => {
      const h = sh.h * s;
      const w = sh.w * s;
      g.fillStyle(0x7952c8, 0.52);
      g.beginPath();
      g.moveTo(x + sh.dx, y - h);
      g.lineTo(x + sh.dx + w, y);
      g.lineTo(x + sh.dx - w, y);
      g.closePath();
      g.fillPath();
      g.lineStyle(1, 0xd3b8ff, 0.42);
      g.strokePath();
    });
  }

  _drawForegroundAccents(g) {
    // Only a couple of low garden-edge silhouettes near the front corners.
    // We intentionally avoid large occluders until the illustrated layer
    // pass, because touch/readability matters more than decorative density.
    const left = this.p(0, 9);
    const right = this.p(11, 9);

    g.fillStyle(0x0c1710, 0.72);
    g.fillEllipse(left.x - 16, left.y + 10, 42, 14);
    g.fillEllipse(right.x + 15, right.y + 8, 38, 12);
  }

  // ---------------------------------------------------------------------
  // Sound nodes
  // ---------------------------------------------------------------------

  clearNodes() {
    this.nodeObjects.forEach(o => {
      if (o && o.destroy) o.destroy();
    });
    this.nodeObjects = [];
  }

  drawNodes(nodes) {
    this.clearNodes();
    nodes.forEach(node => this._buildNode(node));
    return this.nodeObjects;
  }

  _addNodeObject(obj) {
    obj.setDepth(7.5);
    this.scene.worldAdd(obj);
    this.nodeObjects.push(obj);
    return obj;
  }

  _buildNode(node) {
    const p = this.p(node.x, node.y);
    const restored = !!node.restored;
    const main = restored ? 0xffd56a : 0x9f78ff;
    const soft = restored ? 0xfff3c8 : 0xc8a8ff;

    if (node.id === 'dogs') {
      this._buildDogsNode(p, main, soft, restored);
    } else if (node.id === 'pool') {
      this._buildPoolNode(p, main, soft, restored);
    } else if (node.id === 'laughter') {
      this._buildLaughterNode(p, main, soft, restored);
    } else {
      const fallback = this.scene.add.circle(p.x, p.y - 4, 6, main, 0.14)
        .setStrokeStyle(1.2, soft, 0.45);
      this._addNodeObject(fallback);
    }
  }

  _buildDogsNode(p, main, soft, restored) {
    const g = this.scene.add.graphics();
    g.lineStyle(1.35, soft, restored ? 0.74 : 0.38);

    // Disturbed air/fence vibration. No floating objective crystal.
    for (let i = 0; i < 3; i++) {
      const r = 7 + i * 5;
      g.beginPath();
      g.arc(p.x - 4, p.y - 6, r, -0.70, 0.70, false);
      g.strokePath();
    }

    g.lineStyle(1, main, restored ? 0.65 : 0.23);
    g.beginPath();
    g.moveTo(p.x - 18, p.y + 5);
    g.lineTo(p.x + 17, p.y + 5);
    g.strokePath();

    this._addNodeObject(g);
  }

  _buildPoolNode(p, main, soft, restored) {
    const g = this.scene.add.graphics();

    // Silent-water ripples live inside the actual pool.
    for (let i = 0; i < 3; i++) {
      const w = 20 + i * 12;
      const h = 6 + i * 3;
      g.lineStyle(
        i === 0 ? 1.6 : 1,
        i === 0 ? soft : main,
        restored ? (0.80 - i * 0.14) : (0.44 - i * 0.09)
      );
      g.strokeEllipse(p.x, p.y + 1, w, h);
    }

    this._addNodeObject(g);
  }

  _buildLaughterNode(p, main, soft, restored) {
    const g = this.scene.add.graphics();

    // Harmonic echo around table/chairs/play items.
    g.lineStyle(1.15, soft, restored ? 0.70 : 0.34);
    for (let i = 0; i < 3; i++) {
      const r = 8 + i * 6;
      g.beginPath();
      g.arc(p.x, p.y - 5, r, Math.PI * 1.08, Math.PI * 1.82, false);
      g.strokePath();
    }

    g.fillStyle(main, restored ? 0.58 : 0.26);
    g.fillCircle(p.x - 11, p.y - 14, 1.4);
    g.fillCircle(p.x + 8, p.y - 18, 1.1);
    g.fillCircle(p.x + 14, p.y - 10, 0.9);

    this._addNodeObject(g);
  }

  // ---------------------------------------------------------------------
  // 05C-2: production restoration event
  // ---------------------------------------------------------------------
  // Promoted from SoundNodeRestorationPrototype.js (Dream View), same
  // node-specific presentation language, but production-safe: mutates
  // nothing itself (TacticalScene.resonateNode() still owns the one
  // node.restored = true write), doesn't hide HUD/units, plays exactly
  // once, and every temporary object self-destroys on its own tween
  // completion rather than persisting for a later destroy() sweep — this
  // runs mid-session, not at scene teardown, so nothing here should
  // outlive its ~1s effect. Returns a Promise so the caller can await the
  // full event before committing state and finishing the hero's turn.

  playNodeRestoration(node) {
    if (!node) return Promise.resolve();
    if (node.id === 'dogs') return this._playDogsRestoration(node);
    if (node.id === 'pool') return this._playPoolRestoration(node);
    if (node.id === 'laughter') return this._playLaughterRestoration(node);
    return this._playGenericRestoration(node);
  }

  _burstBase(p, color = 0xffe8a0, duration = 720) {
    return new Promise(resolve => {
      const ring = this.scene.add.ellipse(p.x, p.y, 22, 8, 0x000000, 0)
        .setStrokeStyle(2, color, 0.88).setDepth(8.1);
      this.scene.worldAdd(ring);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 4.8,
        scaleY: 3.6,
        alpha: 0,
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => { ring.destroy(); resolve(); }
      });
    });
  }

  // A dark-violet local stain shrinks/fades away — "the Veil lets go HERE"
  // without pretending to modify terrain art.
  _veilRetreat(p, radiusX = 82, radiusY = 30, duration = 820) {
    return new Promise(resolve => {
      const stain = this.scene.add.ellipse(p.x, p.y + 1, radiusX, radiusY, 0x6f3dcc, 0.14)
        .setDepth(7.55).setBlendMode(Phaser.BlendModes.ADD);
      this.scene.worldAdd(stain);
      this.scene.tweens.add({
        targets: stain,
        scaleX: 0.28,
        scaleY: 0.28,
        alpha: 0,
        duration,
        ease: 'Sine.easeInOut',
        onComplete: () => { stain.destroy(); resolve(); }
      });
    });
  }

  _playDogsRestoration(node) {
    const s = this.scene;
    const p = this.p(node.x, node.y);
    const g = s.add.graphics().setDepth(8.0);
    s.worldAdd(g);

    // Fence/dog-area wake-up: compressed vibration expands outward, plus a
    // brief warm resonance along the ordinary fence rail.
    const wave = new Promise(resolve => {
      const driver = { v: 0 };
      s.tweens.add({
        targets: driver,
        v: 1,
        duration: 720,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          g.clear();
          const alpha = 0.70 * (1 - driver.v);
          g.lineStyle(1.4, 0xffe8a0, alpha);
          for (let i = 0; i < 3; i++) {
            const r = 8 + i * 6 + driver.v * 18;
            g.beginPath();
            g.arc(p.x - 4, p.y - 6, r, -0.82, 0.82, false);
            g.strokePath();
          }
          g.lineStyle(1, 0xffd56a, 0.50 * (1 - driver.v));
          g.beginPath();
          g.moveTo(p.x - 28, p.y + 5);
          g.lineTo(p.x + 24, p.y + 5);
          g.strokePath();
        },
        onComplete: () => { g.clear(); g.destroy(); resolve(); }
      });
    });

    return Promise.all([
      wave,
      this._burstBase(p, 0xffe8a0),
      this._veilRetreat(p, 76, 26)
    ]);
  }

  _playPoolRestoration(node) {
    const s = this.scene;
    const p = this.p(node.x, node.y);
    const g = s.add.graphics().setDepth(8.0);
    s.worldAdd(g);

    // Water wakes from unnatural stillness — ripples widen and cool back
    // toward ordinary moonlit water, with a restrained gold/prismatic cue.
    const ripples = new Promise(resolve => {
      const driver = { v: 0 };
      s.tweens.add({
        targets: driver,
        v: 1,
        duration: 900,
        ease: 'Sine.easeOut',
        onUpdate: () => {
          g.clear();
          for (let i = 0; i < 4; i++) {
            const phase = Math.max(0, driver.v - i * 0.08);
            const w = 22 + phase * 70 + i * 10;
            const h = 6 + phase * 18 + i * 2;
            const a = Math.max(0, 0.72 - phase * 0.58 - i * 0.10);
            g.lineStyle(i === 0 ? 1.7 : 1.1, i === 0 ? 0xbfeaff : 0xffe8a0, a);
            g.strokeEllipse(p.x, p.y + 1, w, h);
          }
        },
        onComplete: () => { g.clear(); g.destroy(); resolve(); }
      });
    });

    const sheen = new Promise(resolve => {
      const s2 = this.scene.add.ellipse(p.x + 5, p.y + 1, 46, 11, 0x9fe0ff, 0.10)
        .setDepth(7.9).setBlendMode(Phaser.BlendModes.ADD);
      this.scene.worldAdd(s2);
      this.scene.tweens.add({
        targets: s2,
        scaleX: 1.8,
        alpha: 0,
        duration: 980,
        ease: 'Quad.easeOut',
        onComplete: () => { s2.destroy(); resolve(); }
      });
    });

    return Promise.all([
      ripples,
      sheen,
      this._burstBase(p, 0xbfeaff),
      this._veilRetreat(p, 96, 30)
    ]);
  }

  _playLaughterRestoration(node) {
    const s = this.scene;
    const p = this.p(node.x, node.y);
    const g = s.add.graphics().setDepth(8.0);
    s.worldAdd(g);

    // Harmonics return around the table/chairs/play area, not a floating
    // crystal — three arcs rise and separate, then vanish into the yard.
    const arcs = new Promise(resolve => {
      const driver = { v: 0 };
      s.tweens.add({
        targets: driver,
        v: 1,
        duration: 820,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          g.clear();
          const a = 0.72 * (1 - driver.v);
          g.lineStyle(1.3, 0xffe8a0, a);
          for (let i = 0; i < 3; i++) {
            const r = 9 + i * 7 + driver.v * 16;
            g.beginPath();
            g.arc(p.x, p.y - 5 - driver.v * 6, r, Math.PI * 1.08, Math.PI * 1.82, false);
            g.strokePath();
          }
          g.fillStyle(0xc8a8ff, 0.45 * (1 - driver.v));
          [[-13, -16], [8, -20], [16, -11]].forEach(([dx, dy], i) => {
            g.fillCircle(p.x + dx * (1 + driver.v * 0.15), p.y + dy - driver.v * (5 + i * 2), 1.3);
          });
        },
        onComplete: () => { g.clear(); g.destroy(); resolve(); }
      });
    });

    return Promise.all([
      arcs,
      this._burstBase(p, 0xffe8a0),
      this._veilRetreat(p, 80, 28)
    ]);
  }

  // Unrecognized/future node ids still get a restrained restoration beat
  // instead of silently doing nothing.
  _playGenericRestoration(node) {
    const p = this.p(node.x, node.y);
    return Promise.all([
      this._burstBase(p, 0xffe8a0),
      this._veilRetreat(p, 70, 24)
    ]);
  }

  // ---------------------------------------------------------------------
  // Final-art insertion hook
  // ---------------------------------------------------------------------

  // Once final environment-only PNG masters exist, the procedural scenery
  // above can be replaced layer-by-layer. This helper intentionally remains
  // compatible with Batch 01's contract.
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
