// 06C — PriZim Tactical Shell pass.
// Promotes the winning shallow-isometric presentation and compresses Tactical's
// phone HUD without changing grid rules, action dispatch, targeting, combat
// state, or the current active-turn bridge inherited from 06A/06B.
//
// PriZim rule applied here: preserve working systems, reduce only the layer
// proven to waste screen space. Existing HUD art/state logic remains intact;
// this wrapper changes registration, scale, and menu topology only.

import IntegratedTacticalViewFlavor06B from './IntegratedTacticalViewFlavor06B.js?v=4';

export default class IntegratedTacticalScene06C extends IntegratedTacticalViewFlavor06B {
  constructor() {
    super();
    this._viewFlavorKey06B = 'shallow';
  }

  _readFlavor06B() {
    return 'shallow';
  }

  _layoutCompactStatus06C(w, h, compact, margin) {
    const landscape = w > h;
    const statusW = Math.min(
      landscape ? 300 : 278,
      Math.max(230, Math.round(w * (landscape ? 0.35 : 0.72)))
    );

    let cardY = margin + (landscape ? 52 : 70);
    this.heroCards.forEach(card => {
      this._layoutHeroCard(card, statusW);
      card.container.setPosition(margin, cardY);
      cardY += card.cardH + 5;
    });

    this._hudDrawerHiddenOffset = margin + statusW + 6;
    this.hudHandle.container.setPosition(0, Math.min(h - 60, Math.max(90, (cardY + margin) * 0.5)));
    if (!this.tweens.isTweening(this.heroCardsDrawer)) {
      this.heroCardsDrawer.x = this.hudExpanded ? 0 : -this._hudDrawerHiddenOffset;
    }
  }

  _layoutCommandGrid06C(w, h, compact, margin) {
    const landscape = w > h;
    const barHeight = landscape ? 34 : 32;
    const gap = 4;
    const { barW } = this.actionConsole.layout(barHeight, gap);
    const cols = landscape ? 3 : 2;
    const rows = Math.ceil(this.actionConsole.entries.length / cols);
    const colGap = landscape ? 4 : 5;
    const rowGap = 4;
    const gridW = cols * barW + (cols - 1) * colGap;
    const gridH = rows * barHeight + (rows - 1) * rowGap;

    this.actionConsole.entries.forEach((entry, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      entry.row.setPosition(
        col * (barW + colGap) + barW * 0.5,
        row * (barHeight + rowGap) + barHeight * 0.5
      );
    });

    const cancelH = 26;
    const cancelW = Math.min(84, Math.max(68, Math.round(barW * 0.52)));
    this.actionMenu.cancelBg.setDisplaySize(cancelW, cancelH);
    this.actionMenu.cancelBg.setPosition(gridW - cancelW * 0.5, gridH + 5 + cancelH * 0.5);

    const totalH = gridH + 5 + cancelH;
    const menuX = landscape
      ? w - margin - gridW
      : Math.max(margin, (w - gridW) * 0.5);
    const menuY = h - margin - totalH;
    this.actionMenu.container.setPosition(menuX, menuY);

    if (this.actionMenu.container.visible) this.zoomControls.container.setVisible(false);
  }

  layoutHUD() {
    super.layoutHUD();

    const w = this.scale.width;
    const h = this.scale.height;
    const landscape = w > h;
    const compact = w < 560 || h < 520;
    const margin = compact ? 8 : 12;

    const phaseW = landscape ? 148 : Math.min(142, w * 0.38);
    const phaseH = Math.round(phaseW * (100 / 555));
    this.phaseFrame.setDisplaySize(phaseW, phaseH).setPosition(margin + phaseW * 0.5, margin);
    this.turnText.setPosition(margin + phaseW * 0.5, margin + phaseH * 0.5)
      .setFontSize(landscape ? 10 : 9);

    this.goalFrame.setVisible(false);
    this.goalSecondaryText.setVisible(false);
    this.goalPrimaryText
      .setVisible(true)
      .setText('RESTORE 3 SOUND NODES')
      .setFontSize(landscape ? 10 : 9)
      .setWordWrapWidth(landscape ? 260 : Math.max(150, w - phaseW - margin * 4))
      .setPosition(
        landscape ? w * 0.5 : w - margin - Math.max(76, (w - phaseW - margin * 4) * 0.5),
        margin + phaseH * 0.5
      );

    this.messageText
      .setFontSize(landscape ? 10 : 9)
      .setWordWrapWidth(w * (landscape ? 0.52 : 0.84))
      .setPosition(w * 0.5, margin + phaseH + 5);

    this._layoutCompactStatus06C(w, h, compact, margin);
    this._layoutCommandGrid06C(w, h, compact, margin);

    if (!this.actionMenu.container.visible) {
      this.zoomControls.container.setVisible(true);
      const y = landscape ? margin + 20 : h - margin - 18;
      this.zoomControls.container.setPosition(w - margin - 58, y);
    }
  }

  refreshHUD() {
    super.refreshHUD();
    const phase = this.phase === 'player' ? 'PLAYER' : 'ENEMY';
    this.turnText.setText(`T${String(this.turn).padStart(2, '0')} • ${phase}`);
    if (this.actionMenu && this.zoomControls) {
      this.zoomControls.container.setVisible(!this.actionMenu.container.visible);
    }
  }

  selectHero(hero) {
    super.selectHero(hero);
    if (this.actionMenu && this.zoomControls) {
      this.zoomControls.container.setVisible(!this.actionMenu.container.visible);
    }
  }

  create() {
    super.create();
    this.time.delayedCall(220, () => {
      this.layoutHUD();
      this.setMessage('06C PRIZIM SHELL • shallow tactical • compact command grid');
      this.refreshHUD();
    });
  }
}
