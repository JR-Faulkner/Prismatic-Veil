// v38A Battle Presence Pass — AmbientBattlefieldDirector.
//
// Owns the battlefield's continuous ambient presence: the far-background
// drift, the crystal midground (drift + shimmer), and the ambient
// fracture pulse — the genuinely new pieces from the brief's layered-
// battlefield roadmap. "Veil haze" and "ambient particles" are already
// covered by BattleAtmosphere's fog banks and motes, and "Combat
// Platform (static)" is BattleAtmosphere's floor layer with its
// parallax factor zeroed out — duplicating any of those here would just
// be two systems drawing the same thing on top of each other, so this
// director layers alongside BattleAtmosphere rather than folding its
// existing, already-tuned system into a rewrite. Never touches camera,
// hit-stop, damage, battle sequencing, or audio — same non-ownership
// boundary as BattleFXDirector.
export default class AmbientBattlefieldDirector {
  constructor(scene) {
    this.scene = scene;
    this._driftX = 0;
    this._fracturePhase = 0;
  }

  w(obj) {
    if (this.scene.worldAdd) this.scene.worldAdd(obj);
    return obj;
  }

  create() {
    // Far Background: drawn wide enough that its slow drift never shows
    // an edge within any realistic session length (0.15px/sec would take
    // ~26 minutes to expose one at this width).
    this.farDrift = this.w(this.scene.add.graphics().setDepth(-95));

    // Crystal Midground: a handful of small procedural shard silhouettes,
    // drifting and gently shimmering.
    this.crystals = [];
    for (let i = 0; i < 6; i++) {
      const c = this.w(this.scene.add.polygon(0, 0, [0, -18, 7, 0, 0, 22, -7, 0], 0x8fd6ff, 0.1).setDepth(-60));
      this.crystals.push(c);
    }

    // Fracture Overlay: an ambient wash distinct from VeilFracture.js's
    // attack-triggered open/close beam effect — this one breathes
    // continuously in the background rather than firing on a command.
    this.fractureOverlay = this.w(this.scene.add.graphics().setDepth(-20));

    this.layout();
    this.scene.events.on('update', this.update, this);
    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.events.off('update', this.update, this);
      this.scene.scale.off('resize', this.layout, this);
    });
  }

  layout() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    this.w_ = w;
    this.h_ = h;

    this.farDrift.clear();
    this.farDrift.fillStyle(0x2a1c4d, 0.05);
    this.farDrift.fillEllipse(w * 0.5, h * 0.35, w * 2.2, h * 0.6);
    this.farDrift.fillEllipse(w * 0.5, h * 0.44, w * 1.8, h * 0.4);

    this.crystals.forEach((c, i) => {
      c.setPosition(
        ((i * 137) % 997) / 997 * w,
        h * (0.15 + (((i * 211) % 719) / 719) * 0.35)
      );
      c.setScale(0.8 + (i % 3) * 0.25);
    });

    this.fractureOverlay.clear();
    this.fractureOverlay.fillStyle(0x6a4fa8, 0.18);
    this.fractureOverlay.fillRect(0, h * 0.35, w, h * 0.4);
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Far Background: 0.15 px/sec continuous drift.
    this._driftX += 0.15 * dt;
    this.farDrift.x = -this._driftX;

    // Crystal Midground: 0.35 px/sec drift, wraps once fully offscreen,
    // plus a slow per-crystal shimmer.
    this.crystals.forEach((c, i) => {
      c.x -= 0.35 * dt;
      if (c.x < -30) c.x = this.w_ + 30;
      c.alpha = 0.06 + Math.abs(Math.sin(time / 1400 + i)) * 0.1;
    });

    // Fracture Overlay: 15-20% opacity, 4.8s pulse.
    this._fracturePhase += dt;
    const phase = (this._fracturePhase % 4.8) / 4.8;
    this.fractureOverlay.alpha = 0.15 + (Math.sin(phase * Math.PI * 2) * 0.5 + 0.5) * 0.05;
  }
}
