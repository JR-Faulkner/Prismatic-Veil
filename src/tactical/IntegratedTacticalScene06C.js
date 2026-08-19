// 06C — PriZim phone-first Tactical HUD shell.
//
// This layer owns the phone composition rather than trying to compress the
// legacy desktop-shaped HUD. Tactical rules, targeting, combat state, camera,
// and the active-turn bridge remain inherited and untouched.
//
// Design target: enchanted instrument panel. Battlefield first, information
// on the edges, compact touch-safe controls, restrained chrome.

import IntegratedTacticalViewFlavor06B from './IntegratedTacticalViewFlavor06B.js?v=9';

export default class IntegratedTacticalScene06C extends IntegratedTacticalViewFlavor06B {
  constructor() {
    super();
    this._viewFlavorKey06B = 'shallow';
  }

  _readFlavor06B() {
    return 'shallow';
  }

  _layoutStatusRail06C(w, h, margin) {
    const landscape = w > h;
    // Detail is secondary on phone. Keep the drawer available, but make its
    // footprint much smaller than the old 300px slab.
    const statusW = landscape
      ? Math.min(214, Math.max(190, Math.round(w * 0.24)))
      : Math.min(238, Math.max(204, Math.round(w * 0.61)));

    let cardY = margin + (landscape ? 42 : 58);
    this.heroCards.forEach(card => {
      this._layoutHeroCard(card, statusW);
      card.container.setPosition(margin, cardY);
      cardY += card.cardH + 4;
    });

    this._hudDrawerHiddenOffset = margin + statusW + 5;
    if (this.hudHandle && this.hudHandle.bg) {
      const tabW = landscape ? 26 : 28;
      const tabH = landscape ? 76 : 86;
      this.hudHandle.bg.setDisplaySize(tabW, tabH);
    }
    this.hudHandle.container.setPosition(0, Math.min(h - 54, Math.max(86, cardY * 0.5)));

    if (!this.tweens.isTweening(this.heroCardsDrawer)) {
      this.heroCardsDrawer.x = this.hudExpanded ? 0 : -this._hudDrawerHiddenOffset;
    }
  }

  _layoutCommandDock06C(w, h, margin) {
    const landscape = w > h;
    // Phone pass: the art itself now reaches the touch floor instead of
    // relying on a larger invisible hit target around a visually tiny control.
    const barHeight = landscape ? 44 : 46;
    const { barW } = this.actionConsole.layout(barHeight, 0);
    const cols = landscape ? 3 : 2;
    const rows = Math.ceil(this.actionConsole.entries.length / cols);
    const colGap = landscape ? 5 : 6;
    const rowGap = landscape ? 5 : 6;
    const gridW = cols * barW + (cols - 1) * colGap;
    const gridH = rows * barHeight + (rows - 1) * rowGap;

    this.actionConsole.entries.forEach((entry, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      entry.row.setPosition(
        col * (barW + colGap) + barW * 0.5,
        row * (barHeight + rowGap) + barHeight * 0.5
      );
      if (entry.labelText) {
        entry.labelText
          .setColor('#FFF0BE')
          .setShadow(0, 1, '#050914', 3, true, true);
      }
    });

    // Cancel stays in the command cluster, but is large enough to read and tap
    // without competing with the six primary commands.
    const cancelW = 82;
    const cancelH = 32;
    this.actionMenu.cancelBg.setDisplaySize(cancelW, cancelH);
    this.actionMenu.cancelBg.setPosition(gridW - cancelW * 0.5, -cancelH * 0.5 - 5);
    if (this.actionMenu.cancelText) {
      this.actionMenu.cancelText
        .setPosition(gridW - cancelW * 0.5, -cancelH * 0.5 - 5)
        .setFontSize(11)
        .setShadow(0, 1, '#050914', 2, true, true);
    }

    const menuX = landscape
      ? w - margin - gridW
      : Math.max(margin, (w - gridW) * 0.5);
    const menuY = h - margin - gridH;
    this.actionMenu.container.setPosition(menuX, menuY);

    if (this.actionMenu.container.visible) this.zoomControls.container.setVisible(false);
  }

  _layoutTopTelemetry06C(w, h, margin) {
    const landscape = w > h;

    // Phase is still compact, but no longer microscopically typeset on phone.
    const phaseW = landscape ? 126 : 118;
    const phaseH = landscape ? 29 : 28;
    this.phaseFrame
      .setVisible(true)
      .setAlpha(0.92)
      .setDisplaySize(phaseW, phaseH)
      .setPosition(margin + phaseW * 0.5, margin);
    this.turnText
      .setPosition(margin + phaseW * 0.5, margin + phaseH * 0.5)
      .setFontSize(landscape ? 11 : 10)
      .setColor('#FFF0BE')
      .setShadow(0, 1, '#050914', 2, true, true);

    // Retire the giant goal plate. The objective is persistent but quiet.
    this.goalFrame.setVisible(false);
    this.goalSecondaryText.setVisible(false);
    this.goalPrimaryText
      .setVisible(true)
      .setText('RESTORE 3 SOUND NODES')
      .setFontFamily('-apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif')
      .setFontStyle('bold')
      .setColor('#F3DFA1')
      .setFontSize(landscape ? 12 : 11)
      .setShadow(0, 1, '#050914', 2, true, true)
      .setWordWrapWidth(landscape ? 236 : Math.max(158, w - phaseW - margin * 4))
      .setPosition(
        landscape ? w * 0.5 : w - margin - Math.max(80, (w - phaseW - margin * 4) * 0.5),
        margin + phaseH * 0.5
      );

    // One telemetry line, raised to real phone-reading size. Keep copy concise;
    // this is status, not a narration panel.
    this.messageText
      .setFontFamily('-apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif')
      .setColor('#DED1F2')
      .setFontSize(landscape ? 11 : 10)
      .setShadow(0, 1, '#050914', 2, true, true)
      .setWordWrapWidth(w * (landscape ? 0.52 : 0.84))
      .setPosition(w * 0.5, margin + phaseH + 5);
  }

  layoutHUD() {
    super.layoutHUD();

    const w = this.scale.width;
    const h = this.scale.height;
    const landscape = w > h;
    const compact = w < 700 || h < 540;
    const margin = compact ? 8 : 11;

    this._layoutTopTelemetry06C(w, h, margin);
    this._layoutStatusRail06C(w, h, margin);
    this._layoutCommandDock06C(w, h, margin);

    // Map controls are useful, but not important enough to live beside the
    // command cluster. Tuck them into the upper-right when no command menu is
    // active.
    if (!this.actionMenu.container.visible) {
      this.zoomControls.container.setVisible(true);
      this.zoomControls.container.setScale(landscape ? 0.84 : 0.9);
      this.zoomControls.container.setPosition(w - margin - 52, margin + 18);
    } else {
      this.zoomControls.container.setVisible(false);
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
      this.hudExpanded = false;
      this.layoutHUD();
      this.setMessage('TOO QUIET • SELECT A HERO');
      this.refreshHUD();
    });
  }
}
