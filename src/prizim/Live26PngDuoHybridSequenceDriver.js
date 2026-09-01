// LIVE26 PNG-only Auryi production-FX adapter.
// Hard platform rule: battle-critical attack sheets use normal repo-served PNG.
// No WebP, no inline/base64 image payload, no img.decode() readiness dependency.
import Live25DuoHybridSequenceDriver from './Live25DuoHybridSequenceDriver.js?v=live25';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clamp01 = value => clamp(Number(value) || 0, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

const PNG_SHEETS = Object.freeze({
  crown: Object.freeze({ asset: './assets/fx/auryi/v3/01_crown_manifest_sheet.png', frameW: 256, frameH: 256, count: 8 }),
  charge: Object.freeze({ asset: './assets/fx/auryi/v3/02_auorb_charge_sheet.png', frameW: 256, frameH: 256, count: 8 }),
  projectile: Object.freeze({ asset: './assets/fx/auryi/v3/03_auorb_projectile_sheet.png', frameW: 256, frameH: 256, count: 8 }),
  impact: Object.freeze({ asset: './assets/fx/auryi/v3/04_auorb_impact_sheet.png', frameW: 384, frameH: 384, count: 8 }),
  recompose: Object.freeze({ asset: './assets/fx/auryi/v3/05_recompose_settle_sheet.png', frameW: 256, frameH: 256, count: 6 })
});

export default class Live26PngDuoHybridSequenceDriver extends Live25DuoHybridSequenceDriver {
  constructor(scene) {
    super(scene);
    this._auryiPngImages = new Map();
    this._auryiPngPromise = null;
  }

  _isAuryiConfig(config) {
    return String(config?.id || '').startsWith('auryi_');
  }

  _isAuryiManifest(manifest) {
    return String(manifest?.id || '').startsWith('auryi_');
  }

  _loadPng(asset) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error(`[LIVE26 PNG] Invalid PNG dimensions: ${asset}`));
          return;
        }
        resolve(image);
      };
      image.onerror = () => reject(new Error(`[LIVE26 PNG] PNG load failed: ${asset}`));
      image.src = `${asset}?v=live26png1`;
    });
  }

  async _ensureAuryiPngSheets() {
    if (this._auryiPngImages.size === Object.keys(PNG_SHEETS).length) return this._auryiPngImages;
    if (!this._auryiPngPromise) {
      this._auryiPngPromise = Promise.all(Object.entries(PNG_SHEETS).map(async ([name, cfg]) => {
        const image = await this._loadPng(cfg.asset);
        const expectedW = cfg.frameW * cfg.count;
        if (image.naturalWidth < expectedW || image.naturalHeight < cfg.frameH) {
          throw new Error(`[LIVE26 PNG] ${name} geometry mismatch: ${image.naturalWidth}x${image.naturalHeight}, expected at least ${expectedW}x${cfg.frameH}`);
        }
        this._auryiPngImages.set(name, image);
      })).then(() => this._auryiPngImages).catch(error => {
        this._auryiPngPromise = null;
        this._auryiPngImages.clear();
        throw error;
      });
    }
    return this._auryiPngPromise;
  }

  async prepare(config) {
    const manifest = await super.prepare(config);
    if (this._isAuryiConfig(config)) await this._ensureAuryiPngSheets();
    return manifest;
  }

  async manifest(config) {
    const manifest = await super.manifest(config);
    const id = String(config?.id || '');
    const presentation = manifest?.presentation || {};
    const fx = presentation.actorRangedFx;
    if (!fx) return manifest;

    if (id.startsWith('auryi_turn_entry')) {
      fx.live26PngMode = 'entry';
      fx.startFrame = 1;
      presentation.camera = { ...(presentation.camera || {}), live26StaticEntry: true };
    } else if (id.startsWith('auryi_auorb_invocation')) {
      fx.live26PngMode = 'attack';
      fx.startFrame = 0;
      fx.orbStartFrame = 0;
    }
    return manifest;
  }

  async playActorRangedSequence(args) {
    if (this._isAuryiManifest(args?.manifest)) await this._ensureAuryiPngSheets();
    return super.playActorRangedSequence(args);
  }

  cameraPose(presentation, frameIndex, actorX, actorY, targetX, targetY) {
    if (presentation?.camera?.live26StaticEntry === true) return { zoom: 1, scrollX: 0, scrollY: 0 };
    return super.cameraPose(presentation, frameIndex, actorX, actorY, targetX, targetY);
  }

  _drawPngFrame(ctx, sheetName, frameIndex, x, y, displayW, displayH, alpha = 1) {
    const cfg = PNG_SHEETS[sheetName];
    const image = this._auryiPngImages.get(sheetName);
    if (!cfg || !image) throw new Error(`[LIVE26 PNG] ${sheetName} sheet requested before readiness.`);
    const index = clamp(Math.round(frameIndex), 0, cfg.count - 1);
    ctx.save();
    ctx.globalAlpha = clamp01(alpha);
    ctx.drawImage(
      image,
      index * cfg.frameW, 0, cfg.frameW, cfg.frameH,
      x - displayW * 0.5, y - displayH * 0.5, displayW, displayH
    );
    ctx.restore();
  }

  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const mode = presentation?.actorRangedFx?.live26PngMode;
    if (!mode) return super.drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation);
    if (this._auryiPngImages.size !== Object.keys(PNG_SHEETS).length) {
      throw new Error('[LIVE26 PNG] Auryi production PNG sheets requested before readiness.');
    }

    const { ctx, dpr, w, h } = layer;
    const sprite = this._live24Actor?.sprite;
    const zoom = Number(this.scene.cameras?.main?.zoom || 1);
    const bodyW = Math.max(1, Number(sprite?.displayWidth || w * 0.16)) * zoom;
    const bodyH = Math.max(1, Number(sprite?.displayHeight || h * 0.40)) * zoom;
    const handX = actorX + bodyW * 0.41;
    const handY = actorY - bodyH * 0.80;
    const crownX = actorX + bodyW * 0.09;
    const crownY = actorY - bodyH * 1.08;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    if (mode === 'entry') {
      if (frameIndex >= 1) {
        this._drawPngFrame(ctx, 'crown', clamp(frameIndex - 1, 0, 7), crownX, crownY,
          Math.max(124, bodyW * 0.86), Math.max(82, bodyW * 0.57));
      }
      ctx.restore();
      return;
    }

    if (frameIndex <= 8) {
      const chargeFrame = Math.round((clamp(frameIndex, 0, 8) / 8) * 7);
      this._drawPngFrame(ctx, 'charge', chargeFrame, handX, handY,
        Math.max(116, bodyW * 0.72), Math.max(78, bodyW * 0.48));
    }

    if (frameIndex >= 9 && frameIndex <= 11) {
      const t = clamp01((frameIndex - 9) / 2);
      const projectileFrame = Math.round(t * 7);
      this._drawPngFrame(ctx, 'projectile', projectileFrame,
        lerp(handX, targetX, t), lerp(handY, targetY, t),
        Math.max(128, bodyW * 0.82), Math.max(86, bodyW * 0.55));
    }

    if (frameIndex === 11 || frameIndex === 12) {
      const impactSize = Math.max(174, h * 0.46);
      this._drawPngFrame(ctx, 'impact', frameIndex === 11 ? 3 : 7,
        targetX, targetY, impactSize, impactSize);
    }

    if (frameIndex >= 13) {
      this._drawPngFrame(ctx, 'recompose', clamp(frameIndex - 13, 0, 5), handX, handY,
        Math.max(112, bodyW * 0.70), Math.max(75, bodyW * 0.47));
    }

    ctx.restore();
  }
}
