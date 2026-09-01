// LIVE26 Auryi production-FX adapter.
// Replaces the provisional canvas-drawn Auryi magic with the harmonized
// production atlas while preserving live25 Kineza camera safety and all
// existing sequence timing/ownership rules.
import Live25DuoHybridSequenceDriver from './Live25DuoHybridSequenceDriver.js?v=live25';
import AURYI_FX_ATLAS, { AURYI_FX_CELL_W, AURYI_FX_ROWS } from './live26/AuryiFxAtlasData.js?v=live26d';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clamp01 = value => clamp(Number(value) || 0, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

export default class Live26DuoHybridSequenceDriver extends Live25DuoHybridSequenceDriver {
  constructor(scene) {
    super(scene);
    this._live26AtlasImage = null;
    this._live26AtlasPromise = null;
  }

  _isAuryiConfig(config) {
    return String(config?.id || '').startsWith('auryi_');
  }

  _isAuryiManifest(manifest) {
    return String(manifest?.id || '').startsWith('auryi_');
  }

  async _ensureLive26Atlas() {
    if (this._live26AtlasImage?.naturalWidth && this._live26AtlasImage?.naturalHeight) {
      return this._live26AtlasImage;
    }
    if (!this._live26AtlasPromise) {
      this._live26AtlasPromise = this.loadImage(AURYI_FX_ATLAS, 'live26d-atlas-1')
        .then(image => {
          if (!image?.naturalWidth || !image?.naturalHeight) {
            throw new Error('[LIVE26D] Auryi production FX atlas decoded without valid dimensions.');
          }
          this._live26AtlasImage = image;
          return image;
        })
        .catch(error => {
          this._live26AtlasPromise = null;
          throw new Error(`[LIVE26D] Auryi production FX atlas failed to load: ${error?.message || error}`);
        });
    }
    return this._live26AtlasPromise;
  }

  async prepare(config) {
    const manifest = await super.prepare(config);
    if (this._isAuryiConfig(config)) await this._ensureLive26Atlas();
    return manifest;
  }

  async manifest(config) {
    const manifest = await super.manifest(config);
    const id = String(config?.id || '');
    const presentation = manifest?.presentation || {};
    const fx = presentation.actorRangedFx;
    if (!fx) return manifest;

    if (id.startsWith('auryi_turn_entry')) {
      fx.live26Mode = 'entry';
      fx.startFrame = 1;
      presentation.camera = { ...(presentation.camera || {}), live26StaticEntry: true };
    } else if (id.startsWith('auryi_auorb_invocation')) {
      fx.live26Mode = 'attack';
      fx.startFrame = 0;
      fx.orbStartFrame = 0;
    }
    return manifest;
  }

  // Critical mobile-runtime gate: the production atlas must be decoded before
  // any Auryi ranged sequence starts. Older live26 silently fell back to the
  // procedural beam when prewarm had not completed; that made a broken atlas
  // path look like a successful deployment on Safari.
  async playActorRangedSequence(args) {
    if (this._isAuryiManifest(args?.manifest)) await this._ensureLive26Atlas();
    return super.playActorRangedSequence(args);
  }

  cameraPose(presentation, frameIndex, actorX, actorY, targetX, targetY) {
    if (presentation?.camera?.live26StaticEntry === true) {
      return { zoom: 1, scrollX: 0, scrollY: 0 };
    }
    return super.cameraPose(presentation, frameIndex, actorX, actorY, targetX, targetY);
  }

  _drawAtlasFrame(ctx, rowName, frameIndex, x, y, displayW, displayH, alpha = 1) {
    const image = this._live26AtlasImage;
    const row = AURYI_FX_ROWS[rowName];
    if (!image || !row) return false;
    const index = clamp(Math.round(frameIndex), 0, row.count - 1);
    const sx = index * AURYI_FX_CELL_W;
    const sy = row.y;
    ctx.save();
    ctx.globalAlpha = clamp01(alpha);
    ctx.drawImage(
      image,
      sx, sy, AURYI_FX_CELL_W, row.h,
      x - displayW * 0.5, y - displayH * 0.5, displayW, displayH
    );
    ctx.restore();
    return true;
  }

  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const mode = presentation?.actorRangedFx?.live26Mode;
    if (!mode) return super.drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation);
    if (!this._live26AtlasImage) {
      throw new Error('[LIVE26D] Auryi production FX requested before atlas readiness.');
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
        const crownFrame = clamp(frameIndex - 1, 0, 7);
        this._drawAtlasFrame(
          ctx, 'crown', crownFrame,
          crownX, crownY,
          Math.max(124, bodyW * 0.86), Math.max(82, bodyW * 0.57)
        );
      }
      ctx.restore();
      return;
    }

    // Basic Auorb production choreography:
    // Charge -> projectile travel -> body impact -> recompose at the same hand anchor.
    if (frameIndex <= 8) {
      const chargeFrame = Math.round((clamp(frameIndex, 0, 8) / 8) * 7);
      this._drawAtlasFrame(
        ctx, 'charge', chargeFrame,
        handX, handY,
        Math.max(116, bodyW * 0.72), Math.max(78, bodyW * 0.48)
      );
    }

    if (frameIndex >= 9 && frameIndex <= 11) {
      const t = clamp01((frameIndex - 9) / 2);
      const projectileFrame = Math.round(t * 7);
      const px = lerp(handX, targetX, t);
      const py = lerp(handY, targetY, t);
      this._drawAtlasFrame(
        ctx, 'projectile', projectileFrame,
        px, py,
        Math.max(128, bodyW * 0.82), Math.max(86, bodyW * 0.55)
      );
    }

    if (frameIndex === 11 || frameIndex === 12) {
      const impactFrame = frameIndex === 11 ? 3 : 7;
      const impactSize = Math.max(174, h * 0.46);
      this._drawAtlasFrame(ctx, 'impact', impactFrame, targetX, targetY, impactSize, impactSize);
    }

    if (frameIndex >= 13) {
      const settleFrame = clamp(frameIndex - 13, 0, 5);
      this._drawAtlasFrame(
        ctx, 'recompose', settleFrame,
        handX, handY,
        Math.max(112, bodyW * 0.70), Math.max(75, bodyW * 0.47)
      );
    }

    ctx.restore();
  }
}
