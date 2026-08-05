// Battle Presentation v3 — pose timing spec:
//   Idle -> Step 220 -> Gather 450 -> Hold 120 -> Release 160
//        -> Hit Stop 80 -> Recover 260 -> Idle
export const POSE_TIMING = Object.freeze({
  step: 220,
  gather: 450,
  hold: 120,
  release: 160,
  hitStop: 80,
  recover: 260
});

// Audio hook events. The scene maps these to whatever SFX exist; any
// event without an asset is simply ignored, so new sounds drop in
// without touching the controller.
export const AUDIO_EVENTS = Object.freeze({
  step: 'PLAY_STEP',
  gather: 'PLAY_GATHER',
  release: 'PLAY_RELEASE',
  impact: 'PLAY_IMPACT',
  recover: 'PLAY_RECOVER',
  victory: 'PLAY_VICTORY'
});

// How far the Veil conduit dips when a command fires, and how much it
// recovers by the next round. Nothing is gated on it — see the note on
// BattleHUD.updateVeil.
const VEIL_DRAW = 18;

export default class BattleController {
  constructor(scene, timeline, fracture, hud, battleConfig) {
    this.scene = scene;
    this.timeline = timeline;
    this.fracture = fracture;
    this.hud = hud;
    this.config = battleConfig;
    this.running = false;
    // Whose full round runs next. Rounds alternate; the enemy acts only
    // on its own round — no auto-chained sequence. Counter attacks and
    // interruption moves become their own mechanic later.
    this.phase = 'player';
  }

  emit(event) {
    this.scene.events.emit(event);
  }

  // v4 crit feedback: roll once per attack, returned with the damage.
  rollAttack(attacker) {
    const atk = attacker.attack;
    const crit = Math.random() < (atk.critChance || 0);
    const damage = crit
      ? Math.round(atk.damage * (atk.critMultiplier || 2))
      : atk.damage;
    return { crit, damage };
  }

  startNextRound() {
    if (this.running) return;
    if (this.phase === 'player') {
      // The console is the player's input surface, so a stray tap only
      // re-opens it if it somehow isn't up.
      const console_ = this.scene.commandConsole;
      if (!console_ || !console_.open) this.runPlayerRound();
    } else {
      this.runEnemyRound();
    }
  }

  // Alpha v1.0 interaction flow:
  //   1 actor portrait synchronizes   5 attack executes
  //   2 command console appears       6 feedback appears
  //   3 player selects a glyph        7 HP chip resolves
  //   4 reticle seeks and locks       8 UI settles for the next turn
  runPlayerRound() {
    this.hud.setTurn(this.config.text.playerTurn);
    this.hud.setActiveActor('hero');                      // 1
    if (this.scene.setHint) this.scene.setHint('Choose a command');

    const console_ = this.scene.commandConsole;
    if (!console_) return this.beginCommand(null);        // console-less fallback
    console_.show(cmd => this.beginCommand(cmd));         // 2, 3
  }

  // A command that has nothing bound to it never reaches here — the
  // console refuses it and stays open.
  beginCommand(cmd) {
    const hero = this.config.hero;
    this.running = true;
    this.pendingHit = this.rollAttack(hero);
    this.pendingCommand = cmd;
    if (this.scene.setHint) this.scene.setHint('');

    const reticle = this.scene.reticle;
    if (!reticle) {
      this.announceAttack();
      return;
    }

    reticle.seek();                                       // 4
    this.scene.time.delayedCall(360, () => {
      reticle.lock(() => this.announceAttack());
    });
  }

  announceAttack() {
    const hero = this.config.hero;
    this.hud.queueMessage(
      `${hero.name} uses ${hero.attack.name}!`,
      () => this.playAttackCinematic()                    // 5
    );
  }

  // The attack plays as one tight cinematic on the spec's timings while
  // the dialogue runs alongside it.
  playAttackCinematic() {
    const hero = this.config.hero;
    const enemy = this.config.enemy;
    const poses = this.scene.heroPoses;
    const fx = this.scene.battleFx;
    const cam = this.scene.battleCam;
    const t = this.scene.time;
    let at = 0;

    // Step
    if (poses) poses.setPose('step');
    if (this.scene.atmosphere && poses && poses.sprite) {
      this.scene.atmosphere.compressionRipple(poses.sprite.x, poses.sprite.y, hero.accent);
    }
    this.emit(AUDIO_EVENTS.step);
    at += POSE_TIMING.step;

    // Gather
    t.delayedCall(at, () => {
      if (poses) poses.setPose('gather');
      if (fx) fx.gather(POSE_TIMING.gather);
      if (cam) cam.gatherPush();
      if (this.scene.hudFrame) this.scene.hudFrame.gatherPulse(POSE_TIMING.gather);
      if (this.scene.abilityLight) this.scene.abilityLight('gather');
      this.emit(AUDIO_EVENTS.gather);
      // Veil conduit dips as the command draws on it. Presentation only
      // — no command is gated on having Veil left.
      this.hud.updateVeil(Math.max(0, hero.veil - VEIL_DRAW));
      this.hud.queueMessage(hero.attack.flavor);
    });
    at += POSE_TIMING.gather + POSE_TIMING.hold;

    // Release
    t.delayedCall(at, () => {
      if (poses) poses.setPose('release');
      if (fx) fx.beam(POSE_TIMING.release);
      if (cam) cam.releaseSnap();
      if (this.scene.reticle) this.scene.reticle.confirm();
      this.emit(AUDIO_EVENTS.release);
      this.fracture.open();
    });
    at += POSE_TIMING.release;

    // Impact + hit stop
    t.delayedCall(at, () => {
      const hit = this.pendingHit || { crit: false, damage: hero.attack.damage };
      enemy.hp = Math.max(0, enemy.hp - hit.damage);
      this.hud.updateEnemyHP(enemy.hp, enemy.maxHp);   // 6, 7
      if (this.scene.reticle) this.scene.reticle.shatter();
      if (fx) {
        fx.impact();
        if (hit.crit) fx.critical();
      }
      if (hit.crit && this.scene.hudFrame) this.scene.hudFrame.critFlare();
      if (this.scene.abilityLight) this.scene.abilityLight('impact');
      if (this.scene.atmosphere && this.scene.enemyView) {
        const c = this.scene.enemyView.container;
        this.scene.atmosphere.compressionRipple(c.x, c.y, hero.accent);
      }
      if (cam) cam.hitShake(hit.crit);
      if (this.scene.enemyView) this.scene.enemyView.hit();
      if (this.scene.floatDamage) this.scene.floatDamage(hit.damage, 'enemy', hit.crit);
      if (this.scene.hitStop) this.scene.hitStop(hit.crit ? POSE_TIMING.hitStop * 2 : POSE_TIMING.hitStop);
      this.emit(AUDIO_EVENTS.impact);
    });
    at += POSE_TIMING.hitStop;

    // Recover
    t.delayedCall(at, () => {
      if (poses) poses.setPose('recover');
      if (cam) cam.recoverEase();
      this.fracture.close();
      this.emit(AUDIO_EVENTS.recover);
    });
    at += POSE_TIMING.recover;

    // Idle, then resolve the round
    t.delayedCall(at, () => {
      if (poses) poses.setPose('idle');
      this.resolvePlayerRound();
    });
  }

  resolvePlayerRound() {
    const enemy = this.config.enemy;
    const hit = this.pendingHit || { crit: false, damage: this.config.hero.attack.damage };
    const line = hit.crit
      ? `A critical strike! ${enemy.name} is hit for ${hit.damage} damage!`
      : `${enemy.name} is hit for ${hit.damage} damage!`;

    this.hud.queueMessage(line, () => {
      if (enemy.hp <= 0) {
        if (this.scene.enemyView) this.scene.enemyView.die();
        if (this.scene.battleFx) this.scene.battleFx.victoryStinger();
        if (this.scene.hudFrame) this.scene.hudFrame.victoryBloom();
        if (this.scene.uiAudio) this.scene.uiAudio.victory();
        if (this.scene.battleCam) this.scene.battleCam.victoryPullOut();
        this.emit(AUDIO_EVENTS.victory);
        this.hud.queueMessage(`${enemy.name} shatters! The veil clears...`, () => {
          this.resetBattle();
        });
        return;
      }

      // 8 — the conduit recharges and the round hands over
      this.hud.updateVeil(Math.min(100, this.config.hero.veil + VEIL_DRAW));
      this.hud.setTurn(this.config.text.enemyTurn);
      this.hud.setActiveActor('enemy');
      if (this.scene.setHint) this.scene.setHint('Tap to continue');
      this.phase = 'enemy';
      this.running = false;
    });
  }

  runEnemyRound() {
    const hero = this.config.hero;
    const enemy = this.config.enemy;
    const hit = this.rollAttack(enemy);

    this.running = true;
    this.hud.setTurn(this.config.text.enemyTurn);
    this.hud.setActiveActor('enemy');
    if (this.scene.reticle) this.scene.reticle.hide();

    this.hud.queueMessage(`${enemy.name} uses ${enemy.attack.name}!`, () => {
      if (this.scene.battleCam) this.scene.battleCam.pushIn(1.5, 200, 'Back.easeOut');
      if (this.scene.enemyView) this.scene.enemyView.attack();
      this.fracture.open();
      this.emit(AUDIO_EVENTS.release);

      this.scene.time.delayedCall(180, () => {
        hero.hp = Math.max(0, hero.hp - hit.damage);
        this.hud.updateHP(hero.hp, hero.maxHp);
        if (this.scene.floatDamage) this.scene.floatDamage(hit.damage, 'hero', hit.crit);
        if (this.scene.battleCam) this.scene.battleCam.hitShake(hit.crit);
        if (hit.crit && this.scene.hudFrame) this.scene.hudFrame.critFlare();
          if (this.scene.hitStop) this.scene.hitStop(hit.crit ? POSE_TIMING.hitStop * 2 : POSE_TIMING.hitStop);
        this.emit(AUDIO_EVENTS.impact);
        this.fracture.close();
        this.scene.time.delayedCall(260, () => {
          if (this.scene.battleCam) this.scene.battleCam.pullOut(320);
        });
      });
    });

    const line = hit.crit
      ? `A critical strike! ${hero.name} suffers ${hit.damage} damage!`
      : `${hero.name} suffers ${hit.damage} damage!`;
    this.hud.queueMessage(line, () => {
      this.phase = 'player';
      this.running = false;
      // The console opening *is* the start of the player's round, so it
      // comes up on its own rather than waiting for another tap.
      this.runPlayerRound();
    });
  }

  resetBattle() {
    const hero = this.config.hero;
    if (this.scene.reticle) this.scene.reticle.hide();
    if (this.scene.commandConsole) this.scene.commandConsole.hide();
    // Drop the stale victory line so the board reads as a fresh battle
    // rather than "shatters!" over a fully healed Wraith.
    this.hud.clearMessage();
    const enemy = this.config.enemy;
    hero.hp = hero.maxHp;
    hero.veil = 100;
    enemy.hp = enemy.maxHp;
    this.hud.refreshFromConfig(true);
    this.hud.setTurn(this.config.text.playerTurn);
    if (this.scene.enemyView) this.scene.enemyView.reset();
    if (this.scene.battleCam) {
      this.scene.battleCam.reset();
      this.scene.battleCam.markHome();
    }
    this.phase = 'player';
    this.running = false;
    this.runPlayerRound();
  }
}
