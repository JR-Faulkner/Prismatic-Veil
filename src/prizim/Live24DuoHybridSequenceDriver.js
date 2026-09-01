// LIVE24 Auryi cinematic FX correction.
// Keeps live23 state/camera/targeting and fixes only screen-space FX geometry,
// size continuity, and entry/attack choreography.
import Live23DuoHybridSequenceDriver from './Live23DuoHybridSequenceDriver.js?v=live23';

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const lerp = (a, b, t) => a + (b - a) * t;

export default class Live24DuoHybridSequenceDriver extends Live23DuoHybridSequenceDriver {
  async playActorRangedSequence(args) {
    const id = String(args?.manifest?.id || '');
    this._live24Actor = args?.actor || null;
    this._live24Mode = id.startsWith('auryi_turn_entry')
      ? 'entry'
      : (id.startsWith('auryi_auorb_invocation') ? 'attack' : 'other');
    try {
      return await super.playActorRangedSequence(args);
    } finally {
      this._live24Actor = null;
      this._live24Mode = null;
    }
  }

  _screenGeometry(actorX, actorY) {
    const sprite = this._live24Actor?.sprite;
    const zoom = Number(this.scene.cameras?.main?.zoom || 1);
    const bodyW = Math.max(1, Number(sprite?.displayWidth || 1)) * zoom;
    const bodyH = Math.max(1, Number(sprite?.displayHeight || 1)) * zoom;
    const h = this.scene.scale.height;

    // Match the persistent Phaser graphics at 1.0 scale, then allow only
    // controlled cinematic growth from that exact apparent size.
    const idleOrbOuter = Math.max(8, h * 0.025) * 0.62 * 2.15 * zoom;
    const idleCrownR = Math.max(20, h * 0.056) * 0.68 * zoom;

    return {
      handX: actorX + bodyW * 0.41,
      handY: actorY - bodyH * 0.80,
      crownY: actorY - bodyH * 1.08,
      idleOrbOuter,
      idleCrownR,
      zoom
    };
  }

  _entryOrb(frameIndex, geom) {
    const { handX, handY, idleOrbOuter } = geom;
    if (frameIndex < 2) return null;
    const scales = [0, 0, 0.32, 0.58, 0.82, 1.00];
    const scale = scales[frameIndex] ?? 1;
    if (frameIndex === 5) return { x: handX, y: handY, scale };

    // Condense locally at the hand. No orbit around Auryi's face/head.
    const drift = idleOrbOuter * 0.34;
    const phase = frameIndex - 2;
    return {
      x: handX + Math.cos(phase * 1.45) * drift * 0.55,
      y: handY + Math.sin(phase * 1.45) * drift * 0.32,
      scale
    };
  }

  _attackOrb(frameIndex, geom, targetX, targetY) {
    const { handX, handY, idleOrbOuter } = geom;

    if (frameIndex === 0) return { x: handX, y: handY, scale: 1.00 };

    if (frameIndex <= 8) {
      const t = clamp01(frameIndex / 8);
      const orbitR = idleOrbOuter * lerp(0.18, 0.92, t);
      const theta = -0.85 + frameIndex * 0.92;
      return {
        x: handX + Math.cos(theta) * orbitR,
        y: handY + Math.sin(theta) * orbitR * 0.42,
        scale: lerp(1.00, 1.46, t)
      };
    }

    if (frameIndex <= 11) {
      const t = clamp01((frameIndex - 9) / 2);
      return {
        x: lerp(handX, targetX, t),
        y: lerp(handY, targetY, t),
        scale: lerp(1.42, 1.72, t)
      };
    }

    if (frameIndex <= 15) {
      const t = clamp01((frameIndex - 12) / 3);
      return {
        x: lerp(targetX, handX, t),
        y: lerp(targetY, handY, t),
        scale: lerp(1.42, 1.06, t)
      };
    }

    // Last two frames exactly match the persistent idle anchor/size.
    return { x: handX, y: handY, scale: 1.00 };
  }

  _crownScale(frameIndex, mode) {
    if (mode === 'entry') {
      const scales = [0, 0.82, 1.00, 1.10, 1.04, 1.00];
      return scales[frameIndex] ?? 1;
    }
    if (frameIndex <= 8) return lerp(1.00, 1.16, clamp01(frameIndex / 8));
    if (frameIndex <= 12) return lerp(1.16, 1.20, clamp01((frameIndex - 8) / 4));
    return lerp(1.18, 1.00, clamp01((frameIndex - 12) / 5));
  }

  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const { ctx, dpr, w, h } = layer;
    const fx = presentation?.actorRangedFx || {};
    const startFrame = Number(fx.startFrame ?? 0);
    const mode = this._live24Mode || 'attack';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (frameIndex < startFrame) return;

    const geom = this._screenGeometry(actorX, actorY);
    const crownScale = this._crownScale(frameIndex, mode);
    const crownR = geom.idleCrownR * crownScale;
    const peakT = mode === 'entry'
      ? clamp01((frameIndex - 1) / 3)
      : clamp01(Math.min(frameIndex, 11) / 11);
    const recoverT = mode === 'attack' ? clamp01((frameIndex - 12) / 5) : 0;
    const crownAlpha = mode === 'entry'
      ? lerp(0.30, 0.54, peakT)
      : lerp(0.40, 0.68, peakT) * lerp(1, 0.62, recoverT);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Crown keeps a hard body-relative air gap above the hair. Only its size
    // and brightness flare; its anchor never descends toward the head.
    ctx.strokeStyle = `rgba(255,216,112,${clamp01(crownAlpha)})`;
    ctx.lineWidth = Math.max(1.5, h * 0.0042) * geom.zoom;
    ctx.beginPath();
    ctx.ellipse(actorX, geom.crownY, crownR * 1.03, crownR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(198,132,255,${clamp01(crownAlpha * 0.62)})`;
    ctx.lineWidth = Math.max(1.0, h * 0.0028) * geom.zoom;
    ctx.beginPath();
    ctx.ellipse(actorX, geom.crownY, crownR * 1.17, crownR * 0.47, 0, 0, Math.PI * 2);
    ctx.stroke();

    const orb = mode === 'entry'
      ? this._entryOrb(frameIndex, geom)
      : this._attackOrb(frameIndex, geom, targetX, targetY);

    if (orb) {
      const outerR = geom.idleOrbOuter * orb.scale;
      const rg = ctx.createRadialGradient(orb.x, orb.y, 1, orb.x, orb.y, outerR);
      rg.addColorStop(0, 'rgba(255,252,222,0.98)');
      rg.addColorStop(0.24, 'rgba(255,224,128,0.92)');
      rg.addColorStop(0.60, 'rgba(198,132,255,0.58)');
      rg.addColorStop(1, 'rgba(198,132,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, outerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,230,154,0.82)';
      ctx.lineWidth = Math.max(1.2, outerR * 0.10);
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, outerR * 0.52, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (mode === 'attack' && frameIndex >= 9 && frameIndex <= 12) {
      const orbNow = this._attackOrb(frameIndex, geom, targetX, targetY);
      const beamEndX = frameIndex < 11 ? orbNow.x : targetX;
      const beamEndY = frameIndex < 11 ? orbNow.y : targetY;
      const beamFade = frameIndex === 12 ? 0.38 : 1;
      const beamWidth = Math.max(3, geom.idleOrbOuter * 0.46) * beamFade;
      const grad = ctx.createLinearGradient(geom.handX, geom.handY, beamEndX, beamEndY);
      grad.addColorStop(0, 'rgba(255,216,112,0.10)');
      grad.addColorStop(0.35, 'rgba(255,222,128,0.72)');
      grad.addColorStop(0.75, 'rgba(198,132,255,0.78)');
      grad.addColorStop(1, 'rgba(255,245,190,0.92)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = beamWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(geom.handX, geom.handY);
      ctx.lineTo(beamEndX, beamEndY);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255,255,235,${0.78 * beamFade})`;
      ctx.lineWidth = Math.max(1.5, beamWidth * 0.28);
      ctx.beginPath();
      ctx.moveTo(geom.handX, geom.handY);
      ctx.lineTo(beamEndX, beamEndY);
      ctx.stroke();
    }

    if (mode === 'attack' && (frameIndex === 11 || frameIndex === 12)) {
      const base = geom.idleOrbOuter;
      const ringScale = frameIndex === 11 ? 2.30 : 1.65;
      const alpha = frameIndex === 11 ? 0.88 : 0.48;
      ctx.strokeStyle = `rgba(255,216,112,${alpha})`;
      ctx.lineWidth = Math.max(2, base * 0.20);
      ctx.beginPath();
      ctx.arc(targetX, targetY, base * ringScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(198,132,255,${alpha * 0.72})`;
      ctx.lineWidth = Math.max(1.5, base * 0.12);
      ctx.beginPath();
      ctx.arc(targetX, targetY, base * ringScale * 1.34, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
