// Linked Battle Transition — Batch 04A
//
// Shared presentation-only transition between Tactical and full Battle
// Presentation. No combat state, damage, pathfinding, or camera bookkeeping.
//
// The language is intentionally "Veil fracture / aperture" rather than a
// generic scene fade:
//   Tactical -> BP: battlefield darkens, prismatic seam forms, fracture opens.
//   BP -> Tactical: fracture collapses inward, returning to the same map state.
//
// No generated art required. Phaser geometry/tweens only.
export default class LinkedBattleTransition {
  constructor(scene) {
    this.scene = scene;
    this.activeLayer = null;
  }

  _uiAdd(obj) {
    if (this.scene.uiAdd) {
      this.scene.uiAdd(obj);
    } else if (this.scene.uiLayer) {
      this.scene.uiLayer.add(obj);
    }
    return obj;
  }

  _destroyLayer(layer) {
    if (!layer) return;
    try { layer.destroy(); } catch (err) {}
    if (this.activeLayer === layer) this.activeLayer = null;
  }

  _makeLayer() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const layer = this.scene.add.container(0, 0).setDepth(5000);
    this._uiAdd(layer);
    this.activeLayer = layer;

    // Opaque base is deliberately absent at creation so Tactical remains
    // visible for the first beat. The two curtains do the actual closing.
    const wash = this.scene.add.rectangle(0, 0, w, h, 0x070611, 0)
      .setOrigin(0, 0);

    const left = this.scene.add.rectangle(0, 0, w * 0.52, h, 0x060711, 1)
      .setOrigin(1, 0)
      .setPosition(0, 0);

    const right = this.scene.add.rectangle(0, 0, w * 0.52, h, 0x060711, 1)
      .setOrigin(0, 0)
      .setPosition(w, 0);

    const seamGlow = this.scene.add.rectangle(w / 2, h / 2, 8, h * 1.15, 0x9f78ff, 0)
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    const seamCore = this.scene.add.rectangle(w / 2, h / 2, 2, h * 1.08, 0xe5d7ff, 0)
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    const shardG = this.scene.add.graphics();
    shardG.setBlendMode(Phaser.BlendModes.ADD);
    shardG.setAlpha(0);

    // A restrained set of fracture slashes. Fixed geometry relative to
    // viewport means the transition works on phone and desktop with no art.
    const cx = w / 2;
    const cy = h / 2;
    const cracks = [
      [[cx, cy - h * .31], [cx - w * .08, cy - h * .18], [cx - w * .03, cy - h * .06]],
      [[cx, cy - h * .20], [cx + w * .09, cy - h * .08], [cx + w * .04, cy + h * .02]],
      [[cx, cy - h * .02], [cx - w * .10, cy + h * .10], [cx - w * .04, cy + h * .20]],
      [[cx, cy + h * .08], [cx + w * .11, cy + h * .18], [cx + w * .05, cy + h * .30]]
    ];
    shardG.lineStyle(Math.max(1.2, w * .0022), 0xb690ff, 0.8);
    cracks.forEach(points => {
      shardG.beginPath();
      shardG.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) shardG.lineTo(points[i][0], points[i][1]);
      shardG.strokePath();
    });

    layer.add([wash, left, right, shardG, seamGlow, seamCore]);

    return { layer, wash, left, right, shardG, seamGlow, seamCore, w, h };
  }

  // Tactical -> BP.
  // The selected battlefield remains visible while the fracture forms,
  // then the curtains close. Caller launches BP only after this resolves.
  playEnter(duration = 320) {
    return new Promise(resolve => {
      if (this.activeLayer) this._destroyLayer(this.activeLayer);
      const v = this._makeLayer();
      const t = this.scene.tweens;

      // Start curtains just outside the viewport.
      v.left.x = -v.w * 0.06;
      v.right.x = v.w * 1.06;

      t.add({
        targets: v.wash,
        alpha: 0.42,
        duration: Math.round(duration * 0.42),
        ease: 'Quad.easeOut'
      });

      t.add({
        targets: [v.seamGlow, v.seamCore, v.shardG],
        alpha: 1,
        duration: Math.round(duration * 0.30),
        ease: 'Quad.easeOut'
      });

      t.add({
        targets: v.seamGlow,
        scaleX: { from: 0.35, to: 2.4 },
        duration: Math.round(duration * 0.48),
        yoyo: true,
        ease: 'Sine.easeInOut'
      });

      this.scene.time.delayedCall(Math.round(duration * 0.34), () => {
        t.add({
          targets: v.left,
          x: v.w / 2 + 2,
          duration: Math.round(duration * 0.66),
          ease: 'Cubic.easeIn'
        });
        t.add({
          targets: v.right,
          x: v.w / 2 - 2,
          duration: Math.round(duration * 0.66),
          ease: 'Cubic.easeIn',
          onComplete: () => {
            // Keep the layer intact/opaque until Tactical is hidden and BP
            // launches. TacticalScene explicitly calls clear() after launch.
            resolve();
          }
        });
      });
    });
  }

  // Called by Tactical immediately after BP launches. Tactical is hidden at
  // that point, so destroying its transition layer cannot flash the map.
  clear() {
    this._destroyLayer(this.activeLayer);
  }

  // BP entrance reveal. Starts closed over the newly-created battle scene
  // and opens quickly while the existing BP camera/pose intro sweep plays.
  playBattleReveal(duration = 360) {
    return new Promise(resolve => {
      if (this.activeLayer) this._destroyLayer(this.activeLayer);
      const v = this._makeLayer();
      const t = this.scene.tweens;

      v.wash.setAlpha(0.70);
      v.left.setPosition(v.w / 2 + 2, 0);
      v.right.setPosition(v.w / 2 - 2, 0);
      v.seamGlow.setAlpha(0.95);
      v.seamCore.setAlpha(1);
      v.shardG.setAlpha(0.75);

      t.add({
        targets: v.left,
        x: -v.w * 0.06,
        duration,
        ease: 'Cubic.easeOut'
      });
      t.add({
        targets: v.right,
        x: v.w * 1.06,
        duration,
        ease: 'Cubic.easeOut'
      });
      t.add({
        targets: [v.wash, v.seamGlow, v.seamCore, v.shardG],
        alpha: 0,
        duration: Math.round(duration * 0.90),
        ease: 'Quad.easeOut',
        onComplete: () => {
          this._destroyLayer(v.layer);
          resolve();
        }
      });
    });
  }

  // BP -> Tactical. Collapse the Battle Presentation through the same seam.
  // Caller applies BattleResult to the still-paused Tactical scene only once
  // the screen is fully covered.
  playReturn(duration = 300) {
    return new Promise(resolve => {
      if (this.activeLayer) this._destroyLayer(this.activeLayer);
      const v = this._makeLayer();
      const t = this.scene.tweens;

      v.left.x = -v.w * 0.06;
      v.right.x = v.w * 1.06;

      t.add({
        targets: v.wash,
        alpha: 0.36,
        duration: Math.round(duration * 0.42)
      });
      t.add({
        targets: [v.seamGlow, v.seamCore, v.shardG],
        alpha: 1,
        duration: Math.round(duration * 0.38)
      });

      this.scene.time.delayedCall(Math.round(duration * 0.26), () => {
        t.add({
          targets: v.left,
          x: v.w / 2 + 2,
          duration: Math.round(duration * 0.74),
          ease: 'Cubic.easeIn'
        });
        t.add({
          targets: v.right,
          x: v.w / 2 - 2,
          duration: Math.round(duration * 0.74),
          ease: 'Cubic.easeIn',
          onComplete: resolve
        });
      });
    });
  }
}
