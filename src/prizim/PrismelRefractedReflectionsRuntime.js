// Prismel Refracted-Reflections runtime handoff.
// Presentation authority: exact cinematic video -> captured final frame ->
// deterministic mirror crack/shatter -> live Hybrid battlefield damage.
// This module does not own battle state; it receives the live K adapter scene.

export const PRISMEL_RR_VIDEO_PATH = './assets/characters/prismel/animations/refracted_reflections/cinematic/Prismel_RefractedReflections_Resonart_MASTER.mp4?pvasset=live28k26-prismel-rr';

export const PRISMEL_RR_TIMELINE = Object.freeze({
  takeover: 9.35,
  impactX: 0.62,
  impactY: 0.55,
  contactHoldMs: 95,
  crackMs: 190,
  fractureHoldMs: 65,
  shatterMs: 520,
  battlefieldRevealProgress: 0.34
});

const PRISMEL_RR_HIT_CHANCE = 0.92;
const SHARD_SECTORS = 8; // 16 total shards: 8 center + 8 outer.
const SHATTER_Z = '2147483100';

function waitFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function easeOutCubic(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
function easeInCubic(t) { return Math.pow(clamp01(t), 3); }

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function fitContain(containerW, containerH, mediaW, mediaH) {
  const scale = Math.min(containerW / mediaW, containerH / mediaH);
  const width = mediaW * scale;
  const height = mediaH * scale;
  return {
    x: (containerW - width) * 0.5,
    y: (containerH - height) * 0.5,
    width,
    height
  };
}

function makeOverlayCanvas(cssW, cssH, dpr) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: `${cssW}px`,
    height: `${cssH}px`,
    zIndex: SHATTER_Z,
    pointerEvents: 'none',
    background: 'transparent'
  });
  return canvas;
}

export function capturePrismelVideoFrame(video) {
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  // Cap retina work. The source itself is 910x512, so 1.5x is already
  // enough for the current phone presentation without turning the shatter
  // into a fill-rate stress test.
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const source = document.createElement('canvas');
  source.width = Math.max(1, Math.round(cssW * dpr));
  source.height = Math.max(1, Math.round(cssH * dpr));
  const ctx = source.getContext('2d', { alpha: false });
  const vw = video.videoWidth || 910;
  const vh = video.videoHeight || 512;
  const fit = fitContain(cssW, cssH, vw, vh);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#020108';
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.drawImage(video, fit.x, fit.y, fit.width, fit.height);

  const impact = {
    x: fit.x + fit.width * PRISMEL_RR_TIMELINE.impactX,
    y: fit.y + fit.height * PRISMEL_RR_TIMELINE.impactY
  };
  return { source, cssW, cssH, dpr, fit, impact };
}

function rayToRect(cx, cy, theta, w, h) {
  const dx = Math.cos(theta);
  const dy = Math.sin(theta);
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (w - cx) / dx);
  if (dx < 0) t = Math.min(t, (0 - cx) / dx);
  if (dy > 0) t = Math.min(t, (h - cy) / dy);
  if (dy < 0) t = Math.min(t, (0 - cy) / dy);
  if (!Number.isFinite(t)) t = 0;
  return { x: cx + dx * t, y: cy + dy * t };
}

function polygonCentroid(points) {
  let x = 0, y = 0;
  points.forEach(p => { x += p.x; y += p.y; });
  return { x: x / points.length, y: y / points.length };
}

function makeShardImage(source, points, dpr) {
  const pad = 3;
  const minX = Math.floor(Math.min(...points.map(p => p.x)) - pad);
  const minY = Math.floor(Math.min(...points.map(p => p.y)) - pad);
  const maxX = Math.ceil(Math.max(...points.map(p => p.x)) + pad);
  const maxY = Math.ceil(Math.max(...points.map(p => p.y)) + pad);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = p.x - minX;
    const y = p.y - minY;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(source, -minX, -minY, source.width / dpr, source.height / dpr);
  return { canvas, minX, minY, w, h };
}

function buildShards(frame) {
  const { cssW: w, cssH: h, dpr, impact, source } = frame;
  const rand = seeded(0x50565252); // "PVRR" deterministic seed.
  const base = Array.from({ length: SHARD_SECTORS }, (_, i) => {
    const jitter = (rand() - 0.5) * 0.14;
    return (Math.PI * 2 * i / SHARD_SECTORS) + jitter;
  }).sort((a, b) => a - b);

  const radiusBase = Math.max(30, Math.min(w, h) * 0.12);
  const inner = base.map((a, i) => {
    const r = radiusBase * (0.74 + rand() * 0.52);
    return { x: impact.x + Math.cos(a) * r, y: impact.y + Math.sin(a) * r, a, i };
  });
  const outer = base.map(a => rayToRect(impact.x, impact.y, a, w, h));

  const shards = [];
  for (let i = 0; i < SHARD_SECTORS; i++) {
    const next = (i + 1) % SHARD_SECTORS;
    const centerPoly = [impact, inner[i], inner[next]];
    const outerPoly = [inner[i], outer[i], outer[next], inner[next]];
    [centerPoly, outerPoly].forEach((points, tier) => {
      const centroid = polygonCentroid(points);
      let vx = centroid.x - impact.x;
      let vy = centroid.y - impact.y;
      const len = Math.max(1, Math.hypot(vx, vy));
      vx /= len; vy /= len;
      const speed = (tier === 0 ? 115 : 190) + rand() * (tier === 0 ? 120 : 210);
      const image = makeShardImage(source, points, dpr);
      shards.push({
        ...image,
        points,
        centroid,
        vx: vx * speed,
        vy: vy * speed,
        rot: (rand() - 0.5) * (tier === 0 ? 1.15 : 1.75),
        scaleGain: tier === 0 ? 0.12 + rand() * 0.10 : 0.04 + rand() * 0.08,
        delay: rand() * (tier === 0 ? 45 : 85)
      });
    });
  }
  return shards;
}

function buildCracks(frame) {
  const { cssW: w, cssH: h, impact } = frame;
  const rand = seeded(0x43524143); // "CRAC"
  const count = 11;
  const cracks = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.PI * 2 * i / count + (rand() - 0.5) * 0.22;
    const end = rayToRect(impact.x, impact.y, theta, w, h);
    const dx = end.x - impact.x;
    const dy = end.y - impact.y;
    const bend = (rand() - 0.5) * Math.min(w, h) * 0.065;
    const perpX = -dy / Math.max(1, Math.hypot(dx, dy));
    const perpY = dx / Math.max(1, Math.hypot(dx, dy));
    const p1 = {
      x: impact.x + dx * (0.22 + rand() * 0.08) + perpX * bend,
      y: impact.y + dy * (0.22 + rand() * 0.08) + perpY * bend
    };
    const p2 = {
      x: impact.x + dx * (0.52 + rand() * 0.10) - perpX * bend * 0.55,
      y: impact.y + dy * (0.52 + rand() * 0.10) - perpY * bend * 0.55
    };
    cracks.push([impact, p1, p2, end]);
  }
  return cracks;
}

function pointOnPolyline(points, t) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len, start: total });
    total += len;
  }
  const target = total * clamp01(t);
  const out = [points[0]];
  for (const seg of segs) {
    if (target >= seg.start + seg.len) {
      out.push(seg.b);
      continue;
    }
    if (target > seg.start) {
      const local = (target - seg.start) / Math.max(1, seg.len);
      out.push({ x: seg.a.x + (seg.b.x - seg.a.x) * local, y: seg.a.y + (seg.b.y - seg.a.y) * local });
    }
    break;
  }
  return out;
}

function drawCrackPhase(ctx, frame, cracks, p) {
  const { source, dpr, impact, cssW, cssH } = frame;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.drawImage(source, 0, 0, source.width / dpr, source.height / dpr);

  const flashP = 1 - clamp01(p * 2.4);
  if (flashP > 0) {
    const r = Math.max(18, Math.min(cssW, cssH) * (0.04 + p * 0.06));
    const grad = ctx.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, r);
    grad.addColorStop(0, `rgba(255,255,255,${0.92 * flashP})`);
    grad.addColorStop(0.35, `rgba(214,190,255,${0.62 * flashP})`);
    grad.addColorStop(1, 'rgba(103,200,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(impact.x, impact.y, r, 0, Math.PI * 2); ctx.fill();
  }

  const reveal = easeOutCubic(p);
  cracks.forEach((crack, index) => {
    const local = clamp01(reveal * 1.16 - index * 0.018);
    const pts = pointOnPolyline(crack, local);
    if (pts.length < 2) return;
    const stroke = (width, color, alpha) => {
      ctx.beginPath();
      pts.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'round';
      ctx.lineWidth = width;
      ctx.strokeStyle = color.replace('A', String(alpha));
      ctx.stroke();
    };
    stroke(5.4, 'rgba(126,92,255,A)', 0.42);
    stroke(3.0, 'rgba(103,214,255,A)', 0.70);
    stroke(1.35, 'rgba(255,255,255,A)', 0.98);
  });
  ctx.restore();
}

function drawShatterPhase(ctx, frame, shards, p) {
  const { dpr, cssW, cssH } = frame;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const elapsedMs = p * PRISMEL_RR_TIMELINE.shatterMs;
  shards.forEach(shard => {
    const local = clamp01((elapsedMs - shard.delay) / Math.max(1, PRISMEL_RR_TIMELINE.shatterMs - shard.delay));
    const e = easeOutCubic(local);
    const fade = 1 - easeInCubic(Math.max(0, (local - 0.36) / 0.64));
    const dx = shard.vx * (PRISMEL_RR_TIMELINE.shatterMs / 1000) * e;
    const dy = shard.vy * (PRISMEL_RR_TIMELINE.shatterMs / 1000) * e;
    const cx = shard.minX + shard.w * 0.5;
    const cy = shard.minY + shard.h * 0.5;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(shard.rot * e);
    const scale = 1 + shard.scaleGain * e;
    ctx.scale(scale, scale);
    ctx.drawImage(shard.canvas, -shard.w * 0.5, -shard.h * 0.5, shard.w, shard.h);
    ctx.restore();
  });
  ctx.restore();
}

export async function runPrismelScreenBreak(frame, onBattlefieldReveal) {
  const overlay = makeOverlayCanvas(frame.cssW, frame.cssH, frame.dpr);
  document.body.appendChild(overlay);
  const ctx = overlay.getContext('2d');
  const cracks = buildCracks(frame);
  const shards = buildShards(frame);
  let revealed = false;

  const animate = (duration, draw) => new Promise(resolve => {
    const start = performance.now();
    const tick = now => {
      const p = clamp01((now - start) / Math.max(1, duration));
      draw(p);
      if (p >= 1) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  try {
    await animate(PRISMEL_RR_TIMELINE.crackMs, p => drawCrackPhase(ctx, frame, cracks, p));
    if (PRISMEL_RR_TIMELINE.fractureHoldMs > 0) {
      drawCrackPhase(ctx, frame, cracks, 1);
      await new Promise(resolve => setTimeout(resolve, PRISMEL_RR_TIMELINE.fractureHoldMs));
    }
    await animate(PRISMEL_RR_TIMELINE.shatterMs, p => {
      drawShatterPhase(ctx, frame, shards, p);
      if (!revealed && p >= PRISMEL_RR_TIMELINE.battlefieldRevealProgress) {
        revealed = true;
        onBattlefieldReveal?.();
      }
    });
    if (!revealed) onBattlefieldReveal?.();
  } finally {
    overlay.remove();
  }
}

export function preparePrismelRefractedVideo(scene) {
  if (typeof document === 'undefined') return null;
  if (scene._prismelRefractedVideo) return scene._prismelRefractedVideo;
  const video = document.createElement('video');
  video.src = new URL(PRISMEL_RR_VIDEO_PATH, window.location.href).href;
  video.preload = 'auto';
  video.muted = false;
  video.defaultMuted = false;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.controls = false;
  video.loop = false;
  video.volume = 0;
  Object.assign(video.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    objectFit: 'contain', background: '#020108', zIndex: '2147483000',
    pointerEvents: 'none', opacity: '0', display: 'none',
    transform: 'scale(1.018)', transformOrigin: '50% 50%',
    filter: 'brightness(0.98) contrast(1.04) saturate(1.05)',
    willChange: 'opacity, transform, filter',
    transition: 'opacity 130ms ease, transform 650ms cubic-bezier(0.22,1,0.36,1), filter 220ms ease'
  });
  document.body.appendChild(video);
  video.load();
  scene._prismelRefractedVideo = video;
  return video;
}

export function disposePrismelRefractedVideo(scene) {
  const video = scene?._prismelRefractedVideo;
  if (!video) return;
  try {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
  } catch (err) { /* cleanup must stay non-fatal */ }
  scene._prismelRefractedVideo = null;
}

function waitForVideoTime(video, target, timeoutMs = 14000) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const tick = () => {
      if (!video || video.error) return reject(new Error('Refracted-Reflections video playback error'));
      if (video.currentTime >= target - 0.015) return resolve();
      if (video.ended) return reject(new Error(`Refracted-Reflections ended before ${target.toFixed(2)}s`));
      if (performance.now() - started > timeoutMs) return reject(new Error(`Refracted-Reflections timed out before ${target.toFixed(2)}s`));
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function playLiveRefractedImpact(scene, hero, dmg, lethal) {
  const view = scene.enemyView;
  const anchor = view?.container;
  const sprite = view?.sprite;
  if (!anchor) return;
  const x = anchor.x;
  const y = anchor.y - (sprite?.displayHeight || 140) * 0.50;
  const w = Math.max(72, Math.min(scene.scale.width, scene.scale.height) * 0.16);
  const h = w * 0.62;
  const defs = [
    { color: 0x67c8ff, angle: -20, delay: 0 },
    { color: 0xc477ff, angle: 10, delay: 34 },
    { color: 0xffe8a0, angle: 31, delay: 68 }
  ];
  const objects = [];
  defs.forEach(def => {
    const rect = scene.add.rectangle(x, y, w, h, 0x000000, 0)
      .setStrokeStyle(Math.max(2, scene.scale.height * 0.006), def.color, 0.92)
      .setDepth(31.2).setAngle(def.angle).setScale(0.30)
      .setBlendMode(Phaser.BlendModes.ADD);
    objects.push(rect);
    scene.time.delayedCall(def.delay, () => {
      scene.tweens.add({
        targets: rect, scaleX: 1.65, scaleY: 1.65, alpha: 0,
        angle: def.angle + (def.angle < 0 ? -12 : 12), duration: 360,
        ease: 'Cubic.easeOut', onComplete: () => rect.destroy()
      });
    });
  });
  const flash = scene.add.circle(x, y, Math.max(18, w * 0.22), 0xf8f5ff, 0.72)
    .setDepth(31.3).setBlendMode(Phaser.BlendModes.ADD);
  objects.push(flash);

  // Refracted enemy echoes: brief, translucent color-separated copies of
  // the real enemy sprite. These make the post-shatter damage feel like the
  // target is being split across broken reflections rather than hit by a
  // generic explosion. They remain visual-only; the live enemy owns state.
  if (sprite?.texture?.key) {
    const sx = x + (sprite.x || 0);
    const sy = anchor.y + (sprite.y || 0);
    [
      { tint: 0x67c8ff, dx: -18, dy: -4 },
      { tint: 0xc477ff, dx: 16, dy: 3 },
      { tint: 0xffe8a0, dx: 7, dy: -10 }
    ].forEach((echoDef, i) => {
      const echo = scene.add.image(sx, sy, sprite.texture.key, sprite.frame?.name)
        .setOrigin(sprite.originX ?? 0.5, sprite.originY ?? 0.5)
        .setDisplaySize(sprite.displayWidth || sprite.width || 120, sprite.displayHeight || sprite.height || 120)
        .setTint(echoDef.tint).setAlpha(0.22).setDepth(30.95 + i * 0.01)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.worldAdd(echo);
      scene.tweens.add({
        targets: echo, x: sx + echoDef.dx, y: sy + echoDef.dy, alpha: 0,
        scaleX: echo.scaleX * 1.04, scaleY: echo.scaleY * 1.04,
        duration: 260 + i * 35, ease: 'Cubic.easeOut', onComplete: () => echo.destroy()
      });
    });
  }

  const groundRing = scene.add.ellipse(x, anchor.y - 4, w * 1.45, h * 0.38, 0x000000, 0)
    .setStrokeStyle(Math.max(2, scene.scale.height * 0.0045), 0x8bdcff, 0.72)
    .setDepth(30.8).setBlendMode(Phaser.BlendModes.ADD);
  objects.push(groundRing);

  scene.worldAdd(objects);
  scene.tweens.add({ targets: flash, scale: 2.7, alpha: 0, duration: 220, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
  scene.tweens.add({ targets: groundRing, scaleX: 1.42, scaleY: 1.18, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => groundRing.destroy() });

  view.hit();
  scene.cameras.main.shake(150, 0.0052, true);
  scene._floatText(`-${dmg}`, '#BFEFFF');
  scene._setBanner(`${hero.name} uses ${hero.resonart.name} for ${dmg} damage!`);
  scene.audio.attackImpact(hero.id);
  scene.audio.enemyHit();
  if (lethal) {
    scene.time.delayedCall(185, () => {
      view.die();
      scene.audio.enemyDefeat();
    });
  }
}

export async function playPrismelRefractedReflections(scene, hero) {
  const video = preparePrismelRefractedVideo(scene);
  if (!video) return false;

  scene._turnLock = true;
  scene._hideCommandRail();
  scene._hideTargetCursor?.();
  scene.formation.setPovFocus?.(hero.id, true);

  const cam = scene.cameras.main;
  const cameraState = { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY };
  const base = hero.resonart.damage;
  const low = Math.round(base * 0.85);
  const high = Math.round(base * 1.15);
  const hitRoll = Math.random() < PRISMEL_RR_HIT_CHANCE;
  let impactResolved = false;

  // Reuse the already-proven full-silence cinematic BGM lane. This does
  // not trigger any Aurora asset; it only owns battle-music silence.
  const beginSilentMix = scene.audio.beginSilentCinematicMix?.bind(scene.audio)
    || scene.audio.beginAuroraVideoMix?.bind(scene.audio)
    || scene.audio.beginCinematicAttack?.bind(scene.audio);
  const endSilentMix = scene.audio.endSilentCinematicMix?.bind(scene.audio)
    || scene.audio.endAuroraVideoMix?.bind(scene.audio)
    || scene.audio.endCinematicAttack?.bind(scene.audio);
  beginSilentMix?.();
  scene._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

  try {
    video.pause();
    try { video.currentTime = 0; } catch (err) { /* metadata settling */ }
    video.style.display = 'block';
    video.style.opacity = '0';
    video.volume = 0;
    const prime = video.play();
    if (prime) await prime;
  } catch (err) {
    console.warn('[PV] Refracted-Reflections media prime failed; using generic Resonart fallback:', err);
    video.style.display = 'none';
    scene.formation.setPovFocus?.(hero.id, false);
    endSilentMix?.();
    scene._turnLock = false;
    return false;
  }

  scene.tweens.killTweensOf(cam);
  scene.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.035, duration: 420, ease: 'Sine.easeOut' });
  await scene._wait(360);

  try {
    try { video.currentTime = 0; } catch (err) { /* continue from primed zero */ }
    video.volume = scene.audio?._effectiveVolume?.('sfx', 1.0) ?? 1;
    video.style.opacity = '1';
    video.style.transform = 'scale(1.018)';

    await waitForVideoTime(video, PRISMEL_RR_TIMELINE.takeover);
    video.pause();
    await waitFrame();

    const frame = capturePrismelVideoFrame(video);
    // Hold the exact staff-to-lens image for a fraction of a beat so the
    // viewer reads contact before the fracture races outward.
    await scene._wait(PRISMEL_RR_TIMELINE.contactHoldMs);
    scene.audio.attackRelease?.(hero.id);
    video.style.opacity = '0';
    video.style.display = 'none';
    video.volume = 0;

    // Roll the damage value now, but do not mutate live battle state until
    // the captured mirror has opened enough to reveal the real battlefield.
    // This keeps logical damage synchronized to the visible reconnect and
    // prevents a pre-reveal canvas failure from double-applying damage via
    // the generic Resonart fallback.
    const pendingDamage = hitRoll ? Phaser.Math.Between(low, high) : 0;

    await runPrismelScreenBreak(frame, () => {
      if (impactResolved) return;
      impactResolved = true;
      if (hitRoll) {
        scene.enemy.hp = Math.max(0, scene.enemy.hp - pendingDamage);
        scene._updateTargetCard();
        playLiveRefractedImpact(scene, hero, pendingDamage, scene.enemy.hp <= 0);
      } else {
        scene._setBanner(`${hero.name} uses ${hero.resonart.name} — missed!`);
      }
    });
  } catch (err) {
    console.warn('[PV] Refracted-Reflections Hybrid playback fell back after media error:', err);
    try { video.pause(); } catch (e) { /* ignore */ }
    video.style.display = 'none';
    video.style.opacity = '0';
    video.volume = 0;
    if (!impactResolved) {
      scene.tweens.add({ targets: cam, zoom: cameraState.zoom, scrollX: cameraState.scrollX, scrollY: cameraState.scrollY, duration: 180, ease: 'Sine.easeOut' });
      scene.formation.setPovFocus?.(hero.id, false);
      endSilentMix?.();
      scene._turnLock = false;
      return false;
    }
  }

  try { video.pause(); video.currentTime = 0; } catch (err) { /* ignore */ }
  video.style.display = 'none';
  video.style.opacity = '0';
  video.volume = 0;

  scene.tweens.killTweensOf(cam);
  scene.tweens.add({
    targets: cam,
    zoom: cameraState.zoom,
    scrollX: cameraState.scrollX,
    scrollY: cameraState.scrollY,
    duration: 260,
    ease: 'Sine.easeInOut'
  });
  scene.formation.setPovFocus?.(hero.id, false);
  scene.formation.layout?.();
  scene.formation._forceActiveRing?.(scene.activeHeroId);
  await scene._wait(260);

  endSilentMix?.();
  scene._turnLock = false;
  scene._endHeroTurn();
  return true;
}
