// LIVE28K2 production formation adapter.
// Uses approved full-resolution Prismel/Auryi authorities without downscaling source files.
// Prismel state lock: off-turn right-facing idle; on-turn HC-approved staff-ready active.
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28j';

const PRISMEL_K2_PASSIVE_KEY = 'prismel_live28k2_passive';
const PRISMEL_K2_ACTIVE_KEY = 'prismel_live28k2_staff_ready';
const AURYI_K2_PRIMARY_KEY = 'auryi_live28k2_primary';
const AURYI_K2_CLEAN_KEY = 'auryi_live28k2_crownless';
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
      const cleanKey = this._buildLive28K2CrownlessAuryiTexture();
      if (cleanKey) {
        auryi.live28ApprovedTextureKey = cleanKey;
        auryi.standbyTex = cleanKey;
        this._restoreAuryiClean(auryi);
      }
      this._removePersistentAuryiMagic(auryi);
    }

    this.layout();
  }

  _buildLive28K2CrownlessAuryiTexture() {
    if (this.scene.textures.exists(AURYI_K2_CLEAN_KEY)) return AURYI_K2_CLEAN_KEY;
    if (!this.scene.textures.exists(AURYI_K2_PRIMARY_KEY)) return null;

    const source = this.scene.textures.get(AURYI_K2_PRIMARY_KEY)?.getSourceImage?.();
    if (!source?.width || !source?.height) return null;

    const texture = this.scene.textures.createCanvas(AURYI_K2_CLEAN_KEY, source.width, source.height);
    if (!texture) return null;
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, source.width, source.height);
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const px = imageData.data;
    const remove = new Uint8Array(source.width * source.height);

    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 8) continue;
      const p = i / 4;
      const x = p % source.width;
      const y = Math.floor(p / source.width);
      const nx = x / source.width;
      const ny = y / source.height;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max - min;

      const crownRegion = nx > 0.27 && nx < 0.73 && ny < 0.205;
      const orbRegion = nx > 0.62 && nx < 0.93 && ny > 0.105 && ny < 0.355;
      const goldMagic = r > 165 && g > 110 && (r - b) > 58 && (g - b) > 22;
      const violetMagic = b > 145 && r > 92 && (b - g) > 22;
      const luminousMagic = max > 222 && sat < 44;
      if ((crownRegion || orbRegion) && (goldMagic || violetMagic || luminousMagic)) remove[p] = 1;
    }

    for (let y = 1; y < source.height - 1; y++) {
      for (let x = 1; x < source.width - 1; x++) {
        const p = y * source.width + x;
        if (!remove[p]) continue;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const q = (y + oy) * source.width + (x + ox);
            if (px[q * 4 + 3] < 150) remove[q] = 1;
          }
        }
      }
    }

    for (let p = 0; p < remove.length; p++) {
      if (remove[p]) px[p * 4 + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
    texture.refresh();
    return AURYI_K2_CLEAN_KEY;
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
    if (auryi?.live28ApprovedTextureKey && !auryi._snapshot) this._restoreAuryiClean(auryi);
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
