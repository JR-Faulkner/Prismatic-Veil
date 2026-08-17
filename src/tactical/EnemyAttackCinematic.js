// Enemy Attack Presentation — Batch 04D
//
// Fast, auto-resolving Tactical enemy cut-ins.
// Presentation only: damage/state are still owned by TacticalScene through
// the onImpact callback.
//
// Design:
//   Hushling   = short, heavy, horizontal body-pressure strike.
//   Veil Wraith = slightly longer spectral pull-in with violet distortion.
//
// No tap gate. Enemy Phase must continue automatically.
export default class EnemyAttackCinematic {
  constructor(scene) {
    this.scene = scene;
    this.activeLayer = null;
  }

  _profile(enemyType) {
    if (enemyType === 'veil_wraith') {
      return {
        duration: 980,
        overlayAlpha: 0.66,
        accent: 0xa978ff,
        core: 0xe8ddff,
        attackerX: 0.72,
        targetX: 0.28,
        attackerScale: 1.12,
        targetScale: 0.92,
        entranceMs: 250,
        chargeMs: 240,
        impactMs: 150,
        recoverMs: 260,
        driftY: -18,
        shake: 0.006
      };
    }

    return {
      duration: 720,
      overlayAlpha: 0.48,
      accent: 0xd84b52,
      core: 0xffc8b8,
      attackerX: 0.70,
      targetX: 0.30,
      attackerScale: 1.05,
      targetScale: 0.92,
      entranceMs: 170,
      chargeMs: 130,
      impactMs: 120,
      recoverMs: 200,
      driftY: 0,
      shake: 0.009
    };
  }

  _normalize(img, targetHeight) {
    const sourceH = Math.max(1, img.height || 1);
    return targetHeight / sourceH;
  }

  _destroy(layer) {
    if (!layer) return;
    try { layer.destroy(); } catch (err) {}
    if (this.activeLayer === layer) this.activeLayer = null;
  }

  play(opts) {
    return new Promise(resolve => {
      const {
        enemyType,
        attackerKey,
        attackerName,
        targetKey,
        targetName,
        abilityName,
        onImpact
      } = opts;

      const p = this._profile(enemyType);
      const w = this.scene.scale.width;
      const h = this.scene.scale.height;
      const compact = w < 560 || h < 520;

      if (this.activeLayer) this._destroy(this.activeLayer);

      const layer = this.scene.add.container(0, 0).setDepth(1800);
      this.activeLayer = layer;
      if (this.scene.uiAdd) this.scene.uiAdd(layer);

      const overlay = this.scene.add.rectangle(0, 0, w, h, 0x05050c, 0)
        .setOrigin(0, 0);

      const edgeWash = this.scene.add.rectangle(
        enemyType === 'veil_wraith' ? w : 0,
        0,
        w * 0.48,
        h,
        p.accent,
        0
      ).setOrigin(enemyType === 'veil_wraith' ? 1 : 0, 0)
       .setBlendMode(Phaser.BlendModes.ADD);

      const attacker = this.scene.add.image(w * p.attackerX, h * 0.48, attackerKey)
        .setAlpha(0);
      const target = this.scene.add.image(w * p.targetX, h * 0.50, targetKey)
        .setAlpha(0)
        .setFlipX(true);

      const portraitH = compact ? Math.min(190, h * 0.48) : Math.min(270, h * 0.46);
      const attackerBaseScale = this._normalize(attacker, portraitH) * p.attackerScale;
      const targetBaseScale = this._normalize(target, portraitH) * p.targetScale;

      attacker.setScale(attackerBaseScale * 0.78);
      target.setScale(targetBaseScale);

      // Slim label, not a dialogue box. Enemy Phase should not stop to read.
      const labelBg = this.scene.add.rectangle(
        w / 2,
        h * 0.79,
        Math.min(w - 28, 390),
        compact ? 42 : 48,
        0x070711,
        0
      ).setStrokeStyle(1, p.accent, 0.72);

      const label = this.scene.add.text(
        w / 2,
        h * 0.79,
        `${attackerName} • ${abilityName}`,
        {
          fontFamily: 'Georgia, serif',
          fontStyle: 'bold',
          fontSize: `${compact ? 14 : 17}px`,
          color: '#FFE8A0'
        }
      ).setOrigin(0.5).setAlpha(0);

      const slash = this.scene.add.graphics().setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);

      // Wraith gets vertical spectral seams; Hushling gets a compact diagonal
      // impact wedge. Same system, different silhouette language.
      if (enemyType === 'veil_wraith') {
        slash.lineStyle(Math.max(2, w * 0.004), p.accent, 0.9);
        [-1, 0, 1].forEach(i => {
          const x = w * 0.5 + i * 18;
          slash.beginPath();
          slash.moveTo(x - 22, h * 0.16);
          slash.lineTo(x + 14, h * 0.44);
          slash.lineTo(x - 8, h * 0.72);
          slash.strokePath();
        });
      } else {
        slash.fillStyle(p.accent, 0.72);
        slash.fillTriangle(
          w * 0.43, h * 0.38,
          w * 0.58, h * 0.50,
          w * 0.43, h * 0.62
        );
      }

      const impactRing = this.scene.add.ellipse(
        w * p.targetX,
        h * 0.50,
        24,
        16,
        0x000000,
        0
      ).setStrokeStyle(3, p.core, 0)
       .setBlendMode(Phaser.BlendModes.ADD);

      layer.add([
        overlay,
        edgeWash,
        attacker,
        target,
        slash,
        impactRing,
        labelBg,
        label
      ]);

      const t = this.scene.tweens;

      // Entrance.
      t.add({
        targets: overlay,
        alpha: p.overlayAlpha,
        duration: p.entranceMs,
        ease: 'Quad.easeOut'
      });
      t.add({
        targets: edgeWash,
        alpha: enemyType === 'veil_wraith' ? 0.13 : 0.09,
        duration: p.entranceMs
      });
      t.add({
        targets: attacker,
        alpha: 1,
        scaleX: attackerBaseScale,
        scaleY: attackerBaseScale,
        y: attacker.y + p.driftY,
        duration: p.entranceMs,
        ease: enemyType === 'veil_wraith' ? 'Sine.easeOut' : 'Back.easeOut'
      });
      t.add({
        targets: target,
        alpha: 0.96,
        duration: Math.round(p.entranceMs * 0.75)
      });
      t.add({
        targets: [labelBg, label],
        alpha: 1,
        duration: 120,
        delay: Math.round(p.entranceMs * 0.35)
      });

      // Wind-up.
      this.scene.time.delayedCall(p.entranceMs, () => {
        if (enemyType === 'veil_wraith') {
          t.add({
            targets: attacker,
            x: attacker.x - w * 0.055,
            alpha: { from: 1, to: 0.72 },
            duration: p.chargeMs,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
          t.add({
            targets: slash,
            alpha: { from: 0, to: 0.82 },
            duration: p.chargeMs,
            ease: 'Quad.easeOut'
          });
        } else {
          t.add({
            targets: attacker,
            x: attacker.x - w * 0.07,
            duration: p.chargeMs,
            ease: 'Quad.easeIn'
          });
        }
      });

      // Impact.
      const impactAt = p.entranceMs + p.chargeMs;
      this.scene.time.delayedCall(impactAt, () => {
        const impactText = onImpact ? onImpact() : null;

        this.scene.cameras.main.flash(
          p.impactMs,
          enemyType === 'veil_wraith' ? 195 : 255,
          enemyType === 'veil_wraith' ? 165 : 205,
          enemyType === 'veil_wraith' ? 255 : 180
        );
        this.scene.cameras.main.shake(p.impactMs + 40, p.shake);

        slash.setAlpha(0.88);

        t.add({
          targets: impactRing,
          alpha: { from: 0.95, to: 0 },
          scaleX: { from: 0.5, to: enemyType === 'veil_wraith' ? 5.2 : 3.8 },
          scaleY: { from: 0.5, to: enemyType === 'veil_wraith' ? 3.4 : 2.6 },
          duration: p.impactMs + 120,
          ease: 'Expo.easeOut'
        });

        t.add({
          targets: target,
          x: target.x - (enemyType === 'veil_wraith' ? 8 : 16),
          scaleX: targetBaseScale * 0.90,
          scaleY: targetBaseScale * 0.94,
          duration: p.impactMs,
          yoyo: true,
          ease: 'Quad.easeOut'
        });

        if (impactText) {
          label.setText(impactText);
          t.add({
            targets: label,
            scaleX: { from: 1.08, to: 1 },
            scaleY: { from: 1.08, to: 1 },
            duration: 120,
            ease: 'Back.easeOut'
          });
        }
      });

      // Auto close. No tap gate.
      const closeAt = impactAt + p.impactMs + 150;
      this.scene.time.delayedCall(closeAt, () => {
        t.add({
          targets: [overlay, edgeWash, attacker, target, slash, impactRing, labelBg, label],
          alpha: 0,
          duration: p.recoverMs,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this._destroy(layer);
            resolve();
          }
        });
      });
    });
  }
}
