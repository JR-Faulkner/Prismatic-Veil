// Veil Wraith battle view — procedural shadow/crystal silhouette in the
// Hushling family style (triangular cloak, violet-black core, pale
// glowing eyes, floating shards). Placeholder until dedicated enemy art
// arrives; swap the drawn body for a texture then.
export default class EnemyWraithView {
  constructor(scene) {
    this.scene = scene;
  }

  create() {
    this.container = this.scene.add.container(0, 0);

    this.body = this.scene.add.graphics();
    this.body.fillStyle(0x12051d, 0.95);
    this.body.fillTriangle(0, -150, 62, 0, -62, 0);
    this.body.lineStyle(3, 0x8a45ff, 0.85);
    this.body.strokeTriangle(0, -150, 62, 0, -62, 0);
    this.body.fillStyle(0x2a0f45, 0.8);
    this.body.fillTriangle(0, -118, 40, -8, -40, -8);

    this.eyeL = this.scene.add.circle(-16, -92, 6, 0xdab8ff, 0.95);
    this.eyeR = this.scene.add.circle(16, -92, 6, 0xdab8ff, 0.95);

    this.shards = [];
    const shardSpots = [[-58, -120], [64, -96], [-70, -52], [70, -40]];
    shardSpots.forEach(([sx, sy], i) => {
      const shard = this.scene.add.star(sx, sy, 4, 3, 9, 0xc477ff, 0.7);
      this.shards.push(shard);
      this.scene.tweens.add({
        targets: shard,
        y: sy - 10,
        angle: 45,
        duration: 1100 + i * 260,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    this.container.add([this.body, this.eyeL, this.eyeR, ...this.shards]);

    // idle hover
    this.scene.tweens.add({
      targets: this.container,
      y: '-=8',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.layout();
    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.layout, this);
    });
  }

  layout() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const compact = width < 560;
    this.baseX = Math.round(width * (compact ? 0.74 : 0.76));
    this.baseY = Math.round(height - (compact ? 168 : 166));
    this.container.setPosition(this.baseX, this.baseY);
    this.container.setScale((compact ? 0.24 : 0.32) * height / 250);
  }

  hit() {
    // recoil shake + eye flare
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX + 14,
      duration: 60,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => this.container.setX(this.baseX)
    });
    this.scene.tweens.add({
      targets: [this.eyeL, this.eyeR],
      alpha: 0.2,
      duration: 90,
      yoyo: true,
      repeat: 2
    });
  }

  attack() {
    // lunge toward the hero and back
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX - 42,
      duration: 180,
      yoyo: true,
      ease: 'Back.Out',
      onComplete: () => this.container.setX(this.baseX)
    });
  }

  die() {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: this.container.scaleX * 0.6,
      scaleY: this.container.scaleY * 0.6,
      angle: 12,
      duration: 700,
      ease: 'Quad.In'
    });
  }

  reset() {
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(1).setAngle(0);
    this.layout();
    this.scene.tweens.add({
      targets: this.container,
      y: '-=8',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
