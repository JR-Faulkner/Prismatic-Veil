#!/usr/bin/env python3
"""Static preflight for the Ikemen lane (mugen-lab/rig-ikemen-*).

Mirrors tools/prizim/mobmugen/preflight.py's role for the BoxedWine lane:
catch page/script regressions cheaply, before any browser or phone time
is spent. Unlike the BoxedWine lane, this lane's rigs are single-level
string-patch wrappers over a shared base (rig-ikemen-3.js) that fetch and
rewrite the base's own source at runtime -- so what actually matters here
is (1) the base's patch points the wrappers depend on still exist, and
(2) no rig ships a stale build-number label baked into its own patch text.

That second check exists because it already happened twice in a row on
this lane (I16 missed it in two spots; I17 caught them only by grepping
generically). This preflight makes that generic grep permanent instead of
something a human has to remember to do by hand each time.
"""
from pathlib import Path
import re, sys, json

ROOT = Path(__file__).resolve().parents[3]
MUGEN_LAB = ROOT / 'mugen-lab'
NOTES = MUGEN_LAB / 'IKEMEN_FAI_LIVE_NOTES.md'

def find_current_rig():
    """The highest-numbered rig-ikemen-N.html/.js pair on disk is the
    current build by construction -- every new rig increments past every
    prior one, including ones marked 'bad builds, do not use' in the live
    notes (those stay on disk for history but are never the highest
    number once a later rig exists)."""
    nums = []
    for p in MUGEN_LAB.glob('rig-ikemen-*.html'):
        m = re.match(r'rig-ikemen-(\d+)\.html$', p.name)
        if m:
            nums.append(int(m.group(1)))
    if not nums:
        return None
    n = max(nums)
    return n, MUGEN_LAB / f'rig-ikemen-{n}.html', MUGEN_LAB / f'rig-ikemen-{n}.js'

n, html_path, js_path = (None, None, None)
result = find_current_rig()
checks = {}
failed_reasons = []

if result is None:
    checks['rig_files_found'] = False
    failed_reasons.append('no rig-ikemen-N.html files found under mugen-lab/')
else:
    n, html_path, js_path = result
    checks['rig_files_found'] = True
    checks['html_exists'] = html_path.exists()
    checks['js_exists'] = js_path.exists()

    html_text = html_path.read_text(encoding='utf-8') if html_path.exists() else ''
    js_text = js_path.read_text(encoding='utf-8') if js_path.exists() else ''

    # --- base patch points: the wrapper's own runtime throws a named
    # error if any of these go missing, but that only surfaces in a
    # browser. Catch it here first, for free.
    base_path = MUGEN_LAB / 'rig-ikemen-3.js'
    base_text = base_path.read_text(encoding='utf-8') if base_path.exists() else ''
    checks['base_exists'] = base_path.exists()
    checks['base_has_canvas_id'] = 'ikemen-canvas' in (MUGEN_LAB / 'rig-ikemen-3.html').read_text(encoding='utf-8')
    checks['base_has_bindPress'] = 'function bindPress(el, codes)' in base_text
    checks['base_has_selectItem'] = 'function selectItem(mode, idx)' in base_text
    checks['base_has_lazyMaterialize'] = 'async function lazyMaterialize(path)' in base_text
    checks['base_has_boot_anchor'] = "async function boot() {\n    if (started) return;" in base_text
    checks['base_has_startMatch_hide'] = "document.getElementById('setup').classList.add('hide');\n    boot();" in base_text

    # --- the actual recurring trap: a stale I<N> (N < current) baked
    # into the CURRENT rig's own patch text. Two intentional exceptions:
    # (1) the top-of-wrapper src.replaceAll('I3 ', 'I<N> ') / ('I3_', ...)
    # lines, which necessarily mention the literal base placeholder 'I3 '
    # as their own search argument -- that mechanism is what PREVENTS the
    # trap, not an instance of it; (2) the READY message's own prose
    # listing prior rigs by name (e.g. "on top of I13/I14/I15/I16 fixes"),
    # matched as a slash-joined run of I-numbers rather than a single
    # log-line prefix.
    lines_sans_replaceall = '\n'.join(
        l for l in js_text.split('\n') if 'replaceAll(' not in l
    )
    prose_run = re.compile(r'I\d+(?:/I\d+)+')
    js_sans_prose = prose_run.sub('', lines_sans_replaceall)
    stale_pattern = re.compile(r'I(\d+)(?=[\s\'"·])')
    stale_hits = sorted(set(
        int(m.group(1)) for m in stale_pattern.finditer(js_sans_prose)
        if int(m.group(1)) != n
    ))
    checks['no_stale_rig_labels'] = len(stale_hits) == 0
    if stale_hits:
        failed_reasons.append(f'stale rig label(s) found in rig-ikemen-{n}.js: I{", I".join(map(str, stale_hits))} (current rig is I{n})')

    # --- the current rig's own number must actually appear somewhere in
    # its generated output (proves the wrapper isn't a no-op / totally
    # broken template).
    checks['current_rig_label_present'] = f'I{n} ' in js_text or f"'I{n}" in js_text

    # The page wrapper must fetch base rig-ikemen-3.html directly -- never
    # a prior numbered rig's own page. Wrapper-on-wrapper is what made I11
    # fail to run at all (documented in the live notes); every rig since
    # has deliberately stayed single-level.
    fetch_match = re.search(r"fetch\('\./(rig-ikemen-\d+\.html)", html_text)
    checks['html_fetches_a_rig_page'] = fetch_match is not None
    if fetch_match:
        checks['html_targets_base'] = fetch_match.group(1) == 'rig-ikemen-3.html'
        if fetch_match.group(1) != 'rig-ikemen-3.html':
            failed_reasons.append(
                f'rig-ikemen-{n}.html fetches {fetch_match.group(1)} instead of the base rig-ikemen-3.html -- wrapper-on-wrapper, the exact pattern that broke I11')
    else:
        checks['html_targets_base'] = False

    # Likewise the generated <script>'s own base fetch, inside the .js file.
    js_base_match = re.search(r"const base = '\./(rig-ikemen-\d+\.js)", js_text)
    checks['js_fetches_a_rig_script'] = js_base_match is not None
    if js_base_match:
        checks['js_targets_base'] = js_base_match.group(1) == 'rig-ikemen-3.js'
        if js_base_match.group(1) != 'rig-ikemen-3.js':
            failed_reasons.append(
                f'rig-ikemen-{n}.js fetches {js_base_match.group(1)} instead of the base rig-ikemen-3.js -- wrapper-on-wrapper')
    else:
        checks['js_targets_base'] = False

    # --- cross-check against the live notes' own "Current anchor" so the
    # doc and the actual highest-numbered file can't silently drift apart.
    if NOTES.exists():
        notes_text = NOTES.read_text(encoding='utf-8')
        anchor_match = re.search(r'Test next: RIG I(\d+)', notes_text)
        checks['live_notes_anchor_found'] = anchor_match is not None
        if anchor_match:
            anchor_n = int(anchor_match.group(1))
            checks['live_notes_anchor_matches_highest_file'] = anchor_n == n
            if anchor_n != n:
                failed_reasons.append(
                    f'IKEMEN_FAI_LIVE_NOTES.md anchor says I{anchor_n} but the highest rig-ikemen-N.html on disk is I{n} -- '
                    'update the anchor, or this is testing a rig nobody is being told to test')
    else:
        checks['live_notes_anchor_found'] = False
        failed_reasons.append('IKEMEN_FAI_LIVE_NOTES.md not found')

failed = [k for k, v in checks.items() if not v]
report = {
    'suite': 'PriZim MOBMUGEN-IKEMEN preflight',
    'current_rig': f'I{n}' if n is not None else None,
    'checks': checks,
    'passed': not failed,
    'failed': failed,
    'reasons': failed_reasons,
}
print(json.dumps(report, indent=2))
sys.exit(1 if failed else 0)
