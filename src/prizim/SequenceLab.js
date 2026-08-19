// PriZim Sequence Lab v0.2
// Phone-first motion QA for canonical PV signature sheets.
// Supports direct frame assets and 3x2 authority sheets, edge-connected white
// background removal, alpha-bound normalization, registration tuning, and
// authored hold/blend timing.

const MANIFEST_URLS = [
  './pv-data/sequences/prismel_active_turn.sequence.json',
  './pv-data/sequences/auryi_auorb.sequence.json',
  './pv-data/sequences/kineza_gauntlet_ignition.sequence.json'
];

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
    this.preparedCache = new Map();

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
      const response = await fetch(`${url}?v=2`, { cache: 'no-store' });
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

  currentManifest() {
    return this.manifests[this.activeIndex];
  }

  framesFor(manifest = this.currentManifest()) {
    if (!manifest) return [];
    return manifest.signatureReady ? (manifest.frames || []) : (manifest.previewFrames || []);
  }

  renderTabs() {
    this.els.tabs.innerHTML = '';
    this.manifests.forEach((manifest, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lab-character-tab';
      button.innerHTML = `<span>${manifest.displayName}</span><small>${manifest.signatureReady ? 'SIGNATURE' : 'BOOTSTRAP'}</small>`;
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
    this.els.status.textContent = manifest.signatureReady ? 'AUTHORITY • QA' : 'BOOTSTRAP READY';
    this.els.status.classList.toggle('is-bootstrap', !manifest.signatureReady);
    this.els.note.textContent = manifest.notes || '';
    this.renderPlan(manifest);
    this.fitCanvases();
    await this.renderCurrentFrame({ immediate: true });
  }

  renderPlan(manifest) {
    this.els.plan.innerHTML = '';
    if (!manifest.signaturePlan || !manifest.signaturePlan.length) {
      const line = document.createElement('div');
      line.className = 'lab-plan-ready';
      line.textContent = manifest.sheets
        ? 'Approved authority sheet is active. PriZim is cropping, background-keying, normalizing, and timing the canonical sequence.'
        : 'Dedicated signature assets are active.';
      this.els.plan.appendChild(line);
      return;
    }

    manifest.signaturePlan.forEach(item => {
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

  async loadImage(asset) {
    if (this.imageCache.has(asset)) return this.imageCache.get(asset);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Image failed to load: ${asset}`));
      img.src = `${asset}?v=2`;
    });
    this.imageCache.set(asset, promise);
    return promise;
  }

  resolveSource(manifest, frame) {
    if (frame.asset) {
      return { asset: frame.asset, cols: 1, rows: 1, cell: 1, backgroundKey: frame.backgroundKey || null };
    }
    if (!frame.sheet || !manifest.sheets || !manifest.sheets[frame.sheet]) {
      throw new Error(`Frame ${frame.id} has no valid asset or sheet source`);
    }
    const sheet = manifest.sheets[frame.sheet];
    return {
      asset: sheet.asset,
      cols: Number(sheet.cols || 1),
      rows: Number(sheet.rows || 1),
      cell: Number(frame.cell || 1),
      backgroundKey: sheet.backgroundKey || null
    };
  }

  edgeWhiteKey(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const w = canvas.width;
    const h = canvas.height;
    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const isBackground = index => {
      const p = index * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return max >= 238 && min >= 226 && (max - min) <= 20;
    };

    const seed = index => {
      if (visited[index] || !isBackground(index)) return;
      visited[index] = 1;
      queue[tail++] = index;
    };

    for (let x = 0; x < w; x++) {
      seed(x);
      seed((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      seed(y * w);
      seed(y * w + (w - 1));
    }

    while (head < tail) {
      const index = queue[head++];
      const x = index % w;
      const y = (index / w) | 0;
      const neighbors = [index - 1, index + 1, index - w, index + w];
      for (let n = 0; n < neighbors.length; n++) {
        const next = neighbors[n];
        if (next < 0 || next >= w * h || visited[next]) continue;
        const nx = next % w;
        const ny = (next / w) | 0;
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (!isBackground(next)) continue;
        visited[next] = 1;
        queue[tail++] = next;
      }
    }

    for (let i = 0; i < visited.length; i++) {
      if (!visited[i]) continue;
      data[i * 4 + 3] = 0;
    }
    ctx.putImageData(image, 0, 0);
  }

  analyzeCanvas(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width;
    let right = -1;
    let top = canvas.height;
    let bottom = -1;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
        if (alpha <= 18) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }

    if (right < left || bottom < top) {
      throw new Error('Prepared frame contains no visible subject');
    }

    return {
      left,
      right,
      top,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1,
      sourceWidth: canvas.width,
      sourceHeight: canvas.height
    };
  }

  async prepareFrame(manifest, frame) {
    const key = `${manifest.id}:${frame.id}`;
    if (this.preparedCache.has(key)) return this.preparedCache.get(key);

    const source = this.resolveSource(manifest, frame);
    const img = await this.loadImage(source.asset);
    const cellW = Math.floor(img.naturalWidth / source.cols);
    const cellH = Math.floor(img.naturalHeight / source.rows);
    const zero = clamp(source.cell - 1, 0, source.cols * source.rows - 1);
    const col = zero % source.cols;
    const row = Math.floor(zero / source.cols);

    const canvas = document.createElement('canvas');
    canvas.width = cellW;
    canvas.height = cellH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);

    if (source.backgroundKey === 'edge-white') this.edgeWhiteKey(canvas);

    const prepared = { canvas, metrics: this.analyzeCanvas(canvas), source };
    this.preparedCache.set(key, prepared);
    return prepared;
  }

  drawNormalized(canvas, prepared, frame) {
    const rect = this.els.stage.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const metrics = prepared.metrics;
    const baselineY = rect.height * 0.865;
    const targetVisibleHeight = rect.height * 0.72;
    const targetVisibleWidth = rect.width * 0.68;
    const baseScale = Math.min(targetVisibleHeight / metrics.height, targetVisibleWidth / metrics.width);
    const scale = baseScale * Number(frame.scale || 1);
    const visibleCenterX = metrics.left + metrics.width / 2;
    const drawX = rect.width / 2 - visibleCenterX * scale + Number(frame.x || 0);
    const drawY = baselineY - metrics.bottom * scale + Number(frame.y || 0);

    ctx.save();
    ctx.shadowColor = 'rgba(145,232,255,.16)';
    ctx.shadowBlur = 7;
    ctx.drawImage(prepared.canvas, drawX, drawY, prepared.canvas.width * scale, prepared.canvas.height * scale);
    ctx.restore();
  }

  async renderCurrentFrame({ immediate = false } = {}) {
    const manifest = this.currentManifest();
    const frames = this.framesFor(manifest);
    const frame = frames[this.frameIndex];
    if (!frame) return;

    const token = this.runToken;
    const prepared = await this.prepareFrame(manifest, frame);
    if (token !== this.runToken && !immediate) return;

    const incomingIndex = 1 - this.activeCanvas;
    const outgoing = this.els.canvases[this.activeCanvas];
    const incoming = this.els.canvases[incomingIndex];
    this.drawNormalized(incoming, prepared, frame);

    const blendMs = immediate ? 0 : Math.max(0, Number(frame.blendMs || 0) / this.speed);
    incoming.style.transition = 'none';
    outgoing.style.transition = 'none';
    incoming.style.opacity = '0';
    outgoing.style.opacity = '1';
    void incoming.offsetWidth;

    if (blendMs <= 0) {
      incoming.style.opacity = '1';
      outgoing.style.opacity = '0';
    } else {
      incoming.style.transition = `opacity ${blendMs}ms linear`;
      outgoing.style.transition = `opacity ${blendMs}ms linear`;
      incoming.style.opacity = '1';
      outgoing.style.opacity = '0';
      await sleep(blendMs + 8);
    }

    this.activeCanvas = incomingIndex;
    this.updateReadout(frame, prepared.metrics);
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
      const frame = frames[this.frameIndex];
      await this.renderCurrentFrame({ immediate: false });
      if (!this.playing || token !== this.runToken) break;
      await sleep(Math.max(30, Number(frame.holdMs || 160) / this.speed));
      if (!this.playing || token !== this.runToken) break;

      if (this.frameIndex >= frames.length - 1) {
        if (!this.loop) {
          this.stop();
          break;
        }
        this.frameIndex = 0;
      } else {
        this.frameIndex++;
      }
    }
  }

  stop() {
    this.playing = false;
    this.runToken++;
    this.els.play.textContent = 'PLAY';
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
