#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MASTER_B = ROOT / "pv-data/style_authority/characters/prismel_herocel_master_b_inspection.json"
PRODUCTION = ROOT / "pv-data/style_authority/characters/prismel_herocel_production_authority_v1.json"
IDLE = ROOT / "pv-data/style_authority/characters/prismel_idle_stability_v1.json"


def fail(msg: str) -> None:
    raise SystemExit(f"PZ PRISMEL PRODUCTION FAIL: {msg}")


def load(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f"{label} missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{label} invalid JSON: {exc}")


def require_items(actual, required, label):
    actual = set(actual or [])
    if not set(required).issubset(actual):
        missing = sorted(set(required) - actual)
        fail(f"{label} missing: {', '.join(missing)}")


def main() -> None:
    master_b = load(MASTER_B, "Master B inspection")
    prod = load(PRODUCTION, "Prismel production authority")
    idle = load(IDLE, "Prismel idle stability spec")

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

    if idle.get("testId") != "prismel-herocel-idle-stability-v1":
        fail("idle stability test id drifted")
    if idle.get("status") != "prepared-pending-hc-generation-and-prizim-inspection":
        fail("idle stability test must remain prepared/pending until assets are generated and inspected")
    stack = idle.get("authorityStack", {})
    if stack.get("geometryAuthority") != "Prismel HeroCel Master A":
        fail("idle test must inherit Master A geometry")
    if stack.get("productionRenderingAuthority") != "Prismel HeroCel Master B":
        fail("idle test must inherit Master B rendering")

    contract = idle.get("generationContract", {})
    if contract.get("presentation") != "single 6-frame neutral-idle sequence sheet":
        fail("idle test must remain a single 6-frame sequence")
    for key, expected in {
        "staff": "absent",
        "attackFx": "absent",
        "rootMotion": "none",
        "baseline": "fixed",
        "scale": "fixed",
        "horizontalDrift": "none",
        "verticalBob": "none",
    }.items():
        if contract.get(key) != expected:
            fail(f"idle generation contract drifted: {key}")
    if "Master B as the only character visual reference" not in contract.get("referenceRule", ""):
        fail("idle generation must use Master B as the only character visual reference")

    frames = idle.get("framePlan", [])
    if len(frames) != 6 or [f.get("frame") for f in frames] != [1, 2, 3, 4, 5, 6]:
        fail("idle frame plan must remain exactly six ordered frames")
    expected_beats = ["anchor-neutral", "micro-inhale", "cloth-response", "micro-exhale", "crystal-life", "return-anchor"]
    if [f.get("beat") for f in frames] != expected_beats:
        fail("idle frame beats drifted")

    require_items(
        idle.get("absoluteLocks"),
        [
            "Elijah facial geometry",
            "eye size, shape, and spacing",
            "nose family",
            "full cheek volume",
            "older-child age read",
            "head-to-body ratio",
            "hood opening shape",
            "cloak shoulder mass",
            "central chest crystal size and placement",
            "foot contact baseline",
            "overall character scale",
            "HeroCel Master B rendering family",
        ],
        "idle absolute locks",
    )
    require_items(
        idle.get("hardReject"),
        [
            "different-looking Prismel between frames",
            "eye enlargement or eye-spacing drift",
            "head-size pumping",
            "body-scale pumping",
            "vertical bob or baseline drift",
            "horizontal root drift",
            "cloak shoulder mass pumping",
            "painterly rendering reversion",
            "frame-to-frame value-group wobble",
        ],
        "idle hard rejects",
    )

    tolerances = idle.get("postRegistrationTolerances", {})
    expected_tolerances = {
        "characterHeightVariancePercentMax": 1.0,
        "headDimensionVariancePercentMax": 1.5,
        "eyeSpacingVariancePercentMax": 1.5,
        "hoodOpeningDimensionVariancePercentMax": 2.0,
        "chestCrystalCentroidDriftCharacterHeightPercentMax": 0.75,
        "baselineFootContactDriftCharacterHeightPercentMax": 0.5,
        "nonIntentionalCloakWidthVariancePercentMax": 2.0,
    }
    for key, expected in expected_tolerances.items():
        if tolerances.get(key) != expected:
            fail(f"idle post-registration tolerance drifted: {key}")

    inspect = idle.get("inspectionRequirements", {})
    for key in ["visualIdentityPass", "anatomyPass", "renderingFamilyPass", "loopReturnPass", "postRegistrationTolerancePass", "phonePlaybackPassBeforePromotion"]:
        if inspect.get(key) != "required":
            fail(f"idle inspection requirement drifted: {key}")

    motion_validation = prod.get("motionValidation", {})
    if motion_validation.get("currentStage") != "neutral-idle-stability":
        fail("production motion stage must remain neutral-idle-stability")
    if motion_validation.get("idleStabilitySpec") != "prismel-herocel-idle-stability-v1":
        fail("production authority must point to idle stability v1")
    if motion_validation.get("idleStatus") != idle.get("status"):
        fail("production authority idle status must match idle stability spec")
    if motion_validation.get("sequenceFrameCount") != 6:
        fail("production idle frame count drifted")
    if motion_validation.get("staffAllowed") is not False or motion_validation.get("attackFxAllowed") is not False:
        fail("staff and attack FX must remain blocked during idle stability")
    if motion_validation.get("rootMotionAllowed") is not False:
        fail("root motion must remain blocked during idle stability")
    if motion_validation.get("blockLaterStagesUntilIdlePasses") is not True:
        fail("later motion stages must remain blocked until idle passes")

    print("PZ PRISMEL PRODUCTION PASS: Master A geometry + Master B rendering are locked; neutral-idle stability gate is prepared and later motion stages are blocked pending pass")


if __name__ == "__main__":
    main()
