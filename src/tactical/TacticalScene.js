// Tactical Field Foundation v2 — TacticalScene.
// Owns phase sequencing, objectives, enemy intent, victory/defeat, and
// coordination between the other tactical modules. Camera logic stays in
// TacticalCamera; presentation stays in BattleCinematic; this module only
// decides *when* those things happen.
import { GRID, TILE, ZOOM, TIMING, BREAKPOINTS, INPUT } from './TacticalConfig.js?v=50';
import TerrainRegistry from './TerrainRegistry.js?v=49';
import TacticalGrid from './TacticalGrid.js?v=49';
import TacticalPathfinder from './TacticalPathfinder.js?v=49';
import TacticalCamera from './TacticalCamera.js?v=49';
import UnitController from './UnitController.js?v=49';
import BattleCinematic from './BattleCinematic.js?v=53';
import TacticalActionConsole from './TacticalActionConsole.js?v=52';

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

// Reuses BP's own per-hero impact clips (VeilBattleScene.js's `sfx` bank)
// for the enemy tactical cut-in's hit beat — this cut-in never had any
// sound on the hero actually getting hit, just the camera flash/shake.
// Not a full EnemyAudioDirector-style bank (no release/hurt/defeat cues
// here, just the one moment that needed one), so a plain lookup table is
// enough rather than standing up a second audio system for Tactical.
const HERO_HIT_SFX = Object.freeze({
  prismel: { key: 'sfx_impact', path: './assets/sfx/sfx_impact.mp3' },
  kineza: { key: 'kineza_impact', path: './assets/sfx/kineza/kineza_impact.mp3' },
  auryi: { key: 'auryi_impact', path: './assets/sfx/auryi/auryi_impact.mp3' }
});

// v0.5C Tactical Hero HUD — every position below is a fraction of
// hero_hud_master_a's own pixel dimensions (1252x453, already cropped to
// content), measured directly off the shipped asset (well/bar/facet
// centers and bounds via pixel sampling, not eyeballed off the handoff's
// preview). _buildHeroCard()/_layoutHeroCard() multiply these against
// whatever on-screen width a card actually renders at, so the whole
// layout stays correct at any viewport size without re-measuring.
//
// title.leftX/rightX are the one exception, tuned empirically rather
// than pixel-measured: the name/title pill's actual dark-fill bounds are
// genuinely ambiguous by simple color thresholding (its diagonal end
// caps and the ornamental ring bleed into the same dark tones), and two
// different careful measurements of "the strip's true edges" disagreed
// with each other by enough to matter. Both were wrong in the same
// direction — reported and independently confirmed on a real render:
// each label read as pulled toward the centre divider rather than
// centred in its own half. Fixed by rendering, looking at the actual
// result, and adjusting directly (verified against all three heroes,
// including "Momentum Born" and "Aura Acolyte" — the longest titles —
// for clipping) instead of trusting another pixel measurement of the
// same ambiguous art.
const HERO_HUD_GEOMETRY = Object.freeze({
  aspect: 1252 / 453,
  // y: 66/453 originally, nudged to 111/453 (+10% of card height) after
  // real-device feedback it sat too high, then pulled back up ~5% to
  // 88/453 after that read as having gone slightly too far — net ~5%
  // down from the original, both adjustments against a real device, not
  // a screenshot. leftX: 340 -> 403 (+5% of card width), name confirmed
  // vertically correct and title confirmed correct as-is — real-device
  // feedback again, name just needed to shift right.
  title: { leftX: 403 / 1252, rightX: 1030 / 1252, y: 88 / 453 },
  hp: { wellX: 100 / 1252, wellY: 205 / 453, barX0: 172 / 1252, barX1: 678 / 1252, barY: 205 / 453, barH: 34 / 453 },
  rp: { wellX: 100 / 1252, wellY: 297 / 453, barX0: 172 / 1252, barX1: 678 / 1252, barY: 297 / 453, barH: 34 / 453 },
  wellDiameter: 130 / 1252,
  facets: { xs: [845 / 1252, 985 / 1252, 1125 / 1252], y: 205 / 453, glowSize: 60 / 1252 },
  ready: { x0: 795 / 1252, x1: 1160 / 1252, y: 333 / 453, h: 30 / 453 }
});
// Multiply-tint for the "Inactive" state — cools and darkens Master A's
// own warm gold/navy without desaturating to grey (which would read as
// disabled, explicitly against the handoff's intent).
const HUD_INACTIVE_TINT = 0x9098c8;

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

// Hero map tokens use existing approved TACTICAL-scale character art —
// Prismel's validated six-frame walk cycle, Auryi's validated
// seven-frame movement set, and Kineza's validated six-frame run cycle,
// each used for both idle and walking. None of them use any cinematic
// battle-pose art (assets/poses/): that library is BattleCinematic's
// close-up cut-in exclusively, kept deliberately separate from the
// tactical map's own approved set. The enemies (whose full battle-art
// portraits are the wrong shape/scale for a map marker — see the "giant
// enemy" note in git history) fall through to the procedural circle
// token in _buildUnitToken(). Adding a new hero's sprite is a matter of
// giving them an entry below — _buildHero() already branches on "does
// this id have a CHARACTER_TOKEN_ART entry", and UnitController.
// animateMove() drives any unit's presentation purely through the
// optional onStep/onMoveEnd hooks _buildCharacterToken() returns, so
// grid movement, targeting, selection, and the cinematic battle-
// transition code never need to change for it.
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
  'auryi_move_01_contact_a', 'auryi_move_02_down_a', 'auryi_move_03_passing_a',
  'auryi_move_04_contact_b', 'auryi_move_05_down_b', 'auryi_move_06_passing_b'
];
const KINEZA_WALK_FRAMES = [
  'kineza_run_01_contact_a', 'kineza_run_02_down_a', 'kineza_run_03_passing_a',
  'kineza_run_04_contact_b', 'kineza_run_05_down_b', 'kineza_run_06_passing_b'
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
    idle: { key: 'auryi_move_01_contact_a', originY: 0.860759, scale: 0.294 },
    walkFrames: AURYI_WALK_FRAMES,
    walk: { originY: 0.860759, scale: 0.294 }
  },
  kineza: {
    baseFacing: 'right',
    idle: { key: 'kineza_run_01_contact_a', originY: 0.860759, scale: 0.294 },
    walkFrames: KINEZA_WALK_FRAMES,
    walk: { originY: 0.860759, scale: 0.294 }
  }
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
    // walk-cycle sets (see CHARACTER_TOKEN_ART above). Enemies still use
    // procedural tokens, no load needed for those.
    PRISMEL_WALK_FRAMES.forEach(key => {
      this.load.image(key, `./assets/prismel/walk/map_icons/${key}_mapicon.png`);
      this.load.image(`${key}_silhouette`, `./assets/prismel/walk/map_icons/${key}_silhouette.png`);
    });
    AURYI_WALK_FRAMES.forEach(key => {
      this.load.image(key, `./assets/auryi/movement/map_icons/${key}_mapicon.png`);
      this.load.image(`${key}_silhouette`, `./assets/auryi/movement/map_icons/${key}_silhouette.png`);
    });
    KINEZA_WALK_FRAMES.forEach(key => {
      this.load.image(key, `./assets/kineza/movement/map_icons/${key}_mapicon.png`);
      this.load.image(`${key}_silhouette`, `./assets/kineza/movement/map_icons/${key}_silhouette.png`);
    });
    Object.values(HERO_HIT_SFX).forEach(({ key, path }) => this.load.audio(key, path));
    // v0.5C Tactical Hero HUD — Master A is the sole geometry authority
    // (see HERO_HUD_GEOMETRY below); the icons drop into its two circular
    // wells. State treatment (inactive/active/veilshift ready) is done at
    // runtime via tint/glow on this one texture, never by swapping in the
    // handoff's other state-reference images — those carry real geometry
    // drift from Master A (confirmed directly: ~20-23% differing
    // silhouette pixels for active/inactive), which would shift the HP/RP
    // channels and Attunement sockets between states.
    this.load.image('hero_hud_master_a', './assets/ui/tactical_hud/hero_hud_master_a.png');
    this.load.image('hud_hp_icon', './assets/ui/tactical_hud/hp_icon.png');
    this.load.image('hud_rp_icon', './assets/ui/tactical_hud/rp_icon.png');
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
    // Tactical's own persistent music bed (v0.5B) — see the crossfade
    // in create() that hands off from title_music once this loads.
    this.load.audio('tactical_music', './assets/music/veil_clockwork_drift.mp3');
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
    this._hudHandleJustTapped = false;
    // buildHUD() rebuilds heroCardsDrawer from scratch every create()
    // call, so this flag (checked in layoutHUD()) must reset too, or the
    // fresh drawer skips its snap-to-collapsed positioning and starts
    // wherever a brand-new Container's default x (0, i.e. "expanded")
    // happens to sit.
    this._hudDrawerInit = false;
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

    // Title music used to keep playing straight into Tactical because
    // Tactical had no theme of its own yet (only ever dipped in volume
    // on arrival, never stopped) — now that it does (v0.5B "Veil
    // Clockwork Drift"), the two crossfade instead of title music
    // running underneath the whole map indefinitely. create() does run
    // more than once per session — the defeat/victory panel's "Restart"
    // button calls scene.restart() — so this reuses an existing
    // tactical_music instance rather than sound.add()-ing a second one,
    // and fadeInTacticalMusic() no-ops if it's already playing; the
    // title-music fade is similarly guarded on titleMusic.isPlaying, so a
    // restart after the crossfade has already happened touches neither
    // track. enterLinkedBattle()/onBattleResolved() pause and resume this
    // same instance in place around a linked BP round (see below).
    let tacticalMusic = this.sound.get('tactical_music');
    if (!tacticalMusic) {
      tacticalMusic = this.sound.add('tactical_music', { loop: true, volume: 0 });
    }
    this.tacticalMusic = tacticalMusic;

    const fadeInTacticalMusic = () => {
      if (tacticalMusic.isPlaying) return;
      tacticalMusic.play();
      this.tweens.add({ targets: tacticalMusic, volume: 0.38, duration: 900, ease: 'Sine.easeInOut' });
    };
    if (this.sound.locked) {
      this.sound.once('unlocked', fadeInTacticalMusic);
    } else {
      fadeInTacticalMusic();
    }

    const titleMusic = this.sound.get('title_music');
    if (titleMusic && titleMusic.isPlaying) {
      this.tweens.add({
        targets: titleMusic,
        volume: 0,
        duration: 900,
        ease: 'Sine.easeInOut',
        onComplete: () => titleMusic.stop()
      });
    }
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
  // only place that knows which specific hero this is.
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

    // The v0.5C cards are far bigger than the old 132x58 ones — reported
    // directly as covering too much of the map to see the characters.
    // Heroes are also selectable straight off their map token
    // (handleWorldTap()), so the HUD's detail view doesn't have to stay
    // permanently on screen to be usable — it's a drawer, collapsed by
    // default, that slides in from the left on tap.
    this.hudExpanded = false;
    this.heroCardsDrawer = this.add.container(0, 0);
    this.heroCards.forEach(c => this.heroCardsDrawer.add(c.container));
    this.hudHandle = this._buildHudHandle();

    this.actionMenu = this._buildActionMenu();
    this.zoomControls = this._buildZoomControls();
    this.endPanel = null;

    this.uiAdd([this.turnText, this.messageText, this.zoomControls.container, this.actionMenu.container, this.heroCardsDrawer, this.hudHandle.container]);
  }

  // A small fixed tab at the screen's left edge — never moves, so it's
  // always where the player expects it regardless of drawer state.
  // Swaps its own arrow glyph to hint open vs. close.
  _buildHudHandle() {
    const container = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 26, 64, 0x1a1033, 0.94)
      .setStrokeStyle(1, 0x5a3a88, 0.95).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    const arrow = this.add.text(13, 0, '›', { fontSize: '20px', fontStyle: 'bold', color: '#FFE8A0' }).setOrigin(0.5);
    bg.on('pointerdown', (p, lx, ly, ev) => {
      if (ev) ev.stopPropagation();
      if (p.event) p.event._tacticalUIHandled = true;
      // pointer.event isn't reliably the SAME stamped object by the time
      // onPointerUp checks it a moment later (confirmed directly: the
      // stamp above alone still let handleWorldTap() run afterward,
      // toggling the drawer straight back closed on the very tap that
      // opened it) — a separate flag that only this handler sets and
      // onPointerUp always clears survives the gap the stamp doesn't.
      this._hudHandleJustTapped = true;
      this.toggleHudDrawer();
    });
    container.add([bg, arrow]);
    return { container, bg, arrow };
  }

  // forceExpanded lets other call sites (e.g. dismissing on an outside
  // tap) request a specific state without needing to know the current
  // one first.
  toggleHudDrawer(forceExpanded) {
    const next = typeof forceExpanded === 'boolean' ? forceExpanded : !this.hudExpanded;
    if (next === this.hudExpanded) return;
    this.hudExpanded = next;
    this.hudHandle.arrow.setText(next ? '‹' : '›');
    this.tweens.killTweensOf(this.heroCardsDrawer);
    this.tweens.add({
      targets: this.heroCardsDrawer,
      x: next ? 0 : -this._hudDrawerHiddenOffset,
      duration: 280,
      ease: 'Sine.easeInOut'
    });
  }

  // v0.5C Tactical Hero HUD — replaces the earlier procedural card (flat
  // rectangle, text-only HP, thin generic RP bar, plain rotated-square
  // facets) with the approved shell art. hero_hud_master_a is the ONLY
  // geometry source (see HERO_HUD_GEOMETRY) — the handoff's other state
  // images (active/inactive/veilshift_ready) exist purely as lighting/
  // color references and are never loaded as textures, since they carry
  // real geometry drift from Master A (confirmed by pixel diff — see the
  // preload() comment). State differences (inactive/active/veilshift
  // ready) are done at runtime instead: a tint on the one shell texture
  // plus additive glow overlays, the same idiom this codebase already
  // uses everywhere else for emphasis (BattleFXDirector's aura layers,
  // HUD gatherPulse/critFlare) — not an attempt to pixel-match the
  // handoff's AI-generated reference art, which the handoff itself
  // frames as mood guidance, not a literal asset to extract.
  //
  // HP now gets a real fill bar (it was numeric-only before) and RP
  // keeps its own — "three concepts, three visual languages" still
  // holds: HP fills crimson-red, RP fills violet-blue, Attunement stays
  // three discrete facets rather than a third bar.
  _buildHeroCard(hero, index) {
    const container = this.add.container(0, 0);

    // Sits behind the shell, additive-blended — the "active/selected"
    // treatment. Invisible (alpha 0) by default; refreshHUD() raises its
    // alpha only for the currently-selected hero.
    const selectionGlow = this.add.rectangle(0, 0, 10, 10, 0xffe8a0, 0.5)
      .setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);

    const shell = this.add.image(0, 0, 'hero_hud_master_a').setOrigin(0, 0);

    // HERO_HUD_GEOMETRY.title.leftX/rightX are each strip's own centre
    // x — origin must be (0.5, 0.5) to actually land centred there, not
    // (0, 0.5), which anchors the text's *left edge* to that point and
    // visibly pushes it right of true centre.
    const name = this.add.text(0, 0, hero.name, {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#FFE8A0'
    }).setOrigin(0.5, 0.5);
    const title = this.add.text(0, 0, hero.title || '', {
      fontFamily: 'Georgia, serif', color: '#C8A8FF'
    }).setOrigin(0.5, 0.5);

    const hpIcon = this.add.image(0, 0, 'hud_hp_icon').setOrigin(0.5);
    const hpFill = this.add.rectangle(0, 0, 10, 10, 0xd21f3c, 1).setOrigin(0, 0.5);
    const hpText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#FFFFFF', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    const rpIcon = this.add.image(0, 0, 'hud_rp_icon').setOrigin(0.5);
    const rpFill = this.add.rectangle(0, 0, 10, 10, 0x8a5cff, 1).setOrigin(0, 0.5);
    const rpText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#FFFFFF', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    // Segment i lights once attunement > i. A soft additive diamond glow
    // sitting inside Master A's own baked (always-dormant) facet outline
    // — the outline itself never changes, only whether light shows
    // through it — rather than redrawing the facet shape from scratch.
    const facets = [];
    for (let i = 0; i < (hero.attunementMax || 3); i++) {
      const f = this.add.rectangle(0, 0, 10, 10, 0x8a6ad0, 0.85)
        .setOrigin(0.5).setAngle(45).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      facets.push(f);
    }

    const readyText = this.add.text(0, 0, 'VEILSHIFT READY', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#FFE8A0', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);
    // Pulsing gold wash over the facets + ready-slot region specifically
    // — state-priority rule from the handoff: "Veilshift Ready treatment
    // wins within the Attunement/ready-slot region" while Active stays
    // legible everywhere else on the shell.
    const veilshiftGlow = this.add.rectangle(0, 0, 10, 10, 0xffe8a0, 0.4)
      .setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);

    container.add([selectionGlow, shell, veilshiftGlow, name, title, hpIcon, hpFill, hpText, rpIcon, rpFill, rpText, ...facets, readyText]);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 10, 10), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); if (p.event) p.event._tacticalUIHandled = true; this.onHeroCardTap(hero); });

    return {
      container, shell, selectionGlow, name, title,
      hpIcon, hpFill, hpText, rpIcon, rpFill, rpText,
      facets, readyText, veilshiftGlow, hero, cardW: 0, cardH: 0
    };
  }

  // Repositions/rescales one hero card's children for a given on-screen
  // shell width — called from layoutHUD() so the whole card stays
  // correct at any viewport size without re-deriving geometry. Every
  // offset here is HERO_HUD_GEOMETRY (a fraction of Master A's own
  // 1252x453) times this card's current width/height.
  _layoutHeroCard(card, width) {
    const g = HERO_HUD_GEOMETRY;
    const height = width / g.aspect;
    card.cardW = width;
    card.cardH = height;

    card.shell.setDisplaySize(width, height);
    card.selectionGlow.setPosition(-width * 0.03, -height * 0.06).setSize(width * 1.06, height * 1.12);
    card.veilshiftGlow.setPosition(width * g.facets.xs[0] - width * 0.08, height * g.facets.y - height * 0.18)
      .setSize(width * (g.ready.x1 - g.facets.xs[0] + 0.14), height * (g.ready.y + g.ready.h - g.facets.y + 0.22));

    card.name.setPosition(width * g.title.leftX, height * g.title.y)
      .setFontSize(Math.round(height * 0.13));
    // Reported as possibly too large to fit its strip — checked directly
    // rather than assumed: "Momentum Born" (the longest title) measured
    // only ~8px/11% of margin against the strip's available width at the
    // original 0.1 multiplier. Sized down for real headroom instead of
    // leaving it that tight.
    card.title.setPosition(width * g.title.rightX, height * g.title.y)
      .setFontSize(Math.round(height * 0.088));

    const wellD = width * g.wellDiameter;
    card.hpIcon.setPosition(width * g.hp.wellX, height * g.hp.wellY).setDisplaySize(wellD, wellD);
    card.rpIcon.setPosition(width * g.rp.wellX, height * g.rp.wellY).setDisplaySize(wellD, wellD);

    card._hpBarX = width * g.hp.barX0;
    card._hpBarW = width * (g.hp.barX1 - g.hp.barX0);
    card.hpFill.setPosition(card._hpBarX, height * g.hp.barY).setSize(card._hpBarW, height * g.hp.barH);
    card.hpText.setPosition(width * (g.hp.barX0 + g.hp.barX1) / 2, height * g.hp.barY)
      .setFontSize(Math.round(height * 0.09));

    card._rpBarX = width * g.rp.barX0;
    card._rpBarW = width * (g.rp.barX1 - g.rp.barX0);
    card.rpFill.setPosition(card._rpBarX, height * g.rp.barY).setSize(card._rpBarW, height * g.rp.barH);
    card.rpText.setPosition(width * (g.rp.barX0 + g.rp.barX1) / 2, height * g.rp.barY)
      .setFontSize(Math.round(height * 0.09));

    const facetSize = width * g.facets.glowSize;
    card.facets.forEach((f, i) => {
      f.setPosition(width * g.facets.xs[i], height * g.facets.y).setSize(facetSize, facetSize);
    });

    card.readyText.setPosition(width * (g.ready.x0 + g.ready.x1) / 2, height * g.ready.y)
      .setFontSize(Math.round(height * 0.085));

    // Mutate the existing hit area in place rather than calling
    // setInteractive() again — a second call silently no-ops the
    // hit-area update once an object is already interactive (see
    // TacticalActionConsole.js's own layout() for the same fix).
    card.container.input.hitArea.setTo(0, 0, width, height);
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

    // v0.5C hero HUD cards used to be capped well short of the full
    // screen width (max 260-340px) — reported directly as hard to read,
    // since it's the drawer's whole reason for existing now (see
    // buildHUD()): it only shows while expanded, on demand, so there's
    // no permanent-map-coverage cost to using the full width. Every
    // well/bar/facet/text position in the card is a fraction of its own
    // width (HERO_HUD_GEOMETRY), so going edge-to-edge scales
    // everything up together for free — no other layout math to touch.
    const cardW = w - margin * 2;
    const stackTop = margin + 54;
    let cardY = stackTop;
    this.heroCards.forEach(c => {
      this._layoutHeroCard(c, cardW);
      c.container.setPosition(margin, cardY);
      cardY += c.cardH + 6;
    });

    // Handle is a sibling of the drawer, not a child of it, so its own
    // screen position never moves — only the drawer (the cards) slides
    // underneath/behind it. Vertically centred on the card stack's
    // current height, which changes with cardW/breakpoint.
    this._hudDrawerHiddenOffset = margin + cardW;
    this.hudHandle.container.setPosition(0, (stackTop + cardY - 6) / 2);
    // First layout after create()/restart snaps straight to the correct
    // resting position for the (collapsed-by-default) state; a later
    // resize mid-session shouldn't fight an in-flight open/close tween.
    if (!this._hudDrawerInit || !this.tweens.isTweening(this.heroCardsDrawer)) {
      this.heroCardsDrawer.x = this.hudExpanded ? 0 : -this._hudDrawerHiddenOffset;
      this._hudDrawerInit = true;
    }

    this.zoomControls.container.setPosition(w - margin - 56, h - margin - 24);

    // Console buttons render at a fixed touch-friendly height regardless
    // of viewport; only the row gap and cancel pill shrink in compact.
    const barHeight = compact ? 40 : 46;
    const gap = compact ? 5 : 6;
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

  // v0.5C state mapping, following HERO_HUD_INTEGRATION.md's documented
  // priority (Veilshift Ready > Active > Default > Inactive) against
  // this game's actual state model — the handoff doesn't define what
  // triggers Default vs Inactive itself, so: a hero is Active while
  // actually selected, Inactive while a *different* hero is selected
  // (present, available, just not the current focus), and Default
  // (Master A untreated) in the idle moment nothing is selected yet.
  // Veilshift Ready layers on top of any of the three, independent of
  // selection, exactly as the priority list says it can coexist with
  // Active.
  refreshHUD() {
    this.turnText.setText(`Turn ${this.turn} — ${this.phase === 'player' ? 'Player Phase' : 'Enemy Phase'}`);
    this.messageText.setText(this.message);
    const selected = this.unitController.selected;

    this.heroCards.forEach(c => {
      const hero = c.hero;
      const alive = hero.alive;
      const isSelected = alive && hero === selected;

      c.container.setAlpha(alive ? 1 : 0.55);
      if (isSelected) {
        c.shell.clearTint();
      } else if (selected) {
        c.shell.setTint(HUD_INACTIVE_TINT);
      } else {
        c.shell.clearTint();
      }
      c.selectionGlow.setAlpha(isSelected ? 0.35 : 0);

      const hpFrac = alive && hero.maxHp ? Phaser.Math.Clamp(hero.hp / hero.maxHp, 0, 1) : 0;
      c.hpFill.setSize(Math.max(1, c._hpBarW * hpFrac), c.hpFill.height);
      c.hpText.setText(alive ? `${hero.hp}/${hero.maxHp}${hero.acted ? ' ✓' : ''}` : 'DOWN');
      // Restrained low-HP pulse, not arcade flashing — a slow alpha
      // breathe, and only actually running while genuinely low so it
      // doesn't tween forever on every hero.
      const lowHp = alive && hpFrac > 0 && hpFrac <= 0.25;
      if (lowHp && !c._lowHpPulse) {
        c._lowHpPulse = this.tweens.add({
          targets: c.hpFill, alpha: { from: 1, to: 0.55 }, duration: 700, yoyo: true, repeat: -1
        });
      } else if (!lowHp && c._lowHpPulse) {
        c._lowHpPulse.stop();
        c._lowHpPulse = null;
        c.hpFill.setAlpha(1);
      }

      const rpFrac = alive && hero.maxRp ? Phaser.Math.Clamp(hero.rp / hero.maxRp, 0, 1) : 0;
      c.rpFill.setSize(Math.max(1, c._rpBarW * rpFrac), c.rpFill.height);
      c.rpText.setText(alive ? `${hero.rp}/${hero.maxRp}` : '');
      // Brief shimmer only on an actual gain/spend, not every refresh.
      if (alive && c._lastRp != null && hero.rp !== c._lastRp) {
        this.tweens.add({ targets: c.rpFill, scaleY: { from: 1.6, to: 1 }, duration: 220, ease: 'Quad.easeOut' });
      }
      c._lastRp = hero.rp;

      const veilshiftReady = alive && hero.attunement >= hero.attunementMax;
      c.facets.forEach((f, i) => {
        const lit = alive && hero.attunement > i;
        f.setFillStyle(veilshiftReady ? 0xffe8a0 : 0x8a6ad0, 0.85).setAlpha(lit ? 0.9 : 0);
      });
      c.readyText.setAlpha(veilshiftReady ? 1 : 0);
      if (veilshiftReady && !c._veilshiftPulse) {
        c._veilshiftPulse = this.tweens.add({
          targets: c.veilshiftGlow, alpha: { from: 0.15, to: 0.45 }, duration: 650, yoyo: true, repeat: -1
        });
      } else if (!veilshiftReady && c._veilshiftPulse) {
        c._veilshiftPulse.stop();
        c._veilshiftPulse = null;
        c.veilshiftGlow.setAlpha(0);
      }
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
    if (pointer.event && pointer.event._tacticalUIHandled) { this._dragging = false; this._hudHandleJustTapped = false; return; }
    const wasDrag = this._dragMoved;
    this._dragging = false;
    this._dragMoved = false;
    if (this.inputLocked || wasDrag) { this._hudHandleJustTapped = false; return; }
    this.handleWorldTap(pointer);
    this._hudHandleJustTapped = false;
  }

  onWheel(pointer, gameObjects, deltaX, deltaY) {
    if (this.inputLocked) return;
    this.tacticalCamera.zoomBy(deltaY > 0 ? -0.1 : 0.1);
  }

  handleWorldTap(pointer) {
    if (this.phase !== 'player') return;
    // Guards specifically against the handle's own tap: onPointerUp's
    // _tacticalUIHandled check alone wasn't enough here (see the
    // handle's pointerdown handler for why) — without this, tapping the
    // handle to open the drawer immediately toggled it back closed on
    // the same gesture.
    if (this._hudHandleJustTapped) return;
    // A tap here already means it landed on the board, not on any UI
    // element (the hero cards themselves stopPropagation and stamp
    // _tacticalUIHandled, so onPointerUp never even calls this for a tap
    // on the open drawer) — standard drawer UX: the first tap outside
    // just dismisses it, it doesn't also act on whatever tile happens to
    // be underneath.
    if (this.hudExpanded) { this.toggleHudDrawer(false); return; }
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
    // Tactical's own music (see the crossfade in create()) needs to be
    // paused before BP launches, since VeilBattleScene has its own
    // battle_music and the two would layer otherwise. It's a Sound
    // Manager object findable by key from any scene, not something only
    // this scene holds a reference to.
    const tacticalMusic = this.sound.get('tactical_music');
    this._tacticalMusicWasPlaying = !!(tacticalMusic && tacticalMusic.isPlaying);
    if (this._tacticalMusicWasPlaying) tacticalMusic.pause();
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
    if (this._tacticalMusicWasPlaying) {
      const tacticalMusic = this.sound.get('tactical_music');
      if (tacticalMusic) tacticalMusic.resume();
      this._tacticalMusicWasPlaying = false;
    }

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
    this.floatDamage(target, battleResult.damageApplied, battleResult.critical);
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
        const msg = `${hero.name} suffers ${enemy.atk} damage!`;
        this.setMessage(msg);
        const hitSfx = HERO_HIT_SFX[hero.id];
        if (hitSfx) {
          const sfx = this.sound.get(hitSfx.key) || this.sound.add(hitSfx.key, { volume: 0.9 });
          sfx.play();
        }
        if (hero.hp <= 0) this.defeatHero(hero);
        return msg;
      }
    });
    // Same tactical-map hit feedback the linked BP path gets on return —
    // the cut-in's own fade-out has already resolved by this point (its
    // promise only resolves once the overlay layer is destroyed), so the
    // map is fully visible again and this reads clean, not layered under
    // the cinematic's darkening overlay.
    this.floatDamage(hero, enemy.atk, false);
    await this.tacticalCamera.restoreCinematicState(TIMING.cameraRestoreMs);
    this.refreshHUD();
    this.checkVictoryDefeat();
  }

  // Presentation polish: returning from a full Battle Presentation round
  // (or closing the lighter enemy cut-in) used to just snap back to a
  // changed HP number and a text line — nothing marked the hit on the
  // tactical map itself. A floating number + a brief punch-scale on the
  // target's own token + a camera micro-shake gives that moment some
  // weight without touching anything about the actual combat resolution.
  // unit.sprite is always a Container (both the procedural circle-and-
  // initials token and the character-art token build one), so a uniform
  // `.scale` punch works identically regardless of which kind is hit —
  // no need to know or care which token type this is.
  floatDamage(unit, amount, critical) {
    if (!unit || !unit.sprite) return;
    const x = unit.sprite.x;
    const y = unit.sprite.y - 18;
    // Sized and weighted up from the original pass (15/20px, 3px stroke,
    // straight linear fade over 850ms) — playtest feedback was that it
    // read as thin and rushed. The heavier stroke plus a brief full-alpha
    // hold before the fade (rather than starting to dissolve immediately)
    // gives it a beat to actually be read before it drifts off.
    const text = this.add.text(x, y, `-${amount}`, {
      fontSize: critical ? '26px' : '19px',
      fontStyle: 'bold',
      color: critical ? '#FFE8A0' : '#FFFFFF',
      stroke: '#000000',
      strokeThickness: critical ? 6 : 5
    }).setOrigin(0.5).setDepth(30);
    this.worldAdd(text);
    const FLOAT_MS = 1250;
    this.tweens.add({
      targets: text,
      y: y - 42,
      duration: FLOAT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
    this.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0 },
      delay: FLOAT_MS * 0.4,
      duration: FLOAT_MS * 0.6,
      ease: 'Quad.easeIn'
    });

    // Reset to the token's known resting scale (1 — neither token builder
    // ever scales the outer container itself) before punching, rather
    // than reading whatever scale is current: a hit landing mid-tween
    // from a *previous* punch would otherwise capture that in-flight
    // value as the new "base" and the token could creep permanently
    // larger over several rapid hits.
    this.tweens.killTweensOf(unit.sprite);
    unit.sprite.setScale(1);
    this.tweens.add({
      targets: unit.sprite,
      scale: 1.18,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    this.cameras.main.shake(140, 0.006);
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
