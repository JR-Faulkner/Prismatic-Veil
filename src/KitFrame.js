// Battle Presentation Alpha v1.0 — modular battle frame.
//
// Sheets 01A and 01B ship a corner family and a set of horizontal
// border modules, which is what "modular battle frame" means: a frame
// assembled from parts rather than one fixed image.
//
// Sheet 04A's finished command panel is deliberately *not* used here.
// Its top and bottom edges carry a centred gem, so a nine-slice smears
// that gem across the whole rail and a straight scale squashes the
// corner ornaments — neither survives a 362x112 box on a phone. The
// corner-plus-rail build stretches cleanly to any size instead.
//
// Only one corner slice is shipped; the other three are flips of it.

export default class KitFrame {
  constructor(scene, opts) {
    const o = opts || {};
    this.scene = scene;
    this.fill = o.fill === undefined ? 0x0d0a1e : o.fill;
    this.fillAlpha = o.fillAlpha === undefined ? 0.9 : o.fillAlpha;
    this.corner = o.corner || 30;
    this.rail = o.rail || 13;
  }

  create(container) {
    const s = this.scene;
    this.plate = s.add.graphics();

    // tl, tr, bl, br — all one texture, flipped into place
    this.corners = [
      s.add.image(0, 0, 'kit_frame_corner'),
      s.add.image(0, 0, 'kit_frame_corner').setFlipX(true),
      s.add.image(0, 0, 'kit_frame_corner').setFlipY(true),
      s.add.image(0, 0, 'kit_frame_corner').setFlipX(true).setFlipY(true)
    ];
    this.railTop = s.add.image(0, 0, 'kit_frame_rail');
    this.railBottom = s.add.image(0, 0, 'kit_frame_rail').setFlipY(true);

    this.parts = [this.plate, this.railTop, this.railBottom, ...this.corners];
    if (container) container.add(this.parts);
    return this;
  }

  setTint(color) {
    this.corners.forEach(c => c.setTint(color));
    this.railTop.setTint(color);
    this.railBottom.setTint(color);
    this._tint = color;
    return this;
  }

  // Centre-anchored, like everything else in the HUD.
  setRect(cx, cy, w, h) {
    const c = Math.min(this.corner, w * 0.22, h * 0.42);
    const r = Math.min(this.rail, h * 0.2);
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;

    this.plate.clear();
    this.plate.fillStyle(this.fill, this.fillAlpha);
    this.plate.fillRect(x0 + 4, y0 + 4, w - 8, h - 8);
    this.plate.lineStyle(1, this._tint || 0x67c8ff, 0.35);
    this.plate.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);

    // rails span between the corners and stretch horizontally only
    const railW = Math.max(8, w - c * 2 + 6);
    this.railTop.setDisplaySize(railW, r).setPosition(cx, y0 + r / 2);
    this.railBottom.setDisplaySize(railW, r).setPosition(cx, y0 + h - r / 2);

    const pos = [[x0 + c / 2, y0 + c / 2], [x0 + w - c / 2, y0 + c / 2],
                 [x0 + c / 2, y0 + h - c / 2], [x0 + w - c / 2, y0 + h - c / 2]];
    this.corners.forEach((img, i) => {
      img.setDisplaySize(c, c).setPosition(pos[i][0], pos[i][1]);
    });
    return this;
  }

  setDepthBase(d) {
    this.plate.setDepth(d);
    this.railTop.setDepth(d + 1);
    this.railBottom.setDepth(d + 1);
    this.corners.forEach(c => c.setDepth(d + 2));
    return this;
  }
}
