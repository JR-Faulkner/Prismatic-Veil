// Battle Presentation Alpha v1.0 — portrait state frames.
//
// The brief removes the speaker portrait box from the dialogue, so the
// portrait moves out of the message queue and becomes a permanent HUD
// element: one per combatant, sitting with their HP conduit.
//
// The kit's four frame states map onto combat state directly:
//   idle    — in the battle, not acting
//   active  — this actor's round ("actor portrait synchronizes")
//   hurt    — below a quarter health
//   down    — defeated
//
// Frame colourway is per-actor; the kit ships blue, teal, violet and
// gold, and the frame is tinted toward the actor's accent on top of
// that so Kineza's green and Prismel's violet-blue stay distinguishable.

const STATES = ['idle', 'active', 'hurt', 'down'];

export default class ActorPortrait {
  // colourway: 'blue' | 'teal' | 'violet'
  constructor(scene, opts) {
    this.scene = scene;
    this.colourway = opts.colourway || 'blue';
    this.portraitKey = opts.portrait;
    this.accent = opts.accent || 0xffffff;
    this.state = 'idle';
    this.size = 54;
  }

  _frameTex(state) {
    const key = `kit_pframe_${this.colourway}_${state}`;
    // the violet colourway has no 'down' slice; the Wraith shatters
    // rather than sitting defeated in the HUD
    return this.scene.textures.exists(key)
      ? key
      : `kit_pframe_${this.colourway}_idle`;
  }

  create() {
    const s = this.scene;
    this.container = s.add.container(0, 0);

    this.portrait = this.portraitKey && s.textures.exists(this.portraitKey)
      ? s.add.image(0, 0, this.portraitKey)
      : null;
    this.frame = s.add.image(0, 0, this._frameTex('idle'));

    this.container.add([this.portrait, this.frame].filter(Boolean));
    this.setSize(this.size);
    return this.container;
  }

  setSize(size) {
    this.size = size;
    // The frame art carries its own outer ornament, so the portrait crop
    // sits inside it at about 62% — matching the transparent window the
    // kit leaves in the middle of each frame.
    if (this.portrait) this.portrait.setDisplaySize(size * 0.62, size * 0.62);
    this.frame.setDisplaySize(size, size * (this.frame.height / this.frame.width));
    return this;
  }

  setPosition(x, y) {
    this.container.setPosition(x, y);
    return this;
  }

  setState(state) {
    if (!STATES.includes(state) || state === this.state) return;
    this.state = state;
    this.frame.setTexture(this._frameTex(state));
    this.setSize(this.size);

    if (state === 'down') {
      this.frame.clearTint();
      if (this.portrait) this.portrait.setTint(0x4a4560).setAlpha(0.5);
    } else {
      this.frame.setTint(this.accent);
      if (this.portrait) this.portrait.clearTint().setAlpha(1);
    }

    this.scene.tweens.killTweensOf(this.frame);
    if (state === 'active') this._synchronize();
  }

  // step 1 of the interaction flow — the acting portrait synchronizes.
  _synchronize() {
    const f = this.frame;
    const w = f.displayWidth;
    const h = f.displayHeight;
    f.setDisplaySize(w * 1.16, h * 1.16);
    this.scene.tweens.add({
      targets: f,
      displayWidth: w,
      displayHeight: h,
      duration: 240,
      ease: 'Back.easeOut'
    });
    this._glow = this.scene.tweens.add({
      targets: f,
      alpha: 0.7,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // The idle/hurt states hold steady; only 'active' breathes, so stop
  // the loop whenever the round hands over.
  setIdleFromActive(state) {
    if (this._glow) { this._glow.stop(); this._glow = null; }
    this.frame.setAlpha(1);
    this.setState(state);
  }

  // Health drives hurt/down without the caller tracking thresholds.
  setHealth(ratio) {
    if (ratio <= 0) return this.setIdleFromActive('down');
    if (ratio < 0.25 && this.state !== 'active') return this.setState('hurt');
    if (ratio >= 0.25 && this.state === 'hurt') return this.setState('idle');
  }

  // Impact nudge — the portrait takes the hit with the character.
  flinch() {
    const c = this.container;
    this.scene.tweens.killTweensOf(c);
    const x = c.x;
    this.scene.tweens.add({
      targets: c,
      x: x - 5,
      duration: 60,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => c.setX(x)
    });
  }
}
