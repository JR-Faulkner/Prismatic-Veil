#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MASTER_B = ROOT / "pv-data/style_authority/characters/prismel_herocel_master_b_inspection.json"
PRODUCTION = ROOT / "pv-data/style_authority/characters/prismel_herocel_production_authority_v1.json"
IDLE = ROOT / "pv-data/style_authority/characters/prismel_idle_stability_v1.json"
REJECT = ROOT / "pv-data/style_authority/characters/prismel_idle_attempt_01_reject.json"


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
    missing = set(required) - actual
    if missing:
        fail(f"{label} missing: {', '.join(sorted(missing))}")


def main() -> None:
    master_b = load(MASTER_B, "Master B inspection")
    prod = load(PRODUCTION, "Prismel production authority")
    idle = load(IDLE, "Prismel idle stability spec")
    reject = load(REJECT, "Prismel rejected idle attempt receipt")

    if master_b.get("inspectionId") != "prismel-herocel-master-b-inspection":
        fail("Master B inspection id drifted")
    if master_b.get("status") != "approved-production-character-authority":
        fail("Master B must remain approved production character authority")

    relationship = master_b.get("authorityRelationship", {})
    if relationship.get("geometryAuthority") != "Prismel HeroCel Master A":
        fail("Master A must remain geometry authority")
    if relationship.get("productionRenderingAuthority") != "Prismel HeroCel Master B":
        fail("Master B must remain production rendering authority")

    avb = master_b.get("masterAVsBInspection", {})
    if avb.get("verdict") != "pass":
        fail("Master A vs B inspection must pass")
    if avb.get("scores", {}).get("elijahLikenessRetention", 0) < 9.3:
        fail("Elijah likeness retention fell below 9.3")
    if avb.get("scores", {}).get("frozenFaceGeometryRetention", 0) < 9.3:
        fail("frozen face geometry retention fell below 9.3")

    same = master_b.get("sameArtistInspection", {})
    if same.get("verdict") != "pass":
        fail("same-artist inspection must pass")
    if same.get("scores", {}).get("overallSameArtistImpression", 0) < 9.2:
        fail("same-artist impression fell below 9.2")

    thresholds = master_b.get("promotionThresholds", {})
    if thresholds.get("overallSameArtistImpressionMinimum") != 9.2:
        fail("same-artist promotion threshold drifted")
    if thresholds.get("elijahLikenessMinimum") != 9.3:
        fail("likeness promotion threshold drifted")
    if thresholds.get("met") is not True:
        fail("Master B promotion thresholds must remain met")

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

    require_items(
        prod.get("motionAuthority", {}).get("mustNotChange"),
        [
            "face geometry",
            "eye size, shape, or spacing",
            "nose family",
            "cheek volume",
            "age read",
            "head-to-body ratio",
            "hood opening identity",
            "cloak dominant mass",
            "HeroCel Master B rendering family",
        ],
        "motion production locks",
    )

    if reject.get("receiptId") != "prismel-idle-attempt-01-reject":
        fail("rejected idle attempt receipt id drifted")
    if reject.get("generationId") != "4d7628ea-c0e9-4e50-a1d6-d9468c2b333c":
        fail("rejected idle attempt generation id drifted")
    if reject.get("status") != "hard-reject":
        fail("rejected idle attempt must remain hard-rejected")
    require_items(
        reject.get("violations"),
        [
            "wrong facial identity",
            "wrong age read",
            "wrong hair geometry",
            "wrong body proportions",
            "wrong costume geometry",
            "HeroCel Master B rendering authority not preserved",
            "Master A geometry authority not preserved",
        ],
        "rejected idle attempt violations",
    )

    if idle.get("schemaVersion") != 2:
        fail("idle stability schemaVersion must remain 2")
    if idle.get("testId") != "prismel-herocel-idle-stability-v1":
        fail("idle stability test id drifted")
    expected_status = "prepared-source-preserving-derivation-pending-frame-build-and-prizim-inspection"
    if idle.get("status") != expected_status:
        fail("idle stability must remain source-preserving/pending until derived frames pass")

    stack = idle.get("authorityStack", {})
    if stack.get("geometryAuthority") != "Prismel HeroCel Master A":
        fail("idle must inherit Master A geometry")
    if stack.get("productionRenderingAuthority") != "Prismel HeroCel Master B":
        fail("idle must inherit Master B rendering")

    rejected_attempt = idle.get("rejectedAttempt", {})
    if rejected_attempt.get("receipt") != "prismel-idle-attempt-01-reject":
        fail("idle spec must retain rejected attempt receipt")

    contract = idle.get("sourcePreservingDerivationContract", {})
    if contract.get("masterSource") != "Prismel HeroCel Master B":
        fail("idle source must remain Master B")
    if contract.get("masterSourceSha256") != "16e5c8f19c727c444486f4367e5cc6e7ab4b25905ca56a89483396b84aa378b9":
        fail("idle Master B source hash drifted")
    if contract.get("presentation") != "six individually derived idle frames assembled only after per-frame validation":
        fail("idle presentation must remain per-frame source-preserving derivation")
    if "exact pixel copy of Master B" not in contract.get("frame1Rule", ""):
        fail("frame 1 must remain exact Master B pixels")
    if "exact pixel copy" not in contract.get("frame6Rule", ""):
        fail("frame 6 must remain exact frame 1 pixels")
    if "derive independently from Master B" not in contract.get("middleFrameRule", ""):
        fail("frames 2-5 must derive independently from Master B")

    require_items(
        contract.get("allowedMethods"),
        [
            "deterministic localized pixel deformation from Master B",
            "localized image edit using Master B as the sole image source",
        ],
        "idle allowed methods",
    )
    require_items(
        contract.get("forbiddenMethods"),
        [
            "fresh multi-frame character generation",
            "fresh full-body redraw",
            "deriving a frame from a previously modified frame",
            "using Kineza as an appearance reference",
            "using presentation sheets or older Prismel variants as visual references",
        ],
        "idle forbidden methods",
    )
    require_items(
        contract.get("immutableZones"),
        [
            "entire face and head geometry",
            "hairline and visible curls",
            "hands and fingers",
            "boots and foot contact",
            "belt line and pouch anchors",
            "chest crystal geometry and mounting",
            "hood opening geometry",
        ],
        "idle immutable zones",
    )
    require_items(
        contract.get("localizedEditableZones"),
        [
            "upper torso breathing contour within tolerance",
            "outer cloak fold response within tolerance",
            "chest crystal luminance only",
        ],
        "idle localized editable zones",
    )

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
            fail(f"idle derivation contract drifted: {key}")

    frames = idle.get("framePlan", [])
    if len(frames) != 6 or [f.get("frame") for f in frames] != [1, 2, 3, 4, 5, 6]:
        fail("idle frame plan must remain exactly six ordered frames")
    if [f.get("beat") for f in frames] != ["anchor-neutral", "micro-inhale", "cloth-response", "micro-exhale", "crystal-life", "return-anchor"]:
        fail("idle frame beats drifted")
    if frames[0].get("source") != "exact-master-b" or frames[5].get("source") != "exact-frame-1-copy":
        fail("idle anchor/return source rules drifted")
    for frame in frames[1:5]:
        if frame.get("source") != "derive-independently-from-master-b":
            fail("middle idle frames must derive independently from Master B")

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
            "fresh redraw of Prismel",
            "different-looking Prismel between frames",
            "eye enlargement or eye-spacing drift",
            "head-size pumping",
            "body-scale pumping",
            "vertical bob or baseline drift",
            "horizontal root drift",
            "painterly rendering reversion",
            "frame-to-frame value-group wobble",
        ],
        "idle hard rejects",
    )

    source_checks = idle.get("sourceIntegrityChecks", {})
    for key in [
        "frame1MustMatchMasterB",
        "frame6MustMatchFrame1",
        "frames2Through5MustTraceDirectlyToMasterB",
        "noCumulativeGenerationChain",
    ]:
        if source_checks.get(key) != "required":
            fail(f"idle source-integrity requirement drifted: {key}")

    tolerances = idle.get("postRegistrationTolerances", {})
    expected_tolerances = {
        "characterHeightVariancePercentMax": 1.0,
        "headDimensionVariancePercentMax": 0.5,
        "eyeSpacingVariancePercentMax": 0.5,
        "hoodOpeningDimensionVariancePercentMax": 1.0,
        "chestCrystalCentroidDriftCharacterHeightPercentMax": 0.25,
        "baselineFootContactDriftCharacterHeightPercentMax": 0.25,
        "nonIntentionalCloakWidthVariancePercentMax": 1.5,
    }
    for key, expected in expected_tolerances.items():
        if tolerances.get(key) != expected:
            fail(f"idle post-registration tolerance drifted: {key}")

    inspect = idle.get("inspectionRequirements", {})
    for key in [
        "sourceIntegrityPass",
        "visualIdentityPass",
        "anatomyPass",
        "renderingFamilyPass",
        "loopReturnPass",
        "postRegistrationTolerancePass",
        "phonePlaybackPassBeforePromotion",
    ]:
        if inspect.get(key) != "required":
            fail(f"idle inspection requirement drifted: {key}")

    motion = prod.get("motionValidation", {})
    if motion.get("currentStage") != "neutral-idle-stability-source-preserving":
        fail("production motion stage must remain source-preserving neutral idle")
    if motion.get("idleStabilitySpec") != "prismel-herocel-idle-stability-v1":
        fail("production authority must point to idle stability v1")
    if motion.get("idleStatus") != idle.get("status"):
        fail("production authority idle status must match idle spec")
    if motion.get("sequenceFrameCount") != 6:
        fail("production idle frame count drifted")
    if motion.get("derivationMode") != "independent-from-master-b-no-fresh-redraw":
        fail("production idle derivation mode drifted")
    if motion.get("frame1ExactMasterB") is not True or motion.get("frame6ExactFrame1") is not True:
        fail("production anchor/return exact-copy requirements drifted")
    if motion.get("staffAllowed") is not False or motion.get("attackFxAllowed") is not False:
        fail("staff and attack FX must remain blocked during idle stability")
    if motion.get("rootMotionAllowed") is not False:
        fail("root motion must remain blocked during idle stability")
    if motion.get("blockLaterStagesUntilIdlePasses") is not True:
        fail("later motion stages must remain blocked until idle passes")

    require_items(prod.get("rejectedMotionAttempts"), ["prismel-idle-attempt-01-reject"], "production rejected-motion history")

    print("PZ PRISMEL PRODUCTION PASS: Master A geometry + Master B rendering are locked; rejected redraw is quarantined; source-preserving idle derivation is enforced")


if __name__ == "__main__":
    main()
