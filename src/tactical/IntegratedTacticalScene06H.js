// 06H — PHONE-07 premium HUD polish.
// Presentation-only refinement over the clean 06G single-surface HUD.
// No new command system, no legacy drawer, no combat-flow changes.

import IntegratedTacticalScene06G from './IntegratedTacticalScene06G.js?v=1';

export default class IntegratedTacticalScene06H extends IntegratedTacticalScene06G {
  _buildHud06G() {
    super._buildHud06G();
    const d = this._phoneHud06G;
    if (!d || d._premium07) return;

    // Subtle layered accents inside the existing HUD containers. These are
    // decoration only; the 06G buttons remain the sole interactive surface.
    const deckSheen = this.add.rectangle(0, 0, 10, 10, 0x4b2c72, 0.13).setOrigin(0, 0);
    const deckEdge = this.add.rectangle(0, 0, 10, 2, 0xf0d58a, 0.72).setOrigin(0, 0);
    const heroAccent = this.add.rectangle(0, 0, 3, 10, 0xd8ba67, 0.92).setOrigin(0, 0);
    const targetAccent = this.add.rectangle(0, 0, 3, 10, 0xa66cdf, 0.95).setOrigin(0, 0);
    const ribbonGlow = this.add.rectangle(0, 0, 10, 2, 0x8f6cca, 0.72).setOrigin(0, 0);

    d.deck.addAt(deckSheen, 1);
    d.deck.addAt(deckEdge, 2);
    d.heroPanel.addAt(heroAccent, 1);
    d.targetPanel.addAt(targetAccent, 1);
    d.ribbon.addAt(ribbonGlow, 1);

    const commandGloss = {};
    Object.values(d.commands).forEach(cmd => {
      const gloss = this.add.rectangle(0, -15, 10, 4, 0xffe9ad, 0.18).setOrigin(0.5);
      cmd.c.addAt(gloss, 1);
      commandGloss[cmd.kind] = gloss;
    });

    const moreGloss = this.add.rectangle(0, -15, 10, 4, 0xffe9ad, 0.2).setOrigin(0.5);
    d.more.addAt(moreGloss, 1);

    d._premium07 = { deckSheen, deckEdge, heroAccent, targetAccent, ribbonGlow, commandGloss, moreGloss };
  }

  _layoutHud06G() {
    super._layoutHud06G();
    const d = this._phoneHud06G;
    if (!d || !d._premium07) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const portrait = w <= h;
    const margin = 8;
    const deckW = w - margin * 2;
    const p = d._premium07;

    // Richer shell treatment without adding bulk.
    d.deckBg.setFillStyle(0x07101f, 0.91).setStrokeStyle(1.5, 0xbda25f, 0.72);
    p.deckSheen.setPosition(2, 2).setSize(deckW - 4, portrait ? 128 : 78);
    p.deckEdge.setPosition(8, 2).setSize(deckW - 16, 2);

    d.ribbonLabel.setVisible(false);
    d.ribbonBg.setFillStyle(0x08111f, 0.9).setStrokeStyle(1.5, 0x8266ad, 0.7);
    p.ribbonGlow.setPosition(4, 2).setSize(deckW - 8, 2);

    if (portrait) {
      // Reclaim the old TURN label space for larger identity chips.
      const ribbonH = 36;
      const enemyW = 62;
      const chipStart = 8;
      const chipArea = deckW - chipStart - enemyW - 8;
      const chipW = Math.floor(chipArea / 3) - 3;
      d.heroChips.forEach((c, i) => {
        const x = chipStart + chipW * i + chipW / 2 + i * 3;
        c.c.setPosition(x, ribbonH / 2);
        c.bg.setSize(chipW, ribbonH - 7);
        c.portrait.setPosition(-chipW / 2 + 18, 0);
        const portraitSize = c.hero.id === 'auryi' ? 21 : (c.hero.id === 'kineza' ? 24 : 25);
        c.portrait.setDisplaySize(portraitSize, portraitSize);
        c.label.setPosition(13, 0).setFontSize(chipW < 74 ? 7 : 8);
        c.hit.setSize(chipW, ribbonH - 3);
        c.hit.input.hitArea.setTo(0, 0, chipW, ribbonH - 3);
      });
      d.enemyText.setPosition(deckW - enemyW / 2 - 3, ribbonH / 2).setFontSize(8);

      // Give the active hero more room and make TARGET contextual rather than
      // an equal-sized empty box.
      const infoY = 58;
      const infoGap = 6;
      const available = deckW - 12 - infoGap;
      const heroW = Math.round(available * 0.59);
      const targetW = available - heroW;
      const panelH = 66;

      d.heroPanel.setPosition(6, infoY);
      d.heroBg.setSize(heroW, panelH).setFillStyle(0x0a1730, 0.96).setStrokeStyle(1.5, 0xc6aa60, 0.84);
      p.heroAccent.setPosition(0, 5).setSize(3, panelH - 10);
      d.heroFrame.setPosition(7, 10).setSize(46, 46);
      d.heroPortrait.setPosition(30, 33);
      const heroTextX = 60 + (heroW - 62) / 2;
      d.heroName.setPosition(heroTextX, 13).setFontSize(12);
      d.heroHp.setPosition(heroTextX, 29).setFontSize(10);
      d.heroRp.setPosition(heroTextX, 43).setFontSize(9);
      d.heroAttune.setPosition(heroTextX, 56).setFontSize(9);

      d.targetPanel.setPosition(6 + heroW + infoGap, infoY);
      d.targetBg.setSize(targetW, panelH).setFillStyle(0x160e25, 0.94).setStrokeStyle(1.5, 0x9d6ac8, 0.82);
      p.targetAccent.setPosition(0, 5).setSize(3, panelH - 10);
      d.targetTitle.setPosition(targetW / 2, 13).setFontSize(8);
      d.targetName.setPosition(targetW / 2, 32).setFontSize(10);
      d.targetInfo.setPosition(targetW / 2, 50).setFontSize(8);

      // Commands remain full-width, but now read as the primary interaction.
      const kinds = this._moreOpen06G ? ['veilshift', 'guard', 'wait'] : ['attack', 'resonart', 'attune'];
      kinds.forEach(kind => {
        const cmd = d.commands[kind];
        cmd.bg.setStrokeStyle(2, 0xe0bf68, 0.94);
        cmd.label.setFontSize(10).setColor('#FFF1BE').setShadow(0, 1, '#020611', 3, true, true);
        p.commandGloss[kind].setSize(Math.max(34, cmd.bg.width - 14), 3);
      });
      d.moreBg.setStrokeStyle(2, 0xb996e6, 0.92);
      d.moreText.setFontSize(10).setColor('#F0DEFF');
      p.moreGloss.setSize(Math.max(30, d.moreBg.width - 14), 3);
    } else {
      // Landscape keeps 06G geometry but receives the same visual hierarchy.
      p.heroAccent.setPosition(0, 5).setSize(3, Math.max(40, d.heroBg.height - 10));
      p.targetAccent.setPosition(0, 5).setSize(3, Math.max(40, d.targetBg.height - 10));
      Object.values(d.commands).forEach(cmd => {
        cmd.label.setColor('#FFF1BE').setShadow(0, 1, '#020611', 3, true, true);
      });
    }
  }

  _refreshHud06G() {
    super._refreshHud06G();
    const d = this._phoneHud06G;
    if (!d || !d._premium07) return;

    const selected = this.unitController?.selected;
    const active = selected?.alive ? selected : null;

    d.heroChips.forEach(c => {
      const isSelected = c.hero === active;
      c.bg.setFillStyle(isSelected ? 0x18284b : 0x101a31, isSelected ? 1 : 0.94);
      c.bg.setStrokeStyle(isSelected ? 2.5 : 1.25,
        isSelected ? 0xffdc78 : (c.hero.accent || 0x8e72bd),
        isSelected ? 1 : 0.68);
      c.portrait.setAlpha(c.hero.alive ? 1 : 0.35);
    });

    const pending = this._pendingAction === 'attack' ? this._pendingActionKind : null;
    Object.values(d.commands).forEach(cmd => {
      if (!cmd.c.visible) return;
      const selectedCommand = pending === cmd.kind;
      if (cmd.enabled) {
        cmd.bg.setFillStyle(selectedCommand ? 0x3c275e : 0x142542, 0.99);
        cmd.bg.setStrokeStyle(selectedCommand ? 2.5 : 2,
          selectedCommand ? 0xc997ff : 0xe0bf68,
          0.96);
        cmd.label.setAlpha(1);
      } else {
        cmd.bg.setFillStyle(0x0d1422, 0.82).setStrokeStyle(1.5, 0x525a70, 0.54);
        cmd.label.setAlpha(0.38);
      }
    });

    d.moreBg.setFillStyle(this._moreOpen06G ? 0x40285f : 0x211738, 0.99);
    d.moreText.setText(this._moreOpen06G ? 'BACK' : 'MORE');

    if (this._pendingAction === 'attack') {
      d.targetTitle.setText('TARGETING').setColor('#D9B7FF');
      d.targetBg.setFillStyle(0x241232, 0.98).setStrokeStyle(2, 0xb778ea, 0.96);
    } else {
      d.targetTitle.setText(active ? 'ACTION' : 'TARGET').setColor('#CDBEE6');
      d.targetBg.setFillStyle(0x160e25, 0.94).setStrokeStyle(1.5, 0x9d6ac8, 0.82);
      if (active) d.targetInfo.setText('CHOOSE COMMAND');
    }
  }
}
