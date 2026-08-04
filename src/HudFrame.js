// Package 07 — battle frame.
// A thin Veil border with faceted crystal corners that reacts to the
// fight: a pulse as energy gathers, a flare on criticals, a bloom on
// victory. Lives on the UI layer so it never zooms with the world.
export default class HudFrame {
  constructor(scene) {
    this.scene = scene;
  }

  create(hero) {
    this.accent = (hero && hero.accent) || 0x9b7bff;
    this.accentAlt = (hero && hero.accentAlt) || 0xffd56a;

    this.border = this.scene.add.graphics().setDepth(1100);
    this.corners = this.scene.add.graphics().setDepth(1101);
    // Full-screen wash used for crit flare and victory bloom.
    this.wash = this.scene.add.rectangle(0, 0, 10, 10, this.accent, 0)
      .setOrigin(0, 0).setDepth(1099);

    if (this.scene.uiLayer) {
      this.scene.uiLayer.add([this.wash, this.border, this.corners]);
    }

    this.layout();
    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.layout, this);
    });
  }

  layout() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const compact = w < 560;
    const inset = compact ? 5 : 8;
    const c = compact ? 16 : 24;   // corner arm length

    this.wash.setSize(w, h);

    this.border.clear();
    this.border.lineStyle(1, this.accent, 0.30);
    this.border.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    this.border.lineStyle(1, this.accentAlt, 0.12);
    this.border.strokeRect(inset + 3, inset + 3, w - (inset + 3) * 2, h - (inset + 3) * 2);

    // Faceted crystal corners: a small diamond with two arms running
    // along each edge.
    this.corners.clear();
    const corner = (x, y, sx, sy) => {
      this.corners.lineStyle(2, this.accent, 0.85);
      this.corners.beginPath();
      this.corners.moveTo(x + sx * c, y);
      this.corners.lineTo(x, y);
      this.corners.lineTo(x, y + sy * c);
      this.corners.strokePath();

      this.corners.fillStyle(this.accentAlt, 0.9);
      const d = compact ? 3.4 : 4.6;
      this.corners.beginPath();
      this.corners.moveTo(x + sx * d * 2, y + sy * d * 2);
      this.corners.lineTo(x + sx * d * 3.4, y + sy * d * 0.6);
      this.corners.lineTo(x + sx * d * 4.8, y + sy * d * 2);
      this.corners.lineTo(x + sx * d * 3.4, y + sy * d * 3.4);
      this.corners.closePath();
      this.corners.fillPath();
    };
    corner(inset, inset, 1, 1);
    corner(w - inset, inset, -1, 1);
    corner(inset, h - inset, 1, -1);
    corner(w - inset, h - inset, -1, -1);
  }

  // Recolour when the active hero changes.
  applyHero(hero) {
    if (!hero) return;
    this.accent = hero.accent || this.accent;
    this.accentAlt = hero.accentAlt || this.accentAlt;
    this.wash.setFillStyle(this.accent, this.wash.alpha);
    this.layout();
  }

  // Slow swell while the attack charges.
  gatherPulse(duration = 450) {
    this.scene.tweens.killTweensOf(this.corners);
    this.corners.setAlpha(1);
    this.scene.tweens.add({
      targets: this.corners,
      alpha: 0.45,
      duration: duration / 2,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  // Sharp gold wash on a critical.
  critFlare() {
    this._wash(0xffd56a, 0.26, 90, 320);
  }

  // Warm bloom when the enemy shatters.
  victoryBloom() {
    this._wash(0xfff0c0, 0.34, 220, 900);
    this.scene.tweens.killTweensOf(this.corners);
    this.corners.setAlpha(1);
    this.scene.tweens.add({
      targets: this.corners,
      alpha: 0.3,
      duration: 420,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut'
    });
  }

  _wash(color, peak, up, down) {
    this.scene.tweens.killTweensOf(this.wash);
    this.wash.setFillStyle(color, 0).setAlpha(0);
    this.scene.tweens.add({
      targets: this.wash,
      alpha: peak,
      duration: up,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.wash,
          alpha: 0,
          duration: down,
          ease: 'Quad.easeOut'
        });
      }
    });
  }
}
