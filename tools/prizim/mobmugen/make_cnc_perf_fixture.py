#!/usr/bin/env python3
from pathlib import Path
import sys
import zipfile

if len(sys.argv) != 4:
    raise SystemExit('usage: make_cnc_perf_fixture.py /path/to/Winmugen.exe /path/to/cnc-ddraw-dir output.zip')

exe = Path(sys.argv[1])
cnc = Path(sys.argv[2])
out = Path(sys.argv[3])
if not exe.is_file():
    raise SystemExit(f'benchmark exe missing: {exe}')
if not cnc.is_dir():
    raise SystemExit(f'cnc-ddraw dir missing: {cnc}')

dll = cnc / 'ddraw.dll'
ini = cnc / 'ddraw.ini'
if not dll.is_file():
    raise SystemExit(f'cnc-ddraw ddraw.dll missing: {dll}')
if not ini.is_file():
    raise SystemExit(f'cnc-ddraw ddraw.ini missing: {ini}')

out.parent.mkdir(parents=True, exist_ok=True)
base_files = {
    'WinMugen/Winmugen.exe': exe.read_bytes(),
    'WinMugen/data/mugen.cfg': b'[Video]\nWidth = 320\nHeight = 240\nDepth = 16\n',
    'WinMugen/data/system.def': b'[Info]\nname = PriZim CNC DirectDraw Perf Fixture\n',
    'WinMugen/data/select.def': b'[Characters]\n',
    'WinMugen/font/f-4x6.fnt': b'fixture-font',
    'WinMugen/sound/system.snd': b'fixture-sound',
    'WinMugen/plugins/readme.txt': b'PriZim cnc-ddraw DirectDraw workload',
    'WinMugen/ddraw.dll': dll.read_bytes(),
    'WinMugen/ddraw.ini': ini.read_bytes(),
}

with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name, data in base_files.items():
        z.writestr(name, data)

print(out)
print({
    'exe_bytes': exe.stat().st_size,
    'ddraw_dll_bytes': dll.stat().st_size,
    'ddraw_ini_bytes': ini.stat().st_size,
    'zip_bytes': out.stat().st_size,
})
