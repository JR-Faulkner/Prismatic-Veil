#!/usr/bin/env python3
from pathlib import Path

p = Path('mugen-lab/rig-f7.html')
s = p.read_text(encoding='utf-8')

required = [
    'MobMugen · Rig F · F8.2',
    'MOBMUGEN · RIG F · F8.2',
    "const F7_CORE='./boxedwine-f7/'",
    "'disableWasmJitForWrittenCode=true'",
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('F8.3 patch point missing: ' + ' | '.join(missing))

s = s.replace('MobMugen · Rig F · F8.2', 'MobMugen · Rig F · F8.3')
s = s.replace('MOBMUGEN · RIG F · F8.2', 'MOBMUGEN · RIG F · F8.3')
s = s.replace('Rig F · F8.2', 'Rig F · F8.3')
s = s.replace('F8.2 witness log', 'F8.3 witness log')
s = s.replace('WASM JIT · STABILITY + INPUT', 'HYBRID FALLBACK · NON-JIT CORE')
s = s.replace('F8.2 keeps the proven JIT + Wine 3.1 path, protects rewritten x86 code from WASM-JIT reuse, and keeps the working touch/gamepad controls.',
              'F8.3 keeps the proven Wine 3.1, ZIP streamer, video, and controls, but swaps only the CPU core to BoxedWine non-JIT fallback for a clean stability A/B.')
s = s.replace("const F7_CORE='./boxedwine-f7/'", "const F7_CORE='./boxedwine-f83-fallback/'")
s = s.replace("'disableWasmJitForWrittenCode=true',", '')
s = s.replace('F8.2 INPUT · ', 'F8.3 INPUT · ')
s = s.replace('RIGF F8.2:', 'RIGF F8.3:')
s = s.replace('F8.2 ROOT · ', 'F8.3 ROOT · ')
s = s.replace('F8.2 FIRST FRAME CHANGE · JIT VIDEO LIVE', 'F8.3 FIRST FRAME CHANGE · FALLBACK VIDEO LIVE')
s = s.replace("log('F8.2 JIT STABILITY · disableWasmJitForWrittenCode=true');", "log('F8.3 CPU MODE · BOXEDWINE NON-JIT FALLBACK');")
s = s.replace('F8.2 MONO SUPPRESS · ', 'F8.3 MONO SUPPRESS · ')
s = s.replace('F8.2 PERF WITNESS · ', 'F8.3 PERF WITNESS · ')
s = s.replace('MOBMUGEN · RIG F · F8.1\\nRUNTIME STATUS · ', 'MOBMUGEN · RIG F · F8.3\\nRUNTIME STATUS · ')

p.write_text(s, encoding='utf-8')
print('Patched rig-f7.html to F8.3 non-JIT fallback')
