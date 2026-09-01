// LIVE26 party-battle scene.
// Adds the first reusable Veil-corrupted battle stage floor/backdrop while
// preserving all battle logic from live23. This is procedural runtime art,
// not a generated background asset.
import Live23PartyBattleScene from './Live23PartyBattleScene.js?v=live23';

export default class Live26PartyBattleScene extends Live23PartyBattleScene {
  _buildBackdrop() {
    const g = this.add.graphics().setDepth(-40);
    const redraw = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      const horizonY = Math.round(h * 0.54);
      const floorBottom = h;

      g.clear();

      // Veil atmosphere.
      g.fillGradientStyle(0x080b1f, 0x0d1230, 0x1a0f38, 0x10091f, 1);
      g.fillRect(0, 0, w, h);

      // Distant haze band keeps silhouettes readable without becoming scenery-heavy.
      g.fillStyle(0x6f52a8, 0.055);
      g.fillEllipse(w * 0.52, horizonY * 0.76, w * 0.72, h * 0.26);
      g.fillStyle(0xb98cff, 0.028);
      g.fillEllipse(w * 0.70, horizonY * 0.68, w * 0.46, h * 0.18);

      // Ground plane.
      g.fillGradientStyle(0x17142b, 0x18132d, 0x090b18, 0x090b18, 1);
      g.fillTriangle(0, floorBottom, w, floorBottom, w * 0.78, horizonY);
      g.fillTriangle(0, floorBottom, w * 0.78, horizonY, w * 0.22, horizonY);

      // Horizon seam and faint perspective rails.
      g.lineStyle(Math.max(1, h * 0.0024), 0x9b78d0, 0.16);
      g.beginPath();
      g.moveTo(w * 0.18, horizonY);
      g.lineTo(w * 0.82, horizonY);
      g.strokePath();

      const vanX = w * 0.52;
      [0.05, 0.18, 0.34, 0.66, 0.82, 0.95].forEach(frac => {
        g.lineStyle(Math.max(1, h * 0.0018), 0x8065b0, 0.085);
        g.beginPath();
        g.moveTo(vanX, horizonY);
        g.lineTo(w * frac, floorBottom);
        g.strokePath();
      });

      // Arcane floor rings, intentionally subdued so combat FX own the brightest values.
      const ringY = h * 0.79;
      const ringW = w * 0.58;
      const ringH = h * 0.18;
      g.lineStyle(Math.max(1, h * 0.0022), 0x9e73d5, 0.11);
      g.strokeEllipse(w * 0.52, ringY, ringW, ringH);
      g.lineStyle(Math.max(1, h * 0.0017), 0xd6b46c, 0.075);
      g.strokeEllipse(w * 0.52, ringY, ringW * 0.72, ringH * 0.64);

      // Fixed prismatic fracture marks, no animation and no visual noise lottery.
      const cracks = [
        [0.33,0.73, 0.36,0.77, 0.35,0.82],
        [0.62,0.70, 0.59,0.76, 0.61,0.81],
        [0.74,0.78, 0.70,0.82, 0.72,0.89],
        [0.45,0.84, 0.42,0.89, 0.44,0.95]
      ];
      cracks.forEach(points => {
        g.lineStyle(Math.max(1, h * 0.002), 0xb88cff, 0.14);
        g.beginPath();
        g.moveTo(w * points[0], h * points[1]);
        g.lineTo(w * points[2], h * points[3]);
        g.lineTo(w * points[4], h * points[5]);
        g.strokePath();
      });

      // Low contact pads help hovering/standing units read as intentionally grounded.
      [0.25, 0.43, 0.61, 0.80].forEach((xFrac, i) => {
        const width = w * (i === 3 ? 0.11 : 0.085);
        g.fillStyle(i === 3 ? 0xa469d5 : 0x705e96, i === 3 ? 0.075 : 0.055);
        g.fillEllipse(w * xFrac, h * 0.84, width, h * 0.026);
      });
    };

    redraw();
    this.worldAdd(g);
    this._bg = g;
    this.scale.on('resize', redraw, this);
    this.events.once('shutdown', () => this.scale.off('resize', redraw, this));
  }
}
