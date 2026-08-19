// 06A — Three-hero Too Quiet tactical wrapper.
//
// Keeps the validated 05M/05I tactical stack and current mobile shell, then:
// 1) installs transparent per-frame QA textures from the approved Auryi/Kineza
//    3x2 signature-sheet proxies;
// 2) swaps in ActiveTurnBattleSlice06A so all three heroes can use the
//    active-turn presentation path;
// 3) stages a deliberately close battleslice=1 test cluster so each hero has
//    an immediate legal Hushling target at their real range.
// Normal Tactical coordinates are untouched when battleslice is absent.

import IntegratedTacticalScene05M from './IntegratedTacticalScene05M.js?v=2';
// v=3 includes the inherited no-argument attack-presenter fix.
import ActiveTurnBattleSlice06A from './ActiveTurnBattleSlice06A.js?v=3';

export default class IntegratedTacticalScene06A extends IntegratedTacticalScene05M {
  preload() {
    super.preload();
    this.load.image('auryi_auorb_qa_sheet', './assets/sequences/qa/auryi_auorb.webp');
    this.load.image('kineza_ignition_qa_sheet', './assets/sequences/qa/kineza_gauntlet_ignition.webp');
  }

  _edgeWhite(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const w = canvas.width, h = canvas.height;
    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    const seen = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0, tail = 0;

    const isWhite = i => {
      const p = i * 4;
      const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];
      if (a < 8) return true;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      return r >= 220 && g >= 220 && b >= 220 && (max - min) <= 38;
    };

    const enqueue = (x, y) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const i = y * w + x;
      if (seen[i] || !isWhite(i)) return;
      seen[i] = 1;
      queue[tail++] = i;
    };

    for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
    for (let y = 1; y < h - 1; y++) { enqueue(0, y); enqueue(w - 1, y); }

    while (head < tail) {
      const i = queue[head++];
      const x = i % w, y = (i / w) | 0;
      data[i * 4 + 3] = 0;
      enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
    }

    ctx.putImageData(image, 0, 0);
  }

  _installSheetFrames(sheetKey, prefix, cols = 3, rows = 2) {
    if (typeof document === 'undefined' || !this.textures.exists(sheetKey)) return;
    const texture = this.textures.get(sheetKey);
    const src = texture.getSourceImage();
    if (!src || !src.width || !src.height) return;

    const cellW = Math.floor(src.width / cols);
    const cellH = Math.floor(src.height / rows);
    for (let i = 0; i < cols * rows; i++) {
      const key = `${prefix}_${i + 1}`;
      if (this.textures.exists(key)) continue;
      const canvas = document.createElement('canvas');
      canvas.width = cellW; canvas.height = cellH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const col = i % cols, row = Math.floor(i / cols);
      ctx.drawImage(src, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
      this._edgeWhite(canvas);
      this.textures.addCanvas(key, canvas);
    }
  }

  _stageThreeHeroQaStart() {
    if (!this._battleSliceEnabled()) return;

    const byHero = id => (this.heroes || []).find(h => h.id === id);
    const byEnemy = id => (this.enemies || []).find(e => e.id === id && e.alive);
    const prismel = byHero('prismel');
    const auryi = byHero('auryi');
    const kineza = byHero('kineza');
    const h1 = byEnemy('hushling_1');
    const h2 = byEnemy('hushling_2');
    const h3 = byEnemy('hushling_3');
    if (!prismel || !auryi || !kineza || !h1 || !h2 || !h3) return;

    // Lawn-side QA cluster, deliberately moved away from Pool Splash (2,9).
    // Every occupied tile below is logical "open" terrain in tactical_map_v2.
    // Auryi range 1-2: (7,5) -> (9,5)
    // Prismel range 2-4: (8,6) -> (10,6)
    // Kineza range 1:   (8,7) -> (9,7)
    this._moveUnitForQa(auryi, 7, 5);
    this._moveUnitForQa(prismel, 8, 6);
    this._moveUnitForQa(kineza, 8, 7);
    this._moveUnitForQa(h1, 9, 5);
    this._moveUnitForQa(h2, 10, 6);
    this._moveUnitForQa(h3, 9, 7);

    if (this.unitController && this.unitController.clearSelection) this.unitController.clearSelection();
    this.grid.clearAllOverlays();
    this.refreshHUD();

    // Run after 05E-3B's own delayed Prismel-only QA recenter so this lawn
    // framing wins deterministically.
    this.time.delayedCall(150, () => {
      const compact = this.scale.width < 560 || this.scale.height < 520;
      this.tacticalCamera.setZoom(compact ? 0.88 : 0.96);
      this.tacticalCamera.focusOn(8.7, 6.2, 0);
      this.setMessage('06A QA: all three heroes begin on the lawn in immediate attack range.');
      this.refreshHUD();
    });
  }

  create() {
    super.create();
    this._installSheetFrames('auryi_auorb_qa_sheet', 'auryi_auorb_tactical');
    this._installSheetFrames('kineza_ignition_qa_sheet', 'kineza_ignition_tactical');
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice06A(this);
    this._stageThreeHeroQaStart();
  }
}
