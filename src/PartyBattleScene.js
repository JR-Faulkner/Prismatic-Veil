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
import PartyFormationView from './PartyFormationView.js?v=kineza-sprintA-1';
import {
  partyRoster, BASE_COMMANDS, RESONART_RP_COST, ITEM_DEFS,
  PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, HERO_STATE_SHEETS, projectedDamage, hitChanceFor
} from './PartyBattleConfig.js?v=kineza-sprintA-1';
import { GUI_TEXTURES, NINESLICE_INSETS, preloadGuiKit } from './PartyBattleGuiKit.js';
import PartyBattleAudioController from './PartyBattleAudioController.js?v=3';

const ENEMY_DEFAULT = Object.freeze({
  id: 'wraith', viewId: 'wraith', name: 'Veil Wraith',
  hp: 30, maxHp: 30, portrait: 'portrait_wraith', accent: 0xc477ff,
  attack: Object.freeze({ name: 'Veil Lash', damage: 9, critChance: 0.15, critMultiplier: 2 })
});

const COMMAND_RAIL_W = 150;

// FAI-BATTLE-PRESENTATION-03: mirrors BattleController.js's own
// POSE_TIMING beats (Idle -> Step -> Gather -> Hold -> Release -> Impact
// hold -> Recover -> Idle) as a plain data table, not an import of that
// class — BattleController is 1v1-scene-specific machinery (camera
// hit-stop, reticle, dialogue queue) this scene doesn't have and
// HARD_LOCKS.md says not to pull in. A hero's own `attackTiming`
// (BattleConfig.js) merges over these per-attack, same as playAttackCinematic().
const ACTION_POSE_TIMING = Object.freeze({
  step: 220, gather: 450, hold: 120, release: 160, holdImpact: 80, recover: 260
});

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
    // FAI-BATTLE-PRESENTATION-03: the same real attack pose set the 1v1
    // battle already loads (VeilBattleScene.js's own preload loop, mirrored
    // here) — this is a separate Phaser.Game/cache from that scene, so it
    // needs its own load even though the textures/keys are identical.
    // PartyFormationView.create() checks scene.textures.exists() per pose
    // and falls back to the still-image tween path for any hero whose set
    // doesn't fully load, so a partial/failed load degrades, not crashes.
    Object.values(HEROES).forEach(hero => {
      const seen = new Set();
      Object.values(hero.poses || {}).forEach(tex => {
        if (seen.has(tex)) return;
        seen.add(tex);
        this.load.image(tex, `${hero.posePath}${tex}.png`);
      });
    });
    // FAI-BATTLE-PRESENTATION-04: real current-authority attack sheets
    // (currently only Kineza) — a genuine sprite sheet, loaded alongside
    // (not instead of) the legacy pose set above, since Auryi/Prismel
    // still fall back to it per ANIMATION_AUTHORITY_CORRECTION.md.
    Object.values(HERO_ATTACK_SHEETS).forEach(sheet => {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight
      });
    });
    Object.values(HERO_STATE_SHEETS).forEach(sheet => {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight
      });
    });
    Object.values(WRAITH_TEXTURES).forEach(tex => {
      this.load.image(tex, `./assets/enemy/veil_wraith/${tex}.png`);
    });
    this.load.image(ENEMY_DEFAULT.portrait, `./assets/ui/${ENEMY_DEFAULT.portrait}_v34.png`);
    preloadGuiKit(this);
    // FAI-AUDIO-01: constructed here (not create()) because Phaser's
    // preload() must run before the loader starts — the controller owns
    // its own preload() step so PartyBattleScene.js doesn't need to know
    // its asset list.
    this.audio = new PartyBattleAudioController(this);
    this.audio.preload();
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

    // party/enemy must exist before audio.create() — it constructs an
    // EnemyAudioDirector against this.enemy (FAI-AUDIO-02).
    this.party = partyRoster();
    this.enemy = { ...ENEMY_DEFAULT, attack: { ...ENEMY_DEFAULT.attack } };

    this.audio.create();
    this.audio.battleEnter();
    // FAI-AUDIO-02: do not start music unconditionally here anymore — if
    // a mobile-unlock gate is needed, _buildAudioUnlockGate() below owns
    // starting it, on the explicit tap, per MOBILE_AUDIO_UNLOCK.md ("do
    // not wait for the first battle command and then suddenly start the
    // soundtrack" — starting it silently in the locked-and-deferred state
    // is exactly that, just one layer removed). Already-unlocked contexts
    // (desktop, or mobile after a real prior gesture) start immediately.
    if (!this.audio.isLocked()) this.audio.battleMusicStart();

    this.formation = new PartyFormationView(this);
    this.formation.create(this.party);
    this.enemyView = createEnemyView(this, this.enemy);
    this.enemyView.create();

    // FAI-UI-ASSET-01 targeting cursor: world-space (tracks the enemy,
    // never the fixed UI camera), hidden until a damaging command is
    // being considered. PriZim's own review flagged the selected variant
    // as "intentionally loud... reduce scale if it competes with actor
    // art" — sized modestly rather than at the source asset's own scale.
    this._targetCursor = this.add.image(0, 0, GUI_TEXTURES.cursorSelected.key)
      .setDisplaySize(64, 76).setDepth(16).setVisible(false);
    this.worldAdd(this._targetCursor);

    this._buildTargetCard();
    this._buildTurnOrderStrip();
    this._buildPartyStrip();
    this._buildCommandRail();
    this._buildProjectionPanel();
    this._buildBanner();
    this._buildRotateOverlay();
    this._buildAudioUnlockGate();

    this.turnOrder = ['prismel', 'auryi', 'kineza', 'enemy'];
    this.turnIndex = -1;
    this._advanceTurn();
  }

  worldAdd(obj) {
    if (Array.isArray(obj)) obj.forEach(o => this.world.add(o));
    else this.world.add(obj);
    return obj;
  }

  _wait(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  _setAttackPov(heroId, on) {
    if (heroId !== 'kineza') return;
    if (on && this._attackPovActive) return;
    if (!on && !this._attackPovActive) return;
    this._attackPovActive = on;
    this.cameras.main.zoomTo(on ? 1.045 : 1, on ? 120 : 170, 'Sine.easeOut');
    this.formation?.setPovFocus(heroId, on);
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

  // FAI-BATTLE-PRESENTATION-04 (STORYBOOK_HUD_POLISH_DIRECTIVE.md): the
  // flat navy rectangle + stroke read as "prototype/custom fallback," not
  // Storybook-family — DAI's own words on the same card. Rebuilt on the
  // same partyNormal parchment nineslice the hero cards already use (one
  // card language across the whole HUD, not a second bespoke panel style
  // for the enemy alone) with the diamond portrait frame already shipped
  // in the GUI kit but never used anywhere — the enemy_card.png background
  // asset itself stays excluded (baked "THREAT" text — see
  // PartyBattleGuiKit.js's header), only the empty diamond frame is safe.
  _layoutTargetCard() {
    const c = this._targetCardContainer;
    c.removeAll(true);
    const w = Math.round(Math.min(240, this.scale.width * 0.26));
    const h = Math.round(Math.min(58, this.scale.height * 0.145));
    const pad = Math.max(8, Math.round(h * 0.14));

    const insN = NINESLICE_INSETS.partyNormal;
    const bg = this.add.nineslice(
      0, 0, GUI_TEXTURES.partyNormal.key, null, w, h,
      insN.left, insN.right, insN.top, insN.bottom
    ).setOrigin(0, 0);

    const portraitD = Math.round(h * 0.72);
    const diamond = this.add.image(pad + portraitD / 2, h / 2, GUI_TEXTURES.enemyDiamond.key).setDisplaySize(portraitD, portraitD);
    const portrait = this.add.image(pad + portraitD / 2, h / 2, this.enemy.portrait).setDisplaySize(portraitD * 0.72, portraitD * 0.72);

    const contentX = pad + portraitD + 10;
    const nameFont = Math.max(12, Math.round(h * 0.24));
    // Deep crimson on parchment — reads as "danger" while staying inside
    // the same warm-ivory/gold card family the hero cards already use,
    // rather than the old bright pink tuned for a dark navy background.
    const name = this.add.text(contentX, h * 0.16, this.enemy.name, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${nameFont}px`, color: '#7A1F1F',
      stroke: '#F4E9C9', strokeThickness: Math.max(1, Math.round(nameFont * 0.08))
    });

    const barW = w - contentX - pad;
    const barH = Math.max(9, Math.round(h * 0.2));
    const barY = h * 0.58;
    const shell = this.add.image(contentX, barY, GUI_TEXTURES.hpShell.key).setOrigin(0, 0).setDisplaySize(barW, barH);
    const fill = this.add.rectangle(contentX + 2, barY + 2, barW - 4, barH - 4, PALETTE.enemyHp, 1).setOrigin(0, 0);
    const hpText = this.add.text(contentX, barY + barH + 3, `${Math.max(0, this.enemy.hp)} / ${this.enemy.maxHp}`, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${Math.max(9, Math.round(barH * 0.72))}px`, color: '#2A1E12',
      stroke: '#F4E9C9', strokeThickness: 1
    });
    c.add([bg, diamond, portrait, name, shell, fill, hpText]);

    this._targetCard = { container: c, fill, hpText, barW: barW - 4 };
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
  // FAI-UI-ASSET-01: the plain gold-ring highlight is now the real
  // turn_diamond_normal/active frame art, layered behind the same
  // dynamic circular portrait chip this project already used — "Runtime
  // portraits remain dynamic" (FAI_COMPONENT_MAPPING.md) is exactly this:
  // the frame is decorative, the portrait inside it is still real data.
  _buildTurnOrderStrip() {
    const c = this.add.container(0, 0).setDepth(10);
    const order = ['prismel', 'auryi', 'kineza', 'enemy'];
    const slot = 52;
    this._turnChips = {};
    order.forEach((id, i) => {
      const x = i * slot;
      const diamond = this.add.image(x + 20, 20, GUI_TEXTURES.turnNormal.key).setDisplaySize(40, 40);
      const tex = id === 'enemy' ? this.enemy.portrait : HEROES[id].portrait;
      const chip = this.add.image(x + 20, 20, tex).setDisplaySize(26, 26);
      c.add([diamond, chip]);
      this._turnChips[id] = diamond;
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
    Object.entries(this._turnChips).forEach(([key, diamond]) => {
      diamond.setTexture(key === id ? GUI_TEXTURES.turnActive.key : GUI_TEXTURES.turnNormal.key);
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
    // Nudged in from the card edges (name 0.10->0.17, text 0.80->0.74) —
    // party_card_normal's own painted border carries a shadow band along
    // the top and bottom that isn't part of the 9-slice insets, so text
    // placed right at the old fractions sat on top of that shadow instead
    // of the clear parchment field. Confirmed by screenshot, not guessed.
    const nameY = Math.round(cardH * 0.17);
    const textY = Math.round(cardH * 0.74);
    const textFont = Math.max(8, Math.round(cardH * 0.135));

    this.party.forEach((hero, i) => {
      const x = i * (cardW + gap);
      const insN = NINESLICE_INSETS.partyNormal;
      const bg = this.add.nineslice(
        x, 0, GUI_TEXTURES.partyNormal.key, null, cardW, cardH,
        insN.left, insN.right, insN.top, insN.bottom
      ).setOrigin(0, 0);
      // Active-state glow — see _highlightHeroCard's comment for why this
      // is a stroke, not the active nineslice texture. Violet/prismatic,
      // per STORYBOOK_HUD_POLISH_DIRECTIVE.md's palette rule ("violet /
      // prismatic glow only for active/selected emphasis") — was a plain
      // cyan stroke, outside that family entirely.
      const glow = this.add.rectangle(x - 2, -2, cardW + 4, cardH + 4, 0x000000, 0)
        .setOrigin(0, 0).setStrokeStyle(2.6, 0xc98cff, 0.95).setVisible(false);
      const portrait = this.add.image(x + 12 + portraitD / 2, cardH / 2, hero.portrait).setDisplaySize(portraitD, portraitD);
      const barW = Math.max(50, cardW - contentX - 12);
      const name = this.add.text(x + contentX, nameY, hero.name, {
        fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${nameFont}px`, color: '#2A1E12',
        stroke: '#F4E9C9', strokeThickness: Math.max(1, Math.round(nameFont * 0.08))
      });
      // Storybook meter shells (dark pill w/ gold border) as the track,
      // colored fill drawn on top inset within the shell's own border —
      // same "shell background, runtime fill on top" split the shells'
      // own README calls for ("fill amount/color is runtime-driven").
      const hpShell = this.add.image(x + contentX, hpBarY, GUI_TEXTURES.hpShell.key)
        .setOrigin(0, 0).setDisplaySize(barW, hpBarH);
      const hpFill = this.add.rectangle(x + contentX + 2, hpBarY + 2, barW - 4, hpBarH - 4, PALETTE.hp, 1).setOrigin(0, 0);
      const rpShell = this.add.image(x + contentX, rpBarY, GUI_TEXTURES.rpShell.key)
        .setOrigin(0, 0).setDisplaySize(barW, rpBarH);
      const rpFill = this.add.rectangle(x + contentX + 2, rpBarY + 2, barW - 4, rpBarH - 4, PALETTE.rp, 1).setOrigin(0, 0);
      // Narrow cards (portrait's 3-across row) can't fit the full "HP
      // x/y  RP x/y" label without overflowing the card — the bars
      // already carry the same information visually, so a narrow card
      // just shows bare numbers instead of dropping information.
      const hpLabel = cardW < 130
        ? `${hero.currentHp}/${hero.maxHp}  ${hero.currentRp}/${hero.maxRp}`
        : `HP ${hero.currentHp}/${hero.maxHp}  RP ${hero.currentRp}/${hero.maxRp}`;
      const hpText = this.add.text(x + contentX, textY, hpLabel, {
        fontFamily: 'Georgia, serif', fontSize: `${textFont}px`, color: '#2A1E12',
        stroke: '#F4E9C9', strokeThickness: Math.max(1, Math.round(textFont * 0.1))
      });
      // Guard/Prepared badge — deliberately small (PriZim's own review:
      // "reduce display size so it reads as a status indicator rather
      // than a crest") — top-right corner of the card, hidden by default.
      const guardBadge = this.add.image(x + cardW - 14, 12, GUI_TEXTURES.guardBadge.key)
        .setDisplaySize(20, 22).setVisible(false);
      c.add([bg, glow, portrait, name, hpShell, hpFill, rpShell, rpFill, hpText, guardBadge]);
      this._heroCards[hero.id] = {
        bg, glow, portrait, name, hpShell, rpShell, hpFill, rpFill, hpText, guardBadge,
        barW: barW - 4, compact: cardW < 130
      };
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
    this._applyCardAlpha(heroId);
    card.guardBadge.setVisible(!!hero.guarding);
  }

  // Single source of truth for a card's alpha — dead beats inactive beats
  // active, in that priority order. _updateHeroCard() (fires on HP/RP/
  // death changes) and _highlightHeroCard() (fires on turn advance) both
  // need to set this, and previously each wrote to card.bg.alpha
  // independently — a dead hero's dimming could get silently overwritten
  // the next time the turn indicator moved to someone else. One function,
  // called from both.
  _applyCardAlpha(heroId) {
    const hero = this.party.find(h => h.id === heroId);
    const card = this._heroCards[heroId];
    if (!hero || !card) return;
    const alpha = !hero.alive ? 0.4 : (heroId === this.activeHeroId ? 1 : 0.74);
    [card.bg, card.portrait, card.name, card.hpShell, card.rpShell, card.hpFill, card.rpFill, card.hpText]
      .forEach(obj => obj.setAlpha(alpha));
  }

  // FAI-UI-ASSET-01: party_card_active/normal are two distinct nineslice
  // textures (a glowing frame vs. a plain one), not a stroke-color swap —
  // texture change is the "active state" here, same idea as the command
  // buttons but via ASSET_MAP rather than a stroke.
  // party_card_active.png is SCALING_RULES.json's own "9slice_review"
  // flag, not "9slice_ok" — confirmed why the hard way: at this card's
  // actual compact height (~55-90px, locked by REVISED_VISUAL_RATIOS.json's
  // party_band_target of 14-18% viewport height) its ornament insets don't
  // fit, and 9-slicing it produced a visibly smeared/duplicated border
  // (screenshotted, not assumed). party_card_normal (the "ok"-listed one)
  // renders cleanly at the same compression. Every card stays on the
  // normal texture; "active" is a separate glow stroke instead of a
  // texture swap, sidestepping the broken asset rather than forcing it.
  // FAI-BATTLE-PRESENTATION-04 (STORYBOOK_HUD_POLISH_DIRECTIVE.md):
  // "selected hero should look 'page-open'/illuminated — inactive cards
  // quieter, not dead." Previously every card sat at full alpha
  // regardless of turn state, so "active" was only the thin glow border —
  // easy to miss at a glance. Inactive cards now dim modestly (never to
  // guardBadge-style "dead," just quieter) and the active glow gets a
  // slow pulse instead of a static stroke, so it actually reads as "lit"
  // rather than just "outlined."
  _highlightHeroCard(heroId) {
    // this.activeHeroId is set by _advanceTurn() just before this call for
    // the hero path — _applyCardAlpha() reads it directly, so this only
    // needs to (re)apply it per card and own the glow's visibility/pulse.
    Object.keys(this._heroCards).forEach(id => {
      this._applyCardAlpha(id);
      const card = this._heroCards[id];
      const active = id === heroId;
      this.tweens.killTweensOf(card.glow);
      card.glow.setVisible(active);
      if (active) {
        card.glow.setAlpha(1);
        this.tweens.add({
          targets: card.glow, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }
    });
  }

  // Swaps a command button between its normal/selected/disabled art —
  // selected on hover/press (there's no persistent "selection" state once
  // the drawer takes over, so this is a momentary hover cue), disabled
  // reserved for a future affordability gate (e.g. Resonart with
  // insufficient RP) rather than wired to anything yet.
  _setCommandButtonVisual(label, state) {
    const btn = this._commandButtons[label];
    if (!btn) return;
    btn.state = state;
    const texKey = state === 'selected' ? GUI_TEXTURES.cmdSelected.key
      : state === 'disabled' ? GUI_TEXTURES.cmdDisabled.key
      : GUI_TEXTURES.cmdNormal.key;
    const ins = state === 'selected' ? NINESLICE_INSETS.cmdSelected
      : state === 'disabled' ? NINESLICE_INSETS.cmdDisabled
      : NINESLICE_INSETS.cmdNormal;
    btn.bg.setTexture(texKey);
    if (typeof btn.bg.leftWidth === 'number') {
      btn.bg.leftWidth = ins.left; btn.bg.rightWidth = ins.right;
      btn.bg.topHeight = ins.top; btn.bg.bottomHeight = ins.bottom;
    }
  }

  // --- HUD: 4-command rail + contextual Resonart/Item drawers ----------
  // Vertical stack on the left, matching the reference concept art's
  // command-list placement (STORYBOOK_UI_PALETTE_REFERENCE.png) — a
  // horizontal row here collided with the party strip; a left column
  // shares no horizontal band with anything else on screen.
  // FAI-UI-ASSET-01: command buttons now render the real storybook
  // nineslice art (normal/selected/disabled) instead of a flat rectangle.
  // Phaser's built-in nineslice (confirmed available — this bundled
  // Phaser is 3.70) is what SCALING_RULES.json calls these three safe
  // for; the disabled/normal-review flag there is about the shorter,
  // taller disabled variant needing its own insets, not about avoiding
  // nineslice altogether — handled via NINESLICE_INSETS per state.
  _buildCommandRail() {
    const c = this.add.container(0, 0).setDepth(11);
    this._commandButtons = {};
    const btnW = COMMAND_RAIL_W, btnH = 44, gap = 6;
    BASE_COMMANDS.forEach((label, i) => {
      const y = i * (btnH + gap);
      const ins = NINESLICE_INSETS.cmdNormal;
      const bg = this.add.nineslice(
        0, y, GUI_TEXTURES.cmdNormal.key, null, btnW, btnH,
        ins.left, ins.right, ins.top, ins.bottom
      ).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      const text = this.add.text(btnW / 2, y + btnH / 2, label.toUpperCase(), {
        fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '15px', color: '#2A1E12',
        stroke: '#F4E9C9', strokeThickness: 1.5
      }).setOrigin(0.5);
      bg.on('pointerdown', () => this._onCommand(label));
      bg.on('pointerover', () => this._setCommandButtonVisual(label, 'selected'));
      bg.on('pointerout', () => this._setCommandButtonVisual(label, 'normal'));
      c.add([bg, text]);
      this._commandButtons[label] = { bg, text, btnW, btnH, state: 'normal' };
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
    const insD = NINESLICE_INSETS.resonartDrawer;
    const dBg = this.add.nineslice(
      0, 0, GUI_TEXTURES.resonartDrawer.key, null, 300, 170,
      insD.left, insD.right, insD.top, insD.bottom
    ).setOrigin(0, 0);
    const dTitle = this.add.text(16, 12, '', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '19px', color: '#4A2E7A'
    });
    const dDetail = this.add.text(16, 40, '', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4A3826', wordWrap: { width: 268 }
    });
    // FAI-BATTLE-PRESENTATION-04 (STORYBOOK_HUD_POLISH_DIRECTIVE.md):
    // "ABILITY NAME / short effect sentence / RP COST - TARGET / DAMAGE
    // RANGE  HIT % / Use-Back" — split into two lines (RP+Target, then
    // Damage+Hit) instead of the old single damage/hit blob, per
    // _onCommand()'s own formatting below. A thin gold rule under the
    // title separates identity from the stat block, matching the
    // "authored, not debug/raw" ask more than a denser text stack alone.
    const dRule = this.add.rectangle(16, 34, 268, 1, PALETTE.gold, 0.55).setOrigin(0, 0);
    const dStats = this.add.text(16, 100, '', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#2A1E12', lineSpacing: 6
    });
    const insU = NINESLICE_INSETS.cmdNormal;
    const useBtn = this.add.nineslice(16, 138, GUI_TEXTURES.cmdNormal.key, null, 128, 30, insU.left, insU.right, insU.top, insU.bottom)
      .setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const useText = this.add.text(16 + 64, 138 + 15, 'USE', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '14px', color: '#2A1E12',
      stroke: '#F4E9C9', strokeThickness: 1.5
    }).setOrigin(0.5);
    const closeBtn = this.add.nineslice(160, 138, GUI_TEXTURES.cmdNormal.key, null, 128, 30, insU.left, insU.right, insU.top, insU.bottom)
      .setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(160 + 64, 138 + 15, 'BACK', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '14px', color: '#2A1E12',
      stroke: '#F4E9C9', strokeThickness: 1.5
    }).setOrigin(0.5);
    drawer.add([dBg, dTitle, dRule, dDetail, dStats, useBtn, useText, closeBtn, closeText]);
    this.uiAdd(drawer);
    const insS = NINESLICE_INSETS.cmdSelected;
    const setDrawerBtnState = (btn, state) => {
      btn.setTexture(state === 'selected' ? GUI_TEXTURES.cmdSelected.key : GUI_TEXTURES.cmdNormal.key);
      const ins = state === 'selected' ? insS : insU;
      if (typeof btn.leftWidth === 'number') {
        btn.leftWidth = ins.left; btn.rightWidth = ins.right;
        btn.topHeight = ins.top; btn.bottomHeight = ins.bottom;
      }
    };
    useBtn.on('pointerover', () => setDrawerBtnState(useBtn, 'selected'));
    useBtn.on('pointerout', () => setDrawerBtnState(useBtn, 'normal'));
    closeBtn.on('pointerover', () => setDrawerBtnState(closeBtn, 'selected'));
    closeBtn.on('pointerout', () => setDrawerBtnState(closeBtn, 'normal'));
    useBtn.on('pointerdown', () => this._confirmDrawer());
    closeBtn.on('pointerdown', () => { this.audio.uiReject(); this._closeDrawer(); });
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
    // FAI-UI-ASSET-01: victory_frame is deliberately its own object,
    // hidden until _onVictory()/_onDefeat() and sized well below its
    // source resolution — PriZim's own review called the frame "slightly
    // more ornate than the battle HUD... test intensity," and 565x244
    // full-size would dominate a 390px-tall landscape viewport outright.
    // Fixed-aspect scale, never stretched independently on each axis
    // (matches SCALING_RULES.json's fixed_aspect_or_cap_stretch list).
    const frame = this.add.image(0, 0, GUI_TEXTURES.victoryFrame.key)
      .setDepth(14).setVisible(false);
    this.uiAdd(frame);
    this._victoryFrame = frame;

    // FAI-BATTLE-PRESENTATION-04: flat pale gold fill with no stroke or
    // shadow read as "pale temporary text" against a busy battlefield
    // (STORYBOOK_HUD_POLISH_DIRECTIVE.md's own words, aimed at Victory
    // specifically) — a dark ink stroke + shadow gives it real contrast
    // and weight without touching the color itself. This is the same
    // object turn text uses too, so the fix benefits both, not just the
    // victory/defeat moment.
    const t = this.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '22px', color: '#FFE8A0',
      stroke: '#2A1408', strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 6, fill: true }
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
      if (frame.visible) this._layoutVictoryFrame();
    };
    relayout();
    this._registerRelayout(relayout);
  }

  _layoutVictoryFrame() {
    const frame = this._victoryFrame;
    const w = Math.min(340, this.scale.width * 0.5);
    // Ratio from the raw source image, not frame.width/height — those
    // become the mutated display size after the first setDisplaySize()
    // call, which would compound on every subsequent resize.
    const src = frame.texture.getSourceImage();
    const ratio = (src && src.width && src.height) ? src.width / src.height : 2.3;
    frame.setDisplaySize(w, w / ratio);
    frame.setPosition(this.scale.width / 2, this._banner.y);
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
      this.activeHeroId = null;
      this._highlightHeroCard(null); // no hero card reads as "active" during the enemy's own turn
      this.formation.setActive(null);
      this._setBanner('Enemy Turn');
      this._hideCommandRail();
      this.time.delayedCall(500, () => this._runEnemyTurn());
      return;
    }

    const hero = this.party.find(h => h.id === actor);
    if (!hero || !hero.alive) { this._advanceTurn(); return; }

    this._highlightTurnChip(actor);
    // Set before _highlightHeroCard() — it (via _applyCardAlpha()) reads
    // this.activeHeroId to decide which card gets full alpha, so it has
    // to already reflect the new turn, not the one just ending.
    this.activeHeroId = actor;
    this._highlightHeroCard(actor);
    this.formation.setActive(actor);
    this._setBanner(`${hero.name}'s Turn`);
    this.audio.turnStart(actor);
    if (this.formation.hasTurnEntry(actor)) {
      this._turnLock = true;
      this._hideCommandRail();
      this.formation.playTurnEntry(actor).then(() => {
        if (this.activeHeroId !== actor) return;
        this._turnLock = false;
        this._showCommandRail();
      });
    } else {
      this._showCommandRail();
    }
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
    this.audio.uiMove();

    if (label === 'Attack') {
      const { low, high } = projectedDamage(hero, 'Attack');
      const hitPct = Math.round(hitChanceFor('Attack') * 100);
      this._drawer.title.setText('ATTACK');
      this._drawer.detail.setText('A basic strike — free, always available.');
      this._drawer.stats.setText(
        `RP Cost: —  •  Target: ${this.enemy.name}\n` +
        `Damage: ${low}-${high}   Hit: ${hitPct}%`
      );
      this._showTargetCursor();
    } else if (label === 'Resonart') {
      const { low, high } = projectedDamage(hero, 'Resonart');
      const hitPct = Math.round(hitChanceFor('Resonart') * 100);
      const affordable = hero.currentRp >= RESONART_RP_COST;
      this._drawer.title.setText(hero.attack.name.toUpperCase());
      this._drawer.detail.setText(hero.attack.flavor || 'A signature technique.');
      this._drawer.stats.setText(
        `RP Cost: ${RESONART_RP_COST}${affordable ? '' : ' (not enough)'}  •  Target: ${this.enemy.name}\n` +
        `Damage: ${low}-${high}   Hit: ${hitPct}%`
      );
      this._showTargetCursor();
    } else if (label === 'Guard') {
      this._drawer.title.setText('GUARD');
      this._drawer.detail.setText(`${hero.name} braces for the enemy's next attack.`);
      this._drawer.stats.setText('Damage Reduction: 50%');
      this._hideTargetCursor();
    } else if (label === 'Item') {
      const item = ITEM_DEFS[0];
      this._drawer.title.setText(item.name.toUpperCase());
      this._drawer.detail.setText(`Restores ${item.heal} HP to ${hero.name}.`);
      this._drawer.stats.setText('Target: Self');
      this._hideTargetCursor();
    }
    this._drawer.container.setVisible(true);
  }

  _showTargetCursor() {
    const wasVisible = this._targetCursor.visible;
    const enemyAnchor = this.enemyView.container;
    const enemySprite = this.enemyView.sprite;
    this._targetCursor.setPosition(enemyAnchor.x, enemyAnchor.y - (enemySprite.displayHeight || 120) * 0.55);
    this._targetCursor.setVisible(true);
    if (!wasVisible) this.audio.targetAcquire(); // fire once per acquisition, not on every re-layout
  }

  _hideTargetCursor() {
    this._targetCursor.setVisible(false);
  }

  _closeDrawer() {
    this._drawerOpen = null;
    if (this._drawer) this._drawer.container.setVisible(false);
    this._hideTargetCursor();
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
    // FAI-AUDIO-02 (UI_AUDIO_SEMANTICS.md): uiConfirm() used to fire
    // unconditionally before the Resonart RP check, so an unaffordable
    // Resonart said "yes" sonically and then silently refused — the
    // insufficient-RP branch now checks and plays uiReject() BEFORE
    // anything else runs, and every other branch plays uiConfirm() only
    // once it's actually committing to the action, not on drawer entry.
    if (label === 'Resonart' && hero.currentRp < RESONART_RP_COST) {
      this.audio.uiReject();
      return; // visibly insufficient, no-op
    }
    this.audio.uiConfirm();
    if (label === 'Attack') {
      this._closeDrawer();
      this._resolveHeroAction(hero, 'Attack');
    } else if (label === 'Resonart') {
      hero.currentRp -= RESONART_RP_COST;
      this._closeDrawer();
      this._resolveHeroAction(hero, 'Resonart');
    } else if (label === 'Guard') {
      this._turnLock = true;
      this._hideCommandRail();
      hero.guarding = true;
      this.formation.guardPose(hero.id, true);
      this._updateHeroCard(hero.id);
      this._setBanner(`${hero.name} guards.`);
      this.audio.guard(hero.id);
      this._turnLock = false;
      this._endHeroTurn();
    } else if (label === 'Item') {
      this._turnLock = true;
      this._hideCommandRail();
      const item = ITEM_DEFS[0];
      hero.currentHp = Math.min(hero.maxHp, hero.currentHp + item.heal);
      this._updateHeroCard(hero.id);
      this._setBanner(`${hero.name} uses ${item.name}!`);
      this.audio.itemUse(item.id);
      this._turnLock = false;
      this._endHeroTurn();
    }
  }

  async _resolveHeroAction(hero, command) {
    this._turnLock = true;
    this._hideCommandRail();
    const { low, high } = projectedDamage(hero, command);
    const hitRoll = Math.random() < hitChanceFor(command);

    // FAI-BATTLE-PRESENTATION-04 (ANIMATION_AUTHORITY_CORRECTION.md):
    // Kineza's real current-authority Basic Attack sheet outranks the
    // BP03 pose-swap — checked first, per-hero, so Auryi/Prismel (who
    // have no current sheet) fall through to the pose-swap path below
    // exactly as before. Markers fire from the sheet's own real frames
    // (formation.playAttackSheet's onFrame callback), not a fixed-timing
    // guess — this is what "synchronize attack event markers to actual
    // current frames" means concretely.
    if (command === 'Attack' && this.formation.hasAttackSheet(hero.id)) {
      const cfg = this.formation.actors.get(hero.id).attackSheetConfig;
      const isMarkerFrame = (frameIndex, marker) => cfg.markerFrames[marker].includes(frameIndex);
      let dmg = 0;
      const seen = new Set();
      await this.formation.playAttackSheet(hero.id, frameIndex => {
        const povFrames = cfg.povFrames || [];
        if (povFrames.length) {
          if (frameIndex === povFrames[0]) this._setAttackPov(hero.id, true);
          if (frameIndex > povFrames[povFrames.length - 1]) this._setAttackPov(hero.id, false);
        }
        if (isMarkerFrame(frameIndex, 'gather') && !seen.has('gather')) {
          seen.add('gather');
          this.audio.attackGather(hero.id);
        } else if (isMarkerFrame(frameIndex, 'release') && !seen.has('release')) {
          seen.add('release');
          this.audio.attackRelease(hero.id);
        } else if (isMarkerFrame(frameIndex, 'impact') && !seen.has('impact')) {
          seen.add('impact');
          if (hitRoll) {
            dmg = Phaser.Math.Between(low, high);
            this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
            this._updateTargetCard();
            this.enemyView.hit();
            this._floatText(`-${dmg}`, '#FFD8D8');
            this._setBanner(`${hero.name} uses ${command === 'Resonart' ? hero.attack.name : 'Attack'} for ${dmg} damage!`);
            this.audio.attackImpact(hero.id);
            this.audio.enemyHit();
            if (this.enemy.hp <= 0) {
              this.enemyView.die();
              this.audio.enemyDefeat();
            }
          } else {
            this._setBanner(`${hero.name} uses ${command === 'Resonart' ? hero.attack.name : 'Attack'} — missed!`);
          }
        } else if (isMarkerFrame(frameIndex, 'recover') && !seen.has('recover')) {
          seen.add('recover');
        }
      });
      this._setAttackPov(hero.id, false);

      this._turnLock = false;
      this._endHeroTurn();
      return;
    }

    // FAI-BATTLE-PRESENTATION-03/04: Prismel's Gather->Release and
    // Auryi's OrbGather->VeilPulse (BattleConfig.js's 1v1 pose set) —
    // reached only when the hero has no current-authority attack sheet
    // (the branch above). Neither is current Party Battle attack
    // authority per ANIMATION_AUTHORITY_CORRECTION.md — both are
    // explicitly TEMPORARY FALLBACK, kept only because DAI has not yet
    // supplied a current Basic Attack for either character. Drops back
    // further still, to the FAI-AUDIO-02 tween pair, for any hero whose
    // pose set doesn't even load — reported once, not faked.
    const useRealPoses = this.formation.hasActionPoses(hero.id);

    if (useRealPoses) {
      const timing = { ...ACTION_POSE_TIMING, ...(hero.attackTiming || {}) };

      // actionStart / Step — the ready/anticipation beat.
      this.formation.setActionPose(hero.id, 'step');
      await this._wait(timing.step);

      // Gather — coil / focus / orb-gather. Audio fires the same beat the
      // pose visibly begins preparing, per ANIMATION_EVENT_MARKERS.md.
      this.audio.attackGather(hero.id);
      this.formation.setActionPose(hero.id, 'gather');
      await this._wait(timing.gather + timing.hold);

      // Release — the attack visibly commits (strike/prismatic release/
      // veil pulse leaves the hero).
      this.audio.attackRelease(hero.id);
      this.formation.setActionPose(hero.id, 'release');
      await this._wait(timing.release);

      if (!hitRoll) {
        this._setBanner(`${hero.name} uses ${command === 'Resonart' ? hero.attack.name : 'Attack'} — missed!`);
        this.formation.setActionPose(hero.id, 'recover');
        await this._wait(timing.recover);
        this.formation.setActionPose(hero.id, 'idle');
        this._turnLock = false;
        this._endHeroTurn();
        return;
      }

      // Impact — same beat as damage applying and the enemy's hit
      // reaction, held briefly on the Release pose (no separate impact
      // art exists for any hero, matching how the 1v1 battle's own
      // playAttackCinematic() does this).
      await this._wait(timing.holdImpact);
      const dmg = Phaser.Math.Between(low, high);
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this._updateTargetCard();
      this.enemyView.hit();
      this._floatText(`-${dmg}`, '#FFD8D8');
      this._setBanner(`${hero.name} uses ${command === 'Resonart' ? hero.attack.name : 'Attack'} for ${dmg} damage!`);
      this.audio.attackImpact(hero.id);
      this.audio.enemyHit();

      if (this.enemy.hp <= 0) {
        this.enemyView.die();
        this.audio.enemyDefeat();
      }

      // Recover — settle/recompose, then a clean return to standby.
      this.formation.setActionPose(hero.id, 'recover');
      await this._wait(timing.recover);
      this.formation.setActionPose(hero.id, 'idle');

      this._turnLock = false;
      this._endHeroTurn();
      return;
    }

    // --- Fallback: still-image scale-pulse + lunge (FAI-AUDIO-02) -----
    this.audio.attackGather(hero.id);
    await this.formation.attackGatherPulse(hero.id);
    this.audio.attackRelease(hero.id);
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
    this.audio.attackImpact(hero.id);
    this.audio.enemyHit();

    if (this.enemy.hp <= 0) {
      this.enemyView.die();
      this.audio.enemyDefeat();
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
    this._hideTargetCursor();
    this.formation.setActive(null); // clear the last actor's ring — no one's turn now
    this._softenSecondaryHud();
    this._showVictoryFrame();
    this.tweens.add({
      targets: this._banner, scale: 1.6, duration: 420, ease: 'Back.easeOut'
    });
    this._setBanner('VICTORY');
    // Fired exactly here, at the victory-state commit — not earlier —
    // per PZ_AUDIO_GATE_V1.json's "victory cue does not fire before
    // defeat commit" timing rule.
    this.audio.battleMusicStop();
    this.audio.victory();
  }

  _onDefeat() {
    this._hideCommandRail();
    this._hideTargetCursor();
    this.formation.setActive(null);
    this._softenSecondaryHud();
    this._showVictoryFrame();
    this.tweens.add({
      targets: this._banner, scale: 1.6, duration: 420, ease: 'Back.easeOut'
    });
    this._setBanner('DEFEAT');
    // No "defeat" cue exists in IMPLEMENT_NOW.md's event vocabulary
    // (only "victory" is listed) — stopping music is the one thing that's
    // unambiguously correct here; a real defeat stinger needs a DAI call,
    // not an invented substitute from the legacy reference set.
    this.audio.battleMusicStop();
  }

  _softenSecondaryHud() {
    this.tweens.add({ targets: this._targetCardContainer, alpha: 0.18, duration: 380, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this._turnOrderContainer, alpha: 0, duration: 300, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this._partyStripContainer, alpha: 0.55, duration: 380, ease: 'Sine.easeOut' });
  }

  _showVictoryFrame() {
    this._layoutVictoryFrame();
    this._victoryFrame.setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this._victoryFrame, alpha: 1, duration: 420, ease: 'Sine.easeOut' });
  }

  // FAI-UI-ASSET-01 rotate-device overlay — new functionality, not a
  // reskin of anything that already existed. This whole mode is
  // landscape-phone-first per every FAI-HUD-01 addendum so far; nothing
  // previously stopped someone from playing it in portrait (cramped, but
  // functional). This blocks that outright: full-screen scrim + the
  // fixed-aspect rotate frame + input disabled underneath, shown/hidden
  // on orientation change, restored to whatever this.input.enabled was
  // before (never assumes it was true — a future pause/menu state could
  // have legitimately disabled it already).
  _buildRotateOverlay() {
    const c = this.add.container(0, 0).setDepth(2000);
    const scrim = this.add.rectangle(0, 0, 10, 10, 0x07060f, 0.94).setOrigin(0, 0);
    const frame = this.add.image(0, 0, GUI_TEXTURES.rotateDevice.key);
    const label = this.add.text(0, 0, 'Rotate your device to landscape', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '15px', color: '#F4E9C9', align: 'center'
    }).setOrigin(0.5);
    c.add([scrim, frame, label]);
    this.uiAdd(c);
    this._rotateOverlay = { container: c, scrim, frame, label };

    const layout = () => this._layoutRotateOverlay();
    layout();
    this._registerRelayout(layout);
  }

  // FAI-AUDIO-02 / MOBILE_AUDIO_UNLOCK.md: party-battle-v1.html is a
  // direct dev route with no prior title/encounter screen to supply the
  // unlock gesture, so DAI's "Preferred flow" (unlock happens before the
  // battle scene needs audible playback) isn't available here — the
  // explicit fallback the same doc calls for is this gate. The scrim
  // itself is interactive and consumes the tap (rather than disabling
  // scene.input like the rotate overlay does) specifically so the tap
  // that dismisses it is also a real gesture Phaser's own unlock listener
  // sees — disabling input first would have blocked that gesture from
  // ever reaching anything, including the gate's own tap target.
  _buildAudioUnlockGate() {
    const c = this.add.container(0, 0).setDepth(2100).setVisible(false);
    const scrim = this.add.rectangle(0, 0, 10, 10, 0x07060f, 0.92).setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(0, 0, '♪ Tap to Enable Audio ♪', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '20px', color: '#F4E9C9'
    }).setOrigin(0.5);
    c.add([scrim, label]);
    this.uiAdd(c);
    this._audioGate = { container: c, scrim, label };

    scrim.on('pointerdown', () => this._dismissAudioGate());
    this.audio.onUnlocked(() => this._dismissAudioGate());

    // Rotate takes priority — this.input is fully disabled while that
    // overlay blocks (see _layoutRotateOverlay), which would make this
    // gate's own tap target unreachable too. Registered after the rotate
    // overlay's own relayout (both via _registerRelayout, called in
    // Phaser's listener-registration order), so _rotateOverlayBlocking is
    // already current by the time this reads it on every resize.
    const layout = () => {
      scrim.setSize(this.scale.width, this.scale.height);
      label.setPosition(this.scale.width / 2, this.scale.height / 2);
      if (this._stillLocked && this._rotateOverlayBlocking) c.setVisible(false);
      else if (this._stillLocked) c.setVisible(true);
    };
    layout();
    this._registerRelayout(layout);

    // Shown only once we know for certain — asked immediately after
    // construction, not deferred, so the gate never flashes visible on an
    // already-unlocked desktop context before this check runs.
    this._stillLocked = this.audio.isLocked();
    layout();
  }

  // Not gated on the container's current visibility — this also runs as
  // the audio.onUnlocked() callback, which can fire while the gate is
  // hidden behind the rotate overlay (unlock reaching Phaser through some
  // other gesture entirely). battleMusicStart() is already idempotent, so
  // calling it unconditionally here is safe either way.
  _dismissAudioGate() {
    this._stillLocked = false;
    if (this._audioGate) this._audioGate.container.setVisible(false);
    this.audio.battleMusicStart();
  }

  _layoutRotateOverlay() {
    const { container, scrim, frame, label } = this._rotateOverlay;
    const w = this.scale.width, h = this.scale.height;
    const portrait = h >= w;
    container.setVisible(portrait);
    if (!portrait) {
      if (this._rotateOverlayBlocking) { this.input.enabled = this._preRotateInputEnabled; this._rotateOverlayBlocking = false; }
      return;
    }
    if (!this._rotateOverlayBlocking) { this._preRotateInputEnabled = this.input.enabled; this._rotateOverlayBlocking = true; }
    this.input.enabled = false;
    scrim.setSize(w, h);
    const frameW = Math.min(320, w * 0.86);
    const src = frame.texture.getSourceImage();
    const ratio = (src && src.width && src.height) ? src.width / src.height : 3.07;
    frame.setDisplaySize(frameW, frameW / ratio);
    frame.setPosition(w / 2, h * 0.42);
    label.setPosition(w / 2, frame.y + frame.displayHeight / 2 + 28);
    label.setWordWrapWidth(w * 0.8);
  }
}
