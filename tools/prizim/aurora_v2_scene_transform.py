from pathlib import Path
import re

p = Path('src/prizim/Live28K2PartyBattleScene.js')
s = p.read_text()

old = "const AURORA_BEAUTY_VIDEO_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4?pvasset=live28k14-beauty';"
assert old in s, 'missing V1 Beauty path anchor'
s = s.replace(old, "const AURORA_BEAUTY_VIDEO_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v2_KingAI_MASTER.mp4?pvasset=live28k23-aurora-v2';", 1)

old = "const AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, bloomWatchdog: 0.84, silence: 4.56, pulse: 5.18, reveal: 6.08, impactReveal: 6.30, reconnect: 6.58, end: 6.65 });"
assert old in s, 'missing V1 timeline anchor'
s = s.replace(old, "const AURORA_BEAUTY_TIMELINE = Object.freeze({ choirTail: 9.35, reveal: 9.50, impactReveal: 9.72, reconnect: 9.90, end: 10.02 });\nconst AURORA_BLOOM_TAIL_SOURCE = 3.86;\nconst AURORA_LIVE_INTRO_MS = 900;\nconst AURORA_LIVE_HANDOFF_MS = 220;", 1)

director = """  async _runAuroraBeautyDirector(video) {
    if (!video) return;
    video.style.transition = 'opacity 160ms ease, transform 1800ms cubic-bezier(0.22, 1, 0.36, 1), filter 320ms ease';
    video.style.transform = 'scale(1.026)';
    video.style.filter = 'brightness(0.98) contrast(1.04) saturate(1.05)';
    await this._waitForAuroraBeautyTime(video, 7.90);
    video.style.transition = 'opacity 160ms ease, transform 1500ms cubic-bezier(0.22, 1, 0.36, 1), filter 300ms ease';
    video.style.transform = 'scale(1.012)';
    video.style.filter = 'brightness(1.05) contrast(1.03) saturate(1.08)';
    await this._waitForAuroraBeautyTime(video, 9.30);
    video.style.transition = 'opacity 140ms ease, transform 520ms cubic-bezier(0.22, 1, 0.36, 1), filter 180ms ease';
    video.style.transform = 'scale(1.045)';
    video.style.filter = 'brightness(1.14) contrast(1.02) saturate(1.10)';
  }

"""
pat = r"  async _runAuroraBeautyDirector\(video\) \{.*?\n  \}\n\n(?=  _playAuroraBattlefieldAfterglow\()"
s, n = re.subn(pat, director, s, count=1, flags=re.S)
assert n == 1, 'failed to replace Aurora Beauty director'

beauty = """  async _playAuryiAuroraPulseBeauty(hero) {
    const video = this._prepareAuroraBeautyVideo();
    if (!video) return false;

    this._turnLock = true;
    this._hideCommandRail();
    this._hideTargetCursor?.();

    const base = hero.resonart.damage;
    const low = Math.round(base * 0.85);
    const high = Math.round(base * 1.15);
    const hitRoll = Math.random() < AURORA_PULSE_HIT_CHANCE;
    let ownsV2Sfx = false;
    let ownsBloomTail = false;
    let impactResolved = false;
    let pendingImpact = null;
    const cam = this.cameras.main;
    const cameraState = { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY };

    this.audio.beginAuroraVideoMix?.();
    ownsV2Sfx = this.audio.auroraV2SfxPrime?.() === true;
    ownsBloomTail = this.audio.auroraBloomTailPrime?.() === true;
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    this.tweens.killTweensOf(cam);
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.045, duration: AURORA_LIVE_INTRO_MS, ease: 'Sine.easeOut' });
    const liveActor = this.formation?.actors?.get?.('auryi');
    const liveSprite = liveActor?.sprite;
    const liveY = liveSprite?.y;
    if (liveSprite && Number.isFinite(liveY)) {
      this.tweens.add({ targets: liveSprite, y: liveY - Math.min(18, this.scale.height * 0.03), duration: AURORA_LIVE_INTRO_MS, ease: 'Sine.easeOut' });
    }
    await this._wait(AURORA_LIVE_INTRO_MS);
    this.formation.setPovFocus?.(hero.id, true);
    await this._wait(AURORA_LIVE_HANDOFF_MS);

    try {
      video.pause();
      try { video.currentTime = 0; } catch (err) { /* metadata may still be settling */ }
      video.style.display = 'block';
      video.style.opacity = '0';
      video.style.transform = 'scale(1.026)';
      const playPromise = video.play();
      if (playPromise) await playPromise;
      if (ownsV2Sfx) this.audio.auroraV2SfxReveal?.();
      requestAnimationFrame(() => { video.style.opacity = '1'; });
      const directorTask = this._runAuroraBeautyDirector(video).catch(err => console.warn('[PV] Aurora Pulse V2 Hybrid director skipped:', err));

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.choirTail);
      if (ownsBloomTail) this.audio.auroraBloomTailReveal?.(AURORA_BLOOM_TAIL_SOURCE);

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reveal);
      this._beginAuroraBeautyBattlefieldReveal(video);

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.impactReveal);
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
      this.audio.auroraReentryWave?.();
      this._playAuroraBattlefieldAfterglow();
      if (pendingImpact) this._playAuroraEnemyReconnectImpact(pendingImpact.dmg, pendingImpact.lethal);

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reconnect);
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.end, 16000);
      await directorTask;
    } catch (err) {
      console.warn('[PV] Aurora Beauty V2 playback fell back to Hybrid mock:', err);
      if (ownsV2Sfx) this.audio.auroraV2SfxStop?.(80);
      if (ownsBloomTail) this.audio.auroraBloomStop?.(120);
      this.audio.endAuroraVideoMix?.();
      await this._hideAuroraBeautyVideo(video, 40);
      this._restoreAuroraBeautyDirector(hero.id, cameraState);
      if (!impactResolved) {
        this._turnLock = false;
        return false;
      }
    }

    if (ownsV2Sfx) this.audio.auroraV2SfxStop?.(90);
    if (ownsBloomTail) this.audio.auroraBloomStop?.(420);
    await this._hideAuroraBeautyVideo(video, 90);
    this._restoreAuroraBeautyDirector(hero.id, cameraState);
    this.audio.endAuroraVideoMix?.();
    this._turnLock = false;
    this._endHeroTurn();
    return true;
  }

"""
pat = r"  async _playAuryiAuroraPulseBeauty\(hero\) \{.*?\n  \}\n\n(?=  async _resolveHeroAction\()"
s, n = re.subn(pat, beauty, s, count=1, flags=re.S)
assert n == 1, 'failed to replace Aurora Beauty action'

p.write_text(s)
