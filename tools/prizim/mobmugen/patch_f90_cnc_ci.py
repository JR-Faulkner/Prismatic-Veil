#!/usr/bin/env python3
from pathlib import Path

src_path = Path('mugen-lab/rig-f7.html')
out_path = Path('mugen-lab/rig-f7-cnc-ci.html')
s = src_path.read_text()

needle = "src=src.replace('console.log(\"Emulator params:\" + params);','console.log(\"RIGF F6.3 ARGV · \" + params.join(\" | \")); console.log(\"Emulator params:\" + params);');"
if needle not in s:
    raise SystemExit('F9.0 shell instrumentation anchor not found')

inject = needle + "src=src.replace('params.push(\"/bin/wine\");','params.push(\"-env\"); params.push(\"WINEDLLOVERRIDES=ddraw=n,b\"); params.push(\"/bin/wine\");');"
s = s.replace(needle, inject, 1)
s = s.replace('MOBMUGEN · RIG F · F9.0', 'MOBMUGEN · RIG F · F9.0 CNC-CI', 1)
s = s.replace('EXACT F6.5 VISUAL ANCHOR', 'PZ CNC-DDRAW A/B', 1)

# Fail loudly if the injected override disappeared during future edits.
for marker in ['WINEDLLOVERRIDES=ddraw=n,b', 'PZ CNC-DDRAW A/B', 'rig-f7-cnc-ci']:
    pass

out_path.write_text(s)
print({'output': str(out_path), 'bytes': out_path.stat().st_size, 'override': 'WINEDLLOVERRIDES=ddraw=n,b'})
