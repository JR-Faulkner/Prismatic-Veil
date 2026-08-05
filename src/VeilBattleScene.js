import BattleHUD from './BattleHUD.js?v=31';
import BattleController from './BattleController.js?v=31';
import Timeline from './Timeline.js?v=31';
import VeilFracture from './VeilFracture.js?v=31';
import HeroPoseView from './HeroPoseView.js?v=31';
import EnemyWraithView, { WRAITH_TEXTURES } from './EnemyWraithView.js?v=31';
import BattleCamera from './BattleCamera.js?v=31';
import BattleFX from './BattleFX.js?v=31';
import BattleAtmosphere from './BattleAtmosphere.js?v=31';
import HudFrame from './HudFrame.js?v=31';
import CommandConsole from './CommandConsole.js?v=31';
import TargetReticle from './TargetReticle.js?v=31';
import UiAudio from './UiAudio.js?v=31';
import { AUDIO_EVENTS } from './BattleController.js?v=31';
import { BATTLE_CONFIG, HEROES, HERO_ORDER } from './BattleConfig.js?v=31';

function cloneConfig(source, heroKey) {
  const hero = HEROES[heroKey] || source.hero;
  return {
    hero: {
      ...hero,
      attack: { ...hero.attack }
    },
    enemy: {
      ...source.enemy,
      attack: { ...source.enemy.attack }
    },
    text: { ...source.text }
  };
}

export default class VeilBattleScene extends Phaser.Scene {
  constructor() {
    super('VeilBattleScene');
  }

  preload() {
    this.load.audio('battle_music', './Veilbreak.mp3');
    this.load.audio('sfx_gather', './assets/sfx/sfx_gather.mp3');
    this.load.audio('sfx_release', './assets/sfx/sfx_release.mp3');
    this.load.audio('sfx_step', './assets/sfx/sfx_step.mp3');
    this.load.audio('sfx_impact', './assets/sfx/sfx_impact.mp3');
    this.load.audio('sfx_recover', './assets/sfx/sfx_recover.mp3');
    this.load.audio('sfx_victory', './assets/sfx/sfx_victory.mp3');
    this.load.audio('kineza_step', './assets/sfx/kineza/kineza_step.mp3');
    this.load.audio('kineza_coil', './assets/sfx/kineza/kineza_coil.mp3');
    this.load.audio('kineza_strike', './assets/sfx/kineza/kineza_strike.mp3');
    this.load.audio('kineza_impact', './assets/sfx/kineza/kineza_impact.mp3');
    this.load.audio('kineza_recover', './assets/sfx/kineza/kineza_recover.mp3');
    this.load.audio('kineza_idle_pulse', './assets/sfx/kineza/kineza_idle_pulse.mp3');
    this.load.audio('kineza_debris', './assets/sfx/kineza/kineza_debris.mp3');
    this.load.image('dialogFrame', './assets/ui/dialog_frame_9slice.png');
    this.load.image('continueCrystal', './assets/ui/continue_crystal.png');
    this.load.image('prismelLocked', './assets/prismel_locked.png');
    this.load.image('portrait_prismel', './assets/ui/portrait_prismel.png');
    this.load.image('portrait_kineza', './assets/ui/portrait_kineza.png');
    this.load.image('portrait_wraith', './assets/ui/portrait_wraith.png');
    this.loadUiKit();
    this.loadFeedbackDigits();
    // Every hero's pose set. A pose whose PNG is absent falls back to the
    // locked Prismel art at runtime.
    Object.values(HEROES).forEach(hero => {
      const seen = new Set();
      Object.values(hero.poses).forEach(tex => {
        if (seen.has(tex)) return;
        seen.add(tex);
        this.load.image(tex, `${hero.posePath}${tex}.png`);
      });
    });
    Object.values(WRAITH_TEXTURES).forEach(tex => {
      this.load.image(tex, `./assets/enemy/veil_wraith/${tex}.png`);
    });
  }

  // Battle Presentation Alpha v1.0 UI kit, sliced out of the eight
  // source sheets and keyed to real transparency. Everything is a
  // relative path off the repo root — no CDN.
  loadUiKit() {
    const kit = key => this.load.image(`kit_${key}`, `./assets/ui/kit/${key}.png`);
    ['console_plate', 'cursor_idle', 'cursor_active',
     'frame_corner', 'frame_rail', 'frame_rail_centre',
     'reticle_seeking', 'reticle_locked', 'reticle_confirmed'].forEach(kit);
    ['fracture', 'resonance', 'barrier', 'returnpath'].forEach(g => {
      ['idle', 'on', 'off'].forEach(state => kit(`glyph_${g}_${state}`));
    });
    ['blue', 'teal'].forEach(c => {
      ['idle', 'active', 'hurt', 'down'].forEach(state => kit(`pframe_${c}_${state}`));
    });
    ['idle', 'active', 'hurt'].forEach(state => kit(`pframe_violet_${state}`));
  }

  // Sheet 05's combat-feedback numerals: ten tintable white masks, ten
  // gold criticals. src/BattleFeedback.js reads them by these keys.
  loadFeedbackDigits() {
    for (let d = 0; d <= 9; d++) {
      this.load.image(`digit_white_${d}`, `./assets/feedback_digits/white_${d}.png`);
      this.load.image(`digit_gold_${d}`, `./assets/feedback_digits/gold_${d}.png`);
    }
  }

  create() {
    // scene.restart() reuses this instance but destroys every game
    // object, so any cached object reference must be dropped here or it
    // will point at a destroyed node on the next battle.
    this._lightWash = null;
    this._hitStopped = false;

    // The Sound Manager is NOT one of the objects a restart destroys —
    // the previous battle's music and SFX instances survive it. Without
    // this, switching heroes layers a second battle_music loop over the
    // first and neither one ever stops.
    this.sound.stopAll();
    this.sound.removeAll();

    this.activeHero = this.registry.get('heroKey') || HERO_ORDER[0];
    this.battleConfig = cloneConfig(BATTLE_CONFIG, this.activeHero);

    this.cameras.main.setBackgroundColor('#070611');

    // Two render layers so the camera can push in on the action without
    // dragging the interface with it: the world zooms, the UI never does.
    this.world = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0).setDepth(1000);

    this.atmosphere = new BattleAtmosphere(this);
    this.atmosphere.create();

    this.titleText = this.add.text(0, 0, 'VEIL FRACTURE', {
      color: '#FFE8A0'
    }).setOrigin(0.5);

    // The hint tracks the round: the player commands through the console,
    // the enemy's round still advances on a tap.
    this.hintText = this.add.text(0, 0, '', {
      color: '#8A7AB0'
    }).setOrigin(0.5);

    this.uiLayer.add([this.titleText, this.hintText]);
    this.layoutSceneText();

    this.hud = new BattleHUD(this, this.battleConfig);
    this.hud.create();
    this.uiLayer.add(this.hud.container);

    this.hudFrame = new HudFrame(this);
    this.hudFrame.create(this.battleConfig.hero);

    // Synthesised UI cues — no assets required.
    this.uiAudio = new UiAudio(this);

    this.heroPoses = new HeroPoseView(this, this.battleConfig.hero);
    this.heroPoses.create();

    this.enemyView = new EnemyWraithView(this);
    this.enemyView.create();

    this.battleCam = new BattleCamera(this);
    this.battleFx = new BattleFX(this);

    // Alpha v1.0 interaction layer. The console is UI (never zooms); the
    // reticle is a battlefield visual and registers through worldAdd().
    this.commandConsole = new CommandConsole(this, this.battleConfig);
    this.commandConsole.create();
    this.reticle = new TargetReticle(this);

    // Battle entrance sweep, then the first round begins.
    const INTRO_MS = 520;
    this.battleCam.introSweep(INTRO_MS);
    this.heroPoses.introSlide(INTRO_MS);
    this.enemyView.introSlide(INTRO_MS);

    this.timeline = new Timeline(this);
    this.fracture = new VeilFracture(this);
    this.controller = new BattleController(
      this,
      this.timeline,
      this.fracture,
      this.hud,
      this.battleConfig
    );

    this.battleMusic = this.sound.add('battle_music', {
      loop: true,
      volume: 0.6
    });

    // Battle SFX chopped from the Suno gather tracks. Kept above the
    // music bed in level so they read over the loop.
    this.sfx = {
      prismel: {
        step: this.sound.add('sfx_step', { volume: 0.62 }),
        gather: this.sound.add('sfx_gather', { volume: 0.85 }),
        release: this.sound.add('sfx_release', { volume: 0.95 }),
        impact: this.sound.add('sfx_impact', { volume: 1.0 }),
        recover: this.sound.add('sfx_recover', { volume: 0.72 }),
        victory: this.sound.add('sfx_victory', { volume: 0.92 })
      },
      kineza: {
        step: this.sound.add('kineza_step', { volume: 0.68 }),
        gather: this.sound.add('kineza_coil', { volume: 0.88 }),
        release: this.sound.add('kineza_strike', { volume: 0.95 }),
        impact: this.sound.add('kineza_impact', { volume: 1.0 }),
        recover: this.sound.add('kineza_recover', { volume: 0.7 }),
        victory: this.sound.add('sfx_victory', { volume: 0.88 }),
        idle: this.sound.add('kineza_idle_pulse', { volume: 0.22 }),
        debris: this.sound.add('kineza_debris', { volume: 0.62 })
      }
    };

    // v3 audio hook events. Events without an asset yet are simply
    // unmapped — drop a sound in here when one exists.
    const AUDIO_MAP = {
      [AUDIO_EVENTS.step]: 'step',
      [AUDIO_EVENTS.gather]: 'gather',
      [AUDIO_EVENTS.release]: 'release',
      [AUDIO_EVENTS.impact]: 'impact',
      [AUDIO_EVENTS.recover]: 'recover',
      [AUDIO_EVENTS.victory]: 'victory'
    };
    Object.entries(AUDIO_MAP).forEach(([event, key]) => {
      this.events.on(event, () => { if (key) this.playSfx(key); });
    });

    if (this.sound.locked) {
      this.sound.once('unlocked', () => {
        if (!this.battleMusic.isPlaying) this.battleMusic.play();
      });
    } else {
      this.battleMusic.play();
    }

    this.scale.on('resize', this.layoutSceneText, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layoutSceneText, this);
    });

    this.buildHeroSwitch();

    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCam.setBackgroundColor('rgba(0,0,0,0)');
    this.uiCam.ignore(this.world);
    this.cameras.main.ignore(this.uiLayer);
    this.scale.on('resize', size => this.uiCam.setSize(size.width, size.height));

    this.time.delayedCall(INTRO_MS + 80, () => {
      this.battleCam.markHome();
      this.battleCam.startIdleBreath();
      this.controller.startNextRound();
    });
    this.input.on('pointerdown', () => this.controller.startNextRound());
  }

  // Tap to cycle the active hero and restart the battle with them.
  buildHeroSwitch() {
    const label = this.add.text(0, 0, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFE8A0',
      backgroundColor: '#1a1033',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setDepth(1200).setInteractive({ useHandCursor: true });

    const next = () => HERO_ORDER[(HERO_ORDER.indexOf(this.activeHero) + 1) % HERO_ORDER.length];
    const render = () => label.setText(`▸ ${HEROES[next()].name}`);
    render();

    label.on('pointerdown', e => {
      if (e && e.event) e.event.stopPropagation();
      if (this.uiAudio) this.uiAudio.confirm();
      this.registry.set('heroKey', next());
      this.scene.restart();
    });

    this.heroSwitch = label;
    this.uiLayer.add(label);
    this.layoutHeroSwitch();
    this.scale.on('resize', this.layoutHeroSwitch, this);
  }

  // Anchored off the same metrics BattleHUD uses for the enemy's
  // portrait block, so it reads as part of the top HUD row instead of
  // floating in the middle of the battlefield — which is where a fixed
  // y=176/250 landed it in landscape, nowhere near any other UI.
  layoutHeroSwitch() {
    if (!this.heroSwitch) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const landscape = w > h;
    const compact = w < 560 || h < 520;
    const margin = landscape
      ? Math.max(12, Math.round(h * 0.035))
      : Math.max(18, Math.round(w * 0.03));
    const portraitSize = landscape ? 42 : (compact ? 44 : 62);
    const topClear = margin + portraitSize + (landscape ? 6 : 10);
    this.heroSwitch.setFontSize(compact ? 11 : 13)
      .setPosition(w - (compact ? 12 : 18), topClear);
  }

  // Package 08 lighting: an ability briefly tints the scene. Prismel
  // throws cool refracted highlights, Kineza warm pressure flashes.
  abilityLight(kind) {
    if (!this._lightWash || !this._lightWash.scene) {
      this._lightWash = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0)
        .setOrigin(0, 0).setDepth(80);
      this.worldAdd(this._lightWash);
    }
    const w = this.scale.width, h = this.scale.height;
    this._lightWash.setSize(w * 2, h * 2).setPosition(-w / 2, -h / 2);

    const hero = this.battleConfig.hero;
    const cool = hero.id !== 'kineza';
    const color = kind === 'impact'
      ? (cool ? 0xdff0ff : 0xffe6b0)
      : (cool ? 0x9fd8ff : 0xb6ff9f);
    const peak = kind === 'impact' ? 0.20 : 0.10;

    this.tweens.killTweensOf(this._lightWash);
    this._lightWash.setFillStyle(color, 1).setAlpha(0);
    this.tweens.add({
      targets: this._lightWash,
      alpha: peak,
      duration: kind === 'impact' ? 70 : 260,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this._lightWash,
          alpha: 0,
          duration: kind === 'impact' ? 300 : 380,
          ease: 'Quad.easeOut'
        });
      }
    });
  }

  setHint(text) {
    if (!this.hintText) return;
    if (this.hintText.text === text) return;
    this.hintText.setText(text);
    this.tweens.killTweensOf(this.hintText);
    this.hintText.setAlpha(0);
    this.tweens.add({
      targets: this.hintText, alpha: 1, duration: 220, ease: 'Quad.easeOut'
    });
  }

  // Battlefield visuals register here so the UI camera ignores them.
  worldAdd(obj) {
    if (this.world && obj) this.world.add(obj);
    return obj;
  }

  playSfx(name) {
    const heroId = this.battleConfig && this.battleConfig.hero.id || 'prismel';
    const bank = this.sfx && this.sfx[heroId];
    const s = bank && bank[name];
    if (s && !this.sound.locked) {
      s.play();
      if (heroId === 'kineza' && name === 'impact' && bank.debris) {
        this.time.delayedCall(36, () => bank.debris.play());
      }
    }
  }

  // v3 hit stop: freeze the scene clock and tweens for a beat so impacts
  // land. Restored on a real-time timer, which the frozen clock can't
  // delay.
  hitStop(ms = 80) {
    if (this._hitStopped) return;
    this._hitStopped = true;
    this.tweens.timeScale = 0.0001;
    this.time.timeScale = 0.0001;
    window.setTimeout(() => {
      this.tweens.timeScale = 1;
      this.time.timeScale = 1;
      this._hitStopped = false;
    }, ms);
  }

  // A restart can destroy this object through Phaser's own display-list
  // teardown at the same moment a fade-out tween's onComplete tries to
  // destroy it too — two independent paths racing for the same object.
  // The destroy call has to tolerate landing on one Phaser already tore
  // down, since checking liveness first doesn't reliably win that race.
  _destroyIfAlive(obj) {
    if (!obj) return;
    try {
      obj.destroy();
    } catch (err) {
      // already destroyed by a scene restart racing this tween
    }
  }

  // v3 damage numbers: pop in, arc up, fade — coloured by who took it.
  floatDamage(amount, side, crit) {
    const width = this.scale.width;
    const height = this.scale.height;
    const hurtHero = side === 'hero';
    const x = width * (hurtHero ? 0.28 : 0.72);
    const scale = crit ? 1.5 : 1;
    const text = this.add.text(x, height * 0.44, String(amount), {
      fontSize: Math.round(Math.max(34, width * 0.062) * scale) + 'px',
      fontStyle: 'bold',
      color: crit ? '#FFF3B0' : (hurtHero ? '#FF8A8A' : '#FFDF6E'),
      stroke: '#3B0A1C',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(60).setScale(0.4);
    this.worldAdd(text);

    // Package 07: the attacker's style drives how the number behaves.
    const style = hurtHero ? 'refraction' : (this.battleConfig.hero.damageStyle || 'refraction');

    if (style === 'slam') {
      // Kineza: drives down hard, then rebounds.
      text.setScale(1.9).setY(text.y - 30);
      this.tweens.add({
        targets: text, scaleX: 1, scaleY: 1, y: text.y + 30,
        duration: 130, ease: 'Quad.easeIn',
        onComplete: () => {
          this.tweens.add({
            targets: text, y: text.y - 26, duration: 180, yoyo: true, ease: 'Back.easeOut'
          });
        }
      });
      this.tweens.add({
        targets: text, alpha: 0, duration: 620, delay: 430, ease: 'Quad.easeIn',
        onComplete: () => this._destroyIfAlive(text)
      });
    } else {
      // Prismel: pops, then refracts apart as it fades.
      this.tweens.add({
        targets: text, scaleX: 1.18, scaleY: 1.18,
        duration: 150, ease: 'Back.easeOut', yoyo: true, hold: 40
      });
      const ghostA = this.add.text(x, text.y, String(amount), text.style).setOrigin(0.5).setDepth(59).setScale(0.4);
      const ghostB = this.add.text(x, text.y, String(amount), text.style).setOrigin(0.5).setDepth(59).setScale(0.4);
      ghostA.setColor('#8fd8ff'); ghostB.setColor('#ffa8e6');
      this.worldAdd(ghostA); this.worldAdd(ghostB);
      [[ghostA, -7], [ghostB, 7]].forEach(([gt, dx]) => {
        this.tweens.add({
          targets: gt, x: gt.x + dx, y: text.y - 74, alpha: 0, scaleX: 1.1, scaleY: 1.1,
          duration: 950, delay: 140, ease: 'Quad.easeOut', onComplete: () => this._destroyIfAlive(gt)
        });
      });
      this.tweens.add({
        targets: text,
        x: x + (hurtHero ? -22 : 22),
        y: text.y - 74,
        alpha: 0,
        duration: 950,
        delay: 140,
        ease: 'Quad.easeOut',
        onComplete: () => this._destroyIfAlive(text)
      });
    }
  }

  layoutSceneText() {
    const width = this.scale.width;
    const height = this.scale.height;
    const compact = width < 560;
    // Landscape phones are only ~390px tall. The command console and the
    // dialogue box both need that space, so the decorative title block
    // stands down and only the round hint stays.
    const short = height < 520;

    this.titleText.setVisible(!short)
      .setFontSize(compact ? 26 : 40).setPosition(width / 2, compact ? 96 : 120);
    this.hintText.setFontSize(compact ? 11 : 14)
      .setPosition(width / 2, short ? 84 : (compact ? 134 : 172));
  }
}
