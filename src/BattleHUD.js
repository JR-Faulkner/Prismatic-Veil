import ActorPortrait from './ActorPortrait.js?v=28';

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

    // Name and HP value are separate labels, left- and right-aligned to
    // the ends of the conduit below them. One combined string overflows
    // its half of a 390px screen and collides with the enemy's.
    this.hpText = this.scene.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#F8E7B0'
    });
    this.hpValue = this.scene.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#F8E7B0'
    }).setOrigin(1, 0);

    this.veilText = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#8EDCFF'
    });

    this.enemyText = this.scene.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#F4B5C2'
    }).setOrigin(1, 0);
    this.enemyValue = this.scene.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#F4B5C2'
    });

    this.turnText = this.scene.add.text(0, 0, this.config.text.playerTurn, {
      fontSize: '18px',
      color: '#FFE68A'
    }).setOrigin(0.5, 0);

    // Physical HP / Veil conduits. Each bar is: dark track, a slow
    // "ghost" layer that lags behind so you see how much was just taken,
    // then the live fill on top.
    //
    // Alpha v1.0 asks for HP and Veil conduits with chip and recharge
    // states. Sheet 02's bars are fixed-length paintings that cannot
    // stretch to an arbitrary fill, so the kit's language — gold caps,
    // faceted gem terminator, chip trail — is reproduced procedurally
    // instead. That also keeps the fill colour driven by hero accent.
    const hero = this.config.hero;
    this.bars = {
      heroHp: Object.assign(this._makeBar(0x71ff88, { accent: hero.accent }), { isHeroHp: true }),
      heroVeil: Object.assign(
        this._makeBar(hero.accent || 0x67c8ff, { accent: hero.accentAlt }),
        { isVeil: true }
      ),
      enemyHp: this._makeBar(0xa855f7, { accent: 0xc477ff, corrupted: true })
    };

    // Portrait state frames. The brief drops the speaker portrait box
    // from the dialogue, so the portrait lives here permanently instead
    // — one per combatant, beside their conduit.
    this.heroPortrait = new ActorPortrait(this.scene, {
      colourway: hero.frameColourway || 'blue',
      portrait: hero.portrait,
      accent: hero.accent
    });
    this.enemyPortrait = new ActorPortrait(this.scene, {
      colourway: this.config.enemy.frameColourway || 'violet',
      portrait: this.config.enemy.portrait,
      accent: this.config.enemy.accent || 0xc477ff
    });
    this.heroPortrait.create();
    this.enemyPortrait.create();

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
    this.container.add([
      ...barParts,
      this.heroPortrait.container,
      this.enemyPortrait.container,
      this.hpText,
      this.hpValue,
      this.veilText,
      this.enemyText,
      this.enemyValue,
      this.turnText,
      this.msgBox,
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
      recharge: 0,
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

    // Veil recharge reads differently from HP healing: instead of a
    // white wash over the whole fill, a bright wavefront travels along
    // the conduit to the new level.
    if (bar.isVeil && bar.recharge > 0.01) {
      const fw = inner * bar.ratio;
      const head = Math.max(4, Math.min(18, w * 0.14));
      const hx = x + 2 + Math.max(0, fw - head) * bar.recharge;
      g.fillStyle(0xffffff, 0.75 * Math.min(1, bar.recharge * 2));
      this._barPath(g, hx, y, head, h - 4, 1);
      g.fillPath();
    }

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
    this.updateVeil(this.config.hero.veil, 'instant');
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
    this.hpText.setFontSize(compact ? 12 : 20);
    this.hpValue.setFontSize(compact ? 12 : 20);
    this.enemyText.setFontSize(compact ? 12 : 20);
    this.enemyValue.setFontSize(compact ? 10 : 15);
    this.turnText.setFontSize(compact ? 12 : 18);
    this.messageText.setFontSize(compact ? 17 : 24);
    this.msgCursor.setDisplaySize(compact ? 18 : 24, compact ? 18 : 24);

    // Top HUD rows: a framed actor portrait on each side, name+HP text
    // beside it, then the conduits beneath. The turn indicator sits on
    // its own row so nothing collides on narrow screens.
    const portraitSize = compact ? 44 : 62;
    const gutter = compact ? 6 : 9;
    const textLeft = margin + portraitSize + gutter;
    const barW = compact
      ? Math.min(118, width * 0.30)
      : 200;
    const barH = compact ? 7 : 9;
    const hpBarY = margin + (compact ? 24 : 38);
    const veilBarY = hpBarY + (compact ? 12 : 16);

    this.heroPortrait.setSize(portraitSize)
      .setPosition(margin + portraitSize / 2, margin + portraitSize / 2 + 2);
    this.enemyPortrait.setSize(portraitSize)
      .setPosition(width - margin - portraitSize / 2, margin + portraitSize / 2 + 2);

    this.hpText.setPosition(textLeft, margin);
    this.hpValue.setPosition(textLeft + barW, margin);
    // "VEIL WRAITH 30/30" does not fit one 118px row on a 390px screen,
    // and the enemy has no Veil conduit, so its HP value drops to the
    // free row where the hero's conduit sits.
    this.enemyText.setPosition(width - textLeft, margin);
    this.enemyValue.setOrigin(1, 0)
      .setPosition(width - textLeft, veilBarY - (compact ? 5 : 7));
    this.veilText.setFontSize(compact ? 9 : 13)
      .setPosition(textLeft + barW * 0.82 + 8, veilBarY - (compact ? 5 : 7));
    this.turnText.setPosition(width / 2, compact ? veilBarY + 14 : margin);

    this._layoutBar(this.bars.heroHp, textLeft, hpBarY, barW, barH, false);
    this._layoutBar(this.bars.heroVeil, textLeft, veilBarY, barW * 0.82, barH - 2, false);
    this._layoutBar(this.bars.enemyHp, width - textLeft, hpBarY, barW, barH, true);

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
  }

  // Alpha v1.0 interaction flow, step 1: the acting portrait
  // synchronizes and the other drops back to idle.
  setActiveActor(who) {
    if (!this.heroPortrait) return;
    const heroRatio = this.config.hero.maxHp
      ? this.config.hero.hp / this.config.hero.maxHp : 1;
    const enemyRatio = this.config.enemy.maxHp
      ? this.config.enemy.hp / this.config.enemy.maxHp : 1;

    if (who === 'hero') {
      this.heroPortrait.setState('active');
      this.enemyPortrait.setIdleFromActive('idle');
      this.enemyPortrait.setHealth(enemyRatio);
    } else {
      this.enemyPortrait.setState('active');
      this.heroPortrait.setIdleFromActive('idle');
      this.heroPortrait.setHealth(heroRatio);
    }
  }

  setTurn(text) {
    const changed = this.turnText.text !== text;
    this.turnText.setText(text);
    if (changed && this.scene.uiAudio) {
      this.scene.uiAudio.turnStart(text === this.config.text.playerTurn);
    }
    // Package 08: the banner fractures apart and reforms on handover.
    if (changed) this._fractureTurnBanner();
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

  // Two ghost copies of the label split apart and fade as it changes.
  _fractureTurnBanner() {
    const t = this.turnText;
    [[-1, -6], [1, 6]].forEach(([dir, dx]) => {
      const shard = this.scene.add.text(t.x, t.y, t.text, t.style)
        .setOrigin(0.5, 0).setDepth(1050).setAlpha(0.7);
      if (this.container) this.container.add(shard);
      this.scene.tweens.add({
        targets: shard,
        x: t.x + dx * 3,
        y: t.y + dir * 5,
        alpha: 0,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    });
  }

  updateHP(cur, max, instant) {
    const dropped = this.config.hero.hp > cur;
    this.config.hero.hp = cur;
    this.hpText.setText(this.config.hero.name.toUpperCase());
    this._tickTo('hp', cur, instant, v =>
      this.hpValue.setText(`${v}/${max}`));
    const ratio = max ? cur / max : 0;
    this._setBar(this.bars.heroHp, ratio, instant);
    if (!instant && this.scene.uiAudio) this.scene.uiAudio.lowHp(ratio);
    if (this.scene.hudFrame) this.scene.hudFrame.setLowHp(ratio);
    if (dropped && !instant) {
      this._flash(this.hpValue, '#FF7A7A');
      this.heroPortrait.flinch();
    }
    this.heroPortrait.setHealth(ratio);
  }

  // The Veil conduit is a readout, not a cost — nothing in the battle is
  // gated on it. It dips when a command fires and recharges before the
  // next round so the conduit has visible chip and recharge states, as
  // the kit asks. Making it an actual resource is a later mechanic.
  updateVeil(percent, mode) {
    const bar = this.bars.heroVeil;
    const previous = this.config.hero.veil;
    this.config.hero.veil = percent;
    this._tickTo('veil', percent, mode === 'instant', v =>
      this.veilText.setText(`VEIL ${v}%`));

    if (mode === 'instant') {
      this._setBar(bar, percent / 100, true);
      bar.recharge = 0;
      return;
    }

    this._setBar(bar, percent / 100);

    if (percent > previous) {
      // recharge wavefront runs the length of the conduit
      this.scene.tweens.killTweensOf(bar, 'recharge');
      bar.recharge = 0;
      this.scene.tweens.add({
        targets: bar,
        recharge: 1,
        duration: 620,
        ease: 'Sine.easeInOut',
        onUpdate: () => this._drawBar(bar),
        onComplete: () => { bar.recharge = 0; this._drawBar(bar); }
      });
    }
  }

  updateEnemyHP(cur, max, instant) {
    const dropped = this.config.enemy.hp > cur;
    this.config.enemy.hp = cur;
    this.enemyText.setText(this.config.enemy.name.toUpperCase());
    this._tickTo('ehp', cur, instant, v =>
      this.enemyValue.setText(`${v}/${max}`));
    const ratio = max ? cur / max : 0;
    this._setBar(this.bars.enemyHp, ratio, instant);
    if (dropped && !instant) {
      this._flash(this.enemyValue, '#FFDF6E');
      this.enemyPortrait.flinch();
    }
    this.enemyPortrait.setHealth(ratio);
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
  }

  // Alpha v1.0 keeps compact combat narration with no speaker portrait
  // box — the acting portrait now lives in the HUD instead, so the
  // dialogue is a single line of text and nothing else.
  queueMessage(text, onDone) {
    this._queue.push({ text, onDone });
    if (!this._showing) this._nextMessage();
  }

  _nextMessage() {
    const item = this._queue.shift();

    if (!item) {
      this._showing = false;
      return;
    }

    this._showing = true;
    this._showBox();
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
