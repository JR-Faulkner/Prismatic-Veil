// FAI-HUD-01 Phase A — isolated party-battle scene (FAI_ARCHITECTURE
// addendum, Option 2: new scene alongside the existing 1v1 VeilBattleScene,
// which stays completely untouched by this file). Boots standalone from
// party-battle-v1.html — not reachable from tactical-field-v2.html or any
// live path yet. That wiring is Phase B, gated on DAI's explicit approval
// per MIGRATION_PLAN.md; this file is Phase A only.
//
// Reuses, rather than duplicates: HEROES/attack data from BattleConfig.js,
// the enemy view interface (container/sprite/layout/setPose/introSlide/
// hit/attack/die/reset) from EnemyViewFactory.js, and the world/uiLayer
// dual-camera split every other battle scene in this project already
// relies on (see CLAUDE.md) — battlefield objects go through worldAdd(),
// every HUD element goes through uiAdd(), or it renders on both cameras
// doubled/unzoomed.
import { HEROES } from './BattleConfig.js?v=44';
import { WRAITH_TEXTURES } from './EnemyWraithView.js?v=40';
import { createEnemyView } from './EnemyViewFactory.js?v=40';
import PartyFormationView from './PartyFormationView.js?v=5';
import {
  partyRoster, BASE_COMMANDS, RESONART_RP_COST, ITEM_DEFS,
  PARTY_ASSET_LOCK, projectedDamage, hitChanceFor
} from './PartyBattleConfig.js?v=3';

const ENEMY_DEFAULT = Object.freeze({
  id: 'wraith', viewId: 'wraith', name: 'Veil Wraith',
  hp: 30, maxHp: 30, portrait: 'portrait_wraith', accent: 0xc477ff,
  attack: Object.freeze({ name: 'Veil Lash', damage: 9, critChance: 0.15, critMultiplier: 2 })
});

const COMMAND_RAIL_W = 150;

const PALETTE = Object.freeze({
  paper: 0x0d1230, ink: 0xf4e9c9, gold: 0xd8b46a, goldBright: 0xffe8a0,
  hp: 0x71ff88, hpTrack: 0x1c2a1e, rp: 0x67c8ff, rpTrack: 0x121a2c,
  enemyHp: 0xff6b7a, enemyHpTrack: 0x2a1418, panel: 0x0a0e24
});

export default class PartyBattleScene extends Phaser.Scene {
  constructor() {
    super('PartyBattleScene');
  }

  preload() {
    // FAI-HUD-01B: the formation renders from the locked JRPG master
    // assets (assets/party_formation/), not BattleConfig's BP cinematic
    // pose set — see PartyBattleConfig.js's PARTY_ASSET_LOCK for why
    // those are a different asset library entirely. hero.poses.idle is
    // no longer loaded here on purpose.
    Object.values(PARTY_ASSET_LOCK.textures).forEach(tex => {
      this.load.image(tex.key, tex.path);
    });
    Object.values(HEROES).forEach(hero => {
      this.load.image(hero.portrait, `./assets/ui/${hero.portrait}.png`);
    });
    Object.values(WRAITH_TEXTURES).forEach(tex => {
      this.load.image(tex, `./assets/enemy/veil_wraith/${tex}.png`);
    });
    this.load.image(ENEMY_DEFAULT.portrait, `./assets/ui/${ENEMY_DEFAULT.portrait}_v34.png`);
  }

  create() {
    // scene.restart() survivors — this harness never restarts the scene
    // today, but every other scene in this project clears these at the
    // top of create() on principle, so this one does too.
    this._resizeHandlers = [];
    this._turnLock = false;
    this._drawerOpen = null;

    this.cameras.main.setBackgroundColor('#07060f');
    this.world = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0).setDepth(1000);
    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCam.setBackgroundColor('rgba(0,0,0,0)');
    this.uiCam.ignore(this.world);
    this.cameras.main.ignore(this.uiLayer);
    this._onResize = size => this.uiCam.setSize(size.width, size.height);
    this.scale.on('resize', this._onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this._onResize, this));

    this._buildBackdrop();

    this.party = partyRoster();
    this.enemy = { ...ENEMY_DEFAULT, attack: { ...ENEMY_DEFAULT.attack } };

    this.formation = new PartyFormationView(this);
    this.formation.create(this.party);
    this.enemyView = createEnemyView(this, this.enemy);
    this.enemyView.create();

    this._buildTargetCard();
    this._buildTurnOrderStrip();
    this._buildPartyStrip();
    this._buildCommandRail();
    this._buildProjectionPanel();
    this._buildBanner();

    this.turnOrder = ['prismel', 'auryi', 'kineza', 'enemy'];
    this.turnIndex = -1;
    this._advanceTurn();
  }

  worldAdd(obj) {
    if (Array.isArray(obj)) obj.forEach(o => this.world.add(o));
    else this.world.add(obj);
    return obj;
  }

  uiAdd(obj) {
    if (Array.isArray(obj)) obj.forEach(o => this.uiLayer.add(o));
    else this.uiLayer.add(obj);
    return obj;
  }

  // --- backdrop -----------------------------------------------------
  _buildBackdrop() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0d1230, 0x0d1230, 0x1a0f38, 0x1a0f38, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);
    this.worldAdd(g);
    this._bg = g;
    const resize = () => {
      g.clear();
      g.fillGradientStyle(0x0d1230, 0x0d1230, 0x1a0f38, 0x1a0f38, 1);
      g.fillRect(0, 0, this.scale.width, this.scale.height);
    };
    this.scale.on('resize', resize, this);
    this.events.once('shutdown', () => this.scale.off('resize', resize, this));
  }

  // --- HUD: enemy target card ----------------------------------------
  // FAI-HUD-01E: the fixed 260x64 card ran to ~31%/16% of a 844x390
  // landscape viewport — over REVISED_VISUAL_RATIOS.json's 25%/12% caps —
  // and covered Prismel's head/staff (DAI's own annotated evidence).
  // Rebuilt responsively (same rebuild-on-resize shape as the party
  // strip) instead of one fixed size, and capped directly against the
  // locked ratios rather than a guessed-smaller constant.
  _buildTargetCard() {
    const c = this.add.container(0, 0).setDepth(10);
    this.uiAdd(c);
    this._targetCardContainer = c;
    const layout = () => this._layoutTargetCard();
    layout();
    this._registerRelayout(layout);
  }

  _layoutTargetCard() {
    const c = this._targetCardContainer;
    c.removeAll(true);
    const w = Math.round(Math.min(230, this.scale.width * 0.24));
    const h = Math.round(Math.min(46, this.scale.height * 0.115));
    const pad = Math.max(8, Math.round(w * 0.05));

    const bg = this.add.rectangle(0, 0, w, h, PALETTE.panel, 0.92)
      .setOrigin(0, 0).setStrokeStyle(1.4, PALETTE.gold, 0.8);
    const name = this.add.text(pad, h * 0.14, this.enemy.name, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${Math.max(12, Math.round(h * 0.32))}px`, color: '#FF8B9A'
    });
    const barW = w - pad * 2;
    const barH = Math.max(8, Math.round(h * 0.24));
    const barY = h - pad - barH;
    const track = this.add.rectangle(pad, barY, barW, barH, PALETTE.enemyHpTrack, 0.95).setOrigin(0, 0);
    const fill = this.add.rectangle(pad, barY, barW, barH, PALETTE.enemyHp, 1).setOrigin(0, 0);
    const hpText = this.add.text(pad + barW / 2, barY + barH / 2, `${Math.max(0, this.enemy.hp)} / ${this.enemy.maxHp}`, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${Math.max(9, Math.round(barH * 0.62))}px`, color: '#FFFFFF'
    }).setOrigin(0.5);
    c.add([bg, name, track, fill, hpText]);

    this._targetCard = { container: c, fill, hpText, barW };
    this._layoutTopLeft(c, 16, 16);
  }

  _updateTargetCard() {
    const t = this._targetCard;
    const frac = Phaser.Math.Clamp(this.enemy.hp / this.enemy.maxHp, 0, 1);
    t.fill.setSize(Math.max(1, t.barW * frac), t.fill.height);
    t.hpText.setText(`${Math.max(0, this.enemy.hp)} / ${this.enemy.maxHp}`);
  }

  // --- HUD: compact turn order strip ----------------------------------
  // FAI-HUD-01E: "tiny portrait chain is easy to miss" — bumped chip/ring
  // size modestly (28->32 / 17->19 radius) while staying inside
  // REVISED_VISUAL_RATIOS.json's turn_order_target_viewport_width
  // (18-24%): at 844px landscape width the new 4*52-8=200px strip is
  // 23.7%, still under the cap.
  _buildTurnOrderStrip() {
    const c = this.add.container(0, 0).setDepth(10);
    const order = ['prismel', 'auryi', 'kineza', 'enemy'];
    const slot = 52;
    this._turnChips = {};
    order.forEach((id, i) => {
      const x = i * slot;
      const ring = this.add.circle(x + 20, 20, 19, 0x000000, 0).setStrokeStyle(2.4, PALETTE.goldBright, 0);
      const tex = id === 'enemy' ? this.enemy.portrait : HEROES[id].portrait;
      const chip = this.add.image(x + 20, 20, tex).setDisplaySize(32, 32);
      c.add([ring, chip]);
      this._turnChips[id] = ring;
    });
    this.uiAdd(c);
    this._turnOrderContainer = c;
    const w = order.length * slot - (slot - 40);
    // Landscape has room for the strip top-right, clear of the target
    // card. Portrait's narrower width put the two in the same horizontal
    // band and they overlapped on first test — below the target card,
    // left-aligned with it, is clear in both orientations. Reads the
    // target card's own actual current height rather than a stale
    // hardcoded number — it became responsive in the same pass this
    // strip did, so a fixed offset here would drift out of sync with it.
    const layout = () => {
      if (this.scale.width > this.scale.height) this._layoutTopRight(c, 16, 16, w);
      else {
        const cardH = Math.round(Math.min(46, this.scale.height * 0.115));
        c.setPosition(16, 16 + cardH + 8);
      }
    };
    layout();
    this._registerRelayout(layout);
  }

  _highlightTurnChip(id) {
    Object.entries(this._turnChips).forEach(([key, ring]) => {
      ring.setStrokeStyle(2, PALETTE.goldBright, key === id ? 1 : 0);
    });
  }

  // --- HUD: party status row (3 hero cards) ---------------------------
  // Card width is derived from available screen width (screen width minus
  // the vertical command rail's own reserved column) rather than a fixed
  // guess — a fixed 168px-per-card row collided with the command rail at
  // 844px landscape width on first test. See COMMAND_RAIL_W below, shared
  // by both this method and _buildCommandRail().
  _buildPartyStrip() {
    this._heroCards = {};
    this._partyStripParts = [];
    const c = this.add.container(0, 0).setDepth(10);
    this.uiAdd(c);
    this._partyStripContainer = c;
    const layout = () => this._layoutPartyStrip();
    layout();
    this._registerRelayout(layout);
  }

  // FAI-HUD-01E: fixed 76px cards ran to ~19.5% of a 390px-tall landscape
  // viewport — over REVISED_VISUAL_RATIOS.json's party_band_target of
  // 14-18% — and read "like character sheets," per DAI's own words.
  // cardH is now derived from viewport height directly, clamped to a
  // sane range for extreme sizes, and every internal offset scales off
  // cardH instead of the old fixed pixel values so the shorter card
  // doesn't just clip its old layout.
  _layoutPartyStrip() {
    const c = this._partyStripContainer;
    c.removeAll(true);
    this._partyStripParts = [];
    const landscape = this.scale.width > this.scale.height;
    const h = this.scale.height;
    const cardH = Math.round(Phaser.Math.Clamp(h * 0.16, 52, 90));
    const gap = 8, n = this.party.length;
    // Landscape: rail is a left column, so the strip starts to its right.
    // Portrait: rail moves to a full-width bottom row (_layoutCommandRail),
    // so the strip spans the full width instead and sits above it.
    const startX = landscape ? COMMAND_RAIL_W + 32 : 16;
    const availW = landscape
      ? Math.max(n * 90, this.scale.width - startX - 16)
      : this.scale.width - 32;
    const cardW = Math.floor((availW - gap * (n - 1)) / n);

    const portraitD = Math.round(cardH * 0.44);
    const contentX = portraitD + 22;
    const nameFont = Math.max(11, Math.round(cardH * 0.185));
    const hpBarH = Math.max(7, Math.round(cardH * 0.145));
    const rpBarH = Math.max(6, Math.round(cardH * 0.115));
    const hpBarY = Math.round(cardH * 0.40);
    const rpBarY = hpBarY + hpBarH + Math.round(cardH * 0.03);
    const textY = Math.round(cardH * 0.80);
    const textFont = Math.max(8, Math.round(cardH * 0.135));

    this.party.forEach((hero, i) => {
      const x = i * (cardW + gap);
      const bg = this.add.rectangle(x, 0, cardW, cardH, PALETTE.panel, 0.92)
        .setOrigin(0, 0).setStrokeStyle(1.6, PALETTE.gold, 0.7);
      const portrait = this.add.image(x + 12 + portraitD / 2, cardH / 2, hero.portrait).setDisplaySize(portraitD, portraitD);
      const barW = Math.max(50, cardW - contentX - 12);
      const name = this.add.text(x + contentX, Math.round(cardH * 0.10), hero.name, {
        fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${nameFont}px`, color: '#FFE8A0'
      });
      const hpTrack = this.add.rectangle(x + contentX, hpBarY, barW, hpBarH, PALETTE.hpTrack, 0.95).setOrigin(0, 0);
      const hpFill = this.add.rectangle(x + contentX, hpBarY, barW, hpBarH, PALETTE.hp, 1).setOrigin(0, 0);
      const rpTrack = this.add.rectangle(x + contentX, rpBarY, barW, rpBarH, PALETTE.rpTrack, 0.95).setOrigin(0, 0);
      const rpFill = this.add.rectangle(x + contentX, rpBarY, barW, rpBarH, PALETTE.rp, 1).setOrigin(0, 0);
      // Narrow cards (portrait's 3-across row) can't fit the full "HP
      // x/y  RP x/y" label without overflowing the card — the bars
      // already carry the same information visually, so a narrow card
      // just shows bare numbers instead of dropping information.
      const hpLabel = cardW < 130
        ? `${hero.currentHp}/${hero.maxHp}  ${hero.currentRp}/${hero.maxRp}`
        : `HP ${hero.currentHp}/${hero.maxHp}  RP ${hero.currentRp}/${hero.maxRp}`;
      const hpText = this.add.text(x + contentX, textY, hpLabel, {
        fontFamily: 'Georgia, serif', fontSize: `${textFont}px`, color: '#CFC7E8'
      });
      c.add([bg, portrait, name, hpTrack, hpFill, rpTrack, rpFill, hpText]);
      this._heroCards[hero.id] = { bg, hpFill, rpFill, hpText, barW, compact: cardW < 130 };
    });

    // Landscape: strip shares the bottom row with the rail (which is a
    // left column there, so no vertical conflict). Portrait: the strip is
    // full-width, so it has to clear the rail vertically instead — sits
    // just above it.
    const startY = landscape
      ? this.scale.height - 16 - cardH
      : this._commandRailBounds().y - 8 - cardH;
    c.setPosition(startX, startY);
  }

  // Single source of truth for the command rail's current footprint, so
  // the party strip / drawer / projection panel can all clear it
  // correctly in both orientations without duplicating the geometry.
  _commandRailBounds() {
    const btnH = 40, gap = 6;
    const railH = BASE_COMMANDS.length * (btnH + gap) - gap;
    return { x: 16, y: this.scale.height - 16 - railH, w: COMMAND_RAIL_W, h: railH };
  }

  _updateHeroCard(heroId) {
    const hero = this.party.find(h => h.id === heroId);
    const card = this._heroCards[heroId];
    if (!hero || !card) return;
    card.hpFill.setSize(Math.max(1, card.barW * Phaser.Math.Clamp(hero.currentHp / hero.maxHp, 0, 1)), card.hpFill.height);
    card.rpFill.setSize(Math.max(1, card.barW * Phaser.Math.Clamp(hero.currentRp / hero.maxRp, 0, 1)), card.rpFill.height);
    card.hpText.setText(card.compact
      ? `${Math.max(0, hero.currentHp)}/${hero.maxHp}  ${hero.currentRp}/${hero.maxRp}`
      : `HP ${Math.max(0, hero.currentHp)}/${hero.maxHp}  RP ${hero.currentRp}/${hero.maxRp}`);
    card.bg.setStrokeStyle(1.6, PALETTE.gold, hero.alive ? 0.7 : 0.25);
  }

  _highlightHeroCard(heroId) {
    Object.entries(this._heroCards).forEach(([id, card]) => {
      card.bg.setStrokeStyle(id === heroId ? 2.4 : 1.6, id === heroId ? PALETTE.goldBright : PALETTE.gold, id === heroId ? 1 : 0.7);
    });
  }

  // --- HUD: 4-command rail + contextual Resonart/Item drawers ----------
  // Vertical stack on the left, matching the reference concept art's
  // command-list placement (STORYBOOK_UI_PALETTE_REFERENCE.png) — a
  // horizontal row here collided with the party strip; a left column
  // shares no horizontal band with anything else on screen.
  _buildCommandRail() {
    const c = this.add.container(0, 0).setDepth(11);
    this._commandButtons = {};
    const btnW = COMMAND_RAIL_W, btnH = 40, gap = 6;
    BASE_COMMANDS.forEach((label, i) => {
      const y = i * (btnH + gap);
      const bg = this.add.rectangle(0, y, btnW, btnH, PALETTE.panel, 0.95)
        .setOrigin(0, 0).setStrokeStyle(1.8, PALETTE.gold, 0.85)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(btnW / 2, y + btnH / 2, label.toUpperCase(), {
        fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '15px', color: '#F4E9C9'
      }).setOrigin(0.5);
      bg.on('pointerdown', () => this._onCommand(label));
      c.add([bg, text]);
      this._commandButtons[label] = { bg, text };
    });
    this.uiAdd(c);
    this._commandRailContainer = c;
    const layout = () => { const b = this._commandRailBounds(); c.setPosition(b.x, b.y); };
    layout();
    this._registerRelayout(layout);

    // Contextual drawer (Resonart or Item detail). Hidden until opened —
    // "Resonart drawer appears only in Resonart state" (CANON_LEXICON.md).
    // Anchored above the command rail so it never competes with the party
    // strip (which starts to the rail's right) or the target card (top).
    const drawer = this.add.container(0, 0).setDepth(12).setVisible(false);
    const dBg = this.add.rectangle(0, 0, 300, 170, PALETTE.panel, 0.97)
      .setOrigin(0, 0).setStrokeStyle(2, PALETTE.goldBright, 0.9);
    const dTitle = this.add.text(14, 10, '', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '18px', color: '#9FE0FF'
    });
    const dDetail = this.add.text(14, 36, '', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#CFC7E8', wordWrap: { width: 272 }
    });
    const dStats = this.add.text(14, 106, '', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#F4E9C9'
    });
    const useBtn = this.add.rectangle(14, 138, 128, 26, 0x1a3a1e, 0.95)
      .setOrigin(0, 0).setStrokeStyle(1.6, PALETTE.hp, 0.9).setInteractive({ useHandCursor: true });
    const useText = this.add.text(14 + 64, 138 + 13, 'USE', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '14px', color: '#D8FFD8'
    }).setOrigin(0.5);
    const closeBtn = this.add.rectangle(158, 138, 128, 26, 0x3a1a1e, 0.95)
      .setOrigin(0, 0).setStrokeStyle(1.6, 0xff8b8b, 0.9).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(158 + 64, 138 + 13, 'CLOSE', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '14px', color: '#FFD8D8'
    }).setOrigin(0.5);
    drawer.add([dBg, dTitle, dDetail, dStats, useBtn, useText, closeBtn, closeText]);
    this.uiAdd(drawer);
    useBtn.on('pointerdown', () => this._confirmDrawer());
    closeBtn.on('pointerdown', () => this._closeDrawer());
    this._drawer = { container: drawer, title: dTitle, detail: dDetail, stats: dStats };
    // Centered modal, not anchored above the rail — "above the rail" only
    // had room to spare on tall screens. At 390px landscape height,
    // railH(178) + drawer(170) + gaps left no clearance and the drawer
    // landed on top of the target card instead (confirmed by screenshot:
    // the drawer fully occluded it). A screen-centered popup needs only
    // to be shorter than the screen itself, which holds at every tested
    // size, landscape or portrait.
    const layoutDrawer = () => {
      drawer.setPosition((this.scale.width - 300) / 2, (this.scale.height - 170) / 2);
    };
    layoutDrawer();
    this._registerRelayout(layoutDrawer);
  }

  // Every command routes through the one contextual drawer — projected
  // damage/hit% lives in its stats line, so there's no separate always-on
  // panel to keep clear of the party strip at every screen width. This
  // also satisfies "command helper text matches highlighted state"
  // (GRIMOIRE_MENU_SPEC.md) uniformly instead of only for Resonart/Item.
  _buildProjectionPanel() {
    // intentionally empty — kept as a named build step in create()'s call
    // list for symmetry with the other _build* methods and as a single
    // place to reintroduce a standalone panel later if a design pass
    // wants projected stats visible before a command is even tapped.
  }

  // --- HUD: turn banner -------------------------------------------------
  _buildBanner() {
    const t = this.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '22px', color: '#FFE8A0'
    }).setOrigin(0.5).setDepth(15);
    this.uiAdd(t);
    this._banner = t;
    // Landscape: centered top, clear of the target card (which only
    // occupies the left ~260px there). Portrait: centered top collided
    // with the target card's right edge on a 390px-wide screen — drops
    // below the turn order strip instead, which is already full-width
    // there.
    const relayout = () => {
      if (this.scale.width > this.scale.height) t.setPosition(this.scale.width / 2, 34);
      else {
        const cardH = Math.round(Math.min(46, this.scale.height * 0.115));
        t.setPosition(this.scale.width / 2, 16 + cardH + 8 + 40 + 10);
      }
    };
    relayout();
    this._registerRelayout(relayout);
  }

  _setBanner(msg) {
    this._banner.setText(msg);
  }

  // --- layout helpers (top-left/top-right/bottom-left/bottom-right) ----
  _registerRelayout(fn) {
    this._resizeHandlers.push(fn);
    this.scale.on('resize', fn, this);
    this.events.once('shutdown', () => this.scale.off('resize', fn, this));
  }

  _layoutTopLeft(container, mx, my) { container.setPosition(mx, my); }
  _layoutTopRight(container, mx, my, w) { container.setPosition(this.scale.width - mx - w, my); }

  // --- turn flow ---------------------------------------------------------
  _livingHeroes() { return this.party.filter(h => h.alive); }

  _advanceTurn() {
    if (this.enemy.hp <= 0) return this._onVictory();
    if (this._livingHeroes().length === 0) return this._onDefeat();

    this.turnIndex = (this.turnIndex + 1) % this.turnOrder.length;
    const actor = this.turnOrder[this.turnIndex];

    if (actor === 'enemy') {
      this._highlightTurnChip('enemy');
      this.formation.setActive(null);
      this._setBanner('Enemy Turn');
      this._hideCommandRail();
      this.time.delayedCall(500, () => this._runEnemyTurn());
      return;
    }

    const hero = this.party.find(h => h.id === actor);
    if (!hero || !hero.alive) { this._advanceTurn(); return; }

    this._highlightTurnChip(actor);
    this._highlightHeroCard(actor);
    this.formation.setActive(actor);
    this._setBanner(`${hero.name}'s Turn`);
    this.activeHeroId = actor;
    this._showCommandRail();
  }

  _showCommandRail() { this._commandRailContainer.setVisible(true); }
  _hideCommandRail() { this._commandRailContainer.setVisible(false); this._closeDrawer(); }

  _activeHero() { return this.party.find(h => h.id === this.activeHeroId); }

  // Every command opens the same contextual drawer with its own detail/
  // stats text — "command helper text matches highlighted state"
  // (GRIMOIRE_MENU_SPEC.md) applies uniformly, not just to Resonart/Item.
  _onCommand(label) {
    if (this._turnLock) return;
    const hero = this._activeHero();
    if (!hero) return;
    this._drawerOpen = label;

    if (label === 'Attack') {
      const { low, high } = projectedDamage(hero, 'Attack');
      const hitPct = Math.round(hitChanceFor('Attack') * 100);
      this._drawer.title.setText('ATTACK');
      this._drawer.detail.setText('A basic strike — free, always available.');
      this._drawer.stats.setText(`Damage: ${low}-${high}   Hit: ${hitPct}%`);
    } else if (label === 'Resonart') {
      const { low, high } = projectedDamage(hero, 'Resonart');
      const hitPct = Math.round(hitChanceFor('Resonart') * 100);
      const affordable = hero.currentRp >= RESONART_RP_COST;
      this._drawer.title.setText(hero.attack.name.toUpperCase());
      this._drawer.detail.setText(hero.attack.flavor || 'A signature technique.');
      this._drawer.stats.setText(
        `RP Cost: ${RESONART_RP_COST}${affordable ? '' : ' (not enough RP)'}\n` +
        `Damage: ${low}-${high}   Hit: ${hitPct}%`
      );
    } else if (label === 'Guard') {
      this._drawer.title.setText('GUARD');
      this._drawer.detail.setText(`${hero.name} braces for the enemy's next attack.`);
      this._drawer.stats.setText('Damage Reduction: 50%');
    } else if (label === 'Item') {
      const item = ITEM_DEFS[0];
      this._drawer.title.setText(item.name.toUpperCase());
      this._drawer.detail.setText(`Restores ${item.heal} HP to ${hero.name}.`);
      this._drawer.stats.setText('Target: Self');
    }
    this._drawer.container.setVisible(true);
  }

  _closeDrawer() {
    this._drawerOpen = null;
    if (this._drawer) this._drawer.container.setVisible(false);
  }

  _confirmDrawer() {
    // Same double-tap guard _resolveHeroAction already applies to Attack/
    // Resonart — Guard/Item resolve synchronously with no async gap of
    // their own to protect, but _endHeroTurn's 500ms delay before the
    // actual turn advance left the command rail visible and interactive
    // that whole time, letting a second tap fire a second action for the
    // same actor before their turn had really ended (confirmed directly:
    // a same-actor double-Attack landed this way in testing). Locking and
    // hiding the rail immediately, same as the Attack/Resonart path
    // already does, closes that window uniformly for all four commands.
    if (this._turnLock) return;
    const hero = this._activeHero();
    if (!hero) return;
    const label = this._drawerOpen;
    if (label === 'Attack') {
      this._closeDrawer();
      this._resolveHeroAction(hero, 'Attack');
    } else if (label === 'Resonart') {
      if (hero.currentRp < RESONART_RP_COST) return; // visibly insufficient, no-op
      hero.currentRp -= RESONART_RP_COST;
      this._closeDrawer();
      this._resolveHeroAction(hero, 'Resonart');
    } else if (label === 'Guard') {
      this._turnLock = true;
      this._hideCommandRail();
      hero.guarding = true;
      this.formation.guardPose(hero.id, true);
      this._setBanner(`${hero.name} guards.`);
      this._turnLock = false;
      this._endHeroTurn();
    } else if (label === 'Item') {
      this._turnLock = true;
      this._hideCommandRail();
      const item = ITEM_DEFS[0];
      hero.currentHp = Math.min(hero.maxHp, hero.currentHp + item.heal);
      this._updateHeroCard(hero.id);
      this._setBanner(`${hero.name} uses ${item.name}!`);
      this._turnLock = false;
      this._endHeroTurn();
    }
  }

  async _resolveHeroAction(hero, command) {
    this._turnLock = true;
    this._hideCommandRail();
    const { low, high } = projectedDamage(hero, command);
    const hitRoll = Math.random() < hitChanceFor(command);

    await this.formation.attackLunge(hero.id);

    if (!hitRoll) {
      this._setBanner(`${hero.name} uses ${command === 'Resonart' ? hero.attack.name : 'Attack'} — missed!`);
      this._turnLock = false;
      this._endHeroTurn();
      return;
    }

    const dmg = Phaser.Math.Between(low, high);
    this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
    this._updateTargetCard();
    this.enemyView.hit();
    this._floatText(`-${dmg}`, '#FFD8D8');
    this._setBanner(`${hero.name} uses ${command === 'Resonart' ? hero.attack.name : 'Attack'} for ${dmg} damage!`);

    if (this.enemy.hp <= 0) {
      this.enemyView.die();
    }

    this._turnLock = false;
    this._endHeroTurn();
  }

  _endHeroTurn() {
    this.time.delayedCall(500, () => this._advanceTurn());
  }

  _runEnemyTurn() {
    const living = this._livingHeroes();
    if (living.length === 0) return this._onDefeat();
    const target = Phaser.Utils.Array.GetRandom(living);
    this.enemyView.attack();
    this.time.delayedCall(220, () => {
      let dmg = this.enemy.attack.damage;
      if (target.guarding) dmg = Math.round(dmg * 0.5);
      target.currentHp = Math.max(0, target.currentHp - dmg);
      target.guarding = false;
      this.formation.hit(target.id);
      this._updateHeroCard(target.id);
      this._floatText(`-${dmg}`, '#FF8B9A');
      this._setBanner(`${this.enemy.name} uses ${this.enemy.attack.name} on ${target.name}!`);
      if (target.currentHp <= 0) target.alive = false;
      this._endHeroTurn();
    });
  }

  _floatText(msg, color) {
    const t = this.add.text(this.scale.width * 0.6, this.scale.height * 0.4, msg, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '28px', color
    }).setOrigin(0.5).setDepth(20);
    this.worldAdd(t);
    this.tweens.add({
      targets: t, y: t.y - 40, alpha: 0, duration: 700, ease: 'Quad.easeOut',
      onComplete: () => t.destroy()
    });
  }

  // FAI-HUD-01E Pass 2: on-device evidence showed VICTORY appearing while
  // the full combat HUD (enemy card at 0/30, opaque party cards, turn
  // order) stayed exactly as busy as mid-fight, competing with the
  // result for attention. Fades the secondary HUD out, leaves the
  // formation/battlefield fully visible (the actual payoff), and makes
  // the banner the dominant element instead of just changing its text.
  // No rewards/Continue affordance yet — this is a single isolated
  // encounter proof with nothing real to continue to or reward from; a
  // fabricated one would be dead UI, not a completed feature, so it's
  // left out rather than faked.
  _onVictory() {
    this._hideCommandRail();
    this.formation.setActive(null); // clear the last actor's ring — no one's turn now
    this._softenSecondaryHud();
    this.tweens.add({
      targets: this._banner, scale: 1.6, duration: 420, ease: 'Back.easeOut'
    });
    this._setBanner('VICTORY');
  }

  _onDefeat() {
    this._hideCommandRail();
    this.formation.setActive(null);
    this._softenSecondaryHud();
    this.tweens.add({
      targets: this._banner, scale: 1.6, duration: 420, ease: 'Back.easeOut'
    });
    this._setBanner('DEFEAT');
  }

  _softenSecondaryHud() {
    this.tweens.add({ targets: this._targetCardContainer, alpha: 0.18, duration: 380, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this._turnOrderContainer, alpha: 0, duration: 300, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this._partyStripContainer, alpha: 0.55, duration: 380, ease: 'Sine.easeOut' });
  }
}
