// PriZim Kineza Attack Style Lab v2
// PHONE-08-era style audition: same choreography, three art treatments.
// Handles both normal JPEG assets and base64-text repository payloads, then exposes
// a small QA API so PriZim can prove every frame actually renders on GitHub Pages.
const BUILD_MARKER = 'KINEZA-STYLE-AUDITION-002';
const MANIFESTS = [
  './pv-data/sequences/kineza_attack_style_epic.sequence.json',
  './pv-data/sequences/kineza_attack_style_jrpg.sequence.json',
  './pv-data/sequences/kineza_attack_style_graphic.sequence.json'
];
const VERSION = '2';
const $ = selector => document.querySelector(selector);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class KinezaAttackStyleLab {
  constructor() {
    this.manifests = [];
    this.images = new Map();
    this.objectUrls = [];
    this.visited = new Map();
    this.styleIndex = 0;
    this.frameIndex = 0;
    this.playing = false;
    this.loop = true;
    this.speed = 1;
    this.token = 0;
    this.canvas = $('#attack-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  async init() {
    this.manifests = await Promise.all(MANIFESTS.map(async url => {
      const response = await fetch(`${url}?v=${VERSION}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Manifest load failed: ${url} (${response.status})`);
      return response.json();
    }));

    this.assertComparisonLock();
    this.manifests.forEach(manifest => this.visited.set(manifest.id, new Set()));
    await Promise.all(this.manifests.map(manifest => this.loadSheet(manifest)));
    this.bind();
    this.renderStyleButtons();
    this.resize();
    this.render();
    window.addEventListener('resize', () => { this.resize(); this.render(); });
    window.addEventListener('pagehide', () => this.objectUrls.forEach(url => URL.revokeObjectURL(url)), { once: true });
    $('#boot-status').textContent = `PRIZIM LOCK • 3 STYLES • 6 FRAMES • ${BUILD_MARKER}`;

    window.__KINEZA_STYLE_LAB__ = {
      ready: true,
      buildMarker: BUILD_MARKER,
      selectStyle: index => this.selectStyle(index),
      setFrame: index => this.setFrame(index),
      playOnce: index => this.playOnce(index),
      compareOnce: () => this.compareOnce(),
      getState: () => this.getState()
    };
  }

  signature(manifest) {
    return (manifest.frames || []).map(frame => [frame.label, frame.holdMs, frame.blendMs, frame.cue || '']);
  }

  assertComparisonLock() {
    if (this.manifests.length !== 3) throw new Error(`Expected 3 style manifests, found ${this.manifests.length}`);
    const base = this.signature(this.manifests[0]);
    const group = this.manifests[0].comparisonGroup;
    for (const manifest of this.manifests) {
      if (manifest.comparisonGroup !== group) throw new Error('Comparison group mismatch');
      if ((manifest.frames || []).length !== 6) throw new Error(`${manifest.styleVariant} does not contain 6 frames`);
      if (JSON.stringify(this.signature(manifest)) !== JSON.stringify(base)) {
        throw new Error(`Choreography lock mismatch: ${manifest.styleVariant}`);
      }
    }
  }

  async imageFromUrl(url, label) {
    const image = new Image();
    image.decoding = 'async';
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Sheet failed: ${label}`));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Sheet has no dimensions: ${label}`);
    return image;
  }

  async loadSheet(manifest) {
    const sheet = manifest.sheets?.attack;
    if (!sheet?.asset) throw new Error(`Missing attack sheet: ${manifest.styleVariant}`);
    const assetUrl = `${sheet.asset}?v=${BUILD_MARKER}`;
    const response = await fetch(assetUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Sheet fetch failed: ${sheet.asset} (${response.status})`);
    const raw = await response.arrayBuffer();
    const bytes = new Uint8Array(raw);
    if (!bytes.length) throw new Error(`Sheet payload empty: ${sheet.asset}`);

    let imageUrl = assetUrl;
    const looksLikeJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

    // GitHub's text-only repository write path can leave an otherwise valid image
    // stored as base64 text. Decode that delivery form deterministically in-browser.
    if (!looksLikeJpeg) {
      const encoded = new TextDecoder('utf-8').decode(bytes).replace(/\s+/g, '');
      let decoded;
      try {
        const binary = atob(encoded);
        decoded = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) decoded[index] = binary.charCodeAt(index);
      } catch (_) {
        throw new Error(`Sheet decode failed: ${sheet.asset}`);
      }
      if (decoded.length < 3 || decoded[0] !== 0xff || decoded[1] !== 0xd8 || decoded[2] !== 0xff) {
        throw new Error(`Sheet payload invalid: ${sheet.asset}`);
      }
      imageUrl = URL.createObjectURL(new Blob([decoded], { type: 'image/jpeg' }));
      this.objectUrls.push(imageUrl);
    }

    const image = await this.imageFromUrl(imageUrl, sheet.asset);
    if (image.naturalWidth < Number(sheet.cols || 6) || image.naturalHeight < Number(sheet.rows || 1)) {
      throw new Error(`Sheet dimensions invalid: ${sheet.asset} ${image.naturalWidth}x${image.naturalHeight}`);
    }
    this.images.set(manifest.id, image);
  }

  bind() {
    $('#play').addEventListener('click', () => this.togglePlay());
    $('#compare').addEventListener('click', () => this.toggleCompare());
    $('#prev').addEventListener('click', () => this.step(-1));
    $('#next').addEventListener('click', () => this.step(1));
    $('#loop').addEventListener('click', () => {
      this.loop = !this.loop;
      $('#loop').classList.toggle('on', this.loop);
      $('#loop').textContent = this.loop ? 'LOOP ON' : 'LOOP OFF';
    });
    $('#speed').addEventListener('change', event => { this.speed = Number(event.target.value) || 1; });
    [...document.querySelectorAll('[data-frame]')].forEach(button => {
      button.addEventListener('click', () => this.setFrame(Number(button.dataset.frame)));
    });
  }

  renderStyleButtons() {
    const wrap = $('#styles');
    wrap.innerHTML = '';
    this.manifests.forEach((manifest, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = manifest.styleVariant.replaceAll('-', ' ').toUpperCase();
      button.addEventListener('click', () => this.selectStyle(index));
      button.classList.toggle('active', index === this.styleIndex);
      wrap.appendChild(button);
    });
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 3);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  render() {
    const manifest = this.manifests[this.styleIndex];
    if (!manifest) return;
    const image = this.images.get(manifest.id);
    if (!image) return;
    const frame = manifest.frames[this.frameIndex];
    const sheet = manifest.sheets.attack;
    const cols = Number(sheet.cols) || 6;
    const rows = Number(sheet.rows) || 1;
    const cellWidth = Math.floor(image.naturalWidth / cols);
    const cellHeight = Math.floor(image.naturalHeight / rows);
    const index = Number(frame.sheetIndex) || 0;
    const column = index % cols;
    const row = Math.floor(index / cols);
    const sourceX = cellWidth * column;
    const sourceY = cellHeight * row;
    const rect = this.canvas.parentElement.getBoundingClientRect();

    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = '#08101e';
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    const scale = Math.min(rect.width / cellWidth, rect.height / cellHeight);
    const drawWidth = cellWidth * scale;
    const drawHeight = cellHeight * scale;
    const drawX = (rect.width - drawWidth) / 2;
    const drawY = (rect.height - drawHeight) / 2;
    this.ctx.drawImage(image, sourceX, sourceY, cellWidth, cellHeight, drawX, drawY, drawWidth, drawHeight);

    this.visited.get(manifest.id)?.add(this.frameIndex);
    $('#style-label').textContent = manifest.styleVariant.replaceAll('-', ' ').toUpperCase();
    $('#frame-label').textContent = `${this.frameIndex + 1}/6 · ${frame.label.toUpperCase()}`;
    $('#timing').textContent = `${frame.holdMs}ms HOLD · ${frame.blendMs}ms BLEND`;
    $('#cue').textContent = (frame.cue || '—').toUpperCase();
    [...document.querySelectorAll('[data-frame]')].forEach((button, index2) => button.classList.toggle('active', index2 === this.frameIndex));
    [...$('#styles').children].forEach((button, index2) => button.classList.toggle('active', index2 === this.styleIndex));
  }

  stop() {
    this.playing = false;
    this.token++;
    $('#play').textContent = 'PLAY';
    $('#compare').textContent = 'COMPARE A→B→C';
  }

  async selectStyle(index) {
    this.stop();
    this.styleIndex = (Number(index) + this.manifests.length) % this.manifests.length;
    this.frameIndex = 0;
    this.render();
  }

  async setFrame(index) {
    this.stop();
    this.frameIndex = (Number(index) + 6) % 6;
    this.render();
  }

  async step(direction) {
    await this.setFrame(this.frameIndex + direction);
  }

  async runStyle(index, token) {
    this.styleIndex = index;
    for (let frame = 0; frame < 6; frame++) {
      if (!this.playing || token !== this.token) return false;
      this.frameIndex = frame;
      this.render();
      const hold = Math.max(35, Number(this.manifests[index].frames[frame].holdMs || 160) / this.speed);
      await sleep(hold);
    }
    return this.playing && token === this.token;
  }

  async playOnce(index = this.styleIndex) {
    this.stop();
    this.playing = true;
    $('#play').textContent = 'STOP';
    const token = ++this.token;
    const ok = await this.runStyle(Number(index), token);
    if (token === this.token) {
      this.playing = false;
      $('#play').textContent = 'PLAY';
    }
    return ok;
  }

  async compareOnce() {
    this.stop();
    this.playing = true;
    $('#compare').textContent = 'STOP COMPARE';
    const token = ++this.token;
    for (let index = 0; index < this.manifests.length; index++) {
      if (!(await this.runStyle(index, token))) return false;
      if (index < this.manifests.length - 1) await sleep(120 / this.speed);
    }
    if (token === this.token) {
      this.playing = false;
      $('#play').textContent = 'PLAY';
      $('#compare').textContent = 'COMPARE A→B→C';
    }
    return token === this.token;
  }

  async togglePlay() {
    if (this.playing) return this.stop();
    if (!this.loop) return this.playOnce(this.styleIndex);
    this.stop();
    this.playing = true;
    $('#play').textContent = 'STOP';
    const token = ++this.token;
    while (this.playing && token === this.token) {
      if (!(await this.runStyle(this.styleIndex, token))) break;
    }
  }

  async toggleCompare() {
    if (this.playing) return this.stop();
    await this.compareOnce();
  }

  canvasHasPixels() {
    const dpr = Math.min(devicePixelRatio || 1, 3);
    const cssWidth = Math.max(1, Math.floor(this.canvas.width / dpr));
    const cssHeight = Math.max(1, Math.floor(this.canvas.height / dpr));
    const sampleWidth = Math.min(cssWidth, 220);
    const sampleHeight = Math.min(cssHeight, 160);
    const x = Math.max(0, Math.floor((cssWidth - sampleWidth) / 2));
    const y = Math.max(0, Math.floor((cssHeight - sampleHeight) / 2));
    const data = this.ctx.getImageData(x, y, sampleWidth, sampleHeight).data;
    let artPixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const delta = Math.abs(data[index] - 8) + Math.abs(data[index + 1] - 16) + Math.abs(data[index + 2] - 30);
      if (data[index + 3] > 32 && delta > 42) {
        artPixels++;
        if (artPixels >= 40) return true;
      }
    }
    return false;
  }

  getState() {
    return {
      styleIndex: this.styleIndex,
      frameIndex: this.frameIndex,
      playing: this.playing,
      buildMarker: BUILD_MARKER,
      canvasHasPixels: this.canvasHasPixels(),
      visited: Object.fromEntries([...this.visited].map(([key, value]) => [key, [...value].sort((a, b) => a - b)]))
    };
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await new KinezaAttackStyleLab().init();
  } catch (error) {
    console.error(error);
    $('#boot-status').textContent = `PRIZIM FAIL • ${error.message}`;
    $('#boot-status').classList.add('fail');
  }
});
