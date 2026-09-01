from pathlib import Path

p = Path('src/prizim/DuoHybridSequenceDriver.js')
s = p.read_text()

old_prepare = """  async prepare(config) {\n    const manifest = await this.manifest(config);\n    if (manifest.mode !== 'sequence') return manifest;\n    await this.prepareSequenceSource(manifest, config.version || '1');\n    return manifest;\n  }\n"""
new_prepare = """  async prepare(config) {\n    const manifest = await this.manifest(config);\n    if (manifest.mode !== 'sequence') return manifest;\n    if (manifest.presentation?.actorRangedFx?.enabled === true) return manifest;\n    await this.prepareSequenceSource(manifest, config.version || '1');\n    return manifest;\n  }\n"""
if old_prepare not in s:
    raise SystemExit('prepare block not found')
s = s.replace(old_prepare, new_prepare, 1)

marker = "  async playSequence({ config, actor, enemyX, enemyY, onFrame }) {\n"
if marker not in s:
    raise SystemExit('playSequence marker not found')

method = r'''  drawActorRangedFx(layer, frameIndex, actorX, actorY, targetX, targetY, presentation) {
    const { ctx, dpr, w, h } = layer;
    const fx = presentation?.actorRangedFx || {};
    const gold = fx.gold || 'rgba(255,216,112,0.95)';
    const lavender = fx.lavender || 'rgba(198,132,255,0.90)';
    const crownRadius = Number(fx.crownRadius || 34);
    const orbRadius = Number(fx.orbRadius || 18);
    const beamWidth = Number(fx.beamWidth || 11);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const charge = clamp01(frameIndex / 8);
    const release = clamp01((frameIndex - 8) / 3);
    const recover = clamp01((frameIndex - 12) / 5);
    const crownY = actorY - 92;
    const handX = actorX + 34;
    const handY = actorY - 48;

    // Crown/halo: present through the build and brightest at impact.
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

    // Auorb orbits Auryi during the build, then becomes the ranged projectile.
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

  async playActorRangedSequence({ manifest, actor, enemyX, enemyY, onFrame }) {
    const frames = manifest.frames || [];
    if (!frames.length) throw new Error(`[PriZim Duo-Hybrid] No playable frames for ${manifest.id}.`);

    const scene = this.scene;
    const sprite = actor.sprite;
    const presentation = manifest.presentation || {};
    const uiCfg = presentation.ui || {};
    const impactCfg = presentation.impact || {};
    const homeX = sprite.x;
    const homeY = sprite.y;
    const targetX = Number.isFinite(enemyX) ? enemyX : scene.scale.width * 0.74;
    const targetY = Number.isFinite(enemyY) ? enemyY : homeY;
    const baseScaleX = sprite.scaleX;
    const baseScaleY = sprite.scaleY;
    const layer = this.createSequenceCanvas();
    const uiState = this.sequenceUiState();
    const camera = scene.cameras.main;
    const cameraState = { zoom: camera.zoom, scrollX: camera.scrollX, scrollY: camera.scrollY };

    scene.audio?.beginCinematicAttack?.();
    sprite.setVisible(true);
    try {
      for (let i = 0; i < frames.length; i += 1) {
        const frame = frames[i];
        if (i === Number(uiCfg.hideFrame ?? -1)) {
          this.fadeUi(uiState, Number(uiCfg.hiddenAlpha ?? 0), Number(uiCfg.fadeOutMs || 0));
          scene.formation?.setPovFocus?.(actor.hero?.id, true);
        }
        if (i === Number(uiCfg.restoreFrame ?? -1)) {
          this.restoreUi(uiState, Number(uiCfg.fadeInMs || 0));
          scene.formation?.setPovFocus?.(actor.hero?.id, false);
        }

        const pose = this.cameraPose(presentation, i, homeX, homeY, targetX, targetY);
        this.applyCameraPose(pose);
        const actorBoost = Math.max(0.1, trackValue(presentation.actorScaleTrack || [], i, 'scale', 1));
        sprite.setScale(baseScaleX * actorBoost, baseScaleY * actorBoost);

        const screenActorX = (homeX - pose.scrollX) * pose.zoom;
        const screenActorY = (homeY - pose.scrollY) * pose.zoom;
        const screenTargetX = (targetX - pose.scrollX) * pose.zoom;
        const screenTargetY = (targetY - pose.scrollY) * pose.zoom;
        const isImpact = i === Number(impactCfg.frame ?? -1);

        this.drawActorRangedFx(layer, i, screenActorX, screenActorY, screenTargetX, screenTargetY, presentation);
        if (isImpact) this.impactKick(layer, impactCfg);
        if (onFrame) onFrame(i, this.markersFor(manifest, i), manifest);
        if (isImpact && Number(impactCfg.hitStopMs || 0) > 0) await wait(scene, Number(impactCfg.hitStopMs));
        await wait(scene, Number(frame.duration || 100));
      }
    } finally {
      this.restoreUi(uiState, 0);
      scene.formation?.setPovFocus?.(actor.hero?.id, false);
      sprite.setScale(baseScaleX, baseScaleY);
      camera.setZoom(cameraState.zoom);
      camera.setScroll(cameraState.scrollX, cameraState.scrollY);
      scene.audio?.endCinematicAttack?.();
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
      layer.ctx.clearRect(0, 0, layer.overlay.width, layer.overlay.height);
      layer.overlay.remove();
      sprite.setVisible(true);
    }
    return manifest;
  }

'''
s = s.replace(marker, method + marker, 1)

old_play_start = """    const manifest = await this.manifest(config);\n    if (manifest.mode !== 'sequence') throw new Error(`[PriZim Duo-Hybrid] ${manifest.id} is not Sequence Mode.`);\n    const prepared = await this.prepareSequenceSource(manifest, config.version || '1');\n"""
new_play_start = """    const manifest = await this.manifest(config);\n    if (manifest.mode !== 'sequence') throw new Error(`[PriZim Duo-Hybrid] ${manifest.id} is not Sequence Mode.`);\n    if (manifest.presentation?.actorRangedFx?.enabled === true) {\n      return this.playActorRangedSequence({ manifest, actor, enemyX, enemyY, onFrame });\n    }\n    const prepared = await this.prepareSequenceSource(manifest, config.version || '1');\n"""
if old_play_start not in s:
    raise SystemExit('playSequence start block not found')
s = s.replace(old_play_start, new_play_start, 1)

s = s.replace('// PriZim Duo-Hybrid Sequence Driver v0.7', '// PriZim Duo-Hybrid Sequence Driver v0.8', 1)
p.write_text(s)
print('patched', p)
