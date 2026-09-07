// LIVE28K2/K3/K4/K5/K6/K7 production battle-scene adapter.
// Keeps LIVE28J battle behavior intact while using the approved LIVE28K full-resolution authorities.
import Live28PartyBattleScene from './Live28PartyBattleScene.js?v=live28j';
import Live28K7PartyFormationView from './Live28K7PartyFormationView.js?v=live28k7-halo';

const PRISMEL_K2_PASSIVE_KEY = 'prismel_live28k2_passive';
const PRISMEL_K2_PASSIVE_PATH = './assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png?pvasset=live28k3';
const PRISMEL_K2_ACTIVE_KEY = 'prismel_live28k2_staff_ready';
const PRISMEL_K2_ACTIVE_PATH = './assets/party_formation/PRISMEL_LIVE28K2_STAFF_READY.png?pvasset=live28k3';
const AURYI_K2_PRIMARY_KEY = 'auryi_live28k2_primary';
const AURYI_K2_PRIMARY_PATH = './assets/party_formation/AURYI_LIVE28K2_PRIMARY.png?pvasset=live28k3';
// Exact Celestial Bloom / Triumph M4A masters are owned by native HTMLMediaElement
// playback in PartyBattleAudioController. Never route these through Phaser/WebAudio
// decode on iPhone Safari; the original bytes remain unchanged in assets/music/.
const AURORA_BEAUTY_VIDEO_READY = true;
const AURORA_BEAUTY_VIDEO_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4?pvasset=live28k14-beauty';
// The Beauty master contains a placeholder/demo reconnect after ~6.65s.
// LIVE28K never shows that tail: the real Hybrid battlefield owns reconnect.
const AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, bloomWatchdog: 0.84, silence: 4.56, pulse: 5.18, reveal: 6.08, impactReveal: 6.30, reconnect: 6.58, end: 6.65 });

// Exact approved 01-08 production lane. Keep this false until the original
// transparent PNG bytes are physically installed at the paths below. This
// prevents 404s and leaves the approved mock choreography as the live visual bridge.
const AURORA_PULSE_FRAMES_READY = false;
const AURORA_PULSE_FRAMES = Object.freeze(
  Array.from({ length: 8 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return Object.freeze({
      key: `auryi_aurora_pulse_${n}`,
      path: `./assets/characters/auryi/animations/aurora_pulse/frames/Auryi_Aurora_Pulse_${n}.png?pvasset=live28k13-aurora`
    });
  })
);

const AURORA_PULSE_HIT_CHANCE = 0.92;
const AURORA_PULSE_TIMING = Object.freeze({
  lift: 360,
  bloomA: 520,
  bloomB: 520,
  maxCharge: 420,
  compression: 260,
  silence: 170,
  release: 240,
  aftermath: 300,
  recover: 320
});

export default class Live28K2PartyBattleScene extends Live28PartyBattleScene {
  preload() {
    super.preload();
    // Battle-critical LIVE28K art is direct repo-served PNG only. No WebP wrappers.
    this.load.image(PRISMEL_K2_PASSIVE_KEY, PRISMEL_K2_PASSIVE_PATH);
    this.load.image(PRISMEL_K2_ACTIVE_KEY, PRISMEL_K2_ACTIVE_PATH);
    this.load.image(AURYI_K2_PRIMARY_KEY, AURYI_K2_PRIMARY_PATH);

    // LIVE28K18: exact M4A cinematic/victory masters are intentionally NOT
    // loaded through Phaser. Safari can surface WebAudio decodeAudioData failures
    // for M4A after the audio-unlock gesture. Native HTMLMediaElement owns them.

    // Do not request missing production art. Once the already-approved 01-08
    // PNG bytes are restored, flipping the gate activates this lane without
    // changing Aurora's Hybrid ownership, audio, camera, or damage logic.
    if (AURORA_PULSE_FRAMES_READY) {
      AURORA_PULSE_FRAMES.forEach(frame => this.load.image(frame.key, frame.path));
    }
  }

  create() {
    super.create();

    const old = this.formation;
    if (old) {
      this.scale.off('resize', old.layout, old);
      old.actors?.forEach(actor => {
        [actor.sprite, actor.ghost, actor.ring, actor.attackSprite, actor.duoCrown, actor.duoAuorb]
          .filter(Boolean)
          .forEach(obj => obj.destroy?.());
      });
    }

    this.formation = new Live28K7PartyFormationView(this);
    this.formation.create(this.party);
    if (this.activeHeroId) this.formation.setActive(this.activeHeroId);

    // K20: prewarm only the exact Beauty V1 motion master. Hybrid owns the
    // cinematic camera/framing/reconnect; no move-title overlay is shown.
    this._prepareAuroraBeautyVideo();
    this.events.once('shutdown', () => this._disposeAuroraBeautyVideo());

    globalThis.__PV_LIVE28K2_RUNTIME__ = true;
    globalThis.__PV_LIVE28K2_FULLRES_PRIMARIES__ = true;
    globalThis.__PV_LIVE28K2_PRISMEL_STATE_PAIR__ = true;
    globalThis.__PV_LIVE28K6_AURYI_CROWN_HYBRID__ = true;
    globalThis.__PV_LIVE28K7_ATTACK_HALO_CLEAN__ = true;
    globalThis.__PV_LIVE28K_AURORA_PULSE_CINEMATIC__ = true;
    globalThis.__PV_LIVE28K_AURORA_MOCK_PORT__ = true;
    globalThis.__PV_LIVE28K_AURORA_BEAUTY_VIDEO__ = true;
    globalThis.__PV_LIVE28K_AURORA_FRAME_LANE_READY__ = this._hasAuroraPulseFrames();
  }

  _onCommand(label) {
    super._onCommand(label);
    if (label !== 'Resonart') return;

    const hero = this._activeHero();
    if (hero?.id !== 'auryi' || !hero.resonart || !this._drawer) return;

    // Auryi's Basic Attack and Resonart are separate authorities:
    // Aurorb Slice remains Attack; Aurora Pulse owns the Resonart drawer.
    this._drawer.title.setText(hero.resonart.name.toUpperCase());
    this._drawer.detail.setText(hero.resonart.flavor || 'A signature technique.');
  }

  _hasAuroraPulseFrames() {
    return AURORA_PULSE_FRAMES_READY && AURORA_PULSE_FRAMES.every(frame => this.textures.exists(frame.key));
  }

  _setAuroraPulseFrame(index) {
    if (!this._hasAuroraPulseFrames()) return false;
    const actor = this.formation?.actors?.get?.('auryi');
    const frame = AURORA_PULSE_FRAMES[index - 1];
    if (!actor?.sprite || !frame || !this.textures.exists(frame.key)) return false;

    actor.sprite.setTexture(frame.key).setVisible(true).setAlpha(1).setAngle(0);
    actor.ghost?.setVisible(false)?.setAlpha?.(0);
    actor.attackSprite?.setVisible(false)?.setAlpha?.(1);
    actor.ring?.setVisible(false)?.setAlpha?.(0);

    // Fit by measured visible-body bounds instead of raw 900x900 canvas size,
    // preserving Auryi's approved battlefield height and anchor across all frames.
    const targetBodyH = this.scale.height * 0.47;
    this.formation._fitActorToBodyHeight?.(actor, frame.key, targetBodyH);
    return true;
  }

  _restoreAuryiAfterAurora() {
    const actor = this.formation?.actors?.get?.('auryi');
    if (!actor) return;
    this.formation._restoreAuryiPrimary?.(actor);
    this.formation.layout?.();
    this.formation._forceActiveRing?.(this.activeHeroId);
  }

  // Phaser realization of the already-approved PZ-A Aurora Pulse mock.
  // This is scene-level Hybrid/K presentation, not a new standalone effect design.
  _createAuroraMockStage(actor) {
    const w = this.scale.width;
    const h = this.scale.height;
    const x = actor?.sprite?.x ?? w * 0.5;
    const bodyH = actor?.sprite?.displayHeight || h * 0.47;
    const y = Math.max(h * 0.30, (actor?.sprite?.y ?? h * 0.66) - bodyH * 0.53);
    const r = Math.max(34, Math.min(w, h) * 0.075);

    const veilA = this.add.ellipse(x, y, w * 0.72, h * 0.46, 0xba8bff, 0.12)
      .setDepth(7).setAlpha(0).setAngle(-18).setBlendMode(Phaser.BlendModes.ADD);
    const veilB = this.add.ellipse(x, y, w * 0.58, h * 0.62, 0x79ffc5, 0.10)
      .setDepth(7.1).setAlpha(0).setAngle(28).setBlendMode(Phaser.BlendModes.ADD);
    const veilC = this.add.ellipse(x, y, w * 0.48, h * 0.54, 0xffd76a, 0.08)
      .setDepth(7.2).setAlpha(0).setAngle(-42).setBlendMode(Phaser.BlendModes.ADD);

    const auroraCore = this.add.circle(x, y, r, 0xb785ff, 0.16)
      .setStrokeStyle(4, 0xd8b6ff, 0.95).setDepth(9).setAlpha(0).setScale(0.10)
      .setBlendMode(Phaser.BlendModes.ADD);
    const auroraRingA = this.add.ellipse(x, y, r * 2.35, r * 1.38, 0x000000, 0)
      .setStrokeStyle(2.5, 0x8effd6, 0.82).setDepth(9.1).setAlpha(0).setScale(0.10).setAngle(28)
      .setBlendMode(Phaser.BlendModes.ADD);
    const auroraRingB = this.add.ellipse(x, y, r * 2.70, r * 1.55, 0x000000, 0)
      .setStrokeStyle(2.5, 0xffd76a, 0.78).setDepth(9.2).setAlpha(0).setScale(0.10).setAngle(-31)
      .setBlendMode(Phaser.BlendModes.ADD);

    const pulse = this.add.circle(x, y, Math.max(20, r * 0.55), 0x000000, 0)
      .setStrokeStyle(7, 0xf4e6ff, 1).setDepth(30).setAlpha(0).setScale(0.10)
      .setBlendMode(Phaser.BlendModes.ADD);
    const pulseEcho = this.add.circle(x, y, Math.max(16, r * 0.42), 0x000000, 0)
      .setStrokeStyle(3.5, 0x7affd2, 0.90).setDepth(29.9).setAlpha(0).setScale(0.10)
      .setBlendMode(Phaser.BlendModes.ADD);

    const flash = this.add.rectangle(w * 0.5, h * 0.5, w * 1.5, h * 1.5, 0xffffff, 1)
      .setDepth(40).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    const title = this.add.text(w * 0.5, h * 0.095, '', {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.max(22, Math.min(42, w * 0.047))}px`,
      color: '#fff2c5',
      align: 'center',
      stroke: '#120b24',
      strokeThickness: 5,
      letterSpacing: 2
    }).setOrigin(0.5, 0).setDepth(32).setAlpha(0).setY(h * 0.08);

    const objects = [veilA, veilB, veilC, auroraCore, auroraRingA, auroraRingB, pulse, pulseEcho, flash, title];
    this.worldAdd(objects);

    // Phaser Container children render by local list order, so make the
    // approved lab stacking explicit rather than trusting child depth.
    // Veil/Aurora/Pulse stay behind Auryi; title and white flash stay in front.
    if (actor?.sprite && this.world?.moveBelow) {
      [veilA, veilB, veilC, auroraCore, auroraRingA, auroraRingB, pulse, pulseEcho]
        .forEach(obj => this.world.moveBelow(obj, actor.sprite));
    }
    this.world?.bringToTop?.(title);
    this.world?.bringToTop?.(flash);

    return { x, y, veilA, veilB, veilC, auroraCore, auroraRingA, auroraRingB, pulse, pulseEcho, flash, title, objects };
  }

  _destroyAuroraMockStage(stage) {
    if (!stage) return;
    stage.objects?.forEach(obj => {
      this.tweens.killTweensOf(obj);
      obj.destroy?.();
    });
  }

  _prepareAuroraBeautyVideo() {
    if (!AURORA_BEAUTY_VIDEO_READY || typeof document === 'undefined') return null;
    if (this._auroraBeautyVideo) return this._auroraBeautyVideo;

    const video = document.createElement('video');
    video.src = new URL(AURORA_BEAUTY_VIDEO_PATH, window.location.href).href;
    video.preload = 'auto';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.controls = false;
    video.loop = false;
    Object.assign(video.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      background: '#020108',
      zIndex: '2147483000',
      pointerEvents: 'none',
      opacity: '0',
      display: 'none',
      transform: 'scale(1.018)',
      transformOrigin: '50% 50%',
      filter: 'brightness(0.96) contrast(1.04) saturate(1.04)',
      willChange: 'opacity, transform, filter',
      transition: 'opacity 120ms linear, transform 620ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease'
    });
    document.body.appendChild(video);
    video.load();
    this._auroraBeautyVideo = video;
    return video;
  }

  _disposeAuroraBeautyVideo() {
    const video = this._auroraBeautyVideo;
    if (!video) return;
    try {
      // Let the live battlefield hold for one last beat while the camera
      // commits to Auryi, then let Beauty take over without a static card.
      this.tweens.killTweensOf(cam);
      this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.05, duration: 170, ease: 'Sine.easeOut' });
      await this._wait(110);
      this.formation.setPovFocus?.(hero.id, true);
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    } catch (err) { /* ignore cleanup errors */ }
    this._auroraBeautyVideo = null;
  }

  _waitForAuroraBeautyTime(video, target, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const started = performance.now();
      const tick = () => {
        if (!video || video.error) {
          reject(new Error('Aurora Beauty video playback error'));
          return;
        }
        if (video.currentTime >= target - 0.015) {
          resolve();
          return;
        }
        if (video.ended) {
          reject(new Error(`Aurora Beauty ended before ${target.toFixed(2)}s`));
          return;
        }
        if (performance.now() - started > timeoutMs) {
          reject(new Error(`Aurora Beauty timed out before ${target.toFixed(2)}s`));
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async _hideAuroraBeautyVideo(video, fadeMs = 90) {
    if (!video) return;
    video.style.transition = `opacity ${Math.max(0, fadeMs)}ms linear`;
    video.style.opacity = '0';
    await this._wait(fadeMs);
    try { video.pause(); } catch (err) { /* ignore */ }
    video.style.display = 'none';
    video.style.transform = 'scale(1.018)';
    video.style.filter = 'brightness(0.96) contrast(1.04) saturate(1.04)';
    video.style.transition = 'opacity 120ms linear, transform 620ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease';
    try { video.currentTime = 0; } catch (err) { /* ignore */ }
  }

  async _runAuroraBeautyDirector(video) {
    if (!video) return;
    // Hybrid is the director; Beauty V1 remains the exact motion master.
    video.style.transition = 'opacity 180ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease';
    video.style.transform = 'scale(1.035)';
    video.style.filter = 'brightness(0.92) contrast(1.06) saturate(0.96)';

    await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);
    video.style.transform = 'scale(1.025)';
    video.style.filter = 'brightness(1.00) contrast(1.05) saturate(1.04)';

    await this._waitForAuroraBeautyTime(video, 1.55);
    video.style.transition = 'opacity 180ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1), filter 380ms ease';
    video.style.transform = 'scale(1.010)';
    video.style.filter = 'brightness(1.03) contrast(1.04) saturate(1.07)';

    await this._waitForAuroraBeautyTime(video, 2.45);
    video.style.transform = 'scale(1.000)';
    video.style.filter = 'brightness(1.05) contrast(1.03) saturate(1.08)';

    await this._waitForAuroraBeautyTime(video, 3.35);
    video.style.transition = 'opacity 180ms ease, transform 540ms cubic-bezier(0.55, 0, 1, 0.45), filter 300ms ease';
    video.style.transform = 'scale(1.028)';

    await this._waitForAuroraBeautyTime(video, 4.15);
    video.style.transition = 'opacity 180ms ease, transform 260ms cubic-bezier(0.55, 0, 1, 0.45), filter 180ms ease';
    video.style.transform = 'scale(1.058)';
    video.style.filter = 'brightness(0.91) contrast(1.09) saturate(0.98)';

    await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.silence);
    video.style.transition = 'opacity 90ms linear, transform 90ms linear, filter 90ms linear';
    video.style.transform = 'scale(1.066)';
    video.style.filter = 'brightness(0.82) contrast(1.11) saturate(0.88)';

    await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.pulse);
    video.style.transition = 'opacity 120ms linear, transform 150ms cubic-bezier(0.22, 1, 0.36, 1), filter 140ms ease';
    video.style.transform = 'scale(1.016)';
    video.style.filter = 'brightness(1.18) contrast(1.05) saturate(1.14)';
  }

  _playAuroraBattlefieldAfterglow() {
    const w = this.scale.width;
    const h = this.scale.height;
    const wash = this.add.rectangle(w * 0.5, h * 0.5, w * 1.5, h * 1.5, 0xf5ecff, 0.30)
      .setDepth(30.7).setBlendMode(Phaser.BlendModes.ADD);
    const sweep = this.add.ellipse(w * 0.56, h * 0.47, w * 1.26, h * 0.74, 0xb58cff, 0.17)
      .setDepth(30.6).setAngle(-12).setBlendMode(Phaser.BlendModes.ADD);
    wash.setScrollFactor?.(0);
    sweep.setScrollFactor?.(0);
    this.worldAdd([wash, sweep]);
    this.world?.bringToTop?.(sweep);
    this.world?.bringToTop?.(wash);
    this.tweens.add({ targets: wash, alpha: 0, duration: 430, ease: 'Cubic.easeOut', onComplete: () => wash.destroy() });
    this.tweens.add({ targets: sweep, scaleX: 1.12, scaleY: 1.18, alpha: 0, duration: 560, ease: 'Cubic.easeOut', onComplete: () => sweep.destroy() });
  }

  _restoreAuroraBeautyDirector(heroId, cameraState) {
    this.formation.setPovFocus?.(heroId, false);
    const cam = this.cameras.main;
    if (!cam || !cameraState) return;
    this.tweens.killTweensOf(cam);
    this.tweens.add({
      targets: cam,
      zoom: cameraState.zoom,
      scrollX: cameraState.scrollX,
      scrollY: cameraState.scrollY,
      duration: 220,
      ease: 'Sine.easeOut'
    });
  }

  _beginAuroraBeautyBattlefieldReveal(video) {
    if (!video) return;
    // K20: the Pulse itself carries the viewer back into the real Hybrid
    // battlefield. The slight push/bloom turns the crossfade into a wave exit.
    video.style.transition = 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease';
    video.style.transform = 'scale(1.065)';
    video.style.filter = 'brightness(1.24) contrast(1.02) saturate(1.12)';
    video.style.opacity = '0';
  }

  _playAuroraEnemyReconnectImpact(dmg, lethal) {
    const view = this.enemyView;
    const anchor = view?.container;
    const sprite = view?.sprite;
    if (!anchor) return;

    const x = anchor.x;
    const y = anchor.y - (sprite?.displayHeight || 140) * 0.52;
    const r = Math.max(42, Math.min(this.scale.width, this.scale.height) * 0.085);
    const core = this.add.circle(x, y, r * 0.62, 0xc48cff, 0.34)
      .setDepth(31).setBlendMode(Phaser.BlendModes.ADD);
    const ring = this.add.circle(x, y, r, 0x000000, 0)
      .setStrokeStyle(6, 0xf6e8ff, 0.96).setDepth(31.1).setBlendMode(Phaser.BlendModes.ADD);
    const echo = this.add.circle(x, y, r * 0.72, 0x000000, 0)
      .setStrokeStyle(3, 0x82ffd8, 0.88).setDepth(31.2).setBlendMode(Phaser.BlendModes.ADD);
    this.worldAdd([core, ring, echo]);
    this.world?.bringToTop?.(core);
    this.world?.bringToTop?.(ring);
    this.world?.bringToTop?.(echo);

    this.tweens.add({ targets: core, scale: 2.25, alpha: 0, duration: 360, ease: 'Cubic.easeOut', onComplete: () => core.destroy() });
    this.tweens.add({ targets: ring, scale: 2.85, alpha: 0, duration: 430, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    this.tweens.add({ targets: echo, scale: 3.45, alpha: 0, duration: 510, ease: 'Cubic.easeOut', onComplete: () => echo.destroy() });
    this.cameras.main.shake(160, 0.0048, true);

    // The logical HP change already happened on the 5.18s Pulse beat. This is
    // deliberately the visible hit/recoil beat during the battlefield crossfade.
    view.hit();
    this._floatText(`-${dmg}`, '#FFE8A0');
    if (lethal) {
      this.time.delayedCall(185, () => {
        view.die();
        this.audio.enemyDefeat();
      });
    }
  }

  async _playAuryiAuroraPulseBeauty(hero) {
    const video = this._prepareAuroraBeautyVideo();
    if (!video) return false;

    this._turnLock = true;
    this._hideCommandRail();
    this._hideTargetCursor?.();

    const base = hero.resonart.damage;
    const low = Math.round(base * 0.85);
    const high = Math.round(base * 1.15);
    const hitRoll = Math.random() < AURORA_PULSE_HIT_CHANCE;
    let ownsBloom = false;
    let impactResolved = false;
    let pendingImpact = null;
    const cam = this.cameras.main;
    const cameraState = { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY };

    this.audio.beginCinematicAttack?.();
    // iPhone/Safari: arm the exact choir cue while still inside the user-gesture
    // execution chain. Phaser/WebAudio schedules its 0.70s Invocation start,
    // instead of attempting a fresh delayed play after native video has begun.
    ownsBloom = this.audio.auroraBloomStart?.(AURORA_BEAUTY_TIMELINE.invocation) === true;
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    try {
      video.pause();
      try { video.currentTime = 0; } catch (err) { /* metadata may still be settling */ }
      video.style.display = 'block';
      video.style.opacity = '0';
      video.style.transform = 'scale(1.035)';
      const playPromise = video.play();
      if (playPromise) await playPromise;
      requestAnimationFrame(() => { video.style.opacity = '1'; });
      const directorTask = this._runAuroraBeautyDirector(video)
        .catch(err => console.warn('[PV] Aurora Pulse Hybrid director skipped:', err));

      // Beauty V1 is the presentation clock. Starting Bloom at Invocation and
      // pausing it for the approved compression pocket makes its 5.48s master
      // land almost exactly at the 6.82s battlefield-reconnect beat.
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);
      if (!ownsBloom) this.audio.attackGather(hero.id);

      // K17 iPhone watchdog: scheduling Bloom is not proof Safari actually
      // started it. Verify shortly after Invocation and recover the exact master
      // immediately if the delayed WebAudio start was dropped.
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.bloomWatchdog);
      if (ownsBloom && !this.audio.auroraBloomIsPlaying?.()) {
        const recovered = this.audio.auroraBloomEnsurePlaying?.() === true;
        if (!recovered) console.warn('[PV] Celestial Bloom watchdog armed recovery but playback is not yet confirmed.');
      }

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.silence);
      if (ownsBloom) this.audio.auroraBloomSilence?.();

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.pulse);
      if (ownsBloom) this.audio.auroraBloomResume?.();
      else this.audio.attackRelease(hero.id);

      if (hitRoll) {
        const dmg = Phaser.Math.Between(low, high);
        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        this._updateTargetCard();
        pendingImpact = { dmg, lethal: this.enemy.hp <= 0 };
        this._setBanner(`${hero.name} uses ${hero.resonart.name} for ${dmg} damage!`);
        this.audio.attackImpact(hero.id);
        this.audio.enemyHit();
      } else {
        this._setBanner(`${hero.name} uses ${hero.resonart.name} — missed!`);
      }
      impactResolved = true;

      // Smooth Hybrid reconnect: the real battlefield begins bleeding through
      // the tail of the Beauty Pulse, then the live enemy visibly takes the hit
      // inside that crossfade. Never show the baked placeholder/demo reconnect tail.
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reveal);
      this._beginAuroraBeautyBattlefieldReveal(video);
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.impactReveal);
      this.audio.auroraReentryWave?.();
      this._playAuroraBattlefieldAfterglow();
      if (pendingImpact) this._playAuroraEnemyReconnectImpact(pendingImpact.dmg, pendingImpact.lethal);
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reconnect);
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.end, 14000);
    } catch (err) {
      console.warn('[PV] Aurora Beauty V1 playback fell back to Hybrid mock:', err);
      if (ownsBloom) this.audio.auroraBloomStop?.(120);
      this.audio.endCinematicAttack?.();
      await this._hideAuroraBeautyVideo(video, 40);
      this._restoreAuroraBeautyDirector(hero.id, cameraState);
      if (!impactResolved) {
        this._turnLock = false;
        return false;
      }
    }

    if (ownsBloom) this.audio.auroraBloomStop?.(120);
    await this._hideAuroraBeautyVideo(video, 90);
    this._restoreAuroraBeautyDirector(hero.id, cameraState);
    this.audio.endCinematicAttack?.();
    this._turnLock = false;
    this._endHeroTurn();
    return true;
  }

  async _resolveHeroAction(hero, command) {
    if (hero?.id === 'auryi' && command === 'Resonart' && hero.resonart) {
      return this._playAuryiAuroraPulse(hero);
    }
    return super._resolveHeroAction(hero, command);
  }

  async _playAuryiAuroraPulse(hero) {
    if (AURORA_BEAUTY_VIDEO_READY) {
      const handled = await this._playAuryiAuroraPulseBeauty(hero);
      if (handled) return;
    }

    // Fail-safe only: preserve the already-approved Hybrid mock if native video
    // playback is unavailable on a device. Never substitute the old Aurorb Slice poses.
    this._turnLock = true;
    this._hideCommandRail();
    this._hideTargetCursor?.();

    const cam = this.cameras.main;
    const cameraState = {
      zoom: cam.zoom,
      scrollX: cam.scrollX,
      scrollY: cam.scrollY
    };
    const base = hero.resonart.damage;
    const low = Math.round(base * 0.85);
    const high = Math.round(base * 1.15);
    const hitRoll = Math.random() < AURORA_PULSE_HIT_CHANCE;
    const useAuroraFrames = this._hasAuroraPulseFrames();
    const fallbackActor = !useAuroraFrames ? this.formation?.actors?.get?.('auryi') : null;
    if (fallbackActor) this.formation._restoreAuryiPrimary?.(fallbackActor);

    const actor = this.formation?.actors?.get?.('auryi');
    const sprite = actor?.sprite;
    const home = sprite ? { y: sprite.y, scaleX: sprite.scaleX, scaleY: sprite.scaleY } : null;
    const stage = this._createAuroraMockStage(actor);
    this.formation.setPovFocus?.(hero.id, true);

    this.audio.beginCinematicAttack?.();
    const ownsBloom = this.audio.auroraBloomStart?.() === true;
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    // MOCK 01: battlefield handoff. The live Hybrid canvas keeps HUD/state
    // ownership while Auryi and the Veil field take visual focus.
    if (useAuroraFrames) this._setAuroraPulseFrame(1);
    else if (sprite && home) {
      actor.ghost?.setVisible(false)?.setAlpha?.(0);
      actor.attackSprite?.setVisible(false)?.setAlpha?.(1);
      actor.ring?.setVisible(false)?.setAlpha?.(0);
      this.tweens.add({
        targets: sprite,
        y: home.y - Math.min(22, this.scale.height * 0.038),
        scaleX: home.scaleX * 1.13,
        scaleY: home.scaleY * 1.13,
        duration: AURORA_PULSE_TIMING.lift,
        ease: 'Sine.easeOut'
      });
    }
    this.tweens.add({ targets: [stage.veilA, stage.veilB, stage.veilC], alpha: 0.34, duration: AURORA_PULSE_TIMING.lift, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.10, duration: 280, ease: 'Sine.easeOut' });
    if (useAuroraFrames) {
      await this._wait(AURORA_PULSE_TIMING.lift / 2);
      this._setAuroraPulseFrame(2);
      await this._wait(AURORA_PULSE_TIMING.lift / 2);
    } else {
      await this._wait(AURORA_PULSE_TIMING.lift);
    }

    // MOCK 02/03: cinematic ownership + Aurora growth beyond body scale.
    this.tweens.add({ targets: stage.title, alpha: 1, y: this.scale.height * 0.095, duration: 240, ease: 'Sine.easeOut' });
    if (!ownsBloom) this.audio.attackGather(hero.id);
    if (useAuroraFrames) this._setAuroraPulseFrame(3);
    else if (sprite && home) {
      this.tweens.add({
        targets: sprite,
        y: home.y - Math.min(38, this.scale.height * 0.065),
        scaleX: home.scaleX * 1.25,
        scaleY: home.scaleY * 1.25,
        duration: AURORA_PULSE_TIMING.bloomA,
        ease: 'Sine.easeOut'
      });
    }
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 0.96, duration: 420, ease: 'Sine.easeInOut' });
    this.tweens.add({
      targets: [stage.auroraCore, stage.auroraRingA, stage.auroraRingB],
      alpha: 1,
      scaleX: 2.0,
      scaleY: 2.0,
      duration: AURORA_PULSE_TIMING.bloomA,
      ease: 'Cubic.easeOut'
    });
    this.tweens.add({ targets: stage.veilA, angle: 14, scaleX: 1.08, scaleY: 1.08, alpha: 0.58, duration: AURORA_PULSE_TIMING.bloomA });
    this.tweens.add({ targets: stage.veilB, angle: 58, scaleX: 1.10, scaleY: 1.10, alpha: 0.58, duration: AURORA_PULSE_TIMING.bloomA });
    this.tweens.add({ targets: stage.veilC, angle: -12, scaleX: 1.08, scaleY: 1.08, alpha: 0.48, duration: AURORA_PULSE_TIMING.bloomA });

    if (useAuroraFrames) {
      await this._wait(AURORA_PULSE_TIMING.bloomA / 2);
      this._setAuroraPulseFrame(4);
      await this._wait(AURORA_PULSE_TIMING.bloomA / 2);
      this._setAuroraPulseFrame(5);
    } else {
      await this._wait(AURORA_PULSE_TIMING.bloomA);
    }

    this.tweens.add({
      targets: [stage.auroraCore, stage.auroraRingA, stage.auroraRingB],
      scaleX: 4.3,
      scaleY: 4.3,
      duration: AURORA_PULSE_TIMING.bloomB,
      ease: 'Cubic.easeOut'
    });
    this.tweens.add({ targets: [stage.veilA, stage.veilB], alpha: 0.75, scaleX: 1.15, scaleY: 1.15, duration: AURORA_PULSE_TIMING.bloomB });
    if (!useAuroraFrames && sprite && home) {
      this.tweens.add({ targets: sprite, scaleX: home.scaleX * 1.08, scaleY: home.scaleY * 1.08, duration: AURORA_PULSE_TIMING.bloomB, ease: 'Sine.easeInOut' });
    }
    await this._wait(AURORA_PULSE_TIMING.bloomB);

    // MOCK max charge: hold the huge Aurora long enough for Celestial Bloom's
    // strongest swell to read before the hand-smash/compression.
    if (useAuroraFrames) this._setAuroraPulseFrame(6);
    this.tweens.add({ targets: stage.auroraRingA, angle: stage.auroraRingA.angle + 24, duration: AURORA_PULSE_TIMING.maxCharge, ease: 'Linear' });
    this.tweens.add({ targets: stage.auroraRingB, angle: stage.auroraRingB.angle - 28, duration: AURORA_PULSE_TIMING.maxCharge, ease: 'Linear' });
    await this._wait(AURORA_PULSE_TIMING.maxCharge);

    // MOCK 04/05: hard inward collapse, then the approved frozen silence.
    if (useAuroraFrames) this._setAuroraPulseFrame(7);
    else if (sprite && home) {
      this.tweens.add({
        targets: sprite,
        y: home.y - Math.min(14, this.scale.height * 0.025),
        scaleX: home.scaleX * 1.35,
        scaleY: home.scaleY * 1.35,
        duration: AURORA_PULSE_TIMING.compression,
        ease: 'Quad.easeIn'
      });
    }
    this.tweens.add({
      targets: [stage.auroraCore, stage.auroraRingA, stage.auroraRingB],
      scaleX: 0.16,
      scaleY: 0.16,
      duration: AURORA_PULSE_TIMING.compression,
      ease: 'Cubic.easeIn'
    });
    this.tweens.add({ targets: [stage.veilA, stage.veilB, stage.veilC], alpha: 0.16, duration: AURORA_PULSE_TIMING.compression });
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.13, duration: 220, ease: 'Sine.easeIn' });
    await this._wait(AURORA_PULSE_TIMING.compression);

    if (ownsBloom) this.audio.auroraBloomSilence?.();
    stage.flash.setAlpha(0.90);
    this.tweens.add({ targets: stage.flash, alpha: 0, duration: Math.max(80, AURORA_PULSE_TIMING.silence), ease: 'Quad.easeOut' });
    await this._wait(AURORA_PULSE_TIMING.silence);

    // MOCK 06: massive outward Pulse. Runtime damage still lands only after
    // this release beat, preserving Hybrid battle-state authority.
    if (useAuroraFrames) this._setAuroraPulseFrame(8);
    if (ownsBloom) this.audio.auroraBloomResume?.();
    else this.audio.attackRelease(hero.id);
    stage.pulse.setAlpha(1).setScale(0.10);
    stage.pulseEcho.setAlpha(0.86).setScale(0.10);
    this.tweens.add({ targets: [stage.pulse, stage.pulseEcho], scaleX: 12, scaleY: 12, alpha: 0, duration: AURORA_PULSE_TIMING.release + 380, ease: 'Cubic.easeOut' });
    stage.flash.setAlpha(0.62);
    this.tweens.add({ targets: stage.flash, alpha: 0, duration: AURORA_PULSE_TIMING.release + 160, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: [stage.auroraCore, stage.auroraRingA, stage.auroraRingB], alpha: 0, duration: 110 });
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 0.91, duration: 130, ease: 'Quad.easeOut' });
    await this._wait(AURORA_PULSE_TIMING.release);

    if (hitRoll) {
      const dmg = Phaser.Math.Between(low, high);
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this._updateTargetCard();
      this.enemyView.hit();
      this.cameras.main.shake(110, 0.0045);
      this._floatText(`-${dmg}`, '#FFE8A0');
      this._setBanner(`${hero.name} uses ${hero.resonart.name} for ${dmg} damage!`);
      this.audio.attackImpact(hero.id);
      this.audio.enemyHit();

      if (this.enemy.hp <= 0) {
        this.enemyView.die();
        this.audio.enemyDefeat();
      }
    } else {
      this._setBanner(`${hero.name} uses ${hero.resonart.name} — missed!`);
    }

    await this._wait(AURORA_PULSE_TIMING.aftermath);

    // MOCK 07: reconnect to the live Hybrid battlefield and restore all
    // actor/camera/UI state without borrowing the Aurorb Slice pose lane.
    this.tweens.add({ targets: stage.title, alpha: 0, y: this.scale.height * 0.08, duration: 220 });
    this.tweens.add({ targets: [stage.veilA, stage.veilB, stage.veilC], alpha: 0, duration: AURORA_PULSE_TIMING.recover, ease: 'Sine.easeInOut' });
    if (!useAuroraFrames && sprite && home) {
      this.tweens.add({
        targets: sprite,
        y: home.y,
        scaleX: home.scaleX,
        scaleY: home.scaleY,
        duration: AURORA_PULSE_TIMING.recover,
        ease: 'Sine.easeInOut'
      });
    }
    this.tweens.add({
      targets: cam,
      zoom: cameraState.zoom,
      scrollX: cameraState.scrollX,
      scrollY: cameraState.scrollY,
      duration: 300,
      ease: 'Sine.easeInOut'
    });
    await this._wait(AURORA_PULSE_TIMING.recover);

    if (useAuroraFrames) this._restoreAuryiAfterAurora();
    else if (actor) {
      this.formation._restoreAuryiPrimary?.(actor);
      this.formation.layout?.();
      this.formation._forceActiveRing?.(this.activeHeroId);
    }
    this.formation.setPovFocus?.(hero.id, false);
    this._destroyAuroraMockStage(stage);
    if (ownsBloom) this.audio.auroraBloomStop?.(420);
    this.audio.endCinematicAttack?.();

    this._turnLock = false;
    this._endHeroTurn();
  }

  _setBanner(msg) {
    const hero = this._activeHero();
    if (hero?.id === 'auryi' && hero.resonart && typeof msg === 'string' && msg.includes(hero.attack.name)) {
      msg = msg.replaceAll(hero.attack.name, hero.resonart.name);
    }
    super._setBanner(msg);
  }
}
