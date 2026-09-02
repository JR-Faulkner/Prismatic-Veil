// LIVE28 formation correction.
// MAIN production authority:
// - Prismel uses his approved HC passive idle when off-turn and HC active idle when on-turn.
// - Auryi uses the approved JRPG body at 45% viewport height with no stacked persistent Phaser crown/Auorb.
// - Kineza prefers the locked HC right-facing battle idle when present; Blitzer frame 01 remains fallback only.
import Live26PartyFormationView from './Live26PartyFormationView.js?v=live26g';

const PRISMEL_PASSIVE_KEY = 'prismel_idle_passive_hc';
const PRISMEL_ACTIVE_KEY = 'prismel_idle_active_hc';
const AURYI_MASTER_KEY = 'party_auryi';
const KINEZA_MAIN_IDLE_KEY = 'kineza_main_battle_idle_hc';
const KINEZA_FALLBACK_KEY = 'kineza_live28_blitzer_frame01';

const AURYI_TARGET_H_FRAC = 0.45;
const PRISMEL_HEIGHT_RATIO = 570 / 650;
const KINEZA_HEIGHT_RATIO = 475 / 650;
const KINEZA_FALLBACK_CONTENT_H = 673;
const KINEZA_FALLBACK_ORIGIN_Y = 710 / 768;
const AURYI_ATTACK_LIFT_FRAC = 0.10;

export default class Live28PartyFormationView extends Live26PartyFormationView {
  create(roster) {
    super.create(roster);

    const prismel = this.actors.get('prismel');
    if (prismel && this.scene.textures.exists(PRISMEL_PASSIVE_KEY)) {
      prismel.stateSheetConfig = null;
      prismel.stateAnimKey = null;
      prismel.live28PrismelIdleSwap = true;
      prismel.standbyTex = PRISMEL_PASSIVE_KEY;
      prismel.standbyOriginY = 1;
      prismel.sprite.setTexture(PRISMEL_PASSIVE_KEY).setOrigin(0.5, 1);
      prismel.ghost.setTexture(PRISMEL_PASSIVE_KEY).setOrigin(0.5, 1);
    }

    const auryi = this.actors.get('auryi');
    if (auryi && this.scene.textures.exists(AURYI_MASTER_KEY)) {
      auryi.live28ApprovedMaster = true;
      auryi.standbyTex = AURYI_MASTER_KEY;
      auryi.standbyOriginY = 1;
      auryi.sprite.setTexture(AURYI_MASTER_KEY).setOrigin(0.5, 1);
      auryi.ghost.setTexture(AURYI_MASTER_KEY).setOrigin(0.5, 1);
      auryi.duoEntryPlayed = true;
      this._disablePersistentAuryiMagic(auryi);
    }

    const kineza = this.actors.get('kineza');
    if (kineza) {
      const hasMainIdle = this.scene.textures.exists(KINEZA_MAIN_IDLE_KEY);
      const key = hasMainIdle ? KINEZA_MAIN_IDLE_KEY : KINEZA_FALLBACK_KEY;
      if (this.scene.textures.exists(key)) {
        kineza.stateSheetConfig = null;
        kineza.stateAnimKey = null;
        kineza.live28KinezaStandby = true;
        kineza.live28KinezaMainIdle = hasMainIdle;
        kineza.standbyTex = key;
        kineza.standbyOriginY = hasMainIdle ? 1 : KINEZA_FALLBACK_ORIGIN_Y;
        kineza.sprite.setTexture(key).setOrigin(0.5, kineza.standbyOriginY);
        kineza.ghost.setTexture(key).setOrigin(0.5, kineza.standbyOriginY);
      }
    }

    this.layout();
  }

  _disablePersistentAuryiMagic(actor) {
    if (!actor) return;
    actor.duoMagicVisible = false;
    [actor.duoCrown, actor.duoAuorb].filter(Boolean).forEach(obj => {
      obj.setAlpha?.(0);
      obj.setVisible?.(false);
    });
  }

  _hideDuplicateAuryiMagic(actor) { this._disablePersistentAuryiMagic(actor); }
  _showAuryiBattleMagic(actor) { this._disablePersistentAuryiMagic(actor); }
  _updateAuryiAttackMagic(actor) { this._disablePersistentAuryiMagic(actor); }
  _drawAuryiCrown(actor) { this._disablePersistentAuryiMagic(actor); }
  _layoutAuryiBattleMagic(actor) { this._disablePersistentAuryiMagic(actor); }

  setActive(heroId) {
    super.setActive(heroId);
    const prismel = this.actors.get('prismel');
    if (prismel?.live28PrismelIdleSwap) {
      const wanted = heroId === 'prismel' && this.scene.textures.exists(PRISMEL_ACTIVE_KEY)
        ? PRISMEL_ACTIVE_KEY
        : PRISMEL_PASSIVE_KEY;
      if (!prismel._snapshot && this.scene.textures.exists(wanted)) {
        prismel.standbyTex = wanted;
        prismel.sprite.setTexture(wanted).setOrigin(0.5, 1);
        prismel.ghost.setTexture(wanted).setOrigin(0.5, 1);
      }
    }
    this._disablePersistentAuryiMagic(this.actors.get('auryi'));
    this.layout();
  }

  layout() {
    super.layout();
    const h = this.scene.scale.height;

    const prismel = this.actors?.get('prismel');
    if (prismel && !prismel._snapshot && prismel.live28PrismelIdleSwap) {
      const image = this.scene.textures.get(prismel.standbyTex)?.getSourceImage?.();
      const aspect = image?.height ? image.width / image.height : 1.2;
      const targetH = h * AURYI_TARGET_H_FRAC * PRISMEL_HEIGHT_RATIO;
      prismel.sprite.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      prismel.ghost.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      prismel.ring.setSize(prismel.sprite.displayWidth * 0.5, prismel.sprite.displayWidth * 0.18);
    }

    const auryi = this.actors?.get('auryi');
    if (auryi && !auryi._snapshot && auryi.live28ApprovedMaster) {
      const image = this.scene.textures.get(AURYI_MASTER_KEY)?.getSourceImage?.();
      const aspect = image?.height ? image.width / image.height : 1;
      const targetH = h * AURYI_TARGET_H_FRAC;
      auryi.sprite.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      auryi.ghost.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      auryi.ring.setSize(auryi.sprite.displayWidth * 0.5, auryi.sprite.displayWidth * 0.18);
      this._disablePersistentAuryiMagic(auryi);
    }

    const kineza = this.actors?.get('kineza');
    if (kineza && !kineza._snapshot && kineza.live28KinezaStandby) {
      const targetH = h * AURYI_TARGET_H_FRAC * KINEZA_HEIGHT_RATIO;
      if (kineza.live28KinezaMainIdle) {
        const image = this.scene.textures.get(KINEZA_MAIN_IDLE_KEY)?.getSourceImage?.();
        const aspect = image?.height ? image.width / image.height : 0.8;
        kineza.sprite.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
        kineza.ghost.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      } else {
        const scale = targetH / KINEZA_FALLBACK_CONTENT_H;
        kineza.sprite.setOrigin(0.5, KINEZA_FALLBACK_ORIGIN_Y).setScale(scale);
        kineza.ghost.setOrigin(0.5, KINEZA_FALLBACK_ORIGIN_Y).setScale(scale);
      }
      kineza.ring.setSize(kineza.sprite.displayWidth * 0.5, kineza.sprite.displayWidth * 0.18);
    }
  }

  _tweenAuryiY(actor, targetY, duration) {
    return new Promise(resolve => {
      this.scene.tweens.killTweensOf(actor.sprite);
      this.scene.tweens.add({
        targets: actor.sprite,
        y: targetY,
        duration,
        ease: 'Sine.easeInOut',
        onUpdate: () => { if (actor.ghost) actor.ghost.y = actor.sprite.y; },
        onComplete: () => {
          actor.sprite.y = targetY;
          if (actor.ghost) actor.ghost.y = targetY;
          resolve();
        }
      });
    });
  }

  async playAttackSheet(heroId, onFrame) {
    if (heroId !== 'auryi') return super.playAttackSheet(heroId, onFrame);
    const actor = this.actors.get('auryi');
    if (!actor) return super.playAttackSheet(heroId, onFrame);
    const homeY = actor.sprite.y;
    const attackY = homeY - Math.max(44, this.scene.scale.height * AURYI_ATTACK_LIFT_FRAC);
    await this._tweenAuryiY(actor, attackY, 260);
    try {
      return await super.playAttackSheet(heroId, onFrame);
    } finally {
      await this._tweenAuryiY(actor, homeY, 310);
      this._disablePersistentAuryiMagic(actor);
    }
  }
}
