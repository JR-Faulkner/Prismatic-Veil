import BattleHUD from './BattleHUD.js?v=14';
import BattleController from './BattleController.js?v=14';
import Timeline from './Timeline.js?v=14';
import VeilFracture from './VeilFracture.js?v=14';
import HeroPoseView, { POSE_TEXTURES } from './HeroPoseView.js?v=14';
import EnemyWraithView from './EnemyWraithView.js?v=14';
import BattleCamera from './BattleCamera.js?v=14';
import BattleFX from './BattleFX.js?v=14';
import { AUDIO_EVENTS } from './BattleController.js?v=14';
import { BATTLE_CONFIG } from './BattleConfig.js?v=14';

function cloneConfig(source) {
  return {
    hero: {
      ...source.hero,
      attack: { ...source.hero.attack }
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
    this.load.image('dialogFrame', './assets/ui/dialog_frame_9slice.png');
    this.load.image('continueCrystal', './assets/ui/continue_crystal.png');
    this.load.image('prismelLocked', './assets/prismel_locked.png');
    this.load.image('speakerPlate', './assets/ui/speaker_plate.png');
    this.load.image('portrait_prismel', './assets/ui/portrait_prismel.png');
    // Pose library v1 — these load when the approved pose PNGs are
    // uploaded; until then each missing pose falls back to prismelLocked.
    Object.values(POSE_TEXTURES).forEach(tex => {
      this.load.image(tex, `./assets/poses/${tex}.png`);
    });
  }

  create() {
    this.battleConfig = cloneConfig(BATTLE_CONFIG);

    this.cameras.main.setBackgroundColor('#070611');

    this.titleText = this.add.text(0, 0, 'VEIL FRACTURE', {
      color: '#FFE8A0'
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(0, 0, 'Battle Presentation v4', {
      color: '#D6C8F2'
    }).setOrigin(0.5);

    this.hintText = this.add.text(0, 0, 'Tap to run the next round', {
      color: '#8A7AB0'
    }).setOrigin(0.5);

    this.layoutSceneText();

    this.hud = new BattleHUD(this, this.battleConfig);
    this.hud.create();

    this.heroPoses = new HeroPoseView(this);
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
      gather: this.sound.add('sfx_gather', { volume: 0.85 }),
      release: this.sound.add('sfx_release', { volume: 0.95 })
    };

    // v3 audio hook events. Events without an asset yet are simply
    // unmapped — drop a sound in here when one exists.
    const AUDIO_MAP = {
      [AUDIO_EVENTS.step]: null,
      [AUDIO_EVENTS.gather]: 'gather',
      [AUDIO_EVENTS.release]: 'release',
      [AUDIO_EVENTS.impact]: null,
      [AUDIO_EVENTS.recover]: null,
      [AUDIO_EVENTS.victory]: null
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

    this.controller.startNextRound();
    this.input.on('pointerdown', () => this.controller.startNextRound());
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
