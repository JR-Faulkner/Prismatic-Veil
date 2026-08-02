export default class BattleController {
  constructor(scene, timeline, fracture, hud, battleConfig) {
    this.scene = scene;
    this.timeline = timeline;
    this.fracture = fracture;
    this.hud = hud;
    this.config = battleConfig;
    this.running = false;
  }

  startPlayerTurn() {
    if (this.running) return;

    const hero = this.config.hero;
    const enemy = this.config.enemy;

    this.running = true;
    this.hud.setTurn(this.config.text.playerTurn);

    this.hud.queueMessage(`${hero.name} uses ${hero.attack.name}!`);
    this.hud.queueMessage(hero.attack.flavor, () => this.fracture.open());
    this.hud.queueMessage(
      `${enemy.name} is hit for ${hero.attack.damage} damage!`,
      () => {
        enemy.hp = Math.max(0, enemy.hp - hero.attack.damage);
        this.hud.updateEnemyHP(enemy.hp, enemy.maxHp);
        this.fracture.close();
        this.startEnemyTurn();
      }
    );
  }

  startEnemyTurn() {
    const hero = this.config.hero;
    const enemy = this.config.enemy;

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
        this.hud.setTurn(this.config.text.playerTurn);
        this.running = false;
      }
    );
  }
}
