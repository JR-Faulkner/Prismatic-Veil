import BattleHUD from './BattleHUD.js?v=43';
import BattleController from './BattleController.js?v=43';
import Timeline from './Timeline.js?v=42';
import VeilFracture from './VeilFracture.js?v=42';
import HeroPoseView from './HeroPoseView.js?v=42';
import { WRAITH_TEXTURES } from './EnemyWraithView.js?v=42';
import { HUSHLING_TEXTURES } from './EnemyHushlingView.js?v=42';
import { createEnemyView } from './EnemyViewFactory.js?v=42';
import EnemyAudioDirector, { preloadEnemyAudio } from './EnemyAudioDirector.js?v=42';
import { selectEnemy, ENEMY_ORDER, nextEnemyId } from './EnemyCatalog.js?v=42';
import BattleCamera from './BattleCamera.js?v=43';
import BattleFX from './BattleFX.js?v=42';
import BattleFXDirector from './BattleFXDirector.js?v=43';
import BattleFeel from './BattleFeel.js?v=42';
import AmbientBattlefieldDirector, { BATTLEFIELD_TEXTURES } from './AmbientBattlefieldDirector.js?v=42';
import BattleAtmosphere from './BattleAtmosphere.js?v=42';
import HudFrame from './HudFrame.js?v=42';
import CommandConsole from './CommandConsole.js?v=42';
import TargetReticle from './TargetReticle.js?v=42';
import UiAudio from './UiAudio.js?v=42';
import { AUDIO_EVENTS } from './BattleController.js?v=43';
import { BATTLE_CONFIG, HEROES, HERO_ORDER } from './BattleConfig.js?v=43';

function cloneConfig(source, heroKey, search, enemyKey) {
  const hero = HEROES[heroKey] || source.hero;
  const enemy = selectEnemy(source.enemy, search, enemyKey);
  return {
    hero: {
      ...hero,
      attack: { ...hero.attack }
    },
    enemy: {
      ...enemy,
      attack: { ...enemy.attack }
    },
    text: { ...source.text }
  };
}

export default class VeilBattleScene extends Phaser.Scene {
  constructor() {
    super('VeilBattleScene');
  }

  // v0.4 Tactical <-> Battle Presentation bridge (TP_BP_BRIDGE_SPEC.md).
  // Phaser calls init(data) before every create() — including a plain
  // scene.restart(), where `data` is undefined, so linkedContext falls
  // back to null exactly when it should (a hero/enemy switch restart, or
  // resetBattle()'s gauntlet restart, both correctly fall out of linked
  // mode). Only `this.scene.launch('VeilBattleScene', context)` from
  // TacticalScene supplies a real `{ mode: 'linked', ... }` payload.
  init(data) {
    this.linkedContext = (data && data.mode === 'linked') ? data : null;
  }

  preload() {
    this.load.audio('battle_music', './Veilbreak.mp3');
    preloadEnemyAudio(this);
    this.load.audio('sfx_gather', './assets/sfx/sfx_gather.mp3');
    this.load.audio('sfx_release', './assets/sfx/sfx_release.mp3');
    this.load.audio('sfx_step', './assets/sfx/sfx_step.mp3');
    this.load.audio('sfx_impact', './assets/sfx/sfx_impact.mp3');
    this.load.audio('sfx_recover', './assets/sfx/sfx_recover.mp3');
    this.load.audio('sfx_victory', './assets/sfx/sfx_victory.mp3');
    this.load.audio('kineza_step', './assets/sfx/kineza/kineza_step.mp3');
    this.load.audio('kineza_coil', './assets/sfx/kineza/kineza_coil.mp3');
    this.load.audio('kineza_strike', './assets/sfx/kineza/kineza_strike.mp3');
    this.load.audio('kineza_impact', './assets/sfx/kineza/kineza_impact.mp3');
    this.load.audio('kineza_recover', './assets/sfx/kineza/kineza_recover.mp3');
    this.load.audio('kineza_idle_pulse', './assets/sfx/kineza/kineza_idle_pulse.mp3');
    this.load.audio('kineza_debris', './assets/sfx/kineza/kineza_debris.mp3');
    // v0.4: Auryi's own dedicated bank — warm/luminous/harmonic, never
    // Prismel's or Kineza's cues (AURYI_AUDIO_INTEGRATION.md).
    this.load.audio('auryi_step', './assets/sfx/auryi/auryi_step.mp3');
    this.load.audio('auryi_gather', './assets/sfx/auryi/auryi_gather.mp3');
    this.load.audio('auryi_release', './assets/sfx/auryi/auryi_release.mp3');
    this.load.audio('auryi_impact', './assets/sfx/auryi/auryi_impact.mp3');
    this.load.audio('auryi_recompose', './assets/sfx/auryi/auryi_recompose.mp3');
    this.load.audio('auryi_idle_pulse', './assets/sfx/auryi/auryi_idle_pulse.mp3');
    this.load.image('dialogFrame', './assets/ui/dialog_frame_9slice.png');
    this.load.image('continueCrystal', './assets/ui/continue_crystal.png');
    this.load.image('prismelLocked', './assets/prismel_locked.png');
    this.load.image('portrait_prismel', './assets/ui/portrait_prismel.png');
    this.load.image('portrait_kineza', './assets/ui/portrait_kineza.png');
    this.load.image('portrait_auryi', './assets/ui/portrait_auryi.png');
    this.load.image('portrait_wraith', './assets/ui/portrait_wraith_v34.png');
    this.load.image('portrait_hushling', './assets/ui/portrait_hushling_v34.png');
    // v38A battlefield layers — real painted art from DAI, replacing the
    // procedural backdrop/bands/floor/motes BattleAtmosphere used to draw.
    this.load.image(BATTLEFIELD_TEXTURES.farBackground, './assets/battle/veil_fracture/01_far_background_master.png');
    this.load.image(BATTLEFIELD_TEXTURES.midSpires, './assets/battle/veil_fracture/02_mid_background_spires.png');
    this.load.image(BATTLEFIELD_TEXTURES.combatPlatform, './assets/battle/veil_fracture/03_combat_platform.png');
    this.load.image(BATTLEFIELD_TEXTURES.fractureOverlay, './assets/battle/veil_fracture/04_fracture_energy_overlay.png');
    this.load.image(BATTLEFIELD_TEXTURES.particleOverlay, './assets/battle/veil_fracture/05_particle_overlay.png');
    this.loadUiKit();
    this.loadFeedbackDigits();
    // Every hero's pose set. A pose whose PNG is absent falls back to the
    // locked Prismel art at runtime.
    Object.values(HEROES).forEach(hero => {
      const seen = new Set();
      Object.values(hero.poses).forEach(tex => {
        if (seen.has(tex)) return;
        seen.add(tex);
        this.load.image(tex, `${hero.posePath}${tex}.png`);
      });
    });
    Object.values(WRAITH_TEXTURES).forEach(tex => {
      this.load.image(tex, `./assets/enemy/veil_wraith/${tex}.png`);
    });
    Object.values(HUSHLING_TEXTURES).forEach(tex => {
      this.load.image(tex, `./assets/enemy/hushling/${tex}.png`);
    });
  }

  // Battle Presentation Alpha v1.0 UI kit, sliced out of the eight
  // source sheets and keyed to real transparency. Everything is a
  // relative path off the repo root — no CDN.
  loadUiKit() {
    const kit = key => this.load.image(`kit_${key}`, `./assets/ui/kit/${key}.png`);
    // v32's TargetReticle draws its rig procedurally — no baked reticle
    // textures needed any more. (The v33 delta was cut from a VeilBattleScene.js
    // snapshot that predates this cleanup — see FAI_FEEDBACK.md.)
    ['console_plate', 'cursor_idle', 'cursor_active',
     'frame_corner', 'frame_rail', 'frame_rail_centre'].forEach(kit);
    ['fracture', 'resonance', 'barrier', 'returnpath'].forEach(g => {
      ['idle', 'on', 'off'].forEach(state => kit(`glyph_${g}_${state}`));
    });
    ['blue', 'teal'].forEach(c => {
      ['idle', 'active', 'hurt', 'down'].forEach(state => kit(`pframe_${c}_${state}`));
    });
    ['idle', 'active', 'hurt'].forEach(state => kit(`pframe_violet_${state}`));
  }

  // Sheet 05's combat-feedback numerals: ten tintable white masks, ten
  // gold criticals. src/BattleFeedback.js reads them by these keys.
  loadFeedbackDigits() {
    for (let d = 0; d <= 9; d++) {
      this.load.image(`digit_white_${d}`, `./assets/feedback_digits/white_${d}.png`);
      this.load.image(`digit_gold_${d}`, `./assets/feedback_digits/gold_${d}.png`);
    }
  }

  create() {
    // scene.restart() reuses this instance but destroys every game
    // object, so any cached object reference must be dropped here or it
    // will point at a destroyed node on the next battle.
    this._lightWash = null;
    this._hitStopped = false;
    this._hitStopUntil = 0;
    if (this._hitStopTimer) window.clearTimeout(this._hitStopTimer);
    this._hitStopTimer = null;

    // The Sound Manager is NOT one of the objects a restart destroys —
    // the previous battle's music and SFX instances survive it. Without
    // this, switching heroes layers a second battle_music loop over the
    // first and neither one ever stops. v0.4: this used to be a blanket
    // this.sound.stopAll()/removeAll(), which was safe when this scene
    // owned the only Phaser.Game instance it ever ran in — now that the
    // Tactical<->Battle bridge shares one Game (and one Sound Manager)
    // between TacticalScene and this scene, a blanket clear would just
    // as happily destroy Tactical-owned audio the moment it has any.
    // Stop/destroy only what THIS scene's own previous instance created
    // — tracked on `this` across restarts, same cache-and-clear idiom as
    // every other restart-survivor in this method.
    this._stopOwnAudio();

    this.linkedMode = !!this.linkedContext;
    this.activeHero = this.linkedMode
      ? this.linkedContext.heroId
      : (this.registry.get('heroKey') || HERO_ORDER[0]);
    this.battleConfig = cloneConfig(
      BATTLE_CONFIG,
      this.activeHero,
      window.location.search,
      this.linkedMode ? this.linkedContext.enemyId : this.registry.get('enemyKey')
    );

    if (this.linkedMode) {
      // Tactical is the state authority — its hero/enemy HP may already
      // differ from BattleConfig's frozen defaults (earlier damage this
      // same tactical encounter), and its resolution plan is what this
      // round must present, not a fresh roll. See BattleController's
      // `linkedResolution` branch for the no-double-roll half of this.
      const snap = this.linkedContext.tacticalSnapshot;
      this.battleConfig.hero.hp = snap.heroHP;
      this.battleConfig.hero.maxHp = snap.heroMaxHP;
      if (snap.heroRP != null) this.battleConfig.hero.rp = snap.heroRP;
      if (snap.heroAttunement != null) this.battleConfig.hero.attunement = snap.heroAttunement;
      this.battleConfig.enemy.hp = snap.enemyHP;
      this.battleConfig.enemy.maxHp = snap.enemyMaxHP;
      this.battleConfig.linkedResolution = this.linkedContext.resolutionPlan;
    }

    this.cameras.main.setBackgroundColor('#070611');

    // Two render layers so the camera can push in on the action without
    // dragging the interface with it: the world zooms, the UI never does.
    this.world = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0).setDepth(1000);

    this.atmosphere = new BattleAtmosphere(this);
    this.atmosphere.create();

    // v38A: the five real painted battlefield layers (far background,
    // mid spires, combat platform, fracture overlay, particle overlay),
    // depth-stacked at -100/-90/-40/-20/-10 — BattleAtmosphere's
    // remaining fog (-30) and foreground (90) layers interleave around
    // them by depth, not creation order. See BattleAtmosphere's own note
    // on why it no longer draws a competing backdrop/floor.
    this.ambientBattlefield = new AmbientBattlefieldDirector(this);
    this.ambientBattlefield.create();

    this.titleText = this.add.text(0, 0, 'VEIL FRACTURE', {
      color: '#FFE8A0'
    }).setOrigin(0.5);

    // The hint tracks the round: the player commands through the console,
    // the enemy's round still advances on a tap.
    this.hintText = this.add.text(0, 0, '', {
      color: '#8A7AB0'
    }).setOrigin(0.5);

    this.uiLayer.add([this.titleText, this.hintText]);
    this.layoutSceneText();

    this.hud = new BattleHUD(this, this.battleConfig);
    this.hud.create();
    this.uiLayer.add(this.hud.container);

    this.hudFrame = new HudFrame(this);
    this.hudFrame.create(this.battleConfig.hero);

    // Synthesised UI cues — no assets required.
    this.uiAudio = new UiAudio(this);

    // Enemy audio is resolved through an enemy-only bank. Missing enemy
    // cues remain silent and never fall back to the active hero.
    this.enemyAudio = new EnemyAudioDirector(this, this.battleConfig.enemy);
    this.enemyAudio.create();

    this.heroPoses = new HeroPoseView(this, this.battleConfig.hero);
    this.heroPoses.create();

    this.enemyView = createEnemyView(this, this.battleConfig.enemy);
    this.enemyView.create();

    this.battleCam = new BattleCamera(this);
    this.battleFx = new BattleFX(this);
    this.battleFXDirector = new BattleFXDirector(this);
    this.battleFeel = new BattleFeel(this);

    // Alpha v1.0 interaction layer. The console is UI (never zooms); the
    // reticle is a battlefield visual and registers through worldAdd().
    this.commandConsole = new CommandConsole(this, this.battleConfig);
    this.commandConsole.create();
    this.reticle = new TargetReticle(this);

    // Battle entrance sweep, then the first round begins.
    const INTRO_MS = 520;
    this.battleCam.introSweep(INTRO_MS);
    this.heroPoses.introSlide(INTRO_MS);
    this.enemyView.introSlide(INTRO_MS);

    this.timeline = new Timeline(this);
    this.fracture = new VeilFracture(this);
    this.controller = new BattleController(
      this,
      this.timeline,
      this.fracture,
      this.hud,
      this.battleConfig
    );

    this.battleMusic = this.sound.add('battle_music', {
      loop: true,
      volume: 0.6
    });

    // Battle SFX chopped from the Suno gather tracks. Kept above the
    // music bed in level so they read over the loop.
    this.sfx = {
      prismel: {
        step: this.sound.add('sfx_step', { volume: 0.62 }),
        gather: this.sound.add('sfx_gather', { volume: 0.85 }),
        release: this.sound.add('sfx_release', { volume: 0.95 }),
        impact: this.sound.add('sfx_impact', { volume: 1.0 }),
        recover: this.sound.add('sfx_recover', { volume: 0.72 }),
        victory: this.sound.add('sfx_victory', { volume: 0.92 })
      },
      kineza: {
        step: this.sound.add('kineza_step', { volume: 0.68 }),
        gather: this.sound.add('kineza_coil', { volume: 0.88 }),
        release: this.sound.add('kineza_strike', { volume: 0.95 }),
        impact: this.sound.add('kineza_impact', { volume: 1.0 }),
        recover: this.sound.add('kineza_recover', { volume: 0.7 }),
        victory: this.sound.add('sfx_victory', { volume: 0.88 }),
        idle: this.sound.add('kineza_idle_pulse', { volume: 0.22 }),
        debris: this.sound.add('kineza_debris', { volume: 0.62 })
      },
      // v0.4 dedicated Auryi bank (AUDIO_LIFECYCLE_REQUIREMENT.md /
      // AURYI_AUDIO_INTEGRATION.md's suggested event mapping). No
      // fallback to Prismel/Kineza cues — playSfx() already resolves
      // strictly by heroId, so simply having this entry is what
      // guarantees that.
      auryi: {
        step: this.sound.add('auryi_step', { volume: 0.7 }),
        gather: this.sound.add('auryi_gather', { volume: 0.85 }),
        release: this.sound.add('auryi_release', { volume: 0.95 }),
        impact: this.sound.add('auryi_impact', { volume: 0.9 }),
        recover: this.sound.add('auryi_recompose', { volume: 0.75 }),
        victory: this.sound.add('sfx_victory', { volume: 0.9 }),
        idle: this.sound.add('auryi_idle_pulse', { volume: 0.18 })
      }
    };

    // v3 audio hook events. Events without an asset yet are simply
    // unmapped — drop a sound in here when one exists.
    const AUDIO_MAP = {
      [AUDIO_EVENTS.step]: 'step',
      [AUDIO_EVENTS.gather]: 'gather',
      [AUDIO_EVENTS.release]: 'release',
      [AUDIO_EVENTS.impact]: 'impact',
      [AUDIO_EVENTS.recover]: 'recover',
      [AUDIO_EVENTS.victory]: 'victory'
    };
    Object.entries(AUDIO_MAP).forEach(([event, key]) => {
      this.events.on(event, () => { if (key) this.playSfx(key); });
    });

    const ENEMY_AUDIO_MAP = {
      [AUDIO_EVENTS.enemyRelease]: 'release',
      [AUDIO_EVENTS.enemyImpact]: 'impact',
      [AUDIO_EVENTS.enemyHurt]: 'hurt',
      [AUDIO_EVENTS.enemyDefeat]: 'defeat'
    };
    Object.entries(ENEMY_AUDIO_MAP).forEach(([event, cue]) => {
      this.events.on(event, () => {
        if (this.enemyAudio) this.enemyAudio.play(cue);
      });
    });

    if (this.sound.locked) {
      this.sound.once('unlocked', () => {
        if (!this.battleMusic.isPlaying) this.battleMusic.play();
      });
    } else {
      this.battleMusic.play();
    }
    if (this.enemyAudio) this.enemyAudio.startIdle();

    this.scale.on('resize', this.layoutSceneText, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layoutSceneText, this);
      if (this.enemyAudio) this.enemyAudio.destroy();
    });

    // Linked mode: the hero/enemy were chosen in Tactical, not picked
    // here — LINKED_VS_STANDALONE_BP.md is explicit that linked BP hides
    // the debug switchers rather than leaving them live and misleading.
    if (!this.linkedMode) {
      this.buildHeroSwitch();
      this.buildEnemySwitch();
    }

    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCam.setBackgroundColor('rgba(0,0,0,0)');
    this.uiCam.ignore(this.world);
    this.cameras.main.ignore(this.uiLayer);
    // Named + stored so the 'shutdown' cleanup below can remove it — an
    // inline anonymous listener here would leak one extra 'resize'
    // registration every time this scene runs, same trap already fixed
    // in TacticalScene.js. It went uncaught here before v0.4 because
    // this scene only ever re-ran via an explicit hero/enemy-switch
    // scene.restart(), not the frequent scene.launch()/stop() cycling
    // a linked battle now does on every single attack.
    if (this._uiCamResizeHandler) this.scale.off('resize', this._uiCamResizeHandler, this);
    this._uiCamResizeHandler = size => this.uiCam.setSize(size.width, size.height);
    this.scale.on('resize', this._uiCamResizeHandler, this);

    this.time.delayedCall(INTRO_MS + 80, () => {
      this.battleCam.markHome();
      this.battleCam.startIdleBreath();
      this.controller.startNextRound();
    });
    // A tap goes to the currently-showing dialogue line first — narration
    // now waits for a real tap to advance instead of a fixed timer (see
    // BattleHUD.tryAdvance()), so the same tap that used to always mean
    // "start the next round" has to check that first, or a tap meant to
    // advance a line would also fire round-advancement underneath it.
    this.input.on('pointerdown', () => {
      if (this.hud && this.hud.tryAdvance()) return;
      this.controller.startNextRound();
    });
  }

  // Tap to cycle the active hero and restart the battle with them.
  buildHeroSwitch() {
    const label = this.add.text(0, 0, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFE8A0',
      backgroundColor: '#1a1033',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setDepth(1200).setInteractive({ useHandCursor: true });

    const next = () => HERO_ORDER[(HERO_ORDER.indexOf(this.activeHero) + 1) % HERO_ORDER.length];
    const render = () => label.setText(`▸ ${HEROES[next()].name}`);
    render();

    label.on('pointerdown', e => {
      if (e && e.event) e.event.stopPropagation();
      if (this.uiAudio) this.uiAudio.confirm();
      this.registry.set('heroKey', next());
      this.scene.restart();
    });

    this.heroSwitch = label;
    this.uiLayer.add(label);
    this.layoutHeroSwitch();
    this.scale.on('resize', this.layoutHeroSwitch, this);
  }

  // Anchored off the same metrics BattleHUD uses for the enemy's
  // portrait block, so it reads as part of the top HUD row instead of
  // floating in the middle of the battlefield — which is where a fixed
  // y=176/250 landed it in landscape, nowhere near any other UI.
  layoutHeroSwitch() {
    if (!this.heroSwitch) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const landscape = w > h;
    const compact = w < 560 || h < 520;
    const margin = landscape
      ? Math.max(12, Math.round(h * 0.035))
      : Math.max(18, Math.round(w * 0.03));
    const portraitSize = landscape ? 42 : (compact ? 44 : 62);
    const topClear = margin + portraitSize + (landscape ? 6 : 10);
    this.heroSwitch.setFontSize(compact ? 11 : 13)
      .setPosition(w - (compact ? 12 : 18), topClear);
  }

  // Tap to cycle the active enemy and restart the battle against them —
  // the manual counterpart to the gauntlet's auto-advance-on-victory.
  // Mirrors buildHeroSwitch() exactly, including the restart mechanism.
  buildEnemySwitch() {
    const label = this.add.text(0, 0, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFE8A0',
      backgroundColor: '#1a1033',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setDepth(1200).setInteractive({ useHandCursor: true });

    const next = () => nextEnemyId(this.battleConfig.enemy.id);
    // Preview the candidate's name through selectEnemy() itself rather
    // than a second hardcoded name map — one source of truth for what
    // each enemy id is called.
    const render = () => label.setText(`▸ ${selectEnemy(BATTLE_CONFIG.enemy, '', next()).name}`);
    render();

    label.on('pointerdown', e => {
      if (e && e.event) e.event.stopPropagation();
      if (this.uiAudio) this.uiAudio.confirm();
      this.registry.set('enemyKey', next());
      this.scene.restart();
    });

    this.enemySwitch = label;
    this.uiLayer.add(label);
    this.layoutEnemySwitch();
    this.scale.on('resize', this.layoutEnemySwitch, this);
  }

  // Stacked directly beneath the hero switch, using its actual rendered
  // height for the gap rather than a guessed magic number. Relies on
  // buildHeroSwitch()'s own resize listener (registered first) having
  // already repositioned heroSwitch by the time this one runs.
  layoutEnemySwitch() {
    if (!this.enemySwitch || !this.heroSwitch) return;
    const gap = 8;
    this.enemySwitch.setFontSize(this.heroSwitch.style.fontSize)
      .setPosition(this.heroSwitch.x, this.heroSwitch.y + this.heroSwitch.height + gap);
  }

  // Package 08 lighting: an ability briefly tints the scene. Prismel
  // throws cool refracted highlights, Kineza warm pressure flashes.
  abilityLight(kind) {
    if (!this._lightWash || !this._lightWash.scene) {
      this._lightWash = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0)
        .setOrigin(0, 0).setDepth(80);
      this.worldAdd(this._lightWash);
    }
    const w = this.scale.width, h = this.scale.height;
    this._lightWash.setSize(w * 2, h * 2).setPosition(-w / 2, -h / 2);

    const hero = this.battleConfig.hero;
    const cool = hero.id !== 'kineza';
    const color = kind === 'impact'
      ? (cool ? 0xdff0ff : 0xffe6b0)
      : (cool ? 0x9fd8ff : 0xb6ff9f);
    const peak = kind === 'impact' ? 0.20 : 0.10;

    this.tweens.killTweensOf(this._lightWash);
    this._lightWash.setFillStyle(color, 1).setAlpha(0);
    this.tweens.add({
      targets: this._lightWash,
      alpha: peak,
      duration: kind === 'impact' ? 70 : 260,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this._lightWash,
          alpha: 0,
          duration: kind === 'impact' ? 300 : 380,
          ease: 'Quad.easeOut'
        });
      }
    });
  }

  setHint(text) {
    if (!this.hintText) return;
    if (this.hintText.text === text) return;
    this.hintText.setText(text);
    this.tweens.killTweensOf(this.hintText);
    this.hintText.setAlpha(0);
    this.tweens.add({
      targets: this.hintText, alpha: 1, duration: 220, ease: 'Quad.easeOut'
    });
  }

  // Battlefield visuals register here so the UI camera ignores them.
  worldAdd(obj) {
    if (this.world && obj) this.world.add(obj);
    return obj;
  }

  playSfx(name) {
    const heroId = this.battleConfig && this.battleConfig.hero.id || 'prismel';
    const bank = this.sfx && this.sfx[heroId];
    const s = bank && bank[name];
    if (s && !this.sound.locked) {
      s.play();
      if (heroId === 'kineza' && name === 'impact' && bank.debris) {
        this.time.delayedCall(36, () => bank.debris.play());
      }
    }
  }

  // v0.4 audio lifecycle (AUDIO_LIFECYCLE_REQUIREMENT.md): stop/destroy
  // only the specific Sound objects THIS scene's previous instance
  // created (music + every hero's SFX bank, including any idle-pulse
  // loop-tick sound — HeroPoseView's recurring idle cue just calls
  // .play() on whatever's cached here, so destroying the object is
  // enough, no separate idle-timer cleanup needed). Called both at the
  // top of create() (guarded — a no-op on first boot) and explicitly
  // before handing control back to Tactical, since scene.stop() doesn't
  // trigger another create() to do this cleanup for us.
  _stopOwnAudio() {
    if (this.battleMusic) {
      this.battleMusic.stop();
      this.battleMusic.destroy();
      this.battleMusic = null;
    }
    if (this.sfx) {
      Object.values(this.sfx).forEach(bank => {
        Object.values(bank).forEach(s => { s.stop(); s.destroy(); });
      });
      this.sfx = null;
    }
  }

  // v0.4 bridge exit. Called by BattleController exactly once, when a
  // linked round has fully resolved and BP has nothing left to show.
  // Order matters: apply the result to Tactical (still paused, so this
  // can't race its own update loop) before this scene tears itself down
  // and Tactical resumes rendering the already-updated state.
  returnToTactical(battleResult) {
    this._stopOwnAudio();
    const tactical = this.scene.get('TacticalScene');
    if (tactical && tactical.onBattleResolved) tactical.onBattleResolved(battleResult);
    this.scene.stop();
    this.scene.resume('TacticalScene');
  }

  // v3 hit stop: freeze the scene clock and tweens for a beat so impacts
  // land. Restored on a real-time timer, which the frozen clock can't
  // delay.
  hitStop(ms = 80) {
    const now = performance.now();
    this._hitStopUntil = Math.max(this._hitStopUntil || 0, now + ms);

    if (!this._hitStopped) {
      this._hitStopped = true;
      this.tweens.timeScale = 0.0001;
      this.time.timeScale = 0.0001;
    }

    if (this._hitStopTimer) window.clearTimeout(this._hitStopTimer);
    const resumeWhenDue = () => {
      const remaining = (this._hitStopUntil || 0) - performance.now();
      if (remaining > 1) {
        this._hitStopTimer = window.setTimeout(resumeWhenDue, remaining);
        return;
      }
      this.tweens.timeScale = 1;
      this.time.timeScale = 1;
      this._hitStopped = false;
      this._hitStopUntil = 0;
      this._hitStopTimer = null;
    };
    this._hitStopTimer = window.setTimeout(resumeWhenDue, ms);
  }

  // A restart can destroy this object through Phaser's own display-list
  // teardown at the same moment a fade-out tween's onComplete tries to
  // destroy it too — two independent paths racing for the same object.
  // The destroy call has to tolerate landing on one Phaser already tore
  // down, since checking liveness first doesn't reliably win that race.
  _destroyIfAlive(obj) {
    if (!obj) return;
    try {
      obj.destroy();
    } catch (err) {
      // already destroyed by a scene restart racing this tween
    }
  }

  // v3 damage numbers: pop in, arc up, fade — coloured by who took it.
  floatDamage(amount, side, crit) {
    const width = this.scale.width;
    const height = this.scale.height;
    const hurtHero = side === 'hero';
    const x = width * (hurtHero ? 0.28 : 0.72);
    const scale = crit ? 1.5 : 1;
    const text = this.add.text(x, height * 0.44, String(amount), {
      fontSize: Math.round(Math.max(34, width * 0.062) * scale) + 'px',
      fontStyle: 'bold',
      color: crit ? '#FFF3B0' : (hurtHero ? '#FF8A8A' : '#FFDF6E'),
      stroke: '#3B0A1C',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(60).setScale(0.4);
    this.worldAdd(text);

    // Package 07: the attacker's style drives how the number behaves.
    const style = hurtHero ? 'refraction' : (this.battleConfig.hero.damageStyle || 'refraction');

    if (style === 'slam') {
      // Kineza: drives down hard, then rebounds.
      text.setScale(1.9).setY(text.y - 30);
      this.tweens.add({
        targets: text, scaleX: 1, scaleY: 1, y: text.y + 30,
        duration: 130, ease: 'Quad.easeIn',
        onComplete: () => {
          this.tweens.add({
            targets: text, y: text.y - 26, duration: 180, yoyo: true, ease: 'Back.easeOut'
          });
        }
      });
      this.tweens.add({
        targets: text, alpha: 0, duration: 620, delay: 430, ease: 'Quad.easeIn',
        onComplete: () => this._destroyIfAlive(text)
      });
    } else {
      // Prismel: pops, then refracts apart as it fades.
      this.tweens.add({
        targets: text, scaleX: 1.18, scaleY: 1.18,
        duration: 150, ease: 'Back.easeOut', yoyo: true, hold: 40
      });
      const ghostA = this.add.text(x, text.y, String(amount), text.style).setOrigin(0.5).setDepth(59).setScale(0.4);
      const ghostB = this.add.text(x, text.y, String(amount), text.style).setOrigin(0.5).setDepth(59).setScale(0.4);
      ghostA.setColor('#8fd8ff'); ghostB.setColor('#ffa8e6');
      this.worldAdd(ghostA); this.worldAdd(ghostB);
      [[ghostA, -7], [ghostB, 7]].forEach(([gt, dx]) => {
        this.tweens.add({
          targets: gt, x: gt.x + dx, y: text.y - 74, alpha: 0, scaleX: 1.1, scaleY: 1.1,
          duration: 950, delay: 140, ease: 'Quad.easeOut', onComplete: () => this._destroyIfAlive(gt)
        });
      });
      this.tweens.add({
        targets: text,
        x: x + (hurtHero ? -22 : 22),
        y: text.y - 74,
        alpha: 0,
        duration: 950,
        delay: 140,
        ease: 'Quad.easeOut',
        onComplete: () => this._destroyIfAlive(text)
      });
    }
  }

  layoutSceneText() {
    const width = this.scale.width;
    const height = this.scale.height;
    const compact = width < 560;
    // Landscape phones are only ~390px tall. The command console and the
    // dialogue box both need that space, so the decorative title block
    // stands down and only the round hint stays.
    const short = height < 520;

    this.titleText.setVisible(!short)
      .setFontSize(compact ? 26 : 40).setPosition(width / 2, compact ? 96 : 120);
    this.hintText.setFontSize(compact ? 11 : 14)
      .setPosition(width / 2, short ? 84 : (compact ? 134 : 172));
  }
}
