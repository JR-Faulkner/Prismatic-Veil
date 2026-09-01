// LIVE25 formation polish.
// Keeps live24 Auryi scale/Auorb authority intact and corrects only crown centering/width.
import Live24PartyFormationView from './Live24PartyFormationView.js?v=live24';
import Live25DuoHybridSequenceDriver from './Live25DuoHybridSequenceDriver.js?v=live25';

const CROWN_X_FRAC = 0.09;
const CROWN_WIDTH_MUL = 1.15;

export default class Live25PartyFormationView extends Live24PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new Live25DuoHybridSequenceDriver(scene);
  }

  _auryiCrownAnchor(actor) {
    const base = super._auryiCrownAnchor(actor);
    return {
      x: base.x + actor.sprite.displayWidth * CROWN_X_FRAC,
      y: base.y
    };
  }

  _drawAuryiCrown(actor, alpha = 0.38, scale = 0.68) {
    const g = actor?.duoCrown;
    if (!g) return;
    const h = this.scene.scale.height;
    const r = Math.max(20, h * 0.056) * scale;
    g.clear();
    g.lineStyle(Math.max(2, h * 0.0048), 0xffd870, alpha);
    g.strokeEllipse(0, 0, r * 2.05 * CROWN_WIDTH_MUL, r * 0.70);
    g.lineStyle(Math.max(1.4, h * 0.0032), 0xc684ff, alpha * 0.62);
    g.strokeEllipse(0, 0, r * 2.34 * CROWN_WIDTH_MUL, r * 0.94);
    g.lineStyle(Math.max(1, h * 0.0022), 0xfff1b0, alpha * 0.85);
    const sx = CROWN_WIDTH_MUL;
    g.beginPath();
    g.moveTo(-r * 0.88 * sx, -r * 0.12);
    g.lineTo(-r * 0.64 * sx, -r * 0.54);
    g.lineTo(-r * 0.38 * sx, -r * 0.14);
    g.lineTo(0, -r * 0.70);
    g.lineTo(r * 0.38 * sx, -r * 0.14);
    g.lineTo(r * 0.64 * sx, -r * 0.54);
    g.lineTo(r * 0.88 * sx, -r * 0.12);
    g.strokePath();
  }
}
