// LIVE28K2 staging formation adapter.
// Purpose: introduce the approved right-facing Prismel passive/off-turn authority
// without disturbing the LIVE28J active staff-ready state, Auryi cleanup, Kineza HC idle,
// or the locked body-height hierarchy.
// This file is intentionally NOT wired by hybrid-main.html until the LIVE28K2 Prismel PNG exists.
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28j';

const PRISMEL_K2_PASSIVE_KEY = 'prismel_live28k2_passive';
const PRISMEL_ACTIVE_KEY = 'prismel_live28j_active';
const AURYI_BODY_H_FRAC = 0.47;
const PRISMEL_BODY_RATIO = 1 / 1.29;

export default class Live28K2PartyFormationView extends Live28PartyFormationView {
  create(roster) {
    super.create(roster);
    const prismel = this.actors.get('prismel');
    if (prismel && this.scene.textures.exists(PRISMEL_K2_PASSIVE_KEY)) {
      prismel.live28K2PrismelIdentityPair = true;
      prismel.live28DesiredPrismelTex = PRISMEL_K2_PASSIVE_KEY;
      prismel.standbyTex = PRISMEL_K2_PASSIVE_KEY;
      this._applyPrismelState(prismel, PRISMEL_K2_PASSIVE_KEY);
    }
    this.layout();
  }

  _wantedPrismelKey(heroId = this.scene?.activeHeroId) {
    return heroId === 'prismel' && this.scene.textures.exists(PRISMEL_ACTIVE_KEY)
      ? PRISMEL_ACTIVE_KEY
      : PRISMEL_K2_PASSIVE_KEY;
  }

  setActive(heroId) {
    super.setActive(heroId);
    const prismel = this.actors.get('prismel');
    if (prismel?.live28K2PrismelIdentityPair) {
      const wanted = this._wantedPrismelKey(heroId);
      prismel.live28DesiredPrismelTex = wanted;
      prismel.standbyTex = wanted;
      if (!prismel._snapshot) this._applyPrismelState(prismel, wanted);
    }
    this.layout();
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
    const restored = this._applyPrismelState(actor, wanted);
    this.layout();
    return restored;
  }

  layout() {
    super.layout();
    const prismel = this.actors?.get('prismel');
    if (!prismel || prismel._snapshot || !prismel.live28K2PrismelIdentityPair) return;

    const wanted = prismel.live28DesiredPrismelTex || this._wantedPrismelKey();
    if (!this.scene.textures.exists(wanted)) return;
    if (prismel.sprite.texture?.key !== wanted) this._applyPrismelState(prismel, wanted);
    this._fitActorToBodyHeight(
      prismel,
      wanted,
      this.scene.scale.height * AURYI_BODY_H_FRAC * PRISMEL_BODY_RATIO
    );
  }
}
