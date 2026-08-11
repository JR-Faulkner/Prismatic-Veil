// v38A Battle Presence Pass — AmbientBattlefieldDirector.
//
// Owns the battlefield's environment art: five real painted layers
// supplied by DAI (assets/battle/veil_fracture/), stacked back to front
// per LAYER_ORDER.md. Never touches camera, hit-stop, damage, battle
// sequencing, or audio — same non-ownership boundary as BattleFXDirector.
//
// Motion per PARALLAX_SPEC.md:
//   Far Background    ~0.15px/sec independent drift
//   Crystal Midground  camera-relative parallax (factor 0.35, same
//                       convention BattleAtmosphere.updateParallax() uses
//                       for fog/foreground — an offset proportional to the
//                       camera's displacement from home, not a velocity)
//   Combat Platform    static — no motion at all
//   Fracture Overlay   15-20% opacity, ~4.8s pulse
//   Particle Overlay   independent low-density drift, its own slow rate
//
// Every layer is scaled to fully cover the viewport plus a margin wide
// enough that its own motion never exposes an edge (PARALLAX_SPEC.md:
// "Clamp offsets so no empty canvas edges become visible") — the margins
// below are sized generously against the actual drift/parallax speeds,
// not tuned per viewport.
export const BATTLEFIELD_TEXTURES = Object.freeze({
  farBackground: 'battlefield_far_background',
  midSpires: 'battlefield_mid_spires',
  combatPlatform: 'battlefield_combat_platform',
  fractureOverlay: 'battlefield_fracture_overlay',
  particleOverlay: 'battlefield_particle_overlay'
});

export default class AmbientBattlefieldDirector {
  constructor(scene) {
    this.scene = scene;
    this._farDriftPx = 0;
    this._particleDriftPx = 0;
    this._fracturePhase = 0;
  }

  w(obj) {
    if (this.scene.worldAdd) this.scene.worldAdd(obj);
    return obj;
  }

  create() {
    this.farBackground = this.w(this.scene.add.image(0, 0, BATTLEFIELD_TEXTURES.farBackground).setDepth(-100));
    this.midSpires = this.w(this.scene.add.image(0, 0, BATTLEFIELD_TEXTURES.midSpires).setDepth(-90));
    this.combatPlatform = this.w(this.scene.add.image(0, 0, BATTLEFIELD_TEXTURES.combatPlatform).setDepth(-40));
    this.fractureOverlay = this.w(this.scene.add.image(0, 0, BATTLEFIELD_TEXTURES.fractureOverlay).setDepth(-20));
    this.particleOverlay = this.w(this.scene.add.image(0, 0, BATTLEFIELD_TEXTURES.particleOverlay).setDepth(-10));

    this.layout();
    this.scene.events.on('update', this.update, this);
    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.events.off('update', this.update, this);
      this.scene.scale.off('resize', this.layout, this);
    });
  }

  // Scales an image to fully cover the viewport (the larger of the
  // width/height ratios) plus a margin, then bottom-weights its position
  // — these are ground-plane scene paintings authored with sky/spires
  // extending up and the floor toward the bottom, so cropping excess
  // height off the top reads correctly and cropping off the bottom
  // wouldn't. `bottomBufferPx` leaves a small amount of image hanging
  // past the bottom edge too, so a layer with vertical parallax motion
  // never exposes a gap there.
  _coverFit(img, marginFactor, bottomBufferPx = 24) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const scale = Math.max(w / img.width, h / img.height) * marginFactor;
    const dispH = img.height * scale;
    img.setScale(scale);
    img.setPosition(w / 2, h - dispH / 2 + bottomBufferPx);
    return { x: w / 2, y: h - dispH / 2 + bottomBufferPx };
  }

  layout() {
    // Margins here were sized only against each layer's own drift/
    // parallax speed — they never accounted for BattleCamera itself
    // panning away from canvas-center at all, which it does routinely
    // (pushIn()/focusPoint() on every hero AND enemy attack beat, not
    // just an edge case). Reported directly from a desktop test as a
    // black void with a stray bit of art floating in it — measured
    // directly against a real captured camera state (scrollX 564.7,
    // zoom 1.098 on a 1920-wide canvas): the camera's actual worldView
    // needed coverage out to x=2313, but combatPlatform's old 1.0
    // margin (literally zero slack) only reached x=1920, and
    // farBackground's 1.06 only reached x=1977.6 — both exposing bare
    // canvas well before the camera's real edge. Static/untracked
    // layers (farBackground, combatPlatform, fractureOverlay) now carry
    // enough margin to cover that excursion with real headroom, not
    // just barely; midSpires/particleOverlay already partially track
    // camera motion (see update() below) but got a smaller bump too,
    // since their own tracking only covers part of the movement.
    this._coverFit(this.farBackground, 1.6);
    const midHome = this._coverFit(this.midSpires, 1.4);
    this._coverFit(this.combatPlatform, 1.6);
    this._coverFit(this.fractureOverlay, 1.6);
    const particleHome = this._coverFit(this.particleOverlay, 1.4);

    this.midSpires.homeX = midHome.x;
    this.midSpires.homeY = midHome.y;
    this.particleOverlay.homeX = particleHome.x;
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Far Background: ~0.15px/sec independent drift.
    this._farDriftPx += 0.15 * dt;
    this.farBackground.x = this.scene.scale.width / 2 - this._farDriftPx;

    // Crystal Midground: camera-relative parallax (factor 0.35).
    const cam = this.scene.cameras.main;
    const cx = cam.scrollX + cam.width / 2 - this.scene.scale.width / 2;
    const cy = cam.scrollY + cam.height / 2 - this.scene.scale.height / 2;
    this.midSpires.x = this.midSpires.homeX + cx * 0.35;
    this.midSpires.y = this.midSpires.homeY + cy * 0.35 * 0.6;

    // Combat Platform: static — no per-frame motion at all.

    // Fracture Overlay: 15-20% opacity, ~4.8s pulse.
    this._fracturePhase += dt;
    const phase = (this._fracturePhase % 4.8) / 4.8;
    this.fractureOverlay.alpha = 0.15 + (Math.sin(phase * Math.PI * 2) * 0.5 + 0.5) * 0.05;

    // Particle Overlay: independent low-density drift, its own (slower)
    // rate so it doesn't read as locked to the far background.
    this._particleDriftPx += 0.08 * dt;
    this.particleOverlay.x = this.particleOverlay.homeX - this._particleDriftPx;
  }
}
