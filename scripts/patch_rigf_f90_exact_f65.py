#!/usr/bin/env python3
from pathlib import Path
import subprocess

ANCHOR='70a7016c50ca4375cd77eca92e920adc3e0d6933'
SRC='mugen-lab/rig-f.html'
DST=Path('mugen-lab/rig-f7.html')

# F9.0 is intentionally based on the exact F6.5 iPhone visual witness.
s=subprocess.check_output(['git','show',f'{ANCHOR}:{SRC}'],text=True)

required=[
    '<title>MobMugen · Rig F · F6.5</title>',
    'MOBMUGEN · RIG F · F6.5',
    '<h2>Rig F · F6.5</h2>',
    'RAF LOCK · LOCAL ROOT',
    "root=fullWine1.7.55-v8",
    "inline-default-ondemand-root-overlay=wine1.7.55-v8-min-online",
    "app=userapp.zip",
    "p=Winmugen.exe",
    "RIGF F6.5: RAF main loop forced",
    "RIGF F6.5: eglSwapInterval ",
]
missing=[x for x in required if x not in s]
if missing:
    raise SystemExit('F9.0 F6.5 anchor point missing: '+' | '.join(missing))

# Display/version-only edits. Runtime behavior remains the exact F6.5 path.
s=s.replace('<title>MobMugen · Rig F · F6.5</title>','<title>MobMugen · Rig F · F9.0</title>',1)
s=s.replace('MOBMUGEN · RIG F · F6.5','MOBMUGEN · RIG F · F9.0',1)
s=s.replace('<h2>Rig F · F6.5</h2>','<h2>Rig F · F9.0</h2>',1)
s=s.replace('RAF LOCK · LOCAL ROOT','EXACT F6.5 VISUAL ANCHOR',1)
s=s.replace('F6.5 witness log','F9.0 witness log',1)
s=s.replace(
    'F6.5 keeps the full local Wine root and pinned WASM path, then locks EGL swap timing to requestAnimationFrame so a later swapInterval(0) cannot kick the main loop back to timeout mode.',
    'F9.0 is the exact F6.5 visual runtime that previously rendered real WinMUGEN on iPhone: legacy pinned BoxedWine, local Wine 1.7.55 root, lean userapp FS, and RAF/swap lock. No modern JIT/Wine 3.1 changes are mixed into this recovery witness.',
    1
)
# Copy-trace header only. Leave all internal F6.5 lineage markers untouched.
s=s.replace("const text='MOBMUGEN · RIG F · F6.5\\nRUNTIME STATUS · '","const text='MOBMUGEN · RIG F · F9.0\\nRUNTIME STATUS · '",1)

DST.write_text(s,encoding='utf-8')
print('F9.0 generated from exact F6.5 visual anchor',ANCHOR)
