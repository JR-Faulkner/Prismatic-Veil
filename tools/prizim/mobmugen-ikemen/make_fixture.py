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
import struct
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
    "lz5dummy\n"
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

def _rle8_constant(pixel_count, color):
    out = bytearray(struct.pack("<I", pixel_count))
    remain = pixel_count
    while remain:
        if remain >= 256:
            out.extend((0x40, color))
            remain -= 256
        else:
            run = min(remain, 63)
            out.extend((0x40 | run, color))
            remain -= run
    return bytes(out)

def _rle5_constant(pixel_count, color):
    out = bytearray(struct.pack("<I", pixel_count))
    remain = pixel_count
    while remain:
        run = min(remain, 256)
        out.extend((run - 1, 0x80, color))
        remain -= run
    return bytes(out)

def _lz5_constant(pixel_count, color):
    tokens = []
    remain = pixel_count
    while remain:
        run = min(remain, 7)
        tokens.append((run << 5) | (color & 0x1f))
        remain -= run
    stream = bytearray()
    for i in range(0, len(tokens), 8):
        stream.append(0x00)  # eight literal-run tokens, LSB-first control bits
        stream.extend(tokens[i:i+8])
    return struct.pack("<I", pixel_count) + bytes(stream)

def build_sff2_portrait(codec, width=24, height=24, color=2):
    """Minimal real-layout SFF v2.0 with one 9000,1 compressed portrait."""
    header_size = 512
    sprite_off = header_size
    sprite_count = 1
    palette_off = sprite_off + 28
    palette_count = 1
    ldata_off = palette_off + 16
    pixel_count = width * height

    if codec == "rle8":
        fmt, depth, image_data = 2, 8, _rle8_constant(pixel_count, color)
    elif codec == "rle5":
        fmt, depth, image_data = 3, 5, _rle5_constant(pixel_count, color)
    elif codec == "lz5":
        fmt, depth, image_data = 4, 5, _lz5_constant(pixel_count, color)
    else:
        raise ValueError(codec)

    colors = 32
    palette = bytearray(colors * 4)
    palette[4:8] = bytes((40, 180, 255, 0))
    palette[8:12] = bytes((255, 90, 80, 0))
    palette[12:16] = bytes((255, 220, 80, 0))
    palette_data_off = len(image_data)
    ldata = image_data + bytes(palette)
    tdata_off = ldata_off + len(ldata)

    header = bytearray(header_size)
    header[0:12] = b"ElecbyteSpr\x00"
    header[12:16] = bytes([0, 0, 0, 2])
    struct.pack_into("<I", header, 36, sprite_off)
    struct.pack_into("<I", header, 40, sprite_count)
    struct.pack_into("<I", header, 44, palette_off)
    struct.pack_into("<I", header, 48, palette_count)
    struct.pack_into("<I", header, 52, ldata_off)
    struct.pack_into("<I", header, 56, len(ldata))
    struct.pack_into("<I", header, 60, tdata_off)
    struct.pack_into("<I", header, 64, 0)

    sprite = struct.pack(
        "<HHHHhhHBBIIHH",
        9000, 1, width, height, 0, 0, 0,
        fmt, depth, 0, len(image_data), 0, 0
    )
    pal = struct.pack(
        "<HHHHII",
        9000, 1, colors, 0, palette_data_off, len(palette)
    )
    return bytes(header) + sprite + pal + ldata

files = {
    'Winmugen/Winmugen.exe': b'MZ' + b'PRIZIM-IKEMEN-FIXTURE' * 64,
    'Winmugen/mugen.cfg': b'[Config]\n',
    'Winmugen/data/system.def': system_def.encode(),
    'Winmugen/data/select.def': select_def.encode(),
    'Winmugen/chars/mole/mole.def': b'[Info]\nname = "Mole"\n[Files]\nsprite = mole.sff\n',
    'Winmugen/chars/mole/mole.sff': build_sff2_portrait("rle5", color=1),
    'Winmugen/chars/g.ken/g.ken.def': b'[Info]\nname = "G.Ken"\n[Files]\nsprite = gken.sff\n',
    'Winmugen/chars/g.ken/gken.sff': build_sff2_portrait("rle8", color=2),
    'Winmugen/chars/lz5dummy/lz5dummy.def': b'[Info]\nname = "LZ5 Dummy"\n[Files]\nsprite = lz5dummy.sff\n',
    'Winmugen/chars/lz5dummy/lz5dummy.sff': build_sff2_portrait("lz5", color=3),
    'Winmugen/stages/cfjed_warzard.def': b'x',
    'Winmugen/stages/cfjed_warzard.sff': b'x',
    'Winmugen/font/f-4x6.fnt': b'x',
}

with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name, data in files.items():
        z.writestr(name, data)
print(out)
