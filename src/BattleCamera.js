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
    if (!hero || !foe) return { x: w / 2, y: h * 0.66 };
    return {
      x: (hero.x + foe.x) / 2,
      y: (hero.y - hero.displayHeight * 0.5 + foe.y - foe.height * 0.2) / 2
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

  gatherPush() {
    this.pushIn(1.32, 450);
  }

  releaseSnap() {
    this.pushIn(1.55, 170, 'Back.easeOut');
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
