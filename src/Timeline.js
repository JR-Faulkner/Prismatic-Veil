export default class Timeline {
  constructor(scene) {
    this.scene = scene;
  }

  play(steps, onComplete) {
    let index = 0;

    const next = () => {
      if (index >= steps.length) {
        if (onComplete) onComplete();
        return;
      }

      steps[index]();
      index += 1;
      this.scene.time.delayedCall(450, next);
    };

    next();
  }
}
