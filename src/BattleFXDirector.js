// v38A Battle Presence Pass — BattleFXDirector.
//
// Owns combat-triggered visual FX only, built from six small procedural
// layer concepts (Particle, Mist, Ribbon, Distortion, Residual,
// Environmental Overlay). It never touches camera, hit-stop, damage,
// battle sequencing, or audio — those stay BattleFeel's, BattleController's,
// and the audio directors' respectively. BattleFeel is already the sole
// owner of hit-stop/camera-shake (see CLAUDE.md); a second system
// touching either would silently stretch the tuned feel back out, so
// this director is deliberately built to have no path to either.
//
// `type` selects a visual palette so the director isn't hardcoded to one
// hero — Prismel and (v0.4) Auryi's attacks call it; Kineza keeps his
// existing BattleFX-driven identity untouched, per the v38A brief.
// Prismel-specific spectral palette. No kinetic green: green remains Kineza's combat language.
const PRISM = [0x67e8ff, 0x9fd8ff, 0x8f7cff, 0xc7a8ff, 0xffa6d9, 0xff65c8, 0xffffff];

// Auryi's palette (AURYI_BATTLE_FX_PROFILE.md / AURYI_FX_PROFILE_REFERENCE.js):
// gold-white core, lavender ribbons/ripple, soft support green. The hard
// rule from that doc — support green stays close to Auryi, source-local,
// never the attack's projectile/impact core — is why it's a distinct
// `support` field consumed only by _supportAura() below, not folded into
// `shards`/`core`/`ribbon` where the generic layers would happily fire it
// at the target.
const AURYI = [0xfff3c4, 0xffd76a, 0xf3c873, 0xd7b8ff, 0xc8a8ff, 0xffffff];

const PALETTES = Object.freeze({
  prismel: Object.freeze({ core: 0xdff0ff, ribbon: 0x9fd8ff, mist: 0xc7e6ff, shards: PRISM }),
  auryi: Object.freeze({ core: 0xfff3c4, ribbon: 0xc8a8ff, mist: 0xb99aff, shards: AURYI, support: 0x9de5b8 })
});

function paletteFor(type) {
  return PALETTES[type] || PALETTES.prismel;
}

export default class BattleFXDirector {
  constructor(scene) {
    this.scene = scene;
    // Residual FX are tracked per-target so a caller can explicitly clear
    // them (clearResidualFX) rather than relying on a tween to finish —
    // needed if a round ends early (defeat, restart) before it fades out.
    this.residual = new Map();
    this.all = new Set();
  }

  _w(obj) {
    if (this.scene.worldAdd) this.scene.worldAdd(obj);
    this.all.add(obj);
    return obj;
  }

  _done(obj) {
    obj.destroy();
    this.all.delete(obj);
  }

  // --- Particle Layer: small motes/sparks/fragments ---
  _particles(x, y, count, palette, spread, life) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.4 + Math.random() * 0.6);
      const p = this._w(this.scene.add.circle(x, y, Phaser.Math.FloatBetween(1, 2.6),
        palette.shards[i % palette.shards.length], 0.85).setDepth(42));
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: life,
        ease: 'Quad.easeOut',
        onComplete: () => this._done(p)
      });
    }
  }

  // --- Mist Layer: soft alpha-blended glow/haze ---
  _mist(x, y, radius, palette, duration) {
    const m = this._w(this.scene.add.circle(x, y, radius * 0.3, palette.mist, 0.22).setDepth(38));
    this.scene.tweens.add({
      targets: m,
      radius,
      alpha: 0,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => this._done(m)
    });
    return m;
  }

  // --- Ribbon Layer: a flowing curved streak, not a straight beam ---
  _ribbon(a, b, palette, duration) {
    const g = this._w(this.scene.add.graphics().setDepth(45));
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2 - 18;
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(a.x, a.y),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(b.x, b.y)
    );
    const points = curve.getPoints(24);
    g.lineStyle(4, palette.ribbon, 0.85);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => g.lineTo(p.x, p.y));
    g.strokePath();
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => this._done(g)
    });
  }

  // --- Distortion Layer: an unevenly-expanding ring standing in for a
  // refraction shimmer (no shader pipeline — zero CDN, no build step) ---
  _distortion(x, y, palette, duration) {
    const ring = this._w(this.scene.add.ellipse(x, y, 12, 12, 0x000000, 0)
      .setStrokeStyle(2, palette.core, 0.55).setDepth(44));
    this.scene.tweens.add({
      targets: ring,
      scaleX: 5.2,
      scaleY: 3.4,
      alpha: 0,
      duration,
      ease: 'Expo.easeOut',
      onComplete: () => this._done(ring)
    });
  }

  // --- Environmental Overlay Layer: a broad, brief localized wash ---
  _envWash(x, y, palette, duration) {
    const wash = this._w(this.scene.add.circle(x, y, 90, palette.core, 0.10).setDepth(20));
    this.scene.tweens.add({
      targets: wash,
      alpha: 0,
      scaleX: 1.6,
      scaleY: 1.6,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => this._done(wash)
    });
  }

  // --- Support Aura Layer: a soft glow that stays put at `source` and
  // never travels — Auryi's supportive presence, not her attack's core.
  // Only fires when the palette defines `support` (currently just her —
  // AURYI_BATTLE_FX_PROFILE.md's hard rule is that green never becomes
  // the projectile/impact core, so this deliberately has no path to
  // being called with a target position). ---
  _supportAura(x, y, palette, duration) {
    if (!palette.support) return;
    const aura = this._w(this.scene.add.circle(x, y, 22, palette.support, 0.16).setDepth(37));
    this.scene.tweens.add({
      targets: aura,
      radius: 30,
      alpha: 0,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => this._done(aura)
    });
  }

  // ---- Public API ----------------------------------------------------

  // Particle + Mist, staged so the charge visibly escalates rather than
  // dumping every mote at once. Support aura (if the palette has one)
  // expands subtly around the source alongside the charge. Duration
  // defaults to the ~570ms this was originally tuned at (450ms default
  // gather + 120ms default hold) and scales every internal beat
  // proportionally — same "duration matches however long the pose
  // actually holds" principle playProjectileFX already uses, just
  // applied here too so a hero with a longer gather+hold window (see
  // BattleConfig.js attackTiming) actually gets a charge effect that
  // fills it, instead of the effect finishing early and the pose sitting
  // there with nothing left animating.
  playChargeFX(type, source, duration = 570) {
    const palette = paletteFor(type);
    const k = duration / 570;
    this._mist(source.x, source.y, 26, palette, 520 * k);
    this._supportAura(source.x, source.y, palette, 560 * k);
    this.scene.time.delayedCall(40 * k, () => this._particles(source.x, source.y, 4, palette, 20, 380 * k));
    this.scene.time.delayedCall(75 * k, () => this._particles(source.x, source.y, 5, palette, 30, 420 * k));
    this.scene.time.delayedCall(115 * k, () => this._particles(source.x, source.y, 6, palette, 42, 460 * k));
  }

  // Ribbon + Distortion. Duration defaults to the attack's own release
  // beat so the trail's length always matches however long that pose
  // actually holds, rather than a constant tuned for one hero's timing.
  // Support aura (if any) stays at the source while the ribbon travels
  // to the target — it never rides along as part of the projectile.
  playProjectileFX(type, source, target, duration = 160) {
    const palette = paletteFor(type);
    this._ribbon(source, target, palette, duration + 15);
    this._distortion(source.x, source.y, palette, duration * 0.6);
    this._supportAura(source.x, source.y, palette, duration + 60);
  }

  // Particle burst + Distortion ring + a brief Environmental wash.
  playImpactFX(type, target) {
    const palette = paletteFor(type);
    this._particles(target.x, target.y, 12, palette, 70, 560);
    this._distortion(target.x, target.y, palette, 420);
    this._envWash(target.x, target.y, palette, 520);
  }

  // Mist fade + Support Aura contracting back to baseline at the source
  // — Auryi's "energy returns home" recompose beat (AURYI_BATTLE_FX_
  // PROFILE.md's motion thesis: gather inward -> release outward ->
  // energy returns home). No prior BattleController beat called into
  // BattleFXDirector at Recover at all, so this is a new hook, not a
  // rerouted existing one. Harmless/subtle for a palette with no
  // `support` entry (Prismel) — just the soft settle mist.
  playRecoverFX(type, source) {
    const palette = paletteFor(type);
    this._mist(source.x, source.y, 18, palette, 420);
    this._supportAura(source.x, source.y, palette, 380);
  }

  // Residual mist, tracked against `target` so a specific instance can be
  // cleared early rather than left to fade on its own.
  playResidualFX(type, target) {
    const palette = paletteFor(type);
    const mist = this._mist(target.x, target.y, 34, palette, 900);
    const list = this.residual.get(target) || [];
    list.push(mist);
    this.residual.set(target, list);
  }

  clearResidualFX(target) {
    const list = this.residual.get(target);
    if (!list) return;
    list.forEach(obj => {
      this.scene.tweens.killTweensOf(obj);
      try { obj.destroy(); } catch (e) { /* already gone */ }
      this.all.delete(obj);
    });
    this.residual.delete(target);
  }

  clearAll() {
    this.residual.clear();
    this.all.forEach(obj => {
      this.scene.tweens.killTweensOf(obj);
      try { obj.destroy(); } catch (e) { /* already gone */ }
    });
    this.all.clear();
  }
}
