// PriZim Duo-Hybrid Sequence Driver v0.1
// Renderer bridge for two presentation lanes:
// 1) Sequence Mode: logical frame sequences from individual images or packed strips.
// 2) Cinematic Mode: full-screen video sequences for future Resonarts/supers.
//
// Neutral timing/presentation authority lives in pv-data JSON manifests. This
// driver is a replaceable Phaser/browser adapter, not canonical game data.

const wait = (scene, ms) => new Promise(resolve => scene.time.delayedCall(Math.max(0, ms || 0), resolve));
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

export default class DuoHybridSequenceDriver {
  constructor(scene) {
    this.scene = scene;
    this.manifestCache = new Map();
    this.imageCache = new Map();
    this.textureCache = new Map();
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
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`[PriZim Duo-Hybrid] Image load failed: ${asset}`));
      img.src = `${asset}${asset.includes('?') ? '&' : '?'}pvduo=${encodeURIComponent(version)}`;
    });
    this.imageCache.set(key, promise);
    return promise;
  }

  async prepare(config) {
    const manifest = await this.manifest(config);
    if (manifest.mode !== 'sequence') return manifest;
    await this.prepareSequenceTextures(manifest, config.version || '1');
    return manifest;
  }

  async prepareSequenceTextures(manifest, version = '1') {
    const source = manifest.source || {};
    const cacheKey = `${manifest.id}#${version}`;
    if (this.textureCache.has(cacheKey)) return this.textureCache.get(cacheKey);

    const promise = (async () => {
      if (source.type === 'frames') {
        const keys = [];
        for (const frame of manifest.frames || []) {
          if (!frame.asset) throw new Error(`[PriZim Duo-Hybrid] Frame ${frame.index} has no asset.`);
          const textureKey = `pvduo_${manifest.id}_${String(frame.index).padStart(2, '0')}_${version}`;
          if (!this.scene.textures.exists(textureKey)) {
            const img = await this.loadImage(frame.asset, version);
            this.scene.textures.addImage(textureKey, img);
          }
          keys.push(textureKey);
        }
        return keys;
      }

      if (source.type === 'strip') {
        const img = await this.loadImage(source.asset, version);
        const frameWidth = Number(source.frameWidth);
        const frameHeight = Number(source.frameHeight);
        const count = Number(source.count || manifest.frames?.length || 0);
        if (!frameWidth || !frameHeight || !count) {
          throw new Error(`[PriZim Duo-Hybrid] Invalid strip geometry for ${manifest.id}.`);
        }
        if (img.naturalWidth < frameWidth * count || img.naturalHeight < frameHeight) {
          throw new Error(`[PriZim Duo-Hybrid] Strip dimensions do not contain ${count} frames (${img.naturalWidth}x${img.naturalHeight}).`);
        }
        const keys = [];
        for (let i = 0; i < count; i += 1) {
          const textureKey = `pvduo_${manifest.id}_${String(i).padStart(2, '0')}_${version}`;
          if (!this.scene.textures.exists(textureKey)) {
            const canvas = document.createElement('canvas');
            canvas.width = frameWidth;
            canvas.height = frameHeight;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, frameWidth, frameHeight);
            ctx.drawImage(img, i * frameWidth, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
            this.scene.textures.addCanvas(textureKey, canvas);
          }
          keys.push(textureKey);
        }
        return keys;
      }

      throw new Error(`[PriZim Duo-Hybrid] Unsupported sequence source type: ${source.type || 'missing'}.`);
    })();

    this.textureCache.set(cacheKey, promise);
    return promise;
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

  async playSequence({ config, actor, enemyX, onFrame }) {
    if (!actor?.sprite) throw new Error('[PriZim Duo-Hybrid] Missing actor sprite.');
    const manifest = await this.manifest(config);
    if (manifest.mode !== 'sequence') throw new Error(`[PriZim Duo-Hybrid] ${manifest.id} is not Sequence Mode.`);
    const textureKeys = await this.prepareSequenceTextures(manifest, config.version || '1');
    const frames = manifest.frames || [];
    if (!frames.length || textureKeys.length < frames.length) throw new Error(`[PriZim Duo-Hybrid] No playable frames for ${manifest.id}.`);

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
    const contentHeight = Math.max(1, Number(content.contentHeightPx || manifest.source?.frameHeight || 1));
    const stateContentHeight = actor.stateSheetConfig?.contentHeightPx || actor.sprite.height || contentHeight;
    const baseScale = (sprite.scaleY * stateContentHeight) / contentHeight;
    const originY = Number(content.baselinePx || manifest.source?.frameHeight || 1) / Math.max(1, Number(manifest.source?.frameHeight || sprite.height || 1));

    const display = scene.add.image(homeX, homeY, textureKeys[0])
      .setOrigin(0.5, originY)
      .setFlipX(sprite.flipX)
      .setDepth(sprite.depth)
      .setVisible(false);
    scene.worldAdd(display);

    sprite.setVisible(false);
    try {
      display.setVisible(true).setAlpha(1);
      for (let i = 0; i < frames.length; i += 1) {
        const frame = frames[i];
        const refX = Number(frame.x ?? reference.homeX ?? 0);
        const progress = clamp01((refX - Number(reference.homeX || 0)) / refSpan);
        const yDelta = Number(frame.y ?? refHomeY) - refHomeY;
        const scaleMul = Number(frame.scale ?? refBaseScale) / Math.max(0.0001, refBaseScale);

        display.setTexture(textureKeys[i]);
        display.setPosition(
          Phaser.Math.Linear(homeX, contactX, progress),
          homeY + (yDelta / refHeight) * scene.scale.height
        );
        display.setScale(baseScale * scaleMul);

        if (onFrame) onFrame(i, this.markersFor(manifest, i), manifest);
        await wait(scene, Number(frame.duration || 100));
      }
    } finally {
      display.destroy();
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
