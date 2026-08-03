// Prismel battle pose view — pose library v1.
// Canonical sequence: Idle → Step → Gather → Release → Recover → Idle.
// Each pose maps to a LOCKED PNG in assets/poses/; any pose whose PNG
// is not present falls back to the locked full-body Prismel art, so the
// system runs before the pose set is uploaded and upgrades itself when
// the files land. Do not regenerate the character.
export const POSE_TEXTURES = {
  idle: 'Pose01_Idle_LOCKED',
  step: 'Pose02_StepForward_LOCKED',
  gather: 'Pose03_Gather_LOCKED',
  release: 'Pose04_PrismaticRelease_LOCKED',
  recover: 'Pose05_Recover_LOCKED'
};

// The hero stands on the left and must face right, toward the enemy.
// The pose art has mixed orientations — Release already fires its beam
// to the right, the others look left — so flipping is per pose.
const POSE_FLIP = {
  idle: true,
  step: true,
  gather: true,
  release: false,
  recover: true
};

export default class HeroPoseView {
  constructor(scene) {
    this.scene = scene;
  }

  create() {
    this.poseTex = {};
    for (const [pose, tex] of Object.entries(POSE_TEXTURES)) {
      this.poseTex[pose] = this.scene.textures.exists(tex) ? tex : 'prismelLocked';
    }

    this.sprite = this.scene.add.image(0, 0, this.poseTex.idle).setOrigin(0.5, 1);
    this.sprite.setFlipX(POSE_FLIP.idle);
    // v4: ghost layer holds the outgoing pose so swaps crossfade
    // instead of hard-cutting.
    this.ghost = this.scene.add.image(0, 0, this.poseTex.idle)
      .setOrigin(0.5, 1).setAlpha(0);
    this.currentPose = 'idle';
    if (this.scene.worldAdd) this.scene.worldAdd([this.ghost, this.sprite]);
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

    const targetH = height * (compact ? 0.31 : 0.38);
    const fit = img => {
      const src = img.texture.getSourceImage();
      img.setScale(src && src.height ? targetH / src.height : 1);
    };
    fit(this.sprite);
    if (this.ghost) fit(this.ghost);

    this.baseX = Math.round(width * (compact ? 0.26 : 0.24));
    // leaves a clear band above the dialog box for the speaker plate
    this.baseY = Math.round(height - (compact ? 206 : 176));
    if (this.currentPose !== 'step' && this.currentPose !== 'release') {
      this.sprite.setPosition(this.baseX, this.baseY);
    }
    if (this.ghost) this.ghost.setPosition(this.sprite.x, this.sprite.y);
  }

  setPose(pose, blendMs = 110) {
    if (!this.poseTex[pose]) return;

    // v4 pose blending: park the outgoing frame on the ghost layer and
    // ease the two past each other.
    if (this.ghost && this.sprite.texture.key !== this.poseTex[pose]) {
      this.scene.tweens.killTweensOf(this.ghost);
      this.ghost.setTexture(this.sprite.texture.key)
        .setFlipX(this.sprite.flipX)
        .setPosition(this.sprite.x, this.sprite.y)
        .setScale(this.sprite.scaleX, this.sprite.scaleY)
        .setAlpha(0.85);
      this.scene.tweens.add({
        targets: this.ghost,
        alpha: 0,
        duration: blendMs,
        ease: 'Sine.easeOut'
      });
      this.sprite.setAlpha(0.15);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 1,
        duration: blendMs,
        ease: 'Sine.easeIn'
      });
    }

    this.currentPose = pose;
    this.sprite.setTexture(this.poseTex[pose]);
    this.sprite.setFlipX(POSE_FLIP[pose]);
    this.layout();

    const t = this.scene.tweens;
    switch (pose) {
      case 'step':
        t.add({ targets: this.sprite, x: this.baseX + 26, duration: 220, ease: 'Quad.Out' });
        break;
      case 'gather':
        t.add({ targets: this.sprite, scaleX: this.sprite.scaleX * 1.04, scaleY: this.sprite.scaleY * 1.04, duration: 260, yoyo: true, ease: 'Sine.easeInOut' });
        break;
      case 'release':
        t.add({ targets: this.sprite, x: this.baseX + 44, duration: 120, ease: 'Back.Out' });
        break;
      case 'recover':
        t.add({ targets: this.sprite, x: this.baseX, duration: 300, ease: 'Quad.InOut' });
        break;
      default:
        this.sprite.setPosition(this.baseX, this.baseY);
    }
  }
}
