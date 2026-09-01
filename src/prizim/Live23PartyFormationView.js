// LIVE23 Auryi formation correction.
// Removes baked crown/Auorb authority from the party base, restores canonical
// Auryi scale, and uses one body-relative anchor for persistent magic.
import Live22PartyFormationView from './Live22PartyFormationView.js?v=live22';
import Live23DuoHybridSequenceDriver from './Live23DuoHybridSequenceDriver.js?v=live23';

const RAW_KEY = 'auryi_live23_entry_start_raw';
const CLEAN_KEY = 'auryi_live23_crownless_clean';
const LEGACY_DUO_SCALE = 1.12;
const AURYI_CONTENT_HEIGHT_FRAC = 0.40;
const AURYI_ORB_X_FRAC = 0.41;
const AURYI_ORB_Y_FRAC = 0.80;
const AURYI_CROWN_Y_FRAC = 1.08;

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

export default class Live23PartyFormationView extends Live22PartyFormationView {
  constructor(scene) {
    super(scene);
    this.duoHybrid = new Live23DuoHybridSequenceDriver(scene);
  }

  create(roster) {
    super.create(roster);
    const auryi = this.actors.get('auryi');
    if (!auryi) return;

    const cleanKey = this._buildCrownlessAuryiTexture();
    if (cleanKey) {
      auryi.live23CleanTextureKey = cleanKey;
      auryi.standbyTex = cleanKey;
      auryi.standbyOriginY = 1;
      auryi.sprite.setTexture(cleanKey).setOrigin(0.5, 1);
      auryi.ghost.setTexture(cleanKey).setOrigin(0.5, 1);
    } else {
      console.error('[LIVE23] Crownless Auryi texture could not be prepared.');
    }

    // Encounter hard reset. The clean base owns body/costume only.
    auryi.duoEntryPlayed = false;
    this._showAuryiBattleMagic(auryi, false);
    this.layout();
  }

  _buildCrownlessAuryiTexture() {
    if (this.scene.textures.exists(CLEAN_KEY)) return CLEAN_KEY;
    if (!this.scene.textures.exists(RAW_KEY)) return null;

    const rawTexture = this.scene.textures.get(RAW_KEY);
    const image = rawTexture?.getSourceImage?.();
    if (!image?.width || !image?.height) return null;

    const work = document.createElement('canvas');
    work.width = image.width;
    work.height = image.height;
    const ctx = work.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(0, 0, work.width, work.height);
    const px = data.data;
    let minX = work.width, minY = work.height, maxX = -1, maxY = -1;

    // Same white-key family already used by the Duo-Hybrid entry renderer,
    // but preserve the source alpha so transparent source pixels stay empty.
    for (let i = 0; i < px.length; i += 4) {
      const originalAlpha = px[i + 3] / 255;
      const dr = 255 - px[i];
      const dg = 255 - px[i + 1];
      const db = 255 - px[i + 2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      const sat = max - min;
      const base = clamp01((dist - 10) / 42);
      const glow = clamp01((sat - 14) / 70) * clamp01((max - 145) / 95) * 0.86;
      const alpha = Math.round(255 * originalAlpha * Math.max(base, glow));
      px[i + 3] = alpha;

      if (alpha > 20) {
        const p = i / 4;
        const x = p % work.width;
        const y = Math.floor(p / work.width);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    ctx.putImageData(data, 0, 0);

    if (maxX < minX || maxY < minY) return null;
    const pad = 6;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(work.width - 1, maxX + pad);
    maxY = Math.min(work.height - 1, maxY + pad);
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    const cleanTexture = this.scene.textures.createCanvas(CLEAN_KEY, cropW, cropH);
    if (!cleanTexture) return null;
    const cleanCtx = cleanTexture.getContext();
    cleanCtx.clearRect(0, 0, cropW, cropH);
    cleanCtx.drawImage(work, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    cleanTexture.refresh();
    return CLEAN_KEY;
  }

  layout() {
    super.layout();
    const auryi = this.actors?.get('auryi');
    if (!auryi || auryi._snapshot) return;

    if (auryi.live23CleanTextureKey && this.scene.textures.exists(auryi.live23CleanTextureKey)) {
      const image = this.scene.textures.get(auryi.live23CleanTextureKey)?.getSourceImage?.();
      const aspect = image?.height ? image.width / image.height : 0.78;
      const targetH = this.scene.scale.height * AURYI_CONTENT_HEIGHT_FRAC;
      auryi.sprite.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
      auryi.ghost.setOrigin(0.5, 1).setDisplaySize(targetH * aspect, targetH);
    } else {
      // Duo live21 added a second 1.12 multiplier after canonical formation
      // scaling. Cancel it until the clean texture has been installed.
      auryi.sprite.setScale(
        auryi.sprite.scaleX / LEGACY_DUO_SCALE,
        auryi.sprite.scaleY / LEGACY_DUO_SCALE
      );
      auryi.ghost.setScale(
        auryi.ghost.scaleX / LEGACY_DUO_SCALE,
        auryi.ghost.scaleY / LEGACY_DUO_SCALE
      );
    }

    auryi.ring.setSize(auryi.sprite.displayWidth * 0.5, auryi.sprite.displayWidth * 0.18);
    this._layoutAuryiBattleMagic(auryi);
  }

  _auryiAuorbAnchor(actor) {
    return {
      x: actor.sprite.x + actor.sprite.displayWidth * AURYI_ORB_X_FRAC,
      y: actor.sprite.y - actor.sprite.displayHeight * AURYI_ORB_Y_FRAC
    };
  }

  _auryiCrownAnchor(actor) {
    return {
      x: actor.sprite.x,
      y: actor.sprite.y - actor.sprite.displayHeight * AURYI_CROWN_Y_FRAC
    };
  }

  _layoutAuryiBattleMagic(actor) {
    if (!actor?.duoCrown || !actor?.duoAuorb) return;
    const crown = this._auryiCrownAnchor(actor);
    const orb = this._auryiAuorbAnchor(actor);
    actor.duoCrown.setPosition(crown.x, crown.y);
    actor.duoAuorb.setPosition(orb.x, orb.y);
  }
}
