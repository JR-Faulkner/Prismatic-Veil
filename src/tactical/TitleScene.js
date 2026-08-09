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

    this.crest = this.add.text(0, 0, '✦ PRISMATIC VEIL ✦', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f7e8b6',
      stroke: '#180f29',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.9);

    this.prompt = this.add.text(0, 0, 'TAP TO BEGIN', {
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
      strokeThickness: 2
    }).setOrigin(0.5);

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
    this.events.once('shutdown', () => this.scale.off('resize', this._resizeHandler, this));

    // Lazy-load the music in the background — the title is already up
    // and interactive by the time this resolves, and a tap before it
    // finishes just starts the game without music rather than waiting.
    this._musicReady = false;
    this.load.audio('title_music', './prism-of-elders.mp3');
    this.load.once('complete', () => { this._musicReady = true; });
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
    this.credit.setPosition(w / 2, h - 20);

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

  beginGame() {
    if (this._started) return;
    this._started = true;

    if (this._musicReady) {
      this.music = this.sound.add('title_music', { loop: true, volume: 0.45 });
      this.music.play();
    }

    this.cameras.main.fadeOut(450, 7, 6, 15);
    this.time.delayedCall(470, () => {
      if (this.music) this.music.stop();
      this.scene.start('TacticalScene');
    });
  }
}
