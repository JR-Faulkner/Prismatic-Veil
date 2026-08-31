import PartyBattleScene from './PartyBattleScene.js?base=blitzer-live-authority';

const LIVE_BUILD = new URL(import.meta.url).searchParams.get('v') || 'main';
const SAFE_BUILD = LIVE_BUILD.replace(/[^a-zA-Z0-9_]/g, '_');
const BLITZER = Object.freeze({
  key: `kineza_blitzer_live_${SAFE_BUILD}`,
  name: 'Blitzer',
  path: `./assets/characters/kineza/animations/kineza_blitzer_basic_v1.webp?pvasset=${encodeURIComponent(LIVE_BUILD)}`,
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 18,
  baselinePx: 118,
  contentHeightPx: 93,
  frameDurations: Object.freeze([180,110,110,110,110,95,85,180,110,110,110,180,110,110,95,85,180,180]),
  markerFrames: Object.freeze({
    gather: [1,2,3],
    release: [4,5,6],
    impact: [11],
    recover: [14,15,16,17]
  }),
  povFrames: Object.freeze([6,7,8,9,10,11,12,13]),
  travel: Object.freeze({
    contactXOffsetFrac: 0.11,
    frameProgress: Object.freeze([
      0.00,0.00,0.04,0.14,0.34,0.58,0.82,
      1.00,1.00,1.00,1.00,1.00,0.96,0.86,
      0.62,0.34,0.10,0.00
    ])
  })
});

export default class LivePartyBattleScene extends PartyBattleScene {
  preload() {
    super.preload();
    this.load.spritesheet(BLITZER.key, BLITZER.path, {
      frameWidth: BLITZER.frameWidth,
      frameHeight: BLITZER.frameHeight
    });
  }

  create() {
    super.create();
    this._installLiveBlitzer();
  }

  _installLiveBlitzer() {
    const actor = this.formation?.actors?.get('kineza');
    if (!actor) {
      console.error('[PV LIVE] Kineza actor missing; Blitzer cannot attach.');
      return;
    }

    if (!this.textures.exists(BLITZER.key)) {
      console.error('[PV LIVE] Blitzer texture failed to load:', BLITZER.path);
      actor.attackSprite = null;
      actor.attackSheetConfig = null;
      return;
    }

    if (actor.attackSprite) actor.attackSprite.destroy();

    const attackSprite = this.add.sprite(0, 0, BLITZER.key, 0).setVisible(false);
    this.worldAdd(attackSprite);
    attackSprite.setDepth(actor.sprite.depth);

    const animKey = `${BLITZER.key}_play`;
    if (!this.anims.exists(animKey)) {
      const frames = this.anims.generateFrameNumbers(BLITZER.key, { start: 0, end: BLITZER.frameCount - 1 });
      frames.forEach((frame, i) => { frame.duration = BLITZER.frameDurations[i] || 150; });
      this.anims.create({ key: animKey, frames, repeat: 0 });
    }

    actor.attackSprite = attackSprite;
    actor.attackSheetConfig = BLITZER;

    const originalHasAttackSheet = this.formation.hasAttackSheet.bind(this.formation);
    this.formation.hasAttackSheet = heroId => {
      if (heroId === 'kineza') return !!actor.attackSprite;
      return originalHasAttackSheet(heroId);
    };

    console.info('[PV LIVE] Blitzer 18F attached:', LIVE_BUILD, BLITZER.key);
  }
}
