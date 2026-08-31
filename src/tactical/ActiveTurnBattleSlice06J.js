// 06J — Kineza BLITZER 18F promotion over the validated 06A active-turn bridge.
//
// This layer changes Kineza's authored basic-attack presentation only.
// Tactical legality, target selection, exactly-once damage, turn resolution,
// Prismel, and Auryi remain inherited from the current active-turn stack.

import ActiveTurnBattleSlice06A from './ActiveTurnBattleSlice06A.js?v=12';

const BLITZER_PROGRESS = Object.freeze([
  0.00, 0.00, 0.04, 0.14, 0.34, 0.58, 0.82,
  1.00, 1.00, 1.00, 1.00, 1.00, 0.96, 0.86,
  0.62, 0.34, 0.10, 0.00
]);

const KINEZA_BLITZER = Object.freeze({
  entranceSheet: 'kineza_gauntlet_ignition_master_a',
  attackSheet: 'kineza_blitzer_basic_v1',
  attackLabel: 'BLITZER',
  entranceHolds: Object.freeze([220, 180, 220, 180, 260, 320]),
  attackHolds: Object.freeze([
    180,110,110,110,110,95,85,180,110,110,110,180,110,110,95,85,180,180
  ]),
  stage: Object.freeze({ xFrac: 0.035, yFrac: 0.012, scale: 0.96 }),
  attackTravel: BLITZER_PROGRESS,
  attackRegistration: Object.freeze(Array.from({ length: 18 }, () => Object.freeze({ scale: 1, x: 0, y: 0 })))
});

export default class ActiveTurnBattleSlice06J extends ActiveTurnBattleSlice06A {
  async run(hero, target) {
    this._activeTarget06J = target || null;
    try {
      return await super.run(hero, target);
    } finally {
      this._activeTarget06J = null;
      this._recovery06J = null;
    }
  }

  _canonSpec06A() {
    if (this._activeHero06A?.id === 'kineza') return KINEZA_BLITZER;
    return super._canonSpec06A();
  }

  // BLITZER travel is derived from the selected hero->target grid delta,
  // not a hard-coded enemy X. This keeps the cinematic rush tied to the
  // real Tactical target while the logical unit remains on its grid cell.
  _stage06A() {
    if (this._activeHero06A?.id !== 'kineza') return super._stage06A();

    const spec = KINEZA_BLITZER;
    const frame = this._activeFrame06A;
    let travelFrac = 0;

    if (frame?.phase === 'attack') {
      const progress = spec.attackTravel[frame.index] ?? 0;
      const hero = this._activeHero06A;
      const target = this._activeTarget06J;
      if (hero && target && this.scene?.grid?.toScreen) {
        const a = this.scene.grid.toScreen(hero.x, hero.y);
        const b = this.scene.grid.toScreen(target.x, target.y);
        const zoom = this.scene.cameras?.main?.zoom || 1;
        const width = Math.max(1, this._layoutMetrics().cutin.maxW);
        const targetDeltaFrac = Phaser.Math.Clamp(((b.x - a.x) * zoom) / width, -0.72, 0.72);
        travelFrac = targetDeltaFrac * progress * 0.88;
      }
    }

    return {
      xFrac: spec.stage.xFrac,
      yFrac: spec.stage.yFrac,
      scale: spec.stage.scale,
      travelFrac
    };
  }

  // Kineza's ignition master is 512px cells, while the promoted Blitzer
  // runtime sheet is 18x 128px cells. The current 06A layout assumed every
  // canon sheet was 512px, so 06J selects the correct cell authority by beat.
  _layoutCutin() {
    if (this._activeHero06A?.id !== 'kineza') return super._layoutCutin();

    const img = this._cutinImage;
    if (!img || !img.active) return;

    const metrics = this._layoutMetrics();
    const c = metrics.cutin;
    const reg = this._registration06A();
    const stage = this._stage06A();
    const cell = this._activeFrame06A?.phase === 'attack' ? 128 : 512;
    const baseScale = Math.min(c.maxW / cell, c.maxH / cell);
    const finalScale = baseScale * reg.scale * stage.scale;
    const centerX = c.x + c.maxW / 2;
    const x = centerX
      + (stage.xFrac + stage.travelFrac) * c.maxW
      + reg.x * baseScale;
    const y = c.bottomY
      + stage.yFrac * c.maxH
      + reg.y * baseScale;

    img
      .setOrigin(0.5, 1)
      .setScale(finalScale)
      .setPosition(x, y);

    this._stageSnapshot06A = {
      heroId: 'kineza',
      phase: this._activeFrame06A?.phase || '',
      index: this._activeFrame06A?.index ?? -1,
      x,
      y,
      centerX,
      targetId: this._activeTarget06J?.id || '',
      stageXFrac: stage.xFrac,
      travelFrac: stage.travelFrac
    };
  }

  async _playAttackPresentation(hero, target) {
    const activeHero = hero || this._activeHero06A;
    if (activeHero?.id !== 'kineza') return super._playAttackPresentation(hero, target);

    const spec = KINEZA_BLITZER;
    for (let i = 0; i < 18; i++) this._assertSheetFrame06A(spec.attackSheet, i);

    // Frames 1-11 build and rush. Frame 12 is set, then control returns
    // immediately to the inherited run() so its single damage mutation lands
    // on the authored impact frame, not after the recovery animation.
    for (let i = 0; i < 11; i++) {
      this._setCanonFrame06A('attack', i);
      await this._delay(spec.attackHolds[i]);
    }

    this._setCanonFrame06A('attack', 11); // human Frame 12: impact authority
    if (this.scene.cameras?.main) this.scene.cameras.main.shake(120, 0.0045);

    // Recovery continues while the inherited exactly-once impact/HUD update
    // resolves. Its timing fits inside the existing post-impact hold/fade,
    // so teardown still occurs only after Frame 18 has returned home.
    this._recovery06J = (async () => {
      await this._delay(spec.attackHolds[11]);
      for (let i = 12; i < 18; i++) {
        this._setCanonFrame06A('attack', i);
        await this._delay(spec.attackHolds[i]);
      }
    })();
  }
}
