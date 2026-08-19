// 06G — PHONE-06 clean Tactical HUD surface.
// Rebuilds the phone HUD directly over the validated 06D gameplay harness.
// No legacy drawer and no legacy TacticalActionConsole are visible or interactive.
// The new bottom deck is the sole command surface and delegates actions back to
// TacticalScene's existing onActionMenuChoice() state logic.

import IntegratedTacticalScene06D from './IntegratedTacticalScene06D.js?v=11';

const PRIMARY_06G = ['attack', 'resonart', 'attune'];
const SECONDARY_06G = ['veilshift', 'guard', 'wait'];
const LABELS_06G = Object.freeze({
  attack: 'ATTACK', resonart: 'RESONART', attune: 'ATTUNE',
  veilshift: 'VEILSHIFT', guard: 'GUARD', wait: 'WAIT'
});

const PORTRAIT_FIT_06G = Object.freeze({
  prismel: { hero: 40, chip: 22, y: 0 },
  auryi: { hero: 32, chip: 18, y: 2 },
  kineza: { hero: 38, chip: 21, y: 1 }
});

export default class IntegratedTacticalScene06G extends IntegratedTacticalScene06D {
  constructor() {
    super();
    this._phoneHud06G = null;
    this._moreOpen06G = false;
  }

  _txt06G(text, size, color = '#F7E4A7') {
    return this.add.text(0, 0, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif',
      fontSize: `${size}px`, fontStyle: 'bold', color,
      stroke: '#050914', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5);
  }

  _disableLegacyHud06G() {
    this.hudExpanded = false;
    if (this.heroCardsDrawer) this.heroCardsDrawer.setVisible(false);
    if (this.hudHandle?.container) this.hudHandle.container.setVisible(false);
    if (this.hudHandle?.bg?.disableInteractive) this.hudHandle.bg.disableInteractive();

    // Critical PHONE-06 rule: legacy command UI cannot remain behind the new deck.
    if (this.actionMenu?.container) this.actionMenu.container.setVisible(false);
    if (this.actionConsole?.entries) {
      this.actionConsole.entries.forEach(entry => {
        entry.row.setVisible(false);
        if (entry.hitZone?.input) entry.hitZone.input.enabled = false;
      });
    }
    if (this.actionMenu?.cancelBg?.disableInteractive) this.actionMenu.cancelBg.disableInteractive();
  }

  toggleHudDrawer() { this.hudExpanded = false; }

  _makeCommand06G(kind) {
    const c = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 10, 10, 0x17213b, 0.98)
      .setOrigin(0.5).setStrokeStyle(2, 0xd8ba67, 0.78)
      .setInteractive({ useHandCursor: true });
    const label = this._txt06G(LABELS_06G[kind], 10);
    bg.on('pointerdown', (p, lx, ly, ev) => {
      if (ev) ev.stopPropagation();
      if (p.event) p.event._tacticalUIHandled = true;
      if (!bg.input?.enabled || this.inputLocked) return;
      super.onActionMenuChoice(kind);
      this._moreOpen06G = false;
      this._refreshHud06G();
    });
    c.add([bg, label]);
    return { kind, c, bg, label, enabled: true };
  }

  _buildHud06G() {
    if (this._phoneHud06G) return;

    const root = this.add.container(0, 0).setDepth(500);
    const ribbon = this.add.container(0, 0);
    const ribbonBg = this.add.rectangle(0, 0, 10, 10, 0x071022, 0.9)
      .setOrigin(0, 0).setStrokeStyle(1, 0x8e72bd, 0.62);
    const ribbonLabel = this._txt06G('TURN', 8, '#D6C6FF');
    ribbon.add([ribbonBg, ribbonLabel]);

    const heroChips = this.heroes.map(hero => {
      const c = this.add.container(0, 0);
      const bg = this.add.rectangle(0, 0, 10, 10, 0x13203d, 0.98)
        .setOrigin(0.5).setStrokeStyle(1.5, hero.accent || 0xd8ba67, 0.72);
      const portrait = this.add.image(0, 0, hero.portraitKey).setOrigin(0.5);
      const label = this._txt06G(hero.name.toUpperCase(), 7, '#FFFFFF');
      const hit = this.add.rectangle(0, 0, 10, 10, 0x000000, 0)
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (p, lx, ly, ev) => {
        if (ev) ev.stopPropagation();
        if (p.event) p.event._tacticalUIHandled = true;
        if (this.phase === 'player' && hero.alive && !this.inputLocked) this.selectHero(hero);
      });
      c.add([bg, portrait, label, hit]);
      ribbon.add(c);
      return { hero, c, bg, portrait, label, hit };
    });

    const enemyText = this._txt06G('ENEMY ×0', 8, '#FFD3D8');
    ribbon.add(enemyText);

    const deck = this.add.container(0, 0);
    const deckBg = this.add.rectangle(0, 0, 10, 10, 0x071022, 0.94)
      .setOrigin(0, 0).setStrokeStyle(1.5, 0xd8ba67, 0.66);
    deck.add(deckBg);

    const heroPanel = this.add.container(0, 0);
    const heroBg = this.add.rectangle(0, 0, 10, 10, 0x0b1530, 0.98)
      .setOrigin(0, 0).setStrokeStyle(1.5, 0xd8ba67, 0.74);
    const heroFrame = this.add.rectangle(0, 0, 46, 46, 0x111c39, 1)
      .setOrigin(0, 0).setStrokeStyle(2, 0x9e7bd6, 0.9);
    const heroPortrait = this.add.image(0, 0, 'portrait_prismel').setOrigin(0.5);
    const heroName = this._txt06G('SELECT HERO', 11);
    const heroHp = this._txt06G('HP --', 9, '#FFFFFF');
    const heroRp = this._txt06G('RP --', 8, '#D6C6FF');
    const heroAttune = this._txt06G('◇ ◇ ◇', 8, '#C8A8FF');
    heroPanel.add([heroBg, heroFrame, heroPortrait, heroName, heroHp, heroRp, heroAttune]);
    deck.add(heroPanel);

    const targetPanel = this.add.container(0, 0);
    const targetBg = this.add.rectangle(0, 0, 10, 10, 0x170d24, 0.98)
      .setOrigin(0, 0).setStrokeStyle(1.5, 0xb07be0, 0.75);
    const targetTitle = this._txt06G('TARGET', 8, '#CDBEE6');
    const targetName = this._txt06G('READY', 10, '#FFFFFF');
    const targetInfo = this._txt06G('', 8, '#F3A8B0');
    targetPanel.add([targetBg, targetTitle, targetName, targetInfo]);
    deck.add(targetPanel);

    const commands = {};
    [...PRIMARY_06G, ...SECONDARY_06G].forEach(kind => {
      commands[kind] = this._makeCommand06G(kind);
      deck.add(commands[kind].c);
    });

    const more = this.add.container(0, 0);
    const moreBg = this.add.rectangle(0, 0, 10, 10, 0x261942, 0.99)
      .setOrigin(0.5).setStrokeStyle(2, 0xd8ba67, 0.86)
      .setInteractive({ useHandCursor: true });
    const moreText = this._txt06G('MORE', 10);
    moreBg.on('pointerdown', (p, lx, ly, ev) => {
      if (ev) ev.stopPropagation();
      if (p.event) p.event._tacticalUIHandled = true;
      if (!this.unitController?.selected || this.inputLocked) return;
      this._moreOpen06G = !this._moreOpen06G;
      this._refreshHud06G();
      this._layoutHud06G();
    });
    more.add([moreBg, moreText]);
    deck.add(more);

    root.add([ribbon, deck]);
    this._phoneHud06G = {
      root, ribbon, ribbonBg, ribbonLabel, heroChips, enemyText,
      deck, deckBg, heroPanel, heroBg, heroFrame, heroPortrait, heroName, heroHp, heroRp, heroAttune,
      targetPanel, targetBg, targetTitle, targetName, targetInfo,
      commands, more, moreBg, moreText
    };
    this.uiAdd(root);
  }

  _fitPortrait06G(image, heroId, slot) {
    const fit = PORTRAIT_FIT_06G[heroId] || PORTRAIT_FIT_06G.prismel;
    const size = slot === 'chip' ? fit.chip : fit.hero;
    image.setDisplaySize(size, size);
  }

  _layoutHud06G() {
    if (!this._phoneHud06G) return;
    const d = this._phoneHud06G;
    const w = this.scale.width, h = this.scale.height;
    const portrait = w <= h;
    const margin = 8;
    const safeBottom = portrait ? 26 : 8;

    // Ribbon sits immediately above the deck.
    const ribbonH = portrait ? 36 : 34;
    const deckH = portrait ? 132 : 82;
    const deckW = w - margin * 2;
    const deckY = h - safeBottom - deckH;
    const ribbonY = deckY - ribbonH + 2;

    d.ribbon.setPosition(margin, ribbonY);
    d.ribbonBg.setSize(deckW, ribbonH);
    d.ribbonLabel.setPosition(24, ribbonH / 2);

    const enemyW = 58;
    const chipStart = 46;
    const chipArea = deckW - chipStart - enemyW - 6;
    const chipW = Math.max(52, Math.floor(chipArea / 3) - 2);
    d.heroChips.forEach((c, i) => {
      const x = chipStart + chipW * i + chipW / 2 + i * 2;
      c.c.setPosition(x, ribbonH / 2);
      c.bg.setSize(chipW, ribbonH - 8);
      c.portrait.setPosition(-chipW / 2 + 14, 0);
      this._fitPortrait06G(c.portrait, c.hero.id, 'chip');
      c.label.setPosition(8, 0);
      c.hit.setSize(chipW, ribbonH - 4);
      c.hit.input.hitArea.setTo(0, 0, chipW, ribbonH - 4);
    });
    d.enemyText.setPosition(deckW - enemyW / 2 - 2, ribbonH / 2);

    d.deck.setPosition(margin, deckY);
    d.deckBg.setSize(deckW, deckH);

    if (portrait) {
      // Command row gets the entire width. Info cards live beneath it.
      const commandY = 28;
      const gap = 4;
      const moreW = 68;
      const kinds = this._moreOpen06G ? SECONDARY_06G : PRIMARY_06G;
      const commandW = Math.floor((deckW - 12 - moreW - gap * 3) / 3);
      kinds.forEach((kind, i) => {
        const cmd = d.commands[kind];
        cmd.c.setPosition(6 + commandW / 2 + i * (commandW + gap), commandY);
        cmd.bg.setSize(commandW, 44);
        cmd.label.setFontSize(commandW < 76 ? 8 : 9);
      });
      d.more.setPosition(deckW - 6 - moreW / 2, commandY);
      d.moreBg.setSize(moreW, 44);

      const infoY = 58;
      const infoGap = 6;
      const panelW = (deckW - 12 - infoGap) / 2;
      const panelH = 66;
      d.heroPanel.setPosition(6, infoY);
      d.heroBg.setSize(panelW, panelH);
      d.heroFrame.setPosition(6, 10).setSize(46, 46);
      d.heroPortrait.setPosition(29, 33);
      const textX = 58 + (panelW - 60) / 2;
      d.heroName.setPosition(textX, 13);
      d.heroHp.setPosition(textX, 29);
      d.heroRp.setPosition(textX, 43);
      d.heroAttune.setPosition(textX, 56);

      d.targetPanel.setPosition(6 + panelW + infoGap, infoY);
      d.targetBg.setSize(panelW, panelH);
      d.targetTitle.setPosition(panelW / 2, 12);
      d.targetName.setPosition(panelW / 2, 32);
      d.targetInfo.setPosition(panelW / 2, 50);
    } else {
      // Landscape: compact hero/target edges with commands centered.
      const heroW = Math.min(180, Math.round(deckW * 0.23));
      const targetW = Math.min(136, Math.round(deckW * 0.17));
      d.heroPanel.setPosition(5, 6); d.heroBg.setSize(heroW, deckH - 12);
      d.heroFrame.setPosition(6, 8).setSize(46, 46); d.heroPortrait.setPosition(29, 31);
      const heroTextX = 58 + (heroW - 60) / 2;
      d.heroName.setPosition(heroTextX, 14); d.heroHp.setPosition(heroTextX, 31);
      d.heroRp.setPosition(heroTextX, 46); d.heroAttune.setPosition(heroTextX, 60);

      d.targetPanel.setPosition(deckW - targetW - 5, 6); d.targetBg.setSize(targetW, deckH - 12);
      d.targetTitle.setPosition(targetW / 2, 12); d.targetName.setPosition(targetW / 2, 34); d.targetInfo.setPosition(targetW / 2, 55);

      const centerX0 = heroW + 16, centerX1 = deckW - targetW - 16;
      const kinds = this._moreOpen06G ? SECONDARY_06G : PRIMARY_06G;
      const moreW = 64, gap = 4;
      const commandW = Math.floor((centerX1 - centerX0 - moreW - gap * 3) / 3);
      kinds.forEach((kind, i) => {
        const cmd = d.commands[kind];
        cmd.c.setPosition(centerX0 + commandW / 2 + i * (commandW + gap), deckH / 2);
        cmd.bg.setSize(commandW, 44);
        cmd.label.setFontSize(commandW < 78 ? 8 : 9);
      });
      d.more.setPosition(centerX1 - moreW / 2, deckH / 2); d.moreBg.setSize(moreW, 44);
    }
  }

  _refreshHud06G() {
    if (!this._phoneHud06G) return;
    const d = this._phoneHud06G;
    const selected = this.unitController?.selected;
    const active = selected?.alive ? selected : null;

    if (active) {
      d.heroPortrait.setTexture(active.portraitKey).setAlpha(1);
      this._fitPortrait06G(d.heroPortrait, active.id, 'hero');
      d.heroFrame.setStrokeStyle(2, active.accent || 0xd8ba67, 0.95);
      d.heroName.setText(active.name.toUpperCase());
      d.heroHp.setText(`HP ${active.hp}/${active.maxHp}${active.acted ? ' ✓' : ''}`);
      d.heroRp.setText(`RP ${active.rp}/${active.maxRp}`);
      const lit = Math.max(0, Math.min(active.attunementMax || 3, active.attunement || 0));
      d.heroAttune.setText(`${'◆ '.repeat(lit)}${'◇ '.repeat((active.attunementMax || 3) - lit)}`.trim());
    } else {
      d.heroPortrait.setTexture('portrait_prismel').setAlpha(0.3);
      this._fitPortrait06G(d.heroPortrait, 'prismel', 'hero');
      d.heroName.setText('SELECT HERO'); d.heroHp.setText('HP --'); d.heroRp.setText('RP --'); d.heroAttune.setText('◇ ◇ ◇');
    }

    if (this._pendingAction === 'attack') {
      d.targetName.setText('CHOOSE ENEMY');
      d.targetInfo.setText(this._pendingActionKind === 'resonart' ? 'RESONART TARGET' : 'ATTACK TARGET');
    } else {
      d.targetName.setText(active ? 'READY' : 'NO TARGET');
      d.targetInfo.setText(active ? 'SELECT ACTION' : '');
    }

    d.heroChips.forEach(c => {
      const isSelected = c.hero === active;
      c.c.setAlpha(c.hero.alive ? (c.hero.acted && !isSelected ? 0.58 : 1) : 0.28);
      c.bg.setStrokeStyle(isSelected ? 2.5 : 1.5, isSelected ? 0xffe8a0 : (c.hero.accent || 0xd8ba67), isSelected ? 1 : 0.7);
      c.label.setText(c.hero.acted ? `${c.hero.name.toUpperCase()} ✓` : c.hero.name.toUpperCase());
    });
    d.enemyText.setText(`ENEMY ×${(this.enemies || []).filter(e => e.alive).length}`);

    const canAct = !!active && !active.acted && this.phase === 'player' && !this.inputLocked;
    const onNode = !!active && this.nodes.some(n => n.x === active.x && n.y === active.y && !n.restored);
    const visibleKinds = new Set(this._moreOpen06G ? SECONDARY_06G : PRIMARY_06G);
    Object.values(d.commands).forEach(cmd => {
      const visible = visibleKinds.has(cmd.kind);
      let enabled = canAct;
      if (cmd.kind === 'attune') enabled = canAct && onNode;
      cmd.c.setVisible(visible);
      cmd.enabled = enabled;
      cmd.bg.setFillStyle(enabled ? 0x17213b : 0x101522, enabled ? 0.99 : 0.8);
      cmd.bg.setStrokeStyle(2, enabled ? 0xd8ba67 : 0x5d6377, enabled ? 0.82 : 0.5);
      cmd.label.setAlpha(enabled ? 1 : 0.45);
      if (cmd.bg.input) cmd.bg.input.enabled = visible && enabled;
    });
    d.moreText.setText(this._moreOpen06G ? 'BACK' : 'MORE');
    if (d.moreBg.input) d.moreBg.input.enabled = !!active && !this.inputLocked;
  }

  create() {
    super.create();
    this._disableLegacyHud06G();
    this._buildHud06G();
    this.layoutHUD();
    this.refreshHUD();
  }

  layoutHUD() {
    super.layoutHUD();
    this._disableLegacyHud06G();
    if (!this._phoneHud06G) return;
    const w = this.scale.width, h = this.scale.height, margin = 8;
    this.phaseFrame.setDisplaySize(112, 27).setPosition(margin + 56, margin);
    this.turnText.setPosition(margin + 56, margin + 13.5).setFontSize(10);
    this.goalPrimaryText.setFontSize(10).setPosition(w * 0.5, margin + 13.5).setWordWrapWidth(Math.min(220, w * 0.42));
    this.messageText.setFontSize(9).setPosition(w * 0.5, margin + 31).setWordWrapWidth(w * 0.5);
    this.zoomControls.container.setScale(0.68).setPosition(w - margin - 43, margin + 14);
    this._layoutHud06G();
  }

  refreshHUD() {
    super.refreshHUD();
    this._disableLegacyHud06G();
    if (this._phoneHud06G) this._refreshHud06G();
  }

  showActionMenuFor(hero) {
    // Do not call super: that would resurrect the legacy TacticalActionConsole.
    this._disableLegacyHud06G();
    const canAct = !hero.acted;
    if (!canAct) this._moreOpen06G = false;
    this._refreshHud06G();
    this._layoutHud06G();
  }

  onActionMenuChoice(kind) {
    // Keep external/base call sites working while ensuring the old menu stays dead.
    super.onActionMenuChoice(kind);
    this._disableLegacyHud06G();
    this._moreOpen06G = false;
    this._refreshHud06G();
    this._layoutHud06G();
  }
}
