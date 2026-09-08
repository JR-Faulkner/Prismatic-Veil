#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'missing K24 transform anchor: {label}')
    return text.replace(old, new, 1)

witness = 'main-20260908-live28k24'
master_rel = 'assets/characters/kineza/animations/thunder_tornado/cinematic/Kineza_ThunderTornado_Resonart_MASTER.mp4'
master_sha = '77e8fe6e9fcf430d013f0189355b0f725e150c850b240fd5b53060a4f94f9b93'
master_bytes = 6312497

# Kineza data authority
p = ROOT / 'src/BattleConfig.js'
s = p.read_text(encoding='utf-8')
attack_anchor = """    attack: Object.freeze({
      name: 'Momentum Fist',
      damage: 17,
      flavor: 'Kinetic force coils tight...',
      critChance: 0.22,
      critMultiplier: 2
    }),
    frameColourway: 'teal',"""
attack_replacement = """    attack: Object.freeze({
      name: 'Momentum Fist',
      damage: 17,
      flavor: 'Kinetic force coils tight...',
      critChance: 0.22,
      critMultiplier: 2
    }),
    resonart: Object.freeze({
      name: 'Thunder Tornado',
      damage: 26,
      flavor: 'Kineza punches fast enough to build a kinetic cyclone, lets emerald thunder charge it, then drives the tornado through the battlefield.',
      presentation: 'hybrid-video'
    }),
    frameColourway: 'teal',"""
if "name: 'Thunder Tornado'" not in s:
    s = replace_once(s, attack_anchor, attack_replacement, 'Kineza Resonart data')
p.write_text(s, encoding='utf-8')

# Hybrid K adapter
p = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
s = p.read_text(encoding='utf-8')
if 'THUNDER_TORNADO_VIDEO_PATH' not in s:
    s = replace_once(
        s,
        'const AURORA_LIVE_HANDOFF_MS = 220;',
        """const AURORA_LIVE_HANDOFF_MS = 220;

const THUNDER_TORNADO_VIDEO_READY = true;
const THUNDER_TORNADO_VIDEO_PATH = './assets/characters/kineza/animations/thunder_tornado/cinematic/Kineza_ThunderTornado_Resonart_MASTER.mp4?pvasset=live28k24-thunder-tornado';
const THUNDER_TORNADO_TIMELINE = Object.freeze({ reveal: 9.18, livePass: 9.40, impact: 9.66, hide: 9.92 });
const THUNDER_TORNADO_LIVE_INTRO_MS = 520;
const THUNDER_TORNADO_HIT_CHANCE = 0.92;""",
        'Thunder constants'
    )

    s = replace_once(
        s,
        """    this._prepareAuroraBeautyVideo();
    this.events.once('shutdown', () => this._disposeAuroraBeautyVideo());""",
        """    this._prepareAuroraBeautyVideo();
    this._prepareKinezaThunderVideo();
    this.events.once('shutdown', () => {
      this._disposeAuroraBeautyVideo();
      this._disposeKinezaThunderVideo();
    });""",
        'Thunder video lifecycle'
    )

    s = replace_once(
        s,
        """    globalThis.__PV_LIVE28K_AURORA_BEAUTY_VIDEO__ = true;
    globalThis.__PV_LIVE28K_AURORA_FRAME_LANE_READY__ = this._hasAuroraPulseFrames();""",
        """    globalThis.__PV_LIVE28K_AURORA_BEAUTY_VIDEO__ = true;
    globalThis.__PV_LIVE28K_AURORA_FRAME_LANE_READY__ = this._hasAuroraPulseFrames();
    globalThis.__PV_LIVE28K24_THUNDER_TORNADO__ = true;""",
        'Thunder runtime marker'
    )

    old_on = """  _onCommand(label) {
    super._onCommand(label);
    if (label !== 'Resonart') return;

    const hero = this._activeHero();
    if (hero?.id !== 'auryi' || !hero.resonart || !this._drawer) return;

    // Auryi's Basic Attack and Resonart are separate authorities:
    // Aurorb Slice remains Attack; Aurora Pulse owns the Resonart drawer.
    this._drawer.title.setText(hero.resonart.name.toUpperCase());
    this._drawer.detail.setText(hero.resonart.flavor || 'A signature technique.');
  }"""
    new_on = """  _onCommand(label) {
    super._onCommand(label);
    if (label !== 'Resonart') return;

    const hero = this._activeHero();
    if (!hero?.resonart || !this._drawer) return;

    // Character-specific Resonart identity always outranks Basic Attack naming.
    this._drawer.title.setText(hero.resonart.name.toUpperCase());
    this._drawer.detail.setText(hero.resonart.flavor || 'A signature technique.');
  }"""
    s = replace_once(s, old_on, new_on, 'Resonart drawer naming')

    old_resolve = """  async _resolveHeroAction(hero, command) {
    if (hero?.id === 'auryi' && command === 'Resonart' && hero.resonart) {
      return this._playAuryiAuroraPulse(hero);
    }
    return super._resolveHeroAction(hero, command);
  }"""
    new_resolve = """  async _resolveHeroAction(hero, command) {
    if (hero?.id === 'auryi' && command === 'Resonart' && hero.resonart) {
      return this._playAuryiAuroraPulse(hero);
    }
    if (hero?.id === 'kineza' && command === 'Resonart' && hero.resonart?.name === 'Thunder Tornado') {
      const handled = await this._playKinezaThunderTornado(hero);
      if (handled) return;
    }
    return super._resolveHeroAction(hero, command);
  }"""
    s = replace_once(s, old_resolve, new_resolve, 'Thunder Tornado dispatch')

    marker = """  _setBanner(msg) {
    const hero = this._activeHero();"""
    methods = r'''  _prepareKinezaThunderVideo() {
    if (!THUNDER_TORNADO_VIDEO_READY || typeof document === 'undefined') return null;
    if (this._kinezaThunderVideo) return this._kinezaThunderVideo;
    const video = document.createElement('video');
    video.src = new URL(THUNDER_TORNADO_VIDEO_PATH, window.location.href).href;
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
      objectFit: 'contain', background: '#020108', zIndex: '2147482990',
      pointerEvents: 'none', opacity: '0', display: 'none',
      transform: 'scale(1.018)', transformOrigin: '50% 50%',
      filter: 'brightness(0.98) contrast(1.04) saturate(1.06)',
      willChange: 'opacity, transform, filter',
      transition: 'opacity 160ms ease, transform 600ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease'
    });
    document.body.appendChild(video);
    video.load();
    this._kinezaThunderVideo = video;
    return video;
  }

  _disposeKinezaThunderVideo() {
    const video = this._kinezaThunderVideo;
    if (!video) return;
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    } catch (err) { /* ignore cleanup errors */ }
    this._kinezaThunderVideo = null;
  }

  _waitForKinezaThunderTime(video, target, timeoutMs = 14000) {
    return new Promise((resolve, reject) => {
      const started = performance.now();
      const tick = () => {
        if (!video || video.error) return reject(new Error('Thunder Tornado video playback error'));
        if (video.currentTime >= target - 0.015) return resolve();
        if (video.ended) return reject(new Error(`Thunder Tornado ended before ${target.toFixed(2)}s`));
        if (performance.now() - started > timeoutMs) return reject(new Error(`Thunder Tornado timed out before ${target.toFixed(2)}s`));
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  _beginKinezaThunderBattlefieldReveal(video) {
    if (!video) return;
    video.style.transition = 'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 520ms ease, filter 260ms ease';
    video.style.opacity = '0.58';
    video.style.transform = 'scale(1.035)';
    video.style.filter = 'brightness(1.08) contrast(1.03) saturate(1.08)';
  }

  _createThunderTornadoLivePass() {
    const w = this.scale.width;
    const h = this.scale.height;
    const enemyX = this.enemyView?.container?.x ?? w * 0.76;
    const enemyY = this.enemyView?.container?.y ?? h * 0.55;
    const startX = w * 0.18;
    const startY = enemyY - h * 0.04;
    const core = this.add.ellipse(startX, startY, w * 0.30, h * 0.13, 0x86ffac, 0.42)
      .setDepth(28).setBlendMode(Phaser.BlendModes.ADD);
    const shellA = this.add.ellipse(startX - w * 0.03, startY, w * 0.34, h * 0.18, 0x000000, 0)
      .setStrokeStyle(Math.max(3, h * 0.010), 0x41ff75, 0.92).setDepth(28.1).setAngle(-8)
      .setBlendMode(Phaser.BlendModes.ADD);
    const shellB = this.add.ellipse(startX - w * 0.06, startY, w * 0.40, h * 0.22, 0x000000, 0)
      .setStrokeStyle(Math.max(2, h * 0.006), 0xd8ffe0, 0.78).setDepth(28.2).setAngle(9)
      .setBlendMode(Phaser.BlendModes.ADD);
    const flash = this.add.ellipse(startX, startY, w * 0.13, h * 0.09, 0xf2fff3, 0.62)
      .setDepth(28.3).setBlendMode(Phaser.BlendModes.ADD);
    const objects = [core, shellA, shellB, flash];
    this.worldAdd(objects);
    objects.forEach((obj, i) => {
      this.tweens.add({
        targets: obj,
        x: enemyX + w * (0.20 + i * 0.015),
        scaleX: 1.15 + i * 0.06,
        scaleY: 0.88 + i * 0.04,
        angle: obj.angle + (i % 2 ? 38 : -34),
        duration: 520 + i * 25,
        ease: 'Cubic.easeIn'
      });
    });
    return { objects, enemyX, enemyY };
  }

  _destroyThunderTornadoLivePass(pass) {
    pass?.objects?.forEach(obj => {
      this.tweens.killTweensOf(obj);
      obj.destroy?.();
    });
  }

  async _playKinezaThunderTornado(hero) {
    const video = this._prepareKinezaThunderVideo();
    if (!video) return false;

    this._turnLock = true;
    this._hideCommandRail();
    this._hideTargetCursor?.();

    const cam = this.cameras.main;
    const cameraState = { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY };
    const base = hero.resonart.damage;
    const low = Math.round(base * 0.85);
    const high = Math.round(base * 1.15);
    const hitRoll = Math.random() < THUNDER_TORNADO_HIT_CHANCE;
    let impactResolved = false;
    let livePass = null;
    let lethal = false;

    this.formation.setPovFocus?.(hero.id, true);
    this.audio.beginCinematicAttack?.();
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    try {
      video.pause();
      try { video.currentTime = 0; } catch (err) { /* metadata settling */ }
      video.style.display = 'block';
      video.style.opacity = '0';
      video.volume = 0;
      const prime = video.play();
      if (prime) await prime;
    } catch (err) {
      console.warn('[PV] Thunder Tornado media prime failed; using generic Resonart fallback:', err);
      this.audio.endCinematicAttack?.();
      this.formation.setPovFocus?.(hero.id, false);
      this._turnLock = false;
      video.style.display = 'none';
      return false;
    }

    const actor = this.formation?.actors?.get?.('kineza');
    const sprite = actor?.sprite;
    const homeY = sprite?.y;
    if (sprite && Number.isFinite(homeY)) {
      this.tweens.add({ targets: sprite, y: homeY - Math.min(16, this.scale.height * 0.03), duration: 220, yoyo: true, ease: 'Sine.easeOut' });
    }
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.045, duration: THUNDER_TORNADO_LIVE_INTRO_MS, ease: 'Sine.easeOut' });
    await this._wait(THUNDER_TORNADO_LIVE_INTRO_MS);

    try {
      try { video.currentTime = 0; } catch (err) { /* keep playing if seek unavailable */ }
      video.volume = this.audio?._effectiveVolume?.('sfx', 1.0) ?? 1;
      video.style.opacity = '1';
      video.style.transform = 'scale(1.018)';
      this.audio.attackGather(hero.id);

      await this._waitForKinezaThunderTime(video, THUNDER_TORNADO_TIMELINE.reveal);
      this._beginKinezaThunderBattlefieldReveal(video);

      await this._waitForKinezaThunderTime(video, THUNDER_TORNADO_TIMELINE.livePass);
      livePass = this._createThunderTornadoLivePass();
      this.audio.attackRelease(hero.id);

      await this._waitForKinezaThunderTime(video, THUNDER_TORNADO_TIMELINE.impact);
      if (hitRoll) {
        const dmg = Phaser.Math.Between(low, high);
        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        lethal = this.enemy.hp <= 0;
        this._updateTargetCard();
        this.enemyView.hit();
        this.cameras.main.shake(145, 0.0065);
        this._floatText(`-${dmg}`, '#D8FFE1');
        this._setBanner(`${hero.name} uses ${hero.resonart.name} for ${dmg} damage!`);
        this.audio.attackImpact(hero.id);
        this.audio.enemyHit();
        if (lethal) {
          this.enemyView.die();
          this.audio.enemyDefeat();
        }
      } else {
        this._setBanner(`${hero.name} uses ${hero.resonart.name} — missed!`);
      }
      impactResolved = true;

      await this._waitForKinezaThunderTime(video, THUNDER_TORNADO_TIMELINE.hide);
    } catch (err) {
      console.warn('[PV] Thunder Tornado Hybrid playback fell back after media error:', err);
      if (!impactResolved) {
        this._destroyThunderTornadoLivePass(livePass);
        try { video.pause(); } catch (e) { /* ignore */ }
        video.style.display = 'none';
        video.style.opacity = '0';
        this.audio.endCinematicAttack?.();
        this.formation.setPovFocus?.(hero.id, false);
        this._turnLock = false;
        return false;
      }
    }

    video.style.transition = 'opacity 120ms linear';
    video.style.opacity = '0';
    await this._wait(120);
    try { video.pause(); video.currentTime = 0; } catch (err) { /* ignore */ }
    video.style.display = 'none';
    video.volume = 0;

    await this._wait(360);
    if (livePass) {
      livePass.objects.forEach(obj => this.tweens.add({ targets: obj, alpha: 0, x: obj.x + this.scale.width * 0.18, duration: 240, ease: 'Sine.easeIn' }));
      await this._wait(240);
      this._destroyThunderTornadoLivePass(livePass);
    }

    this.tweens.add({ targets: cam, zoom: cameraState.zoom, scrollX: cameraState.scrollX, scrollY: cameraState.scrollY, duration: 280, ease: 'Sine.easeInOut' });
    this.formation.setPovFocus?.(hero.id, false);
    this.formation.layout?.();
    this.formation._forceActiveRing?.(this.activeHeroId);
    await this._wait(280);

    if (lethal) await this._wait(240);

    this.audio.endCinematicAttack?.();
    this._turnLock = false;
    this._endHeroTurn();
    return true;
  }

'''
    s = replace_once(s, marker, methods + marker, 'Thunder Tornado methods')

p.write_text(s, encoding='utf-8')

# Authority + witness
authp = ROOT / 'PV_LIVE_AUTHORITY.json'
auth = json.loads(authp.read_text(encoding='utf-8'))
auth['updated'] = '2026-09-08'
auth['witness'] = witness
hard = auth.setdefault('hard_gates', {})
hard['kineza_thunder_tornado_exact_master_required'] = True
hard['kineza_thunder_tornado_must_be_owned_by_k_adapter'] = True
hard['kineza_thunder_tornado_live_enemy_handoff_required'] = True
hard['kineza_thunder_tornado_lethal_home_settle_required'] = True
k = auth.setdefault('kineza', {})
k.update({
    'resonart': 'Thunder Tornado',
    'thunder_tornado_video': master_rel,
    'thunder_tornado_video_sha256': master_sha,
    'thunder_tornado_video_bytes': master_bytes,
    'thunder_tornado_resolution': '910x512',
    'thunder_tornado_fps': 30,
    'thunder_tornado_duration_seconds': 10.006667,
    'thunder_tornado_sync': {
        'live_intro_ms': 520,
        'battlefield_reveal_crossfade': 9.18,
        'live_tornado_pass': 9.40,
        'live_enemy_visual_impact': 9.66,
        'cinematic_hide': 9.92
    },
    'thunder_tornado_audio_policy': 'Generated cinematic contributes SFX only; no generated music or vocals. Existing battle music remains runtime-owned and is ducked by the cinematic controller.',
    'thunder_tornado_handoff_policy': 'Generated cinematic contains no enemy. Final launch crossfades into a live emerald tornado pass through the actual enemy; live runtime owns damage/death and Kineza returns home before Victory.'
})
dev = auth.setdefault('device_evidence', {})
dev['pending_witness'] = witness
dev['pending_iphone_validation'] = True
dev['live28k24_pending_iphone_validation'] = True
dev['pending_gate_summary'] = 'LIVE28K24: Kineza Thunder Tornado exact cinematic + SFX, generated-to-live tornado handoff through the actual enemy, live damage/death, Kineza recovery/home settle before Victory. Preserve accepted LIVE28K23 Aurora V2 and all stable lanes.'
authp.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

buildp = ROOT / 'live-build.json'
build = json.loads(buildp.read_text(encoding='utf-8'))
build['id'] = witness
buildp.write_text(json.dumps(build, indent=2) + '\n', encoding='utf-8')

for name, heading in [('PRIZIM_LIVE_NOTEPAD.md', '## LIVE28K24 Kineza Thunder Tornado'), ('PV_RESUME_ANCHOR.md', '## LIVE28K24 Kineza Thunder Tornado')]:
    p = ROOT / name
    text = p.read_text(encoding='utf-8')
    if witness not in text:
        text += f"\n\n{heading}\n\n- Current promoted witness: `{witness}`.\n- Accepted baseline: LIVE28K23 Auryi Aurora Pulse V2 iPhone MAIN pass.\n- Kineza Resonart: **Thunder Tornado**.\n- Exact master: `{master_rel}` · SHA-256 `{master_sha}` · {master_bytes:,} bytes · 910×512 · ~30 FPS · 10.006667s.\n- Generated clip has SFX only, no generated music/vocals, and no enemy.\n- Hybrid handoff: reveal 9.18s → live tornado pass 9.40s → real enemy impact 9.66s → movie hidden 9.92s → live tornado exits → Kineza returns home.\n- Lethal finish preserves the K22 240ms readable home settle before Victory.\n- iPhone MAIN remains the final gate.\n"
        p.write_text(text, encoding='utf-8')

# Extend PriZim preflight exactly once.
pre = ROOT / 'tools/prizim/preflight_live28k.py'
s = pre.read_text(encoding='utf-8')
if master_rel not in s:
    old = """    'assets/music/Triumph of Light.m4a': (186602, '98c77e8bc536425b8da8ad4212ed26011335c5ac3b9dadbce0ec28c201cca437'),
}"""
    new = f"""    'assets/music/Triumph of Light.m4a': (186602, '98c77e8bc536425b8da8ad4212ed26011335c5ac3b9dadbce0ec28c201cca437'),
    '{master_rel}': ({master_bytes}, '{master_sha}'),
}}"""
    s = replace_once(s, old, new, 'K24 fixed media preflight')

if 'K24 Thunder Tornado runtime token missing' not in s:
    anchor = """if auth.get('kineza', {}).get('lethal_victory_home_settle_ms') != 240:
    errors.append('K22 Kineza settle-before-Victory drift')
"""
    insert = """if auth.get('kineza', {}).get('lethal_victory_home_settle_ms') != 240:
    errors.append('K22 Kineza settle-before-Victory drift')

for token in [
    \"hero?.id === 'kineza' && command === 'Resonart'\",
    'Kineza_ThunderTornado_Resonart_MASTER.mp4',
    'THUNDER_TORNADO_TIMELINE',
    'reveal: 9.18',
    'livePass: 9.40',
    'impact: 9.66',
    'hide: 9.92',
    '_playKinezaThunderTornado',
    '_createThunderTornadoLivePass',
]:
    if token not in k_scene:
        errors.append(f'K24 Thunder Tornado runtime token missing: {token}')

for key in [
    'kineza_thunder_tornado_exact_master_required',
    'kineza_thunder_tornado_must_be_owned_by_k_adapter',
    'kineza_thunder_tornado_live_enemy_handoff_required',
    'kineza_thunder_tornado_lethal_home_settle_required',
]:
    if hard.get(key) is not True:
        errors.append(f'K24 hard gate missing: {key}')

ksync = auth.get('kineza', {}).get('thunder_tornado_sync', {})
for key, expected in {
    'battlefield_reveal_crossfade': 9.18,
    'live_tornado_pass': 9.40,
    'live_enemy_visual_impact': 9.66,
    'cinematic_hide': 9.92,
}.items():
    if abs(float(ksync.get(key, -99)) - expected) > 0.001:
        errors.append(f'K24 Thunder Tornado sync drift: {key}')
"""
    s = replace_once(s, anchor, insert, 'K24 preflight checks')
pre.write_text(s, encoding='utf-8')

print(f'Prepared {witness}: Thunder Tornado runtime + authority transforms complete')
