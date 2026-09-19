#!/usr/bin/env python3
"""Static preflight for the Ikemen lane (mugen-lab/rig-ikemen-*).

Mirrors tools/prizim/mobmugen/preflight.py's role for the BoxedWine lane:
catch page/script regressions cheaply, before any browser or phone time
is spent. This lane has two valid build shapes for its current rig:

- WRAPPER (I4 through most builds, including DAI's Kineza input-gate
  lineage): single-level string-patch wrappers over a shared base
  (rig-ikemen-3.js) that fetch and rewrite the base's own source at
  runtime. What matters here is (1) the base's patch points the
  wrapper depends on still exist, and (2) the wrapper fetches the base
  directly, never another numbered rig (wrapper-on-wrapper is what
  broke I11).
- COLLAPSED/STATIC (I29 on): a plain, self-contained HTML/JS pair with
  no runtime fetch+patch step at all -- the file already contains the
  fully materialized code. I29 was produced by mechanically running a
  wrapper rig's own patch pipeline once, offline, rather than by hand,
  specifically to retire the fetch+patch mechanism for this lane going
  forward while DAI's automation (which still targets rig-ikemen-3.js
  as its base) continues unaffected on its own numbered rigs. What
  matters here is that the file itself -- not a separate base -- has
  the essential runtime pieces the engine depends on.

Across both shapes: no rig ships a stale build-number label baked into
its own patch text. That check exists because it already happened twice
in a row on this lane (I16 missed it in two spots; I17 caught them only
by grepping generically). This preflight makes that generic grep
permanent instead of something a human has to remember to do by hand.
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
is_wrapper = None
result = find_current_rig()
checks = {}
failed_reasons = []
warnings = []

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

    # --- detect which of the two valid build shapes the current rig is.
    # A wrapper's .js always declares its own base fetch target as
    # `const base = './rig-ikemen-N.js...'`; a collapsed/static build has
    # no such declaration because it never fetches anything.
    is_wrapper = re.search(r"const base = '\./rig-ikemen-\d+\.js", js_text) is not None
    # Metadata, not a pass/fail check -- surfaced in the report so it's
    # visible which shape is current, without making one shape "wrong".

    if is_wrapper:
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
    else:
        # --- a collapsed/static build has no separate base -- the file
        # IS the base, so the same essential-pieces checks run directly
        # against its own text instead of a fetched-and-patched target.
        # Some patch-time renames (e.g. lazyMaterialize gaining an
        # activity-ping call, boot() gaining a load-overlay helper ahead
        # of it) are expected here and don't change what these checks
        # actually verify: the named function/anchor still exists.
        checks['base_exists'] = True  # no separate base file to require
        checks['base_has_canvas_id'] = 'ikemen-canvas' in html_text
        checks['base_has_bindPress'] = 'function bindPress(el, codes)' in js_text
        checks['base_has_selectItem'] = 'function selectItem(mode, idx)' in js_text
        checks['base_has_lazyMaterialize'] = 'async function lazyMaterialize(path)' in js_text
        checks['base_has_boot_anchor'] = 'async function boot() {\n    if (started) return;' in js_text
        checks['base_has_startMatch_hide'] = "document.getElementById('setup').classList.add('hide');" in js_text

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

    if is_wrapper:
        # The page wrapper must fetch base rig-ikemen-3.html directly --
        # never a prior numbered rig's own page. Wrapper-on-wrapper is
        # what made I11 fail to run at all (documented in the live
        # notes); every wrapper rig since has deliberately stayed
        # single-level.
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
    else:
        # A collapsed/static build's whole point is NOT fetching another
        # rig at runtime -- verify that's actually true (proves it's
        # genuinely self-contained, not just missing the `const base =`
        # declaration while still fetching something ad hoc elsewhere).
        stray_html_fetch = re.search(r"fetch\('\./rig-ikemen-\d+\.html", html_text)
        stray_js_fetch = re.search(r"fetch\('\./rig-ikemen-\d+\.js", js_text)
        checks['static_html_has_no_rig_fetch'] = stray_html_fetch is None
        checks['static_js_has_no_rig_fetch'] = stray_js_fetch is None
        if stray_html_fetch:
            failed_reasons.append(
                f'rig-ikemen-{n}.html is a collapsed/static build but still fetches another rig page at runtime -- '
                'not actually self-contained')
        if stray_js_fetch:
            failed_reasons.append(
                f'rig-ikemen-{n}.js is a collapsed/static build but still fetches another rig script at runtime -- '
                'not actually self-contained')

    # --- cross-check against the live notes' own "Current anchor" so a
    # doc that's lost its pointer entirely gets caught. The anchor line
    # reads "Test next: RIG I<N>" while a rig is awaiting its phone test,
    # and switches to a result phrasing ("RIG I<N> ... -- CONFIRMED ...")
    # once that test has happened -- both forms name the current rig, so
    # accept either.
    #
    # This used to hard-require anchor_n == n (the single highest number
    # on disk), and after that broke down (see below) hard-required the
    # anchored file to at least exist in the checkout. Both turned out to
    # assume one branch holds every rig anyone has ever built, which is
    # no longer true: two contributors (this session's GUI/base-file
    # work, and DAI's Kineza input-gate lineage) advance the same shared
    # rig-ikemen-N numbering on separate branches, and a feature branch
    # legitimately only carries the numbered rigs its own author built --
    # it was never supposed to carry the other side's. Requiring an exact
    # match, or even requiring the anchored file to exist in whichever
    # branch happens to be checked out, fails on totally healthy states.
    # What this check can still usefully verify without assuming a single
    # shared file set: that the doc has SOME recognizable current-rig
    # anchor at all -- a doc that's lost its pointer entirely (blank,
    # deleted, garbled) is the one state worth actually blocking on.
    # Whether that anchor's number is stale is now purely informational.
    if NOTES.exists():
        notes_text = NOTES.read_text(encoding='utf-8')
        anchor_match = (re.search(r'Test next: RIG I(\d+)', notes_text)
                        or re.search(r'^\*\*RIG I(\d+)\b', notes_text, re.M))
        checks['live_notes_anchor_found'] = anchor_match is not None
        if anchor_match is None:
            failed_reasons.append(
                'IKEMEN_FAI_LIVE_NOTES.md has no recognizable current-rig anchor -- expected either '
                '"Test next: RIG I<N>" or a bolded "**RIG I<N> ..." line under Current anchor')
        if anchor_match:
            anchor_n = int(anchor_match.group(1))
            anchor_path = MUGEN_LAB / f'rig-ikemen-{anchor_n}.html'
            if not anchor_path.exists():
                warnings.append(
                    f'IKEMEN_FAI_LIVE_NOTES.md anchor says I{anchor_n}, which does not exist in this checkout -- '
                    'expected if this branch simply never carried that build (e.g. a Kineza-lineage rig on a '
                    'branch that only touches the shared base/GUI files); if it should exist, that is real drift')
            elif anchor_n != n:
                warnings.append(
                    f'IKEMEN_FAI_LIVE_NOTES.md anchor says I{anchor_n} but the highest rig-ikemen-N.html in this '
                    f'checkout is I{n} -- both exist here, most likely two contributors advancing the shared rig '
                    'numbering concurrently; update the anchor when convenient, this does not block the build')
    else:
        checks['live_notes_anchor_found'] = False
        failed_reasons.append('IKEMEN_FAI_LIVE_NOTES.md not found')

failed = [k for k, v in checks.items() if not v]
report = {
    'suite': 'PriZim MOBMUGEN-IKEMEN preflight',
    'current_rig': f'I{n}' if n is not None else None,
    'current_rig_shape': ('wrapper' if is_wrapper else 'collapsed-static') if is_wrapper is not None else None,
    'checks': checks,
    'passed': not failed,
    'failed': failed,
    'reasons': failed_reasons,
    'warnings': warnings,
}
print(json.dumps(report, indent=2))
sys.exit(1 if failed else 0)
