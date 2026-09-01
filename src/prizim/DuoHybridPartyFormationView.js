// PriZim Duo-Hybrid Formation Adapter v0.11
// Keeps PartyBattleScene's proven attack-resolution contract while routing
// Kineza and Auryi through PriZim Sequence Mode.
// Neutral JSON manifests remain canonical presentation authority.

import PartyFormationView from '../PartyFormationView.js?v=duo-base-1';
import DuoHybridSequenceDriver from './DuoHybridSequenceDriver.js?v=duo-8';

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
  povFrames: Object.freeze([])
});

const AURYI_ENTRY_DUO = Object.freeze({
  id: 'auryi_turn_entry_v2',
  name: 'Auryi Turn Entry',
  manifest: './pv-data/sequences/auryi_turn_entry.duo.sequence.json',
  version: '8'
});

const AURYI_AUORB_DUO = Object.freeze({
  id: 'auryi_auorb_invocation_v4',
  name: 'Auorb Invocation',
  manifest: './pv-data/sequences/auryi_auorb_invocation.duo.sequence.json',
  version: '10',
  markerFrames: Object.freeze({
    gather: Object.freeze([1, 2, 3, 4, 5]),
    release: Object.freeze([9, 10]),
    impact: Object.freeze([11]),
    recover: Object.freeze([15, 16, 17])
  }),
  // PriZim owns Auryi's ranged camera/HUD takeover from the manifest.
  povFrames: Object.freeze([])
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
      auryi.duoAttackConfig = AURYI_AUORB_DUO;
      auryi.attackSheetConfig = AURYI_AUORB_DUO;
      this.duoHybrid.prepare(AURYI_ENTRY_DUO).catch(error => {
        auryi.duoEntryPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Auryi entry prewarm deferred:', error);
      });
      this.duoHybrid.prepare(AURYI_AUORB_DUO).catch(error => {
        auryi.duoAttackPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Auryi attack prewarm deferred:', error);
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
    if (heroId === 'kineza') return !!this.actors.get(heroId)?.duoSequenceConfig;
    if (heroId === 'auryi') return !!this.actors.get(heroId)?.duoAttackConfig;
    return super.hasAttackSheet(heroId);
  }

  async playAttackSheet(heroId, onFrame) {
    if (heroId !== 'kineza' && heroId !== 'auryi') return super.playAttackSheet(heroId, onFrame);
    const actor = this.actors.get(heroId);
    const config = heroId === 'kineza' ? actor?.duoSequenceConfig : actor?.duoAttackConfig;
    if (!config) throw new Error(`[PriZim Duo-Hybrid] ${heroId} attack sequence was not registered.`);
    const enemyX = this.scene.enemyView?.container?.x ?? (this.scene.scale.width * 0.74);
    const enemyY = this.scene.enemyView?.container?.y ?? actor.sprite.y;
    try {
      return await this.duoHybrid.playSequence({
        config,
        actor,
        enemyX,
        enemyY,
        onFrame: (frameIndex, markerData, manifest) => onFrame?.(frameIndex, markerData, manifest)
      });
    } catch (error) {
      const detail = error?.message || String(error);
      const rootStack = error?.stack || detail;
      const label = heroId === 'kineza' ? 'Blitzer' : 'Auorb Invocation';
      const wrapped = new Error(`[PriZim Duo-Hybrid · ${label}] ${detail}`);
      wrapped.stack = `${wrapped.message}\nROOT CAUSE:\n${rootStack}`;
      console.error(`[PriZim Duo-Hybrid · ${label}]`, error);
      throw wrapped;
    }
  }
}
