// Package 07 — UI audio.
// The spec asks for cursor, hover, confirm, cancel, turn start, low HP
// and victory cues but ships no audio assets, so these are synthesised
// at runtime with the Web Audio API — the same approach the survival
// game uses for its SFX. No files to load, nothing to cache-bust.
export default class UiAudio {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.volume = 0.5;
    this._lowHpArmed = true;
  }

  _ac() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      this.ctx = new AC();
    } catch (err) {
      return null;
    }
    return this.ctx;
  }

  // freq: start pitch, slide: optional end pitch
  _tone(freq, dur, type, vol, delay, slide) {
    const ctx = this._ac();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (vol || 0.05) * this.volume), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  cursor()  { this._tone(660, 0.045, 'square', 0.045, 0, 880); }
  hover()   { this._tone(520, 0.035, 'triangle', 0.03); }
  confirm() { this._tone(523, 0.07, 'triangle', 0.06); this._tone(784, 0.09, 'triangle', 0.05, 0.05); }
  cancel()  { this._tone(300, 0.08, 'sawtooth', 0.045, 0, 180); }

  // Turn handover: a rising pair for the player, a falling one for the foe.
  turnStart(isPlayer) {
    if (isPlayer) {
      this._tone(392, 0.07, 'triangle', 0.05);
      this._tone(587, 0.10, 'triangle', 0.05, 0.06);
    } else {
      this._tone(300, 0.09, 'sawtooth', 0.045);
      this._tone(196, 0.14, 'sawtooth', 0.04, 0.07);
    }
  }

  // Fires once when the hero crosses into the danger band, and re-arms
  // only after they climb back out of it.
  lowHp(ratio) {
    if (ratio > 0.25) { this._lowHpArmed = true; return; }
    if (!this._lowHpArmed || ratio <= 0) return;
    this._lowHpArmed = false;
    this._tone(880, 0.12, 'square', 0.05, 0, 660);
    this._tone(880, 0.12, 'square', 0.05, 0.18, 660);
  }

  victory() {
    [523, 659, 784, 1047].forEach((n, i) =>
      this._tone(n, 0.16, 'triangle', 0.055, i * 0.09));
  }
}
