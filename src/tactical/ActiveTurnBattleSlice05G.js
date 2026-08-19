// 05G — presentation-quality active-turn pass.
//
// Keeps 05F's validated combat/state behavior, fast Pool Splash QA opening,
// authored Prismel frames, Hushling rig, and hardened projectile coordinates.
// This pass changes presentation only: it composes the existing aligned
// Too Quiet environment masters into a dedicated cinematic backdrop, improves
// mobile HUD readability, strengthens foreground staging, and adds restrained
// charge / release / impact lighting so the active turn reads as a game scene
// rather than a debug overlay on the Tactical board.

import ActiveTurnBattleSlice05FPatched from './ActiveTurnBattleSlice05FPatched.js?v=1';

const ENV_LAYERS = Object.freeze([
  { key: 'too_quiet_far_backyards', alpha: 1.00 },
  { key: 'too_quiet_house_fence', alpha: 1.00 },
  { key: 'too_quiet_ground_pool', alpha: 1.00 },
  { key: 'too_quiet_props_back', alpha: 1.00 },
  { key: 'too_quiet_veil_corruption', alpha: 0.82, corruption: true },
  { key: 'too_quiet_props_front', alpha: 1.00 }
]);

const GOLD = 0xd7b868;
const GOLD_BRIGHT = 0xffe5a6;
const NAVY = 0x050914;
const NAVY_PANEL = 0x08111f;
const PRISM_BLUE = 0x79ddff;
const VIOLET = 0xa971ff;

export default class ActiveTurnBattleSlice05G extends ActiveTurnBattleSlice05FPatched {
  constructor(scene) {
    super(scene);
    this._cinematicEnvironment = null;
    this._environmentLayers = [];
    this._environmentTweens = [];
    this._veilLayer = null;
    this._hudAccentLayer = null;
  }

  _layoutMetrics() {
    const m = super._layoutMetrics();
    const { w, h } = m;
    const landscape = w > h;
    const compact = w < 680 || h < 520;

    // Push the approved active character closer without letting the figure
    // eat the command HUD. The Hushling remains clearly ahead/right and
    // slightly smaller, giving the frame a foreground -> target depth read.
    if (landscape) {
      m.cutin = {
        x: w * (compact ? 0.235 : 0.25),
        bottomY: h * 0.945,
        maxW: w * (compact ? 0.465 : 0.445),
        maxH: h * 0.825
      };
      m.enemy = {
        x: w * (compact ? 0.735 : 0.745),
        bottomY: h * 0.805,
        maxW: w * (compact ? 0.255 : 0.24),
        maxH: h * 0.50
      };
      return m;
    }

    m.cutin = {
      x: w * 0.285,
      bottomY: h * 0.685,
      maxW: w * 0.62,
      maxH: h * 0.515
    };
    m.enemy = {
      x: w * 0.765,
      bottomY: h * 0.61,
      maxW: w * 0.30,
      maxH: h * 0.35
    };
    return m;
  }

  // 05F had the correct information hierarchy; 05G keeps it but makes the
  // live text less fuzzy on phones and less "prototype serif panel" in feel.
  _label(x, y, text, size, colour = '#F7E8B6', originX = 0, originY = 0) {
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
    return this.scene.add.text(x, y, text, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: size >= 13 ? 'bold' : 'normal',
      fontSize: `${Math.round(size)}px`,
      color: colour,
      resolution: dpr,
      stroke: '#02050c',
      strokeThickness: size >= 18 ? 2 : 1
    }).setOrigin(originX, originY);
  }

  _panelRect(x, y, w, h, alpha = 0.90) {
    return this.scene.add.rectangle(x, y, w, h, NAVY_PANEL, Math.min(0.96, alpha + 0.025))
      .setOrigin(0, 0)
      .setStrokeStyle(1.4, GOLD, 0.90);
  }

  _fitEnvironmentImage(img, w, h) {
    const src = img.texture.getSourceImage();
    const sw = src && src.width ? src.width : 1536;
    const sh = src && src.height ? src.height : 1024;
    // Native masters are 1536x1024. Cover the phone viewport with only a
    // slight overscan, keeping the house/pool/backyard relationship intact.
    const scale = Math.max(w / sw, h / sh) * 1.045;
    img.setScale(scale).setPosition(w * 0.5, h * 0.525);
  }

  _ensureCinematicEnvironment() {
    if (this._cinematicEnvironment) return this._cinematicEnvironment;

    const s = this.scene;
    const w = s.scale.width;
    const h = s.scale.height;
    const container = s.add.container(0, 0).setAlpha(0);

    // Opaque foundation means the active-turn frame is authored as its own
    // presentation instead of visually inheriting Tactical grid clutter.
    const foundation = s.add.rectangle(0, 0, w, h, 0x030711, 1).setOrigin(0, 0);
    container.add(foundation);

    ENV_LAYERS.forEach(spec => {
      if (!s.textures.exists(spec.key)) return;
      const img = s.add.image(w * 0.5, h * 0.5, spec.key)
        .setOrigin(0.5)
        .setAlpha(spec.alpha);
      this._fitEnvironmentImage(img, w, h);
      container.add(img);
      this._environmentLayers.push(img);
      if (spec.corruption) this._veilLayer = img;
    });

    // Night unification. The authored layers stay readable, but the foreground
    // actors and prismatic FX remain the brightest things in the shot.
    const nightWash = s.add.rectangle(0, 0, w, h, 0x071025, 0.13).setOrigin(0, 0);
    container.add(nightWash);

    // Localized light pools create a stronger Prismel -> Hushling visual path.
    const heroGlow = s.add.ellipse(w * 0.245, h * 0.54, w * 0.42, h * 0.72, PRISM_BLUE, 0.055)
      .setBlendMode('ADD');
    const enemyGlow = s.add.ellipse(w * 0.735, h * 0.47, w * 0.31, h * 0.50, VIOLET, 0.075)
      .setBlendMode('ADD');
    container.add([heroGlow, enemyGlow]);

    // Soft cinematic edge control without letterboxing away valuable phone
    // pixels. These are deliberately subtle so the backyard still reads.
    const edge = Math.max(22, Math.round(w * 0.035));
    const topShade = s.add.rectangle(0, 0, w, Math.max(44, h * 0.11), NAVY, 0.18).setOrigin(0, 0);
    const bottomShade = s.add.rectangle(0, h - Math.max(48, h * 0.13), w, Math.max(48, h * 0.13), NAVY, 0.16).setOrigin(0, 0);
    const leftShade = s.add.rectangle(0, 0, edge, h, NAVY, 0.16).setOrigin(0, 0);
    const rightShade = s.add.rectangle(w - edge, 0, edge, h, NAVY, 0.16).setOrigin(0, 0);
    container.add([topShade, bottomShade, leftShade, rightShade]);

    this._uiObject(container);
    this._cinematicEnvironment = container;
    this._stageWash = container; // 05F fade/cleanup already knows this field.

    this._environmentTweens.push(
      s.tweens.add({ targets: container, alpha: 1, duration: 300, ease: 'Sine.easeOut' })
    );

    if (this._veilLayer) {
      this._environmentTweens.push(
        s.tweens.add({
          targets: this._veilLayer,
          alpha: 0.62,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      );
    }

    return container;
  }

  _stageBackdropWash() {
    this._ensureCinematicEnvironment();
  }

  _buildMockHud(hero, target) {
    const hud = super._buildMockHud(hero, target);
    const s = this.scene;
    const w = s.scale.width;
    const h = s.scale.height;
    const compact = w < 680 || h < 520;

    // A tiny mode marker occupies the intentional breathing room between turn
    // order and enemy card. It reads as authored interface, not another box.
    const accent = s.add.container(0, 0);
    const cx = w * (compact ? 0.43 : 0.45);
    const y = compact ? 13 : 18;
    const ruleW = Math.min(118, w * 0.14);
    const leftRule = s.add.rectangle(cx - ruleW - 8, y + 7, ruleW, 1.5, GOLD_BRIGHT, 0.42).setOrigin(0, 0.5);
    const rightRule = s.add.rectangle(cx + 8, y + 7, ruleW, 1.5, GOLD_BRIGHT, 0.42).setOrigin(0, 0.5);
    const mode = this._label(cx, y, 'ACTIVE TURN', compact ? 9 : 11, '#D7BE83', 0.5, 0);
    accent.add([leftRule, rightRule, mode]);
    hud.container.add(accent);
    this._hudAccentLayer = accent;

    // Hairline framing ties the disparate HUD islands into one composition
    // while leaving the backyard visible through the centre.
    const lowerRule = s.add.rectangle(w * 0.5, h - (compact ? 5 : 8), w * 0.58, 1.5, PRISM_BLUE, 0.24)
      .setOrigin(0.5);
    hud.container.add(lowerRule);

    return hud;
  }

  async _introCutin() {
    const promise = super._introCutin();
    // A small physical settle makes Prismel enter the frame rather than simply
    // appearing at final scale. No baseline drift is introduced.
    if (this._heroRig) {
      this._heroRig.setScale(0.975);
      this.scene.tweens.add({
        targets: this._heroRig,
        scaleX: 1,
        scaleY: 1,
        duration: 360,
        ease: 'Sine.easeOut'
      });
    }
    await promise;
  }

  async _playAttackPresentation() {
    const s = this.scene;
    const p = this._heroHandPoint();

    const halo = s.add.circle(p.x, p.y, 34, VIOLET, 0.13)
      .setBlendMode('ADD');
    const core = s.add.circle(p.x, p.y, 10, GOLD_BRIGHT, 0.34)
      .setBlendMode('ADD');
    this._uiObject(halo);
    this._uiObject(core);

    s.tweens.add({
      targets: halo,
      scale: 2.25,
      alpha: 0.035,
      duration: 620,
      ease: 'Sine.easeInOut'
    });
    s.tweens.add({
      targets: core,
      scale: 1.75,
      alpha: 0.10,
      duration: 520,
      ease: 'Cubic.easeIn'
    });

    // Give the environment a tiny recoil on the release beat. This is only a
    // few pixels, enough to add weight without making the screen seasick.
    if (this._cinematicEnvironment) {
      s.tweens.add({
        targets: this._cinematicEnvironment,
        x: -3,
        y: 1,
        duration: 105,
        yoyo: true,
        delay: 470,
        ease: 'Quad.easeOut'
      });
    }

    const releaseFlash = s.add.rectangle(0, 0, s.scale.width, s.scale.height, 0xe9dcff, 0)
      .setOrigin(0, 0)
      .setBlendMode('ADD');
    this._uiObject(releaseFlash);
    s.tweens.add({
      targets: releaseFlash,
      alpha: 0.115,
      duration: 70,
      yoyo: true,
      delay: 500,
      ease: 'Quad.easeOut'
    });

    await super._playAttackPresentation();

    [halo, core, releaseFlash].forEach(obj => {
      if (obj && obj.active) obj.destroy();
      this.layers = this.layers.filter(o => o !== obj);
    });
  }

  _impactBurst() {
    super._impactBurst();

    const s = this.scene;
    const { end } = this._projectileEndpoints();
    const bloom = s.add.ellipse(end.x, end.y, 48, 48, GOLD_BRIGHT, 0.18)
      .setBlendMode('ADD');
    this._uiObject(bloom);
    s.tweens.add({
      targets: bloom,
      scaleX: 3.2,
      scaleY: 2.1,
      alpha: 0,
      duration: 330,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (bloom.active) bloom.destroy();
        this.layers = this.layers.filter(o => o !== bloom);
      }
    });

    if (this._veilLayer && this._veilLayer.active) {
      s.tweens.add({
        targets: this._veilLayer,
        alpha: 1,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }
  }

  _teardownVisuals() {
    this._environmentTweens.forEach(t => {
      try { if (t) t.stop(); } catch (err) {}
    });
    this._environmentTweens = [];
    super._teardownVisuals();
    this._cinematicEnvironment = null;
    this._environmentLayers = [];
    this._veilLayer = null;
    this._hudAccentLayer = null;
  }
}
