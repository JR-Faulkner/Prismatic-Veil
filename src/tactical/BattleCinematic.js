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

      // Portrait sources aren't all the same resolution — most of this
      // roster is 256x256, but Auryi's is 1122x1402. A bare `scale: 1`
      // (native pixel size) rendered her at full source resolution on a
      // 390px phone screen, filling the entire viewport with her face
      // instead of sitting in her half of the cut-in like everyone else.
      // Normalizing every portrait to the same on-screen height — the
      // existing 256px set's own native size, so their look is unchanged —
      // makes this correct for any future portrait regardless of the
      // asset's actual resolution.
      const PORTRAIT_TARGET_H = 256;
      const attackerScale = PORTRAIT_TARGET_H / attackerImg.height;
      const targetScale = PORTRAIT_TARGET_H / targetImg.height;

      // A real box behind the name/flavor lines, not just text floating
      // over whatever the tactical map happens to show there — playtest
      // feedback was that this cut-in's own narration was unreadable.
      // Fixed size regardless of whether flavor is empty (as it is from
      // TacticalScene.enemyAttack() today) rather than only sizing for
      // whatever's actually populated, so a future non-empty flavor
      // string doesn't need this box's math touched too.
      const textBoxY = h * 0.81;
      const textBox = this.scene.add.rectangle(w / 2, textBoxY, Math.min(w - 32, 420), 80, 0x05040a, 0.78)
        .setStrokeStyle(1, 0x5a3a88, 0.75)
        .setOrigin(0.5)
        .setAlpha(0);

      // Sized up from the original v0.4 pass (13px/11px minimums) — kid
      // playtesting flagged this box's text as hard to read on a real
      // phone, the same complaint that drove BP's own tap-gated dialogue.
      const nameLabel = this.scene.add.text(w / 2, h * 0.78, `${attackerName} uses ${abilityName}!`, {
        fontSize: Math.round(Math.max(16, w * 0.04)) + 'px',
        fontStyle: 'bold',
        color: '#FFE8A0'
      }).setOrigin(0.5).setAlpha(0);
      const flavorLabel = this.scene.add.text(w / 2, h * 0.84, flavor || '', {
        fontSize: Math.round(Math.max(15, w * 0.036)) + 'px',
        color: '#C8A8FF'
      }).setOrigin(0.5).setAlpha(0);

      // Tap-to-continue prompt — hidden until the impact beat reveals the
      // damage line, then it's the only way forward (see below). Same
      // pulsing-prompt language as TitleScene's own tap prompt.
      const tapPrompt = this.scene.add.text(w / 2, h * 0.895, '▼ Tap to continue', {
        fontSize: Math.round(Math.max(13, w * 0.03)) + 'px',
        fontStyle: 'bold',
        color: '#C8A8FF'
      }).setOrigin(0.5).setAlpha(0);

      layer.add([overlay, attackerImg, targetImg, textBox, nameLabel, flavorLabel, tapPrompt]);

      const t = this.scene.tweens;
      t.add({ targets: overlay, alpha: 0.74, duration: this.timing.cinematicInMs });
      t.add({
        targets: attackerImg, alpha: 1, scale: attackerScale,
        duration: this.timing.cinematicInMs, ease: 'Back.easeOut'
      });
      t.add({
        targets: targetImg, alpha: 1, scale: targetScale,
        duration: this.timing.cinematicInMs, ease: 'Back.easeOut', delay: 60
      });
      t.add({ targets: [textBox, nameLabel, flavorLabel], alpha: 1, duration: 180, delay: 140 });

      this.scene.time.delayedCall(this.timing.cinematicHoldMs, () => {
        // onImpact does the actual damage math (TacticalScene owns that,
        // this module never touches it) and can return the resulting
        // "<target> suffers <n> damage!" line — the cut-in only ever
        // said "<attacker> uses <ability>!" and sat there for the whole
        // hold, never actually telling the player what happened to their
        // hero. flavorLabel is already faded in and empty for enemy
        // attacks (see the caller), so it's a free second line rather
        // than a layout change.
        const impactText = onImpact ? onImpact() : null;
        if (impactText) {
          flavorLabel.setText(impactText);
          t.add({ targets: flavorLabel, scale: { from: 1.2, to: 1 }, duration: 160, ease: 'Back.easeOut' });
        }
        this.scene.cameras.main.flash(140, 255, 240, 200);
        // Presentation weight to match the full Battle Presentation's own
        // hit language — a flinch-compress on the target portrait plus a
        // camera micro-shake, rather than just the flash this cut-in
        // shipped with. Still purely visual, no camera "tactical-state
        // bookkeeping" (that stays TacticalCamera's save/restore, called
        // by TacticalScene around this whole cut-in) — a bare .shake()
        // call is the same kind of stateless, self-contained effect the
        // .flash() call right above it already is.
        this.scene.cameras.main.shake(160, 0.008);
        t.add({
          targets: targetImg,
          scaleX: targetImg.scaleX * 0.92,
          scaleY: targetImg.scaleY * 0.92,
          duration: 80,
          yoyo: true,
          ease: 'Quad.easeOut'
        });

        // Live playtesting: this used to auto-close on a fixed timer right
        // after showing the damage line, same "read it before it's gone"
        // problem BP's dialogue had before it went tap-gated. The cut-in
        // now waits out the same settle beat (letting the shake/flinch
        // above actually finish) and then genuinely waits for a tap
        // before closing — no fixed hold guessing how fast the player
        // reads.
        this.scene.time.delayedCall(this.timing.cinematicOutMs, () => {
          t.add({ targets: tapPrompt, alpha: 1, duration: 200, onComplete: () => {
            this.scene.tweens.add({
              targets: tapPrompt,
              alpha: { from: 1, to: 0.4 },
              duration: 550,
              yoyo: true,
              repeat: -1
            });
          } });

          this.scene.input.once('pointerdown', () => {
            this.scene.tweens.killTweensOf(tapPrompt);
            t.add({
              targets: [overlay, attackerImg, targetImg, textBox, nameLabel, flavorLabel, tapPrompt],
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
    });
  }
}
