// PriZim Duo-Hybrid Sequence Driver v0.8
// Renderer bridge for two presentation lanes:
// 1) Sequence Mode: logical frame sequences rendered by a PriZim-owned
//    high-DPI canvas layer. Phaser does not register attack textures.
// 2) Cinematic Mode: full-screen video sequences for future Resonarts/supers.
//
// Neutral timing/presentation authority lives in pv-data JSON manifests. This
// driver is a replaceable browser/Phaser adapter, not canonical game data.

const wait = (scene, ms) => new Promise(resolve => scene.time.delayedCall(Math.max(0, ms || 0), resolve));
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

const trackValue = (track, frameIndex, key, fallback) => {
  if (!Array.isArray(track) || !track.length) return fallback;
  const first = track[0];
  if (frameIndex <= Number(first.frame || 0)) return Number(first[key] ?? fallback);
  for (let i = 1; i < track.length; i += 1) {
    const left = track[i - 1];
    const right = track[i];
    const lf = Number(left.frame || 0);
    const rf = Number(right.frame || lf);
    if (frameIndex <= rf) {
      const span = Math.max(1, rf - lf);
      const t = clamp01((frameIndex - lf) / span);
      return lerp(Number(left[key] ?? fallback), Number(right[key] ?? fallback), t);
    }
  }
  return Number(track[track.length - 1][key] ?? fallback);
};

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
      img.src = asset;
    });
    this.imageCache.set(key, promise);
    return promise;
  }

  async prepare(config) {
    const manifest = await this.manifest(config);
    if (manifest.mode !== 'sequence') return manifest;
    if (manifest.presentation?.actorRangedFx?.enabled === true) return manifest;
    await this.prepareSequenceSource(manifest, config.version || '1');
    return manifest;
  }

  whiteKeyImage(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('[PriZim Duo-Hybrid] White-key canvas unavailable.');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const dr = 255 - px[i], dg = 255 - px[i + 1], db = 255 - px[i + 2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      const sat = max - min;
      const base = clamp01((dist - 10) / 42);
      const glow = clamp01((sat - 14) / 70) * clamp01((max - 145) / 95) * 0.86;
      px[i + 3] = Math.round(255 * Math.max(base, glow));
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
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
          let image = await this.loadImage(frame.asset, version);
          if (source.whiteKey === true) image = this.whiteKeyImage(image);
          const iw = image.naturalWidth || image.width;
          const ih = image.naturalHeight || image.height;
          frames.push({ image, sx: 0, sy: 0, sw: iw, sh: ih });
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
    overlay.style.transformOrigin = '50% 50%';
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

    if (placement.flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(218,255,228,${clamp01(placement.flashAlpha)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  sequenceUiState() {
    const scene = this.scene;
    // uiLayer is the single UI authority in PartyBattleScene, so fading it
    // evacuates the complete battle HUD together instead of chasing individual
    // cards/buttons and accidentally leaving the Menu control behind.
    const targets = [scene.uiLayer, scene._targetCursor].filter(Boolean);
    return targets.map(target => ({ target, alpha: Number.isFinite(target.alpha) ? target.alpha : 1 }));
  }

  fadeUi(state, alpha, duration) {
    state.forEach(({ target }) => {
      this.scene.tweens.killTweensOf(target);
      if (duration > 0) {
        this.scene.tweens.add({ targets: target, alpha, duration, ease: 'Sine.easeOut' });
      } else {
        target.setAlpha(alpha);
      }
    });
  }

  restoreUi(state, duration = 0) {
    state.forEach(({ target, alpha }) => {
      this.scene.tweens.killTweensOf(target);
      if (duration > 0) {
        this.scene.tweens.add({ targets: target, alpha, duration, ease: 'Sine.easeIn' });
      } else {
        target.setAlpha(alpha);
      }
    });
  }

  cameraPose(presentation, frameIndex, actorX, actorY, targetX, targetY) {
    const scene = this.scene;
    const cameraCfg = presentation?.camera || {};
    const track = cameraCfg.track || [];
    const zoom = Math.max(1, trackValue(track, frameIndex, 'zoom', 1));
    const targetMix = clamp01(trackValue(track, frameIndex, 'targetMix', 0));
    const w = scene.scale.width;
    const h = scene.scale.height;
    const safeTargetY = Number.isFinite(targetY) ? targetY : actorY;

    // Follow Kineza first. As he approaches contact, blend toward the Wraith
    // so the shot naturally becomes a two-shot/contact composition instead of
    // simply zooming the static battlefield toward the right edge.
    const focusX = lerp(actorX, targetX, targetMix);
    const focusY = lerp(actorY, safeTargetY, targetMix) + h * Number(cameraCfg.focusYOffsetFrac || 0);
    const viewW = w / zoom;
    const viewH = h / zoom;
    const scrollX = clamp(focusX - viewW * 0.5, 0, Math.max(0, w - viewW));
    const scrollY = clamp(focusY - viewH * 0.5, 0, Math.max(0, h - viewH));
    return { zoom, scrollX, scrollY };
  }

  applyCameraPose(pose) {
    const camera = this.scene.cameras.main;
    camera.setZoom(pose.zoom);
    camera.setScroll(pose.scrollX, pose.scrollY);
  }

  impactKick(layer, impact) {
    const ms = Number(impact?.shakeMs || 0);
    const intensity = Number(impact?.shakeIntensity || 0);
    if (ms > 0 && intensity > 0) this.scene.cameras.main.shake(ms, intensity, true);
    if (ms > 0 && typeof layer.overlay.animate === 'function') {
      layer.overlay.animate([
        { transform: 'translate3d(0,0,0)' },
        { transform: 'translate3d(-7px,3px,0)' },
        { transform: 'translate3d(8px,-4px,0)' },
        { transform: 'translate3d(-4px,2px,0)' },
        { transform: 'translate3d(0,0,0)' }
      ], { duration: ms, easing: 'steps(4, end)' });
    }
  }

  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const { ctx, dpr, w, h } = layer;
    const fx = presentation?.actorRangedFx || {};
    const gold = fx.gold || 'rgba(255,216,112,0.95)';
    const lavender = fx.lavender || 'rgba(198,132,255,0.90)';
    const crownRadius = Number(fx.crownRadius || 34);
    const orbRadius = Number(fx.orbRadius || 18);
    const beamWidth = Number(fx.beamWidth || 11);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const charge = clamp01(frameIndex / 8);
    const release = clamp01((frameIndex - 8) / 3);
    const recover = clamp01((frameIndex - 12) / 5);
    const crownY = actorY - 92;
    const handX = actorX + 34;
    const handY = actorY - 48;

    // Crown/halo: present through the build and brightest at impact.
    const crownAlpha = clamp01(0.22 + charge * 0.68 - recover * 0.55);
    ctx.strokeStyle = gold.replace(/0\.95\)/, `${crownAlpha})`);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(actorX, crownY, crownRadius * (1 + charge * 0.18), crownRadius * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = lavender.replace(/0\.90\)/, `${crownAlpha * 0.75})`);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(actorX, crownY, crownRadius * 1.18, crownRadius * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Auorb orbits Auryi during the build, then becomes the ranged projectile.
    let orbX = handX;
    let orbY = handY;
    if (frameIndex < 9) {
      const theta = -1.2 + frameIndex * 0.78;
      const orbitR = 36 + charge * 14;
      orbX = actorX + Math.cos(theta) * orbitR + 8;
      orbY = actorY - 76 + Math.sin(theta) * orbitR * 0.48;
    } else if (frameIndex <= 11) {
      const t = clamp01((frameIndex - 9) / 2);
      orbX = lerp(handX, targetX, t);
      orbY = lerp(handY, targetY - 28, t);
    } else {
      const t = clamp01((frameIndex - 12) / 3);
      orbX = lerp(targetX, handX, t);
      orbY = lerp(targetY - 28, handY, t);
    }

    const pulse = 1 + Math.sin(frameIndex * 1.7) * 0.12;
    const rg = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, orbRadius * 2.6 * pulse);
    rg.addColorStop(0, 'rgba(255,250,210,0.98)');
    rg.addColorStop(0.32, gold);
    rg.addColorStop(0.68, lavender);
    rg.addColorStop(1, 'rgba(198,132,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius * 2.6 * pulse, 0, Math.PI * 2);
    ctx.fill();

    if (frameIndex >= 9 && frameIndex <= 12) {
      const beamEndX = frameIndex < 11 ? orbX : targetX;
      const beamEndY = frameIndex < 11 ? orbY : targetY - 22;
      const grad = ctx.createLinearGradient(handX, handY, beamEndX, beamEndY);
      grad.addColorStop(0, 'rgba(255,216,112,0.12)');
      grad.addColorStop(0.35, 'rgba(255,222,128,0.86)');
      grad.addColorStop(0.75, 'rgba(198,132,255,0.88)');
      grad.addColorStop(1, 'rgba(255,245,190,0.95)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = beamWidth * (0.7 + release * 0.55);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(beamEndX, beamEndY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,235,0.88)';
      ctx.lineWidth = Math.max(2, beamWidth * 0.22);
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(beamEndX, beamEndY);
      ctx.stroke();
    }

    if (frameIndex === 11 || frameIndex === 12) {
      const impactR = frameIndex === 11 ? 54 : 34;
      ctx.strokeStyle = gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(targetX, targetY - 22, impactR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = lavender;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(targetX, targetY - 22, impactR * 1.32, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  async playActorRangedSequence({ manifest, actor, enemyX, enemyY, onFrame }) {
    const frames = manifest.frames || [];
    if (!frames.length) throw new Error(`[PriZim Duo-Hybrid] No playable frames for ${manifest.id}.`);

    const scene = this.scene;
    const sprite = actor.sprite;
    const presentation = manifest.presentation || {};
    const uiCfg = presentation.ui || {};
    const impactCfg = presentation.impact || {};
    const homeX = sprite.x;
    const homeY = sprite.y;
    const targetX = Number.isFinite(enemyX) ? enemyX : scene.scale.width * 0.74;
    const targetY = Number.isFinite(enemyY) ? enemyY : homeY;
    const baseScaleX = sprite.scaleX;
    const baseScaleY = sprite.scaleY;
    const layer = this.createSequenceCanvas();
    const uiState = this.sequenceUiState();
    const camera = scene.cameras.main;
    const cameraState = { zoom: camera.zoom, scrollX: camera.scrollX, scrollY: camera.scrollY };

    scene.audio?.beginCinematicAttack?.();
    sprite.setVisible(true);
    try {
      for (let i = 0; i < frames.length; i += 1) {
        const frame = frames[i];
        if (i === Number(uiCfg.hideFrame ?? -1)) {
          this.fadeUi(uiState, Number(uiCfg.hiddenAlpha ?? 0), Number(uiCfg.fadeOutMs || 0));
          scene.formation?.setPovFocus?.(actor.hero?.id, true);
        }
        if (i === Number(uiCfg.restoreFrame ?? -1)) {
          this.restoreUi(uiState, Number(uiCfg.fadeInMs || 0));
          scene.formation?.setPovFocus?.(actor.hero?.id, false);
        }

        const pose = this.cameraPose(presentation, i, homeX, homeY, targetX, targetY);
        this.applyCameraPose(pose);
        const actorBoost = Math.max(0.1, trackValue(presentation.actorScaleTrack || [], i, 'scale', 1));
        sprite.setScale(baseScaleX * actorBoost, baseScaleY * actorBoost);

        const screenActorX = (homeX - pose.scrollX) * pose.zoom;
        const screenActorY = (homeY - pose.scrollY) * pose.zoom;
        const screenTargetX = (targetX - pose.scrollX) * pose.zoom;
        const screenTargetY = (targetY - pose.scrollY) * pose.zoom;
        const isImpact = i === Number(impactCfg.frame ?? -1);

        this.drawActorRangedFx(layer, i, screenActorX, screenActorY, screenTargetX, screenTargetY, presentation);
        if (isImpact) this.impactKick(layer, impactCfg);
        if (onFrame) onFrame(i, this.markersFor(manifest, i), manifest);
        if (isImpact && Number(impactCfg.hitStopMs || 0) > 0) await wait(scene, Number(impactCfg.hitStopMs));
        await wait(scene, Number(frame.duration || 100));
      }
    } finally {
      this.restoreUi(uiState, 0);
      scene.formation?.setPovFocus?.(actor.hero?.id, false);
      sprite.setScale(baseScaleX, baseScaleY);
      camera.setZoom(cameraState.zoom);
      camera.setScroll(cameraState.scrollX, cameraState.scrollY);
      scene.audio?.endCinematicAttack?.();
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
      layer.ctx.clearRect(0, 0, layer.overlay.width, layer.overlay.height);
      layer.overlay.remove();
      sprite.setVisible(true);
    }
    return manifest;
  }

  async playSequence({ config, actor, enemyX, enemyY, onFrame }) {
    if (!actor?.sprite) throw new Error('[PriZim Duo-Hybrid] Missing actor sprite.');
    const manifest = await this.manifest(config);
    if (manifest.mode !== 'sequence') throw new Error(`[PriZim Duo-Hybrid] ${manifest.id} is not Sequence Mode.`);
    if (manifest.presentation?.actorRangedFx?.enabled === true) {
      return this.playActorRangedSequence({ manifest, actor, enemyX, enemyY, onFrame });
    }
    const prepared = await this.prepareSequenceSource(manifest, config.version || '1');
    const frames = manifest.frames || [];
    if (!frames.length) throw new Error(`[PriZim Duo-Hybrid] No playable frames for ${manifest.id}.`);

    const scene = this.scene;
    const sprite = actor.sprite;
    const reference = manifest.reference || {};
    const content = manifest.content || {};
    const presentation = manifest.presentation || {};
    const uiCfg = presentation.ui || {};
    const impactCfg = presentation.impact || {};
    const homeX = sprite.x;
    const homeY = sprite.y;
    const targetX = Number.isFinite(enemyX) ? enemyX : scene.scale.width * 0.74;
    const targetY = Number.isFinite(enemyY) ? enemyY : homeY;
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
    const uiState = this.sequenceUiState();
    const camera = scene.cameras.main;
    const cameraState = { zoom: camera.zoom, scrollX: camera.scrollX, scrollY: camera.scrollY };
    let uiRestored = false;

    scene.audio?.beginCinematicAttack?.();
    sprite.setVisible(false);
    try {
      for (let i = 0; i < frames.length; i += 1) {
        const frame = frames[i];
        const sourceFrame = this.frameSource(prepared, frame, i);

        if (i === Number(uiCfg.hideFrame ?? -1)) {
          this.fadeUi(uiState, Number(uiCfg.hiddenAlpha ?? 0), Number(uiCfg.fadeOutMs || 0));
          scene.formation?.setPovFocus?.(actor.hero?.id, true);
        }
        if (i === Number(uiCfg.restoreFrame ?? -1)) {
          this.restoreUi(uiState, Number(uiCfg.fadeInMs || 0));
          scene.formation?.setPovFocus?.(actor.hero?.id, false);
          uiRestored = true;
        }

        const refX = Number(frame.x ?? reference.homeX ?? 0);
        const progress = clamp01((refX - Number(reference.homeX || 0)) / refSpan);
        const yDelta = Number(frame.y ?? refHomeY) - refHomeY;
        const scaleMul = Number(frame.scale ?? refBaseScale) / Math.max(0.0001, refBaseScale);
        const worldX = lerp(homeX, contactX, progress);
        const worldY = homeY + (yDelta / refHeight) * scene.scale.height;
        const originX = Number.isFinite(frame.originX)
          ? Number(frame.originX)
          : (Number.isFinite(frame.anchor_x) ? Number(frame.anchor_x) / Math.max(1, sourceFrame.sw) : 0.5);
        const originY = Number.isFinite(frame.originY)
          ? Number(frame.originY)
          : (Number.isFinite(frame.anchor_y) ? Number(frame.anchor_y) / Math.max(1, sourceFrame.sh) : fallbackOriginY);
        const pose = this.cameraPose(presentation, i, worldX, worldY, targetX, targetY);
        const actorBoost = Math.max(0.1, trackValue(presentation.actorScaleTrack || [], i, 'scale', 1));
        this.applyCameraPose(pose);

        const screenX = (worldX - pose.scrollX) * pose.zoom;
        const screenY = (worldY - pose.scrollY) * pose.zoom;
        const isImpact = i === Number(impactCfg.frame ?? -1);

        this.drawSequenceFrame(layer, sourceFrame, {
          x: screenX,
          y: screenY,
          scale: baseScale * scaleMul * actorBoost * pose.zoom,
          originX,
          originY,
          flipX: !!sprite.flipX,
          flashAlpha: isImpact ? Number(impactCfg.flashAlpha || 0) : 0
        });

        if (isImpact) this.impactKick(layer, impactCfg);
        if (onFrame) onFrame(i, this.markersFor(manifest, i), manifest);
        if (isImpact && Number(impactCfg.hitStopMs || 0) > 0) {
          await wait(scene, Number(impactCfg.hitStopMs));
        }
        await wait(scene, Number(frame.duration || 100));
      }
    } finally {
      this.restoreUi(uiState, 0);
      scene.formation?.setPovFocus?.(actor.hero?.id, false);
      camera.setZoom(cameraState.zoom);
      camera.setScroll(cameraState.scrollX, cameraState.scrollY);
      scene.audio?.endCinematicAttack?.();
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
      layer.ctx.clearRect(0, 0, layer.overlay.width, layer.overlay.height);
      layer.overlay.style.transform = 'none';
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
