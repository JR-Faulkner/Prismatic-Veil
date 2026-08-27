#!/usr/bin/env python3
"""PriZim visual-integrity metadata gate for generated attack art.

This gate does not pretend computer vision can reliably count fingers or diagnose
pupil direction. Instead it makes a frame-level anatomy/artifact review a required,
versioned production receipt and prevents older bleed/registration reports from
masquerading as anatomy approval.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = ROOT / "pv-data" / "prizim_status" / "visual_integrity"
REQUIRED_HEROES = ("prismel", "auryi", "kineza")
REQUIRED_CHECKS = (
    "duplicateLimbs",
    "limbCountAndAttachment",
    "handsAndFingerTopology",
    "eyesAndPupilDirection",
    "faceIdentityContinuity",
    "anatomyObjectFusion",
    "costumeObjectContinuity",
    "frameToFrameIdentityDrift",
)
ALLOWED = {"pass", "minor-review", "review-required", "fail", "not-visible"}

errors: list[str] = []

for hero in REQUIRED_HEROES:
    path = REPORT_DIR / f"{hero}_attack_visual_integrity.json"
    if not path.exists():
        errors.append(f"missing visual-integrity receipt: {path.relative_to(ROOT)}")
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("heroId") != hero:
        errors.append(f"{hero}: heroId mismatch")
    if data.get("schema") != "prizim.visual_integrity.v1":
        errors.append(f"{hero}: unsupported visual-integrity schema")
    checks = data.get("checks", {})
    for key in REQUIRED_CHECKS:
        if key not in checks:
            errors.append(f"{hero}: missing check {key}")
            continue
        status = checks[key].get("status") if isinstance(checks[key], dict) else None
        if status not in ALLOWED:
            errors.append(f"{hero}: invalid {key} status {status!r}")
    if data.get("overall") == "fail":
        errors.append(f"{hero}: visual-integrity hard FAIL")
    if not data.get("reviewScope", {}).get("explicitAnatomyAudit"):
        errors.append(f"{hero}: receipt must explicitly include anatomy audit")

if errors:
    print("PriZim visual-integrity gate: FAIL")
    for e in errors:
        print(f"- {e}")
    raise SystemExit(1)

print("PriZim visual-integrity gate: PASS")
for hero in REQUIRED_HEROES:
    data = json.loads((REPORT_DIR / f"{hero}_attack_visual_integrity.json").read_text(encoding="utf-8"))
    print(f"- {hero}: {data.get('overall')} / {data.get('productionDisposition')}")
