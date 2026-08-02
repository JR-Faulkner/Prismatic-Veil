import BattleHUD from './BattleHUD.js';

export default class BattleScene extends Phaser.Scene{
  constructor(){ super('BattleScene'); }
  create(){
    this.cameras.main.setBackgroundColor('#070611');
    this.add.text(400,120,'VEIL FRACTURE',{fontSize:'40px',color:'#FFE8A0'}).setOrigin(.5);
    this.add.text(400,180,'Battle Presentation v2 - Package 01',
      {fontSize:'20px',color:'#D6C8F2'}).setOrigin(.5);
    this.hud=new BattleHUD(this);
    this.hud.create();

    this.input.once('pointerdown',()=>{
      this.tweens.add({
        targets:this.cameras.main,
        zoom:1.2,
        duration:350,
        yoyo:true
      });
      this.hud.setTurn('PRISMATIC RELEASE');
    });
  }
}
