// PriZim Continuity Gate v0.3
// Measures frame-to-frame continuity from locked authority assets and emits
// PASS / TUNE / BRIDGE recommendations plus constrained bridge specifications.

const MANIFEST_URLS = [
  './pv-data/sequences/prismel_active_turn.sequence.json',
  './pv-data/sequences/auryi_auorb.sequence.json',
  './pv-data/sequences/kineza_gauntlet_ignition.sequence.json'
];

const VERSION = '1';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mean = (a, b) => (a + b) / 2;
const pct = value => `${(value * 100).toFixed(1)}%`;

class ContinuityGate {
  constructor(root) {
    this.root = root;
    this.plan = root.querySelector('[data-plan]');
    this.tabs = root.querySelector('[data-tabs]');
    this.manifests = [];
    this.results = new Map();
    this.imageCache = new Map();
    this.frameCache = new Map();
    this.metricCache = new Map();
    this.boundTabHandler = () => window.setTimeout(() => this.renderActive(), 0);
  }

  async init() {
    if (!this.plan || !this.tabs) return;
    this.injectStyles();
    this.manifests = await Promise.all(MANIFEST_URLS.map(async url => {
      const response = await fetch(`${url}?v=${VERSION}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Continuity Gate could not load ${url}: ${response.status}`);
      return response.json();
    }));

    this.tabs.addEventListener('click', this.boundTabHandler);
    new MutationObserver(() => this.renderActive()).observe(this.plan, { childList: true });

    for (const manifest of this.manifests) {
      this.results.set(manifest.id, await this.analyzeManifest(manifest));
    }
    this.renderActive();
  }

  injectStyles() {
    if (document.getElementById('prizim-continuity-gate-style')) return;
    const style = document.createElement('style');
    style.id = 'prizim-continuity-gate-style';
    style.textContent = `
      .gate-shell{border-top:1px solid rgba(168,240,255,.18);padding:7px 8px 8px;background:linear-gradient(180deg,rgba(14,29,52,.72),rgba(11,22,42,.82))}
      .gate-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
      .gate-head b{font-size:7px;letter-spacing:.12em;color:#a8f0ff}.gate-head span{font-size:6px;color:#b9b0c1}
      .gate-summary{display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;margin-bottom:5px}
      .gate-badge{padding:4px 6px;font-size:7px;font-weight:950;letter-spacing:.08em;border:1px solid rgba(141,245,173,.46);color:#8df5ad;background:rgba(30,67,54,.30)}
      .gate-badge.is-tune{border-color:rgba(239,217,154,.55);color:#efd99a;background:rgba(85,65,29,.27)}
      .gate-badge.is-bridge{border-color:rgba(234,146,168,.58);color:#ffafc1;background:rgba(90,39,54,.30)}
      .gate-summary strong{font-size:7px;color:#fffdf5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gate-score{font-size:8px;font-weight:950;color:#fff0c6}
      .gate-list{display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;scrollbar-width:none}.gate-list::-webkit-scrollbar{display:none}
      .gate-chip{flex:none;appearance:none;border:1px solid rgba(168,240,255,.18);background:rgba(29,43,69,.82);color:#e8e0ec;padding:4px 6px;font:800 6px/1.15 -apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,sans-serif;min-width:54px;text-align:left}
      .gate-chip em{display:block;font-style:normal;font-size:5px;color:#aaa1b3;margin-top:2px}.gate-chip.is-pass{border-color:rgba(141,245,173,.28)}.gate-chip.is-tune{border-color:rgba(239,217,154,.38)}.gate-chip.is-bridge{border-color:rgba(234,146,168,.46)}
      .gate-detail{margin-top:5px;display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.gate-reasons{font-size:6px;line-height:1.35;color:#cbc2d0;min-width:0}.gate-copy{appearance:none;border:1px solid rgba(168,240,255,.42);background:linear-gradient(145deg,#203454,#38254f);color:#fffdf5;padding:6px 7px;font:900 6px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,sans-serif;letter-spacing:.06em}.gate-copy:active{filter:brightness(1.2)}
    `;
    document.head.appendChild(style);
  }

  activeIndex() {
    const tabs = [...this.tabs.querySelectorAll('.lab-character-tab')];
    const index = tabs.findIndex(tab => tab.classList.contains('is-active'));
    return index >= 0 ? index : 0;
  }

  thresholds(manifest) {
    return {
      heightPct: 0.12,
      widthPct: 0.24,
      baselinePct: 0.055,
      centerPct: 0.075,
      lowerAnchorPct: 0.10,
      areaPct: 0.32,
      silhouetteDistance: 0.78,
      passScore: 78,
      bridgeScore: 54,
      ...(manifest.continuityGate || {})
    };
  }

  async loadImage(asset) {
    if (this.imageCache.has(asset)) return this.imageCache.get(asset);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Continuity Gate image failed: ${asset}`));
      img.src = `${asset}?gate=${VERSION}`;
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

  async frameSource(manifest, frame) {
    const directKey = `${manifest.id}:${frame.id}`;
    if (this.frameCache.has(directKey)) return this.frameCache.get(directKey);

    const promise = (async () => {
      if (frame.asset) {
        return { key: frame.asset, source: await this.loadImage(frame.asset) };
      }
      const sheet = manifest.sheets && manifest.sheets[frame.sheet];
      if (!sheet) throw new Error(`Continuity Gate unknown sheet '${frame.sheet}'`);
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
      return { key: `${sheet.asset}#${index}`, source: canvas };
    })();

    this.frameCache.set(directKey, promise);
    return promise;
  }

  sourceSize(source) {
    return { width: source.naturalWidth || source.width, height: source.naturalHeight || source.height };
  }

  metrics(key, source) {
    if (this.metricCache.has(key)) return this.metricCache.get(key);
    const { width, height } = this.sourceSize(source);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0);
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const alphaThreshold = 18;
    let left = width, right = -1, top = height, bottom = -1;
    let area = 0, sumX = 0, sumY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const a = data[(y * width + x) * 4 + 3];
        if (a <= alphaThreshold) continue;
        area++;
        sumX += x;
        sumY += y;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    if (!area) throw new Error(`Continuity Gate found no visible subject in ${key}`);

    const bboxWidth = right - left + 1;
    const bboxHeight = bottom - top + 1;
    const lowerStart = Math.max(top, Math.floor(bottom - bboxHeight * 0.18));
    let lowerArea = 0, lowerSumX = 0;
    for (let y = lowerStart; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const a = data[(y * width + x) * 4 + 3];
        if (a <= alphaThreshold) continue;
        lowerArea++;
        lowerSumX += x;
      }
    }

    const result = {
      width: bboxWidth,
      height: bboxHeight,
      left, right, top, bottom,
      centerX: sumX / area,
      centerY: sumY / area,
      lowerAnchorX: lowerArea ? lowerSumX / lowerArea : sumX / area,
      area,
      fill: area / Math.max(1, bboxWidth * bboxHeight),
      sourceWidth: width,
      sourceHeight: height,
      mask: this.makeMask(data, width, height)
    };
    this.metricCache.set(key, result);
    return result;
  }

  makeMask(data, width, height, size = 72) {
    const mask = new Uint8Array(size * size);
    for (let my = 0; my < size; my++) {
      const sy0 = Math.floor(my * height / size);
      const sy1 = Math.max(sy0 + 1, Math.floor((my + 1) * height / size));
      for (let mx = 0; mx < size; mx++) {
        const sx0 = Math.floor(mx * width / size);
        const sx1 = Math.max(sx0 + 1, Math.floor((mx + 1) * width / size));
        let visible = false;
        for (let y = sy0; y < sy1 && !visible; y++) {
          for (let x = sx0; x < sx1; x++) {
            if (data[(y * width + x) * 4 + 3] > 18) { visible = true; break; }
          }
        }
        if (visible) mask[my * size + mx] = 1;
      }
    }
    return mask;
  }

  silhouetteDistance(a, b) {
    const length = Math.min(a.length, b.length);
    let intersection = 0, union = 0;
    for (let i = 0; i < length; i++) {
      const av = a[i] === 1;
      const bv = b[i] === 1;
      if (av && bv) intersection++;
      if (av || bv) union++;
    }
    if (!union) return 0;
    return 1 - intersection / union;
  }

  comparePair(manifest, fromFrame, toFrame, fromMetrics, toMetrics, index) {
    const t = this.thresholds(manifest);
    const avgHeight = Math.max(1, mean(fromMetrics.height, toMetrics.height));
    const avgWidth = Math.max(1, mean(fromMetrics.width, toMetrics.width));
    const avgArea = Math.max(1, mean(fromMetrics.area, toMetrics.area));
    const sourceHeight = Math.max(1, mean(fromMetrics.sourceHeight, toMetrics.sourceHeight));
    const sourceWidth = Math.max(1, mean(fromMetrics.sourceWidth, toMetrics.sourceWidth));

    const values = {
      heightPct: Math.abs(toMetrics.height - fromMetrics.height) / avgHeight,
      widthPct: Math.abs(toMetrics.width - fromMetrics.width) / avgWidth,
      baselinePct: Math.abs(toMetrics.bottom - fromMetrics.bottom) / sourceHeight,
      centerPct: Math.abs(toMetrics.centerX - fromMetrics.centerX) / sourceWidth,
      lowerAnchorPct: Math.abs(toMetrics.lowerAnchorX - fromMetrics.lowerAnchorX) / sourceWidth,
      areaPct: Math.abs(toMetrics.area - fromMetrics.area) / avgArea,
      silhouetteDistance: this.silhouetteDistance(fromMetrics.mask, toMetrics.mask)
    };

    const weights = {
      heightPct: 1.15,
      widthPct: 0.90,
      baselinePct: 1.25,
      centerPct: 1.10,
      lowerAnchorPct: 1.15,
      areaPct: 0.85,
      silhouetteDistance: 0.70
    };

    let weighted = 0, weightTotal = 0;
    const severities = [];
    for (const key of Object.keys(weights)) {
      const ratio = values[key] / Math.max(0.0001, t[key]);
      weighted += ratio * weights[key];
      weightTotal += weights[key];
      severities.push({ key, ratio, value: values[key], threshold: t[key] });
    }
    const severity = weighted / weightTotal;
    const score = Math.round(clamp(104 - severity * 28, 0, 100));
    const peak = Math.max(...severities.map(item => item.ratio));
    let status = 'PASS';
    if (score < t.bridgeScore || peak >= 1.72) status = 'BRIDGE';
    else if (score < t.passScore || peak >= 1.0) status = 'TUNE';

    severities.sort((a, b) => b.ratio - a.ratio);
    const reasons = severities.slice(0, 3).map(item => this.reasonLabel(item));

    return {
      index,
      fromFrame,
      toFrame,
      fromMetrics,
      toMetrics,
      values,
      severities,
      score,
      status,
      reasons,
      thresholds: t
    };
  }

  reasonLabel(item) {
    const labels = {
      heightPct: 'body height',
      widthPct: 'silhouette width',
      baselinePct: 'baseline',
      centerPct: 'body center',
      lowerAnchorPct: 'lower anchor',
      areaPct: 'visible mass',
      silhouetteDistance: 'pose silhouette'
    };
    return `${labels[item.key]} ${pct(item.value)} / ${pct(item.threshold)}`;
  }

  async analyzeManifest(manifest) {
    const frames = manifest.signatureReady ? (manifest.frames || []) : (manifest.previewFrames || []);
    const loaded = [];
    for (const frame of frames) {
      const source = await this.frameSource(manifest, frame);
      loaded.push({ frame, metrics: this.metrics(source.key, source.source) });
    }

    const pairs = [];
    for (let i = 0; i < loaded.length - 1; i++) {
      pairs.push(this.comparePair(
        manifest,
        loaded[i].frame,
        loaded[i + 1].frame,
        loaded[i].metrics,
        loaded[i + 1].metrics,
        i
      ));
    }

    return pairs;
  }

  renderActive() {
    const manifest = this.manifests[this.activeIndex()];
    if (!manifest || !this.plan) return;
    const existing = this.plan.querySelector('.gate-shell');
    if (existing) existing.remove();
    const pairs = this.results.get(manifest.id);
    if (!pairs || !pairs.length) return;

    const worst = [...pairs].sort((a, b) => a.score - b.score)[0];
    const summary = document.createElement('div');
    summary.className = 'gate-shell';
    summary.innerHTML = `
      <div class="gate-head"><b>CONTINUITY GATE v0.3</b><span>${pairs.length} HANDOFFS</span></div>
      <div class="gate-summary">
        <span class="gate-badge ${this.statusClass(worst.status)}">${worst.status === 'BRIDGE' ? 'BRIDGE CANDIDATE' : worst.status}</span>
        <strong>${this.shortLabel(worst.fromFrame)} → ${this.shortLabel(worst.toFrame)}</strong>
        <span class="gate-score">${worst.score}</span>
      </div>
      <div class="gate-list"></div>
      <div class="gate-detail"><div class="gate-reasons"></div><button type="button" class="gate-copy">COPY SPEC</button></div>
    `;
    this.plan.appendChild(summary);

    const list = summary.querySelector('.gate-list');
    const reasons = summary.querySelector('.gate-reasons');
    let selected = worst;

    const show = pair => {
      selected = pair;
      const badge = summary.querySelector('.gate-badge');
      badge.className = `gate-badge ${this.statusClass(pair.status)}`;
      badge.textContent = pair.status === 'BRIDGE' ? 'BRIDGE CANDIDATE' : pair.status;
      summary.querySelector('.gate-summary strong').textContent = `${this.shortLabel(pair.fromFrame)} → ${this.shortLabel(pair.toFrame)}`;
      summary.querySelector('.gate-score').textContent = String(pair.score);
      reasons.textContent = pair.reasons.join(' • ');
      [...list.children].forEach((chip, i) => chip.classList.toggle('is-selected', i === pair.index));
    };

    pairs.forEach(pair => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `gate-chip ${this.statusClass(pair.status)}`;
      chip.innerHTML = `${pair.index + 1}→${pair.index + 2} <em>${pair.status} • ${pair.score}</em>`;
      chip.addEventListener('click', () => show(pair));
      list.appendChild(chip);
    });

    summary.querySelector('.gate-copy').addEventListener('click', async event => {
      const spec = this.bridgeSpec(manifest, selected);
      try {
        await navigator.clipboard.writeText(spec);
        event.currentTarget.textContent = 'COPIED';
        window.setTimeout(() => { event.currentTarget.textContent = 'COPY SPEC'; }, 900);
      } catch {
        window.prompt('Copy PriZim bridge specification:', spec);
      }
    });

    show(worst);
  }

  statusClass(status) {
    if (status === 'BRIDGE') return 'is-bridge';
    if (status === 'TUNE') return 'is-tune';
    return 'is-pass';
  }

  shortLabel(frame) {
    return frame.label || frame.id;
  }

  bridgeSpec(manifest, pair) {
    const a = pair.fromMetrics;
    const b = pair.toMetrics;
    const cellW = mean(a.sourceWidth, b.sourceWidth);
    const cellH = mean(a.sourceHeight, b.sourceHeight);
    const targetBaseline = mean(a.bottom, b.bottom);
    const targetCenter = mean(a.centerX, b.centerX);
    const targetHeight = mean(a.height, b.height);
    const targetWidth = mean(a.width, b.width);
    const lowerAnchor = mean(a.lowerAnchorX, b.lowerAnchorX);
    const scoreTarget = Math.max(pair.thresholds.passScore, 80);

    return `PRIZIM CONTINUITY GATE v0.3\n${manifest.displayName} • ${pair.fromFrame.label || pair.fromFrame.id} → ${pair.toFrame.label || pair.toFrame.id}\nDECISION: ${pair.status === 'BRIDGE' ? 'BRIDGE CANDIDATE' : pair.status}\nCURRENT GATE SCORE: ${pair.score}/100\n\nUSE BOTH ENDPOINT AUTHORITY FRAMES AS STRICT REFERENCES.\n\nLOCK\n- exact character identity, age, face, skin tone, hair, costume, materials, trim, props, and established visual design\n- same camera angle, lens feel, crop, orientation, and cell dimensions\n- preserve the endpoint art style; do not redesign or reinterpret the character\n- baseline target: ${targetBaseline.toFixed(1)} px ± ${(cellH * 0.02).toFixed(1)} px within the source cell\n- visible body center X target: ${targetCenter.toFixed(1)} px ± ${(cellW * 0.025).toFixed(1)} px\n- visible body height target: ${targetHeight.toFixed(1)} px ± ${(targetHeight * 0.05).toFixed(1)} px\n- visible silhouette width target: ${targetWidth.toFixed(1)} px ± ${(targetWidth * 0.07).toFixed(1)} px\n- lower-body anchor X target: ${lowerAnchor.toFixed(1)} px ± ${(cellW * 0.035).toFixed(1)} px\n\nCHANGE ONLY\n- interpolate the pose, prop trajectory, cloth/hair follow-through, and already-established energy progression required to move from the source frame toward the target frame\n- preserve all identity and costume geometry not required by that motion\n\nTARGET INTERPOLATION\n- create one 50% bridge pose between the two approved endpoint frames\n- preserve foot placement and body mass unless the endpoint motion explicitly requires a shift\n- preserve the direction of staff/orb/gauntlet/energy travel shown by the endpoints\n- no camera movement, zoom, rotation, costume redesign, face redesign, new props, or unrelated new effects\n- do not invent a third pose; the result must visibly belong between the two endpoints\n\nCURRENT FLAGS\n- ${pair.reasons.join('\n- ')}\n\nPOST-GENERATION CONTINUITY GATE\n- target score: ${scoreTarget}+\n- no baseline, center, lower-anchor, height, width, or visible-mass metric may exceed its PriZim threshold by more than 15% without manual review\n- if the candidate fails, repair from the nearer endpoint instead of regenerating the whole character from scratch\n`;
  }
}

const root = document.querySelector('[data-sequence-lab]');
if (root) {
  const gate = new ContinuityGate(root);
  gate.init().catch(error => {
    console.error('PriZim Continuity Gate', error);
  });
}
