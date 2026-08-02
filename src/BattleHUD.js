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
    // Floating battle dialog box — drawn placeholder until DAI supplies frame art
    this.msgBox=this.scene.add.graphics().setVisible(false);
    this.msgBox.fillStyle(0x1a1033,0.94).fillRoundedRect(90,496,620,80,12);
    this.msgBox.lineStyle(2,0xffd56a,0.92).strokeRoundedRect(90,496,620,80,12);
    this.msgBox.lineStyle(1,0x8564d9,0.5).strokeRoundedRect(94,500,612,72,10);
    this.messageText=this.scene.add.text(114,536,"",{fontSize:"24px",color:"#F8E7B0",wordWrap:{width:572}}).setOrigin(0,.5).setVisible(false);
    this.container.add([this.hpText,this.veilText,this.enemyText,this.turnText,this.msgBox,this.messageText]);
    this._queue=[];
    this._showing=false;
  }
  setTurn(text){ this.turnText.setText(text); }
  updateHP(cur,max){ this.hpText.setText(`PRISMEL  HP ${cur}/${max}`); }
  updateVeil(p){ this.veilText.setText(`VEIL ${p}%`); }
  _showBox(){
    if(this.msgBox.visible) return;
    this.msgBox.setVisible(true).setAlpha(0);
    this.messageText.setVisible(true).setAlpha(0);
    this.scene.tweens.add({targets:[this.msgBox,this.messageText],alpha:1,duration:140});
  }
  setMessage(text){
    this._showBox();
    this.messageText.setText(text);
  }
  clearMessage(){
    this.msgBox.setVisible(false);
    this.messageText.setVisible(false);
  }
  // Types each message out character by character, holds it, then plays
  // the next. onDone fires after the message finishes its hold.
  queueMessage(text,onDone){
    this._queue.push({text,onDone});
    if(!this._showing) this._nextMessage();
  }
  _nextMessage(){
    const item=this._queue.shift();
    if(!item){ this._showing=false; return; }
    this._showing=true;
    this._showBox();
    this.messageText.setText("");
    let i=0;
    this.scene.time.addEvent({
      delay:28,
      repeat:item.text.length-1,
      callback:()=>{
        i++;
        this.messageText.setText(item.text.slice(0,i));
        if(i>=item.text.length){
          this.scene.time.delayedCall(850,()=>{
            if(item.onDone) item.onDone();
            this._nextMessage();
          });
        }
      }
    });
  }
}
