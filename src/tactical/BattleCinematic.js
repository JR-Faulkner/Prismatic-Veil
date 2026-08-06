// Tactical Field Foundation v2 — BattleCinematic.
// Owns presentation only. Receives attacker, target, action data, and an
// impact callback — never touches damage math, turn state, or the camera's
// tactical-state bookkeeping (TacticalCamera owns save/restore; this module
// just plays a cut-in while the camera is wherever TacticalScene left it).
export default class BattleCinematic {
  constructor(scene, timing) {
    this.scene = scene;
    this.timing = timing;
  }

  // opts: { attackerKey, attackerName, targetKey, targetName, abilityName,
  //         flavor, onImpact }
  // Resolves once the cut-in has fully closed, so a caller can safely
  // restore the tactical camera state right after.
  play(opts) {
    return new Promise(resolve => {
      const {
        attackerKey, attackerName, targetKey, targetName,
        abilityName, flavor, onImpact
      } = opts;
      const w = this.scene.scale.width;
      const h = this.scene.scale.height;

      const layer = this.scene.add.container(0, 0).setDepth(600);
      if (this.scene.uiAdd) this.scene.uiAdd(layer);

      const overlay = this.scene.add.rectangle(0, 0, w, h, 0x05040a, 0).setOrigin(0, 0);
      const attackerImg = this.scene.add.image(w * 0.26, h * 0.5, attackerKey)
        .setAlpha(0).setScale(0.001);
      const targetImg = this.scene.add.image(w * 0.74, h * 0.5, targetKey)
        .setAlpha(0).setScale(0.001).setFlipX(true);
      const nameLabel = this.scene.add.text(w / 2, h * 0.78, `${attackerName} uses ${abilityName}!`, {
        fontSize: Math.round(Math.max(13, w * 0.032)) + 'px',
        fontStyle: 'bold',
        color: '#FFE8A0'
      }).setOrigin(0.5).setAlpha(0);
      const flavorLabel = this.scene.add.text(w / 2, h * 0.84, flavor || '', {
        fontSize: Math.round(Math.max(11, w * 0.026)) + 'px',
        color: '#C8A8FF'
      }).setOrigin(0.5).setAlpha(0);

      layer.add([overlay, attackerImg, targetImg, nameLabel, flavorLabel]);

      const t = this.scene.tweens;
      t.add({ targets: overlay, alpha: 0.74, duration: this.timing.cinematicInMs });
      t.add({
        targets: attackerImg, alpha: 1, scale: 1,
        duration: this.timing.cinematicInMs, ease: 'Back.easeOut'
      });
      t.add({
        targets: targetImg, alpha: 1, scale: 1,
        duration: this.timing.cinematicInMs, ease: 'Back.easeOut', delay: 60
      });
      t.add({ targets: [nameLabel, flavorLabel], alpha: 1, duration: 180, delay: 140 });

      this.scene.time.delayedCall(this.timing.cinematicHoldMs, () => {
        if (onImpact) onImpact();
        this.scene.cameras.main.flash(140, 255, 240, 200);

        this.scene.time.delayedCall(this.timing.cinematicOutMs, () => {
          t.add({
            targets: [overlay, attackerImg, targetImg, nameLabel, flavorLabel],
            alpha: 0,
            duration: this.timing.cinematicOutMs,
            onComplete: () => {
              layer.destroy();
              resolve();
            }
          });
        });
      });
    });
  }
}
