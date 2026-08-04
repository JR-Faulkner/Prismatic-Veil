export default class BattleHUD {
  constructor(scene, battleConfig) {
    this.scene = scene;
    this.config = battleConfig;
    this._queue = [];
    this._showing = false;
    this._typingEvent = null;
  }

  create() {
    this.container = this.scene.add.container(0, 0);

    this.hpText = this.scene.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#F8E7B0'
    });

    this.veilText = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#8EDCFF'
    });

    this.enemyText = this.scene.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#F4B5C2'
    }).setOrigin(1, 0);

    this.turnText = this.scene.add.text(0, 0, this.config.text.playerTurn, {
      fontSize: '18px',
      color: '#FFE68A'
    }).setOrigin(0.5, 0);

    // Physical HP / Veil bars. Each bar is: dark track, a slow "ghost"
    // layer that lags behind so you see how much was just taken, then
    // the live fill on top.
    const hero = this.config.hero;
    this.bars = {
      heroHp: Object.assign(this._makeBar(0x71ff88, { accent: hero.accent }), { isHeroHp: true }),
      heroVeil: this._makeBar(hero.accent || 0x67c8ff, { accent: hero.accentAlt }),
      enemyHp: this._makeBar(0xa855f7, { accent: 0xc477ff, corrupted: true })
    };

    this.msgBox = this.scene.add.nineslice(
      0,
      0,
      'dialogFrame',
      undefined,
      720,
      120,
      24,
      24,
      24,
      24
    ).setVisible(false);

    // v4 speaker plate: portrait + name tag riding above the dialog box
    this.speakerPlate = this.scene.textures.exists('speakerPlate')
      ? this.scene.add.image(0, 0, 'speakerPlate').setVisible(false)
      : null;
    this.speakerName = this.scene.add.text(0, 0, '', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFE8A0'
    }).setOrigin(0, 0.5).setVisible(false);
    this.speakerPortrait = this.scene.add.image(0, 0, 'portrait_prismel')
      .setVisible(false);
    // Package 07: hero-specific portrait frame drawn around the crop.
    this.portraitFrame = this.scene.add.graphics().setVisible(false);

    this.messageText = this.scene.add.text(0, 0, '', {
      fontSize: '24px',
      color: '#F8E7B0',
      wordWrap: { width: 640 }
    }).setOrigin(0, 0.5).setVisible(false);

    this.msgCursor = this.scene.add.image(0, 0, 'continueCrystal')
      .setDisplaySize(24, 24)
      .setVisible(false);

    this.scene.tweens.add({
      targets: this.msgCursor,
      y: '-=4',
      angle: 8,
      alpha: 0.35,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const barParts = Object.values(this.bars).map(b => b.g);
    const plateParts = [this.speakerPlate, this.portraitFrame, this.speakerPortrait, this.speakerName].filter(Boolean);
    this.container.add([
      ...barParts,
      this.hpText,
      this.veilText,
      this.enemyText,
      this.turnText,
      this.msgBox,
      ...plateParts,
      this.messageText,
      this.msgCursor
    ]);

    this.layout();
    this.refreshFromConfig();

    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.layout, this);
    });
  }

  // Package 07 crystal bar: a faceted shell drawn as graphics, with a
  // chip-damage ghost behind the live fill and hairline fractures that
  // appear as the bar runs low.
  _makeBar(color, opts) {
    const o = opts || {};
    return {
      g: this.scene.add.graphics(),
      color,
      accent: o.accent || color,
      corrupted: !!o.corrupted,
      ratio: 1,
      ghostRatio: 1,
      flash: 0,
      w: 10, h: 8, x: 0, y: 0
    };
  }

  // Faceted outline: a rectangle with angled crystal ends.
  _barPath(g, x, y, w, h, inset) {
    const k = Math.min(h * 0.5, 6) - (inset || 0) * 0.4;
    g.beginPath();
    g.moveTo(x + k, y - h / 2);
    g.lineTo(x + w - k, y - h / 2);
    g.lineTo(x + w, y);
    g.lineTo(x + w - k, y + h / 2);
    g.lineTo(x + k, y + h / 2);
    g.lineTo(x, y);
    g.closePath();
  }

  _drawBar(bar) {
    const { g, x, y, w, h } = bar;
    g.clear();
    // hero HP shifts green -> amber -> red as it empties
    if (bar.isHeroHp) {
      bar.color = bar.ratio > 0.5 ? 0x71ff88 : bar.ratio > 0.25 ? 0xffd56a : 0xff5a6e;
    }

    // shell
    g.fillStyle(0x140f26, 0.92);
    this._barPath(g, x, y, w, h, 0);
    g.fillPath();

    const inner = Math.max(0, w - 4);
    const drawFill = (ratio, color, alpha) => {
      const fw = inner * Math.max(0, Math.min(1, ratio));
      if (fw <= 1) return;
      g.fillStyle(color, alpha);
      this._barPath(g, x + 2, y, fw, h - 4, 1);
      g.fillPath();
    };

    // chip-damage ghost sits behind the live fill
    drawFill(bar.ghostRatio, bar.corrupted ? 0xff9de0 : 0xfff0a8, 0.55);
    drawFill(bar.ratio, bar.color, 1);

    // healing / damage flash
    if (bar.flash > 0.01) drawFill(bar.ratio, 0xffffff, bar.flash * 0.55);

    // hairline fractures once the bar is low
    if (bar.ratio > 0 && bar.ratio < 0.25) {
      const n = 3;
      g.lineStyle(1, 0xffd9d9, 0.5);
      for (let i = 0; i < n; i++) {
        const fx = x + 6 + (inner * bar.ratio) * ((i + 0.5) / n);
        g.beginPath();
        g.moveTo(fx, y - h / 2 + 1);
        g.lineTo(fx + (i % 2 ? 3 : -3), y);
        g.lineTo(fx, y + h / 2 - 1);
        g.strokePath();
      }
    }

    // faceted rim, corrupted styling for the Veil Wraith
    g.lineStyle(1, bar.corrupted ? 0xc477ff : bar.accent, bar.corrupted ? 0.85 : 0.7);
    this._barPath(g, x, y, w, h, 0);
    g.strokePath();
  }

  _layoutBar(bar, x, y, w, h, rightAligned) {
    bar.x = rightAligned ? x - w : x;
    bar.y = y;
    bar.w = w;
    bar.h = h;
    this._drawBar(bar);
  }

  // Fill snaps to the new value quickly; the ghost drains behind it so
  // the hit reads. Fill also shifts toward red as it empties.
  _setBar(bar, ratio, instant) {
    ratio = Math.max(0, Math.min(1, ratio));
    const healing = ratio > bar.ratio;
    const dropping = ratio < bar.ratio;

    if (instant) {
      bar.ratio = ratio;
      bar.ghostRatio = ratio;
      this._drawBar(bar);
      return;
    }

    this.scene.tweens.killTweensOf(bar);
    this.scene.tweens.add({
      targets: bar,
      ratio,
      duration: 260,
      ease: 'Quad.easeOut',
      onUpdate: () => this._drawBar(bar)
    });
    this.scene.tweens.add({
      targets: bar,
      ghostRatio: ratio,
      duration: 620,
      delay: dropping ? 220 : 0,
      ease: 'Quad.easeInOut',
      onUpdate: () => this._drawBar(bar)
    });

    // healing glow
    if (healing) {
      bar.flash = 1;
      this.scene.tweens.add({
        targets: bar,
        flash: 0,
        duration: 520,
        ease: 'Quad.easeOut',
        onUpdate: () => this._drawBar(bar)
      });
    }
  }

  refreshFromConfig(instant) {
    this.updateHP(this.config.hero.hp, this.config.hero.maxHp, instant);
    this.updateVeil(this.config.hero.veil);
    this.updateEnemyHP(this.config.enemy.hp, this.config.enemy.maxHp, instant);
  }

  // v3 HUD polish: counters ease toward their new value instead of
  // snapping, and the label flashes on change.
  _tickTo(key, target, instant, render) {
    this._shown = this._shown || {};
    if (instant || this._shown[key] === undefined) {
      this._shown[key] = target;
      render(target);
      return;
    }
    const state = { v: this._shown[key] };
    if (this._counterTweens && this._counterTweens[key]) {
      this._counterTweens[key].stop();
    }
    this._counterTweens = this._counterTweens || {};
    this._counterTweens[key] = this.scene.tweens.add({
      targets: state,
      v: target,
      duration: 420,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        this._shown[key] = state.v;
        render(Math.round(state.v));
      },
      onComplete: () => {
        this._shown[key] = target;
        render(target);
      }
    });
  }

  _flash(label, color) {
    this.scene.tweens.killTweensOf(label);
    label.setScale(1);
    this.scene.tweens.add({
      targets: label,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 130,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
    const original = label.style.color;
    label.setColor(color);
    this.scene.time.delayedCall(260, () => label.setColor(original));
  }

  layout() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const margin = Math.max(18, Math.round(width * 0.03));
    const dialogWidth = Math.min(720, width - margin * 2);
    const dialogHeight = Math.min(120, Math.max(96, height * 0.20));
    // Extra bottom clearance on phones for the iOS home indicator
    const bottomClear = width < 560 ? margin + 12 : margin;
    const dialogY = height - dialogHeight / 2 - bottomClear;

    // Compact fonts on narrow screens so the top HUD row doesn't collide
    // and the dialog text fits phone portrait widths
    const compact = width < 560;
    this.hpText.setFontSize(compact ? 13 : 20);
    this.enemyText.setFontSize(compact ? 13 : 20);
    this.turnText.setFontSize(compact ? 12 : 18);
    this.messageText.setFontSize(compact ? 17 : 24);
    this.msgCursor.setDisplaySize(compact ? 18 : 24, compact ? 18 : 24);

    // Top HUD rows: name+HP text, then the bars beneath, with the turn
    // indicator on its own row so nothing collides on narrow screens.
    const barW = compact ? Math.min(132, width * 0.34) : 210;
    const barH = compact ? 7 : 9;
    const hpBarY = margin + (compact ? 26 : 42);
    const veilBarY = hpBarY + (compact ? 12 : 16);

    this.hpText.setPosition(margin, margin);
    this.enemyText.setPosition(width - margin, margin);
    this.veilText.setFontSize(compact ? 9 : 13)
      .setPosition(margin + barW * 0.82 + 8, veilBarY - (compact ? 5 : 7));
    this.turnText.setPosition(width / 2, compact ? veilBarY + 12 : margin);

    this._layoutBar(this.bars.heroHp, margin, hpBarY, barW, barH, false);
    this._layoutBar(this.bars.heroVeil, margin, veilBarY, barW * 0.82, barH - 2, false);
    this._layoutBar(this.bars.enemyHp, width - margin, hpBarY, barW, barH, true);

    this.msgBox.setPosition(width / 2, dialogY);
    this.msgBox.setSize(dialogWidth, dialogHeight);

    this.messageText.setPosition(
      width / 2 - dialogWidth / 2 + 32,
      dialogY
    );
    this.messageText.setWordWrapWidth(dialogWidth - 96, true);

    this.msgCursor.setPosition(
      width / 2 + dialogWidth / 2 - 34,
      dialogY + dialogHeight / 2 - 26
    );

    // Speaker plate rides above the dialog box, laid out left-to-right
    // from the box edge so the portrait never clips off screen.
    const dialogLeft = width / 2 - dialogWidth / 2;
    const plateY = dialogY - dialogHeight / 2 - (compact ? 16 : 20);
    const plateScale = compact ? 0.74 : 1;
    const portraitSize = compact ? 40 : 54;

    const portraitX = dialogLeft + portraitSize / 2 + 6;
    this.speakerPortrait
      .setDisplaySize(portraitSize, portraitSize)
      .setPosition(portraitX, plateY);
    this._drawPortraitFrame(portraitX, plateY, portraitSize);

    const plateW = (this.speakerPlate ? this.speakerPlate.width : 260) * plateScale;
    const plateX = portraitX + portraitSize / 2 + 6 + plateW / 2;
    if (this.speakerPlate) this.speakerPlate.setPosition(plateX, plateY).setScale(plateScale);
    this.speakerName.setFontSize(compact ? 12 : 15)
      .setPosition(plateX - plateW / 2 + (compact ? 26 : 34), plateY);
  }

  // Prismel: diamond geometry with a rainbow glint.
  // Kineza: forged angular plate with etched momentum lines.
  _drawPortraitFrame(cx, cy, size) {
    const g = this.portraitFrame;
    if (!g) return;
    const hero = this._frameHero || this.config.hero;
    const r = size * 0.62;
    g.clear();

    if (hero.frameStyle === 'forged') {
      g.lineStyle(2, hero.accent || 0x68ff8c, 0.9);
      g.strokeRect(cx - r * 0.78, cy - r * 0.78, r * 1.56, r * 1.56);
      g.lineStyle(1, hero.accentAlt || 0xd8ffe1, 0.5);
      for (let i = 0; i < 3; i++) {
        const oy = cy - r * 0.4 + i * r * 0.4;
        g.beginPath();
        g.moveTo(cx - r * 0.95, oy);
        g.lineTo(cx - r * 0.8, oy);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx + r * 0.8, oy);
        g.lineTo(cx + r * 0.95, oy);
        g.strokePath();
      }
    } else {
      g.lineStyle(2, hero.accent || 0x67c8ff, 0.9);
      g.beginPath();
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r, cy);
      g.lineTo(cx, cy + r);
      g.lineTo(cx - r, cy);
      g.closePath();
      g.strokePath();
      // rainbow glint along the upper-right facet
      const GL = [0xff6b6b, 0xffef7d, 0x71ff88, 0x67c8ff, 0xc477ff];
      GL.forEach((c, i) => {
        g.lineStyle(1, c, 0.55);
        g.beginPath();
        g.moveTo(cx + r * (0.16 + i * 0.10), cy - r * (0.78 - i * 0.10));
        g.lineTo(cx + r * (0.30 + i * 0.10), cy - r * (0.62 - i * 0.10));
        g.strokePath();
      });
    }
  }

  setTurn(text) {
    const changed = this.turnText.text !== text;
    this.turnText.setText(text);
    if (changed && this.scene.uiAudio) {
      this.scene.uiAudio.turnStart(text === this.config.text.playerTurn);
    }
    // v3: turn glow pulse so the handover reads at a glance
    this.scene.tweens.killTweensOf(this.turnText);
    this.turnText.setAlpha(1).setScale(1);
    this.scene.tweens.add({
      targets: this.turnText,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 180,
      yoyo: true,
      ease: 'Back.easeOut'
    });
    this.scene.tweens.add({
      targets: this.turnText,
      alpha: 0.55,
      duration: 520,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut'
    });
  }

  updateHP(cur, max, instant) {
    const dropped = this.config.hero.hp > cur;
    this.config.hero.hp = cur;
    this._tickTo('hp', cur, instant, v =>
      this.hpText.setText(`${this.config.hero.name.toUpperCase()}  HP ${v}/${max}`));
    this._setBar(this.bars.heroHp, max ? cur / max : 0, instant);
    if (!instant && this.scene.uiAudio) this.scene.uiAudio.lowHp(max ? cur / max : 0);
    if (dropped && !instant) this._flash(this.hpText, '#FF7A7A');
  }

  updateVeil(percent) {
    this.config.hero.veil = percent;
    this.veilText.setText(`VEIL ${percent}%`);
    this._setBar(this.bars.heroVeil, percent / 100, true);
  }

  updateEnemyHP(cur, max, instant) {
    const dropped = this.config.enemy.hp > cur;
    this.config.enemy.hp = cur;
    this._tickTo('ehp', cur, instant, v =>
      this.enemyText.setText(`${this.config.enemy.name.toUpperCase()}  HP ${v}/${max}`));
    this._setBar(this.bars.enemyHp, max ? cur / max : 0, instant);
    if (dropped && !instant) this._flash(this.enemyText, '#FFDF6E');
  }

  _showBox() {
    if (this.msgBox.visible) return;

    this.msgBox.setVisible(true).setAlpha(0);
    this.messageText.setVisible(true).setAlpha(0);

    this.scene.tweens.add({
      targets: [this.msgBox, this.messageText],
      alpha: 1,
      duration: 140
    });
  }

  clearMessage() {
    this.msgBox.setVisible(false);
    this.messageText.setVisible(false);
    this.msgCursor.setVisible(false);
    if (this.portraitFrame) this.portraitFrame.setVisible(false);
    if (this.speakerPlate) this.speakerPlate.setVisible(false);
    this.speakerName.setVisible(false);
    this.speakerPortrait.setVisible(false);
  }

  // speaker: { name, portrait } — omit for narration (plate hides)
  queueMessage(text, onDone, speaker) {
    this._queue.push({ text, onDone, speaker });
    if (!this._showing) this._nextMessage();
  }

  _setSpeaker(speaker) {
    const show = !!(speaker && speaker.name);
    const hasPortrait = show && speaker.portrait &&
      this.scene.textures.exists(speaker.portrait);

    if (this.speakerPlate) this.speakerPlate.setVisible(show);
    this.speakerName.setVisible(show);
    this.speakerPortrait.setVisible(!!hasPortrait);
    if (this.portraitFrame) {
      this._frameHero = (speaker && speaker.hero) || this.config.hero;
      this.portraitFrame.setVisible(!!hasPortrait);
      if (hasPortrait) this.layout();
    }

    if (!show) return;
    this.speakerName.setText(speaker.name);
    if (hasPortrait) this.speakerPortrait.setTexture(speaker.portrait);

    const parts = [this.speakerPlate, this.speakerName, hasPortrait ? this.speakerPortrait : null]
      .filter(Boolean);
    parts.forEach(p => {
      this.scene.tweens.killTweensOf(p);
      p.setAlpha(0);
      this.scene.tweens.add({ targets: p, alpha: 1, duration: 160, ease: 'Quad.easeOut' });
    });
  }

  _nextMessage() {
    const item = this._queue.shift();

    if (!item) {
      this._showing = false;
      return;
    }

    this._showing = true;
    this._showBox();
    this._setSpeaker(item.speaker);
    this.messageText.setText('');
    this.msgCursor.setVisible(false);

    let index = 0;
    this._typingEvent = this.scene.time.addEvent({
      delay: 28,
      repeat: Math.max(0, item.text.length - 1),
      callback: () => {
        index += 1;
        this.messageText.setText(item.text.slice(0, index));

        if (index >= item.text.length) {
          this.msgCursor.setVisible(true);
          this.scene.time.delayedCall(850, () => {
            this.msgCursor.setVisible(false);
            if (item.onDone) item.onDone();
            this._nextMessage();
          });
        }
      }
    });
  }
}
