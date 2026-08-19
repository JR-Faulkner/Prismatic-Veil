// 06A canon active-turn bridge for Prismel, Auryi, and Kineza.
//
// Combat/state flow stays inherited from the validated 05M chain.
// This layer owns only hero-specific presentation authority for Auryi/Kineza
// using the approved production 3x2 masters ingested by PriZim.

import ActiveTurnBattleSlice05M from './ActiveTurnBattleSlice05M.js?v=1';

const CANON = Object.freeze({
  auryi: {
    entranceSheet: 'auryi_auorb_entrance_master_a',
    attackSheet: 'auryi_attack_master_a',
    attackLabel: 'ATTACK',
    entranceHolds: [220, 260, 300, 340, 360, 400],
    attackHolds: [150, 125, 115, 110, 150, 190],
    attackRegistration: [
      { scale: 0.98869, x: -5.07, y: 0.70 },
      { scale: 0.98869, x: -13.66, y: 0.70 },
      { scale: 0.98423, x: 4.09, y: 1.96 },
      { scale: 1.01628, x: 0.49, y: -8.12 },
      { scale: 1.01628, x: 19.92, y: -8.12 },
      { scale: 1.01628, x: -5.87, y: -8.12 }
    ]
  },
  kineza: {
    entranceSheet: 'kineza_gauntlet_ignition_master_a',
    attackSheet: 'kineza_attack_master_a',
    attackLabel: 'ATTACK',
    entranceHolds: [220, 180, 220, 180, 260, 320],
    attackHolds: [145, 115, 95, 105, 145, 190],
    attackRegistration: [
      { scale: 0.94027, x: -49.53, y: -11.83 },
      { scale: 0.99532, x: -58.12, y: -12.76 },
      { scale: 1.02163, x: -68.02, y: -17.17 },
      { scale: 1.01432, x: -73.30, y: -19.82 },
      { scale: 1.03659, x: -84.66, y: -27.30 },
      { scale: 0.97254, x: -50.06, y: -10.63 }
    ]
  }
});

export default class ActiveTurnBattleSlice06A extends ActiveTurnBattleSlice05M {
  shouldIntercept(hero, target) {
    return this.isEnabled()
      && !!hero && ['prismel', 'auryi', 'kineza'].includes(hero.id)
      && !!target && target.type === 'hushling' && target.alive;
  }

  async run(hero, target) {
    this._activeHero06A = hero || null;
    try {
      return await super.run(hero, target);
    } finally {
      this._activeHero06A = null;
      this._activeFrame06A = null;
    }
  }

  _canonSpec06A() {
    return this._activeHero06A ? CANON[this._activeHero06A.id] : null;
  }

  _ensureCutin() {
    const spec = this._canonSpec06A();
    if (!spec) return super._ensureCutin();
    if (this._cutinImage && this._cutinImage.active) return this._cutinImage;

    const img = this.scene.add.sprite(0, 0, spec.entranceSheet, 0)
      .setOrigin(0.5, 1)
      .setDepth(9400)
      .setAlpha(0);
    this._uiObject(img);
    this._cutinImage = img;
    this._activeFrame06A = { phase: 'entrance', index: 0 };
    return img;
  }

  _registration06A() {
    const spec = this._canonSpec06A();
    const frame = this._activeFrame06A;
    if (!spec || !frame || frame.phase !== 'attack') return { scale: 1, x: 0, y: 0 };
    return spec.attackRegistration[frame.index] || { scale: 1, x: 0, y: 0 };
  }

  _layoutCutin() {
    const spec = this._canonSpec06A();
    if (!spec) return super._layoutCutin();

    const img = this._cutinImage;
    if (!img || !img.active) return;

    const c = this._layoutMetrics().cutin;
    const reg = this._registration06A();
    const cell = 512;
    const baseScale = Math.min(c.maxW / cell, c.maxH / cell);
    const finalScale = baseScale * reg.scale;

    img
      .setOrigin(0.5, 1)
      .setScale(finalScale)
      .setPosition(
        c.x + c.maxW / 2 + reg.x * baseScale,
        c.bottomY + reg.y * baseScale
      );
  }

  _assertSheetFrame06A(sheet, index) {
    const textures = this.scene && this.scene.textures;
    if (!textures || !textures.exists(sheet)) {
      throw new Error(`PriZim runtime asset missing: ${sheet}`);
    }
    const texture = textures.get(sheet);
    const frame = texture && texture.get ? texture.get(index) : null;
    if (!frame) {
      throw new Error(`PriZim runtime frame missing: ${sheet}#${index}`);
    }
    return frame;
  }

  _setCanonFrame06A(phase, index) {
    const spec = this._canonSpec06A();
    const img = this._ensureCutin();
    if (!spec || !img) return;

    const sheet = phase === 'attack' ? spec.attackSheet : spec.entranceSheet;
    this._assertSheetFrame06A(sheet, index);
    this._activeFrame06A = { phase, index };

    if (img.texture.key !== sheet) img.setTexture(sheet);
    img.setFrame(index).setAlpha(1);
    this._layoutCutin();
  }

  _buildActionPanel(m, hero, parts) {
    const spec = this._canonSpec06A();
    if (!spec || !hero) return super._buildActionPanel(m, hero, parts);

    // The base presenter was authored for Prismel and reads hero.ability.
    // On the Auryi phone test that leaked PRISMATIC SHARD into her card.
    // Keep gameplay data untouched and override only the temporary display
    // label for the ATTACK slice until each hero's final basic-attack naming
    // is deliberately canonized.
    const oldAbility = hero.ability;
    hero.ability = spec.attackLabel;
    try {
      return super._buildActionPanel(m, hero, parts);
    } finally {
      hero.ability = oldAbility;
    }
  }

  async _introCutin() {
    const spec = this._canonSpec06A();
    if (!spec) return super._introCutin();

    const img = this._ensureCutin();
    this._setCanonFrame06A('entrance', 0);
    img.setAlpha(0);
    this.scene.tweens.add({ targets: img, alpha: 1, duration: 220, ease: 'Sine.easeOut' });

    for (let i = 0; i < 6; i++) {
      this._setCanonFrame06A('entrance', i);
      await this._delay(spec.entranceHolds[i]);
    }

    this._setCanonFrame06A('entrance', 5);
  }

  async _playAttackPresentation(hero, target) {
    const spec = this._canonSpec06A();
    if (!spec) return super._playAttackPresentation(hero, target);

    for (let i = 0; i < 6; i++) this._assertSheetFrame06A(spec.attackSheet, i);

    for (let i = 0; i < 6; i++) {
      this._setCanonFrame06A('attack', i);

      if (hero.id === 'kineza' && i > 0 && this._cutinImage && this._cutinImage.active) {
        const img = this._cutinImage;
        this.scene.tweens.add({
          targets: img,
          x: img.x + (i < 4 ? 5 : -3),
          duration: Math.min(90, spec.attackHolds[i]),
          ease: 'Sine.easeOut'
        });
      }

      if (hero.id === 'auryi' && i === 4 && this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(90, 0.0025);
      }
      if (hero.id === 'kineza' && i === 3 && this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(120, 0.0045);
      }

      await this._delay(spec.attackHolds[i]);
    }

    this._setCanonFrame06A('attack', 5);
  }
}
