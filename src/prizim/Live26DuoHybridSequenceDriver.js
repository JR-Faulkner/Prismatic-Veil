// LIVE28K6 Auryi production-FX adapter.
// Production default is hybrid by design:
// - approved animated PNG crown for Auryi turn-entry manifestation
// - proven Phaser/canvas Auorb + basic/ranged attack FX remain authoritative
// Full PNG attack stack remains available explicitly with ?auryiFx=png for QA.
import Live25DuoHybridSequenceDriver from './Live25DuoHybridSequenceDriver.js?v=live25';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clamp01 = value => clamp(Number(value) || 0, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

const runtimeParams = (() => {
  try { return new URLSearchParams(globalThis.location?.search || ''); }
  catch { return new URLSearchParams(); }
})();
const AURYI_FX_RUNTIME_MODE = runtimeParams.get('auryiFx') === 'png' ? 'png' : 'phaser';

const AURYI_FX = Object.freeze({
  crown: {
    url: new URL('../../assets/fx/auryi/v3/01_crown_manifest_sheet.png', import.meta.url).href,
    cellW: 256, cellH: 256, count: 8
  },
  charge: {
    url: new URL('../../assets/fx/auryi/v3/02_auorb_charge_sheet.png', import.meta.url).href,
    cellW: 256, cellH: 256, count: 8
  },
  projectile: {
    url: new URL('../../assets/fx/auryi/v3/03_auorb_projectile_sheet.png', import.meta.url).href,
    cellW: 256, cellH: 256, count: 8
  },
  impact: {
    url: new URL('../../assets/fx/auryi/v3/04_auorb_impact_sheet.png', import.meta.url).href,
    cellW: 384, cellH: 384, count: 8
  },
  recompose: {
    url: new URL('../../assets/fx/auryi/v3/05_recompose_settle_sheet.png', import.meta.url).href,
    cellW: 256, cellH: 256, count: 6
  }
});

export default class Live26DuoHybridSequenceDriver extends Live25DuoHybridSequenceDriver {
  constructor(scene) {
    super(scene);
    this._live26Images = Object.create(null);
    this._live26ImagesPromise = null;
    this._live26CrownPromise = null;
    this.auryiFxRuntimeMode = AURYI_FX_RUNTIME_MODE;
    globalThis.__PV_AURYI_FX_MODE__ = this.auryiFxRuntimeMode;
    globalThis.__PV_AURYI_CROWN_MODE__ = 'png';
    console.info(`[LIVE28K6] Auryi attack FX: ${this.auryiFxRuntimeMode}; crown: png`);
  }

  _isPhaserFallback() {
    return this.auryiFxRuntimeMode === 'phaser';
  }

  _isAuryiConfig(config) {
    return String(config?.id || '').startsWith('auryi_');
  }

  _isAuryiManifest(manifest) {
    return String(manifest?.id || '').startsWith('auryi_');
  }

  _isAuryiTurnEntry(value) {
    return String(value?.id || value || '').startsWith('auryi_turn_entry');
  }

  _loadPng(name, spec) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error(`[LIVE28K6] ${name} PNG loaded without valid dimensions.`));
          return;
        }
        const expectedW = spec.cellW * spec.count;
        if (image.naturalWidth !== expectedW || image.naturalHeight !== spec.cellH) {
          reject(new Error(
            `[LIVE28K6] ${name} PNG geometry mismatch: got ${image.naturalWidth}x${image.naturalHeight}, expected ${expectedW}x${spec.cellH}.`
          ));
          return;
        }
        this._live26Images[name] = image;
        resolve(image);
      };
      image.onerror = () => reject(new Error(`[LIVE28K6] ${name} PNG failed to load.`));
      image.src = spec.url;
    });
  }

  async _ensureCrownImage() {
    const ready = this._live26Images.crown;
    if (ready?.naturalWidth && ready?.naturalHeight) return ready;
    if (!this._live26CrownPromise) {
      this._live26CrownPromise = this._loadPng('crown', AURYI_FX.crown).catch(error => {
        this._live26CrownPromise = null;
        throw new Error(`[LIVE28K6] Auryi crown PNG failed: ${error?.message || error}`);
      });
    }
    return this._live26CrownPromise;
  }

  async _ensureLive26Images() {
    const ready = Object.keys(AURYI_FX).every(name => {
      const image = this._live26Images[name];
      return image?.naturalWidth && image?.naturalHeight;
    });
    if (ready) return this._live26Images;

    if (!this._live26ImagesPromise) {
      this._live26ImagesPromise = Promise.all(
        Object.entries(AURYI_FX).map(([name, spec]) => {
          const image = this._live26Images[name];
          return image?.naturalWidth ? image : this._loadPng(name, spec);
        })
      ).then(() => this._live26Images).catch(error => {
        this._live26ImagesPromise = null;
        throw new Error(`[LIVE28K6] Auryi production PNG set failed: ${error?.message || error}`);
      });
    }
    return this._live26ImagesPromise;
  }

  async prepare(config) {
    const manifest = await super.prepare(config);
    if (this._isAuryiTurnEntry(config)) {
      await this._ensureCrownImage();
    } else if (this._isAuryiConfig(config) && !this._isPhaserFallback()) {
      await this._ensureLive26Images();
    }
    return manifest;
  }

  async manifest(config) {
    const manifest = await super.manifest(config);
    const id = String(config?.id || '');
    const presentation = manifest?.presentation || {};
    const fx = presentation.actorRangedFx;
    if (!fx) return manifest;

    // Turn-entry is always hybrid: approved PNG crown + inherited Phaser Auorb.
    if (id.startsWith('auryi_turn_entry')) {
      fx.live26Mode = 'entry-hybrid';
      fx.startFrame = 1;
      presentation.camera = { ...(presentation.camera || {}), live26StaticEntry: true };
      return manifest;
    }

    // Normal production attacks remain on the proven Phaser/canvas path.
    if (this._isPhaserFallback()) {
      delete fx.live26Mode;
      return manifest;
    }

    // Full PNG attack presentation remains opt-in QA only.
    if (id.startsWith('auryi_auorb_invocation')) {
      fx.live26Mode = 'attack';
      fx.startFrame = 0;
      fx.orbStartFrame = 0;
    }
    return manifest;
  }

  async playActorRangedSequence(args) {
    if (this._isAuryiTurnEntry(args?.manifest)) {
      await this._ensureCrownImage();
    } else if (this._isAuryiManifest(args?.manifest) && !this._isPhaserFallback()) {
      await this._ensureLive26Images();
    }
    return super.playActorRangedSequence(args);
  }

  cameraPose(presentation, frameIndex, actorX, actorY, targetX, targetY) {
    if (presentation?.camera?.live26StaticEntry === true) {
      return { zoom: 1, scrollX: 0, scrollY: 0 };
    }
    return super.cameraPose(presentation, frameIndex, actorX, actorY, targetX, targetY);
  }

  _drawSheetFrame(ctx, name, frameIndex, x, y, displayW, displayH, alpha = 1) {
    const image = this._live26Images[name];
    const spec = AURYI_FX[name];
    if (!image || !spec) {
      throw new Error(`[LIVE28K6] ${name} PNG requested before readiness.`);
    }
    const index = clamp(Math.round(frameIndex), 0, spec.count - 1);
    const sx = index * spec.cellW;
    ctx.save();
    ctx.globalAlpha = clamp01(alpha);
    ctx.drawImage(
      image,
      sx, 0, spec.cellW, spec.cellH,
      x - displayW * 0.5, y - displayH * 0.5, displayW, displayH
    );
    ctx.restore();
  }

  _drawHybridEntry(layer, frameIndex, actorX, actorY) {
    const { ctx, dpr, w, h } = layer;
    const sprite = this._live24Actor?.sprite;
    const zoom = Number(this.scene.cameras?.main?.zoom || 1);
    const bodyW = Math.max(1, Number(sprite?.displayWidth || w * 0.16)) * zoom;
    const bodyH = Math.max(1, Number(sprite?.displayHeight || h * 0.40)) * zoom;
    const geom = this._screenGeometry(actorX, actorY);

    // Center the approved crown directly above the actor body/head line.
    // Retires LIVE25's +9% body-width procedural crown shift.
    const crownX = actorX;
    const crownY = actorY - bodyH * 1.08;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (frameIndex >= 1) {
      const crownFrame = clamp(frameIndex - 1, 0, 7);
      this._drawSheetFrame(
        ctx, 'crown', crownFrame,
        crownX, crownY,
        Math.max(116, bodyW * 0.80), Math.max(76, bodyW * 0.53)
      );
    }

    // Preserve the proven Phaser/canvas entry Auorb choreography.
    const orb = this._entryOrb(frameIndex, geom);
    if (!orb) return;
    const outerR = geom.idleOrbOuter * orb.scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createRadialGradient(orb.x, orb.y, 1, orb.x, orb.y, outerR);
    rg.addColorStop(0, 'rgba(255,252,222,0.98)');
    rg.addColorStop(0.24, 'rgba(255,224,128,0.92)');
    rg.addColorStop(0.60, 'rgba(198,132,255,0.58)');
    rg.addColorStop(1, 'rgba(198,132,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,154,0.82)';
    ctx.lineWidth = Math.max(1.2, outerR * 0.10);
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, outerR * 0.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const mode = presentation?.actorRangedFx?.live26Mode;

    if (mode === 'entry-hybrid') {
      return this._drawHybridEntry(layer, frameIndex, actorX, actorY);
    }

    // Production attack path remains exactly the inherited Phaser/canvas behavior.
    if (!mode || this._isPhaserFallback()) {
      return super.drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation);
    }

    // Full-PNG attack QA path, unchanged from LIVE27.
    const { ctx, dpr, w, h } = layer;
    const sprite = this._live24Actor?.sprite;
    const zoom = Number(this.scene.cameras?.main?.zoom || 1);
    const bodyW = Math.max(1, Number(sprite?.displayWidth || w * 0.16)) * zoom;
    const bodyH = Math.max(1, Number(sprite?.displayHeight || h * 0.40)) * zoom;

    const handX = actorX + bodyW * 0.41;
    const handY = actorY - bodyH * 0.80;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    if (frameIndex <= 8) {
      const chargeFrame = Math.round((clamp(frameIndex, 0, 8) / 8) * 7);
      this._drawSheetFrame(
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
      this._drawSheetFrame(
        ctx, 'projectile', projectileFrame,
        px, py,
        Math.max(128, bodyW * 0.82), Math.max(86, bodyW * 0.55)
      );
    }

    if (frameIndex === 11 || frameIndex === 12) {
      const impactFrame = frameIndex === 11 ? 3 : 7;
      const impactSize = Math.max(174, h * 0.46);
      this._drawSheetFrame(ctx, 'impact', impactFrame, targetX, targetY, impactSize, impactSize);
    }

    if (frameIndex >= 13) {
      const settleFrame = clamp(frameIndex - 13, 0, 5);
      this._drawSheetFrame(
        ctx, 'recompose', settleFrame,
        handX, handY,
        Math.max(112, bodyW * 0.70), Math.max(75, bodyW * 0.47)
      );
    }

    ctx.restore();
  }
}
