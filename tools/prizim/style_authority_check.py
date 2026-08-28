#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / "pv-data/style_authority/prismatic_herocel_v1.json"


def fail(msg: str) -> None:
    raise SystemExit(f"PZ STYLE AUTHORITY FAIL: {msg}")


def main() -> None:
    if not PROFILE.exists():
        fail("Prismatic HeroCel v1 profile is missing")

    data = json.loads(PROFILE.read_text(encoding="utf-8"))

    if data.get("authorityId") != "prismatic-herocel-v1":
        fail("authorityId must remain prismatic-herocel-v1")
    if data.get("status") != "locked-style-calibration-authority":
        fail("HeroCel v1 must remain locked")

    master = data.get("calibrationMaster", {})
    if master.get("character") != "kineza":
        fail("Kineza must remain the rendering calibration master")
    if master.get("role") != "rendering-authority-only":
        fail("Kineza authority must remain rendering-only")

    stack = data.get("translationContract", {}).get("requiredAuthorityStack", [])
    required = ["likenessAuthority", "characterDesignAuthority", "prismatic-herocel-v1"]
    if stack != required:
        fail("three-part translation authority stack changed")

    gates = data.get("prizimGates", {})
    for name in (
        "likenessRetention",
        "designFidelity",
        "animationReadability",
        "styleFingerprintMatch",
        "ageAdapterApplied",
    ):
        if gates.get(name) != "required":
            fail(f"{name} gate must remain required")
    if gates.get("forbiddenDrift") != "hard-reject":
        fail("forbiddenDrift must remain a hard reject")

    age = data.get("ageAdapters", {})
    for name in ("youngChild", "olderChild", "youngAdult", "adult"):
        if name not in age:
            fail(f"missing age adapter: {name}")

    drift = set(data.get("forbiddenDrift", []))
    for required_drift in (
        "generic anime face",
        "generic JRPG face",
        "copying Kineza anatomy or expression",
        "costume redesign during style translation",
        "style normalization that weakens likeness",
    ):
        if required_drift not in drift:
            fail(f"missing forbidden drift rule: {required_drift}")

    print("PZ STYLE AUTHORITY PASS: Prismatic HeroCel v1 is locked and valid")


if __name__ == "__main__":
    main()
