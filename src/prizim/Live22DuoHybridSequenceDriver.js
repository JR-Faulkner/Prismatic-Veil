// LIVE22 Auryi renderer adapter.
// Extends the proven Duo-Hybrid driver without rewriting live21 internals.
import DuoHybridSequenceDriver from './DuoHybridSequenceDriver.js?v=duo-8';

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const lerp = (a, b, t) => a + (b - a) * t;

export default class Live22DuoHybridSequenceDriver extends DuoHybridSequenceDriver {
  async manifest(config) {
    const manifest = await super.manifest(config);
    const fx = manifest?.presentation?.actorRangedFx;
    if (!fx) return manifest;

    if (String(config?.id || '').startsWith('auryi_turn_entry')) {
      fx.startFrame = 1;
      fx.crownYOffsetFrac = 0.29;
    } else if (String(config?.id || '').startsWith('auryi_auorb_invocation')) {
      fx.startFrame = 0;
      fx.crownYOffsetFrac = 0.29;
    }
    return manifest;
  }

  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const { ctx, dpr, w, h } = layer;
    const fx = presentation?.actorRangedFx || {};
    const gold = fx.gold || 'rgba(255,216,112,0.95)';
    const lavender = fx.lavender || 'rgba(198,132,255,0.90)';
    const crownRadius = Number(fx.crownRadius || 34);
    const orbRadius = Number(fx.orbRadius || 18);
    const beamWidth = Number(fx.beamWidth || 11);
    const startFrame = Number(fx.startFrame ?? 0);
    const crownYOffsetFrac = Number(fx.crownYOffsetFrac ?? 0.29);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (frameIndex < startFrame) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const charge = clamp01(frameIndex / 8);
    const release = clamp01((frameIndex - 8) / 3);
    const recover = clamp01((frameIndex - 12) / 5);
    const crownY = actorY - h * crownYOffsetFrac;
    const handX = actorX + 34;
    const handY = actorY - 48;

    const crownAlpha = clamp01(0.22 + charge * 0.68 - recover * 0.55);
    ctx.strokeStyle = gold.replace(/0\.95\)/, `${crownAlpha})`);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(actorX, crownY, crownRadius * (1 + charge * 0.18), crownRadius * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = lavender.replace(/0\.90\)/, `${crownAlpha * 0.75})`);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(actorX, crownY, crownRadius * 1.18, crownRadius * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();

    let orbX = handX;
    let orbY = handY;
    if (frameIndex < 9) {
      const theta = -1.2 + frameIndex * 0.78;
      const orbitR = 36 + charge * 14;
      orbX = actorX + Math.cos(theta) * orbitR + 8;
      orbY = actorY - 76 + Math.sin(theta) * orbitR * 0.48;
    } else if (frameIndex <= 11) {
      const t = clamp01((frameIndex - 9) / 2);
      orbX = lerp(handX, targetX, t);
      orbY = lerp(handY, targetY - 28, t);
    } else {
      const t = clamp01((frameIndex - 12) / 3);
      orbX = lerp(targetX, handX, t);
      orbY = lerp(targetY - 28, handY, t);
    }

    const pulse = 1 + Math.sin(frameIndex * 1.7) * 0.12;
    const rg = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, orbRadius * 2.6 * pulse);
    rg.addColorStop(0, 'rgba(255,250,210,0.98)');
    rg.addColorStop(0.32, gold);
    rg.addColorStop(0.68, lavender);
    rg.addColorStop(1, 'rgba(198,132,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius * 2.6 * pulse, 0, Math.PI * 2);
    ctx.fill();

    if (frameIndex >= 9 && frameIndex <= 12) {
      const beamEndX = frameIndex < 11 ? orbX : targetX;
      const beamEndY = frameIndex < 11 ? orbY : targetY - 22;
      const grad = ctx.createLinearGradient(handX, handY, beamEndX, beamEndY);
      grad.addColorStop(0, 'rgba(255,216,112,0.12)');
      grad.addColorStop(0.35, 'rgba(255,222,128,0.86)');
      grad.addColorStop(0.75, 'rgba(198,132,255,0.88)');
      grad.addColorStop(1, 'rgba(255,245,190,0.95)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = beamWidth * (0.7 + release * 0.55);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(beamEndX, beamEndY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,235,0.88)';
      ctx.lineWidth = Math.max(2, beamWidth * 0.22);
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(beamEndX, beamEndY);
      ctx.stroke();
    }

    if (frameIndex === 11 || frameIndex === 12) {
      const impactR = frameIndex === 11 ? 54 : 34;
      ctx.strokeStyle = gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(targetX, targetY - 22, impactR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = lavender;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(targetX, targetY - 22, impactR * 1.32, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
