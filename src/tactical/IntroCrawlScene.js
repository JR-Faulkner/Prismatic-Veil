// Intro Crawl — a Star-Wars-style scrolling story crawl between the
// title screen and the tactical map. TitleScene used to hand off to
// TacticalScene ~470ms after a tap; that left title music almost no
// runway to actually be heard (and made "is it even playing" hard to
// tell) before the map's own crossfade took over. This scene sits
// between the two: black background, the story scrolls for real reading
// time, title music keeps playing underneath exactly as it already did
// on the trip through here (title_music is never touched by this scene —
// it's the same Sound Manager object TitleScene started, found by key,
// same as everywhere else in this project). TacticalScene's own
// crossfade into its tactical theme fires exactly the same way whenever
// this scene hands off to it, regardless of what happened here.
const CRAWL_TITLE = 'THE PRISMATIC VEIL';

const CRAWL_BODY = [
  'For generations, the Veil kept the known world separate from the strange Resonance beyond it.',
  'Now, something has begun to fracture.',
  'Across a forgotten region, ancient Resonance Nodes have fallen silent. Their failure twists the land, draws hostile creatures through the cracks, and weakens the boundary between worlds.',
  'Drawn to the disturbance, Auryi, Prismel, and Kineza enter the fractured zone. Each carries a different bond with Resonance, and each may hold part of the answer to what is awakening beneath the Veil.',
  'Their first task is simple:',
  'Restore the silent nodes.\nSurvive what guards them.\nDiscover why the Veil is breaking.',
  'Beyond the spectrum lies the unknown.'
].join('\n\n');

// Long enough to actually read at a cinematic pace without overstaying
// its welcome — tune here if it ever needs adjusting.
const SCROLL_MS = 30000;
// A tap in the first moment shouldn't skip the whole thing — this is the
// same kind of deliberate-tap gate the rest of the project already uses
// (BP's dialogue, the enemy cut-in) rather than a hair-trigger dismiss.
const SKIP_GRACE_MS = 1500;

export default class IntroCrawlScene extends Phaser.Scene {
  constructor() {
    super('IntroCrawlScene');
  }

  create() {
    this._done = false;
    this._skippable = false;
    if (this._resizeHandler) this.scale.off('resize', this._resizeHandler, this);

    this.cameras.main.setBackgroundColor('#000000');

    // Light starfield for atmosphere — small procedural dots, no texture
    // load needed, same spirit as TitleScene's own drifting motes.
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push(this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.FloatBetween(0.6, 1.6),
        0xffffff,
        Phaser.Math.FloatBetween(0.25, 0.85)
      ));
    }

    this.crawl = this.add.container(this.scale.width / 2, 0);

    // Font sizes are set in layout() (called right below), not here —
    // both need to be a function of viewport width, not a fixed px
    // value, or the header clips on narrower phones (see layout()).
    this.headerText = this.add.text(0, 0, CRAWL_TITLE, {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#f7e8b6',
      align: 'center'
    }).setOrigin(0.5, 0);

    this.bodyText = this.add.text(0, 0, CRAWL_BODY, {
      fontFamily: 'Georgia, serif',
      color: '#f7e8b6',
      align: 'center',
      lineSpacing: 14
    }).setOrigin(0.5, 0);

    this.crawl.add([this.headerText, this.bodyText]);

    this.skipPrompt = this.add.text(0, 0, '▼ Tap to skip', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#c8a8ff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.layout();
    this._resizeHandler = () => this.layout();
    this.scale.on('resize', this._resizeHandler, this);

    this.startScroll();

    this.time.delayedCall(SKIP_GRACE_MS, () => {
      this._skippable = true;
      this.tweens.add({
        targets: this.skipPrompt,
        alpha: { from: 0.35, to: 0.85 },
        duration: 900,
        yoyo: true,
        repeat: -1
      });
    });

    this.input.on('pointerdown', () => { if (this._skippable) this.finish(); });
  }

  layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.crawl.x = w / 2;

    // Header has no word-wrap (one short bold-caps line) — sized as a
    // function of viewport width instead of a fixed px value, so it
    // never overflows a narrow phone. Measured this exact string at
    // 34px: ~364px wide (~10.7px of width per px of font size) — 0.084
    // keeps it comfortably inside the screen with margin at any width,
    // confirmed at 360px CSS width where a fixed 34px was 4px wider
    // than the screen itself. Capped at 34px so it doesn't blow up huge
    // on a wide desktop viewport.
    this.headerText.setFontSize(Math.round(Math.min(34, Math.max(20, w * 0.084))));
    this.bodyText.setFontSize(Math.round(Math.min(20, Math.max(14, w * 0.05))));
    this.bodyText.setPosition(0, this.headerText.height + 40);
    this.bodyText.setWordWrapWidth(Math.min(w * 0.82, 560));
    this.skipPrompt.setPosition(w / 2, h - 28);
    this.stars.forEach(star => {
      if (star.x > w) star.x = Phaser.Math.Between(0, w);
      if (star.y > h) star.y = Phaser.Math.Between(0, h);
    });
  }

  startScroll() {
    const h = this.scale.height;
    const totalHeight = this.headerText.height + 40 + this.bodyText.height;
    this.crawl.y = h + 40;
    this.crawl.setScale(1.15);

    this.tweens.add({
      targets: this.crawl,
      y: -(totalHeight + h * 0.3),
      scale: 0.4,
      duration: SCROLL_MS,
      ease: 'Linear',
      onComplete: () => this.finish()
    });
  }

  finish() {
    if (this._done) return;
    this._done = true;
    this.tweens.killTweensOf(this.crawl);
    this.scale.off('resize', this._resizeHandler, this);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('TacticalScene'));
  }
}
