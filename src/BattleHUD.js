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

    const plateParts = [this.speakerPlate, this.speakerPortrait, this.speakerName].filter(Boolean);
    this.container.add([
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
      ease: 'Quad.Out',
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
      ease: 'Quad.Out'
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
    this.veilText.setFontSize(compact ? 11 : 16);
    this.enemyText.setFontSize(compact ? 13 : 20);
    this.turnText.setFontSize(compact ? 12 : 18);
    this.messageText.setFontSize(compact ? 17 : 24);
    this.msgCursor.setDisplaySize(compact ? 18 : 24, compact ? 18 : 24);

    // On compact screens the turn indicator gets its own row so the
    // three top labels never collide.
    this.hpText.setPosition(margin, margin);
    this.veilText.setPosition(margin, compact ? margin + 20 : margin + 30);
    this.enemyText.setPosition(width - margin, margin);
    this.turnText.setPosition(width / 2, compact ? margin + 24 : margin);

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

    const plateW = (this.speakerPlate ? this.speakerPlate.width : 260) * plateScale;
    const plateX = portraitX + portraitSize / 2 + 6 + plateW / 2;
    if (this.speakerPlate) this.speakerPlate.setPosition(plateX, plateY).setScale(plateScale);
    this.speakerName.setFontSize(compact ? 12 : 15)
      .setPosition(plateX - plateW / 2 + (compact ? 26 : 34), plateY);
  }

  setTurn(text) {
    this.turnText.setText(text);
    // v3: turn glow pulse so the handover reads at a glance
    this.scene.tweens.killTweensOf(this.turnText);
    this.turnText.setAlpha(1).setScale(1);
    this.scene.tweens.add({
      targets: this.turnText,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 180,
      yoyo: true,
      ease: 'Back.Out'
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
    if (dropped && !instant) this._flash(this.hpText, '#FF7A7A');
  }

  updateVeil(percent) {
    this.config.hero.veil = percent;
    this.veilText.setText(`VEIL ${percent}%`);
  }

  updateEnemyHP(cur, max, instant) {
    const dropped = this.config.enemy.hp > cur;
    this.config.enemy.hp = cur;
    this._tickTo('ehp', cur, instant, v =>
      this.enemyText.setText(`${this.config.enemy.name.toUpperCase()}  HP ${v}/${max}`));
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

    if (!show) return;
    this.speakerName.setText(speaker.name);
    if (hasPortrait) this.speakerPortrait.setTexture(speaker.portrait);

    const parts = [this.speakerPlate, this.speakerName, hasPortrait ? this.speakerPortrait : null]
      .filter(Boolean);
    parts.forEach(p => {
      this.scene.tweens.killTweensOf(p);
      p.setAlpha(0);
      this.scene.tweens.add({ targets: p, alpha: 1, duration: 160, ease: 'Quad.Out' });
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
