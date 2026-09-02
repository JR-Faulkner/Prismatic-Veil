// LIVE28 formation correction.
// - Uses the approved JRPG Auryi master intact. No destructive runtime crown removal.
// - Suppresses duplicate persistent Phaser crown/Auorb layers while retaining the
//   preferred Phaser attack presentation from the Duo-Hybrid driver.
// - MAIN prefers the locked HC Kineza right-facing battle-idle authority.
// - Blitzer frame 01 is safety fallback only.
// - Keeps Auryi's visible rise -> attack -> settle choreography.
import Live26PartyFormationView from './Live26PartyFormationView.js?v=live26g';

const AURYI_MASTER_KEY = 'party_auryi';
const KINEZA_MAIN_IDLE_KEY = 'kineza_main_battle_idle_hc';
const KINEZA_FALLBACK_KEY = 'kineza_live28_blitzer_frame01';
const AURYI_TARGET_H_FRAC = 0.40;
const KINEZA_HEIGHT_RATIO = 475 / 650;
const KINEZA_MAIN_CONTENT_H = 900;
const KINEZA_FALLBACK_CONTENT_H = 673;
const KINEZA_FALLBACK_ORIGIN_Y = 710 / 768;
const AURYI_ATTACK_LIFT_FRAC = 0.10;

export default class Live28PartyFormationView extends Live26PartyFormationView {
  create(roster) {
    super.create(roster);

    const auryi = this.actors.get('auryi');
    if (auryi && this.scene.textures.exists(AURYI_MASTER_KEY)) {
      auryi.live28ApprovedMaster = true;
      auryi.standbyTex = AURYI_MASTER_KEY;
      auryi.standbyOriginY = 1;
      auryi.sprite.setTexture(AURYI_MASTER_KEY).setOrigin(0.5, 1);
      auryi.ghost.setTexture(AURYI_MASTER_KEY).setOrigin(0.5, 1);
      auryi.duoEntryPlayed = true;
      this._hideDuplicateAuryiMagic(auryi);
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

  _hideDuplicateAuryiMagic(actor) {
    if (!actor) return;
    actor.duoMagicVisible = false;
    actor.duoCrown?.setAlpha(0);
    actor.duoAuorb?.setAlpha(0);
  }

  _showAuryiBattleMagic(actor) {
    this._hideDuplicateAuryiMagic(actor);
  }

  _updateAuryiAttackMagic(actor) {
    this._hideDuplicateAuryiMagic(actor);
  }

  layout() {
    super.layout();
    const h = this.scene.scale.height;

    const auryi = this.actors?.get('auryi');
    if (auryi && !auryi._snapshot && auryi.live28ApprovedMaster) {
      const image = this.scene.textures.get(AURYI_MASTER_KEY)?.getSourceImage?.();
      const aspect = image?.height ? image.width / image.height : 1;
      const targetH = h * AURYI_TARGET_H_FRAC;
      auryi.sprite.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      auryi.ghost.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      auryi.ring.setSize(auryi.sprite.displayWidth * 0.5, auryi.sprite.displayWidth * 0.18);
      this._hideDuplicateAuryiMagic(auryi);
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
        onUpdate: () => {
          if (actor.ghost) actor.ghost.y = actor.sprite.y;
        },
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
      this._hideDuplicateAuryiMagic(actor);
    }
  }
}
