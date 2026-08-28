#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MASTER_B = ROOT / "pv-data/style_authority/characters/prismel_herocel_master_b_inspection.json"
PRODUCTION = ROOT / "pv-data/style_authority/characters/prismel_herocel_production_authority_v1.json"


def fail(msg: str) -> None:
    raise SystemExit(f"PZ PRISMEL PRODUCTION FAIL: {msg}")


def load(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f"{label} missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{label} invalid JSON: {exc}")


def main() -> None:
    master_b = load(MASTER_B, "Master B inspection")
    prod = load(PRODUCTION, "Prismel production authority")

    if master_b.get("inspectionId") != "prismel-herocel-master-b-inspection":
        fail("Master B inspection id drifted")
    if master_b.get("status") != "approved-production-character-authority":
        fail("Master B must remain approved production character authority")

    geometry = master_b.get("authorityRelationship", {})
    if geometry.get("geometryAuthority") != "Prismel HeroCel Master A":
        fail("Master A must remain geometry authority")
    if geometry.get("productionRenderingAuthority") != "Prismel HeroCel Master B":
        fail("Master B must remain production rendering authority")

    avb = master_b.get("masterAVsBInspection", {})
    if avb.get("verdict") != "pass":
        fail("Master A vs B geometry/likeness inspection must pass")
    avb_scores = avb.get("scores", {})
    if avb_scores.get("elijahLikenessRetention", 0) < 9.3:
        fail("Elijah likeness retention fell below 9.3")
    if avb_scores.get("frozenFaceGeometryRetention", 0) < 9.3:
        fail("frozen face geometry retention fell below production floor")

    same = master_b.get("sameArtistInspection", {})
    if same.get("verdict") != "pass":
        fail("same-artist inspection must pass")
    if same.get("scores", {}).get("overallSameArtistImpression", 0) < 9.2:
        fail("same-artist impression fell below 9.2")
    if same.get("baselineOverallSameArtistImpression") != 8.3:
        fail("historical same-artist baseline drifted")

    thresholds = master_b.get("promotionThresholds", {})
    if thresholds.get("overallSameArtistImpressionMinimum") != 9.2:
        fail("same-artist promotion threshold drifted")
    if thresholds.get("elijahLikenessMinimum") != 9.3:
        fail("likeness promotion threshold drifted")
    if thresholds.get("met") is not True:
        fail("promotion thresholds must remain met")

    if prod.get("authorityId") != "prismel-herocel-production-v1":
        fail("production authority id drifted")
    if prod.get("status") != "locked-production-character-authority":
        fail("Prismel production authority must remain locked")
    if prod.get("geometryAuthority", {}).get("master") != "Prismel HeroCel Master A":
        fail("production authority must preserve Master A geometry ownership")
    if prod.get("productionMaster", {}).get("master") != "Prismel HeroCel Master B":
        fail("production authority must preserve Master B rendering ownership")
    if prod.get("productionMaster", {}).get("sha256") != "16e5c8f19c727c444486f4367e5cc6e7ab4b25905ca56a89483396b84aa378b9":
        fail("Master B evidence hash drifted")
    if prod.get("promotionEvidence", {}).get("thresholdsMet") is not True:
        fail("production promotion evidence must remain passing")
    if prod.get("motionAuthority", {}).get("status") != "cleared":
        fail("Prismel must remain cleared for motion production")

    must_not = set(prod.get("motionAuthority", {}).get("mustNotChange", []))
    required_locks = {
        "face geometry",
        "eye size, shape, or spacing",
        "nose family",
        "cheek volume",
        "age read",
        "head-to-body ratio",
        "hood opening identity",
        "cloak dominant mass",
        "HeroCel Master B rendering family",
    }
    if not required_locks.issubset(must_not):
        fail("motion production identity/rendering locks drifted")

    print("PZ PRISMEL PRODUCTION PASS: Master A geometry + Master B rendering authority are locked; motion production is cleared")


if __name__ == "__main__":
    main()
