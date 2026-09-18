#!/usr/bin/env python3
"""Build the synthetic MUGEN content zip used by runtime_probe.mjs.

Mirrors tools/prizim/mobmugen/make_fixture.py's role for the BoxedWine
lane: deliberately tiny, not a stand-in for a real ~1.7GB install. It
exists to exercise the Ikemen lane's real code paths cheaply --
select.def parsing (including junk/blank entries, matching what real
rosters carry), the top-level wrapper-folder strip, the lazy VFS index,
and the character/stage picker -- not to validate real character content.
"""
from pathlib import Path
import zipfile

out = Path(__file__).with_name('fixtures') / 'prizim_ikemen_fixture.zip'
out.parent.mkdir(parents=True, exist_ok=True)

# select.def deliberately includes unresolvable/junk lines (zzznotreal*,
# a missing extra-stage) alongside two real, resolvable characters and one
# real stage -- this is the same shape every real roster has shown across
# every phone test this lane has run, and is what the picker's roster
# discovery / findCharDefKey / findStageDefKey logic needs to filter
# correctly.
select_def = (
    "[Characters]\n"
    "zzznotreal1, stages/stage9.def\n"
    "zzznotreal2\n"
    "mole\n"
    "g.ken\n"
    "zzznotreal3\n"
    "\n"
    "[ExtraStages]\n"
    "stages/zzzmissing.def\n"
    "stages/cfjed_warzard.def\n"
)
system_def = (
    "[Select Info]\n"
    "rows = 5\n"
    "columns = 6\n"
    "showemptyboxes = 1\n"
    "\n"
    "[Next]\n"
    "foo = 1\n"
)

files = {
    'Winmugen/Winmugen.exe': b'MZ' + b'PRIZIM-IKEMEN-FIXTURE' * 64,
    'Winmugen/mugen.cfg': b'[Config]\n',
    'Winmugen/data/system.def': system_def.encode(),
    'Winmugen/data/select.def': select_def.encode(),
    'Winmugen/chars/mole/mole.def': b'x',
    'Winmugen/chars/g.ken/g.ken.def': b'x',
    'Winmugen/stages/cfjed_warzard.def': b'x',
    'Winmugen/stages/cfjed_warzard.sff': b'x',
    'Winmugen/font/f-4x6.fnt': b'x',
}

with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name, data in files.items():
        z.writestr(name, data)
print(out)
