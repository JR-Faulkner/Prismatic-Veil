// PriZim Duo-Hybrid Formation Adapter v0.7
// Keeps PartyBattleScene's proven attack-resolution contract while replacing
// Kineza's fragile Phaser spritesheet playback with PriZim Sequence Mode.
// The neutral JSON manifest is canonical; marker values below are a small
// renderer adapter mirror so the existing battle scene can consume its
// synchronous attack-sheet interface without owning presentation data.

import PartyFormationView from '../PartyFormationView.js?v=duo-base-1';
import DuoHybridSequenceDriver from './DuoHybridSequenceDriver.js?v=duo-7';

const KINEZA_BLITZER_DUO = Object.freeze({
  id: 'kineza_blitzer_basic_v1',
  name: 'Blitzer',
  manifest: './pv-data/sequences/kineza_blitzer.duo.sequence.json',
  version: '6',
  markerFrames: Object.freeze({
    gather: Object.freeze([1, 2, 3]),
    release: Object.freeze([4, 5, 6]),
    impact: Object.freeze([11]),
    recover: Object.freeze([14, 15, 16, 17])
  }),
  // PriZim owns Blitzer's presentation camera. Keep the legacy scene POV
  // hook disabled so two camera systems never fight each other.
  povFrames: Object.freeze([])
});

const AURYI_ENTRY_DUO = Object.freeze({
  id: 'auryi_turn_entry_v1',
  name: 'Auryi Turn Entry',
  manifest: './pv-data/sequences/auryi_turn_entry.duo.sequence.json',
  version: '7'
});

export default class DuoHybridPartyFormationView extends PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new DuoHybridSequenceDriver(scene);
  }

  create(roster) {
    super.create(roster);

    const kineza = this.actors.get('kineza');
    if (kineza) {
      kineza.duoSequenceConfig = KINEZA_BLITZER_DUO;
      kineza.attackSheetConfig = KINEZA_BLITZER_DUO;
      this.duoHybrid.prepare(KINEZA_BLITZER_DUO).catch(error => {
        kineza.duoPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Blitzer prewarm deferred:', error);
      });
    }

    const auryi = this.actors.get('auryi');
    if (auryi) {
      auryi.duoEntryConfig = AURYI_ENTRY_DUO;
      this.duoHybrid.prepare(AURYI_ENTRY_DUO).catch(error => {
        auryi.duoEntryPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Auryi entry prewarm deferred:', error);
      });
    }
  }

  layout() {
    super.layout();
    const auryi = this.actors.get('auryi');
    if (!auryi || auryi._snapshot) return;
    const mul = 1.12;
    auryi.sprite.setScale(auryi.sprite.scaleX * mul, auryi.sprite.scaleY * mul);
    auryi.ghost.setScale(auryi.ghost.scaleX * mul, auryi.ghost.scaleY * mul);
    auryi.ring.setSize(auryi.sprite.displayWidth * 0.5, auryi.sprite.displayWidth * 0.18);
  }

  hasTurnEntry(heroId) {
    if (heroId === 'auryi') return !!this.actors.get(heroId)?.duoEntryConfig;
    return super.hasTurnEntry(heroId);
  }

  async playTurnEntry(heroId) {
    if (heroId !== 'auryi') return super.playTurnEntry(heroId);
    const actor = this.actors.get(heroId);
    if (!actor?.duoEntryConfig) return;
    return this.duoHybrid.playSequence({
      config: actor.duoEntryConfig,
      actor,
      enemyX: actor.sprite.x,
      enemyY: actor.sprite.y,
      onFrame: null
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
    const enemyY = this.scene.enemyView?.container?.y ?? actor.sprite.y;
    try {
      return await this.duoHybrid.playSequence({
        config: actor.duoSequenceConfig,
        actor,
        enemyX,
        enemyY,
        onFrame: (frameIndex, markerData, manifest) => onFrame?.(frameIndex, markerData, manifest)
      });
    } catch (error) {
      const detail = error?.message || String(error);
      const rootStack = error?.stack || detail;
      const wrapped = new Error(`[PriZim Duo-Hybrid · Blitzer] ${detail}`);
      wrapped.stack = `${wrapped.message}\nROOT CAUSE:\n${rootStack}`;
      console.error('[PriZim Duo-Hybrid · Blitzer]', error);
      throw wrapped;
    }
  }
}
