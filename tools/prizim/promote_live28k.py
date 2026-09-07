#!/usr/bin/env python3
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
REQUEST = ROOT / 'PV_PROMOTION_REQUEST.json'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'
BUILD = ROOT / 'live-build.json'

PATTERN = re.compile(r'^main-\d{8}-live28k(\d+)$', re.I)


def main():
    request = json.loads(REQUEST.read_text(encoding='utf-8'))
    auth = json.loads(AUTH.read_text(encoding='utf-8'))
    build = json.loads(BUILD.read_text(encoding='utf-8'))

    target = request.get('target_witness', '')
    match = PATTERN.match(target)
    if not match:
        raise SystemExit(f'Invalid LIVE28K target witness: {target!r}')

    current = auth.get('witness', '')
    current_match = PATTERN.match(current)
    if current_match and int(match.group(1)) < int(current_match.group(1)):
        raise SystemExit(f'Refusing LIVE28K rollback {current} -> {target}')

    if build.get('hybrid') != auth['runtime']['hybrid_entry']:
        raise SystemExit('Refusing promotion: live Hybrid entry drifted from machine authority')

    auth['witness'] = target
    auth['updated'] = request.get('date') or auth.get('updated')
    evidence = auth.setdefault('device_evidence', {})
    evidence['pending_witness'] = target
    evidence['pending_iphone_validation'] = True
    evidence['promotion_reason'] = request.get('reason', '')

    build['id'] = target

    AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')
    BUILD.write_text(json.dumps(build, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared atomic promotion: {current} -> {target}')


if __name__ == '__main__':
    main()
