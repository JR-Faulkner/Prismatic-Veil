// PriZim Kineza Attack Style Lab v1.1
const MANIFESTS = [
  './pv-data/sequences/kineza_attack_style_epic.sequence.json',
  './pv-data/sequences/kineza_attack_style_jrpg.sequence.json',
  './pv-data/sequences/kineza_attack_style_graphic.sequence.json'
];

const VERSION = '2';
const $ = s => document.querySelector(s);

class KinezaAttackStyleLab {
  constructor() {
    this.manifests = [];
    this.images = new Map();
    this.objectUrls = [];
    this.styleIndex = 0;
    this.frameIndex = 0;
    this.playing = false;
    this.loop = true;
    this.speed = 1;
    this.token = 0;
    this.canvas = $('#attack-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async init() {
    this.manifests = await Promise.all(MANIFESTS.map(async url => {
      const r = await fetch(`${url}?v=${VERSION}`, {cache:'no-store'});
      if (!r.ok) throw new Error(`Manifest load failed: ${url} (${r.status})`);
      return r.json();
    }));

    this.assertComparisonLock();
    await Promise.all(this.manifests.map(m => this.loadSheet(m)));
    this.bind();
    this.renderStyleButtons();
    this.resize();
    this.render();
    window.addEventListener('resize', () => { this.resize(); this.render(); });
    window.addEventListener('pagehide', () => this.objectUrls.forEach(url => URL.revokeObjectURL(url)), {once:true});
    $('#boot-status').textContent = 'PRIZIM LOCK • 3 STYLES • 6 FRAMES • SYNCED';
  }

  assertComparisonLock() {
    const base = this.signature(this.manifests[0]);
    const group = this.manifests[0].comparisonGroup;
    for (const m of this.manifests) {
      if (m.comparisonGroup !== group) throw new Error('Comparison group mismatch');
      if (JSON.stringify(this.signature(m)) !== JSON.stringify(base)) {
        throw new Error(`Choreography lock mismatch: ${m.styleVariant}`);
      }
    }
  }

  signature(m) {
    return (m.frames || []).map(f => [f.label, f.holdMs, f.blendMs, f.cue || '']);
  }

  async imageFromUrl(url, label) {
    const img = new Image();
    img.decoding = 'async';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Sheet failed: ${label}`));
      img.src = url;
    });
    return img;
  }

  async loadSheet(m) {
    const sheet = m.sheets.attack;
    const assetUrl = `${sheet.asset}?v=${VERSION}`;

    // PriZim's repository writer stores binary payloads as base64 text. Fetch the
    // payload ourselves and decode it in-browser so GitHub Pages can still serve
    // the exact audited asset without a second binary upload path.
    const response = await fetch(assetUrl, {cache:'no-store'});
    if (!response.ok) throw new Error(`Sheet fetch failed: ${sheet.asset} (${response.status})`);
    const raw = await response.arrayBuffer();
    const bytes = new Uint8Array(raw);

    let imageUrl = assetUrl;
    const looksLikeJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!looksLikeJpeg) {
      const encoded = new TextDecoder('utf-8').decode(bytes).replace(/\s+/g, '');
      let decoded;
      try {
        const binary = atob(encoded);
        decoded = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) decoded[i] = binary.charCodeAt(i);
      } catch (_) {
        throw new Error(`Sheet decode failed: ${sheet.asset}`);
      }
      if (decoded.length < 3 || decoded[0] !== 0xff || decoded[1] !== 0xd8 || decoded[2] !== 0xff) {
        throw new Error(`Sheet payload invalid: ${sheet.asset}`);
      }
      imageUrl = URL.createObjectURL(new Blob([decoded], {type:'image/jpeg'}));
      this.objectUrls.push(imageUrl);
    }

    this.images.set(m.id, await this.imageFromUrl(imageUrl, sheet.asset));
  }

  bind() {
    $('#play').addEventListener('click', () => this.togglePlay());
    $('#prev').addEventListener('click', () => this.step(-1));
    $('#next').addEventListener('click', () => this.step(1));
    $('#loop').addEventListener('click', () => {
      this.loop = !this.loop;
      $('#loop').classList.toggle('on', this.loop);
      $('#loop').textContent = this.loop ? 'LOOP ON' : 'LOOP OFF';
    });
    $('#speed').addEventListener('change', e => { this.speed = Number(e.target.value) || 1; });
    [...document.querySelectorAll('[data-frame]')].forEach(btn => {
      btn.addEventListener('click', () => {
        this.stop();
        this.frameIndex = Number(btn.dataset.frame);
        this.render();
      });
    });
  }

  renderStyleButtons() {
    const wrap = $('#styles');
    wrap.innerHTML = '';
    this.manifests.forEach((m, i) => {
      const b = document.createElement('button');
      b.textContent = m.styleVariant.replaceAll('-', ' ').toUpperCase();
      b.addEventListener('click', () => {
        this.styleIndex = i;
        this.renderStyleButtons();
        this.render();
      });
      b.classList.toggle('active', i === this.styleIndex);
      wrap.appendChild(b);
    });
  }

  resize() {
    const r = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 3);
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.canvas.style.width = `${r.width}px`;
    this.canvas.style.height = `${r.height}px`;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  render() {
    const m = this.manifests[this.styleIndex];
    if (!m) return;
    const img = this.images.get(m.id);
    if (!img) return;
    const f = m.frames[this.frameIndex];
    const sheet = m.sheets.attack;
    const sw = Math.floor(img.naturalWidth / sheet.cols);
    const sh = Math.floor(img.naturalHeight / sheet.rows);
    const sx = sw * f.sheetIndex;
    const rect = this.canvas.parentElement.getBoundingClientRect();

    this.ctx.clearRect(0,0,rect.width,rect.height);
    this.ctx.fillStyle = '#08101e';
    this.ctx.fillRect(0,0,rect.width,rect.height);

    const scale = Math.min(rect.width / sw, rect.height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (rect.width - dw)/2;
    const dy = (rect.height - dh)/2;
    this.ctx.drawImage(img, sx, 0, sw, sh, dx, dy, dw, dh);

    $('#style-label').textContent = m.styleVariant.replaceAll('-', ' ').toUpperCase();
    $('#frame-label').textContent = `${this.frameIndex + 1}/6 · ${f.label.toUpperCase()}`;
    $('#timing').textContent = `${f.holdMs}ms HOLD · ${f.blendMs}ms BLEND`;
    $('#cue').textContent = (f.cue || '—').toUpperCase();
    [...document.querySelectorAll('[data-frame]')].forEach((b,i) => b.classList.toggle('active', i === this.frameIndex));
  }

  step(dir) {
    this.stop();
    this.frameIndex = (this.frameIndex + dir + 6) % 6;
    this.render();
  }

  stop() {
    this.playing = false;
    this.token++;
    $('#play').textContent = 'PLAY';
  }

  togglePlay() {
    if (this.playing) return this.stop();
    this.playing = true;
    $('#play').textContent = 'PAUSE';
    const token = ++this.token;
    this.run(token);
  }

  async run(token) {
    while (this.playing && token === this.token) {
      const m = this.manifests[this.styleIndex];
      const f = m.frames[this.frameIndex];
      this.render();
      await new Promise(r => setTimeout(r, Math.max(40, f.holdMs / this.speed)));
      if (!this.playing || token !== this.token) break;
      if (this.frameIndex === 5) {
        if (!this.loop) return this.stop();
        this.frameIndex = 0;
      } else {
        this.frameIndex++;
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await new KinezaAttackStyleLab().init();
  } catch (err) {
    console.error(err);
    $('#boot-status').textContent = `PRIZIM FAIL • ${err.message}`;
    $('#boot-status').classList.add('fail');
  }
});
