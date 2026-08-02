import BattleHUD from './BattleHUD.js';
import BattleController from './BattleController.js';
import Timeline from './Timeline.js';
import VeilFracture from './VeilFracture.js';
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
  }

  create() {
    this.battleConfig = cloneConfig(BATTLE_CONFIG);

    this.cameras.main.setBackgroundColor('#070611');

    const width = this.scale.width;
    this.titleText = this.add.text(width / 2, 120, 'VEIL FRACTURE', {
      fontSize: '40px',
      color: '#FFE8A0'
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(width / 2, 180, 'Battle Presentation v2 - Package 04', {
      fontSize: '20px',
      color: '#D6C8F2'
    }).setOrigin(0.5);

    this.hintText = this.add.text(width / 2, 220, 'Tap to replay the turn sequence', {
      fontSize: '14px',
      color: '#8A7AB0'
    }).setOrigin(0.5);

    this.hud = new BattleHUD(this, this.battleConfig);
    this.hud.create();

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

    this.controller.startPlayerTurn();
    this.input.on('pointerdown', () => this.controller.startPlayerTurn());
  }

  layoutSceneText(gameSize) {
    const width = gameSize.width;
    this.titleText.setX(width / 2);
    this.subtitleText.setX(width / 2);
    this.hintText.setX(width / 2);
  }
}
