// PriZim Duo-Hybrid Formation Adapter v0.2
// Keeps PartyBattleScene's proven attack-resolution contract while replacing
// Kineza's fragile Phaser spritesheet playback with PriZim Sequence Mode.
// The neutral JSON manifest is canonical; marker values below are a small
// renderer adapter mirror so the existing battle scene can consume its
// current synchronous attack-sheet interface without owning presentation data.

import PartyFormationView from '../PartyFormationView.js?v=duo-base-1';
import DuoHybridSequenceDriver from './DuoHybridSequenceDriver.js?v=duo-2';

const KINEZA_BLITZER_DUO = Object.freeze({
  id: 'kineza_blitzer_basic_v1',
  name: 'Blitzer',
  manifest: './pv-data/sequences/kineza_blitzer.duo.sequence.json',
  version: '2',
  markerFrames: Object.freeze({
    gather: Object.freeze([1, 2, 3]),
    release: Object.freeze([4, 5, 6]),
    impact: Object.freeze([11]),
    recover: Object.freeze([14, 15, 16, 17])
  }),
  povFrames: Object.freeze([6, 7, 8, 9, 10, 11, 12, 13])
});

export default class DuoHybridPartyFormationView extends PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new DuoHybridSequenceDriver(scene);
  }

  create(roster) {
    super.create(roster);
    const actor = this.actors.get('kineza');
    if (!actor) return;

    actor.duoSequenceConfig = KINEZA_BLITZER_DUO;
    // PartyBattleScene reads this existing interface for marker timing/name.
    // Playback itself is redirected below to the PriZim driver.
    actor.attackSheetConfig = KINEZA_BLITZER_DUO;

    // Warm the sequence in the background so Kineza's turn normally has no
    // first-use load pause. A failed prewarm is not hidden; playAttackSheet()
    // will retry and surface the concrete PriZim error if needed.
    this.duoHybrid.prepare(KINEZA_BLITZER_DUO).catch(error => {
      actor.duoPrewarmError = error;
      console.warn('[PriZim Duo-Hybrid] Blitzer prewarm deferred:', error);
    });
  }

  hasAttackSheet(heroId) {
    if (heroId === 'kineza') {
      const actor = this.actors.get(heroId);
      return !!(actor && actor.duoSequenceConfig);
    }
    return super.hasAttackSheet(heroId);
  }

  async playAttackSheet(heroId, onFrame) {
    if (heroId !== 'kineza') return super.playAttackSheet(heroId, onFrame);

    const actor = this.actors.get(heroId);
    if (!actor?.duoSequenceConfig) {
      throw new Error('[PriZim Duo-Hybrid] Kineza Blitzer sequence was not registered.');
    }

    const enemyX = this.scene.enemyView?.container?.x ?? (this.scene.scale.width * 0.74);
    try {
      return await this.duoHybrid.playSequence({
        config: actor.duoSequenceConfig,
        actor,
        enemyX,
        onFrame: frameIndex => onFrame?.(frameIndex)
      });
    } catch (error) {
      const detail = error?.message || String(error);
      console.error('[PriZim Duo-Hybrid · Blitzer]', error);
      throw new Error(`[PriZim Duo-Hybrid · Blitzer] ${detail}`);
    }
  }
}
