#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HYBRID = ROOT / 'hybrid-main.html'
AUDIO = ROOT / 'src/PartyBattleAudioController.js'
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'
SYNC = ROOT / 'tools/prizim/sync_live_authority.py'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'K17 patch refused: missing {label}')
    return text.replace(old, new, 1)

# 1) Hybrid boot: transient Pages/Safari fetch hiccups must retry instead of
# immediately becoming a full-screen LIVE BOOT ERROR.
hybrid = HYBRID.read_text(encoding='utf-8')
hybrid = replace_once(
    hybrid,
    "  const read=async url=>{\n    const response=await fetch(url,{cache:'no-store'});\n    if(!response.ok) throw new Error(`${url} · ${response.status}`);\n    return response;\n  };",
    "  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));\n  const read=async (url,attempts=4)=>{\n    let lastErr=null;\n    for(let attempt=1;attempt<=attempts;attempt++){\n      try{\n        const response=await fetch(url,{cache:'no-store'});\n        if(response.ok) return response;\n        lastErr=new Error(`${url} · ${response.status}`);\n      }catch(err){\n        lastErr=err;\n      }\n      if(attempt<attempts) await sleep(180*Math.pow(2,attempt-1));\n    }\n    throw lastErr||new Error(`${url} · fetch failed after ${attempts} attempts`);\n  };",
    'Hybrid boot read helper',
)
HYBRID.write_text(hybrid, encoding='utf-8')

# 2) Audio: distinguish "scheduled" from "actually playing" and provide an
# exact-master recovery path after Safari/WebAudio misses the delayed start.
audio = AUDIO.read_text(encoding='utf-8')
anchor = "  auroraBloomSilence() {\n    if (this._auroraBloom?.isPlaying) this._auroraBloom.pause();\n  }"
insert = "  auroraBloomIsPlaying() {\n    return !!(this._auroraBloom?.isPlaying && !this._auroraBloom?.isPaused);\n  }\n\n  auroraBloomEnsurePlaying() {\n    if (!this.scene.cache.audio.exists(AURORA_BLOOM_KEY)) return false;\n    if (this.auroraBloomIsPlaying()) return true;\n\n    const fire = () => {\n      if (this.auroraBloomIsPlaying()) return true;\n      if (this._auroraBloom) {\n        try { this._auroraBloom.stop(); this._auroraBloom.destroy(); } catch (err) { /* ignore */ }\n      }\n      this._auroraBloom = this.scene.sound.add(AURORA_BLOOM_KEY, {\n        loop: false,\n        volume: this._effectiveVolume('sfx', 1.0)\n      });\n      try {\n        this._auroraBloom.play();\n      } catch (err) {\n        console.warn('[PV] Celestial Bloom watchdog restart failed:', err);\n        return false;\n      }\n      return this.auroraBloomIsPlaying();\n    };\n\n    if (this.scene.sound.locked) {\n      this.scene.sound.once('unlocked', fire);\n      return false;\n    }\n\n    const context = this.scene.sound.context;\n    if (context?.state === 'suspended' && context.resume) {\n      context.resume().then(() => { if (!this.auroraBloomIsPlaying()) fire(); }).catch(() => {});\n    }\n    return fire();\n  }\n\n" + anchor
audio = replace_once(audio, anchor, insert, 'Aurora Bloom silence insertion point')
AUDIO.write_text(audio, encoding='utf-8')

# 3) Beauty runtime: after Invocation has had a short grace window, verify that
# Bloom is genuinely running. If not, restart the exact master immediately.
scene = SCENE.read_text(encoding='utf-8')
scene = replace_once(
    scene,
    "const AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, silence: 4.56, pulse: 5.18, reveal: 6.08, impactReveal: 6.30, reconnect: 6.58, end: 6.65 });",
    "const AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, bloomWatchdog: 0.84, silence: 4.56, pulse: 5.18, reveal: 6.08, impactReveal: 6.30, reconnect: 6.58, end: 6.65 });",
    'Aurora Beauty timeline',
)
scene = replace_once(
    scene,
    "      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);\n      if (!ownsBloom) this.audio.attackGather(hero.id);\n\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.silence);",
    "      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);\n      if (!ownsBloom) this.audio.attackGather(hero.id);\n\n      // K17 iPhone watchdog: scheduling Bloom is not proof Safari actually\n      // started it. Verify shortly after Invocation and recover the exact master\n      // immediately if the delayed WebAudio start was dropped.\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.bloomWatchdog);\n      if (ownsBloom && !this.audio.auroraBloomIsPlaying?.()) {\n        const recovered = this.audio.auroraBloomEnsurePlaying?.() === true;\n        if (!recovered) console.warn('[PV] Celestial Bloom watchdog armed recovery but playback is not yet confirmed.');\n      }\n\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.silence);",
    'Aurora Bloom runtime watchdog',
)
SCENE.write_text(scene, encoding='utf-8')

# 4) Machine authority and device evidence. Preserve K15 success and K16's
# handoff work, but record the K16 phone gate as failed due boot/audio regression.
auth = json.loads(AUTH.read_text(encoding='utf-8'))
auth.setdefault('hard_gates', {})['hybrid_boot_retry_required'] = True
auth['hard_gates']['aurora_bloom_actual_playback_watchdog_required'] = True
aur = auth.setdefault('auryi', {})
aur.setdefault('aurora_beauty_sync', {})['bloom_playback_watchdog'] = 0.84
aur['aurora_bloom_watchdog_policy'] = (
    'Celestial Bloom scheduling is not sufficient evidence of playback on iPhone. '
    'At Beauty time 0.84s, verify the exact master is actually playing; if not, '
    'restart the exact cached master immediately without changing the Beauty video, '
    'compression silence, Pulse timing, or Hybrid handoff.'
)
auth['hybrid_boot_policy'] = (
    'hybrid-main must retry live-build.json and hybrid-battle-live.html no-store fetches '
    'with bounded exponential backoff before surfacing LIVE BOOT ERROR.'
)
device = auth.setdefault('device_evidence', {})
device['live28k16_boot_errors_observed'] = True
device['live28k16_celestial_bloom_inaudible'] = True
device['live28k16_result'] = 'FAIL phone gate: intermittent LIVE BOOT ERROR observed and Celestial Bloom choir did not play.'
device['live28k16_handoff_visual_result'] = 'Not yet accepted/rejected; boot/audio regression must be removed first.'
device['latest_device_witness'] = 'main-20260906-live28k16'
device['latest_device_result'] = device['live28k16_result']
device['pending_gate_summary'] = (
    'LIVE28K17: boot without transient LIVE BOOT ERROR, Aurora Pulse choir must audibly enter, '
    'and the K16 Beauty-to-live battlefield crossfade plus visible enemy impact must remain intact.'
)
device['live28k17_pending_iphone_validation'] = True
AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

# 5) Canonical preflight gains the boot-resilience + actual-playback contract.
pre = PREFLIGHT.read_text(encoding='utf-8')
anchor = "if 'real Hybrid battlefield' not in auth['auryi'].get('aurora_handoff_policy', ''):\n    errors.append('K16 Aurora Hybrid handoff policy missing from machine authority')\n"
addition = anchor + "\n# 8d. K17 resilience guard: transient Hybrid boot fetches retry, and Bloom must\n# be verified as actually playing rather than merely scheduled.\nfor token in [\n    'const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))',\n    'const read=async (url,attempts=4)=>',\n    'for(let attempt=1;attempt<=attempts;attempt++)',\n    'await sleep(180*Math.pow(2,attempt-1))',\n]:\n    if token not in hybrid_main:\n        errors.append(f'K17 Hybrid boot resilience token missing: {token}')\nfor token in [\n    'auroraBloomIsPlaying()',\n    'auroraBloomEnsurePlaying()',\n    \"context?.state === 'suspended'\",\n]:\n    if token not in audio_controller:\n        errors.append(f'K17 Aurora Bloom watchdog audio token missing: {token}')\nfor token in [\n    'bloomWatchdog: 0.84',\n    'AURORA_BEAUTY_TIMELINE.bloomWatchdog',\n    'this.audio.auroraBloomIsPlaying?.()',\n    'this.audio.auroraBloomEnsurePlaying?.()',\n]:\n    if token not in k_scene:\n        errors.append(f'K17 Aurora Bloom runtime watchdog token missing: {token}')\nif auth.get('auryi', {}).get('aurora_beauty_sync', {}).get('bloom_playback_watchdog') != 0.84:\n    errors.append('K17 Bloom playback watchdog must be locked to 0.84s')\nif auth.get('hard_gates', {}).get('hybrid_boot_retry_required') is not True:\n    errors.append('K17 Hybrid boot retry hard gate missing')\nif auth.get('hard_gates', {}).get('aurora_bloom_actual_playback_watchdog_required') is not True:\n    errors.append('K17 Bloom actual-playback hard gate missing')\n"
pre = replace_once(pre, anchor, addition, 'K17 preflight insertion point')
PREFLIGHT.write_text(pre, encoding='utf-8')

# 6) Human ledgers derive latest phone result + pending gate from machine authority,
# rather than hardcoding a particular K witness forever.
sync = SYNC.read_text(encoding='utf-8')
sync = replace_once(
    sync,
    "- LIVE28K15 phone evidence: choir audible = {device.get('live28k15_celestial_bloom_audible', False)}; demo tail absent = {device.get('live28k15_demo_tail_absent', False)}; core presentation passed = {device.get('live28k15_core_aurora_presentation_passed', False)}.\n- Current pending gate: smoother Beauty-to-live battlefield crossfade with visible enemy impact.",
    "- LIVE28K15 core presentation remains recorded as passed: choir audible = {device.get('live28k15_celestial_bloom_audible', False)}; demo tail absent = {device.get('live28k15_demo_tail_absent', False)}.\n- Latest phone evidence ({device.get('latest_device_witness', witness)}): {device.get('latest_device_result', 'pending device evidence')}\n- Current pending gate: {device.get('pending_gate_summary', 'pending iPhone validation')}",
    'generic PriZim device evidence text',
)
sync = replace_once(
    sync,
    "    aurora_gate = f'''## Aurora Pulse live device gate\\n\\n- Current witness: `{witness}`.\\n- K15 phone result: core Beauty presentation passed, Celestial Bloom audible, demo tail absent.\\n- Pending K16 gate: smooth Beauty-to-live battlefield crossfade with real enemy hit/recoil visible during reconnect.\\n- Machine timing authority: `PV_LIVE_AUTHORITY.json` -> `auryi.aurora_beauty_sync`.\\n'''",
    "    aurora_gate = f'''## Aurora Pulse live device gate\\n\\n- Current witness: `{witness}`.\\n- K15 baseline: core Beauty presentation passed, Celestial Bloom audible, demo tail absent.\\n- Latest phone evidence ({device.get('latest_device_witness', witness)}): {device.get('latest_device_result', 'pending device evidence')}\\n- Current pending gate: {device.get('pending_gate_summary', 'pending iPhone validation')}\\n- Machine timing authority: `PV_LIVE_AUTHORITY.json` -> `auryi.aurora_beauty_sync`.\\n'''",
    'generic resume device gate',
)
SYNC.write_text(sync, encoding='utf-8')

print('LIVE28K17 boot resilience + Bloom actual-playback watchdog staged')
