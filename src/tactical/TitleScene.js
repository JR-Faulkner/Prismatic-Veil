// Title screen — first thing the player sees on tactical-field-v2.html.
// Reuses the original wave-survival prototype's title art/music
// (title_screen.jpg, prism-of-elders.mp3, both at the repo root) rebuilt
// for the current Phaser.Scale.RESIZE architecture — the original was a
// fixed GAME_W/GAME_H scene predating the tactical/battle split, so
// positions here are viewport-relative and re-laid-out on resize rather
// than baked to a constant canvas size.
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    // Background only — fast (~500KB), needed for the very first frame.
    // The music is ~11MB; loading that in preload() would hold the whole
    // title screen behind a loading spinner just to show a static image.
    // It loads lazily in create() instead, well after the title is
    // already visible and interactive.
    this.load.image('title_bg', './title_screen.jpg');
  }

  create() {
    const boot = document.getElementById('loading');
    if (boot) boot.style.display = 'none';

    this.cameras.main.setBackgroundColor('#07060f');

    this.bg = this.add.image(0, 0, 'title_bg');
    this.veil = this.add.rectangle(0, 0, 10, 10, 0x03020a, 0.34).setOrigin(0, 0);
    this.gradientPanel = this.add.rectangle(0, 0, 10, 160, 0x03020a, 0.62).setOrigin(0, 0);
    // A second, denser panel just behind the credit line — the art's
    // ground/reflection detail at the very bottom is bright enough in
    // places that the wider gradient panel alone wasn't reliably dark
    // enough for small light-colored text sitting on top of it.
    this.creditBacking = this.add.rectangle(0, 0, 10, 30, 0x03020a, 0.85).setOrigin(0.5);

    this.crest = this.add.text(0, 0, '✦ PRISMATIC VEIL ✦', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f7e8b6',
      stroke: '#180f29',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.9);

    this.prompt = this.add.text(0, 0, 'TAP OR PRESS ANY KEY', {
      fontFamily: 'Courier New',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#c8a8ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.credit = this.add.text(0, 0, 'Music: Prism of Elders', {
      fontFamily: 'Courier New',
      fontSize: '11px',
      color: '#ffd56a',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(1);

    this.tweens.add({
      targets: this.prompt,
      alpha: { from: 0.35, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    // Small drifting crystal motes, same feel as the original title.
    this.motes = [];
    for (let i = 0; i < 20; i++) {
      const mote = this.add.star(
        0, 0, 4, 2, Phaser.Math.Between(4, 8),
        Phaser.Display.Color.GetColor(
          Phaser.Math.Between(160, 255),
          Phaser.Math.Between(120, 240),
          255
        ),
        0.55
      );
      mote.speed = Phaser.Math.FloatBetween(4, 14);
      mote.seedX = Math.random();
      mote.seedY = Math.random();
      this.motes.push(mote);
    }

    this.layout();
    if (this._resizeHandler) this.scale.off('resize', this._resizeHandler, this);
    this._resizeHandler = () => this.layout();
    this.scale.on('resize', this._resizeHandler, this);

    // Lazy-load the music in the background — the title is already up
    // and interactive by the time this resolves, and a tap before it
    // finishes just starts the game without waiting for it. That used to
    // mean skipping title music for the *entire session* if the tap won
    // the race (very plausible — this is an ~11MB file, and an eager or
    // slow-connection tap easily lands before it's done): beginGame()
    // only ever checked readiness once, at the moment of the tap, and
    // nothing picked the track back up if it finished loading a moment
    // later. _tryStartMusic() (below) now runs from both this load's
    // completion and from beginGame() itself, whichever happens last.
    this._musicReady = false;
    this.load.audio('title_music', './prism-of-elders.mp3');
    this.load.once('complete', () => {
      this._musicReady = true;
      this._tryStartMusic();
    });
    this.load.start();

    this._started = false;
    const begin = () => this.beginGame();
    this.input.once('pointerdown', begin);
    if (this.input.keyboard) this.input.keyboard.once('keydown', begin);
  }

  layout() {
    const w = this.scale.width;
    const h = this.scale.height;

    const scale = Math.max(w / this.bg.width, h / this.bg.height);
    this.bg.setPosition(w / 2, h / 2).setScale(scale);

    this.veil.setPosition(0, 0).setSize(w, h);
    this.gradientPanel.setPosition(0, h - 160).setSize(w, 160);

    this.crest.setPosition(w / 2, h * 0.16);
    this.prompt.setPosition(w / 2, h * 0.82);
    this.credit.setPosition(w / 2, h - 24);
    this.creditBacking.setPosition(w / 2, h - 24)
      .setSize(Math.min(w - 20, this.credit.width + 28), 24);

    this._moteBounds = { top: h * 0.18, bottom: h * 0.78, w, h };
    this.motes.forEach(mote => {
      mote.x = mote.seedX * w;
      mote.y = this._moteBounds.top + mote.seedY * (this._moteBounds.bottom - this._moteBounds.top);
    });
  }

  update(time, delta) {
    if (!this.motes || !this._moteBounds) return;
    const { top, bottom, w } = this._moteBounds;
    this.motes.forEach(mote => {
      mote.y -= mote.speed * delta / 1000;
      mote.rotation += 0.01;
      if (mote.y < top) {
        mote.y = bottom;
        mote.x = Phaser.Math.Between(20, w - 20);
      }
    });
  }

  // Guards this._started/_musicReady/this.music together so it's safe to
  // call from wherever either condition can become true (the tap and the
  // load's own completion, in either order) without double-creating the
  // sound. Also checks `sound.locked` before playing — DAI's own v0.5B
  // tactical-music spec calls this out explicitly (see the matching
  // check in TacticalScene.create()) and title_music was the one place
  // that skipped it, calling `.play()` unconditionally the instant a tap
  // fired. That's fine on a fast desktop unlock, but a real phone's
  // AudioContext can still be mid-unlock in that exact instant even
  // inside a genuine tap handler — playing while still locked doesn't
  // reliably auto-start once it unlocks a moment later, so on a slower
  // device this could mean no title music at all, tap or no tap.
  _tryStartMusic() {
    if (!this._started || !this._musicReady || this.music) return;
    if (this.sound.locked) {
      this.sound.once('unlocked', () => this._tryStartMusic());
      return;
    }
    this.music = this.sound.add('title_music', { loop: true, volume: 0.45 });
    this.music.play();
  }

  beginGame() {
    if (this._started) return;
    this._started = true;
    this._tryStartMusic();

    this.cameras.main.fadeOut(450, 7, 6, 15);
    this.time.delayedCall(470, () => {
      // Deliberately NOT stopping this.music here — same "music didn't
      // just cut off" continuity the original prototype had going from
      // its own title into character select. It's a Sound Manager
      // object findable by key (`this.sound.get('title_music')`) from
      // any scene, not something only TitleScene can reach —
      // TacticalScene.create() crossfades it out into its own tactical
      // theme once the map is up (Tactical didn't have one of its own
      // until v0.5B).
      //
      // scene.launch() + pause() + setVisible(false) instead of
      // scene.start('TacticalScene') — start() would fully shut down
      // this scene's systems, including its LoaderPlugin, which broke
      // the retroactive title-music start above: the still-loading
      // title track's 'complete' event just never fired once this scene
      // was gone, no matter how much later the file actually finished.
      // Paused rather than stopped, this scene's Loader keeps running in
      // the background and can still pick it up.
      this.scale.off('resize', this._resizeHandler, this);
      this.scene.launch('TacticalScene');
      this.scene.pause();
      this.scene.setVisible(false);
    });
  }
}
