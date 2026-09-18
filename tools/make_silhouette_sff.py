#!/usr/bin/env python3
"""Attach a silhouette palette to every sprite in an SFF v1 file.

The Kineza v0.1 prototype's PCX sprites carry valid 8-bit indexed image
data but no palette block -- a PCX 8bpp file must end with a 0x0C marker
byte followed by 768 bytes (256 RGB triplets), and all 23 sprites are
missing it. With no colour table the indices are meaningless, which is
why the character renders as magenta/green confetti on device.

The original palette is genuinely unrecoverable: the quantisation was
adaptive (all 256 indices in use, none above 0.5% of pixels), so each
index maps to a specific colour that exists nowhere in the file.

This writes a STAND-IN palette so the build is usable as what its own
README says it is -- a load-test and motion-test build. Index 0 is the
transparent background (75-84% of every sprite, already the correct
MUGEN convention); indices 1-255 all get Kineza's canonical Prismatic
Veil accent colour, producing a clean flat silhouette. A silhouette is
enough to answer the prototype's own open questions: whether the foot
axis stays stable through Momentum Fist and Blitz Rush, and whether
either rush carries him off camera.

Colours are FAKE. This does not fix the character, it unblocks testing
while the SFF is regenerated with its real palette attached.
"""
import struct, sys

ACCENT = (0x68, 0xff, 0x8c)   # Kineza's accent in src/BattleConfig.js
BG     = (0x00, 0x00, 0x00)   # index 0 -- transparent in MUGEN regardless

src_path, dst_path = sys.argv[1], sys.argv[2]
d = open(src_path, 'rb').read()

sig = d[0:12].rstrip(b'\x00').decode('latin1')
if sig != 'ElecbyteSpr':
    raise SystemExit('not an SFF file: ' + repr(sig))
ver = d[12:16]
ngroups, nimages, first_off, subhdr_size, paltype = struct.unpack('<IIIIH', d[16:34])
if subhdr_size != 32:
    raise SystemExit('unexpected subheader size %d (expected 32)' % subhdr_size)

palette = bytes(BG) + bytes(ACCENT) * 255
assert len(palette) == 768
pal_block = b'\x0c' + palette

# Read every sprite in chain order.
sprites = []
off = first_off
while off:
    nxt, length, ax, ay, grp, img = struct.unpack('<IIhhHH', d[off:off+16])
    linked, palsame = d[off+16], d[off+17]
    body = d[off+32:off+32+length]
    if length and body[-769:-768] == b'\x0c':
        raise SystemExit('sprite %d,%d already has a palette -- refusing to double-append' % (grp, img))
    sprites.append({'ax': ax, 'ay': ay, 'grp': grp, 'img': img,
                    'linked': linked, 'palsame': palsame, 'body': body})
    if nxt == 0:
        break
    off = nxt

if len(sprites) != nimages:
    raise SystemExit('walked %d sprites but header claims %d' % (len(sprites), nimages))

# Rebuild: 512-byte header, then each sprite as 32-byte subheader + PCX
# data + palette block, with the next-offset chain recomputed.
out = bytearray()
out += b'ElecbyteSpr\x00' + ver
out += struct.pack('<IIII', ngroups, nimages, 512, 32)
out += struct.pack('<H', paltype)
out += b'\x00' * (512 - len(out))
assert len(out) == 512

bodies = [s['body'] + pal_block for s in sprites]
offsets = []
cur = 512
for b in bodies:
    offsets.append(cur)
    cur += 32 + len(b)

for i, (s, body) in enumerate(zip(sprites, bodies)):
    nxt = offsets[i + 1] if i + 1 < len(offsets) else 0
    out += struct.pack('<IIhhHH', nxt, len(body), s['ax'], s['ay'], s['grp'], s['img'])
    out += struct.pack('<HB', 0, 0)          # linked index, palette-same = 0 (each carries its own now)
    out += b'\x00' * 13
    out += body

open(dst_path, 'wb').write(out)
print('wrote %s' % dst_path)
print('  sprites      : %d' % len(sprites))
print('  palette      : index 0 = %s (transparent), 1-255 = #%02x%02x%02x' % (BG, *ACCENT))
print('  size         : %d -> %d bytes (+%d)' % (len(d), len(out), len(out) - len(d)))
