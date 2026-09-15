#!/usr/bin/env python3
from pathlib import Path
import zipfile

out = Path(__file__).with_name('fixtures') / 'prizim_winmugen_fixture.zip'
out.parent.mkdir(parents=True, exist_ok=True)
files = {
    'WinMugen/Winmugen.exe': b'MZ' + b'PRIZIM-FIXTURE' * 64,
    # F8.5 authority: the primary config lives beside the executable under data/.
    'WinMugen/data/mugen.cfg': b'[Video]\nWidth = 320\nHeight = 240\n',
    # Deliberate nested decoy. The selector must NOT mistake this for the primary cfg.
    'WinMugen/data/EVE Battle/data/mugen.cfg': b'[Video]\nWidth = 999\nHeight = 999\n',
    'WinMugen/data/system.def': b'[Info]\nname = PriZim Fixture\n',
    'WinMugen/data/select.def': b'[Characters]\n',
    'WinMugen/font/f-4x6.fnt': b'fixture-font',
    'WinMugen/sound/system.snd': b'fixture-sound',
    'WinMugen/plugins/readme.txt': b'fixture-plugin',
}
for i in range(64):
    files[f'WinMugen/data/pz_{i:03d}.def'] = (f'; PriZim synthetic payload {i}\n').encode() * 32
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name, data in files.items():
        z.writestr(name, data)
print(out)
