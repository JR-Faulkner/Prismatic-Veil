export default class BattleController{
  constructor(scene,timeline,fracture,hud){
    this.scene=scene;
    this.timeline=timeline;
    this.fracture=fracture;
    this.hud=hud;
    this.running=false;
  }
  startPlayerTurn(){
    if(this.running) return;
    this.running=true;
    this.hud.setTurn('PLAYER TURN');
    this.hud.queueMessage('Prismel uses Prismatic Release!');
    this.timeline.play([
      ()=>this.fracture.open(),
      ()=>this.hud.queueMessage('Veil Wraith takes 14 damage!'),
      ()=>this.fracture.close(),
      ()=>this.hud.setTurn('ENEMY TURN')
    ],()=>{ this.running=false; });
  }
}
