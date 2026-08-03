import BattleHUD from './BattleHUD.js?v=19';
import BattleController from './BattleController.js?v=19';
import Timeline from './Timeline.js?v=19';
import VeilFracture from './VeilFracture.js?v=19';
import HeroPoseView from './HeroPoseView.js?v=19';
import EnemyWraithView, { WRAITH_TEXTURES } from './EnemyWraithView.js?v=19';
import BattleCamera from './BattleCamera.js?v=19';
import BattleFX from './BattleFX.js?v=19';
import { AUDIO_EVENTS } from './BattleController.js?v=19';
import { BATTLE_CONFIG, HEROES, HERO_ORDER } from './BattleConfig.js?v=19';

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
    this.load.audio('battle_music', './prismcharge.mp3');
    this.load.audio('sfx_gather', './assets/sfx/sfx_gather.mp3');
    this.load.audio('sfx_release', './assets/sfx/sfx_release.mp3');
    this.load.audio('sfx_step', './assets/sfx/sfx_step.mp3');
    this.load.audio('sfx_impact', './assets/sfx/sfx_impact.mp3');
    this.load.audio('sfx_recover', './assets/sfx/sfx_recover.mp3');
    this.load.audio('sfx_victory', './assets/sfx/sfx_victory.mp3');
    this.load.image('dialogFrame', './assets/ui/dialog_frame_9slice.png');
    this.load.image('continueCrystal', './assets/ui/continue_crystal.png');
    this.load.image('prismelLocked', './assets/prismel_locked.png');
    this.load.image('speakerPlate', './assets/ui/speaker_plate.png');
    this.load.image('portrait_prismel', './assets/ui/portrait_prismel.png');
    this.load.image('portrait_kineza', './assets/ui/portrait_kineza.png');
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

  create() {
    this.activeHero = this.registry.get('heroKey') || HERO_ORDER[0];
    this.battleConfig = cloneConfig(BATTLE_CONFIG, this.activeHero);

    this.cameras.main.setBackgroundColor('#070611');

    // Two render layers so the camera can push in on the action without
    // dragging the interface with it: the world zooms, the UI never does.
    this.world = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0).setDepth(1000);

    this.titleText = this.add.text(0, 0, 'VEIL FRACTURE', {
      color: '#FFE8A0'
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(0, 0, 'Battle Presentation v5', {
      color: '#D6C8F2'
    }).setOrigin(0.5);

    this.hintText = this.add.text(0, 0, 'Tap to run the next round', {
      color: '#8A7AB0'
    }).setOrigin(0.5);

    this.uiLayer.add([this.titleText, this.subtitleText, this.hintText]);
    this.layoutSceneText();

    this.hud = new BattleHUD(this, this.battleConfig);
    this.hud.create();
    this.uiLayer.add(this.hud.container);

    this.heroPoses = new HeroPoseView(this, this.battleConfig.hero);
    this.heroPoses.create();

    this.enemyView = new EnemyWraithView(this);
    this.enemyView.create();

    this.battleCam = new BattleCamera(this);
    this.battleFx = new BattleFX(this);
    this.battleCam.introPush();

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
      step: this.sound.add('sfx_step', { volume: 0.62 }),
      gather: this.sound.add('sfx_gather', { volume: 0.85 }),
      release: this.sound.add('sfx_release', { volume: 0.95 }),
      impact: this.sound.add('sfx_impact', { volume: 1.0 }),
      recover: this.sound.add('sfx_recover', { volume: 0.72 }),
      victory: this.sound.add('sfx_victory', { volume: 0.92 })
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

    this.controller.startNextRound();
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
      this.registry.set('heroKey', next());
      this.scene.restart();
    });

    this.heroSwitch = label;
    this.uiLayer.add(label);
    this.layoutHeroSwitch();
    this.scale.on('resize', this.layoutHeroSwitch, this);
  }

  layoutHeroSwitch() {
    if (!this.heroSwitch) return;
    const w = this.scale.width;
    const compact = w < 560;
    this.heroSwitch.setFontSize(compact ? 11 : 13)
      .setPosition(w - (compact ? 12 : 18), compact ? 176 : 250);
  }

  // Battlefield visuals register here so the UI camera ignores them.
  worldAdd(obj) {
    if (this.world && obj) this.world.add(obj);
    return obj;
  }

  playSfx(name) {
    const s = this.sfx && this.sfx[name];
    if (s && !this.sound.locked) s.play();
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

    this.tweens.add({
      targets: text,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 150,
      ease: 'Back.Out',
      yoyo: true,
      hold: 40
    });
    this.tweens.add({
      targets: text,
      x: x + (hurtHero ? -22 : 22),
      y: text.y - 74,
      alpha: 0,
      duration: 950,
      delay: 140,
      ease: 'Quad.Out',
      onComplete: () => text.destroy()
    });
  }

  layoutSceneText() {
    const width = this.scale.width;
    const compact = width < 560;

    this.titleText.setFontSize(compact ? 26 : 40).setPosition(width / 2, compact ? 96 : 120);
    this.subtitleText.setFontSize(compact ? 13 : 20).setPosition(width / 2, compact ? 132 : 180);
    this.hintText.setFontSize(compact ? 11 : 14).setPosition(width / 2, compact ? 156 : 220);
  }
}
