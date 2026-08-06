// Tactical Field Foundation v2 — TacticalCamera.
// Owns pan, zoom, map clamp, active-unit focus, and cinematic state
// save/restore. Never applies damage, never touches turn/objective state —
// purely "where is the camera looking."
export default class TacticalCamera {
  constructor(scene, grid, config) {
    this.scene = scene;
    this.grid = grid;
    this.cam = scene.cameras.main;
    this.zoomMin = config.min;
    this.zoomMax = config.max;
    this._savedState = null;
    this._bounds = null;
  }

  // Recomputed whenever the board's screen-space footprint changes (i.e.
  // on resize, since the isometric projection scale is viewport-derived).
  computeBounds(marginPx = 140) {
    const b = this.grid.screenBounds();
    this._bounds = {
      minX: b.minX - marginPx,
      maxX: b.maxX + marginPx,
      minY: b.minY - marginPx - 60,
      maxY: b.maxY + marginPx + 140
    };
  }

  // Prevents empty void outside the board — clamps scroll so the visible
  // viewport never travels past the board's padded bounds.
  clamp() {
    if (!this._bounds) return;
    const viewW = this.scene.scale.width / this.cam.zoom;
    const viewH = this.scene.scale.height / this.cam.zoom;
    const spanX = Math.max(0, (this._bounds.maxX - this._bounds.minX) - viewW);
    const spanY = Math.max(0, (this._bounds.maxY - this._bounds.minY) - viewH);
    const minScrollX = this._bounds.minX;
    const minScrollY = this._bounds.minY;
    const x = Phaser.Math.Clamp(this.cam.scrollX, minScrollX, minScrollX + spanX);
    const y = Phaser.Math.Clamp(this.cam.scrollY, minScrollY, minScrollY + spanY);
    this.cam.setScroll(x, y);
  }

  panByScreenDelta(dx, dy) {
    this.cam.scrollX -= dx / this.cam.zoom;
    this.cam.scrollY -= dy / this.cam.zoom;
    this.clamp();
  }

  setZoom(z) {
    this.cam.setZoom(Phaser.Math.Clamp(z, this.zoomMin, this.zoomMax));
    this.clamp();
  }

  zoomBy(delta) {
    this.setZoom(this.cam.zoom + delta);
  }

  focusOn(gridX, gridY, durationMs) {
    const p = this.grid.toScreen(gridX, gridY);
    this.scene.tweens.killTweensOf(this.cam);
    this.scene.tweens.add({
      targets: this.cam,
      scrollX: p.x - this.scene.scale.width / (2 * this.cam.zoom),
      scrollY: p.y - this.scene.scale.height / (2 * this.cam.zoom),
      duration: durationMs,
      ease: 'Quad.easeOut',
      onUpdate: () => this.clamp(),
      onComplete: () => this.clamp()
    });
  }

  recenter(durationMs) {
    if (!this._bounds) return;
    const cx = (this._bounds.minX + this._bounds.maxX) / 2;
    const cy = (this._bounds.minY + this._bounds.maxY) / 2;
    this.scene.tweens.killTweensOf(this.cam);
    this.setZoom(this.defaultZoom || 1.0);
    this.scene.tweens.add({
      targets: this.cam,
      scrollX: cx - this.scene.scale.width / (2 * this.cam.zoom),
      scrollY: cy - this.scene.scale.height / (2 * this.cam.zoom),
      duration: durationMs,
      ease: 'Quad.easeOut',
      onUpdate: () => this.clamp(),
      onComplete: () => this.clamp()
    });
  }

  saveCinematicState() {
    this._savedState = {
      scrollX: this.cam.scrollX,
      scrollY: this.cam.scrollY,
      zoom: this.cam.zoom
    };
  }

  // Resolves once the restore tween completes, so a caller can await the
  // exact moment tactical input is safe to re-enable.
  restoreCinematicState(durationMs) {
    return new Promise(resolve => {
      if (!this._savedState) { resolve(); return; }
      const s = this._savedState;
      this.scene.tweens.killTweensOf(this.cam);
      this.scene.tweens.add({
        targets: this.cam,
        scrollX: s.scrollX,
        scrollY: s.scrollY,
        zoom: s.zoom,
        duration: durationMs,
        ease: 'Quad.easeOut',
        onUpdate: () => this.clamp(),
        onComplete: () => {
          this.clamp();
          this._savedState = null;
          resolve();
        }
      });
    });
  }
}
