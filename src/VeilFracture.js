export default class VeilFracture{
  constructor(scene){ this.scene=scene; }
  open(){ this.scene.cameras.main.flash(120,180,220,255); }
  close(){ this.scene.cameras.main.fadeIn(120); }
}
