// PriZim Sequence Lab v0.2.4
// Phone-first motion QA for locked Prismatic Veil authority sheets.
// Supports normal frame assets and row-major sprite-sheet frames, removes only
// edge-connected near-white sheet backgrounds, normalizes visible bounds, and
// adds a requestAnimationFrame motion-bridge layer without modifying masters.

const MANIFEST_URLS = [
  './pv-data/sequences/prismel_active_turn.sequence.json',
  './pv-data/sequences/auryi_auorb.sequence.json',
  './pv-data/sequences/kineza_gauntlet_ignition.sequence.json'
];

const VERSION = '6';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = t => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

class SequenceLab {
  constructor(root) {
    this.root = root;
    this.manifests = [];
    this.activeIndex = 0;
    this.frameIndex = 0;
    this.playing = false;
    this.loop = true;
    this.speed = 1;
    this.runToken = 0;
    this.activeCanvas = 0;
    this.transitionTargetCanvas = null;
    this.imageCache = new Map();
    this.frameSourceCache = new Map();
    this.metricsCache = new Map();

    this.els = {
      tabs: root.querySelector('[data-tabs]'),
      title: root.querySelector('[data-sequence-title]'),
      status: root.querySelector('[data-status]'),
      note: root.querySelector('[data-note]'),
      stage: root.querySelector('[data-stage]'),
      canvases: [root.querySelector('#lab-canvas-a'), root.querySelector('#lab-canvas-b')],
      frameLabel: root.querySelector('[data-frame-label]'),
      frameCount: root.querySelector('[data-frame-count]'),
      hold: root.querySelector('[data-hold]'),
      blend: root.querySelector('[data-blend]'),
      cue: root.querySelector('[data-cue]'),
      bounds: root.querySelector('[data-bounds]'),
      play: root.querySelector('[data-play]'),
      prev: root.querySelector('[data-prev]'),
      next: root.querySelector('[data-next]'),
      loop: root.querySelector('[data-loop]'),
      speed: root.querySelector('[data-speed]'),
      plan: root.querySelector('[data-plan]'),
      loading: root.querySelector('[data-loading]')
    };
  }

  async init() {
    this.bindControls();
    this.setLoading('Loading PriZim authority manifests…');
    this.manifests = await Promise.all(MANIFEST_URLS.map(async url => {
      const response = await fetch(`${url}?v=${VERSION}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
      return response.json();
    }));

    this.renderTabs();
    await this.selectSequence(0);
    this.setLoading('');

    window.addEventListener('resize', () => {
      this.fitCanvases();
      this.renderCurrentFrame({ immediate: true });
    });
  }

  bindControls() {
    this.els.play.addEventListener('click', () => this.togglePlay());
    this.els.prev.addEventListener('click', () => this.step(-1));
    this.els.next.addEventListener('click', () => this.step(1));
    this.els.loop.addEventListener('click', () => {
      this.loop = !this.loop;
      this.els.loop.classList.toggle('is-on', this.loop);
      this.els.loop.setAttribute('aria-pressed', String(this.loop));
    });
    this.els.speed.addEventListener('change', e => {
      this.speed = Number(e.target.value) || 1;
    });
  }

  setLoading(text) {
    this.els.loading.textContent = text;
    this.els.loading.hidden = !text;
  }

  framesFor(manifest = this.currentManifest()) {
    if (!manifest) return [];
    return manifest.signatureReady ? (manifest.frames || []) : (manifest.previewFrames || []);
  }

  currentManifest() {
    return this.manifests[this.activeIndex];
  }

  authorityLabel(manifest) {
    if (manifest.signatureReady && manifest.qaProxy) return 'AUTHORITY';
    return manifest.signatureReady ? 'SIGNATURE' : 'BOOTSTRAP';
  }

  renderTabs() {
    this.els.tabs.innerHTML = '';
    this.manifests.forEach((manifest, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lab-character-tab';
      button.dataset.index = index;
      button.innerHTML = `<span>${manifest.displayName}</span><small>${this.authorityLabel(manifest)}</small>`;
      button.addEventListener('click', () => this.selectSequence(index));
      this.els.tabs.appendChild(button);
    });
  }

  async selectSequence(index) {
    this.stop();
    this.activeIndex = clamp(index, 0, this.manifests.length - 1);
    this.frameIndex = 0;
    const manifest = this.currentManifest();

    [...this.els.tabs.children].forEach((button, i) => {
      button.classList.toggle('is-active', i === this.activeIndex);
    });

    this.els.title.textContent = `${manifest.displayName} • ${manifest.sequenceName}`;
    if (manifest.signatureReady && manifest.qaProxy) {
      this.els.status.textContent = 'AUTHORITY • MOTION BRIDGE';
    } else {
      this.els.status.textContent = manifest.signatureReady ? 'SIGNATURE READY • QA' : 'BOOTSTRAP READY';
    }
    this.els.status.classList.toggle('is-bootstrap', !manifest.signatureReady);
    this.els.note.textContent = manifest.notes || '';
    this.renderPlan(manifest);
    this.fitCanvases();
    await this.renderCurrentFrame({ immediate: true });
  }

  renderPlan(manifest) {
    this.els.plan.innerHTML = '';
    if (manifest.signatureReady) {
      const line = document.createElement('div');
      line.className = 'lab-plan-ready';
      const motion = manifest.motionProfile && manifest.motionProfile.style
        ? String(manifest.motionProfile.style).toUpperCase()
        : 'DEFAULT';
      line.textContent = manifest.qaProxy
        ? `Locked authority sheet loaded through a PriZim QA proxy. Motion Bridge: ${motion}. Production master remains unchanged.`
        : `Dedicated signature assets are present. Motion Bridge: ${motion}.`;
      this.els.plan.appendChild(line);
      return;
    }

    (manifest.signaturePlan || []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'lab-plan-row';
      row.innerHTML = `<b>${String(item.frame).padStart(2, '0')}</b><span>${item.beat}</span><em>${item.asset ? 'ASSET READY' : 'FRAME NEEDED'}</em>`;
      this.els.plan.appendChild(row);
    });
  }

  fitCanvases() {
    const rect = this.els.stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    for (const canvas of this.els.canvases) {
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas.style.transformOrigin = '50% 87.5%';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }

  sourceWidth(source) { return source.naturalWidth || source.width; }
  sourceHeight(source) { return source.naturalHeight || source.height; }

  async loadImage(asset) {
    if (this.imageCache.has(asset)) return this.imageCache.get(asset);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Image failed to load: ${asset}`));
      img.src = `${asset}?v=${VERSION}`;
    });
    this.imageCache.set(asset, promise);
    return promise;
  }

  isEdgeWhite(r, g, b, a) {
    if (a < 8) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return r >= 220 && g >= 220 && b >= 220 && (max - min) <= 38;
  }

  removeEdgeWhite(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    const w = canvas.width;
    const h = canvas.height;
    const seen = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const enqueue = (x, y) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const i = y * w + x;
      if (seen[i]) return;
      const p = i * 4;
      if (!this.isEdgeWhite(data[p], data[p + 1], data[p + 2], data[p + 3])) return;
      seen[i] = 1;
      queue[tail++] = i;
    };

    for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
    for (let y = 1; y < h - 1; y++) { enqueue(0, y); enqueue(w - 1, y); }

    while (head < tail) {
      const i = queue[head++];
      const x = i % w;
      const y = (i / w) | 0;
      data[i * 4 + 3] = 0;
      enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
    }

    ctx.putImageData(image, 0, 0);
    return canvas;
  }

  async loadFrameSource(manifest, frame) {
    if (frame.asset) return { key: frame.asset, source: await this.loadImage(frame.asset) };

    const sheet = manifest.sheets && manifest.sheets[frame.sheet];
    if (!sheet) throw new Error(`Unknown sheet '${frame.sheet}' for ${manifest.id}`);
    const cacheKey = `${sheet.asset}#${frame.sheetIndex}`;
    if (this.frameSourceCache.has(cacheKey)) return this.frameSourceCache.get(cacheKey);

    const promise = (async () => {
      const img = await this.loadImage(sheet.asset);
      const cols = Number(sheet.cols) || 3;
      const rows = Number(sheet.rows) || 2;
      const index = Number(frame.sheetIndex) || 0;
      const cellW = Math.floor(img.naturalWidth / cols);
      const cellH = Math.floor(img.naturalHeight / rows);
      const col = index % cols;
      const row = Math.floor(index / cols);
      const canvas = document.createElement('canvas');
      canvas.width = cellW;
      canvas.height = cellH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
      this.removeEdgeWhite(canvas);
      return { key: cacheKey, source: canvas };
    })();

    this.frameSourceCache.set(cacheKey, promise);
    return promise;
  }

  async analyze(key, source) {
    if (this.metricsCache.has(key)) return this.metricsCache.get(key);
    const width = this.sourceWidth(source);
    const height = this.sourceHeight(source);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;
    const alphaThreshold = 18;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= alphaThreshold) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    if (right < left || bottom < top) throw new Error(`No visible subject found in ${key}`);
    const metrics = {
      left,
      right,
      top,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1,
      sourceWidth: width,
      sourceHeight: height
    };
    this.metricsCache.set(key, metrics);
    return metrics;
  }

  drawNormalized(canvas, source, metrics, frame) {
    const rect = this.els.stage.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const baselineY = rect.height * 0.875;
    const targetVisibleHeight = rect.height * 0.72;
    const targetVisibleWidth = rect.width * 0.68;
    const baseScale = Math.min(targetVisibleHeight / metrics.height, targetVisibleWidth / metrics.width);
    const scale = baseScale * Number(frame.scale || 1);
    const visibleCenterX = metrics.left + metrics.width / 2;
    const drawX = rect.width / 2 - visibleCenterX * scale + Number(frame.x || 0);
    const drawY = baselineY - metrics.bottom * scale + Number(frame.y || 0);
    const sourceW = this.sourceWidth(source);
    const sourceH = this.sourceHeight(source);
    ctx.save();
    ctx.filter = 'brightness(1.08) saturate(1.06) contrast(1.03)';
    ctx.drawImage(source, drawX, drawY, sourceW * scale, sourceH * scale);
    ctx.restore();
  }

  motionProfile(manifest, previousFrame, frame) {
    const source = manifest.motionProfile || {};
    const profile = {
      style: source.style || 'controlled',
      axis: source.axis || 'x',
      direction: Number(source.direction || 1) >= 0 ? 1 : -1,
      minBlendMs: Number(source.minBlendMs || 84),
      blendScale: Number(source.blendScale || 1),
      travelPx: Number(source.travelPx || 4),
      enterScale: Number(source.enterScale || 0.99),
      overlap: Number(source.overlap ?? 0.45),
      settleMs: Number(source.settleMs || 64),
      settleScale: Number(source.settleScale || 1.002)
    };

    const sheetBreak = previousFrame && frame && previousFrame.sheet && frame.sheet && previousFrame.sheet !== frame.sheet;
    const kineticCue = frame && ['release', 'stomp', 'gauntletSnap', 'ignition'].includes(frame.cue);
    if (sheetBreak) {
      profile.overlap *= 0.72;
      profile.travelPx *= 1.12;
    }
    if (kineticCue) {
      profile.overlap *= 0.78;
      profile.minBlendMs *= 0.88;
    }
    profile.overlap = clamp(profile.overlap, 0.08, 0.92);
    return profile;
  }

  easeMotion(style, t) {
    const x = clamp(t, 0, 1);
    if (style === 'float') return 0.5 - Math.cos(Math.PI * x) / 2;
    if (style === 'impact') return 1 - Math.pow(1 - x, 3);
    return smoothstep(x);
  }

  setCanvasTransform(canvas, x, y, scale) {
    canvas.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  }

  settleCanvases(activeIndex) {
    this.els.canvases.forEach((canvas, index) => {
      canvas.style.transition = 'none';
      canvas.style.willChange = 'auto';
      canvas.style.transform = 'none';
      canvas.style.opacity = index === activeIndex ? '1' : '0';
    });
  }

  animateRaf(durationMs, token, onFrame) {
    const duration = Math.max(0, durationMs);
    if (duration <= 0) {
      onFrame(1);
      return Promise.resolve(token === this.runToken);
    }

    return new Promise(resolve => {
      let start = null;
      const tick = now => {
        if (token !== this.runToken) {
          resolve(false);
          return;
        }
        if (start === null) start = now;
        const t = clamp((now - start) / duration, 0, 1);
        onFrame(t);
        if (t >= 1) resolve(true);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  rafWait(durationMs, token) {
    return this.animateRaf(durationMs, token, () => {});
  }

  async animateMotionBridge(outgoing, incoming, manifest, previousFrame, frame, token) {
    const profile = this.motionProfile(manifest, previousFrame, frame);
    const blendMs = Math.max(
      Number(frame.blendMs || 0) * profile.blendScale,
      profile.minBlendMs
    ) / this.speed;

    const regX = clamp((Number(previousFrame?.x || 0) - Number(frame.x || 0)) * 1.35, -6, 6);
    const regY = clamp((Number(previousFrame?.y || 0) - Number(frame.y || 0)) * 1.35, -6, 6);
    const axisX = profile.axis === 'x' ? profile.travelPx * profile.direction : 0;
    const axisY = profile.axis === 'y' ? profile.travelPx * profile.direction : 0;
    const startX = regX + axisX;
    const startY = regY + axisY;
    const settleX = profile.axis === 'x' ? -axisX * 0.12 : 0;
    const settleY = profile.axis === 'y' ? -axisY * 0.12 : 0;
    const outX = profile.axis === 'x' ? -axisX * 0.32 : 0;
    const outY = profile.axis === 'y' ? -axisY * 0.32 : 0;
    const fadeInStart = 0.5 - profile.overlap * 0.45;
    const fadeOutEnd = 0.5 + profile.overlap * 0.45;
    const outgoingScale = 1 + Math.abs(1 - profile.enterScale) * 0.34;

    incoming.style.willChange = 'opacity, transform';
    outgoing.style.willChange = 'opacity, transform';
    incoming.style.opacity = '0';
    outgoing.style.opacity = '1';
    this.setCanvasTransform(incoming, startX, startY, profile.enterScale);
    this.setCanvasTransform(outgoing, 0, 0, 1);

    const completed = await this.animateRaf(blendMs, token, raw => {
      const eased = this.easeMotion(profile.style, raw);
      const fadeInT = smoothstep((raw - fadeInStart) / Math.max(0.001, 1 - fadeInStart));
      const fadeOutT = smoothstep(raw / Math.max(0.001, fadeOutEnd));
      incoming.style.opacity = String(clamp(fadeInT, 0, 1));
      outgoing.style.opacity = String(clamp(1 - fadeOutT, 0, 1));
      this.setCanvasTransform(
        incoming,
        lerp(startX, settleX, eased),
        lerp(startY, settleY, eased),
        lerp(profile.enterScale, profile.settleScale, eased)
      );
      this.setCanvasTransform(
        outgoing,
        lerp(0, outX, eased),
        lerp(0, outY, eased),
        lerp(1, outgoingScale, eased)
      );
    });

    if (!completed || token !== this.runToken) return false;

    outgoing.style.opacity = '0';
    incoming.style.opacity = '1';
    const settleCompleted = await this.animateRaf(profile.settleMs / this.speed, token, raw => {
      const eased = smoothstep(raw);
      this.setCanvasTransform(
        incoming,
        lerp(settleX, 0, eased),
        lerp(settleY, 0, eased),
        lerp(profile.settleScale, 1, eased)
      );
    });
    return settleCompleted && token === this.runToken;
  }

  async renderCurrentFrame({ immediate = false, previousFrame = null } = {}) {
    const manifest = this.currentManifest();
    const frames = this.framesFor(manifest);
    const frame = frames[this.frameIndex];
    if (!frame) return;

    const token = this.runToken;
    const loaded = await this.loadFrameSource(manifest, frame);
    const metrics = await this.analyze(loaded.key, loaded.source);
    if (token !== this.runToken && !immediate) return;

    const incomingIndex = 1 - this.activeCanvas;
    const outgoing = this.els.canvases[this.activeCanvas];
    const incoming = this.els.canvases[incomingIndex];
    this.drawNormalized(incoming, loaded.source, metrics, frame);
    this.updateReadout(frame, metrics);

    if (immediate || !previousFrame) {
      this.activeCanvas = incomingIndex;
      this.transitionTargetCanvas = null;
      this.settleCanvases(incomingIndex);
      return;
    }

    this.transitionTargetCanvas = incomingIndex;
    const completed = await this.animateMotionBridge(outgoing, incoming, manifest, previousFrame, frame, token);
    if (!completed || token !== this.runToken) return;

    this.activeCanvas = incomingIndex;
    this.transitionTargetCanvas = null;
    this.settleCanvases(incomingIndex);
  }

  updateReadout(frame, metrics) {
    const frames = this.framesFor();
    this.els.frameLabel.textContent = frame.label || frame.id;
    this.els.frameCount.textContent = `${this.frameIndex + 1} / ${frames.length}`;
    this.els.hold.textContent = `${frame.holdMs || 0} ms`;
    this.els.blend.textContent = `${frame.blendMs || 0} ms`;
    this.els.cue.textContent = frame.cue || '—';
    this.els.bounds.textContent = `${metrics.width}×${metrics.height} visible`;
  }

  async togglePlay() {
    if (this.playing) {
      this.stop();
      return;
    }

    this.playing = true;
    this.els.play.textContent = 'PAUSE';
    const token = ++this.runToken;
    const frames = this.framesFor();

    while (this.playing && token === this.runToken) {
      const currentFrame = frames[this.frameIndex];
      const held = await this.rafWait(Math.max(30, Number(currentFrame.holdMs || 160) / this.speed), token);
      if (!held || !this.playing || token !== this.runToken) break;

      let nextIndex = this.frameIndex + 1;
      if (nextIndex >= frames.length) {
        if (!this.loop) {
          this.stop();
          break;
        }
        nextIndex = 0;
      }

      const previousFrame = currentFrame;
      this.frameIndex = nextIndex;
      await this.renderCurrentFrame({ immediate: false, previousFrame });
    }
  }

  stop() {
    this.playing = false;
    this.runToken++;
    this.els.play.textContent = 'PLAY';
    if (this.transitionTargetCanvas !== null) {
      this.activeCanvas = this.transitionTargetCanvas;
      this.transitionTargetCanvas = null;
      this.settleCanvases(this.activeCanvas);
    }
  }

  async step(delta) {
    this.stop();
    const frames = this.framesFor();
    if (!frames.length) return;
    this.frameIndex = (this.frameIndex + delta + frames.length) % frames.length;
    await this.renderCurrentFrame({ immediate: true });
  }
}

const root = document.querySelector('[data-sequence-lab]');
if (root) {
  const lab = new SequenceLab(root);
  lab.init().catch(error => {
    console.error(error);
    const loading = root.querySelector('[data-loading]');
    if (loading) {
      loading.hidden = false;
      loading.textContent = `Sequence Lab Error\n${error.message || error}`;
    }
  });
}
