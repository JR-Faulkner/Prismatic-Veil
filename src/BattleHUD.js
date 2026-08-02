export default class BattleHUD {
  constructor(scene){
    this.scene=scene;
  }
  create(){
    this.container=this.scene.add.container(0,0);
    this.hpText=this.scene.add.text(24,20,"PRISMEL  HP 100/100",{fontSize:"20px",color:"#F8E7B0"});
    this.veilText=this.scene.add.text(24,48,"VEIL 100%",{fontSize:"16px",color:"#8EDCFF"});
    this.enemyText=this.scene.add.text(760,20,"VEIL WRAITH",{fontSize:"20px",color:"#F4B5C2"}).setOrigin(1,0);
    this.turnText=this.scene.add.text(400,20,"PLAYER TURN",{fontSize:"18px",color:"#FFE68A"}).setOrigin(.5,0);
    this.messageText=this.scene.add.text(400,560,"",{fontSize:"18px",color:"#F8E7B0",backgroundColor:"#1a1033",padding:{x:14,y:6}}).setOrigin(.5,1).setVisible(false);
    this.container.add([this.hpText,this.veilText,this.enemyText,this.turnText,this.messageText]);
    this._queue=[];
    this._showing=false;
  }
  setTurn(text){ this.turnText.setText(text); }
  updateHP(cur,max){ this.hpText.setText(`PRISMEL  HP ${cur}/${max}`); }
  updateVeil(p){ this.veilText.setText(`VEIL ${p}%`); }
  setMessage(text){
    this.messageText.setText(text).setVisible(true);
  }
  clearMessage(){ this.messageText.setVisible(false); }
  queueMessage(text){
    this._queue.push(text);
    if(!this._showing) this._nextMessage();
  }
  _nextMessage(){
    if(!this._queue.length){ this._showing=false; return; }
    this._showing=true;
    this.setMessage(this._queue.shift());
    this.scene.time.delayedCall(900,()=>this._nextMessage());
  }
}
