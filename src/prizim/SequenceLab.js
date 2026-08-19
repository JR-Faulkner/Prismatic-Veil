// PriZim Sequence Lab v0.2
// Phone-first motion QA for locked Prismatic Veil authority sheets.
// Supports normal frame assets and row-major sprite-sheet frames, removes only
// edge-connected near-white sheet backgrounds, normalizes visible bounds, and
// previews authored timing/registration without modifying production masters.

const MANIFEST_URLS = [
  './pv-data/sequences/prismel_active_turn.sequence.json',
  './pv-data/sequences/auryi_auorb.sequence.json',
  './pv-data/sequences/kineza_gauntlet_ignition.sequence.json'
];

const VERSION = '2';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
      this.els.status.textContent = 'AUTHORITY • QA PROXY';
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
      line.textContent = manifest.qaProxy
        ? 'Locked authority sheet loaded through a PriZim QA proxy. Production master remains unchanged.'
        : 'Dedicated signature assets are present. Playback uses the production sequence manifest.';
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
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, width, height); ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let left = width, right = -1, top = height, bottom = -1;
    const alphaThreshold = 18;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= alphaThreshold) continue;
        if (x < left) left = x; if (x > right) right = x; if (y < top) top = y; if (y > bottom) bottom = y;
      }
    }
    if (right < left || bottom < top) throw new Error(`No visible subject found in ${key}`);
    const metrics = { left, right, top, bottom, width:right-left+1, height:bottom-top+1, sourceWidth:width, sourceHeight:height };
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
    const sourceW = this.sourceWidth(source), sourceH = this.sourceHeight(source);
    ctx.save();
    ctx.filter = 'brightness(1.08) saturate(1.06) contrast(1.03)';
    ctx.drawImage(source, drawX, drawY, sourceW * scale, sourceH * scale);
    ctx.restore();
  }

  async renderCurrentFrame({ immediate = false } = {}) {
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
    const blendMs = immediate ? 0 : Math.max(0, Number(frame.blendMs || 0) / this.speed);
    incoming.style.transition = 'none'; outgoing.style.transition = 'none'; incoming.style.opacity = '0'; outgoing.style.opacity = '1'; void incoming.offsetWidth;
    if (blendMs <= 0) { incoming.style.opacity = '1'; outgoing.style.opacity = '0'; }
    else { incoming.style.transition = `opacity ${blendMs}ms linear`; outgoing.style.transition = `opacity ${blendMs}ms linear`; incoming.style.opacity = '1'; outgoing.style.opacity = '0'; await sleep(blendMs + 8); }
    this.activeCanvas = incomingIndex;
    this.updateReadout(frame, metrics);
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
    if (this.playing) { this.stop(); return; }
    this.playing = true; this.els.play.textContent = 'PAUSE';
    const token = ++this.runToken; const frames = this.framesFor();
    while (this.playing && token === this.runToken) {
      const frame = frames[this.frameIndex];
      await this.renderCurrentFrame({ immediate:false });
      if (!this.playing || token !== this.runToken) break;
      await sleep(Math.max(30, Number(frame.holdMs || 160) / this.speed));
      if (!this.playing || token !== this.runToken) break;
      if (this.frameIndex >= frames.length - 1) { if (!this.loop) { this.stop(); break; } this.frameIndex = 0; } else this.frameIndex++;
    }
  }

  stop() { this.playing = false; this.runToken++; this.els.play.textContent = 'PLAY'; }

  async step(delta) {
    this.stop(); const frames = this.framesFor(); if (!frames.length) return;
    this.frameIndex = (this.frameIndex + delta + frames.length) % frames.length;
    await this.renderCurrentFrame({ immediate:true });
  }
}

const root = document.querySelector('[data-sequence-lab]');
if (root) {
  const lab = new SequenceLab(root);
  lab.init().catch(error => {
    console.error(error);
    const loading = root.querySelector('[data-loading]');
    if (loading) { loading.hidden = false; loading.textContent = `Sequence Lab Error\n${error.message || error}`; }
  });
}
