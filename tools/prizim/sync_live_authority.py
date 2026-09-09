#!/usr/bin/env python3
# LIVE28K26: re-run ledger synchronization after Prismel Resonart promotion.
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
AUTH_PATH = ROOT / 'PV_LIVE_AUTHORITY.json'
NOTEPAD_PATH = ROOT / 'PRIZIM_LIVE_NOTEPAD.md'
RESUME_PATH = ROOT / 'PV_RESUME_ANCHOR.md'


def replace_section(text: str, heading: str, replacement: str) -> str:
    start = text.find(heading)
    if start == -1:
        return text
    next_heading = text.find('\n## ', start + len(heading))
    if next_heading == -1:
        return text[:start] + replacement.rstrip() + '\n'
    return text[:start] + replacement.rstrip() + '\n\n' + text[next_heading + 1:]


def main():
    auth = json.loads(AUTH_PATH.read_text(encoding='utf-8'))
    witness = auth['witness']
    updated = auth['updated']

    hybrid_gate = '''## HYBRID STACK HARD GATE

- **ALL live battle/cinematic production work stays inside the Hybrid stack.**
- Canonical live chain: `index.html` / `story-scroll.html` -> `hybrid-main.html` -> `hybrid-battle-live.html` -> import-map rewrite -> numeric LIVE28K K adapters.
- Numeric LIVE28K battle authority: `src/prizim/Live28K2PartyBattleScene.js`.
- Numeric LIVE28K formation authority: `src/prizim/Live28K7PartyFormationView.js`.
- `src/PartyBattleScene.js` is a generic/base scene, **not** the production endpoint for new LIVE28K cinematic features.
- `pz-a-aurora-pulse-lab.html` is the approved Aurora Pulse composition/timing mock. It is reference authority, not a live entry page. Integrate its choreography through the Hybrid/K adapter stack while preserving Hybrid HUD/state publication, audio controller, camera ownership, targeting/damage, and return-to-battle semantics.
- Before any live cinematic write, read `PV_LIVE_AUTHORITY.json`, `PV_RESUME_ANCHOR.md`, `PRIZIM_LIVE_NOTEPAD.md`, `live-build.json`, `hybrid-main.html`, and `hybrid-battle-live.html`. If those are not checked, **do not write production code yet**.
- Run `python tools/prizim/preflight_live28k.py` before promotion. CI runs the same contract automatically.
- `.github/workflows/prizim-hybrid-stack-guard.yml` rejects Hybrid-route regressions.
'''

    aur = auth.get('auryi', {})
    beat = aur.get('aurora_beauty_sync', {})
    device = auth.get('device_evidence', {})
    current_aurora = f'''## Auryi Resonart / Aurora Pulse current lane

- Basic Attack authority remains **Aurorb Slice**.
- Resonart authority is **Aurora Pulse**.
- Aurora Pulse live production belongs in the Hybrid/K adapter stack, not standalone `PartyBattleScene.js`.
- Approved composition/timing reference: `pz-a-aurora-pulse-lab.html`.
- **Primary live presentation:** exact `Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4` inside the Hybrid/K adapter. Verified 1920×1080 H.264, 24 FPS, 7.375s, SHA-256 `e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a`.
- **K20 cinematic presentation:** no move-title card. Hybrid directs the exact Beauty V1 master with live-camera commitment, expansion/compression framing, Pulse-driven reconnect, Auryi re-entry wave, live enemy reaction, and residual Aurora afterglow.
- The K19 title-card PNG is retained as an archived/reference asset only and is not loaded by Aurora Pulse runtime.
- Live sync is derived from `PV_LIVE_AUTHORITY.json`: Bloom {beat.get('celestial_bloom_scheduled_from_user_gesture', 0.70):.2f}s -> silence {beat.get('compression_silence', 4.56):.2f}s -> Pulse/damage logic {beat.get('pulse_release_and_damage_logic', 5.18):.2f}s -> battlefield reveal {beat.get('battlefield_reveal_crossfade', 6.08):.2f}s -> live enemy impact {beat.get('live_enemy_visual_impact', 6.30):.2f}s -> reconnect {beat.get('live_battlefield_reconnect', 6.58):.2f}s -> Beauty hidden {beat.get('beauty_video_hidden_before_demo_tail', 6.65):.2f}s.
- The real Hybrid battlefield owns the final handoff and enemy reaction; the Beauty master's baked demo reconnect tail is never displayed.
- The Phaser Aurora mock is fail-safe presentation only if native video playback fails. The old Aurorb Slice pose sequence is never an Aurora Pulse fallback.
- Celestial Bloom owns the cinematic foreground mix; normal battle BGM clears underneath it.
- Triumph of Light loops while the victory/results screen remains open.
- Aurora Pulse itself remains **crownless**.
- LIVE28K18 core presentation is recorded as passed: boot clean = {device.get('live28k18_boot_clean', False)}; Bloom audible = {device.get('live28k18_celestial_bloom_audible', False)}; battlefield/enemy handoff accepted = {device.get('live28k18_battlefield_enemy_handoff_accepted', False)}.
- Latest phone evidence ({device.get('latest_device_witness', witness)}): {device.get('latest_device_result', 'pending device evidence')}
- Current pending gate: {device.get('pending_gate_summary', 'pending iPhone validation')}
- Future non-Aurora crown authority: match the Main Splash Screen crown as a **hovered/offset element above Auryi**, not head-worn.
'''

    notepad = NOTEPAD_PATH.read_text(encoding='utf-8')
    notepad = re.sub(r'Last refreshed: .*', f'Last refreshed: {updated}', notepad, count=1)
    notepad = re.sub(
        r'Current promoted build: `[^`]+`[^\n]*',
        f'Current promoted build: `{witness}` — **Hybrid production authority; iPhone evidence remains final runtime gate.**',
        notepad,
        count=1,
    )
    notepad = re.sub(r'- Current witness: `[^`]+`\.', f'- Current witness: `{witness}`.', notepad, count=1)

    if '## HYBRID STACK HARD GATE' in notepad:
        notepad = replace_section(notepad, '## HYBRID STACK HARD GATE', hybrid_gate)
    else:
        marker = '## Battle authorities\n'
        if marker not in notepad:
            raise RuntimeError('PriZim notepad is missing Battle authorities marker')
        notepad = notepad.replace(marker, hybrid_gate + '\n\n' + marker, 1)

    if '## Auryi Resonart / Aurora Pulse next lane' in notepad:
        notepad = replace_section(notepad, '## Auryi Resonart / Aurora Pulse next lane', current_aurora)
    elif '## Auryi Resonart / Aurora Pulse current lane' in notepad:
        notepad = replace_section(notepad, '## Auryi Resonart / Aurora Pulse current lane', current_aurora)
    else:
        marker = '## Kineza\n'
        if marker not in notepad:
            raise RuntimeError('PriZim notepad is missing Kineza marker')
        notepad = notepad.replace(marker, current_aurora + '\n\n' + marker, 1)

    NOTEPAD_PATH.write_text(notepad, encoding='utf-8')

    resume = RESUME_PATH.read_text(encoding='utf-8')
    resume = re.sub(r'- Promoted witness: `[^`]+`', f'- Promoted witness: `{witness}`', resume, count=1)
    safeguard = '''## Hybrid production safeguard

- Live battle/cinematic production must remain inside `hybrid-main.html` -> `hybrid-battle-live.html` -> numeric LIVE28K K adapters.
- Read `PV_LIVE_AUTHORITY.json` first. Run `python tools/prizim/preflight_live28k.py` before promotion.
- `pz-a-aurora-pulse-lab.html` is choreography/composition authority only; integrate it through the Hybrid stack rather than promoting it or rebuilding it in a disconnected standalone scene.
'''
    if '## Hybrid production safeguard' in resume:
        resume = replace_section(resume, '## Hybrid production safeguard', safeguard)
    else:
        marker = '\n## Hard constraints'
        if marker in resume:
            resume = resume.replace(marker, '\n' + safeguard + marker, 1)
        else:
            resume += '\n\n' + safeguard
    aurora_gate = f'''## Aurora Pulse live device gate\n\n- Current witness: `{witness}`.\n- K18 baseline: core Beauty presentation, native Celestial Bloom, and live battlefield/enemy handoff passed on iPhone.\n- K19 phone review: full-screen title presentation was rejected because it interrupted cinematic continuity.
- K20 presentation: title removed; Hybrid camera/framing and Pulse-driven battlefield re-entry are the active polish lane.
\n- Latest phone evidence ({device.get('latest_device_witness', witness)}): {device.get('latest_device_result', 'pending device evidence')}\n- Current pending gate: {device.get('pending_gate_summary', 'pending iPhone validation')}\n- Machine timing authority: `PV_LIVE_AUTHORITY.json` -> `auryi.aurora_beauty_sync`.\n'''
    if '## Aurora Pulse live device gate' in resume:
        resume = replace_section(resume, '## Aurora Pulse live device gate', aurora_gate)
    else:
        marker = '\n## Hard constraints'
        if marker in resume:
            resume = resume.replace(marker, '\n' + aurora_gate + marker, 1)
        else:
            resume += '\n\n' + aurora_gate

    RESUME_PATH.write_text(resume, encoding='utf-8')

    print(f'PriZim ledgers synchronized to {witness}')


if __name__ == '__main__':
    main()
