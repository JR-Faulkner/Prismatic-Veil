// Battle Presentation v3 — camera polish.
// Intro push, gather push, release snap, hit shake, recover ease.
export default class BattleCamera {
  constructor(scene) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.baseZoom = 1;
  }

  introPush() {
    this.cam.setZoom(1);
    this.scene.tweens.add({
      targets: this.cam,
      zoom: 1.08,
      duration: 250,
      ease: 'Quad.Out',
      yoyo: true,
      hold: 60
    });
  }

  gatherPush() {
    this.scene.tweens.add({
      targets: this.cam,
      zoom: this.baseZoom * 1.045,
      duration: 450,
      ease: 'Sine.easeInOut'
    });
  }

  releaseSnap() {
    this.scene.tweens.add({
      targets: this.cam,
      zoom: this.baseZoom * 1.10,
      duration: 160,
      ease: 'Back.Out'
    });
  }

  hitShake() {
    this.cam.shake(75, 0.006);
  }

  recoverEase() {
    this.scene.tweens.add({
      targets: this.cam,
      zoom: this.baseZoom,
      duration: 260,
      ease: 'Expo.Out'
    });
  }

  reset() {
    this.scene.tweens.killTweensOf(this.cam);
    this.cam.setZoom(this.baseZoom);
  }
}
