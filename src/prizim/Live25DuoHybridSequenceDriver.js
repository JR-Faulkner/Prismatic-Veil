// LIVE25 cinematic adapter.
// Keeps Auryi live24 FX continuity and adds crown alignment plus a safer Kineza Blitzer camera envelope.
import Live24DuoHybridSequenceDriver from './Live24DuoHybridSequenceDriver.js?v=live24';

const CROWN_X_FRAC = 0.09;
const CROWN_WIDTH_MUL = 1.15;

export default class Live25DuoHybridSequenceDriver extends Live24DuoHybridSequenceDriver {
  async manifest(config) {
    const manifest = await super.manifest(config);
    if (String(config?.id || '').startsWith('kineza_blitzer')) {
      const camera = manifest?.presentation?.camera;
      if (camera?.track) {
        camera.track.forEach(point => {
          point.zoom = Math.min(Number(point.zoom || 1), 1.28);
          point.targetMix = Math.min(Number(point.targetMix || 0), 0.45);
        });
      }
    }
    return manifest;
  }

  _screenGeometry(actorX, actorY) {
    const geom = super._screenGeometry(actorX, actorY);
    const sprite = this._live24Actor?.sprite;
    const zoom = Number(this.scene.cameras?.main?.zoom || 1);
    const bodyW = Math.max(1, Number(sprite?.displayWidth || 1)) * zoom;
    return {
      ...geom,
      crownX: actorX + bodyW * CROWN_X_FRAC
    };
  }

  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const ctx = layer?.ctx;
    if (!ctx) return super.drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation);

    // Delegate all existing live24 choreography, but temporarily shift the
    // canvas origin for Auryi's crown only by using a lightweight geometry flag.
    const original = this._screenGeometry.bind(this);
    this._screenGeometry = (x, y) => {
      const g = original(x, y);
      g.crownY = g.crownY;
      return g;
    };

    const originalEllipse = ctx.ellipse.bind(ctx);
    let crownEllipseCount = 0;
    ctx.ellipse = (x, y, rx, ry, rotation, start, end, anticlockwise) => {
      if (crownEllipseCount < 2) {
        const sprite = this._live24Actor?.sprite;
        const zoom = Number(this.scene.cameras?.main?.zoom || 1);
        const bodyW = Math.max(1, Number(sprite?.displayWidth || 1)) * zoom;
        x += bodyW * CROWN_X_FRAC;
        rx *= CROWN_WIDTH_MUL;
        crownEllipseCount += 1;
      }
      return originalEllipse(x, y, rx, ry, rotation, start, end, anticlockwise);
    };

    try {
      return super.drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation);
    } finally {
      ctx.ellipse = originalEllipse;
      this._screenGeometry = original;
    }
  }
}
