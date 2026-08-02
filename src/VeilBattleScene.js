import BattleHUD from './BattleHUD.js';
import BattleController from './BattleController.js';
import Timeline from './Timeline.js';
import VeilFracture from './VeilFracture.js';

export default class VeilBattleScene extends Phaser.Scene{
  constructor(){ super('VeilBattleScene'); }
  create(){
    this.cameras.main.setBackgroundColor('#070611');
    this.add.text(400,120,'VEIL FRACTURE',{fontSize:'40px',color:'#FFE8A0'}).setOrigin(.5);
    this.add.text(400,180,'Battle Presentation v2 - Package 02',
      {fontSize:'20px',color:'#D6C8F2'}).setOrigin(.5);
    this.add.text(400,220,'Tap to replay the turn sequence',
      {fontSize:'14px',color:'#8a7ab0'}).setOrigin(.5);

    this.hud=new BattleHUD(this); this.hud.create();
    this.timeline=new Timeline(this);
    this.fracture=new VeilFracture(this);
    this.controller=new BattleController(this,this.timeline,this.fracture,this.hud);

    this.controller.startPlayerTurn();
    this.input.on('pointerdown',()=>this.controller.startPlayerTurn());
  }
}
