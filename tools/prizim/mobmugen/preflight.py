#!/usr/bin/env python3
from pathlib import Path
import re, sys, json

ROOT = Path(__file__).resolve().parents[3]
page = ROOT / 'mugen-lab' / 'rig-f7.html'
text = page.read_text(encoding='utf-8')

checks = {
    'page_exists': page.exists(),
    'modern_boxedwine_core': "./boxedwine-f7/" in text,
    'wine31_root': 'TinyCore15Wine3.1' in text,
    'no_legacy_wine_root': 'fullWine1.7.55-v8.zip' not in text,
    'no_legacy_overlay_param': 'wine1.7.55-v8-min-online.zip' not in text,
    'full_d_drive_program_path': 'd%3A%5CWinMugen%5CWinmugen.exe' in text,
    'memory_storage': 'storage=memory' in text,
    'jit_written_code_guard': 'disableWasmJitForWrittenCode=true' in text,
    'local_root_parts': all(x in text for x in [
        'TinyCore15Wine3.1.zip.part00',
        'TinyCore15Wine3.1.zip.part01',
        'TinyCore15Wine3.1.zip.part02',
    ]),
    'input_controls_present': all(x in text for x in ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyZ', 'Enter']),
    'copy_trace_present': 'COPY TRACE' in text,
}

m = re.search(r'MOBMUGEN · RIG F · ([^<\\n]+)', text)
version = m.group(1).strip() if m else 'UNKNOWN'
failed = [k for k,v in checks.items() if not v]
report = {'suite':'PriZim MOBMUGEN preflight','version':version,'checks':checks,'passed':not failed,'failed':failed}
print(json.dumps(report, indent=2))
sys.exit(1 if failed else 0)
