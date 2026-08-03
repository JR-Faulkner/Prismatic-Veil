import BattleHUD from './BattleHUD.js';
import BattleController from './BattleController.js';
import Timeline from './Timeline.js';
import VeilFracture from './VeilFracture.js';
import HeroPoseView, { POSE_TEXTURES } from './HeroPoseView.js';
import { BATTLE_CONFIG } from './BattleConfig.js';

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
    this.load.image('dialogFrame', './assets/ui/dialog_frame_9slice.png');
    this.load.image('continueCrystal', './assets/ui/continue_crystal.png');
    this.load.image('prismelLocked', './assets/prismel_locked.png');
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

    this.subtitleText = this.add.text(0, 0, 'Battle Presentation v2 - Package 04', {
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

  floatDamage(amount, side) {
    const width = this.scale.width;
    const height = this.scale.height;
    const x = width * (side === 'hero' ? 0.28 : 0.72);
    const text = this.add.text(x, height * 0.42, String(amount), {
      fontSize: Math.round(Math.max(30, width * 0.05)) + 'px',
      fontStyle: 'bold',
      color: '#FFDF6E',
      stroke: '#5F1329',
      strokeThickness: 6
    }).setOrigin(0.5);
    this.tweens.add({
      targets: text,
      y: text.y - 64,
      alpha: 0,
      duration: 950,
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
