// LIVE28I MAIN hybrid formation correction.
// Production goals:
// - Never upscale Prismel's tiny wrapped-raster HC idles. Use the full 900x900 JRPG master.
// - Restore the previously proven crownless Auryi treatment from the approved JRPG master.
// - Scale/anchor all three heroes by their VISIBLE alpha bounds, not their source-canvas size.
// - Preserve locked trio hierarchy: Auryi tallest -> Prismel middle -> Kineza shortest.
import Live26PartyFormationView from './Live26PartyFormationView.js?v=live26g';

const PRISMEL_MAIN_KEY = 'prismel_main_highres';
const AURYI_MAIN_KEY = 'auryi_main_highres';
const AURYI_CLEAN_KEY = 'auryi_live28i_jrpg_crownless';
const KINEZA_MAIN_IDLE_KEY = 'kineza_main_battle_idle_hc';
const KINEZA_FALLBACK_KEY = 'kineza_live28_blitzer_frame01';

// Locked visual calibration from the approved trio lineup / PriZim scale gate.
const AURYI_VISIBLE_H_FRAC = 0.43;
const PRISMEL_VISIBLE_RATIO = 515 / 520;
const KINEZA_VISIBLE_RATIO = 440 / 520;
const AURYI_ATTACK_LIFT_FRAC = 0.10;

export default class Live28PartyFormationView extends Live26PartyFormationView {
  create(roster) {
    super.create(roster);
    this._live28VisibleBounds = new Map();

    const prismel = this.actors.get('prismel');
    if (prismel && this.scene.textures.exists(PRISMEL_MAIN_KEY)) {
      prismel.stateSheetConfig = null;
      prismel.stateAnimKey = null;
      prismel.live28HighResMaster = true;
      prismel.standbyTex = PRISMEL_MAIN_KEY;
      this._restorePrismelMaster(prismel);
    }

    const auryi = this.actors.get('auryi');
    if (auryi && this.scene.textures.exists(AURYI_MAIN_KEY)) {
      const cleanKey = this._buildApprovedCrownlessAuryiTexture();
      if (cleanKey) {
        auryi.live28ApprovedTextureKey = cleanKey;
        auryi.standbyTex = cleanKey;
        this._restoreAuryiClean(auryi);
      } else {
        console.error('[LIVE28I] Crownless Auryi texture could not be prepared.');
      }
      auryi.duoEntryPlayed = true;
      this._removePersistentAuryiMagic(auryi);
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
        kineza.sprite.setTexture(key).setVisible(true).setAlpha(1);
        kineza.ghost.setTexture(key).setAlpha(0).setVisible(true);
      }
    }

    this.layout();
  }

  _restorePrismelMaster(actor) {
    if (!actor || !this.scene.textures.exists(PRISMEL_MAIN_KEY)) return false;
    actor.standbyTex = PRISMEL_MAIN_KEY;
    actor._snapshot = null;
    actor._poseScale = null;
    actor.sprite.setTexture(PRISMEL_MAIN_KEY).setVisible(true).setAlpha(1).setAngle(0);
    actor.ghost.setTexture(PRISMEL_MAIN_KEY).setVisible(true).setAlpha(0).setAngle(0);
    actor.attackSprite?.setVisible(false)?.setAlpha?.(1);
    return true;
  }

  _restoreAuryiClean(actor) {
    const key = actor?.live28ApprovedTextureKey || AURYI_CLEAN_KEY;
    if (!actor || !this.scene.textures.exists(key)) return false;
    actor.standbyTex = key;
    actor._snapshot = null;
    actor._poseScale = null;
    actor.sprite.setTexture(key).setVisible(true).setAlpha(1).setAngle(0);
    actor.ghost.setTexture(key).setVisible(true).setAlpha(0).setAngle(0);
    actor.attackSprite?.setVisible(false)?.setAlpha?.(1);
    return true;
  }

  _buildApprovedCrownlessAuryiTexture() {
    if (this.scene.textures.exists(AURYI_CLEAN_KEY)) return AURYI_CLEAN_KEY;
    if (!this.scene.textures.exists(AURYI_MAIN_KEY)) return null;

    const source = this.scene.textures.get(AURYI_MAIN_KEY)?.getSourceImage?.();
    if (!source?.width || !source?.height) return null;

    // Same approved-body cleanup principle previously used in LIVE27, but keep the
    // native 900x900 canvas intact so no resampling/cropping lowers clarity.
    const texture = this.scene.textures.createCanvas(AURYI_CLEAN_KEY, source.width, source.height);
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

      // Remove only the baked crown/Auorb apparatus. Dark curls, skin, robe,
      // jewelry and costume pixels are preserved. Runtime magic remains separate.
      const crownRegion = nx > 0.27 && nx < 0.73 && ny < 0.205;
      const orbRegion = nx > 0.62 && nx < 0.93 && ny > 0.105 && ny < 0.355;
      const goldMagic = r > 165 && g > 110 && (r - b) > 58 && (g - b) > 22;
      const violetMagic = b > 145 && r > 92 && (b - g) > 22;
      const luminousMagic = max > 222 && sat < 44;
      if ((crownRegion || orbRegion) && (goldMagic || violetMagic || luminousMagic)) {
        remove[p] = 1;
      }
    }

    // One-pixel halo cleanup around removed magic, constrained to the same magic
    // regions, so glow fringe cannot keep reading as a crown on iPhone.
    for (let y = 1; y < source.height - 1; y++) {
      for (let x = 1; x < source.width - 1; x++) {
        const p = y * source.width + x;
        if (!remove[p]) continue;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const q = (y + oy) * source.width + (x + ox);
            const qi = q * 4;
            if (px[qi + 3] < 150) remove[q] = 1;
          }
        }
      }
    }

    for (let p = 0; p < remove.length; p++) {
      if (remove[p]) px[p * 4 + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
    texture.refresh();
    return AURYI_CLEAN_KEY;
  }

  _measureVisibleBounds(key) {
    if (this._live28VisibleBounds?.has(key)) return this._live28VisibleBounds.get(key);
    const source = this.scene.textures.get(key)?.getSourceImage?.();
    if (!source?.width || !source?.height) return null;

    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const rows = new Uint32Array(canvas.height);
    const cols = new Uint32Array(canvas.width);

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 40) continue;
      const p = i / 4;
      const x = p % canvas.width;
      const y = Math.floor(p / canvas.width);
      rows[y]++;
      cols[x]++;
    }

    // Ignore isolated particles/glints. We want the readable character body bounds.
    const minRowCount = Math.max(4, Math.floor(canvas.width * 0.006));
    const minColCount = Math.max(4, Math.floor(canvas.height * 0.006));
    let top = 0, bottom = canvas.height - 1, left = 0, right = canvas.width - 1;
    while (top < bottom && rows[top] < minRowCount) top++;
    while (bottom > top && rows[bottom] < minRowCount) bottom--;
    while (left < right && cols[left] < minColCount) left++;
    while (right > left && cols[right] < minColCount) right--;

    const bounds = {
      left, right, top, bottom,
      width: Math.max(1, right - left + 1),
      height: Math.max(1, bottom - top + 1),
      sourceW: canvas.width,
      sourceH: canvas.height
    };
    this._live28VisibleBounds?.set(key, bounds);
    return bounds;
  }

  _fitActorToVisibleHeight(actor, key, targetVisibleH) {
    if (!actor || !this.scene.textures.exists(key)) return false;
    const b = this._measureVisibleBounds(key);
    if (!b) return false;
    const scale = targetVisibleH / b.height;
    const originX = ((b.left + b.right) * 0.5) / b.sourceW;
    const originY = b.bottom / b.sourceH;

    [actor.sprite, actor.ghost].filter(Boolean).forEach(obj => {
      obj.setTexture(key).setOrigin(originX, originY).setScale(scale);
      obj.x = Math.round(obj.x);
      obj.y = Math.round(obj.y);
    });
    actor.standbyOriginY = originY;
    actor.ring?.setSize(Math.max(42, b.width * scale * 0.55), Math.max(12, b.width * scale * 0.18));
    return true;
  }

  _removePersistentAuryiMagic(actor) {
    if (!actor) return;
    actor.duoMagicVisible = false;
    [actor.duoCrown, actor.duoAuorb].filter(Boolean).forEach(obj => {
      obj.setAlpha?.(0);
      obj.setVisible?.(false);
      obj.destroy?.();
    });
    actor.duoCrown = null;
    actor.duoAuorb = null;
  }

  _disablePersistentAuryiMagic(actor) { this._removePersistentAuryiMagic(actor); }
  _hideDuplicateAuryiMagic(actor) { this._removePersistentAuryiMagic(actor); }
  _showAuryiBattleMagic(actor) { this._removePersistentAuryiMagic(actor); }
  _updateAuryiAttackMagic(actor) { this._removePersistentAuryiMagic(actor); }
  _drawAuryiCrown(actor) { this._removePersistentAuryiMagic(actor); }
  _drawAuryiAuorb(actor) { this._removePersistentAuryiMagic(actor); }
  _layoutAuryiBattleMagic(actor) { this._removePersistentAuryiMagic(actor); }

  hasTurnEntry(heroId) {
    if (heroId === 'prismel' || heroId === 'auryi') return false;
    return super.hasTurnEntry(heroId);
  }

  setActive(heroId) {
    super.setActive(heroId);

    const prismel = this.actors.get('prismel');
    if (prismel?.live28HighResMaster && !prismel._snapshot) this._restorePrismelMaster(prismel);

    const auryi = this.actors.get('auryi');
    if (auryi?.live28ApprovedTextureKey && !auryi._snapshot) this._restoreAuryiClean(auryi);
    this._removePersistentAuryiMagic(auryi);
    this.layout();
  }

  setActionPose(heroId, pose) {
    if (heroId !== 'prismel') return super.setActionPose(heroId, pose);
    const actor = this.actors.get('prismel');
    if (!actor) return false;
    if (pose !== 'idle') return super.setActionPose(heroId, pose);

    this.scene.tweens.killTweensOf(actor.sprite);
    this.scene.tweens.killTweensOf(actor.ghost);
    const restored = this._restorePrismelMaster(actor);
    this.layout();
    return restored;
  }

  layout() {
    super.layout();
    const h = this.scene.scale.height;

    const auryi = this.actors?.get('auryi');
    if (auryi && !auryi._snapshot && auryi.live28ApprovedTextureKey) {
      if (auryi.sprite.texture?.key !== auryi.live28ApprovedTextureKey) this._restoreAuryiClean(auryi);
      this._fitActorToVisibleHeight(auryi, auryi.live28ApprovedTextureKey, h * AURYI_VISIBLE_H_FRAC);
      this._removePersistentAuryiMagic(auryi);
    }

    const prismel = this.actors?.get('prismel');
    if (prismel && !prismel._snapshot && prismel.live28HighResMaster) {
      if (prismel.sprite.texture?.key !== PRISMEL_MAIN_KEY) this._restorePrismelMaster(prismel);
      this._fitActorToVisibleHeight(prismel, PRISMEL_MAIN_KEY, h * AURYI_VISIBLE_H_FRAC * PRISMEL_VISIBLE_RATIO);
    }

    const kineza = this.actors?.get('kineza');
    if (kineza && !kineza._snapshot && kineza.live28KinezaStandby) {
      const key = kineza.live28KinezaMainIdle ? KINEZA_MAIN_IDLE_KEY : KINEZA_FALLBACK_KEY;
      this._fitActorToVisibleHeight(kineza, key, h * AURYI_VISIBLE_H_FRAC * KINEZA_VISIBLE_RATIO);
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
    if (heroId === 'prismel') {
      const actor = this.actors.get('prismel');
      try {
        return await super.playAttackSheet(heroId, onFrame);
      } finally {
        if (actor) {
          this.scene.tweens.killTweensOf(actor.sprite);
          this.scene.tweens.killTweensOf(actor.ghost);
          this._restorePrismelMaster(actor);
          this.layout();
        }
      }
    }

    if (heroId !== 'auryi') return super.playAttackSheet(heroId, onFrame);
    const actor = this.actors.get('auryi');
    if (!actor) return super.playAttackSheet(heroId, onFrame);
    const homeY = actor.sprite.y;
    const attackY = homeY - Math.max(44, this.scene.scale.height * AURYI_ATTACK_LIFT_FRAC);
    await this._tweenAuryiY(actor, attackY, 260);
    try {
      return await super.playAttackSheet(heroId, onFrame);
    } finally {
      this.scene.tweens.killTweensOf(actor.sprite);
      this.scene.tweens.killTweensOf(actor.ghost);
      this._restoreAuryiClean(actor);
      actor.sprite.y = Math.round(homeY);
      actor.ghost.y = Math.round(homeY);
      this._removePersistentAuryiMagic(actor);
      this.layout();
    }
  }
}
