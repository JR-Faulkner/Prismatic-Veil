// 06E — PHONE-04 Tactical HUD overhaul.
// Presentation-only wrapper over 06D: removes the legacy STATUS drawer and
// replaces the phone shell with a layered bottom command deck, active-hero
// block, contextual target block, and horizontal turn-flow ribbon.

import IntegratedTacticalScene06D from './IntegratedTacticalScene06D.js?v=10';

const PRIMARY_KINDS = new Set(['attack', 'resonart', 'attune']);
const SECONDARY_KINDS = new Set(['veilshift', 'guard', 'wait']);

export default class IntegratedTacticalScene06E extends IntegratedTacticalScene06D {
  constructor() {
    super();
    this._moreOpen06E = false;
    this._phoneDeck06E = null;
  }

  _makeDeckText06E(text, size, color = '#F7E4A7', style = 'bold') {
    return this.add.text(0, 0, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif',
      fontSize: `${size}px`,
      fontStyle: style,
      color,
      stroke: '#050914',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5);
  }

  _buildPhoneDeck06E() {
    if (this._phoneDeck06E) return;

    const root = this.add.container(0, 0).setDepth(220);

    const floor = this.add.rectangle(0, 0, 10, 10, 0x071022, 0.84)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, 0xd8ba67, 0.58);
    const floorGlow = this.add.rectangle(0, 0, 10, 10, 0x432867, 0.16)
      .setOrigin(0, 0);

    const heroPanel = this.add.container(0, 0);
    const heroBg = this.add.rectangle(0, 0, 10, 10, 0x0b1530, 0.94)
      .setOrigin(0, 0).setStrokeStyle(1.5, 0xd8ba67, 0.72);
    const heroPortraitFrame = this.add.rectangle(0, 0, 48, 48, 0x111c39, 1)
      .setOrigin(0, 0).setStrokeStyle(2, 0x9e7bd6, 0.9);
    const heroPortrait = this.add.image(0, 0, 'portrait_prismel').setOrigin(0.5).setDisplaySize(42, 42);
    const heroName = this._makeDeckText06E('SELECT HERO', 13);
    const heroHp = this._makeDeckText06E('HP --', 11, '#FFFFFF');
    const heroRp = this._makeDeckText06E('RP --', 10, '#D6C6FF');
    const heroAttune = this._makeDeckText06E('◇ ◇ ◇', 10, '#C8A8FF');
    heroPanel.add([heroBg, heroPortraitFrame, heroPortrait, heroName, heroHp, heroRp, heroAttune]);

    const targetPanel = this.add.container(0, 0);
    const targetBg = this.add.rectangle(0, 0, 10, 10, 0x170d24, 0.94)
      .setOrigin(0, 0).setStrokeStyle(1.5, 0xb07be0, 0.72);
    const targetTitle = this._makeDeckText06E('TARGET', 10, '#CDBEE6');
    const targetName = this._makeDeckText06E('READY', 12, '#FFFFFF');
    const targetHp = this._makeDeckText06E('', 10, '#F3A8B0');
    targetPanel.add([targetBg, targetTitle, targetName, targetHp]);

    const ribbon = this.add.container(0, 0);
    const ribbonBg = this.add.rectangle(0, 0, 10, 10, 0x071022, 0.76)
      .setOrigin(0, 0).setStrokeStyle(1, 0x8e72bd, 0.5);
    const ribbonLabel = this._makeDeckText06E('TURN FLOW', 9, '#D6C6FF');
    ribbon.add([ribbonBg, ribbonLabel]);

    const heroChips = this.heroes.map(hero => {
      const chip = this.add.container(0, 0);
      const bg = this.add.rectangle(0, 0, 10, 10, 0x13203d, 0.96)
        .setOrigin(0.5).setStrokeStyle(1.5, hero.accent || 0xd8ba67, 0.65);
      const portrait = this.add.image(0, 0, hero.portraitKey).setDisplaySize(26, 26).setOrigin(0.5);
      const label = this._makeDeckText06E(hero.name.toUpperCase(), 8, '#FFFFFF');
      const hit = this.add.rectangle(0, 0, 10, 10, 0x000000, 0).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (p, lx, ly, ev) => {
        if (ev) ev.stopPropagation();
        if (p.event) p.event._tacticalUIHandled = true;
        if (this.phase === 'player' && hero.alive && !this.inputLocked) this.selectHero(hero);
      });
      chip.add([bg, portrait, label, hit]);
      ribbon.add(chip);
      return { hero, chip, bg, portrait, label, hit };
    });

    const enemySummary = this.add.container(0, 0);
    const enemyBg = this.add.rectangle(0, 0, 10, 10, 0x281019, 0.96)
      .setOrigin(0.5).setStrokeStyle(1.5, 0xe06f7c, 0.62);
    const enemyText = this._makeDeckText06E('ENEMY ×0', 9, '#FFD3D8');
    enemySummary.add([enemyBg, enemyText]);
    ribbon.add(enemySummary);

    const moreBg = this.add.rectangle(0, 0, 76, 44, 0x211638, 0.98)
      .setOrigin(0.5).setStrokeStyle(1.5, 0xd8ba67, 0.82)
      .setInteractive({ useHandCursor: true });
    const moreText = this._makeDeckText06E('MORE', 11);
    moreBg.on('pointerdown', (p, lx, ly, ev) => {
      if (ev) ev.stopPropagation();
      if (p.event) p.event._tacticalUIHandled = true;
      if (!this.unitController || !this.unitController.selected) return;
      this._moreOpen06E = !this._moreOpen06E;
      moreText.setText(this._moreOpen06E ? 'BACK' : 'MORE');
      this._layoutCommandDeck06E(this.scale.width, this.scale.height);
      this._applyCommandMode06E();
    });

    root.add([floorGlow, floor, heroPanel, targetPanel, ribbon]);
    this.actionMenu.container.add([moreBg, moreText]);
    this.actionMenu.container.setDepth(240);

    this._phoneDeck06E = {
      root, floor, floorGlow,
      heroPanel, heroBg, heroPortraitFrame, heroPortrait, heroName, heroHp, heroRp, heroAttune,
      targetPanel, targetBg, targetTitle, targetName, targetHp,
      ribbon, ribbonBg, ribbonLabel, heroChips, enemySummary, enemyBg, enemyText,
      moreBg, moreText
    };

    this.uiAdd(root);
  }

  _retireDrawer06E() {
    this.hudExpanded = false;
    if (this.heroCardsDrawer) this.heroCardsDrawer.setVisible(false);
    if (this.hudHandle && this.hudHandle.container) this.hudHandle.container.setVisible(false);
    if (this.hudHandle && this.hudHandle.bg && this.hudHandle.bg.disableInteractive) {
      this.hudHandle.bg.disableInteractive();
    }
  }

  toggleHudDrawer() {
    // PHONE-04 intentionally has no drawer.
    this.hudExpanded = false;
  }

  _layoutPhoneDeck06E(w, h) {
    if (!this._phoneDeck06E) return;
    const d = this._phoneDeck06E;
    const landscape = w > h;
    const margin = landscape ? 7 : 8;
    const deckH = landscape ? 82 : 108;
    const deckY = h - deckH - margin;
    const deckX = margin;
    const deckW = w - margin * 2;

    d.root.setPosition(0, 0);
    d.floor.setPosition(deckX, deckY).setSize(deckW, deckH);
    d.floorGlow.setPosition(deckX + 2, deckY - 4).setSize(deckW - 4, deckH + 6);

    const heroW = landscape ? Math.min(210, Math.round(deckW * 0.25)) : Math.round(deckW * 0.48);
    const targetW = landscape ? Math.min(154, Math.round(deckW * 0.18)) : Math.round(deckW * 0.42);
    const panelH = deckH - 12;
    const panelY = deckY + 6;

    d.heroPanel.setPosition(deckX + 5, panelY);
    d.heroBg.setSize(heroW, panelH);
    const portraitSize = Math.min(48, panelH - 12);
    d.heroPortraitFrame.setPosition(6, 6).setSize(portraitSize, portraitSize);
    d.heroPortrait.setPosition(6 + portraitSize / 2, 6 + portraitSize / 2).setDisplaySize(portraitSize - 6, portraitSize - 6);
    d.heroName.setPosition(6 + portraitSize + 10 + (heroW - portraitSize - 22) / 2, 16);
    d.heroHp.setPosition(6 + portraitSize + 10 + (heroW - portraitSize - 22) / 2, 34);
    d.heroRp.setPosition(6 + portraitSize + 10 + (heroW - portraitSize - 22) / 2, 50);
    d.heroAttune.setPosition(6 + portraitSize + 10 + (heroW - portraitSize - 22) / 2, panelH - 11);

    d.targetPanel.setPosition(deckX + deckW - targetW - 5, panelY);
    d.targetBg.setSize(targetW, panelH);
    d.targetTitle.setPosition(targetW / 2, 12);
    d.targetName.setPosition(targetW / 2, Math.round(panelH * 0.48));
    d.targetHp.setPosition(targetW / 2, panelH - 14);

    const ribbonH = landscape ? 38 : 42;
    const ribbonW = landscape ? Math.min(430, Math.round(deckW * 0.56)) : deckW - 12;
    const ribbonX = landscape ? (w - ribbonW) / 2 : deckX + 6;
    const ribbonY = deckY - ribbonH + 4;
    d.ribbon.setPosition(ribbonX, ribbonY);
    d.ribbonBg.setSize(ribbonW, ribbonH);
    d.ribbonLabel.setPosition(32, ribbonH / 2);

    const chipStart = 66;
    const enemyW = 70;
    const chipAreaW = ribbonW - chipStart - enemyW - 8;
    const chipW = Math.max(58, Math.min(86, Math.floor(chipAreaW / Math.max(1, d.heroChips.length)) - 4));
    d.heroChips.forEach((c, i) => {
      const cx = chipStart + chipW * i + chipW / 2 + i * 3;
      c.chip.setPosition(cx, ribbonH / 2);
      c.bg.setSize(chipW, ribbonH - 8);
      c.portrait.setPosition(-chipW / 2 + 17, 0).setDisplaySize(25, 25);
      c.label.setPosition(10, 0).setFontSize(chipW < 68 ? 7 : 8);
      c.hit.setSize(chipW, ribbonH - 4);
      c.hit.input.hitArea.setTo(0, 0, chipW, ribbonH - 4);
    });
    d.enemySummary.setPosition(ribbonW - enemyW / 2 - 5, ribbonH / 2);
    d.enemyBg.setSize(enemyW, ribbonH - 8);
    d.enemyText.setPosition(0, 0);

    this._layoutCommandDeck06E(w, h, { deckX, deckY, deckW, deckH, heroW, targetW });
  }

  _layoutCommandDeck06E(w, h, metrics = null) {
    if (!this._phoneDeck06E || !this.actionConsole || !this.actionMenu) return;
    const landscape = w > h;
    const margin = landscape ? 7 : 8;
    const deckY = metrics ? metrics.deckY : h - (landscape ? 82 : 108) - margin;
    const deckW = metrics ? metrics.deckW : w - margin * 2;
    const heroW = metrics ? metrics.heroW : Math.min(210, Math.round(deckW * 0.25));
    const targetW = metrics ? metrics.targetW : Math.min(154, Math.round(deckW * 0.18));
    const centerX0 = margin + heroW + 18;
    const centerX1 = w - margin - targetW - 18;
    const centerW = Math.max(230, centerX1 - centerX0);

    const visibleEntries = this.actionConsole.entries.filter(e =>
      this._moreOpen06E ? SECONDARY_KINDS.has(e.kind) : PRIMARY_KINDS.has(e.kind)
    );

    const barHeight = landscape ? 44 : 46;
    const { barW } = this.actionConsole.layout(barHeight, 0);
    const moreW = 76;
    const gap = 5;
    const totalW = visibleEntries.length * barW + (visibleEntries.length - 1) * gap + gap + moreW;
    const scale = Math.min(1, centerW / totalW);

    this.actionMenu.container.setPosition(centerX0 + (centerW - totalW * scale) / 2, deckY + 11);
    this.actionMenu.container.setScale(scale);

    visibleEntries.forEach((entry, i) => {
      entry.row.setPosition(i * (barW + gap) + barW / 2, barHeight / 2);
    });

    const moreX = visibleEntries.length * (barW + gap) + moreW / 2;
    this._phoneDeck06E.moreBg.setPosition(moreX, barHeight / 2).setDisplaySize(moreW, barHeight);
    this._phoneDeck06E.moreText.setPosition(moreX, barHeight / 2);

    // Cancel becomes a small utility chip tucked beneath the command row.
    const cancelW = 70;
    const cancelH = 25;
    this.actionMenu.cancelBg.setDisplaySize(cancelW, cancelH)
      .setPosition(totalW - cancelW / 2, barHeight + 6 + cancelH / 2);
  }

  _applyCommandMode06E() {
    if (!this.actionConsole) return;
    this.actionConsole.entries.forEach(entry => {
      const show = this._moreOpen06E ? SECONDARY_KINDS.has(entry.kind) : PRIMARY_KINDS.has(entry.kind);
      entry.row.setVisible(show);
      if (entry.hitZone && entry.hitZone.input) entry.hitZone.input.enabled = show && entry.enabled;
    });
    if (this._phoneDeck06E) this._phoneDeck06E.moreText.setText(this._moreOpen06E ? 'BACK' : 'MORE');
  }

  _refreshPhoneDeck06E() {
    if (!this._phoneDeck06E) return;
    const d = this._phoneDeck06E;
    const selected = this.unitController ? this.unitController.selected : null;
    const active = selected && selected.alive ? selected : null;

    if (active) {
      d.heroPortrait.setTexture(active.portraitKey).setAlpha(1);
      d.heroPortraitFrame.setStrokeStyle(2, active.accent || 0xd8ba67, 0.95);
      d.heroName.setText(active.name.toUpperCase());
      d.heroHp.setText(`HP ${active.hp}/${active.maxHp}${active.acted ? '  ✓' : ''}`);
      d.heroRp.setText(`RP ${active.rp}/${active.maxRp}`);
      const lit = Math.max(0, Math.min(active.attunementMax || 3, active.attunement || 0));
      d.heroAttune.setText(`${'◆ '.repeat(lit)}${'◇ '.repeat((active.attunementMax || 3) - lit)}`.trim());
    } else {
      d.heroPortrait.setAlpha(0.35);
      d.heroName.setText('SELECT HERO');
      d.heroHp.setText('HP --');
      d.heroRp.setText('RP --');
      d.heroAttune.setText('◇ ◇ ◇');
    }

    if (this._pendingAction === 'attack') {
      d.targetName.setText('CHOOSE ENEMY');
      d.targetHp.setText(this._pendingActionKind === 'resonart' ? 'RESONART TARGET' : 'ATTACK TARGET');
      d.targetBg.setFillStyle(0x24102d, 0.98);
    } else {
      d.targetName.setText(active ? 'READY' : 'NO TARGET');
      d.targetHp.setText(active ? 'SELECT ACTION' : '');
      d.targetBg.setFillStyle(0x170d24, 0.94);
    }

    d.heroChips.forEach(c => {
      const hero = c.hero;
      const isSelected = hero === active;
      c.chip.setAlpha(hero.alive ? (hero.acted && !isSelected ? 0.56 : 1) : 0.32);
      c.bg.setStrokeStyle(isSelected ? 2.5 : 1.5, isSelected ? 0xffe8a0 : (hero.accent || 0xd8ba67), isSelected ? 1 : 0.65);
      c.label.setText(hero.acted ? `${hero.name.toUpperCase()} ✓` : hero.name.toUpperCase());
    });

    const livingEnemies = (this.enemies || []).filter(e => e.alive).length;
    d.enemyText.setText(`ENEMY ×${livingEnemies}`);

    this._applyCommandMode06E();
  }

  create() {
    super.create();
    this._retireDrawer06E();
    this._buildPhoneDeck06E();
    this.layoutHUD();
    this.refreshHUD();
  }

  layoutHUD() {
    super.layoutHUD();
    this._retireDrawer06E();
    if (!this._phoneDeck06E) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const landscape = w > h;
    const margin = landscape ? 7 : 8;

    // Keep the top nearly empty. The bottom deck owns persistent combat info.
    this.phaseFrame.setDisplaySize(112, 27).setPosition(margin + 56, margin);
    this.turnText.setPosition(margin + 56, margin + 13.5).setFontSize(10);
    this.goalPrimaryText.setFontSize(11).setPosition(w * 0.5, margin + 13.5).setWordWrapWidth(Math.min(240, w * 0.4));
    this.messageText.setFontSize(10).setPosition(w * 0.5, margin + 31).setWordWrapWidth(w * 0.5);

    this.zoomControls.container.setScale(0.72).setPosition(w - margin - 45, margin + 15);
    this._layoutPhoneDeck06E(w, h);
  }

  refreshHUD() {
    super.refreshHUD();
    this._retireDrawer06E();
    if (!this._phoneDeck06E) return;
    this._refreshPhoneDeck06E();
  }

  showActionMenuFor(hero) {
    super.showActionMenuFor(hero);
    this._moreOpen06E = false;
    if (this._phoneDeck06E) this._phoneDeck06E.moreText.setText('MORE');
    this._applyCommandMode06E();
    this._layoutCommandDeck06E(this.scale.width, this.scale.height);
  }

  onActionMenuChoice(kind) {
    super.onActionMenuChoice(kind);
    if (kind !== 'cancel') this._moreOpen06E = false;
    this._applyCommandMode06E();
    this._refreshPhoneDeck06E();
  }
}
