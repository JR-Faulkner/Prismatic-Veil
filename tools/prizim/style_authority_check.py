#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / "pv-data/style_authority/prismatic_herocel_v1.json"
PRISMEL = ROOT / "pv-data/style_authority/characters/prismel_herocel_v1.json"


def fail(msg: str) -> None:
    raise SystemExit(f"PZ STYLE AUTHORITY FAIL: {msg}")


def load_json(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f"{label} is missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{label} is invalid JSON: {exc}")


def validate_herocel() -> None:
    data = load_json(PROFILE, "Prismatic HeroCel v1 profile")

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


def validate_prismel() -> None:
    data = load_json(PRISMEL, "Prismel HeroCel profile")

    if data.get("profileId") != "prismel-herocel-v1":
        fail("Prismel profileId must remain prismel-herocel-v1")
    if data.get("characterId") != "prismel":
        fail("Prismel profile characterId changed")
    if data.get("inherits") != "prismatic-herocel-v1":
        fail("Prismel must inherit Prismatic HeroCel v1")
    if data.get("ageAdapter") != "olderChild":
        fail("Prismel must retain the olderChild age adapter")

    stack = data.get("authorityStack", {})
    if stack.get("renderingAuthority") != "prismatic-herocel-v1":
        fail("Prismel rendering authority must remain HeroCel v1")

    likeness = stack.get("likenessAuthority", {})
    anchors = set(likeness.get("identityAnchors", []))
    for anchor in (
        "full cheeks",
        "subtle chin dimple",
        "soft rounded youthful jaw",
        "older-child age read",
    ):
        if anchor not in anchors:
            fail(f"Prismel likeness anchor missing: {anchor}")

    design = stack.get("characterDesignAuthority", {})
    preserve = set(design.get("preserveExactly", []))
    for lock in (
        "hood-up silhouette",
        "deep navy to near-black cosmic cloak",
        "central prismatic chest crystal",
        "slender Prismel build",
        "cloak as dominant visual mass",
    ):
        if lock not in preserve:
            fail(f"Prismel design lock missing: {lock}")

    balance = data.get("translationBalance", {})
    if balance.get("likenessAndDesignPercent") != 90:
        fail("Prismel likeness/design balance must remain 90%")
    if balance.get("HeroCelNormalizationPercent") != 10:
        fail("Prismel HeroCel normalization must remain 10%")
    if balance.get("maximumNormalizationPercentWithoutNewApproval") != 15:
        fail("Prismel normalization approval ceiling must remain 15%")

    gates = data.get("prizimGates", {})
    for name in (
        "likenessRetention",
        "designFidelity",
        "HeroCelFingerprintMatch",
        "olderChildAgeRead",
        "hoodDominantSilhouette",
        "expressionIdentity",
    ):
        if gates.get(name) != "required":
            fail(f"Prismel gate must remain required: {name}")
    for name in ("forbiddenLikenessDrift", "forbiddenDesignDrift"):
        if gates.get(name) != "hard-reject":
            fail(f"Prismel drift gate must remain hard-reject: {name}")


def main() -> None:
    validate_herocel()
    validate_prismel()
    print("PZ STYLE AUTHORITY PASS: HeroCel v1 + Prismel translation profile are locked and valid")


if __name__ == "__main__":
    main()
