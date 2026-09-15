#!/usr/bin/env python3
from pathlib import Path
import argparse, json, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('trace')
ap.add_argument('--json-out')
args = ap.parse_args()
text = Path(args.trace).read_text(encoding='utf-8', errors='replace')

signals = {
    'video': 'WINMUGEN VIDEO ✓' in text or 'FIRST FRAME CHANGE' in text,
    'input': bool(re.search(r'INPUT · .* · (DELIVERED|SDL ACK ✓)', text)),
    'local_root_ready': 'LOCAL ROOT READY' in text,
    'wine31_loaded': 'Loaded TinyCore15Wine3.1.zip' in text,
    'jit_written_code_guard': '-disableWasmJitForWrittenCode' in text,
    'mono_prompt_or_log': bool(re.search(r'Wine Mono|mono', text, re.I)),
    'gecko_missing_or_prompt': bool(re.search(r'wine-gecko|Gecko', text, re.I)),
    'nested_invalidation': 'nested code invalidation preparation' in text,
    'commit_invalidation': 'commitPreparedCodeInvalidation' in text,
    'fatal_oob': 'Out of bounds memory access' in text,
    'wasm_exception': 'Exception thrown, see JavaScript console' in text,
}

invalidations = len(re.findall(r'nested code invalidation preparation', text))
inputs = len(re.findall(r'INPUT · ', text))
status = 'PASS'
reason = []
if signals['fatal_oob']:
    status = 'FAIL'
    reason.append('fatal WASM out-of-bounds crash')
elif signals['nested_invalidation']:
    status = 'WARN'
    reason.append('JIT invalidation warnings present')
if not signals['video']:
    status = 'FAIL'
    reason.append('no WinMUGEN video witness')

report = {
    'suite':'PriZim MOBMUGEN trace analysis',
    'status':status,
    'signals':signals,
    'counts':{'input_events':inputs,'nested_invalidation_lines':invalidations},
    'reason':reason,
}
out = json.dumps(report, indent=2)
print(out)
if args.json_out:
    Path(args.json_out).write_text(out+'\n', encoding='utf-8')
sys.exit(1 if status == 'FAIL' else 0)
