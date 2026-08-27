#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).with_name('h28_runtime_ingest_patch.py')
s = p.read_text(encoding='utf-8')
old = r'''config_block = r"export const KINEZA_ATTACK_SHEET = Object\\.freeze\\(\\{.*?export const HERO_ATTACK_SHEETS = Object\\.freeze\\(\\{ kineza: KINEZA_ATTACK_SHEET \\}\\);"'''
new = r'''config_block = r"export const KINEZA_ATTACK_SHEET = Object\.freeze\(\{.*?export const HERO_ATTACK_SHEETS = Object\.freeze\(\{ kineza: KINEZA_ATTACK_SHEET \}\);"'''
if old not in s:
    raise SystemExit('expected over-escaped config regex not found')
s = s.replace(old, new, 1)
exec(compile(s, str(p), 'exec'))
