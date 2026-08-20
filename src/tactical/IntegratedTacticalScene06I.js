// 06I — PHONE-08 clarity and finish pass.
// Presentation-only refinement over PHONE-07. The 06G command surface remains
// the sole interactive HUD and all combat/state behavior stays inherited.

import IntegratedTacticalScene06H from './IntegratedTacticalScene06H.js?v=1';

export default class IntegratedTacticalScene06I extends IntegratedTacticalScene06H {
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

    // PHONE-08 clarity rule: fewer muddy translucent layers, brighter edges,
    // and stronger separation between interactive controls and information.
    d.deckBg.setFillStyle(0x07111f, 0.96).setStrokeStyle(1.5, 0xd7b95f, 0.88);
    d.ribbonBg.setFillStyle(0x091426, 0.96).setStrokeStyle(1.5, 0x9876c7, 0.82);
    p.deckEdge.setFillStyle(0xf4d77d, 0.88);
    p.ribbonGlow.setFillStyle(0xa983dc, 0.84);
    p.deckSheen.setFillStyle(0x513477, 0.08);

    // Small text loses most of the heavy outline that made the phone render
    // look soft. DPR text resolution remains supplied by the shell.
    d.heroChips.forEach(c => {
      c.label.setStroke('#030611', 1).setShadow(0, 1, '#02040a', 2, true, true);
    });
    d.enemyText.setStroke('#030611', 1).setShadow(0, 1, '#02040a', 2, true, true);
    d.heroName.setStroke('#030611', 1);
    d.heroHp.setStroke('#030611', 1);
    d.heroRp.setStroke('#030611', 1);
    d.heroAttune.setStroke('#030611', 1);
    d.targetTitle.setStroke('#030611', 1);
    d.targetName.setStroke('#030611', 1);
    d.targetInfo.setStroke('#030611', 1);

    if (portrait) {
      // Identity ribbon: larger readable names and portraits, no wasted label.
      const ribbonH = 36;
      const enemyW = 58;
      const chipStart = 6;
      const chipArea = deckW - chipStart - enemyW - 8;
      const chipW = Math.floor(chipArea / 3) - 3;
      d.heroChips.forEach((c, i) => {
        const x = chipStart + chipW * i + chipW / 2 + i * 3;
        c.c.setPosition(x, ribbonH / 2);
        c.bg.setSize(chipW, ribbonH - 6);
        c.portrait.setPosition(-chipW / 2 + 19, 0);
        const portraitSize = c.hero.id === 'auryi' ? 23 : (c.hero.id === 'kineza' ? 26 : 27);
        c.portrait.setDisplaySize(portraitSize, portraitSize);
        c.label.setPosition(14, 0).setFontSize(chipW < 78 ? 8 : 9);
        c.hit.setSize(chipW, ribbonH - 2);
        c.hit.input.hitArea.setTo(0, 0, chipW, ribbonH - 2);
      });
      d.enemyText.setPosition(deckW - enemyW / 2 - 2, ribbonH / 2).setFontSize(9);

      // Bias the information strip toward the active hero. The target/status
      // card is intentionally compact so it never competes with commands.
      const infoY = 58;
      const infoGap = 6;
      const available = deckW - 12 - infoGap;
      const heroW = Math.round(available * 0.64);
      const targetW = available - heroW;
      const panelH = 66;

      d.heroPanel.setPosition(6, infoY);
      d.heroBg.setSize(heroW, panelH).setFillStyle(0x0b1930, 0.99).setStrokeStyle(1.5, 0xe0bf69, 0.92);
      p.heroAccent.setPosition(0, 4).setSize(3, panelH - 8).setFillStyle(0xf0cf73, 0.98);
      d.heroFrame.setPosition(7, 8).setSize(50, 50).setStrokeStyle(2, 0xb78ce6, 0.98);
      d.heroPortrait.setPosition(32, 33);
      const heroTextX = 64 + (heroW - 66) / 2;
      d.heroName.setPosition(heroTextX, 12).setFontSize(13).setColor('#FFF0B8');
      d.heroHp.setPosition(heroTextX, 29).setFontSize(10).setColor('#FFFFFF');
      d.heroRp.setPosition(heroTextX, 44).setFontSize(9).setColor('#DDCAFF');
      d.heroAttune.setPosition(heroTextX, 57).setFontSize(9).setColor('#CDAEFF');

      d.targetPanel.setPosition(6 + heroW + infoGap, infoY);
      d.targetBg.setSize(targetW, panelH).setFillStyle(0x181026, 0.98).setStrokeStyle(1.5, 0xac78d6, 0.9);
      p.targetAccent.setPosition(0, 4).setSize(3, panelH - 8).setFillStyle(0xb97bed, 0.98);
      d.targetTitle.setPosition(targetW / 2, 13).setFontSize(9);
      d.targetName.setPosition(targetW / 2, 34).setFontSize(targetW < 120 ? 10 : 11);
      d.targetInfo.setPosition(targetW / 2, 53).setFontSize(8);

      // Commands are the primary touch targets. Increase label size and edge
      // contrast while retaining 06G geometry and hit zones.
      const kinds = this._moreOpen06G ? ['veilshift', 'guard', 'wait'] : ['attack', 'resonart', 'attune'];
      kinds.forEach(kind => {
        const cmd = d.commands[kind];
        cmd.label
          .setFontSize(kind === 'veilshift' ? 10 : 11)
          .setStroke('#030611', 1)
          .setShadow(0, 1, '#02040a', 2, true, true);
        p.commandGloss[kind].setAlpha(0.24);
      });
      d.moreText.setFontSize(10).setStroke('#030611', 1);
      p.moreGloss.setAlpha(0.22);
    } else {
      // Keep the established landscape geometry but apply the same legibility
      // standard. This is deliberately less invasive than the portrait pass.
      d.heroName.setFontSize(12).setColor('#FFF0B8');
      d.heroHp.setFontSize(10);
      d.heroRp.setFontSize(9);
      d.targetTitle.setFontSize(9);
      d.targetName.setFontSize(11);
      d.heroChips.forEach(c => c.label.setFontSize(8));
      d.enemyText.setFontSize(9);
      Object.values(d.commands).forEach(cmd => {
        cmd.label.setFontSize(10).setStroke('#030611', 1);
      });
    }
  }

  _refreshHud06G() {
    super._refreshHud06G();
    const d = this._phoneHud06G;
    if (!d || !d._premium07) return;

    const selected = this.unitController?.selected;
    const active = selected?.alive ? selected : null;
    const pendingKind = this._pendingAction === 'attack' ? this._pendingActionKind : null;

    // Ribbon state should read immediately without dimming names into mush.
    d.heroChips.forEach(c => {
      const isSelected = c.hero === active;
      const isSpent = c.hero.acted && !isSelected;
      c.c.setAlpha(c.hero.alive ? (isSpent ? 0.70 : 1) : 0.32);
      c.bg.setFillStyle(isSelected ? 0x21365a : 0x111d34, 1);
      c.bg.setStrokeStyle(
        isSelected ? 2.5 : 1.25,
        isSelected ? 0xffdc73 : (c.hero.accent || 0x8e72bd),
        isSelected ? 1 : 0.78
      );
      c.label.setColor(isSelected ? '#FFF0B3' : '#F2F3F8').setAlpha(c.hero.alive ? 1 : 0.45);
    });

    // Disabled controls remain clearly readable but cannot be mistaken for an
    // enabled command. Enabled state is intentionally much brighter than 07.
    Object.values(d.commands).forEach(cmd => {
      if (!cmd.c.visible) return;
      const selectedCommand = pendingKind === cmd.kind;
      if (cmd.enabled) {
        cmd.bg
          .setFillStyle(selectedCommand ? 0x49306b : 0x193052, 1)
          .setStrokeStyle(selectedCommand ? 2.5 : 2, selectedCommand ? 0xd7a1ff : 0xf0cf73, 1);
        cmd.label.setColor(selectedCommand ? '#FFFFFF' : '#FFF0B8').setAlpha(1);
      } else {
        cmd.bg.setFillStyle(0x111827, 0.96).setStrokeStyle(1.5, 0x687086, 0.72);
        cmd.label.setColor('#B6BCCB').setAlpha(0.60);
      }
    });

    d.moreBg
      .setFillStyle(this._moreOpen06G ? 0x49306b : 0x2b1d43, 1)
      .setStrokeStyle(2, this._moreOpen06G ? 0xd3a3ff : 0xb996e6, 0.96);
    d.moreText.setColor('#F2E5FF').setAlpha(active ? 1 : 0.55);

    // Remove redundant tiny copy. The compact card communicates only the
    // current state, and expands semantically when target selection is active.
    if (!active) {
      d.targetTitle.setText('STATUS').setColor('#C9B8E0');
      d.targetName.setText('SELECT HERO').setColor('#FFFFFF');
      d.targetInfo.setText('');
    } else if (this._pendingAction === 'attack') {
      d.targetTitle.setText('TARGET').setColor('#E1C1FF');
      d.targetName.setText('CHOOSE ENEMY').setColor('#FFFFFF');
      d.targetInfo.setText((pendingKind || 'ATTACK').toUpperCase()).setColor('#F0B7FF');
      d.targetBg.setFillStyle(0x2b1838, 1).setStrokeStyle(2, 0xc887f2, 1);
    } else {
      d.targetTitle.setText('STATUS').setColor('#C9B8E0');
      d.targetName.setText('READY').setColor('#FFFFFF');
      d.targetInfo.setText('');
      d.targetBg.setFillStyle(0x181026, 0.98).setStrokeStyle(1.5, 0xac78d6, 0.9);
    }
  }

  layoutHUD() {
    super.layoutHUD();
    // Top-line clarity without increasing its footprint over the battlefield.
    this.turnText.setFontSize(10).setStroke('#030611', 1);
    this.goalPrimaryText.setFontSize(11).setStroke('#030611', 1);
    this.messageText.setFontSize(9).setStroke('#030611', 1);
  }
}
