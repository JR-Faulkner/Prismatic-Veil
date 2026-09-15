#!/usr/bin/env python3
from pathlib import Path
import sys
import zipfile

if len(sys.argv) not in (2, 3):
    raise SystemExit('usage: make_perf_fixture.py /path/to/Winmugen.exe [output.zip]')

exe = Path(sys.argv[1])
if not exe.is_file():
    raise SystemExit(f'compiled benchmark missing: {exe}')

if len(sys.argv) == 3:
    out = Path(sys.argv[2])
else:
    out = Path(__file__).with_name('fixtures') / 'prizim_ddraw_perf_fixture.zip'
out.parent.mkdir(parents=True, exist_ok=True)

files = {
    'WinMugen/Winmugen.exe': exe.read_bytes(),
    'WinMugen/data/mugen.cfg': b'[Video]\nWidth = 320\nHeight = 240\nDepth = 16\n',
    'WinMugen/data/system.def': b'[Info]\nname = PriZim DirectDraw Perf Fixture\n',
    'WinMugen/data/select.def': b'[Characters]\n',
    'WinMugen/font/f-4x6.fnt': b'fixture-font',
    'WinMugen/sound/system.snd': b'fixture-sound',
    'WinMugen/plugins/readme.txt': b'PriZim deterministic DirectDraw workload',
}

with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name, data in files.items():
        z.writestr(name, data)

print(out)
print({'exe_bytes': exe.stat().st_size, 'zip_bytes': out.stat().st_size})
