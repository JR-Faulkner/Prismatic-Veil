// LIVE27 formation correction.
// - Uses the approved JRPG Auryi master as the body source, then removes only
//   baked crown/Auorb pixels so battle-state magic remains Phaser-owned.
// - Uses Kineza's approved Stylized-JRPG right-facing attack-master frame 0
//   as battlefield standby instead of the mismatched state-sheet body.
// - Gives Auryi a clear rise -> attack -> settle motion while keeping crown
//   and Auorb attached to her body-relative anchors.
import Live26PartyFormationView from './Live26PartyFormationView.js?v=live26g';

const AURYI_MASTER_KEY = 'party_auryi';
const AURYI_CLEAN_KEY = 'auryi_live27_jrpg_master_crownless';
const KINEZA_STANDBY_KEY = 'kineza_live27_jrpg_standby';
const KINEZA_FRAME_H = 580;
const KINEZA_BASELINE_PX = 525;
const KINEZA_CONTENT_H = 350;
const AURYI_TARGET_H_FRAC = 0.40;
const KINEZA_HEIGHT_RATIO = 475 / 650;
const AURYI_ATTACK_LIFT_FRAC = 0.085;

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

export default class Live27PartyFormationView extends Live26PartyFormationView {
  create(roster) {
    super.create(roster);

    const auryi = this.actors.get('auryi');
    if (auryi) {
      const cleanKey = this._buildApprovedCrownlessAuryiTexture();
      if (cleanKey) {
        auryi.live27ApprovedTextureKey = cleanKey;
        auryi.standbyTex = cleanKey;
        auryi.standbyOriginY = 1;
        auryi.sprite.setTexture(cleanKey).setOrigin(0.5, 1);
        auryi.ghost.setTexture(cleanKey).setOrigin(0.5, 1);
      } else {
        console.error('[LIVE27] Approved JRPG Auryi crownless texture could not be prepared.');
      }
      // Encounter authority remains clean body only. Crown/Auorb are Phaser layers.
      auryi.duoEntryPlayed = false;
      this._showAuryiBattleMagic(auryi, false);
    }

    const kineza = this.actors.get('kineza');
    if (kineza && this.scene.textures.exists(KINEZA_STANDBY_KEY)) {
      // Do not let the older battle-state sheet replace the approved JRPG body
      // on active/passive transitions. Blitzer remains owned by Duo-Hybrid.
      kineza.stateSheetConfig = null;
      kineza.stateAnimKey = null;
      kineza.standbyTex = KINEZA_STANDBY_KEY;
      kineza.standbyOriginY = KINEZA_BASELINE_PX / KINEZA_FRAME_H;
      kineza.sprite.setTexture(KINEZA_STANDBY_KEY, 0).setOrigin(0.5, kineza.standbyOriginY);
      kineza.ghost.setTexture(KINEZA_STANDBY_KEY, 0).setOrigin(0.5, kineza.standbyOriginY);
      kineza.live27JrpgStandby = true;
    }

    this.layout();
  }

  _buildApprovedCrownlessAuryiTexture() {
    if (this.scene.textures.exists(AURYI_CLEAN_KEY)) return AURYI_CLEAN_KEY;
    if (!this.scene.textures.exists(AURYI_MASTER_KEY)) return null;

    const source = this.scene.textures.get(AURYI_MASTER_KEY)?.getSourceImage?.();
    if (!source?.width || !source?.height) return null;

    const work = document.createElement('canvas');
    work.width = source.width;
    work.height = source.height;
    const ctx = work.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, work.width, work.height);
    const px = imageData.data;
    let minX = work.width, minY = work.height, maxX = -1, maxY = -1;

    for (let i = 0; i < px.length; i += 4) {
      const p = i / 4;
      const x = p % work.width;
      const y = Math.floor(p / work.width);
      const nx = x / work.width;
      const ny = y / work.height;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const originalAlpha = px[i + 3] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max - min;

      // Preserve the exact JRPG master while keying its light studio canvas.
      const dr = 255 - r, dg = 255 - g, db = 255 - b;
      const distWhite = Math.sqrt(dr * dr + dg * dg + db * db);
      const base = clamp01((distWhite - 10) / 42);
      const colorfulHighlight = clamp01((sat - 14) / 70) * clamp01((max - 145) / 95) * 0.86;
      let alpha = Math.round(255 * originalAlpha * Math.max(base, colorfulHighlight));

      // Remove only baked magical apparatus from the approved master.
      // Regions intentionally stop above the head/hand so dark curls and skin
      // survive; within them only bright gold/violet/luminous pixels are keyed.
      const crownRegion = nx > 0.27 && nx < 0.73 && ny < 0.205;
      const orbRegion = nx > 0.62 && nx < 0.93 && ny > 0.105 && ny < 0.355;
      const goldMagic = r > 165 && g > 110 && (r - b) > 58 && (g - b) > 22;
      const violetMagic = b > 145 && r > 92 && (b - g) > 22;
      const luminousMagic = max > 222 && sat < 44;
      if ((crownRegion || orbRegion) && (goldMagic || violetMagic || luminousMagic)) {
        alpha = 0;
      }

      px[i + 3] = alpha;
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    if (maxX < minX || maxY < minY) return null;
    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(work.width - 1, maxX + pad);
    maxY = Math.min(work.height - 1, maxY + pad);
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    const texture = this.scene.textures.createCanvas(AURYI_CLEAN_KEY, cropW, cropH);
    if (!texture) return null;
    const cleanCtx = texture.getContext();
    cleanCtx.clearRect(0, 0, cropW, cropH);
    cleanCtx.drawImage(work, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    texture.refresh();
    return AURYI_CLEAN_KEY;
  }

  layout() {
    super.layout();
    const h = this.scene.scale.height;

    const auryi = this.actors?.get('auryi');
    if (auryi && !auryi._snapshot && auryi.live27ApprovedTextureKey && this.scene.textures.exists(auryi.live27ApprovedTextureKey)) {
      const image = this.scene.textures.get(auryi.live27ApprovedTextureKey)?.getSourceImage?.();
      const aspect = image?.height ? image.width / image.height : 0.78;
      const targetH = h * AURYI_TARGET_H_FRAC;
      auryi.sprite.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      auryi.ghost.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      auryi.ring.setSize(auryi.sprite.displayWidth * 0.5, auryi.sprite.displayWidth * 0.18);
      this._layoutAuryiBattleMagic(auryi);
    }

    const kineza = this.actors?.get('kineza');
    if (kineza && !kineza._snapshot && kineza.live27JrpgStandby) {
      const targetH = h * AURYI_TARGET_H_FRAC * KINEZA_HEIGHT_RATIO;
      const scale = targetH / KINEZA_CONTENT_H;
      kineza.sprite.setOrigin(0.5, KINEZA_BASELINE_PX / KINEZA_FRAME_H).setScale(scale);
      kineza.ghost.setOrigin(0.5, KINEZA_BASELINE_PX / KINEZA_FRAME_H).setScale(scale);
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
          this._layoutAuryiBattleMagic(actor);
        },
        onComplete: () => {
          actor.sprite.y = targetY;
          if (actor.ghost) actor.ghost.y = targetY;
          this._layoutAuryiBattleMagic(actor);
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
    const lift = Math.max(38, this.scene.scale.height * AURYI_ATTACK_LIFT_FRAC);
    const attackY = homeY - lift;
    actor.live27AttackHomeY = homeY;

    await this._tweenAuryiY(actor, attackY, 260);
    try {
      return await super.playAttackSheet(heroId, onFrame);
    } finally {
      await this._tweenAuryiY(actor, homeY, 310);
      actor.live27AttackHomeY = null;
      this._layoutAuryiBattleMagic(actor);
    }
  }
}
