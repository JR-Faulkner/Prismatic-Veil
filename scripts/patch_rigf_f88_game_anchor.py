#!/usr/bin/env python3
from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text(encoding='utf-8')

required=[
    'MOBMUGEN · RIG F · F8.7',
    'MobMugen · Rig F · F8.7',
    'FALLBACK · BOOT RECOVERY',
    "const F7_CORE='./boxedwine-f83-fallback/'",
    'RIGF F8.7: CFG READY',
    'F8.7 INPUT · ',
    'TinyCore15Wine3.1',
    'VIDEO ACTIVE · VERIFY MUGEN',
]
missing=[x for x in required if x not in s]
if missing:
    raise SystemExit('F8.8 patch point missing: '+' | '.join(missing))

# Game-first recovery. Preserve current ZIP streaming, CFG normalization, controls and Wine 3.1.
s=s.replace('F8.7','F8.8')
s=s.replace('FALLBACK · BOOT RECOVERY','GAME ANCHOR · KNOWN-GOOD JIT')
s=s.replace(
    'F8.8 keeps the proven non-JIT fallback, ZIP stream, CFG selector and controls, while restoring the simpler launch/presentation path from the known-good WinMUGEN-running branch.',
    'F8.8 restores the modern BoxedWine JIT core from the last branch that visibly rendered WinMUGEN, while preserving the newer ZIP stream, CFG path fix and controller plumbing. Game first; performance tuning follows from this anchor.'
)

# Restore the exact modern JIT core family that produced visible WinMUGEN on iPhone.
s=s.replace("const F7_CORE='./boxedwine-f83-fallback/'","const F7_CORE='./boxedwine-f7/'",1)

# Keep witness honest: canvas activity is not enough to claim title, but log which core is under test.
s=s.replace(
    "log('F8.8 VIDEO CHANGE · FALLBACK CANVAS ACTIVE');log('F8.8 CPU MODE · BOXEDWINE NON-JIT FALLBACK');log('F8.8 BOOT RECOVERY · F7.9.2 launch params restored · env override removed');",
    "log('F8.8 VIDEO CHANGE · JIT CANVAS ACTIVE');log('F8.8 CPU MODE · BOXEDWINE WASM JIT BASELINE');log('F8.8 GAME ANCHOR · F7.9.2 JIT core restored · current CFG/input plumbing preserved');",
    1
)

p.write_text(s,encoding='utf-8')
print('Patched rig-f7.html to F8.8 game-anchor mode')
