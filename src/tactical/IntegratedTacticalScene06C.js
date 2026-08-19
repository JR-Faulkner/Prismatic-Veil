// 06C — PriZim phone-first Tactical HUD shell.
//
// This layer now owns the phone composition rather than trying to compress the
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
      ? Math.min(210, Math.max(180, Math.round(w * 0.235)))
      : Math.min(230, Math.max(190, Math.round(w * 0.58)));

    let cardY = margin + (landscape ? 38 : 52);
    this.heroCards.forEach(card => {
      this._layoutHeroCard(card, statusW);
      card.container.setPosition(margin, cardY);
      cardY += card.cardH + 3;
    });

    this._hudDrawerHiddenOffset = margin + statusW + 5;
    if (this.hudHandle && this.hudHandle.bg) {
      const tabW = landscape ? 24 : 26;
      const tabH = landscape ? 72 : 82;
      this.hudHandle.bg.setDisplaySize(tabW, tabH);
    }
    this.hudHandle.container.setPosition(0, Math.min(h - 52, Math.max(82, cardY * 0.5)));

    if (!this.tweens.isTweening(this.heroCardsDrawer)) {
      this.heroCardsDrawer.x = this.hudExpanded ? 0 : -this._hudDrawerHiddenOffset;
    }
  }

  _layoutCommandDock06C(w, h, margin) {
    const landscape = w > h;
    // Maintain the 44px touch floor even when the visible art is slightly
    // slimmer. TacticalActionConsole owns the invisible hit target.
    const barHeight = landscape ? 38 : 40;
    const { barW } = this.actionConsole.layout(barHeight, 0);
    const cols = landscape ? 3 : 2;
    const rows = Math.ceil(this.actionConsole.entries.length / cols);
    const colGap = 4;
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

    // Cancel becomes a compact corner control inside the same visual cluster,
    // not an extra seventh row hanging below the commands.
    const cancelW = 72;
    const cancelH = 28;
    this.actionMenu.cancelBg.setDisplaySize(cancelW, cancelH);
    this.actionMenu.cancelBg.setPosition(gridW - cancelW * 0.5, -cancelH * 0.5 - 4);
    if (this.actionMenu.cancelText) {
      this.actionMenu.cancelText.setPosition(gridW - cancelW * 0.5, -cancelH * 0.5 - 4);
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

    // Phase becomes a micro-chip rather than a top banner.
    const phaseW = landscape ? 112 : 106;
    const phaseH = landscape ? 24 : 23;
    this.phaseFrame
      .setVisible(true)
      .setAlpha(0.88)
      .setDisplaySize(phaseW, phaseH)
      .setPosition(margin + phaseW * 0.5, margin);
    this.turnText
      .setPosition(margin + phaseW * 0.5, margin + phaseH * 0.5)
      .setFontSize(landscape ? 9 : 8);

    // Retire the giant goal plate. The objective is persistent but quiet.
    this.goalFrame.setVisible(false);
    this.goalSecondaryText.setVisible(false);
    this.goalPrimaryText
      .setVisible(true)
      .setText('RESTORE 3 SOUND NODES')
      .setFontFamily('-apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif')
      .setFontStyle('bold')
      .setColor('#EBD995')
      .setFontSize(landscape ? 10 : 9)
      .setWordWrapWidth(landscape ? 220 : Math.max(150, w - phaseW - margin * 4))
      .setPosition(
        landscape ? w * 0.5 : w - margin - Math.max(76, (w - phaseW - margin * 4) * 0.5),
        margin + phaseH * 0.5
      );

    // One telemetry line, no narration block.
    this.messageText
      .setFontFamily('-apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif')
      .setColor('#CDBEE6')
      .setFontSize(landscape ? 9 : 8)
      .setWordWrapWidth(w * (landscape ? 0.50 : 0.82))
      .setPosition(w * 0.5, margin + phaseH + 3);
  }

  layoutHUD() {
    super.layoutHUD();

    const w = this.scale.width;
    const h = this.scale.height;
    const landscape = w > h;
    const compact = w < 700 || h < 540;
    const margin = compact ? 7 : 10;

    this._layoutTopTelemetry06C(w, h, margin);
    this._layoutStatusRail06C(w, h, margin);
    this._layoutCommandDock06C(w, h, margin);

    // Map controls are useful, but not important enough to live beside the
    // command cluster. Tuck them into the upper-right when no command menu is
    // active.
    if (!this.actionMenu.container.visible) {
      this.zoomControls.container.setVisible(true);
      this.zoomControls.container.setScale(landscape ? 0.82 : 0.88);
      this.zoomControls.container.setPosition(w - margin - 50, margin + 16);
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
