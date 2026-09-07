#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[2] / 'tools/prizim/preflight_live28k.py'
text = path.read_text(encoding='utf-8')
old = "if 'scheduled before native video play' not in auth['auryi'].get('aurora_bloom_mix_policy', ''):\n    errors.append('Aurora Bloom iPhone scheduling policy missing from machine authority')"
new = "bloom_policy = auth['auryi'].get('aurora_bloom_mix_policy', '')\nif 'scheduled before native video play' not in bloom_policy and 'native HTMLMediaElement' not in bloom_policy:\n    errors.append('Aurora Bloom iPhone scheduling/native-media policy missing from machine authority')"
if old not in text:
    raise SystemExit('K18 guard compatibility refused: legacy Bloom policy check not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('K18 Bloom policy guard compatibility staged')
