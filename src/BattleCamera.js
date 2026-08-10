// Battle Presentation v3 — camera polish.
// Intro push, gather push, release snap, hit shake, recover ease.
export default class BattleCamera {
  constructor(scene) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.baseZoom = 1;
  }

  // Battle entrance: the stage sweeps right to left across the field and
  // settles on the hero, who is already facing right toward the enemy.
  introSweep(duration = 520) {
    const s = this.scene.scale;
    this.cam.setZoom(this.baseZoom * 1.12);
    this.cam.centerOn(s.width * 0.86, s.height * 0.56);
    this.cam.pan(s.width / 2, s.height / 2, duration, 'Quad.easeOut', true);
    this.cam.zoomTo(this.baseZoom, duration, 'Quad.easeOut', true);
  }

  // Centre of the action: midway between the fighters, at their height.
  focusPoint() {
    const s = this.scene;
    const w = s.scale.width, h = s.scale.height;
    const hero = s.heroPoses && s.heroPoses.sprite;
    const foe = s.enemyView && s.enemyView.container;
    // The enemy's own sprite carries the real display height — the
    // container it sits in is never sized via setSize(), so container.height
    // (and displayHeight) is always 0 and previously collapsed the enemy's
    // side of this average down to its bare feet position.
    const foeSprite = s.enemyView && s.enemyView.sprite;
    if (!hero || !foe || !foeSprite) return { x: w / 2, y: h * 0.66 };
    return {
      x: (hero.x + foe.x) / 2,
      y: (hero.y - hero.displayHeight * 0.5 + foe.y - foeSprite.displayHeight * 0.2) / 2
    };
  }

  // Push in on the fighters. The UI camera is separate, so the HUD and
  // dialog box stay put and full size while the world scales up.
  pushIn(zoom, duration, ease) {
    const p = this.focusPoint();
    this.cam.pan(p.x, p.y, duration, ease || 'Sine.easeInOut', true);
    this.cam.zoomTo(this.baseZoom * zoom, duration, ease || 'Sine.easeInOut', true);
  }

  pullOut(duration) {
    const s = this.scene.scale;
    this.cam.pan(s.width / 2, s.height / 2, duration, 'Expo.easeOut', true);
    this.cam.zoomTo(this.baseZoom, duration, 'Expo.easeOut', true);
  }

  // gatherPush/releaseSnap's zoom levels were tuned against Prismel
  // (scaleMul 1) and applied flatly to every hero regardless of their own
  // scaleMul — but a hero's on-screen size before the camera even zooms
  // already varies per hero (BattleConfig.js's scaleMul: Kineza 0.78,
  // Prismel 1, Auryi 1.29). Auryi, the largest, got cropped at the same
  // nominal zoom that reads fine on Prismel and comfortably frames the
  // smaller Kineza. displayHeight scales directly with scaleMul (same
  // canvas-to-content ratio across the roster — see BattleConfig.js's
  // scaleMul comment), so keeping a hero's on-screen size at a given beat
  // consistent with Prismel's baseline means dividing the zoom itself by
  // scaleMul, not just the boost above baseline — a gentler boost-only
  // version was tried first and confirmed (by sampling actual on-screen
  // sprite bounds during the release beat) to still crop Auryi's feet by
  // ~22px. Only applied when scaleMul > 1, so Kineza (0.78, already
  // smaller than baseline) and Prismel (1, the tuning baseline) are
  // completely untouched.
  scaledZoom(zoom, scaleMul) {
    return zoom / Math.max(1, scaleMul || 1);
  }

  gatherPush(scaleMul) {
    this.pushIn(this.scaledZoom(1.32, scaleMul), 450);
  }

  releaseSnap(scaleMul) {
    this.pushIn(this.scaledZoom(1.55, scaleMul), 170, 'Back.easeOut');
  }

  // Package 08: the camera is never quite still — a 1-2px drift keeps
  // the frame alive between beats.
  startIdleBreath() {
    if (this._breath) return;
    const cam = this.cam;
    this._breathState = { t: 0 };
    this._breath = this.scene.tweens.add({
      targets: this._breathState,
      t: Math.PI * 2,
      duration: 7200,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        // only breathe at rest, so it never fights a pan or zoom
        if (Math.abs(cam.zoom - this.baseZoom) > 0.01) return;
        this._breathOffX = Math.sin(this._breathState.t) * 1.6;
        this._breathOffY = Math.cos(this._breathState.t * 0.7) * 1.1;
        cam.setScroll(this._homeX + this._breathOffX, this._homeY + this._breathOffY);
      }
    });
  }

  markHome() {
    this._homeX = this.cam.scrollX;
    this._homeY = this.cam.scrollY;
  }

  // Victory: drift back and let the frame settle.
  victoryPullOut(duration = 1400) {
    const s = this.scene.scale;
    this.cam.pan(s.width / 2, s.height / 2, duration, 'Sine.easeInOut', true);
    this.cam.zoomTo(this.baseZoom * 0.94, duration, 'Sine.easeInOut', true);
  }

  hitShake(strong) {
    this.cam.shake(strong ? 140 : 75, strong ? 0.012 : 0.006);
  }

  recoverEase() {
    this.pullOut(300);
  }

  reset() {
    this.scene.tweens.killTweensOf(this.cam);
    this.cam.setZoom(this.baseZoom);
    this.cam.centerOn(this.scene.scale.width / 2, this.scene.scale.height / 2);
  }
}
