// Battle Presentation Alpha v1.0 — tactical command console.
//
// The console is the player's whole input surface on their own round:
// it opens, the player taps a Veil glyph, it closes and hands the
// selection back. It lives on scene.uiLayer, so it never zooms with the
// battlefield camera.
//
// Glyph states come straight from the kit's own language:
//   idle  — attuned and available
//   on    — synchronized, the glyph the player just chose
//   off   — disconnected, not yet attuned to this hero
//
// Nothing here gates a gameplay rule. A disconnected glyph is a slot
// that has no move bound to it yet; selecting one only narrates.

import KitFrame from './KitFrame.js?v=34';

const PLATE_TEX = 'kit_console_plate';

export default class CommandConsole {
  constructor(scene, battleConfig) {
    this.scene = scene;
    this.config = battleConfig;
    this.entries = [];
    this.open = false;
    this._onSelect = null;
    this._locked = false;
  }

  create() {
    const s = this.scene;
    this.container = s.add.container(0, 0).setVisible(false).setAlpha(0);

    this.frame = new KitFrame(s, { fill: 0x0b0819, fillAlpha: 0.94 });
    this.frame.create(this.container);

    // Each glyph gets its own recessed cell. The kit glyphs are dark
    // navy line art, and without a cell behind them they disappear into
    // the frame's own plate on a phone screen.
    this.cells = s.add.graphics();
    this.container.add(this.cells);

    this.plate = s.textures.exists(PLATE_TEX)
      ? s.add.image(0, 0, PLATE_TEX)
      : null;
    this.plateText = s.add.text(0, 0, 'COMMAND', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFE8A0'
    }).setOrigin(0.5);

    this.cursor = s.add.image(0, 0, 'kit_cursor_idle').setVisible(false);

    this.container.add([this.plate, this.plateText, this.cursor].filter(Boolean));
    this.scene.uiLayer.add(this.container);

    this.setHero(this.config.hero);

    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.layout, this);
    });
  }

  // Rebuilds the glyph row for a hero. Their bound attack takes the
  // first slot; the rest are the shared unattuned glyphs.
  setHero(hero) {
    this.entries.forEach(e => {
      e.icon.destroy();
      e.label.destroy();
    });
    this.entries = [];

    const commands = hero.commands || [];
    commands.forEach((cmd, i) => {
      const key = `kit_glyph_${cmd.glyph}`;
      const icon = this.scene.add.image(0, 0, `${key}_${cmd.locked ? 'off' : 'idle'}`)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add.text(0, 0, cmd.label, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: cmd.locked ? '#A79AC8' : '#F8E7B0'
      }).setOrigin(0.5, 0);

      icon.on('pointerdown', e => {
        // the scene's global tap advances the round; a console tap must
        // not do both
        if (e && e.event) e.event.stopPropagation();
        this.select(i);
      });

      this.entries.push({ cmd, icon, label, index: i });
      this.container.add([icon, label]);
    });

    this.hero = hero;
    this._tintPanel(hero);
    this.layout();
  }

  // The kit ships blue, violet, red and ivory colourways; the battle
  // roster is keyed on accent colour, so the blue panel is tinted rather
  // than shipping a sheet slice per hero.
  _tintPanel(hero) {
    const accent = hero.accent || 0x67c8ff;
    this.accent = accent;
    if (this.frame) this.frame.setTint(accent);
    if (this.plate) this.plate.setTint(accent);
    if (this.cursor) this.cursor.setTint(accent);
  }

  _metrics() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const landscape = w > h;
    // Landscape phones are short enough that "narrow" and "short" are the
    // same problem — a wide landscape phone is still only ~390px tall.
    const compact = w < 560 || h < 520;
    const n = Math.max(1, this.entries.length);
    // Glyph taps have to clear a 44px touch target even on the narrowest
    // phone, so the cell width sets the glyph size rather than the other
    // way round.
    // The frame's corner pieces occupy the first ~30px of each end, and
    // the selection cursor sits outside the leftmost cell, so the row
    // has to start well inside the panel.
    // Landscape is a dedicated bottom dock — it no longer borrows the
    // portrait dialogue's clearance or sits across the actors.
    const padX = landscape ? 46 : (compact ? 32 : 40);
    const panelW = landscape
      ? Math.min(540, w - 72)
      : Math.min(compact ? w - 28 : 460, w - 28);
    const cell = (panelW - padX * 2) / n;
    const glyph = Math.max(38, Math.min(landscape ? 52 : (compact ? 46 : 58), cell - 10));
    const cellR = glyph * (landscape ? 0.57 : 0.62);
    const rail = 13;
    const labelH = compact ? 14 : 16;
    const panelH = rail * 2 + cellR * 2 + labelH + (landscape ? 10 : (compact ? 16 : 20));
    return { w, h, landscape, compact, n, padX, panelW, cell, glyph, cellR, rail, labelH, panelH };
  }

  layout() {
    if (!this.container) return;
    const m = this._metrics();
    const panelH = m.panelH;

    // Portrait keeps the console above narration, matching BattleHUD's
    // own dialogue metrics so the two never drift apart. Landscape gives
    // the console the bottom dock instead — narration isn't visible
    // while commands are being chosen there.
    const margin = m.landscape
      ? Math.max(12, Math.round(m.h * 0.035))
      : Math.max(18, Math.round(m.w * 0.03));
    const dialogH = m.compact ? 98 : 110;
    const bottomClear = m.compact ? margin + 12 : margin;
    const cy = m.landscape
      ? m.h - panelH / 2 - margin
      : m.h - dialogH - bottomClear - panelH / 2 - (m.compact ? 10 : 14);
    const top = cy - panelH / 2;

    this.frame.setRect(m.w / 2, cy, m.panelW, panelH);

    // The header plate is pure ornament riding on the top rail — its
    // own gem fills the middle, so there is nowhere to put a caption
    // inside it. The hint line above the battlefield already says what
    // the console is for.
    if (this.plate) {
      const pw = Math.min(m.panelW * 0.34, 108);
      this.plate.setPosition(m.w / 2, top + m.rail * 0.5)
        .setDisplaySize(pw, pw * (this.plate.height / this.plate.width));
    }
    this.plateText.setVisible(false);

    const left = m.w / 2 - m.panelW / 2 + m.padX;
    const cellR = m.cellR;
    // stack downward from the top rail: rail, gap, cell, gap, label
    const glyphY = top + m.rail + (m.compact ? 8 : 10) + cellR;

    this.cells.clear();
    this.entries.forEach((e, i) => {
      const x = left + m.cell * (i + 0.5);
      const locked = !!e.cmd.locked;
      this.cells.fillStyle(locked ? 0x090717 : 0x05040d, locked ? 0.94 : 0.85);
      this.cells.fillRoundedRect(x - cellR, glyphY - cellR, cellR * 2, cellR * 2, 6);
      this.cells.lineStyle(1, locked ? 0x8f7abf : (this.accent || 0x67c8ff),
        locked ? 0.82 : 0.75);
      this.cells.strokeRoundedRect(x - cellR, glyphY - cellR, cellR * 2, cellR * 2, 6);

      if (locked) {
        // Broken-circuit corners read as "disconnected" without burying
        // the glyph under low opacity or a generic red X.
        const gap = Math.max(5, cellR * 0.22);
        const edge = cellR - 5;
        this.cells.lineStyle(2, 0xb09ce8, 0.88);
        this.cells.beginPath();
        this.cells.moveTo(x - edge, glyphY - edge + gap);
        this.cells.lineTo(x - edge + gap, glyphY - edge);
        this.cells.moveTo(x + edge - gap, glyphY + edge);
        this.cells.lineTo(x + edge, glyphY + edge - gap);
        this.cells.strokePath();
        this.cells.fillStyle(0xd8ccff, 0.82);
        this.cells.fillCircle(x - edge + gap, glyphY - edge, 1.5);
        this.cells.fillCircle(x + edge - gap, glyphY + edge, 1.5);
      }
    });

    this.entries.forEach((e, i) => {
      const x = left + m.cell * (i + 0.5);
      e.icon.setDisplaySize(m.glyph, m.glyph).setPosition(x, glyphY);
      // A 44px minimum touch target regardless of how small the glyph
      // renders — Apple's floor, and the kids play on a 390px screen.
      const pad = Math.max(0, (44 - m.glyph) / 2);
      e.icon.input && e.icon.setInteractive(new Phaser.Geom.Rectangle(
        -pad / e.icon.scaleX, -pad / e.icon.scaleY,
        e.icon.width + (pad * 2) / e.icon.scaleX,
        e.icon.height + (pad * 2) / e.icon.scaleY
      ), Phaser.Geom.Rectangle.Contains);
      e.label.setFontSize(m.compact ? 10 : 12)
        .setColor(e.cmd.locked ? '#A79AC8' : '#F8E7B0')
        .setAlpha(e.cmd.locked ? 0.9 : 1)
        .setPosition(x, glyphY + cellR + 3);
      e.x = x;
      e.y = glyphY;
    });

    this.cursor.setDisplaySize(m.glyph * 0.38, m.glyph * 0.46);
    if (this._cursorOn != null && this.entries[this._cursorOn]) {
      const e = this.entries[this._cursorOn];
      this.cursor.setPosition(e.x - cellR - m.glyph * 0.28, e.y);
    }
  }

  // step 2 of the interaction flow — console appears
  show(onSelect) {
    this._onSelect = onSelect;
    this._locked = false;
    this.open = true;
    this._resetGlyphs();

    this.container.setVisible(true);
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(0).setScale(0.94);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    // the glyphs breathe in one at a time so the row reads as a list
    this.entries.forEach((e, i) => {
      this.scene.tweens.killTweensOf(e.icon);
      e.icon.setAlpha(0);
      this.scene.tweens.add({
        targets: e.icon,
        alpha: e.cmd.locked ? 0.82 : 1,
        duration: 180,
        delay: 60 + i * 55,
        ease: 'Quad.easeOut'
      });
    });

    this._pointCursorAt(this.entries.findIndex(e => !e.cmd.locked));
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 0.96,
      scaleY: 0.96,
      duration: 160,
      ease: 'Quad.easeIn',
      onComplete: () => this.container.setVisible(false)
    });
  }

  _resetGlyphs() {
    this.entries.forEach(e => {
      const key = `kit_glyph_${e.cmd.glyph}`;
      e.icon.setTexture(`${key}_${e.cmd.locked ? 'off' : 'idle'}`);
      e.icon.setAlpha(e.cmd.locked ? 0.82 : 1);
      this.scene.tweens.killTweensOf(e.icon);
    });
    this.layout();
  }

  _pointCursorAt(index) {
    if (index < 0 || !this.entries[index]) {
      this.cursor.setVisible(false);
      return;
    }
    this._cursorOn = index;
    const m = this._metrics();
    const e = this.entries[index];
    this.cursor.setVisible(true).setTexture('kit_cursor_idle')
      .setDisplaySize(m.glyph * 0.38, m.glyph * 0.46)
      .setPosition(e.x - m.cellR - m.glyph * 0.28, e.y);
    this.scene.tweens.killTweensOf(this.cursor);
    this.scene.tweens.add({
      targets: this.cursor,
      x: this.cursor.x + 4,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // step 3 — player selects a glyph
  select(index) {
    if (!this.open || this._locked) return;
    const e = this.entries[index];
    if (!e) return;

    if (e.cmd.locked) {
      // Disconnected: refuse, say why, leave the console open.
      if (this.scene.uiAudio) this.scene.uiAudio.cancel();
      this._shake(e.icon);
      if (this.scene.hud) {
        this.scene.hud.queueMessage(`${e.cmd.label} is not attuned yet.`);
      }
      return;
    }

    this._locked = true;
    if (this.scene.uiAudio) this.scene.uiAudio.confirm();
    // v32: BattleFeel's own confirm impulse. The console stays open on
    // this glyph another 260ms before handing off to the reticle's
    // seek() (below), so this never lands on the same beat as that one.
    if (this.scene.battleFeel) this.scene.battleFeel.commandConfirmed();

    // synchronize: the chosen glyph lights, the rest dim away
    const m = this._metrics();
    e.icon.setTexture(`kit_glyph_${e.cmd.glyph}_on`);
    this.cursor.setTexture('kit_cursor_active')
      .setDisplaySize(m.glyph * 0.46, m.glyph * 0.54);
    this.scene.tweens.add({
      targets: e.icon,
      scaleX: e.icon.scaleX * 1.22,
      scaleY: e.icon.scaleY * 1.22,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });
    this.entries.filter(o => o !== e).forEach(o => {
      this.scene.tweens.add({
        targets: o.icon, alpha: 0.2, duration: 180, ease: 'Quad.easeOut'
      });
      this.scene.tweens.add({
        targets: o.label, alpha: 0.25, duration: 180, ease: 'Quad.easeOut'
      });
    });

    this.scene.time.delayedCall(260, () => {
      this.hide();
      this.entries.forEach(o => o.label.setAlpha(1));
      if (this._onSelect) this._onSelect(e.cmd);
    });
  }

  _shake(obj) {
    const x = obj.x;
    this.scene.tweens.killTweensOf(obj);
    this.scene.tweens.add({
      targets: obj,
      x: x + 5,
      duration: 55,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => obj.setX(x)
    });
  }
}
