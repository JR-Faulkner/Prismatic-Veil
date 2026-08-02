export default class Timeline{
  constructor(scene){ this.scene=scene; }
  play(steps,onComplete){
    let i=0;
    const next=()=>{
      if(i>=steps.length){ if(onComplete) onComplete(); return; }
      steps[i++]();
      this.scene.time.delayedCall(450,next);
    };
    next();
  }
}
