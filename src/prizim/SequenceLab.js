// PriZim Sequence Lab v0.1
// Renderer-neutral phone QA harness for authored character sequences.
// Loads neutral JSON manifests, analyzes PNG alpha bounds in-browser, normalizes
// visible body scale/baseline, and previews authored hold + blend timing.

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
    this.setLoading('Loading PriZim sequence manifests…');
    this.manifests = await Promise.all(MANIFEST_URLS.map(async url => {
      const response = await fetch(`${url}?v=1`, { cache: 'no-store' });
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

  renderTabs() {
    this.els.tabs.innerHTML = '';
    this.manifests.forEach((manifest, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lab-character-tab';
      button.dataset.index = index;
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
    this.els.status.textContent = manifest.signatureReady ? 'SIGNATURE READY • QA' : 'BOOTSTRAP READY';
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
      line.textContent = 'Dedicated signature assets are present. Playback uses the production sequence manifest.';
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
      img.src = `${asset}?v=1`;
    });
    this.imageCache.set(asset, promise);
    return promise;
  }

  async analyze(asset, img) {
    if (this.metricsCache.has(asset)) return this.metricsCache.get(asset);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let left = canvas.width;
    let right = -1;
    let top = canvas.height;
    let bottom = -1;
    const alphaThreshold = 18;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
        if (alpha <= alphaThreshold) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }

    if (right < left || bottom < top) {
      throw new Error(`No visible alpha found in ${asset}`);
    }

    const metrics = {
      left,
      right,
      top,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1,
      sourceWidth: canvas.width,
      sourceHeight: canvas.height
    };
    this.metricsCache.set(asset, metrics);
    return metrics;
  }

  drawNormalized(canvas, img, metrics, frame) {
    const rect = this.els.stage.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const baselineY = rect.height * 0.865;
    const targetVisibleHeight = rect.height * 0.66;
    const targetVisibleWidth = rect.width * 0.60;
    const baseScale = Math.min(targetVisibleHeight / metrics.height, targetVisibleWidth / metrics.width);
    const tuneScale = Number(frame.scale || 1);
    const scale = baseScale * tuneScale;
    const visibleCenterX = metrics.left + metrics.width / 2;
    const xNudge = Number(frame.x || 0);
    const yNudge = Number(frame.y || 0);
    const drawX = rect.width / 2 - visibleCenterX * scale + xNudge;
    const drawY = baselineY - metrics.bottom * scale + yNudge;

    ctx.drawImage(
      img,
      drawX,
      drawY,
      img.naturalWidth * scale,
      img.naturalHeight * scale
    );
  }

  async renderCurrentFrame({ immediate = false } = {}) {
    const frames = this.framesFor();
    const frame = frames[this.frameIndex];
    if (!frame) return;

    const token = this.runToken;
    const img = await this.loadImage(frame.asset);
    const metrics = await this.analyze(frame.asset, img);
    if (token !== this.runToken && !immediate) return;

    const incomingIndex = 1 - this.activeCanvas;
    const outgoing = this.els.canvases[this.activeCanvas];
    const incoming = this.els.canvases[incomingIndex];
    this.drawNormalized(incoming, img, metrics, frame);

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

      const holdMs = Math.max(30, Number(frame.holdMs || 160) / this.speed);
      await sleep(holdMs);
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
