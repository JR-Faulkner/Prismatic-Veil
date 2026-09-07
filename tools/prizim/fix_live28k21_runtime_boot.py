#!/usr/bin/env python3
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f'K21 patch refused: missing {label}')
    return text.replace(old, new, 1)


def main():
    scene = SCENE.read_text(encoding='utf-8')

    broken_dispose = '''  _disposeAuroraBeautyVideo() {
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
'''
    safe_dispose = '''  _disposeAuroraBeautyVideo() {
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
'''
    scene = replace_once(scene, broken_dispose, safe_dispose, 'broken Aurora Beauty dispose block')

    camera_anchor = '''    ownsBloom = this.audio.auroraBloomStart?.(AURORA_BEAUTY_TIMELINE.invocation) === true;
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    try {
'''
    camera_fixed = '''    ownsBloom = this.audio.auroraBloomStart?.(AURORA_BEAUTY_TIMELINE.invocation) === true;
    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);

    // K21: live-camera commitment belongs to the active Aurora action, never
    // to DOM-video disposal. All referenced state is valid in this scope.
    this.tweens.killTweensOf(cam);
    this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.05, duration: 170, ease: 'Sine.easeOut' });
    await this._wait(110);
    this.formation.setPovFocus?.(hero.id, true);

    try {
'''
    scene = replace_once(scene, camera_anchor, camera_fixed, 'Aurora Beauty action camera anchor')
    SCENE.write_text(scene, encoding='utf-8')

    auth = json.loads(AUTH.read_text(encoding='utf-8'))
    auth['updated'] = '2026-09-07'
    hard = auth.setdefault('hard_gates', {})
    hard['aurora_dispose_cleanup_must_not_contain_cinematic_state'] = True
    hard['k21_camera_commit_must_live_inside_aurora_action'] = True

    device = auth.setdefault('device_evidence', {})
    device['live28k20_pending_iphone_validation'] = False
    device['live28k20_unexpected_live_battle_error'] = True
    device['live28k20_result'] = 'FAIL runtime gate: iPhone reported Unexpected live battle error. Root cause isolated to misplaced K20 camera-commit code inside _disposeAuroraBeautyVideo().' 
    device['latest_device_witness'] = 'main-20260907-live28k20'
    device['latest_device_result'] = device['live28k20_result']
    device['pending_witness'] = 'main-20260907-live28k21'
    device['pending_iphone_validation'] = True
    device['live28k21_pending_iphone_validation'] = True
    device['pending_gate_summary'] = 'LIVE28K21: battle must boot cleanly on iPhone with no Unexpected live battle error; then Aurora Pulse should retain K20 camera/framing, exact Beauty V1, native Celestial Bloom, re-entry wave, Wraith reaction, and residual afterglow.'
    device['promotion_reason'] = 'Hotfix K20 phone runtime failure by moving Aurora camera-commit code out of _disposeAuroraBeautyVideo() and into _playAuryiAuroraPulseBeauty(), where hero/cam/cameraState are valid and await is legal. Preserve all K20 presentation work and K18 native-media reliability. Add a permanent cleanup-scope guard.'
    AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

    pre = PREFLIGHT.read_text(encoding='utf-8')
    marker = "# 9. Future crown authority must preserve the corrected splash-screen hover semantics.\n"
    if marker not in pre:
        raise RuntimeError('K21 patch refused: preflight insertion marker missing')
    k21_guard = r'''# 8h. K21 runtime-boot regression guard. DOM-video disposal is cleanup-only;
# cinematic camera state must live in the active Aurora action scope.
dispose_match = re.search(r"  _disposeAuroraBeautyVideo\(\) \{(.*?)\n  \}\n\n  _waitForAuroraBeautyTime", k_scene, re.S)
if not dispose_match:
    errors.append('K21 Aurora Beauty dispose method missing/unreadable')
else:
    dispose_body = dispose_match.group(1)
    for forbidden in ['await ', 'cameraState', 'hero.id', 'killTweensOf(cam)', 'targets: cam']:
        if forbidden in dispose_body:
            errors.append(f'K21 cleanup-scope regression: forbidden cinematic token inside _disposeAuroraBeautyVideo(): {forbidden}')
    for required in ['video.pause();', "video.removeAttribute('src');", 'video.load();', 'video.remove();']:
        if required not in dispose_body:
            errors.append(f'K21 Aurora Beauty cleanup token missing: {required}')

action_match = re.search(r"  async _playAuryiAuroraPulseBeauty\(hero\) \{(.*?)\n  \}\n\n  async _resolveHeroAction", k_scene, re.S)
if not action_match:
    errors.append('K21 Aurora Beauty action method missing/unreadable')
else:
    action_body = action_match.group(1)
    for required in [
        'const cam = this.cameras.main;',
        'const cameraState = { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY };',
        'this.tweens.killTweensOf(cam);',
        'zoom: cameraState.zoom * 1.05',
        'await this._wait(110);',
        'this.formation.setPovFocus?.(hero.id, true);',
    ]:
        if required not in action_body:
            errors.append(f'K21 Aurora action camera-commit token missing: {required}')
if auth.get('hard_gates', {}).get('aurora_dispose_cleanup_must_not_contain_cinematic_state') is not True:
    errors.append('K21 cleanup-scope hard gate missing')
if auth.get('hard_gates', {}).get('k21_camera_commit_must_live_inside_aurora_action') is not True:
    errors.append('K21 camera-commit scope hard gate missing')
if auth.get('device_evidence', {}).get('live28k20_unexpected_live_battle_error') is not True:
    errors.append('K21 machine authority lost K20 iPhone runtime failure evidence')

'''
    pre = pre.replace(marker, k21_guard + marker, 1)
    PREFLIGHT.write_text(pre, encoding='utf-8')

    print('LIVE28K21 runtime boot hotfix applied.')


if __name__ == '__main__':
    main()
