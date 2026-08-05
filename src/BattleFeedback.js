// Battle Presentation Alpha v1.0 — Sheet 05 combat-feedback numerals.
//
// Ten tintable white masks plus ten original gold numerals, sliced from
// the Battle Feedback Kit with real alpha. Loaded like every other asset
// in the game — relative paths from the scene's preload() — rather than
// embedded as base64, which would have quadrupled this file for no
// benefit on a project with no CDN and no build step to strip it.
//
// Normal damage uses the tintable white mask, coloured by the attacker's
// accent. Critical damage uses the restrained-gold numeral treatment.
// Falls back to the older drawn floatDamage() if a texture is somehow
// missing, so a slow or partial load never leaves a blank hit.

const textureKey = (kind, digit) => `digit_${kind}_${digit}`;

export default class BattleFeedback {
  constructor(scene) {
    this.scene = scene;
    this._fallback = typeof scene.floatDamage === 'function'
      ? scene.floatDamage.bind(scene)
      : null;

    // Every floating number this instance creates, so a restart can kill
    // their tweens before they fire. Checking `obj.scene` in the
    // onComplete callback isn't enough: scene.restart() reuses the same
    // Scene instance, so that reference stays truthy even after its
    // systems are torn down, and a second destroy() pass crashes deep in
    // Phaser rather than no-op'ing.
    this._tracked = [];
    scene.events.once('shutdown', () => {
      this.scene.tweens.killTweensOf(this._tracked);
      this._tracked = [];
    });
  }

  _point(target) {
    if (target === 'enemy' && this.scene.enemyView) {
      const view = this.scene.enemyView;
      const c = view.container;
      const s = view.sprite;
      const h = s ? s.displayHeight * Math.abs(c.scaleY || 1) : 120;
      return { x: c.x, y: c.y - h * 0.72 };
    }

    const poses = this.scene.heroPoses;
    if (poses && poses.sprite) {
      const s = poses.sprite;
      return { x: s.x, y: s.y - s.displayHeight * 0.72 };
    }
    return {
      x: target === 'enemy' ? this.scene.scale.width * 0.72 : this.scene.scale.width * 0.28,
      y: this.scene.scale.height * 0.48
    };
  }

  _texturesReady(value, kind) {
    return String(Math.max(0, Math.round(value))).split('')
      .every(d => this.scene.textures.exists(textureKey(kind, d)));
  }

  _makeNumber(value, kind, tint, scale) {
    const s = this.scene;
    const container = s.add.container(0, 0).setDepth(42);
    const digits = String(Math.max(0, Math.round(value))).split('');
    const spacing = 3;
    let x = 0;

    digits.forEach(d => {
      const key = textureKey(kind, d);
      const digit = s.add.image(x, 0, key).setOrigin(0, 0.5).setScale(scale);
      if (kind === 'white') digit.setTint(tint);

      const texture = s.textures.get(key);
      if (texture && texture.setFilter) {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }

      container.add(digit);
      x += digit.displayWidth + spacing;
    });

    const total = Math.max(0, x - spacing);
    container.list.forEach(child => { child.x -= total / 2; });
    return container;
  }

  _addWorld(obj) {
    if (typeof this.scene.worldAdd === 'function') this.scene.worldAdd(obj);
    this._tracked.push(obj);
    return obj;
  }

  // A restart can destroy this object through Phaser's own display-list
  // teardown at the same moment our fade-out tween's onComplete tries to
  // destroy it too — two independent paths racing for the same object,
  // neither of which the other knows about. Checking `obj.scene` first
  // doesn't reliably win that race, so the destroy call itself has to
  // tolerate landing on an object Phaser already tore down.
  _destroy(obj) {
    if (!obj) return;
    const i = this._tracked.indexOf(obj);
    if (i !== -1) this._tracked.splice(i, 1);
    try {
      obj.destroy(true);
    } catch (err) {
      // already destroyed by a scene restart racing this tween
    }
  }

  _burst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const p = this.scene.add.rectangle(x, y, i % 2 ? 3 : 5, 2, color, 0.9)
        .setDepth(41).setRotation(a);
      this._addWorld(p);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(a) * (28 + (i % 3) * 6),
        y: y + Math.sin(a) * (22 + (i % 2) * 7),
        alpha: 0,
        duration: 360,
        ease: 'Quad.easeOut',
        onComplete: () => this._destroy(p)
      });
    }
  }

  // style: the attacker's own damageStyle — 'refraction' for Prismel,
  // 'slam' for Kineza — so a hero's own hits and the hits they take both
  // read in their own visual language, not the attacker's.
  showDamage(value, target, critical, style) {
    const kind = critical ? 'gold' : 'white';
    if (!this._texturesReady(value, kind)) {
      if (this._fallback) this._fallback(value, target, critical);
      return;
    }

    const p = this._point(target);
    const hero = this.scene.battleConfig && this.scene.battleConfig.hero;
    const accent = target === 'enemy'
      ? ((hero && hero.accent) || 0x67c8ff)
      : 0xff718e;
    const resolvedStyle = style || (hero && hero.damageStyle) || 'rise';
    const scale = critical ? 1.72 : 1.42;
    const main = this._makeNumber(value, kind, accent, scale)
      .setPosition(p.x, p.y + (resolvedStyle === 'slam' ? -22 : 8));
    this._addWorld(main);

    if (critical) {
      main.setScale(1.34).setAlpha(0);
      this._burst(p.x, p.y, 0xffd56a);
      this.scene.tweens.add({
        targets: main, alpha: 1, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut'
      });
    } else if (resolvedStyle === 'refraction') {
      const left = this._makeNumber(value, 'white', 0x68d8ff, scale)
        .setPosition(p.x - 5, p.y + 7).setAlpha(0.30).setDepth(40);
      const right = this._makeNumber(value, 'white', 0xc477ff, scale)
        .setPosition(p.x + 5, p.y + 9).setAlpha(0.26).setDepth(40);
      this._addWorld(left);
      this._addWorld(right);
      this.scene.tweens.add({
        targets: left, x: left.x - 8, alpha: 0, duration: 420, ease: 'Quad.easeOut',
        onComplete: () => this._destroy(left)
      });
      this.scene.tweens.add({
        targets: right, x: right.x + 8, alpha: 0, duration: 420, ease: 'Quad.easeOut',
        onComplete: () => this._destroy(right)
      });
    }

    if (resolvedStyle === 'slam' && !critical) {
      main.setScale(1.18);
      this.scene.tweens.add({
        targets: main, y: p.y, scaleX: 1, scaleY: 1, duration: 170, ease: 'Back.easeOut'
      });
    } else {
      this.scene.tweens.add({
        targets: main, y: p.y - 16, duration: critical ? 230 : 180, ease: 'Quad.easeOut'
      });
    }

    this.scene.tweens.add({
      targets: main,
      y: p.y - (critical ? 50 : 38),
      alpha: 0,
      delay: critical ? 300 : 250,
      duration: critical ? 360 : 300,
      ease: 'Quad.easeIn',
      onComplete: () => this._destroy(main)
    });
  }
}
