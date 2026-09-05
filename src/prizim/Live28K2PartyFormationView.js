// LIVE28K2/K3/K4/K5 production formation adapter.
// Uses approved full-resolution Prismel/Auryi authorities without downscaling source files.
// Prismel state lock: off-turn right-facing idle; on-turn HC-approved staff-ready active.
// Auryi K5 lock: use the already PZ-cleaned 1086x1448 primary directly; never pixel-strip it again at runtime.
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28j';

const PRISMEL_K2_PASSIVE_KEY = 'prismel_live28k2_passive';
const PRISMEL_K2_ACTIVE_KEY = 'prismel_live28k2_staff_ready';
const AURYI_K2_PRIMARY_KEY = 'auryi_live28k2_primary';
const AURYI_BODY_H_FRAC = 0.47;
const PRISMEL_BODY_RATIO = 1 / 1.29;

export default class Live28K2PartyFormationView extends Live28PartyFormationView {
  create(roster) {
    super.create(roster);

    const prismel = this.actors.get('prismel');
    if (prismel && this.scene.textures.exists(PRISMEL_K2_PASSIVE_KEY)) {
      prismel.live28K2PrismelStatePair = true;
      prismel.live28DesiredPrismelTex = PRISMEL_K2_PASSIVE_KEY;
      prismel.standbyTex = PRISMEL_K2_PASSIVE_KEY;
      this._applyPrismelState(prismel, PRISMEL_K2_PASSIVE_KEY);
    }

    const auryi = this.actors.get('auryi');
    if (auryi && this.scene.textures.exists(AURYI_K2_PRIMARY_KEY)) {
      // The repo primary was already alpha-cleaned by PZ at native 1086x1448.
      // Do not create another canvas or remove gold/violet pixels from the character.
      auryi.live28ApprovedTextureKey = AURYI_K2_PRIMARY_KEY;
      auryi.standbyTex = AURYI_K2_PRIMARY_KEY;
      this._restoreAuryiPrimary(auryi);
      this._removePersistentAuryiMagic(auryi);
    }

    this.layout();
  }

  _restoreAuryiPrimary(actor) {
    if (!actor || !this.scene.textures.exists(AURYI_K2_PRIMARY_KEY)) return false;
    actor.live28ApprovedTextureKey = AURYI_K2_PRIMARY_KEY;
    actor.standbyTex = AURYI_K2_PRIMARY_KEY;
    actor._snapshot = null;
    actor._poseScale = null;
    actor.sprite.setTexture(AURYI_K2_PRIMARY_KEY).setVisible(true).setAlpha(1).setAngle(0);
    actor.ghost.setTexture(AURYI_K2_PRIMARY_KEY).setVisible(true).setAlpha(0).setAngle(0);
    actor.attackSprite?.setVisible(false)?.setAlpha?.(1);
    return true;
  }

  _wantedPrismelKey(heroId = this.scene?.activeHeroId) {
    return heroId === 'prismel' && this.scene.textures.exists(PRISMEL_K2_ACTIVE_KEY)
      ? PRISMEL_K2_ACTIVE_KEY
      : PRISMEL_K2_PASSIVE_KEY;
  }

  _forceActiveRing(heroId) {
    this.actors?.forEach((actor, id) => {
      if (!actor?.ring) return;
      const on = id === heroId;
      this.scene.tweens.killTweensOf(actor.ring);
      actor.ring.setVisible(true).setAlpha(on ? 1 : 0);
      actor.ring.setStrokeStyle(on ? 3.2 : 2.2, on ? 0x9fefff : 0xffe8a0, on ? 0.95 : 0);
    });
  }

  setActive(heroId) {
    super.setActive(heroId);

    const prismel = this.actors.get('prismel');
    if (prismel?.live28K2PrismelStatePair) {
      const wanted = this._wantedPrismelKey(heroId);
      prismel.live28DesiredPrismelTex = wanted;
      prismel.standbyTex = wanted;
      if (!prismel._snapshot) this._applyPrismelState(prismel, wanted);
    }

    const auryi = this.actors.get('auryi');
    if (auryi?.live28ApprovedTextureKey && !auryi._snapshot) this._restoreAuryiPrimary(auryi);
    this._removePersistentAuryiMagic(auryi);
    this.layout();
    this._forceActiveRing(heroId);
  }

  setActionPose(heroId, pose) {
    if (heroId !== 'prismel' || pose !== 'idle') return super.setActionPose(heroId, pose);
    const actor = this.actors.get('prismel');
    if (!actor) return false;

    this.scene.tweens.killTweensOf(actor.sprite);
    this.scene.tweens.killTweensOf(actor.ghost);
    actor._snapshot = null;
    actor._poseScale = null;
    const wanted = actor.live28DesiredPrismelTex || this._wantedPrismelKey();
    actor.live28DesiredPrismelTex = wanted;
    actor.standbyTex = wanted;
    const restored = this._applyPrismelState(actor, wanted);
    this.layout();
    this._forceActiveRing(this.scene?.activeHeroId);
    return restored;
  }

  _fitActorToBodyHeight(actor, key, targetBodyH) {
    const fitted = super._fitActorToBodyHeight(actor, key, targetBodyH);
    if (!fitted) return false;

    const b = this._measureBodyBounds(key);
    if (!b) return true;

    const scale = Math.abs(actor.sprite?.scaleX || 1);
    const footprintW = Math.max(42, b.width * scale * 0.55);
    const ringH = Math.max(12, footprintW * 0.20);
    actor.ring?.setPosition(
      Math.round(actor.sprite.x),
      Math.round(actor.sprite.y + Math.max(5, targetBodyH * 0.015))
    ).setSize(footprintW, ringH);
    return true;
  }

  layout() {
    super.layout();

    const auryi = this.actors?.get('auryi');
    if (auryi && !auryi._snapshot && auryi.live28ApprovedTextureKey === AURYI_K2_PRIMARY_KEY) {
      if (auryi.sprite.texture?.key !== AURYI_K2_PRIMARY_KEY) this._restoreAuryiPrimary(auryi);
      this._fitActorToBodyHeight(auryi, AURYI_K2_PRIMARY_KEY, this.scene.scale.height * AURYI_BODY_H_FRAC);
      this._removePersistentAuryiMagic(auryi);
    }

    const prismel = this.actors?.get('prismel');
    if (!prismel || prismel._snapshot || !prismel.live28K2PrismelStatePair) {
      this._forceActiveRing(this.scene?.activeHeroId);
      return;
    }

    const wanted = prismel.live28DesiredPrismelTex || this._wantedPrismelKey();
    if (!this.scene.textures.exists(wanted)) {
      this._forceActiveRing(this.scene?.activeHeroId);
      return;
    }
    if (prismel.sprite.texture?.key !== wanted) this._applyPrismelState(prismel, wanted);
    this._fitActorToBodyHeight(
      prismel,
      wanted,
      this.scene.scale.height * AURYI_BODY_H_FRAC * PRISMEL_BODY_RATIO
    );
    this._forceActiveRing(this.scene?.activeHeroId);
  }
}
