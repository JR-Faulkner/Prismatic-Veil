// PriZim Duo-Hybrid Sequence Driver v0.4
// Renderer bridge for two presentation lanes:
// 1) Sequence Mode: logical frame sequences rendered by a PriZim-owned
//    high-DPI canvas layer. Phaser does not register attack textures.
// 2) Cinematic Mode: full-screen video sequences for future Resonarts/supers.
//
// Neutral timing/presentation authority lives in pv-data JSON manifests. This
// driver is a replaceable browser/Phaser adapter, not canonical game data.

const wait = (scene, ms) => new Promise(resolve => scene.time.delayedCall(Math.max(0, ms || 0), resolve));
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const lerp = (a, b, t) => a + (b - a) * t;

export default class DuoHybridSequenceDriver {
  constructor(scene) {
    this.scene = scene;
    this.manifestCache = new Map();
    this.imageCache = new Map();
    this.sourceCache = new Map();
  }

  async manifest(config) {
    if (!config?.manifest) throw new Error('[PriZim Duo-Hybrid] Missing sequence manifest URL.');
    if (this.manifestCache.has(config.manifest)) return this.manifestCache.get(config.manifest);
    const promise = fetch(`${config.manifest}?pvduo=${encodeURIComponent(config.version || '1')}`, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`[PriZim Duo-Hybrid] Manifest load failed: ${config.manifest} (${response.status})`);
        return response.json();
      });
    this.manifestCache.set(config.manifest, promise);
    return promise;
  }

  async loadImage(asset, version = '1') {
    const key = `${asset}#${version}`;
    if (this.imageCache.has(key)) return this.imageCache.get(key);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = async () => {
        try {
          if (typeof img.decode === 'function') await img.decode();
          if (!img.naturalWidth || !img.naturalHeight) {
            throw new Error(`decoded image has invalid dimensions ${img.naturalWidth}x${img.naturalHeight}`);
          }
          resolve(img);
        } catch (error) {
          reject(new Error(`[PriZim Duo-Hybrid] Image decode failed: ${asset} · ${error?.message || error}`));
        }
      };
      img.onerror = () => reject(new Error(`[PriZim Duo-Hybrid] Image load failed: ${asset}`));
      // Keep the actual media URL plain. Build freshness belongs to modules
      // and manifests, not binary image decoding on mobile browsers.
      img.src = asset;
    });
    this.imageCache.set(key, promise);
    return promise;
  }

  async prepare(config) {
    const manifest = await this.manifest(config);
    if (manifest.mode !== 'sequence') return manifest;
    await this.prepareSequenceSource(manifest, config.version || '1');
    return manifest;
  }

  async prepareSequenceSource(manifest, version = '1') {
    const source = manifest.source || {};
    const cacheKey = `${manifest.id}#${version}`;
    if (this.sourceCache.has(cacheKey)) return this.sourceCache.get(cacheKey);

    const promise = (async () => {
      if (source.type === 'frames') {
        const frames = [];
        for (const frame of manifest.frames || []) {
          if (!frame.asset) throw new Error(`[PriZim Duo-Hybrid] Frame ${frame.index} has no asset.`);
          const image = await this.loadImage(frame.asset, version);
          frames.push({ image, sx: 0, sy: 0, sw: image.naturalWidth, sh: image.naturalHeight });
        }
        return { type: 'frames', frames };
      }

      if (source.type === 'strip') {
        const image = await this.loadImage(source.asset, version);
        const frameWidth = Number(source.frameWidth);
        const frameHeight = Number(source.frameHeight);
        const count = Number(source.count || manifest.frames?.length || 0);
        if (!frameWidth || !frameHeight || !count) {
          throw new Error(`[PriZim Duo-Hybrid] Invalid strip geometry for ${manifest.id}.`);
        }
        if (image.naturalWidth < frameWidth * count || image.naturalHeight < frameHeight) {
          throw new Error(`[PriZim Duo-Hybrid] Strip dimensions do not contain ${count} frames (${image.naturalWidth}x${image.naturalHeight}).`);
        }
        return { type: 'strip', image, frameWidth, frameHeight, count };
      }

      throw new Error(`[PriZim Duo-Hybrid] Unsupported sequence source type: ${source.type || 'missing'}.`);
    })();

    this.sourceCache.set(cacheKey, promise);
    return promise;
  }

  frameSource(source, frame, index) {
    if (source.type === 'frames') {
      const item = source.frames[index];
      if (!item) throw new Error(`[PriZim Duo-Hybrid] Missing prepared frame ${index}.`);
      return item;
    }
    if (source.type === 'strip') {
      if (index < 0 || index >= source.count) throw new Error(`[PriZim Duo-Hybrid] Strip frame ${index} out of range.`);
      return {
        image: source.image,
        sx: index * source.frameWidth,
        sy: 0,
        sw: source.frameWidth,
        sh: source.frameHeight
      };
    }
    throw new Error('[PriZim Duo-Hybrid] Sequence source is not prepared.');
  }

  markersFor(manifest, frameIndex) {
    const markers = [];
    Object.entries(manifest.markers || {}).forEach(([name, frames]) => {
      if ((frames || []).includes(frameIndex)) markers.push(name);
    });
    const povFrames = manifest.povFrames || [];
    return {
      markers,
      povStart: povFrames.length > 0 && frameIndex === povFrames[0],
      povEnd: povFrames.length > 0 && frameIndex > povFrames[povFrames.length - 1]
    };
  }

  createSequenceCanvas() {
    const gameCanvas = this.scene.game.canvas;
    const host = gameCanvas.parentElement || document.body;
    const overlay = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.max(1, Math.round(this.scene.scale.width));
    const h = Math.max(1, Math.round(this.scene.scale.height));
    overlay.width = Math.round(w * dpr);
    overlay.height = Math.round(h * dpr);
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '7';
    overlay.setAttribute('aria-hidden', 'true');
    host.appendChild(overlay);
    const ctx = overlay.getContext('2d');
    if (!ctx) {
      overlay.remove();
      throw new Error('[PriZim Duo-Hybrid] 2D sequence canvas unavailable.');
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    return { overlay, ctx, dpr, w, h };
  }

  drawSequenceFrame(layer, sourceFrame, placement) {
    const { ctx, dpr, w, h } = layer;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const dw = sourceFrame.sw * placement.scale;
    const dh = sourceFrame.sh * placement.scale;
    const originX = Number.isFinite(placement.originX) ? Number(placement.originX) : 0.5;
    const originY = Number.isFinite(placement.originY) ? Number(placement.originY) : 1;
    const dx = placement.x - dw * originX;
    const dy = placement.y - dh * originY;

    ctx.save();
    if (placement.flipX) {
      ctx.translate(placement.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-placement.x, 0);
    }
    ctx.drawImage(
      sourceFrame.image,
      sourceFrame.sx, sourceFrame.sy, sourceFrame.sw, sourceFrame.sh,
      dx, dy, dw, dh
    );
    ctx.restore();
  }

  async playSequence({ config, actor, enemyX, onFrame }) {
    if (!actor?.sprite) throw new Error('[PriZim Duo-Hybrid] Missing actor sprite.');
    const manifest = await this.manifest(config);
    if (manifest.mode !== 'sequence') throw new Error(`[PriZim Duo-Hybrid] ${manifest.id} is not Sequence Mode.`);
    const prepared = await this.prepareSequenceSource(manifest, config.version || '1');
    const frames = manifest.frames || [];
    if (!frames.length) throw new Error(`[PriZim Duo-Hybrid] No playable frames for ${manifest.id}.`);

    const scene = this.scene;
    const sprite = actor.sprite;
    const reference = manifest.reference || {};
    const content = manifest.content || {};
    const homeX = sprite.x;
    const homeY = sprite.y;
    const targetX = Number.isFinite(enemyX) ? enemyX : scene.scale.width * 0.74;
    const contactX = targetX - scene.scale.width * Number(reference.contactXOffsetFrac ?? 0.10);
    const refSpan = Math.max(1, Number(reference.contactX || 1) - Number(reference.homeX || 0));
    const refHomeY = Number(reference.homeY || 0);
    const refHeight = Math.max(1, Number(reference.height || 540));
    const refBaseScale = Number(reference.baseScale || 1);
    const firstSource = this.frameSource(prepared, frames[0], 0);
    const contentHeight = Math.max(1, Number(content.contentHeightPx || firstSource.sh || 1));
    const stateContentHeight = actor.stateSheetConfig?.contentHeightPx || actor.sprite.height || contentHeight;
    const baseScale = (sprite.scaleY * stateContentHeight) / contentHeight;
    const baselinePx = Number(content.baselinePx || firstSource.sh || 1);
    const fallbackOriginY = baselinePx / Math.max(1, firstSource.sh);
    const layer = this.createSequenceCanvas();

    sprite.setVisible(false);
    try {
      for (let i = 0; i < frames.length; i += 1) {
        const frame = frames[i];
        const sourceFrame = this.frameSource(prepared, frame, i);
        const refX = Number(frame.x ?? reference.homeX ?? 0);
        const progress = clamp01((refX - Number(reference.homeX || 0)) / refSpan);
        const yDelta = Number(frame.y ?? refHomeY) - refHomeY;
        const scaleMul = Number(frame.scale ?? refBaseScale) / Math.max(0.0001, refBaseScale);
        const x = lerp(homeX, contactX, progress);
        const y = homeY + (yDelta / refHeight) * scene.scale.height;
        const originX = Number.isFinite(frame.originX)
          ? Number(frame.originX)
          : (Number.isFinite(frame.anchor_x) ? Number(frame.anchor_x) / Math.max(1, sourceFrame.sw) : 0.5);
        const originY = Number.isFinite(frame.originY)
          ? Number(frame.originY)
          : (Number.isFinite(frame.anchor_y) ? Number(frame.anchor_y) / Math.max(1, sourceFrame.sh) : fallbackOriginY);

        this.drawSequenceFrame(layer, sourceFrame, {
          x,
          y,
          scale: baseScale * scaleMul,
          originX,
          originY,
          flipX: !!sprite.flipX
        });

        if (onFrame) onFrame(i, this.markersFor(manifest, i), manifest);
        await wait(scene, Number(frame.duration || 100));
      }
    } finally {
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
      layer.ctx.clearRect(0, 0, layer.overlay.width, layer.overlay.height);
      layer.overlay.remove();
      sprite.setVisible(true);
    }
    return manifest;
  }

  async playCinematic({ config, onCue }) {
    const manifest = await this.manifest(config);
    if (manifest.mode !== 'cinematic') throw new Error(`[PriZim Duo-Hybrid] ${manifest.id} is not Cinematic Mode.`);
    const source = manifest.source || {};
    if (!source.asset) throw new Error(`[PriZim Duo-Hybrid] Cinematic ${manifest.id} has no video asset.`);

    const canvas = this.scene.game.canvas;
    const host = canvas.parentElement || document.body;
    const video = document.createElement('video');
    video.src = source.asset;
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = source.muted !== false;
    video.style.position = 'absolute';
    video.style.inset = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = source.fit || 'cover';
    video.style.zIndex = '50';
    video.style.pointerEvents = 'none';
    host.appendChild(video);

    const cues = [...(manifest.cues || [])].sort((a, b) => Number(a.timeMs) - Number(b.timeMs));
    const fired = new Set();
    const tick = () => {
      const now = video.currentTime * 1000;
      cues.forEach((cue, index) => {
        if (!fired.has(index) && now >= Number(cue.timeMs || 0)) {
          fired.add(index);
          if (onCue) onCue(cue, index, manifest);
        }
      });
    };
    video.addEventListener('timeupdate', tick);

    try {
      await video.play();
      await new Promise((resolve, reject) => {
        video.addEventListener('ended', resolve, { once: true });
        video.addEventListener('error', () => reject(new Error(`[PriZim Duo-Hybrid] Cinematic playback failed: ${source.asset}`)), { once: true });
      });
    } finally {
      video.removeEventListener('timeupdate', tick);
      video.remove();
    }
    return manifest;
  }
}
