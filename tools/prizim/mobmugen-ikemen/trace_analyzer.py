#!/usr/bin/env python3
"""Classify a real, phone-copied Ikemen-lane trace (COPY TRACE output).

Mirrors tools/prizim/mobmugen/trace_analyzer.py's role for the BoxedWine
lane. Every signal below was written against an ACTUAL trace pasted
during this lane's I13-I17 development, not invented speculatively:

- stale rig labels: the exact bug that shipped in I16 twice (I14 PICKER
  under I16) and was caught only by manually reading the trace.
- overlay removed with 0 assets: the exact I16 load-gate bug (removed
  after 357ms, 0 lazy assets materialized -- fixed in I17).
- silent stop mid-load: the exact signature of the suspected iOS Safari
  memory-pressure crash -- a trace that ends abruptly during the eager
  "LOADING N" phase with no ZIP ERROR, no crash log, nothing. This can't
  be proven from a trace alone (PriZim's BoxedWine doc already states the
  same limitation for its own lane: it cannot reproduce iPhone Safari
  memory pressure), but it CAN be flagged reliably as a pattern worth a
  human's attention instead of being missed in a wall of noise.
- stray PICKER routing after match start: the exact I13 bug (canvas
  visible, picker still receiving input) if it ever regresses.
- stuck held keys: the exact symptom quarter-circles were blocked by
  before I14.

Known, deliberately-ignored noise (documented in the live notes' "Known
runtime noise" section, NOT a target -- flagged only as a count, never a
failure): "Failed to add char: blank" / "Failed to add stage" spam from
Ikemen's own internal select.def re-parse.
"""
from pathlib import Path
import argparse, json, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('trace')
ap.add_argument('--json-out')
args = ap.parse_args()
text = Path(args.trace).read_text(encoding='utf-8', errors='replace')

# The current rig this trace claims to be running, from its own banner
# line ("MOBMUGEN · IKEMEN · RIG I17 ...") or the first I<N> log prefix.
rig_match = re.search(r'RIG I(\d+)', text) or re.search(r'\bI(\d+) (?:VFS ARMED|READY)', text)
current_rig = int(rig_match.group(1)) if rig_match else None

stale_labels = sorted(set(
    int(m.group(1)) for m in re.finditer(r'\bI(\d+) (CTRL|CONTROLS|PICKER|LOAD OVERLAY)', text)
    if current_rig is not None and int(m.group(1)) != current_rig
))

overlay_shown = 'LOAD OVERLAY' in text and 'shown' in text
overlay_removed_matches = list(re.finditer(
    r'LOAD OVERLAY \xb7 removed after (\d+)ms \(([^)]*)\), (\d+) lazy asset\(s\) materialized', text))
overlay_removed_with_zero_assets = any(int(m.group(3)) == 0 for m in overlay_removed_matches)
overlay_removed_via_hard_timeout = any('hard timeout' in m.group(2) for m in overlay_removed_matches)
overlay_shown_never_removed = overlay_shown and not overlay_removed_matches

match_start_idx = text.find('starting match:')
after_start = text[match_start_idx:] if match_start_idx >= 0 else ''
stray_picker_routing = 'routed to PICKER' in after_start

# Stuck-key heuristic: the LAST "held:" value in the trace, if the trace
# has any control activity at all, should read "none" -- anything else at
# the very end (not mid-sequence, where a key legitimately being held
# between events is normal) suggests something never got released.
held_matches = list(re.finditer(r'held: ([^\n]*)', text))
last_held_nonempty = held_matches[-1].group(1).strip() if held_matches else None
stuck_at_end = bool(last_held_nonempty) and last_held_nonempty != 'none'

# Silent-stop-mid-load: COPY TRACE's own RUNTIME STATUS header froze on
# "LOADING <n>" (the eager-load loop's own status() ticker, which never
# calls log() -- it only ever reaches the copied text via this one header
# line, not the TRACE body) with no ZIP ERROR, no crash log, no further
# milestone anywhere in the trace body. This is the exact shape of the
# suspected iOS Safari memory-pressure kill diagnosed during I17: the JS
# runtime was terminated by the OS, which by definition produces no
# catchable error for our own code to log -- so the absence of any
# failure message is itself the signal, not a lack of one.
status_match = re.search(r'^RUNTIME STATUS \xb7 (.+)$', text, re.M)
runtime_status = status_match.group(1).strip() if status_match else None
status_frozen_loading = bool(runtime_status and re.match(r'^LOADING \d+$', runtime_status))
zip_error_present = 'ZIP ERROR' in text or 'BOOT ERROR' in text or 'WRAPPER ERROR' in text
crashed_or_exited = bool(re.search(r'GO\.RUN (RETURNED|THREW)|CRASHED \xb7 SEE TRACE|EXITED \xb7 SEE TRACE', text))
reached_wasm_or_further = bool(re.search(r'WASM INSTANTIATED|PICKER \xb7|MILESTONE \xb7', text))
silent_stop_suspected = (
    status_frozen_loading
    and not zip_error_present
    and not crashed_or_exited
    and not reached_wasm_or_further
)

noise_blank_char = len(re.findall(r'Failed to add char: blank', text))
noise_blank_stage = len(re.findall(r'Failed to add stage\. File read error', text))

signals = {
    'current_rig': f'I{current_rig}' if current_rig is not None else None,
    'stale_rig_labels': stale_labels,
    'overlay_shown': overlay_shown,
    'overlay_removed_with_zero_assets': overlay_removed_with_zero_assets,
    'overlay_removed_via_hard_timeout': overlay_removed_via_hard_timeout,
    'overlay_shown_never_removed': overlay_shown_never_removed,
    'stray_picker_routing_after_match_start': stray_picker_routing,
    'stuck_key_at_end_of_trace': stuck_at_end,
    'stuck_key_value': last_held_nonempty if stuck_at_end else None,
    'silent_stop_mid_load_suspected': silent_stop_suspected,
    'runtime_status_header': runtime_status,
}

status = 'PASS'
reasons = []

if stale_labels:
    status = 'FAIL'
    reasons.append(f"stale rig label(s) I{', I'.join(map(str, stale_labels))} in a trace running I{current_rig}")
if overlay_removed_with_zero_assets:
    status = 'FAIL'
    reasons.append('load overlay removed itself with 0 lazy assets materialized -- the exact I16 bug, should not recur on I17+')
if silent_stop_suspected:
    status = 'FAIL'
    reasons.append(
        'trace ends abruptly mid "LOADING N" with no error, crash, or exit logged -- the signature of an OS-level tab '
        'kill (most likely iOS Safari memory pressure), not a JS-catchable failure. This cannot be fixed by inspecting '
        'the trace further; it needs a real-device memory investigation.')
if stray_picker_routing:
    status = 'FAIL'
    reasons.append('a control press routed to PICKER after the match had already started -- I13 routing regression')
if stuck_at_end:
    status = 'WARN' if status == 'PASS' else status
    reasons.append(f'trace ends with a key still reported held ({last_held_nonempty}) -- possible stuck-control regression')
if overlay_removed_via_hard_timeout:
    status = 'WARN' if status == 'PASS' else status
    reasons.append('load overlay removed via hard timeout, not settling -- either a genuinely stuck load, or the timeout margin needs raising')
if overlay_shown_never_removed:
    status = 'WARN' if status == 'PASS' else status
    reasons.append('load overlay was shown but the trace never shows it being removed -- may just be a truncated/mid-load copy, or the match may still be loading')

report = {
    'suite': 'PriZim MOBMUGEN-IKEMEN trace analysis',
    'status': status,
    'signals': signals,
    'counts': {
        'known_noise_blank_char_lines': noise_blank_char,
        'known_noise_blank_stage_lines': noise_blank_stage,
        'overlay_removal_events': len(overlay_removed_matches),
    },
    'reasons': reasons,
    'note': 'Known runtime noise (blank char/stage lines above) is real but deliberately not a failure signal -- see the live notes.',
}
out = json.dumps(report, indent=2)
print(out)
if args.json_out:
    Path(args.json_out).write_text(out + '\n', encoding='utf-8')
sys.exit(1 if status == 'FAIL' else 0)
