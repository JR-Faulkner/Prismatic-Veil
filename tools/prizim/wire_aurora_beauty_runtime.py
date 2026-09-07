#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'
SYNC = ROOT / 'tools/prizim/sync_live_authority.py'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'

VIDEO_REL = 'assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4'
TIMELINE_REL = 'assets/characters/auryi/animations/aurora_pulse/cinematic/AuroraPulse_Beauty_v1_timeline.json'
VIDEO_SHA = 'e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a'
TIMELINE_SHA = 'fe0116a3068ffb4614188099926ac6ae68affcf22dfcda5723e1b3c7e35f2c58'


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'missing patch marker: {label}')
    return text.replace(old, new, 1)


def wire_scene():
    s = SCENE.read_text(encoding='utf-8')

    if 'AURORA_BEAUTY_VIDEO_PATH' not in s:
        marker = "const TRIUMPH_LIGHT_PATH = './assets/music/Triumph of Light.m4a?pvasset=live28k11-audio';\n"
        insert = marker + "const AURORA_BEAUTY_VIDEO_READY = true;\nconst AURORA_BEAUTY_VIDEO_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4?pvasset=live28k14-beauty';\nconst AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, silence: 4.56, pulse: 5.18, reconnect: 6.82, end: 7.375 });\n"
        s = replace_once(s, marker, insert, 'beauty constants')

    if 'this._prepareAuroraBeautyVideo();' not in s:
        marker = "    if (this.activeHeroId) this.formation.setActive(this.activeHeroId);\n\n"
        insert = marker + "    // Prewarm the exact Beauty V1 cinematic inside the live Hybrid/K scene.\n    this._prepareAuroraBeautyVideo();\n    this.events.once('shutdown', () => this._disposeAuroraBeautyVideo());\n\n"
        s = replace_once(s, marker, insert, 'beauty preload')

    if '__PV_LIVE28K_AURORA_BEAUTY_VIDEO__' not in s:
        marker = "    globalThis.__PV_LIVE28K_AURORA_MOCK_PORT__ = true;\n"
        insert = marker + "    globalThis.__PV_LIVE28K_AURORA_BEAUTY_VIDEO__ = true;\n"
        s = replace_once(s, marker, insert, 'beauty runtime flag')

    if '_playAuryiAuroraPulseBeauty' not in s:
        marker = "  async _resolveHeroAction(hero, command) {\n"
        methods = r'''  _prepareAuroraBeautyVideo() {
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
      transition: 'opacity 90ms linear'
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
    video.style.opacity = '0';
    await this._wait(fadeMs);
    try { video.pause(); } catch (err) { /* ignore */ }
    video.style.display = 'none';
    try { video.currentTime = 0; } catch (err) { /* ignore */ }
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

    this.audio.beginCinematicAttack?.();
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    try {
      video.pause();
      try { video.currentTime = 0; } catch (err) { /* metadata may still be settling */ }
      video.style.display = 'block';
      video.style.opacity = '0';
      const playPromise = video.play();
      if (playPromise) await playPromise;
      requestAnimationFrame(() => { video.style.opacity = '1'; });

      // Beauty V1 is the presentation clock. Starting Bloom at Invocation and
      // pausing it for the approved compression pocket makes its 5.48s master
      // land almost exactly at the 6.82s battlefield-reconnect beat.
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);
      ownsBloom = this.audio.auroraBloomStart?.() === true;
      if (!ownsBloom) this.audio.attackGather(hero.id);

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.silence);
      if (ownsBloom) this.audio.auroraBloomSilence?.();

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.pulse);
      if (ownsBloom) this.audio.auroraBloomResume?.();
      else this.audio.attackRelease(hero.id);

      if (hitRoll) {
        const dmg = Phaser.Math.Between(low, high);
        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        this._updateTargetCard();
        this.enemyView.hit();
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
      impactResolved = true;

      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reconnect);
      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.end, 14000);
    } catch (err) {
      console.warn('[PV] Aurora Beauty V1 playback fell back to Hybrid mock:', err);
      if (ownsBloom) this.audio.auroraBloomStop?.(120);
      this.audio.endCinematicAttack?.();
      await this._hideAuroraBeautyVideo(video, 40);
      if (!impactResolved) {
        this._turnLock = false;
        return false;
      }
    }

    if (ownsBloom) this.audio.auroraBloomStop?.(120);
    await this._hideAuroraBeautyVideo(video, 90);
    this.audio.endCinematicAttack?.();
    this._turnLock = false;
    this._endHeroTurn();
    return true;
  }

'''
        s = replace_once(s, marker, methods + marker, 'beauty methods')

    branch_marker = "  async _playAuryiAuroraPulse(hero) {\n    this._turnLock = true;\n"
    if "const handled = await this._playAuryiAuroraPulseBeauty(hero);" not in s:
        branch = "  async _playAuryiAuroraPulse(hero) {\n    if (AURORA_BEAUTY_VIDEO_READY) {\n      const handled = await this._playAuryiAuroraPulseBeauty(hero);\n      if (handled) return;\n    }\n\n    // Fail-safe only: preserve the already-approved Hybrid mock if native video\n    // playback is unavailable on a device. Never substitute the old Aurorb Slice poses.\n    this._turnLock = true;\n"
        s = replace_once(s, branch_marker, branch, 'beauty primary branch')

    SCENE.write_text(s, encoding='utf-8')


def update_authority():
    auth = json.loads(AUTH.read_text(encoding='utf-8'))
    hg = auth.setdefault('hard_gates', {})
    hg['aurora_beauty_primary_must_use_exact_verified_master'] = True
    hg['aurora_beauty_must_remain_inside_hybrid_k_adapter'] = True
    a = auth.setdefault('auryi', {})
    a['aurora_presentation'] = 'Beauty V1 hybrid-video primary; Phaser mock fallback only'
    a['aurora_beauty_video'] = VIDEO_REL
    a['aurora_beauty_video_sha256'] = VIDEO_SHA
    a['aurora_beauty_video_bytes'] = 3400903
    a['aurora_beauty_resolution'] = '1920x1080'
    a['aurora_beauty_fps'] = 24
    a['aurora_beauty_duration_seconds'] = 7.375
    a['aurora_beauty_timeline'] = TIMELINE_REL
    a['aurora_beauty_timeline_sha256'] = TIMELINE_SHA
    a['aurora_beauty_sync'] = {
        'battlefield_handoff': 0.0,
        'celestial_bloom_start': 0.70,
        'compression_silence': 4.56,
        'pulse_release_and_damage': 5.18,
        'battlefield_reconnect': 6.82,
        'return_to_battle': 7.375,
    }
    evidence = auth.setdefault('device_evidence', {})
    evidence['aurora_beauty_v1_exact_master_installed'] = True
    evidence['aurora_beauty_v1_hybrid_runtime_pending_iphone_validation'] = True
    AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')


def update_sync_script():
    s = SYNC.read_text(encoding='utf-8')
    old = "- Approved composition/timing reference: `pz-a-aurora-pulse-lab.html`.\n- Celestial Bloom production audio is installed and has already played correctly on iPhone evidence.\n"
    new = "- Approved composition/timing reference: `pz-a-aurora-pulse-lab.html`.\n- **Primary live presentation:** exact `Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4` inside the Hybrid/K adapter. Verified 1920×1080 H.264, 24 FPS, 7.375s, SHA-256 `e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a`.\n- Beauty V1 timing authority: handoff 0.00s -> Bloom starts 0.70s -> compression silence 4.56s -> Pulse/damage 5.18s -> reconnect 6.82s -> return 7.375s.\n- The Phaser Aurora mock is now fail-safe presentation only if native video playback fails. The old Aurorb Slice pose sequence is never an Aurora Pulse fallback.\n- Celestial Bloom production audio is installed and has already played correctly on iPhone evidence.\n"
    if new not in s:
        s = replace_once(s, old, new, 'sync beauty authority bullets')
    old2 = "- Current exact 01–08 production PNG lane remains gated until the approved transparent bytes are restored; missing numbered PNGs do **not** authorize replacing the approved mock choreography with a simple float-only fallback.\n"
    new2 = "- The exact 01–08 standalone PNG lane remains an archival/editable production lane. It is **not a prerequisite for the current live cinematic**, because Beauty V1 is the already-approved composite built from those approved poses. The user supplied and previously separated that frame material; never reclassify it as missing delivery.\n"
    if new2 not in s:
        s = replace_once(s, old2, new2, 'sync frame clarification')
    SYNC.write_text(s, encoding='utf-8')


def update_preflight():
    s = PREFLIGHT.read_text(encoding='utf-8')
    if 'Aurora Beauty V1 exact master' not in s:
        marker = "# 8. Future crown authority must preserve the corrected splash-screen hover semantics.\n"
        block = r'''# 8. Aurora Beauty V1 exact master is the primary live cinematic presentation.
beauty_video = pathlib.Path('assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4')
beauty_timeline = pathlib.Path('assets/characters/auryi/animations/aurora_pulse/cinematic/AuroraPulse_Beauty_v1_timeline.json')
beauty_expected = {
    beauty_video: (3400903, 'e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a'),
    beauty_timeline: (1345, 'fe0116a3068ffb4614188099926ac6ae68affcf22dfcda5723e1b3c7e35f2c58'),
}
for rel, (size, digest) in beauty_expected.items():
    p = ROOT / rel
    if not p.exists():
        errors.append(f'missing Aurora Beauty V1 production asset: {rel}')
        continue
    if p.stat().st_size != size:
        errors.append(f'Aurora Beauty V1 size drift: {rel} = {p.stat().st_size}, expected {size}')
    actual = sha256(rel)
    if actual != digest:
        errors.append(f'Aurora Beauty V1 SHA drift: {rel} = {actual}, expected {digest}')

for token in [
    'AURORA_BEAUTY_VIDEO_READY = true',
    'AURORA_BEAUTY_VIDEO_PATH',
    'AURORA_BEAUTY_TIMELINE',
    '_playAuryiAuroraPulseBeauty',
    'const handled = await this._playAuryiAuroraPulseBeauty(hero)',
    "objectFit: 'contain'",
    'invocation: 0.70',
    'silence: 4.56',
    'pulse: 5.18',
    'reconnect: 6.82',
    'end: 7.375'
]:
    if token not in k_scene:
        errors.append(f'K adapter missing Aurora Beauty V1 runtime token: {token}')
if 'Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4' in base_scene:
    errors.append('Aurora Beauty V1 leaked into standalone PartyBattleScene')

if beauty_timeline.exists():
    try:
        beauty = json.loads((ROOT / beauty_timeline).read_text(encoding='utf-8'))
        if beauty.get('resolution') != '1920x1080' or beauty.get('fps') != 24:
            errors.append('Aurora Beauty V1 timeline metadata drifted from 1920x1080 / 24 FPS authority')
        beats = {b['label']: (float(b['start']), float(b['end'])) for b in beauty.get('beats', [])}
        expected_beats = {
            'Battlefield Handoff': (0.0, 0.7),
            'Invocation': (0.7, 1.55),
            'Compression Silence': (4.56, 5.18),
            'Pulse Release': (5.18, 6.82),
            'Battlefield Reconnect': (6.82, 7.4),
        }
        for label, expected in expected_beats.items():
            if beats.get(label) != expected:
                errors.append(f'Aurora Beauty V1 timeline beat drift: {label} = {beats.get(label)}, expected {expected}')
    except Exception as exc:
        errors.append(f'could not validate Aurora Beauty V1 timeline: {exc}')

'''
        s = replace_once(s, marker, block + marker.replace('# 8.', '# 9.'), 'preflight beauty block')
        s = s.replace('# 9. Human PriZim ledger must explicitly state the Hybrid hard gate.', '# 10. Human PriZim ledger must explicitly state the Hybrid hard gate.')
        s = s.replace('# 10. Aurora 01-08 durability gate:', '# 11. Aurora 01-08 durability gate:')
        s = s.replace("print('Aurora Pulse authority: K adapter + approved mock choreography + crownless')", "print('Aurora Pulse authority: exact Beauty V1 Hybrid video primary + Phaser mock fail-safe + crownless')")
    PREFLIGHT.write_text(s, encoding='utf-8')


def main():
    for rel in [VIDEO_REL, TIMELINE_REL]:
        if not (ROOT / rel).exists():
            raise SystemExit(f'missing verified Beauty V1 asset before runtime wire: {rel}')
    wire_scene()
    update_authority()
    update_sync_script()
    update_preflight()
    print('Aurora Beauty V1 Hybrid runtime wiring prepared.')


if __name__ == '__main__':
    main()
