// LIVE22 Auryi battle-state adapter.
// Keeps live21 Duo-Hybrid behavior intact while correcting Auryi lifecycle,
// FX ownership, Wraith targeting, and first-turn/recover audio.
import DuoHybridPartyFormationView from './DuoHybridPartyFormationView.js?v=live21';
import Live22DuoHybridSequenceDriver from './Live22DuoHybridSequenceDriver.js?v=live22';

const AURYI_CROWN_Y_FRAC = 0.29;
const AURYI_ORB_X_FRAC = 0.063;
const AURYI_ORB_Y_FRAC = 0.089;

export default class Live22PartyFormationView extends DuoHybridPartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new Live22DuoHybridSequenceDriver(scene);
  }

  create(roster) {
    super.create(roster);
    const auryi = this.actors.get('auryi');
    if (auryi) {
      // Encounter hard reset: battle begins truly crown/Auorb-free.
      this._showAuryiBattleMagic(auryi, false);
    }
  }

  _layoutAuryiBattleMagic(actor) {
    if (!actor?.duoCrown || !actor?.duoAuorb) return;
    const h = this.scene.scale.height;
    actor.duoCrown.setPosition(actor.sprite.x, actor.sprite.y - h * AURYI_CROWN_Y_FRAC);
    actor.duoAuorb.setPosition(
      actor.sprite.x + h * AURYI_ORB_X_FRAC,
      actor.sprite.y - h * AURYI_ORB_Y_FRAC
    );
  }

  async playTurnEntry(heroId) {
    if (heroId !== 'auryi') return super.playTurnEntry(heroId);
    const actor = this.actors.get(heroId);
    if (!actor?.duoEntryConfig || actor.duoEntryPlayed) return;

    actor.duoEntryPlayed = true;
    try {
      let manifestCuePlayed = false;
      await this.duoHybrid.playSequence({
        config: actor.duoEntryConfig,
        actor,
        enemyX: actor.sprite.x,
        enemyY: actor.sprite.y,
        onFrame: (_frameIndex, markerData) => {
          if (!manifestCuePlayed && markerData?.markers?.includes('crownIgnite')) {
            manifestCuePlayed = true;
            // Reuse the approved production gather timbre for the awakening beat.
            this.scene.audio?.attackGather?.('auryi');
          }
        }
      });
      this._showAuryiBattleMagic(actor, true);
    } catch (error) {
      actor.duoEntryPlayed = false;
      throw error;
    }
  }

  async playAttackSheet(heroId, onFrame) {
    if (heroId !== 'auryi') return super.playAttackSheet(heroId, onFrame);

    const actor = this.actors.get(heroId);
    const config = actor?.duoAttackConfig;
    if (!config) throw new Error('[LIVE22] Auryi attack sequence was not registered.');

    const enemyView = this.scene.enemyView;
    const enemyX = Number.isFinite(enemyView?.baseX)
      ? enemyView.baseX
      : (enemyView?.container?.x ?? this.scene.scale.width * 0.74);
    const enemyBaselineY = Number.isFinite(enemyView?.baseY)
      ? enemyView.baseY
      : (enemyView?.container?.y ?? actor.sprite.y);
    const enemyY = enemyBaselineY - (enemyView?.sprite?.displayHeight || 0) * 0.46;

    const hadPersistentMagic = !!actor.duoMagicVisible;
    if (hadPersistentMagic) {
      actor.duoCrown?.setAlpha(0);
      actor.duoAuorb?.setAlpha(0);
    }

    let recoverCuePlayed = false;
    try {
      return await this.duoHybrid.playSequence({
        config,
        actor,
        enemyX,
        enemyY,
        onFrame: (frameIndex, markerData, manifest) => {
          if (!recoverCuePlayed && markerData?.markers?.includes('recover')) {
            recoverCuePlayed = true;
            // Existing recover asset is already preloaded under the private event key.
            this.scene.audio?._play?.('_recover:auryi');
          }
          onFrame?.(frameIndex, markerData, manifest);
        }
      });
    } finally {
      if (hadPersistentMagic && actor?.duoMagicVisible) {
        this._drawAuryiCrown(actor, 0.38, 0.68);
        this._drawAuryiAuorb(actor, 0.62, 0.56);
        this._layoutAuryiBattleMagic(actor);
        actor.duoCrown?.setAlpha(1);
        actor.duoAuorb?.setAlpha(1);
      }
    }
  }
}
