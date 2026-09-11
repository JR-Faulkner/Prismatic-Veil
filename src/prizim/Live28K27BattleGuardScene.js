// K27 runtime stabilization layer.
// Preserves the locked LIVE28K27 battle scene and adds only render-integrity guards
// for browser/GPU transitions observed on Xbox Edge.
import Live28K2PartyBattleScene from './Live28K2PartyBattleScene.js?v=live28k27';

export default class Live28K27BattleGuardScene extends Live28K2PartyBattleScene {
  create() {
    super.create();
    this._pvGuardedFlashes = new Set();

    const guard = () => {
      // Never allow the battlefield container/camera to remain accidentally hidden
      // after a media/camera transition. This does not alter battle state or timing.
      if (this.world?.active !== false) {
        if (this.world.visible === false) this.world.setVisible(true);
        if (this.world.alpha === 0) this.world.setAlpha(1);
      }
      const cam = this.cameras?.main;
      if (cam) {
        if (cam.visible === false) cam.setVisible(true);
        if (cam.alpha === 0) cam.setAlpha(1);
      }

      // Aurora's legitimate white impact flash is ~170 ms. If a browser stalls a
      // tween and leaves that flash over the battlefield, clear only the stale flash.
      for (const flash of [...this._pvGuardedFlashes]) {
        if (!flash?.active) {
          this._pvGuardedFlashes.delete(flash);
          continue;
        }
        if ((flash.alpha || 0) > 0.35) {
          if (!flash.__pvHighSince) flash.__pvHighSince = this.time.now;
          if (this.time.now - flash.__pvHighSince > 420) {
            flash.setAlpha(0);
            flash.__pvHighSince = 0;
          }
        } else {
          flash.__pvHighSince = 0;
        }
      }
    };

    this.events.on('postupdate', guard);
    this.events.once('shutdown', () => {
      this.events.off('postupdate', guard);
      this._pvGuardedFlashes?.clear?.();
    });
    globalThis.__PV_LIVE28K27_RENDER_GUARD__ = true;
  }

  _createAuroraMockStage(actor) {
    const stage = super._createAuroraMockStage(actor);
    if (stage?.flash) this._pvGuardedFlashes?.add(stage.flash);
    return stage;
  }

  _destroyAuroraMockStage(stage) {
    if (stage?.flash) this._pvGuardedFlashes?.delete(stage.flash);
    return super._destroyAuroraMockStage(stage);
  }
}
