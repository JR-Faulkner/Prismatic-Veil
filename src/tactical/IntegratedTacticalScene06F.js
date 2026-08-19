// 06F — PHONE-05 safe-area correction for the layered Tactical HUD.
// Keeps 06E's drawer-free/state presentation but fixes the real iPhone portrait
// geometry observed in user screen recording: commands must own a full-width
// row above the hero/target strip, never compete for the tiny gap between them.

import IntegratedTacticalScene06E from './IntegratedTacticalScene06E.js?v=1';

export default class IntegratedTacticalScene06F extends IntegratedTacticalScene06E {
  _layoutPhoneDeck06E(w, h) {
    if (!this._phoneDeck06E) return;
    if (w > h) return super._layoutPhoneDeck06E(w, h);

    const d = this._phoneDeck06E;
    const margin = 8;
    // Keep persistent controls safely above mobile browser chrome. Phaser's
    // RESIZE canvas already tracks the visual viewport, but an extra inset
    // gives the bottom row breathing room on iPhone Safari.
    const safeBottom = 22;
    const deckX = margin;
    const deckW = w - margin * 2;
    const deckH = 142;
    const deckY = h - safeBottom - deckH;

    d.root.setPosition(0, 0);
    d.floor.setPosition(deckX, deckY).setSize(deckW, deckH);
    d.floorGlow.setPosition(deckX + 2, deckY - 4).setSize(deckW - 4, deckH + 6);

    // Bottom info strip: equal-width hero + target cards. These no longer
    // steal horizontal room from the command buttons.
    const panelGap = 6;
    const panelW = (deckW - panelGap - 10) / 2;
    const panelH = 70;
    const panelY = deckY + 64;

    d.heroPanel.setPosition(deckX + 5, panelY);
    d.heroBg.setSize(panelW, panelH);
    const portraitSize = 48;
    d.heroPortraitFrame.setPosition(6, 11).setSize(portraitSize, portraitSize);
    d.heroPortrait.setPosition(6 + portraitSize / 2, 11 + portraitSize / 2).setDisplaySize(42, 42);
    const heroTextX = 6 + portraitSize + (panelW - portraitSize - 8) / 2;
    d.heroName.setPosition(heroTextX, 14).setFontSize(12);
    d.heroHp.setPosition(heroTextX, 31).setFontSize(10);
    d.heroRp.setPosition(heroTextX, 46).setFontSize(9);
    d.heroAttune.setPosition(heroTextX, 59).setFontSize(9);

    d.targetPanel.setPosition(deckX + 5 + panelW + panelGap, panelY);
    d.targetBg.setSize(panelW, panelH);
    d.targetTitle.setPosition(panelW / 2, 13).setFontSize(9);
    d.targetName.setPosition(panelW / 2, 34).setFontSize(11);
    d.targetHp.setPosition(panelW / 2, 54).setFontSize(9);

    // Turn ribbon floats immediately above the command deck.
    const ribbonH = 38;
    const ribbonW = deckW;
    const ribbonX = deckX;
    const ribbonY = deckY - ribbonH + 3;
    d.ribbon.setPosition(ribbonX, ribbonY);
    d.ribbonBg.setSize(ribbonW, ribbonH);
    d.ribbonLabel.setPosition(31, ribbonH / 2).setFontSize(8);

    const chipStart = 62;
    const enemyW = 66;
    const chipAreaW = ribbonW - chipStart - enemyW - 8;
    const chipW = Math.max(54, Math.floor(chipAreaW / Math.max(1, d.heroChips.length)) - 3);
    d.heroChips.forEach((c, i) => {
      const cx = chipStart + chipW * i + chipW / 2 + i * 2;
      c.chip.setPosition(cx, ribbonH / 2);
      c.bg.setSize(chipW, ribbonH - 8);
      c.portrait.setPosition(-chipW / 2 + 15, 0).setDisplaySize(23, 23);
      c.label.setPosition(9, 0).setFontSize(7);
      c.hit.setSize(chipW, ribbonH - 4);
      c.hit.input.hitArea.setTo(0, 0, chipW, ribbonH - 4);
    });
    d.enemySummary.setPosition(ribbonW - enemyW / 2 - 4, ribbonH / 2);
    d.enemyBg.setSize(enemyW, ribbonH - 8);
    d.enemyText.setPosition(0, 0).setFontSize(8);

    this._layoutCommandDeck06FPortrait(w, h, { deckX, deckY, deckW });
  }

  _layoutCommandDeck06FPortrait(w, h, metrics) {
    if (!this._phoneDeck06E || !this.actionConsole || !this.actionMenu) return;

    const { deckX, deckY, deckW } = metrics;
    const visibleEntries = this.actionConsole.entries.filter(entry => {
      const secondary = ['veilshift', 'guard', 'wait'].includes(entry.kind);
      const primary = ['attack', 'resonart', 'attune'].includes(entry.kind);
      return this._moreOpen06E ? secondary : primary;
    });

    const barHeight = 44;
    const { barW } = this.actionConsole.layout(barHeight, 0);
    const moreW = 72;
    const gap = 4;
    const totalW = visibleEntries.length * barW + (visibleEntries.length - 1) * gap + gap + moreW;
    const availableW = deckW - 12;
    const scale = Math.min(1, availableW / totalW);
    const renderedW = totalW * scale;

    // Command row is the TOP layer of the deck, fully visible and centered.
    this.actionMenu.container
      .setPosition(deckX + (deckW - renderedW) / 2, deckY + 7)
      .setScale(scale);

    visibleEntries.forEach((entry, i) => {
      entry.row.setPosition(i * (barW + gap) + barW / 2, barHeight / 2);
    });

    const moreX = visibleEntries.length * (barW + gap) + moreW / 2;
    this._phoneDeck06E.moreBg.setPosition(moreX, barHeight / 2).setDisplaySize(moreW, barHeight);
    this._phoneDeck06E.moreText.setPosition(moreX, barHeight / 2).setFontSize(10);

    // Cancel is intentionally folded into the target/status strip on PHONE-05
    // rather than consuming a hidden second command row below the viewport.
    this.actionMenu.cancelBg.setVisible(false);
  }

  _layoutCommandDeck06E(w, h, metrics = null) {
    if (w <= h && metrics && metrics.deckX !== undefined) {
      return this._layoutCommandDeck06FPortrait(w, h, metrics);
    }
    return super._layoutCommandDeck06E(w, h, metrics);
  }

  layoutHUD() {
    super.layoutHUD();
    if (this.scale.width <= this.scale.height && this.actionMenu?.cancelBg) {
      this.actionMenu.cancelBg.setVisible(false);
    }
  }

  showActionMenuFor(hero) {
    super.showActionMenuFor(hero);
    if (this.scale.width <= this.scale.height && this.actionMenu?.cancelBg) {
      this.actionMenu.cancelBg.setVisible(false);
    }
    this._layoutPhoneDeck06E(this.scale.width, this.scale.height);
  }
}
