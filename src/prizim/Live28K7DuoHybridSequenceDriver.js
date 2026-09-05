// LIVE28K7 surgical Auryi attack-FX adapter.
// The approved PNG crown owns crown presentation. Keep the proven Phaser Auorb,
// projectile, beam, impact, and recompose choreography, but suppress the two
// legacy procedural crown/halo ellipses during Auryi's basic ranged attack.
import Live26DuoHybridSequenceDriver from './Live26DuoHybridSequenceDriver.js?v=live28k7-halo-base';

export default class Live28K7DuoHybridSequenceDriver extends Live26DuoHybridSequenceDriver {
  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const mode = presentation?.actorRangedFx?.live26Mode;
    const inheritedPhaserAttack = this._live24Mode === 'attack'
      && (!mode || this._isPhaserFallback());

    if (!inheritedPhaserAttack) {
      return super.drawActorRangedFx(
        layer, frameIndex, actorX, actorY, targetX, targetY, presentation
      );
    }

    const ctx = layer?.ctx;
    if (!ctx?.ellipse) {
      return super.drawActorRangedFx(
        layer, frameIndex, actorX, actorY, targetX, targetY, presentation
      );
    }

    const originalEllipse = ctx.ellipse;
    let inheritedEllipseCount = 0;

    // LIVE24/LIVE25 draw the procedural crown with the first two ellipses.
    // Swallow only those two calls. All Auorb/beam/impact drawing continues.
    ctx.ellipse = (...args) => {
      inheritedEllipseCount += 1;
      if (inheritedEllipseCount <= 2) return;
      return originalEllipse.call(ctx, ...args);
    };

    try {
      return super.drawActorRangedFx(
        layer, frameIndex, actorX, actorY, targetX, targetY, presentation
      );
    } finally {
      ctx.ellipse = originalEllipse;
    }
  }
}
