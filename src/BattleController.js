export default class BattleController{
  constructor(scene,timeline,fracture,hud){
    this.scene=scene;
    this.timeline=timeline;
    this.fracture=fracture;
    this.hud=hud;
    this.running=false;
  }
  // Battle text format:
  //   player attack:  "<name> uses <attack>!" ... "<target> is hit for <dmg> damage!"
  //   enemy attack:   "<name> uses <attack>!" ... "<target> suffers <dmg> damage!"
  startPlayerTurn(){
    if(this.running) return;
    this.running=true;
    this.hud.updateHP(100,100);
    this.hud.setTurn('PLAYER TURN');
    this.hud.queueMessage('Prismel uses Prismatic Release!',()=>this.fracture.open());
    this.hud.queueMessage('Veil Wraith is hit for 14 damage!',()=>{
      this.fracture.close();
      this.startEnemyTurn();
    });
  }
  startEnemyTurn(){
    this.hud.setTurn('ENEMY TURN');
    this.hud.queueMessage('Veil Wraith uses Veil Lash!',()=>this.fracture.open());
    this.hud.queueMessage('Prismel suffers 9 damage!',()=>{
      this.fracture.close();
      this.hud.updateHP(91,100);
      this.hud.setTurn('PLAYER TURN');
      this.running=false;
    });
  }
}
