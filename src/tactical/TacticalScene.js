// Tactical Field Foundation v2 — TacticalScene.
// Owns phase sequencing, objectives, enemy intent, victory/defeat, and
// coordination between the other tactical modules. Camera logic stays in
// TacticalCamera; presentation stays in BattleCinematic; this module only
// decides *when* those things happen.
import { GRID, TILE, ZOOM, TIMING, BREAKPOINTS, INPUT } from './TacticalConfig.js?v=49';
import TerrainRegistry from './TerrainRegistry.js?v=49';
import TacticalGrid from './TacticalGrid.js?v=49';
import TacticalPathfinder from './TacticalPathfinder.js?v=49';
import TacticalCamera from './TacticalCamera.js?v=49';
import UnitController from './UnitController.js?v=49';
import BattleCinematic from './BattleCinematic.js?v=49';
import TacticalActionConsole from './TacticalActionConsole.js?v=51';

// Placeholder combat stats — this pass is engineering foundation, not
// balance. DECISION_LOG.md explicitly defers balance testing to later.
// requiresLineOfSight is explicit per hero rather than inferred from range
// numbers (e.g. "max range > 1") — the spec's actual rule is about attack
// *type* (direct ranged vs. adjacent), and an inferred proxy would silently
// break the moment a future hero has a ranged-but-max-1 kit.
// Accent colors match the values already established for these characters
// elsewhere in the project (BattleConfig.js, EnemyCatalog.js), not
// invented fresh here. `cinematicKey` points to the real portrait art used
// in BattleCinematic's close-up cut-in. `title` is identity/flavor
// language (v0.4 COMMAND_LEXICON_LOCK.md) — shown on the hero card, never
// as an action-button label. rp/maxRp/attunement/attunementMax are v0.4
// HP/RP/Attunement architecture placeholders (HUD_DATA_REFERENCE.json) —
// numbers are for plumbing/UI QA, not a balance lock.
const HERO_STATS = Object.freeze({
  prismel: { hp: 24, atk: 6, cinematicKey: 'portrait_prismel', name: 'Prismel', title: 'Prism Weaver', ability: 'Prismatic Shard', flavor: 'Crystal light converges...', accent: 0x67c8ff, requiresLineOfSight: true, label: 'Pr', rp: 100, maxRp: 100, attunement: 0, attunementMax: 3 },
  auryi: { hp: 30, atk: 4, healAmount: 8, cinematicKey: 'portrait_auryi', name: 'Auryi', title: 'Aura Acolyte', ability: 'Lumisong Renewal', flavor: 'A gentle song of restoration...', accent: 0xc8a8ff, requiresLineOfSight: true, label: 'Au', rp: 100, maxRp: 100, attunement: 0, attunementMax: 3 },
  kineza: { hp: 26, atk: 7, cinematicKey: 'portrait_kineza', name: 'Kineza', title: 'Momentum Born', ability: 'Momentum Fist', flavor: 'Kinetic force coils tight...', accent: 0x68ff8c, requiresLineOfSight: false, label: 'Ki', rp: 100, maxRp: 100, attunement: 0, attunementMax: 3 }
});

// Player-facing command lexicon — LOCKED (v0.4 COMMAND_LEXICON_LOCK.md):
// ATTACK | RESONART | ATTUNE | VEILSHIFT | GUARD | WAIT. Character titles
// (Prism Weaver / Aura Acolyte / Momentum Born, see HERO_STATS) are never
// used as button text — RESONART is the universal label for every hero's
// technique slot. Action menu buttons carry a stable `kind` separate from
// their display `label` so a relabel can never desync dispatch/enable
// logic from what's on screen. ATTACK and RESONART both route through
// the v0.4 Tactical<->Battle Presentation bridge (enterLinkedBattle());
// ATTUNE/VEILSHIFT/GUARD/WAIT stay tactical-only for this pass, per the
// bridge spec's explicit scope, but already carry stable kinds so a
// later presentation hook is a new branch, not a bridge rewrite. ATTUNE
// keeps resonateNode()'s real behavior (the deprecated "Resonate"
// wording only changed player-facing, not the mechanic); VEILSHIFT
// stays a narrated placeholder — full mechanics are an explicit non-goal.
const ACTION_DEFS = Object.freeze([
  { kind: 'attack', label: 'ATTACK' },
  { kind: 'resonart', label: 'RESONART' },
  { kind: 'attune', label: 'ATTUNE' },
  { kind: 'veilshift', label: 'VEILSHIFT' },
  { kind: 'guard', label: 'GUARD' },
  { kind: 'wait', label: 'WAIT' },
  { kind: 'cancel', label: 'Cancel' }
]);

const ENEMY_STATS = Object.freeze({
  hushling: { hp: 10, atk: 3, range: 1, cinematicKey: 'portrait_hushling', name: 'Hushling', ability: 'Hush Crush', accent: 0xe24145, label: 'Hu' },
  veil_wraith: { hp: 26, atk: 6, range: 1, cinematicKey: 'portrait_wraith', name: 'Veil Wraith', ability: 'Veil Lash', accent: 0xc477ff, label: 'Wr' }
});

// EncounterContext.enemyId must match BattleConfig.js/EnemyCatalog.js's
// canonical ids ('wraith'/'hushling'), not Tactical's own map-data type
// strings ('veil_wraith'/'hushling') — the two vocabularies grew
// independently and were never reconciled.
const TACTICAL_TO_BP_ENEMY_ID = Object.freeze({
  veil_wraith: 'wraith',
  hushling: 'hushling'
});

// Hero map tokens use existing approved TACTICAL-scale character art
// where it exists — Prismel's validated six-frame walk cycle and Auryi's
// validated seven-frame movement set, each used for both idle and
// walking. Neither uses any cinematic battle-pose art (assets/poses/):
// that library is BattleCinematic's close-up cut-in exclusively, kept
// deliberately separate from the tactical map's own approved set. Kineza
// has no approved tactical sprite package yet, so he (and the enemies,
// whose full battle-art portraits are the wrong shape/scale for a map
// marker — see the "giant enemy" note in git history) fall through to
// the procedural circle token in _buildUnitToken(). Adding Kineza's
// sprite later is a matter of giving him an entry below — _buildHero()
// already branches on "does this id have a CHARACTER_TOKEN_ART entry",
// and UnitController.animateMove() drives any unit's presentation purely
// through the optional onStep/onMoveEnd hooks _buildCharacterToken()
// returns, so grid movement, targeting, selection, and the cinematic
// battle-transition code never need to change for it.
// `originY` is each frame's baseline as a fraction of its own canvas
// height (feet anchor) — identical for idle and walk here since both
// draw from the same frame family, one CLAUDE.md-style scale factor
// for the whole set.
//
// Tokens load pre-downsampled "map icon" textures (assets/*/map_icons/),
// not the full battle-res source art directly. At a map token's actual
// on-screen size, loading the full 533x800/1024x1536 texture and letting
// the GPU minify it live is a ~20x downscale — linear-filtered
// minification at that ratio averages huge numbers of soft, semi-
// transparent edge pixels (hair, cloak fringe, Auryi's aura) into each
// screen pixel and drops the effective alpha to ~78%, which reads as a
// translucent "ghost" rather than a small solid sprite. Confirmed
// directly: resampling the idle pose to its actual ~40px on-screen
// height dropped mean nonzero alpha from ~255 to ~199. The map_icons
// are pre-resized once (LANCZOS, offline) at a larger reference size
// (content height 260px) than the first pass, keeping the runtime
// downscale in the ~3x range at a bigger, more legible on-screen size.
// `originY` is unchanged by this — it's a ratio within the canvas, and
// uniform resizing preserves ratios; only `scale` (tuned against the
// icon's own actual size) changes.
//
// Prismel's tactical token uses ONLY his approved six-frame walk cycle —
// idle and walking both — never the cinematic battle-pose art (his
// locked Idle pose in assets/poses/). That library is for BattleCinematic's
// close-up cut-in exclusively; the walk cycle is the tactical-scale asset
// DAI approved for the map, so unlike the first pass, there's no separate
// idle frame/scale here — same single-frameset shape as Auryi.
const PRISMEL_WALK_FRAMES = [
  'prismel_walk_01_contact_a', 'prismel_walk_02_down_a', 'prismel_walk_03_passing_a',
  'prismel_walk_04_contact_b', 'prismel_walk_05_down_b', 'prismel_walk_06_passing_b'
];
const AURYI_WALK_FRAMES = [
  'auryi_move_01', 'auryi_move_02', 'auryi_move_03', 'auryi_move_04', 'auryi_move_05', 'auryi_move_06', 'auryi_move_07'
];

// On-screen footprint (world px, at zoom 1) both character token sets
// render at — icon content height (265px) * runtime scale (0.294) ≈ 78,
// width sized to the wider of the two figures (Prismel, ~64) with a
// little headroom. Drives the backing shape in _buildCharacterToken().
const ONSCREEN_H = 78;
const ONSCREEN_W = 64;

const CHARACTER_TOKEN_ART = Object.freeze({
  prismel: {
    baseFacing: 'right',
    idle: { key: 'prismel_walk_01_contact_a', originY: 1323 / 1536, scale: 0.294 },
    walkFrames: PRISMEL_WALK_FRAMES,
    walk: { originY: 1323 / 1536, scale: 0.294 }
  },
  auryi: {
    baseFacing: 'left',
    idle: { key: 'auryi_move_04', originY: 1180 / 1536, scale: 0.294 },
    walkFrames: AURYI_WALK_FRAMES,
    walk: { originY: 1180 / 1536, scale: 0.294 }
  }
  // kineza: no approved tactical sprite package yet — add an entry here,
  // in the same shape as the two above, once one exists. Until then he
  // uses the procedural token, same as the enemies.
});

const TERRAIN_COLORS = Object.freeze({
  open: 0x25203f,
  barrier: 0x120b28,
  difficult: 0x4a3a2a,
  resonance: 0x3b215c
});

export default class TacticalScene extends Phaser.Scene {
  constructor() {
    super('TacticalScene');
  }

  preload() {
    this.load.json('tacticalMap', './data/tactical_map_v2.json');
    // Real portrait art, used only for the cinematic cut-in.
    this.load.image('portrait_prismel', './assets/ui/portrait_prismel.png');
    this.load.image('portrait_kineza', './assets/ui/portrait_kineza.png');
    this.load.image('portrait_auryi', './assets/ui/portrait_auryi.png');
    this.load.image('portrait_wraith', './assets/ui/portrait_wraith_v34.png');
    this.load.image('portrait_hushling', './assets/ui/portrait_hushling_v34.png');
    // Hero map tokens — existing battle-pose art plus the validated
    // walk-cycle sets (see CHARACTER_TOKEN_ART above). Kineza and the
    // enemies still use procedural tokens, no load needed for those.
    PRISMEL_WALK_FRAMES.forEach(key => {
      this.load.image(key, `./assets/prismel/walk/map_icons/${key}_mapicon.png`);
      this.load.image(`${key}_silhouette`, `./assets/prismel/walk/map_icons/${key}_silhouette.png`);
    });
    AURYI_WALK_FRAMES.forEach(key => {
      this.load.image(key, `./assets/auryi/movement/map_icons/${key}_mapicon.png`);
      this.load.image(`${key}_silhouette`, `./assets/auryi/movement/map_icons/${key}_silhouette.png`);
    });
    // v0.5A Tactical Command Console Core — button states and command
    // icons. Pre-resized offline (LANCZOS, 480x368 / 160x160) from the
    // handoff's native 1536x1178 / 768x768 masters — rendering those
    // directly at gameplay button/icon scale would be a ~7-30x runtime
    // minification, well into the range that has previously produced
    // visible alpha-averaging haze on this project's soft/glowing art.
    ['default', 'hover', 'selected', 'pressed', 'disabled', 'veilshift_ready'].forEach(state => {
      this.load.image(`tac_console_button_${state}`, `./assets/ui/tactical_console/button_${state}.png`);
    });
    ['attack', 'resonart', 'attune', 'veilshift', 'guard', 'wait'].forEach(kind => {
      this.load.image(`tac_console_icon_${kind}`, `./assets/ui/tactical_console/icon_${kind}.png`);
    });
  }

  // `this.world` is a single flat Container holding the tile layer, node
  // markers, overlays, and every unit token, each relying on `.depth` to
  // stack correctly (tiles under tokens, overlays under tokens, etc.).
  // Phaser does NOT auto-resort a Container's children by depth when a
  // new child is added — it only reflects `.depth` for objects that were
  // already in relative depth order at insertion time. TacticalGrid's
  // tile/path overlays are created lazily, on the player's first tile
  // selection, well after every unit token already exists in the list —
  // so despite depth 5/6 versus the tokens' depth 10, the overlay
  // rendered ON TOP of them once created, not behind. Confirmed directly:
  // toggling the overlay's visibility on/off at an identical camera
  // position showed the character art fully clean with it hidden, and
  // visibly cut across by the overlay's tile grid lines with it shown.
  // Sorting after every addition — not just once at boot — means no
  // future overlay, marker, or token added after `create()` can hit the
  // same bug, lazily-created or not.
  worldAdd(obj) {
    if (Array.isArray(obj)) { obj.forEach(o => this.world.add(o)); this.world.sort('depth'); return; }
    this.world.add(obj);
    this.world.sort('depth');
  }

  uiAdd(obj) {
    if (Array.isArray(obj)) { obj.forEach(o => this.uiLayer.add(o)); return; }
    this.uiLayer.add(obj);
  }

  create() {
    // scene.restart() reuses this instance but destroys every game object —
    // clear anything cached on `this` so a second run never touches a dead
    // reference. Same pattern VeilBattleScene uses.
    this._dragging = false;
    this._dragMoved = false;
    if (this._resizeHandler) this.scale.off('resize', this._resizeHandler, this);
    if (this._uiCamResizeHandler) this.scale.off('resize', this._uiCamResizeHandler, this);

    this.tacticalConfig = { GRID, TILE, ZOOM, TIMING, BREAKPOINTS, INPUT };

    this.cameras.main.setBackgroundColor('#07060f');
    this.world = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0).setDepth(1000);

    const mapData = this.cache.json.get('tacticalMap');
    this.mapData = mapData;

    this.terrain = new TerrainRegistry({
      open: { movementCost: 1, walkable: true, blocksLineOfSight: false },
      barrier: { movementCost: null, walkable: false, blocksLineOfSight: true },
      difficult: { movementCost: 2, walkable: true, blocksLineOfSight: false },
      resonance: { movementCost: 1, walkable: true, blocksLineOfSight: false }
    });
    this.grid = new TacticalGrid(this, mapData, this.terrain);
    this.pathfinder = new TacticalPathfinder(this.grid, this.terrain);
    this.tacticalCamera = new TacticalCamera(this, this.grid, ZOOM);
    this.unitController = new UnitController(this, this.grid, this.pathfinder);
    this.cinematic = new BattleCinematic(this, TIMING);

    this.turn = 1;
    this.phase = 'player';
    this.inputLocked = false;
    this.message = 'Restore all three sound nodes. Defeating every enemy is optional.';
    this.victory = false;
    this.defeat = false;

    this.heroes = mapData.heroes.map(h => this._buildHero(h));
    this.enemies = mapData.enemies.map(e => this._buildEnemy(e));
    this.nodes = mapData.nodes.map(n => ({ ...n, restored: false }));

    this.heroes.forEach(h => this.grid.setOccupant(h.x, h.y, h));
    this.enemies.forEach(e => this.grid.setOccupant(e.x, e.y, e));

    this.tileLayer = this.worldWrap(this.add.graphics().setDepth(0));
    this.nodeMarkers = [];

    // World-space geometry is fixed regardless of viewport — the camera's
    // zoom/pan is what adapts to screen size, not the grid itself. Tying
    // tile scale to viewport width fought the camera system: a resize
    // would rescale the whole world instead of just changing what's
    // visible, which is the opposite of how Phaser cameras are meant to
    // work here.
    this.grid.setOrigin(0, 0, TILE.baseHalfW, TILE.baseHalfH);

    this.buildHUD();
    this.heroes.forEach(u => this._placeUnitSprite(u));
    this.enemies.forEach(u => this._placeUnitSprite(u));
    this.drawBoard();
    this.drawNodes();
    this.layout();
    this.refreshHUD();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('wheel', this.onWheel, this);

    this._resizeHandler = () => this.layout();
    this.scale.on('resize', this._resizeHandler, this);

    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCam.setBackgroundColor('rgba(0,0,0,0)');
    this.uiCam.ignore(this.world);
    this.cameras.main.ignore(this.uiLayer);
    // Named + stored so the cleanup block at the top of create() can
    // remove it on the next restart — an inline anonymous function here
    // would silently accumulate one extra 'resize' listener per restart,
    // since there'd be no reference left to call .off() with.
    this._uiCamResizeHandler = size => this.uiCam.setSize(size.width, size.height);
    this.scale.on('resize', this._uiCamResizeHandler, this);

    this.time.delayedCall(60, () => this.tacticalCamera.recenter(0));
  }

  worldWrap(obj) {
    this.worldAdd(obj);
    return obj;
  }

  // --- Setup helpers ---------------------------------------------------

  // Procedural map token: an accent-colored circle with a two-letter
  // label, ringed gold for heroes / red for enemies. Still used for
  // enemies (no comparable small-scale art exists for them yet).
  _buildUnitToken(color, label, isHero) {
    const container = this.add.container(0, 0).setDepth(10);
    const ringColor = isHero ? 0xffe8a0 : 0xff503c;
    const circle = this.add.circle(0, 0, 16, color, 0.94).setStrokeStyle(2, ringColor, 0.95);
    const text = this.add.text(0, 0, label, {
      fontSize: '12px', fontStyle: 'bold', color: '#0a0716'
    }).setOrigin(0.5);
    container.add([circle, text]);
    this.worldAdd(container);
    return container;
  }

  // Character-art map token (see CHARACTER_TOKEN_ART). Returns the
  // container to use as `unit.sprite`, plus onStep/onMoveEnd hooks
  // UnitController.animateMove() calls generically — this scene is the
  // only place that knows these are Prismel or Auryi specifically.
  // A solid accent-colored backing shape sits behind the FULL character
  // silhouette, same ring language as the procedural token
  // (_buildUnitToken). This isn't just about grounding a small ankle-
  // level disc — this art has genuinely, intentionally semi-transparent
  // regions throughout (Auryi's soft aura, painterly fabric shading),
  // and at map-token scale those regions blend visibly with the tile
  // grid lines behind them — invisible against flat black, obvious
  // against a lined background, which read as "ghosting" even though
  // the character texture itself is correctly opaque at its core. The
  // backing ellipse is sized to the token's full on-screen footprint
  // (ONSCREEN_W/ONSCREEN_H below, derived from CHARACTER_TOKEN_ART's
  // scale) so nothing semi-transparent in the art ever has tile detail
  // behind it to blend with — solid accent color instead.
  _buildCharacterToken(charKey) {
    const art = CHARACTER_TOKEN_ART[charKey];
    const container = this.add.container(0, 0).setDepth(10);

    // Small grounded contact shadow — subtle, dark, at the feet. Not
    // accent-colored: a shadow, not a team-color plate.
    const shadow = this.add.ellipse(0, -3, ONSCREEN_W * 0.56, ONSCREEN_H * 0.1, 0x000000, 0.35);

    // Character-following outline: a slightly-larger, near-black copy of
    // the SAME silhouette sits directly behind the real image. It reads
    // as a thin rim (only the margin past the real edges is visible —
    // the rest is covered by the character art on top), not a plate, per
    // OUTLINE_SHADOW_DIRECTION.md's "keep the character art itself
    // visually dominant." Unlike the earlier oval backing, it's built
    // from a pre-thresholded fully-opaque silhouette texture (map_icons/
    // *_silhouette.png), not a tinted copy of the real art — a tint
    // preserves the original alpha channel, so a tinted copy would still
    // carry the same soft/semi-transparent regions (Auryi's aura,
    // painterly shading) that caused the original grid-bleed-through
    // ghosting. Backing the ENTIRE silhouette solid (not just a stroke)
    // still prevents tile grid lines from showing through mid-body, the
    // actual bug two passes back — a thin ring alone would not.
    const outline = this.add.image(0, 0, `${art.idle.key}_silhouette`)
      .setOrigin(0.5, art.idle.originY)
      .setScale(art.idle.scale * 1.05)
      .setTint(0x0a0716)
      .setAlpha(0.85);

    const img = this.add.image(0, 0, art.idle.key)
      .setOrigin(0.5, art.idle.originY)
      .setScale(art.idle.scale);
    container.add([shadow, outline, img]);
    this.worldAdd(container);

    let facingRight = art.baseFacing === 'right';
    let frameIndex = 0;
    const applyFlip = () => {
      const flip = facingRight !== (art.baseFacing === 'right');
      img.setFlipX(flip);
      outline.setFlipX(flip);
    };
    applyFlip();

    const onStep = (from, to) => {
      const screenDX = (to.x - to.y) - (from.x - from.y);
      if (screenDX !== 0) facingRight = screenDX > 0;
      applyFlip();
      if (art.walkFrames) {
        frameIndex = (frameIndex + 1) % art.walkFrames.length;
        const key = art.walkFrames[frameIndex];
        img.setTexture(key).setOrigin(0.5, art.walk.originY).setScale(art.walk.scale);
        outline.setTexture(`${key}_silhouette`).setOrigin(0.5, art.walk.originY).setScale(art.walk.scale * 1.05);
      }
    };
    const onMoveEnd = () => {
      if (!art.walkFrames) return;
      frameIndex = 0;
      img.setTexture(art.idle.key).setOrigin(0.5, art.idle.originY).setScale(art.idle.scale);
      outline.setTexture(`${art.idle.key}_silhouette`).setOrigin(0.5, art.idle.originY).setScale(art.idle.scale * 1.05);
    };

    return { container, onStep, onMoveEnd };
  }

  _buildHero(h) {
    const stats = HERO_STATS[h.id];
    const art = CHARACTER_TOKEN_ART[h.id];
    let sprite, onStep = null, onMoveEnd = null;
    if (art) {
      const token = this._buildCharacterToken(h.id);
      sprite = token.container;
      onStep = token.onStep;
      onMoveEnd = token.onMoveEnd;
    } else {
      sprite = this._buildUnitToken(stats.accent, stats.label, true);
    }
    const hero = {
      id: h.id, x: h.x, y: h.y, move: h.move,
      rangeMin: h.rangeMin, rangeMax: h.rangeMax,
      hp: stats.hp, maxHp: stats.hp, atk: stats.atk, healAmount: stats.healAmount || 0,
      rp: stats.rp, maxRp: stats.maxRp, attunement: stats.attunement, attunementMax: stats.attunementMax,
      name: stats.name, title: stats.title, ability: stats.ability, flavor: stats.flavor,
      portraitKey: stats.cinematicKey, accent: stats.accent,
      requiresLineOfSight: stats.requiresLineOfSight,
      moved: false, acted: false, alive: true, isHero: true,
      sprite, spriteYOffset: 0
    };
    if (onStep) hero.onStep = onStep;
    if (onMoveEnd) hero.onMoveEnd = onMoveEnd;
    return hero;
  }

  _buildEnemy(e) {
    const stats = ENEMY_STATS[e.type];
    const sprite = this._buildUnitToken(stats.accent, stats.label, false);
    return {
      id: e.id, type: e.type, x: e.x, y: e.y,
      hp: stats.hp, maxHp: stats.hp, atk: stats.atk, range: stats.range,
      name: stats.name, ability: stats.ability, portraitKey: stats.cinematicKey,
      alive: true, isHero: false, sprite, spriteYOffset: 0
    };
  }

  // Called on create() and every resize. World geometry never changes
  // here — only the camera's bounds/clamp (viewport size changed) and the
  // screen-space HUD need to respond.
  layout() {
    this.tacticalCamera.computeBounds();
    this.tacticalCamera.defaultZoom = this.defaultZoomFor(this.scale.width, this.scale.height);
    this.tacticalCamera.clamp();
    this.layoutHUD();
  }

  // Board coverage is handled by pan (a required control, not a fallback),
  // so this only has to pick a *readable* starting zoom per viewport —
  // narrower phones start zoomed out a bit further to keep more of the
  // board and its neighboring tiles in view at once.
  defaultZoomFor(w, h) {
    const landscape = w > h;
    const compact = w < BREAKPOINTS.compactWidth || h < BREAKPOINTS.compactHeight;
    if (landscape) return compact ? 0.85 : 0.95;
    return compact ? 0.62 : 0.72;
  }

  _placeUnitSprite(u) {
    const p = this.grid.toScreen(u.x, u.y);
    u.sprite.setPosition(p.x, p.y);
  }

  drawBoard() {
    this.tileLayer.clear();
    for (let y = 0; y < GRID.rows; y++) {
      for (let x = 0; x < GRID.columns; x++) {
        const type = this.grid.terrainAt(x, y);
        this.grid.drawDiamond(this.tileLayer, x, y, TERRAIN_COLORS[type] || TERRAIN_COLORS.open, 0.92, 0x0a0716, 0.5);
      }
    }
  }

  drawNodes() {
    this.nodeMarkers.forEach(m => m.destroy());
    this.nodeMarkers = [];
    this.nodes.forEach(n => {
      const p = this.grid.toScreen(n.x, n.y);
      const marker = this.add.circle(p.x, p.y - 6, 7,
        n.restored ? 0xffd56a : 0x8a45ff, n.restored ? 0.95 : 0.55)
        .setStrokeStyle(2, n.restored ? 0xfff3c8 : 0xc8a8ff, 0.9)
        .setDepth(4);
      this.worldAdd(marker);
      this.nodeMarkers.push(marker);
    });
  }

  // --- HUD ---------------------------------------------------------------

  buildHUD() {
    this.turnText = this.add.text(0, 0, '', { fontSize: '16px', fontStyle: 'bold', color: '#FFE8A0' }).setOrigin(0.5, 0);
    this.messageText = this.add.text(0, 0, '', { fontSize: '13px', color: '#C8A8FF', wordWrap: { width: 320 } }).setOrigin(0.5, 0);
    this.heroCards = this.heroes.map((h, i) => this._buildHeroCard(h, i));
    this.actionMenu = this._buildActionMenu();
    this.zoomControls = this._buildZoomControls();
    this.endPanel = null;

    this.uiAdd([this.turnText, this.messageText, this.zoomControls.container, this.actionMenu.container]);
    this.heroCards.forEach(c => this.uiAdd(c.container));
  }

  // v0.4 HP/RP/Attunement HUD architecture (HP_RP_ATTUNEMENT_HUD_SPEC.md):
  // three concepts, three visual languages. HP stays the familiar text
  // readout; RP gets a thin bar visually distinct from HP (not a color
  // variant of the same bar); Attunement is three small facets, not a
  // third bar — a segmented/faceted state gauge, not a spendable
  // resource. This is the "compact hero-card read" tier the spec calls
  // for — the richer full-size BP HUD treatment is BattleHUD's job.
  _buildHeroCard(hero, index) {
    const cardH = 58;
    const container = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 132, cardH, 0x120b28, 0.88).setStrokeStyle(1, 0x5a3a88, 0.8).setOrigin(0, 0);
    const name = this.add.text(8, 3, hero.name, { fontSize: '12px', fontStyle: 'bold', color: '#FFE8A0' });
    const hp = this.add.text(8, 20, '', { fontSize: '11px', color: '#9fe0ff' });

    const rpBarBg = this.add.rectangle(8, 37, 88, 4, 0x241a3a, 1).setOrigin(0, 0);
    const rpBarFill = this.add.rectangle(8, 37, 88, 4, 0xffd76a, 1).setOrigin(0, 0);

    // Segment i is lit once attunement > i; all three lit is VEILSHIFT
    // READY (turns gold rather than the usual attuned violet).
    const facetSize = 7;
    const facets = [];
    for (let i = 0; i < (hero.attunementMax || 3); i++) {
      const f = this.add.rectangle(100 + i * (facetSize + 3), 39, facetSize, facetSize, 0x2a1f42, 1)
        .setStrokeStyle(1, 0x8a6ad0, 0.9).setOrigin(0, 0).setAngle(45);
      facets.push(f);
    }

    container.add([bg, name, hp, rpBarBg, rpBarFill, ...facets]);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 132, cardH), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); if (p.event) p.event._tacticalUIHandled = true; this.onHeroCardTap(hero); });
    return { container, bg, hpText: hp, rpBarFill, facets, cardH, hero };
  }

  // v0.5A: the six locked commands render through TacticalActionConsole
  // (real button-state art + icons). Cancel isn't part of that art set —
  // the handoff's icon/state set is six commands only — so it stays a
  // small plain pill alongside the console, same style the whole menu
  // used to share.
  _buildActionMenu() {
    const container = this.add.container(0, 0).setVisible(false);

    const consoleDefs = ACTION_DEFS.filter(d => d.kind !== 'cancel');
    const actionConsole = new TacticalActionConsole(this, consoleDefs, kind => this.onActionMenuChoice(kind)).create();
    container.add(actionConsole.container);
    this.actionConsole = actionConsole;

    const cancelDef = ACTION_DEFS.find(d => d.kind === 'cancel');
    const cancelBg = this.add.rectangle(0, 0, 90, 30, 0x1a1033, 0.92).setStrokeStyle(1, 0x5a3a88, 0.9).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const cancelText = this.add.text(0, 0, cancelDef.label, { fontSize: '12px', color: '#FFE8A0' }).setOrigin(0.5);
    cancelBg.on('pointerdown', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); if (p.event) p.event._tacticalUIHandled = true; this.onActionMenuChoice('cancel'); });
    container.add([cancelBg, cancelText]);

    return { container, cancelBg, cancelText };
  }

  _buildZoomControls() {
    const container = this.add.container(0, 0);
    const mk = (dx, label, cb) => {
      const bg = this.add.circle(dx, 0, 22, 0x1a1033, 0.9).setStrokeStyle(1, 0x5a3a88, 0.9).setInteractive({ useHandCursor: true });
      const text = this.add.text(dx, 0, label, { fontSize: '18px', color: '#FFE8A0' }).setOrigin(0.5);
      bg.on('pointerdown', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); if (p.event) p.event._tacticalUIHandled = true; cb(); });
      container.add([bg, text]);
      return bg;
    };
    mk(-56, '-', () => this.tacticalCamera.zoomBy(-ZOOM.buttonStep));
    mk(0, '⌖', () => this.tacticalCamera.recenter(TIMING.cameraFocusMs));
    mk(56, '+', () => this.tacticalCamera.zoomBy(ZOOM.buttonStep));
    return { container };
  }

  layoutHUD() {
    const w = this.scale.width;
    const h = this.scale.height;
    const compact = w < BREAKPOINTS.compactWidth || h < BREAKPOINTS.compactHeight;
    const margin = compact ? 10 : 16;

    this.turnText.setPosition(w / 2, margin);
    this.messageText.setPosition(w / 2, margin + 24).setWordWrapWidth(w * 0.86);

    this.heroCards.forEach((c, i) => {
      c.container.setPosition(margin, margin + 54 + i * (c.cardH + 6));
    });

    this.zoomControls.container.setPosition(w - margin - 56, h - margin - 24);

    // Console buttons render at a fixed touch-friendly height regardless
    // of viewport; only the row gap and cancel pill shrink in compact.
    const barHeight = compact ? 40 : 46;
    const gap = compact ? 8 : 10;
    const { barW, stackH } = this.actionConsole.layout(barHeight, gap);

    const cancelGap = 10;
    const cancelH = compact ? 26 : 30;
    const cancelW = Math.max(80, Math.round(barW * 0.5));
    this.actionMenu.cancelBg.setSize(cancelW, cancelH);
    this.actionMenu.cancelBg.setPosition(barW / 2, stackH + cancelGap + cancelH / 2);
    this.actionMenu.cancelText.setPosition(barW / 2, stackH + cancelGap + cancelH / 2);
    // Mutate the existing hit area in place rather than calling
    // setInteractive() again — GameObject.setInteractive()'s enable() is
    // `input ? input.enabled = true : setHitArea(...)`, so a second call
    // on an object that's already interactive silently skips the hit-area
    // update entirely (confirmed via scene.input.hitTestPointer() while
    // chasing the same bug on the console buttons below — see
    // TacticalActionConsole.js's layout()). A Shape's width/height ARE
    // its own current geometry (unlike an Image's fixed texture frame),
    // so frame-space here is exactly (0,0,cancelW,cancelH) — no origin
    // centering math needed.
    this.actionMenu.cancelBg.input.hitArea.setTo(0, 0, cancelW, cancelH);

    const totalH = stackH + cancelGap + cancelH;
    this.actionMenu.container.setPosition(w - margin - barW, h - margin - totalH);
  }

  refreshHUD() {
    this.turnText.setText(`Turn ${this.turn} — ${this.phase === 'player' ? 'Player Phase' : 'Enemy Phase'}`);
    this.messageText.setText(this.message);
    this.heroCards.forEach(c => {
      const hero = c.hero;
      const alive = hero.alive;
      c.hpText.setText(alive ? `HP ${hero.hp}/${hero.maxHp}${hero.acted ? ' ✓' : ''}` : 'Down');
      c.bg.setFillStyle(0x120b28, alive ? 0.88 : 0.5);
      c.bg.setStrokeStyle(1, hero === this.unitController.selected ? 0xffe8a0 : 0x5a3a88, 0.9);

      const rpFrac = alive && hero.maxRp ? Phaser.Math.Clamp(hero.rp / hero.maxRp, 0, 1) : 0;
      c.rpBarFill.setSize(88 * rpFrac, 4);

      const veilshiftReady = alive && hero.attunement >= hero.attunementMax;
      c.facets.forEach((f, i) => {
        const lit = alive && hero.attunement > i;
        f.setFillStyle(lit ? (veilshiftReady ? 0xffe8a0 : 0x8a6ad0) : 0x2a1f42, 1);
      });
    });
  }

  setMessage(msg) {
    this.message = msg;
    this.messageText.setText(msg);
  }

  // --- Input arbitration -----------------------------------------------
  // Tapping a unit/tile selects or moves; dragging empty battlefield pans;
  // UI never pans. UI buttons stamp `_tacticalUIHandled` on the underlying
  // event so this generic handler can tell "already handled by a button"
  // apart from "a tap on the board" — both fire on the same pointerdown.

  onPointerDown(pointer) {
    if (pointer.event && pointer.event._tacticalUIHandled) return;
    if (this.inputLocked) return;
    this._dragging = true;
    this._dragMoved = false;
    this._dragStartX = pointer.x;
    this._dragStartY = pointer.y;
    this._lastX = pointer.x;
    this._lastY = pointer.y;
  }

  onPointerMove(pointer) {
    if (!this._dragging || !pointer.isDown || this.inputLocked) return;
    const dx = pointer.x - this._dragStartX;
    const dy = pointer.y - this._dragStartY;
    if (!this._dragMoved && Math.hypot(dx, dy) > INPUT.dragThresholdPx) {
      this._dragMoved = true;
    }
    if (this._dragMoved) {
      this.tacticalCamera.panByScreenDelta(pointer.x - this._lastX, pointer.y - this._lastY);
    }
    this._lastX = pointer.x;
    this._lastY = pointer.y;
  }

  onPointerUp(pointer) {
    if (pointer.event && pointer.event._tacticalUIHandled) { this._dragging = false; return; }
    const wasDrag = this._dragMoved;
    this._dragging = false;
    this._dragMoved = false;
    if (this.inputLocked || wasDrag) return;
    this.handleWorldTap(pointer);
  }

  onWheel(pointer, gameObjects, deltaX, deltaY) {
    if (this.inputLocked) return;
    this.tacticalCamera.zoomBy(deltaY > 0 ? -0.1 : 0.1);
  }

  handleWorldTap(pointer) {
    if (this.phase !== 'player') return;
    // pointer.worldX/worldY is ambiguous with two cameras in play (main
    // world camera + the fixed uiCam) — Phaser updates it per-camera during
    // hit-testing, so which camera's transform it reflects isn't
    // guaranteed to be cameras.main. Ask the main camera explicitly
    // instead of trusting the pointer's own cached value.
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tile = this.grid.toGrid(world.x, world.y);
    if (!this.grid.inBounds(tile.x, tile.y)) return;

    const occupant = this.grid.occupantAt(tile.x, tile.y);
    const selected = this.unitController.selected;

    if (this._pendingAction === 'attack') {
      if (occupant && !occupant.isHero && occupant.alive && selected) {
        this.tryAttack(selected, occupant);
      }
      return;
    }

    if (occupant && occupant.isHero && occupant.alive) {
      this.selectHero(occupant);
      return;
    }

    if (!selected || selected.moved || occupant) return;

    const path = this.unitController.previewRouteTo(tile.x, tile.y);
    if (!path) {
      this.setMessage('That tile is out of reach.');
      this._previewedTile = null;
      this.flashInvalidTile(tile.x, tile.y);
      return;
    }

    if (this._previewedTile && this._previewedTile.x === tile.x && this._previewedTile.y === tile.y) {
      this.confirmMove(selected, path);
      this._previewedTile = null;
    } else {
      this._previewedTile = { x: tile.x, y: tile.y };
    }
  }

  flashInvalidTile(x, y) {
    const g = this.add.graphics().setDepth(7);
    this.worldAdd(g);
    this.grid.drawDiamond(g, x, y, 0xff503c, 0.5);
    this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
  }

  // --- Selection and actions ---------------------------------------------

  selectHero(hero) {
    this.unitController.select(hero);
    this._previewedTile = null;
    this._pendingAction = null;
    this.tacticalCamera.focusOn(hero.x, hero.y, TIMING.cameraFocusMs);
    this.refreshHUD();
    this.setMessage(hero.moved
      ? `${hero.name} has already moved. Choose an action.`
      : `${hero.name} selected. Tap a highlighted tile to move, or open actions.`);
    this.showActionMenuFor(hero);
  }

  onHeroCardTap(hero) {
    if (this.inputLocked || this.phase !== 'player' || !hero.alive) return;
    this.selectHero(hero);
  }

  showActionMenuFor(hero) {
    this.actionMenu.container.setVisible(true);
    // Zoom controls share the bottom-right corner with the console; the
    // camera isn't something the player needs mid-command-selection, and
    // the console's actual width varies with the command stack's own
    // layout, so hiding zoom rather than trying to dodge it sidesteps a
    // second overlap calculation entirely.
    this.zoomControls.container.setVisible(false);
    const canAct = !hero.acted;
    const onNode = this.nodes.some(n => n.x === hero.x && n.y === hero.y && !n.restored);
    const pendingKind = this._pendingAction === 'attack' ? this._pendingActionKind : null;
    this.actionConsole.refresh(hero, { canAct, onNode, pendingKind });
  }

  onActionMenuChoice(kind) {
    const hero = this.unitController.selected;
    if (!hero) return;

    if (kind === 'cancel') {
      this.unitController.clearSelection();
      this.actionMenu.container.setVisible(false);
      this.zoomControls.container.setVisible(true);
      this._pendingAction = null;
      this.refreshHUD();
      return;
    }
    if (hero.acted) return;

    if (kind === 'attack' || kind === 'resonart') {
      this._pendingAction = 'attack';
      this._pendingActionKind = kind;
      this.grid.showAttackRange(this.attackRangeTiles(hero));
      this.setMessage(`${hero.name}: choose a target in range.`);
      // Re-run so the chosen button switches to its sustained "selected"
      // texture immediately — the console stays open through targeting.
      this.showActionMenuFor(hero);
      return;
    }
    if (kind === 'attune') {
      this.resonateNode(hero);
      return;
    }
    if (kind === 'veilshift') {
      this.setMessage(`${hero.name}'s Veilshift is not attuned yet.`);
      return;
    }
    if (kind === 'guard' || kind === 'wait') {
      this.setMessage(`${hero.name} ${kind === 'guard' ? 'braces defensively' : 'waits'}.`);
      this.finishHeroAction(hero);
    }
  }

  attackRangeTiles(hero) {
    const min = hero.rangeMin || 1;
    const max = hero.rangeMax || min;
    const tiles = [];
    for (let y = 0; y < GRID.rows; y++) {
      for (let x = 0; x < GRID.columns; x++) {
        if (x === hero.x && y === hero.y) continue;
        const dist = Math.abs(x - hero.x) + Math.abs(y - hero.y);
        if (dist < min || dist > max) continue;
        if (hero.requiresLineOfSight && !this.pathfinder.hasLineOfSight(hero.x, hero.y, x, y)) continue;
        tiles.push({ x, y });
      }
    }
    return tiles;
  }

  tryAttack(hero, target) {
    const inRange = this.attackRangeTiles(hero).some(t => t.x === target.x && t.y === target.y);
    if (!inRange) {
      this.setMessage('Target is out of range or blocked by a barrier.');
      return;
    }
    this.grid.clearAllOverlays();
    const actionKind = this._pendingActionKind || 'attack';
    this._pendingAction = null;
    this._pendingActionKind = null;
    this.inputLocked = true;
    this.actionMenu.container.setVisible(false);
    this.enterLinkedBattle(hero, target, actionKind);
  }

  // v0.4 Tactical <-> Battle Presentation bridge (TP_BP_BRIDGE_SPEC.md).
  // Tactical stays the gameplay/state authority: it computes an
  // immutable resolution plan up front using its own existing damage
  // math (unchanged from the old lightweight-cinematic flow — no roll
  // happens twice), hands it to the full VeilBattleScene as an
  // EncounterContext, and commits the returned BattleResult exactly
  // once in onBattleResolved(). VeilBattleScene never rolls or applies
  // damage independently for a linked round (see BattleController's
  // `linkedResolution` branch) — it only presents the plan Tactical
  // already made.
  //
  // No manual camera/state snapshot is needed for the trip: `this.scene
  // .pause()` freezes Tactical's update loop and input in place —
  // camera, unit positions, everything — exactly as it already was, so
  // "restores exactly on return" is true by construction rather than
  // something to hand-reconstruct. `scene.launch()` starts the full BP
  // scene on top in parallel; BP's own entrance sweep is the transition,
  // not a second one layered on top of it here.
  enterLinkedBattle(hero, target, actionKind) {
    this._bridgeHero = hero;
    this._bridgeTarget = target;

    const enemyId = TACTICAL_TO_BP_ENEMY_ID[target.type] || target.type;
    const context = {
      mode: 'linked',
      encounterId: `${this.turn}-${hero.id}-${target.id}-${this.time.now}`,
      heroId: hero.id,
      enemyId,
      action: { kind: actionKind, displayName: hero.ability },
      tacticalSnapshot: {
        turn: this.turn,
        phase: this.phase,
        heroTile: { x: hero.x, y: hero.y },
        enemyTile: { x: target.x, y: target.y },
        heroMoved: hero.moved,
        heroActed: hero.acted,
        heroHP: hero.hp,
        heroMaxHP: hero.maxHp,
        heroRP: hero.rp,
        heroAttunement: hero.attunement,
        enemyHP: target.hp,
        enemyMaxHP: target.maxHp
      },
      resolutionPlan: {
        // v0.4 shares Tactical's existing flat prototype damage math —
        // no crit roll here yet, matching the old cinematic's onImpact.
        // A future shared CombatResolver can replace this without
        // changing the bridge contract itself (TP_BP_BRIDGE_SPEC.md).
        damage: hero.atk,
        critical: false,
        statusChanges: [],
        resourceDelta: { rp: 0, attunement: 0 }
      }
    };

    // pause() only stops Tactical's own update loop — a paused scene is
    // still marked visible and Phaser renders it every frame regardless,
    // so without this, the full tactical map/HUD keeps drawing underneath
    // BP's opaque battlefield for the whole trip: twice the per-frame
    // render cost of a single scene, invisible to the player but not free
    // to the GPU/CPU. Confirmed materially: with visibility left on, a
    // linked round's own delayedCall/tween timers (reticle seek/lock,
    // typewriter dialogue, cinematic beats) stretched to 10-15x their
    // configured durations under load heavy enough to matter — Phaser
    // clamps the max per-frame delta it feeds timers, so a starved frame
    // rate makes game-clock time crawl even though nothing is logically
    // stuck. setVisible(false) is restored in onBattleResolved(), the one
    // place already guaranteed to run before control hands back.
    this.scene.pause();
    this.scene.setVisible(false);
    this.scene.launch('VeilBattleScene', context);
  }

  // Called by VeilBattleScene exactly once, after the full Battle
  // Presentation has resolved and torn itself down. Applies the plan
  // Tactical itself already computed in enterLinkedBattle() — BP only
  // ever presented and returned it, never recalculated it, so this
  // can't double-apply damage already reflected in `battleResult`.
  onBattleResolved(battleResult) {
    // Undo enterLinkedBattle()'s setVisible(false) — this runs while
    // Tactical is still paused, before VeilBattleScene stops itself and
    // resumes this scene, so visibility is back on by the time the
    // player actually sees the tactical map again.
    this.scene.setVisible(true);

    const hero = this._bridgeHero;
    const target = this._bridgeTarget;
    this._bridgeHero = null;
    this._bridgeTarget = null;
    if (!hero || !target) return;

    target.hp = battleResult.enemyHP;
    hero.hp = battleResult.heroHP;
    // v0.4: RP/Attunement don't yet flow from anything (resourceDelta is
    // always {rp:0, attunement:0} until Resonart/Attune actually cost or
    // build them), but the "update exactly once" application is wired
    // now so a future non-zero delta needs no bridge changes.
    if (battleResult.resourceDelta) {
      if (battleResult.resourceDelta.rp) {
        hero.rp = Math.max(0, Math.min(hero.maxRp, hero.rp + battleResult.resourceDelta.rp));
      }
      if (battleResult.resourceDelta.attunement) {
        hero.attunement = Math.max(0, Math.min(hero.attunementMax, hero.attunement + battleResult.resourceDelta.attunement));
      }
    }
    this.setMessage(`${target.name} is hit for ${battleResult.damageApplied} damage!`);
    if (battleResult.enemyDefeated) this.defeatEnemy(target);

    this.inputLocked = false;
    this.finishHeroAction(hero);
    this.checkVictoryDefeat();
  }

  resonateNode(hero) {
    const node = this.nodes.find(n => n.x === hero.x && n.y === hero.y && !n.restored);
    if (!node) { this.setMessage('No silenced node here to resonate with.'); return; }
    node.restored = true;
    this.drawNodes();
    this.setMessage(`${node.label} is restored!`);
    this.finishHeroAction(hero);
    this.checkVictoryDefeat();
  }

  finishHeroAction(hero) {
    this.unitController.markActed(hero);
    this.unitController.clearSelection();
    this.actionMenu.container.setVisible(false);
    this.zoomControls.container.setVisible(true);
    this._pendingAction = null;
    this._previewedTile = null;
    this.refreshHUD();
    this.maybeEndPlayerPhase();
  }

  async confirmMove(hero, path) {
    this.inputLocked = true;
    this.grid.clearAllOverlays();
    await this.unitController.animateMove(hero, path, TIMING.stepMoveMs);
    this.unitController.markMoved(hero);
    this.inputLocked = false;
    this.refreshHUD();
    this.showActionMenuFor(hero);
    this.setMessage(`${hero.name} moved. Choose an action.`);
  }

  maybeEndPlayerPhase() {
    if (this.victory || this.defeat) return;
    const allDone = this.heroes.every(h => !h.alive || h.acted);
    if (allDone) this.time.delayedCall(300, () => this.startEnemyPhase());
  }

  // --- Enemy phase ---------------------------------------------------------

  startEnemyPhase() {
    this.phase = 'enemy';
    this.unitController.clearSelection();
    this.actionMenu.container.setVisible(false);
    this.zoomControls.container.setVisible(true);
    this.refreshHUD();
    this.setMessage('Enemy Phase.');
    this.runEnemyPhase();
  }

  async runEnemyPhase() {
    this.inputLocked = true;
    for (const enemy of this.enemies) {
      if (!enemy.alive || this.victory || this.defeat) continue;
      await this.runEnemyTurn(enemy);
    }
    this.inputLocked = false;
    if (!this.victory && !this.defeat) this.startPlayerPhase();
  }

  async runEnemyTurn(enemy) {
    const target = this.pickEnemyTarget(enemy);
    if (!target) return;

    let dist = Math.abs(enemy.x - target.x) + Math.abs(enemy.y - target.y);
    if (dist > enemy.range) {
      const moveBudget = 3;
      const reach = this.pathfinder.reachable(enemy.x, enemy.y, moveBudget, enemy);
      let bestTile = null;
      let bestDist = dist;
      reach.dist.forEach((cost, k) => {
        const [x, y] = k.split(',').map(Number);
        const d = Math.abs(x - target.x) + Math.abs(y - target.y);
        if (d < bestDist) { bestDist = d; bestTile = { x, y }; }
      });
      if (bestTile) {
        this.showEnemyIntent(enemy, bestTile, 'move');
        await this.wait(TIMING.enemyIntentPauseMs);
        const path = this.pathfinder.routeTo(enemy.x, enemy.y, bestTile.x, bestTile.y, reach);
        await this.unitController.animateMove(enemy, path, TIMING.stepMoveMs);
      }
      dist = Math.abs(enemy.x - target.x) + Math.abs(enemy.y - target.y);
    }

    if (dist <= enemy.range) {
      this.showEnemyIntent(enemy, { x: target.x, y: target.y }, 'attack');
      const pause = enemy.type === 'veil_wraith' ? TIMING.enemyIntentPauseMs * 1.6 : TIMING.enemyIntentPauseMs;
      await this.wait(pause);
      await this.enemyAttack(enemy, target);
    } else {
      this.grid.clearAllOverlays();
    }
  }

  pickEnemyTarget(enemy) {
    let best = null;
    let bestDist = Infinity;
    this.heroes.forEach(h => {
      if (!h.alive) return;
      const d = Math.abs(h.x - enemy.x) + Math.abs(h.y - enemy.y);
      if (d < bestDist) { bestDist = d; best = h; }
    });
    return best;
  }

  showEnemyIntent(enemy, tile, kind) {
    this.grid.ensureOverlays();
    this.grid.tileOverlay.clear();
    this.grid.drawDiamond(
      this.grid.tileOverlay, tile.x, tile.y,
      kind === 'attack' ? 0xff503c : 0xffb36b, 0.4,
      kind === 'attack' ? 0xffb3a8 : 0xffe0c0, 0.8
    );
    this.setMessage(kind === 'attack' ? `${enemy.name} prepares to strike!` : `${enemy.name} advances...`);
  }

  wait(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  async enemyAttack(enemy, hero) {
    this.grid.clearAllOverlays();
    this.tacticalCamera.saveCinematicState();
    this.tacticalCamera.focusOn(
      Math.round((enemy.x + hero.x) / 2), Math.round((enemy.y + hero.y) / 2), 160
    );
    await this.wait(180);
    await this.cinematic.play({
      attackerKey: enemy.portraitKey, attackerName: enemy.name,
      targetKey: hero.portraitKey, targetName: hero.name,
      abilityName: enemy.ability, flavor: '',
      onImpact: () => {
        hero.hp = Math.max(0, hero.hp - enemy.atk);
        this.setMessage(`${hero.name} suffers ${enemy.atk} damage!`);
        if (hero.hp <= 0) this.defeatHero(hero);
      }
    });
    await this.tacticalCamera.restoreCinematicState(TIMING.cameraRestoreMs);
    this.refreshHUD();
    this.checkVictoryDefeat();
  }

  defeatEnemy(enemy) {
    enemy.alive = false;
    this.grid.clearOccupant(enemy.x, enemy.y);
    // sprite is a token Container now, not an Image/Sprite — no setTint(),
    // alpha alone reads clearly enough for "defeated" on a small marker.
    enemy.sprite.setAlpha(0.25);
    this.setMessage(`${enemy.name} is defeated!`);
  }

  defeatHero(hero) {
    hero.alive = false;
    this.grid.clearOccupant(hero.x, hero.y);
    hero.sprite.setAlpha(0.3);
    this.setMessage(`${hero.name} has fallen!`);
  }

  startPlayerPhase() {
    this.turn += 1;
    this.phase = 'player';
    this.unitController.resetForNewTurn(this.heroes.filter(h => h.alive));
    this.refreshHUD();
    this.setMessage('Player Phase. Select a hero.');
  }

  // --- Victory / defeat ------------------------------------------------

  checkVictoryDefeat() {
    if (this.victory || this.defeat) return;
    if (this.nodes.every(n => n.restored)) {
      this.victory = true;
      this.showEndPanel('Silence Broken', 'All three sound nodes are restored. The backyard sings again.');
      return;
    }
    if (!this.heroes.some(h => h.alive)) {
      this.defeat = true;
      this.showEndPanel('The Quiet Wins', 'All heroes have fallen. Try again.');
    }
  }

  showEndPanel(title, body) {
    this.inputLocked = true;
    const w = this.scale.width, h = this.scale.height;
    const container = this.add.container(w / 2, h / 2).setDepth(700);
    const bg = this.add.rectangle(0, 0, Math.min(340, w * 0.86), 190, 0x120b28, 0.97).setStrokeStyle(2, 0x5a3a88, 1);
    const titleText = this.add.text(0, -58, title, { fontSize: '20px', fontStyle: 'bold', color: '#FFE8A0' }).setOrigin(0.5);
    const bodyText = this.add.text(0, -8, body, {
      fontSize: '13px', color: '#C8A8FF', align: 'center', wordWrap: { width: Math.min(300, w * 0.76) }
    }).setOrigin(0.5);
    const retryBtn = this.add.rectangle(0, 58, 140, 36, 0x1a1033, 1).setStrokeStyle(1, 0x5a3a88, 1)
      .setInteractive({ useHandCursor: true });
    const retryText = this.add.text(0, 58, 'Restart', { fontSize: '14px', color: '#FFE8A0' }).setOrigin(0.5);
    retryBtn.on('pointerdown', (p, lx, ly, ev) => {
      if (ev) ev.stopPropagation();
      if (p.event) p.event._tacticalUIHandled = true;
      this.scene.restart();
    });
    container.add([bg, titleText, bodyText, retryBtn, retryText]);
    this.uiAdd(container);
    this.endPanel = container;
  }
}
