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

  speakerFor(who) {
    return { name: who.name, portrait: who.portrait };
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
      this.runPlayerRound();
    } else {
      this.runEnemyRound();
    }
  }

  runPlayerRound() {
    const hero = this.config.hero;

    this.running = true;
    this.pendingHit = this.rollAttack(hero);
    this.hud.setTurn(this.config.text.playerTurn);
    if (this.scene.battleFx) this.scene.battleFx.showTargetCursor();
    this.hud.queueMessage(
      `${hero.name} uses ${hero.attack.name}!`,
      () => this.playAttackCinematic(),
      this.speakerFor(hero)
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
    this.emit(AUDIO_EVENTS.step);
    at += POSE_TIMING.step;

    // Gather
    t.delayedCall(at, () => {
      if (poses) poses.setPose('gather');
      if (fx) fx.gather(POSE_TIMING.gather);
      if (cam) cam.gatherPush();
      this.emit(AUDIO_EVENTS.gather);
      this.hud.queueMessage(hero.attack.flavor);
    });
    at += POSE_TIMING.gather + POSE_TIMING.hold;

    // Release
    t.delayedCall(at, () => {
      if (poses) poses.setPose('release');
      if (fx) fx.beam(POSE_TIMING.release);
      if (cam) cam.releaseSnap();
      this.emit(AUDIO_EVENTS.release);
      this.fracture.open();
    });
    at += POSE_TIMING.release;

    // Impact + hit stop
    t.delayedCall(at, () => {
      const hit = this.pendingHit || { crit: false, damage: hero.attack.damage };
      enemy.hp = Math.max(0, enemy.hp - hit.damage);
      this.hud.updateEnemyHP(enemy.hp, enemy.maxHp);
      if (fx) {
        fx.hideTargetCursor();
        fx.impact();
        if (hit.crit) fx.critical();
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
        this.emit(AUDIO_EVENTS.victory);
        this.hud.queueMessage(`${enemy.name} shatters! The veil clears...`, () => {
          this.resetBattle();
        });
        return;
      }

      this.hud.setTurn(this.config.text.enemyTurn);
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
    if (this.scene.battleFx) this.scene.battleFx.hideTargetCursor();

    this.hud.queueMessage(`${enemy.name} uses ${enemy.attack.name}!`, () => {
      if (this.scene.battleCam) this.scene.battleCam.pushIn(1.5, 200, 'Back.Out');
      if (this.scene.enemyView) this.scene.enemyView.attack();
      this.fracture.open();
      this.emit(AUDIO_EVENTS.release);

      this.scene.time.delayedCall(180, () => {
        hero.hp = Math.max(0, hero.hp - hit.damage);
        this.hud.updateHP(hero.hp, hero.maxHp);
        if (this.scene.floatDamage) this.scene.floatDamage(hit.damage, 'hero', hit.crit);
        if (this.scene.battleCam) this.scene.battleCam.hitShake(hit.crit);
          if (this.scene.hitStop) this.scene.hitStop(hit.crit ? POSE_TIMING.hitStop * 2 : POSE_TIMING.hitStop);
        this.emit(AUDIO_EVENTS.impact);
        this.fracture.close();
        this.scene.time.delayedCall(260, () => {
          if (this.scene.battleCam) this.scene.battleCam.pullOut(320);
        });
      });
    }, this.speakerFor(enemy));

    const line = hit.crit
      ? `A critical strike! ${hero.name} suffers ${hit.damage} damage!`
      : `${hero.name} suffers ${hit.damage} damage!`;
    this.hud.queueMessage(line, () => {
      this.hud.setTurn(this.config.text.playerTurn);
      this.phase = 'player';
      this.running = false;
    });
  }

  resetBattle() {
    const hero = this.config.hero;
    if (this.scene.battleFx) this.scene.battleFx.hideTargetCursor();
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
    if (this.scene.battleCam) this.scene.battleCam.reset();
    this.phase = 'player';
    this.running = false;
  }
}
