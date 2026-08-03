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
    const enemy = this.config.enemy;
    const poses = this.scene.heroPoses;

    this.running = true;
    this.hud.setTurn(this.config.text.playerTurn);

    // Pose library v1 canonical sequence:
    // Idle → Step → Gather → Release → Recover → Idle
    if (poses) poses.setPose('step');
    this.hud.queueMessage(`${hero.name} uses ${hero.attack.name}!`, () => {
      if (poses) poses.setPose('gather');
    });
    this.hud.queueMessage(hero.attack.flavor, () => {
      if (poses) poses.setPose('release');
      this.fracture.open();
    });
    this.hud.queueMessage(
      `${enemy.name} is hit for ${hero.attack.damage} damage!`,
      () => {
        enemy.hp = Math.max(0, enemy.hp - hero.attack.damage);
        this.hud.updateEnemyHP(enemy.hp, enemy.maxHp);
        if (this.scene.floatDamage) this.scene.floatDamage(hero.attack.damage, 'enemy');
        this.fracture.close();
        if (poses) {
          poses.setPose('recover');
          this.scene.time.delayedCall(420, () => poses.setPose('idle'));
        }

        if (enemy.hp <= 0) {
          this.hud.queueMessage(`${enemy.name} shatters! The veil clears...`, () => {
            this.resetBattle();
          });
          return;
        }

        this.hud.setTurn(this.config.text.enemyTurn);
        this.phase = 'enemy';
        this.running = false;
      }
    );
  }

  runEnemyRound() {
    const hero = this.config.hero;
    const enemy = this.config.enemy;

    this.running = true;
    this.hud.setTurn(this.config.text.enemyTurn);

    this.hud.queueMessage(`${enemy.name} uses ${enemy.attack.name}!`, () => {
      this.fracture.open();
    });

    this.hud.queueMessage(
      `${hero.name} suffers ${enemy.attack.damage} damage!`,
      () => {
        this.fracture.close();
        hero.hp = Math.max(0, hero.hp - enemy.attack.damage);
        this.hud.updateHP(hero.hp, hero.maxHp);
        if (this.scene.floatDamage) this.scene.floatDamage(enemy.attack.damage, 'hero');
        this.hud.setTurn(this.config.text.playerTurn);
        this.phase = 'player';
        this.running = false;
      }
    );
  }

  resetBattle() {
    const hero = this.config.hero;
    const enemy = this.config.enemy;
    hero.hp = hero.maxHp;
    hero.veil = 100;
    enemy.hp = enemy.maxHp;
    this.hud.refreshFromConfig();
    this.hud.setTurn(this.config.text.playerTurn);
    this.phase = 'player';
    this.running = false;
  }
}
