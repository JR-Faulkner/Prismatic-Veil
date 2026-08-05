// Hero battle pose view.
// Canonical sequence: Idle → Step → Gather → Release → Recover → Idle.
// The pose set and per-pose facing come from the hero's config entry, so
// swapping characters is data only. Any pose whose texture is missing
// falls back to the locked full-body Prismel art. Never regenerate art.
export default class HeroPoseView {
  constructor(scene, hero) {
    this.scene = scene;
    this.hero = hero;
  }

  create() {
    this.applyHero(this.hero, true);

    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.layout, this);
      if (this._idleCue) { this._idleCue.remove(false); this._idleCue = null; }
    });
  }

  // Swap in a different hero's pose set at runtime.
  applyHero(hero, first) {
    this.hero = hero;
    this.poseTex = {};
    for (const [pose, tex] of Object.entries(hero.poses)) {
      this.poseTex[pose] = this.scene.textures.exists(tex) ? tex : 'prismelLocked';
    }
    this.flip = hero.flip || {};

    if (first) {
      this.sprite = this.scene.add.image(0, 0, this.poseTex.idle).setOrigin(0.5, 1);
      // ghost layer holds the outgoing pose so swaps crossfade
      this.ghost = this.scene.add.image(0, 0, this.poseTex.idle)
        .setOrigin(0.5, 1).setAlpha(0);
      if (this.scene.worldAdd) this.scene.worldAdd([this.ghost, this.sprite]);
    } else {
      this.scene.tweens.killTweensOf([this.sprite, this.ghost]);
      this.ghost.setAlpha(0);
      this.sprite.setAlpha(1).setTexture(this.poseTex.idle);
    }

    this.sprite.setFlipX(!!this.flip.idle);
    this.currentPose = 'idle';
    this.layout();
  }

  layout() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const landscape = width > height;
    const compact = width < 560 || height < 520;

    // One scale for the whole pose set, derived from the idle frame.
    // Fitting each pose to the same screen height would blow up crouched
    // or wide poses, which are legitimately shorter than the idle.
    // Foreground: the hero is nearest the camera. Landscape spends more
    // of its scarce height on the hero than portrait does, since there's
    // no narration box beneath eating into the same band.
    const targetH = landscape ? height * 0.54 : height * (compact ? 0.38 : 0.44);
    const refTex = this.scene.textures.get(this.poseTex.idle);
    const refImg = refTex && refTex.getSourceImage();
    const mul = this.hero && this.hero.scaleMul ? this.hero.scaleMul : 1;
    const scale = (refImg && refImg.height ? targetH / refImg.height : 1) * mul;
    this.sprite.setScale(scale);
    if (this.ghost) this.ghost.setScale(scale);

    // Landscape brings the fighters in from portrait's wide 0.22/0.79
    // split, which left a dead void in the middle of a canvas this
    // short and this wide.
    this.baseX = Math.round(width * (landscape ? 0.30 : (compact ? 0.24 : 0.22)));
    this.baseY = landscape
      ? Math.round(height * 0.90)
      // leaves a clear band above the dialog box for the speaker plate
      : Math.round(height - (compact ? 190 : 166));
    if (this.currentPose !== 'step' && this.currentPose !== 'release') {
      this.sprite.setPosition(this.baseX, this.baseY);
    }
    if (this.ghost) this.ghost.setPosition(this.sprite.x, this.sprite.y);
  }

  // Slide in from the far right as the stage sweeps, settling into place.
  introSlide(duration = 520) {
    this.layout();
    const from = this.baseX + this.scene.scale.width * 0.75;
    this.sprite.setPosition(from, this.baseY).setAlpha(0);
    if (this.ghost) this.ghost.setAlpha(0);
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.baseX,
      duration,
      ease: 'Quad.easeOut'
    });
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration: duration * 0.4,
      ease: 'Quad.easeOut'
    });
  }

  // Subtle idle signature: a slow breath on the sprite, plus a soft
  // recurring cue for heroes that ship one (Kineza's kinetic pulse).
  // Package 06 called this but never defined it.
  startIdleSignature() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.012,
      scaleY: this.sprite.scaleY * 1.022,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (this._idleCue) { this._idleCue.remove(false); this._idleCue = null; }
    const bank = this.scene.sfx && this.hero && this.scene.sfx[this.hero.id];
    if (!bank || !bank.idle) return;
    this._idleCue = this.scene.time.addEvent({
      delay: 5400,
      loop: true,
      callback: () => {
        if (this.currentPose === 'idle' && !this.scene.sound.locked) bank.idle.play();
      }
    });
  }

  setPose(pose, blendMs = 110) {
    if (!this.poseTex[pose]) return;

    // Clear the previous pose's motion and idle tweens FIRST. Doing this
    // after the crossfade below would kill the alpha restore it creates
    // and strand the sprite at 0.15 opacity for the rest of the battle.
    this.scene.tweens.killTweensOf(this.sprite);

    // pose blending: park the outgoing frame on the ghost layer and ease
    // the two past each other.
    if (this.ghost && this.sprite.texture.key !== this.poseTex[pose]) {
      this.scene.tweens.killTweensOf(this.ghost);
      // The ghost sits *behind* the sprite, so it stays fully opaque and
      // the incoming pose fades in over it. Fading both at once — as this
      // originally did — leaves neither layer solid, and any pause mid
      // blend (hit stop freezes tweens) shows the background straight
      // through the character.
      this.ghost.setTexture(this.sprite.texture.key)
        .setFlipX(this.sprite.flipX)
        .setPosition(this.sprite.x, this.sprite.y)
        .setScale(this.sprite.scaleX, this.sprite.scaleY)
        .setAlpha(1);
      this.sprite.setAlpha(0);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 1,
        duration: blendMs,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.sprite.setAlpha(1);
          this.ghost.setAlpha(0);
        }
      });
    }

    this.currentPose = pose;
    this.sprite.setTexture(this.poseTex[pose]);
    this.sprite.setFlipX(!!this.flip[pose]);
    this.layout();

    const t = this.scene.tweens;
    switch (pose) {
      case 'step':
        t.add({ targets: this.sprite, x: this.baseX + 26, duration: 220, ease: 'Quad.easeOut' });
        break;
      case 'gather':
        t.add({ targets: this.sprite, scaleX: this.sprite.scaleX * 1.04, scaleY: this.sprite.scaleY * 1.04, duration: 260, yoyo: true, ease: 'Sine.easeInOut' });
        break;
      case 'release':
        t.add({ targets: this.sprite, x: this.baseX + 44, duration: 120, ease: 'Back.easeOut' });
        break;
      case 'recover':
        t.add({ targets: this.sprite, x: this.baseX, duration: 300, ease: 'Quad.easeInOut' });
        break;
      default:
        this.sprite.setPosition(this.baseX, this.baseY);
        this.startIdleSignature();
    }
  }
}
