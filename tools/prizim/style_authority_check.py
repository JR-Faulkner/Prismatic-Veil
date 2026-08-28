#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / "pv-data/style_authority/prismatic_herocel_v1.json"
PRISMEL = ROOT / "pv-data/style_authority/characters/prismel_herocel_v1.json"
PRISMEL_INSPECTION = ROOT / "pv-data/style_authority/characters/prismel_herocel_master_a_inspection.json"
PORTABILITY = ROOT / "pv-data/style_authority/tests/herocel_portability_v1.json"


def fail(msg: str) -> None:
    raise SystemExit(f"PZ STYLE AUTHORITY FAIL: {msg}")


def load_json(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f"{label} is missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{label} is invalid JSON: {exc}")


def require_items(actual, required, label):
    actual = set(actual or [])
    for item in required:
        if item not in actual:
            fail(f"{label} missing: {item}")


def validate_herocel() -> None:
    data = load_json(PROFILE, "Prismatic HeroCel v1 profile")
    if data.get("schemaVersion") != 2:
        fail("HeroCel schemaVersion must remain 2")
    if data.get("authorityId") != "prismatic-herocel-v1":
        fail("authorityId must remain prismatic-herocel-v1")
    if data.get("styleRevision") != "1.2-animation-rendering-firewall":
        fail("HeroCel animation-rendering-firewall revision drifted")
    if data.get("status") != "locked-style-calibration-authority":
        fail("HeroCel v1 must remain locked")

    style = data.get("styleDefinition", {})
    if style.get("presentationBias") != "animation-model-first":
        fail("HeroCel must remain animation-model-first")
    require_items(style.get("notEquivalentTo"), ["painterly fantasy concept art", "photoreal fantasy portraiture"], "HeroCel non-equivalence")

    master = data.get("calibrationMaster", {})
    if master.get("character") != "kineza":
        fail("Kineza must remain the historical rendering calibration master")
    if master.get("role") != "rendering-authority-only" or master.get("transferScope") != "style-properties-only":
        fail("Kineza authority must remain rendering-only and style-only")
    require_items(
        master.get("neverTransfer"),
        ["face shape", "eye shape", "eye spacing", "cheek contour", "nose geometry", "mouth geometry", "head-to-body ratio", "body proportions"],
        "Kineza identity firewall",
    )

    identity = data.get("identityFirewall", {})
    if identity.get("priority") != "absolute":
        fail("HeroCel identity firewall must remain absolute")
    owners = identity.get("ownership", {})
    for key, expected in {
        "facialGeometry": "likenessAuthority",
        "facialFeatureSpacing": "likenessAuthority",
        "headShape": "likenessAuthority",
        "bodyProportions": "characterDesignAuthority + likenessAuthority",
        "costumeGeometry": "characterDesignAuthority",
        "edgeTreatment": "prismatic-herocel-v1",
        "shadowGrouping": "prismatic-herocel-v1",
        "materialStylization": "prismatic-herocel-v1",
    }.items():
        if owners.get(key) != expected:
            fail(f"HeroCel ownership drifted: {key}")

    animation = data.get("animationRenderingFirewall", {})
    if animation.get("priority") != "absolute":
        fail("HeroCel animation rendering firewall must remain absolute")
    if animation.get("requiredRead") != "clean animated character model with premium game finish":
        fail("HeroCel required animation-model read drifted")
    if animation.get("valueGroupContract", {}).get("targetMajorGroupsPerMaterial") != "2-to-4":
        fail("HeroCel 2-to-4 major value-group target drifted")
    require_items(
        animation.get("hardReject"),
        [
            "painterly concept-art finish",
            "photoreal portrait rendering",
            "continuous gradient shading as the primary form language",
            "airbrushed skin modeling",
            "uniform high-frequency fabric texture",
            "dense costume micro-detail distributed evenly across the character",
            "illustration polish that weakens animation readability",
        ],
        "HeroCel animation firewall",
    )

    gates = data.get("prizimGates", {})
    for name in ["likenessRetention", "designFidelity", "animationReadability", "animationModelRead", "styleFingerprintMatch", "ageAdapterApplied", "randomCharacterPortability"]:
        if gates.get(name) != "required":
            fail(f"{name} gate must remain required")
    for name in ["identityFirewall", "animationRenderingFirewall", "forbiddenDrift"]:
        if gates.get(name) != "hard-reject":
            fail(f"{name} gate must remain hard-reject")


def validate_portability() -> None:
    data = load_json(PORTABILITY, "HeroCel portability fixture")
    if data.get("testId") != "herocel-portability-v1":
        fail("HeroCel portability testId drifted")
    if data.get("styleAuthority") != "prismatic-herocel-v1":
        fail("HeroCel portability fixture must use HeroCel v1")
    if data.get("kinezaLikenessContributionPercent") != 0 or data.get("kinezaGeometryContributionPercent") != 0:
        fail("HeroCel portability fixture must keep Kineza likeness and geometry at 0%")

    required_ids = {"unrelated-adult-human", "nonhuman-synthetic", "young-character-not-kineza"}
    found_ids = {case.get("id") for case in data.get("cases", [])}
    if found_ids != required_ids:
        fail("HeroCel portability cases drifted")


def validate_prismel() -> None:
    data = load_json(PRISMEL, "Prismel HeroCel profile")
    if data.get("schemaVersion") != 2:
        fail("Prismel HeroCel schemaVersion must remain 2")
    if data.get("profileId") != "prismel-herocel-v1":
        fail("Prismel profileId must remain prismel-herocel-v1")
    if data.get("profileRevision") != "1.2-same-artist-calibration":
        fail("Prismel same-artist calibration revision drifted")
    if data.get("characterId") != "prismel" or data.get("inherits") != "prismatic-herocel-v1":
        fail("Prismel identity or inherited HeroCel authority changed")
    if data.get("ageAdapter") != "olderChild":
        fail("Prismel must retain the olderChild age adapter")

    stack = data.get("authorityStack", {})
    likeness = stack.get("likenessAuthority", {})
    if likeness.get("subject") != "Elijah" or likeness.get("priority") != "absolute-geometry-authority":
        fail("Elijah must remain Prismel absolute likeness geometry authority")
    require_items(likeness.get("identityAnchors"), ["full cheeks", "subtle chin dimple", "soft rounded youthful jaw", "older-child age read"], "Prismel likeness anchors")
    require_items(
        likeness.get("geometryOwned"),
        ["eye shape", "eye size", "eye spacing", "cheek contour and volume", "nose width, bridge, tip, and placement", "lip proportions and mouth geometry", "jaw width and contour", "chin shape and dimple"],
        "Elijah geometry ownership",
    )

    if stack.get("renderingAuthority") != "prismatic-herocel-v1":
        fail("Prismel rendering authority must remain HeroCel v1")
    preserve = stack.get("characterDesignAuthority", {}).get("preserveExactly", [])
    require_items(preserve, ["hood-up silhouette", "deep navy to near-black cosmic cloak", "central prismatic chest crystal", "slender Prismel build", "cloak as dominant visual mass"], "Prismel design locks")

    identity = data.get("identityFirewall", {})
    if identity.get("subjectGeometryOwner") != "likenessAuthority" or identity.get("characterGeometryOwner") != "characterDesignAuthority":
        fail("Prismel geometry ownership drifted")
    if identity.get("styleOwner") != "prismatic-herocel-v1":
        fail("Prismel style owner must remain HeroCel v1")
    if identity.get("kinezaGeometryContributionPercent") != 0 or identity.get("kinezaLikenessContributionPercent") != 0:
        fail("Kineza geometry and likeness contribution must remain 0%")
    if identity.get("heroCelStyleApplicationPercent") != 100:
        fail("HeroCel style application must remain 100% style-only")

    freeze = data.get("masterGeometryFreeze", {})
    if freeze.get("authority") != "Prismel HeroCel Master A" or freeze.get("priority") != "absolute":
        fail("Prismel Master A geometry freeze must remain absolute")
    require_items(
        freeze.get("frozenFace"),
        ["eye size, shape, and spacing", "nose width, softness, bridge, tip, and placement", "full cheek volume", "head-to-body ratio", "older-child age read"],
        "Prismel Master A face freeze",
    )
    require_items(
        freeze.get("frozenDesign"),
        ["hood opening shape", "cloak shoulder volume", "long cloak hem length", "central chest crystal size and placement", "slender Prismel build"],
        "Prismel Master A design freeze",
    )
    require_items(
        freeze.get("forbiddenDuringCalibration"),
        ["face narrowing", "nose sharpening", "cheek-volume loss", "Kineza or Ezra facial leakage", "costume redesign", "hood or cloak shrinkage"],
        "Prismel calibration hard rejects",
    )

    calibration = data.get("sameArtistCalibration", {})
    if calibration.get("calibrationId") != "prismel-to-herocel-rendering-economy-v1" or calibration.get("scope") != "rendering-only":
        fail("Prismel same-artist calibration scope drifted")
    targets = calibration.get("renderingTargets", {})
    if targets.get("skinMajorValueGroups") != "2-to-3":
        fail("Prismel skin must remain targeted to 2-to-3 major value groups")
    if targets.get("facialTransitionBands") != "maximum-1-restrained-band":
        fail("Prismel facial transition-band limit drifted")
    if "25-to-35 percent" not in targets.get("cosmicMicrodetail", ""):
        fail("Prismel cosmic microdetail reduction target drifted")
    require_items(
        calibration.get("hardReject"),
        ["any facial or body geometry change", "any likeness loss caused by style normalization", "painterly skin reversion", "continuous facial gradient modeling", "Kineza likeness, smile, eye, cheek, nose, jaw, or proportion transfer"],
        "Prismel same-artist calibration rejects",
    )
    pass_target = calibration.get("passTarget", {})
    if pass_target.get("sameArtistImpressionMinimum") != 9.2 or pass_target.get("likenessRetentionFloor") != 9.3:
        fail("Prismel same-artist or likeness pass threshold drifted")
    if "do not regenerate either character" not in pass_target.get("method", ""):
        fail("Prismel comparison method must remain untouched-composite only")

    generation = data.get("generationContract", {})
    preferred = generation.get("preferredPresentation", "")
    if "single neutral full-body Prismel Master B candidate" not in preferred or "no turnaround" not in preferred or "multi-character generation" not in preferred:
        fail("Prismel Master B calibration presentation drifted")
    if "Do not use Kineza as an appearance" not in generation.get("artistInstruction", ""):
        fail("Prismel generation contract must explicitly exclude Kineza appearance authority")

    gates = data.get("prizimGates", {})
    for name in ["likenessRetention", "subjectGeometryOwnership", "designFidelity", "HeroCelFingerprintMatch", "olderChildAgeRead", "hoodDominantSilhouette", "expressionIdentity", "sameArtistRenderingCalibration", "singleCharacterCalibrationPresentation", "untouchedComparisonMethod"]:
        if gates.get(name) != "required":
            fail(f"Prismel gate must remain required: {name}")
    for name in ["identityFirewall", "zeroKinezaGeometryTransfer", "forbiddenLikenessDrift", "forbiddenDesignDrift", "masterGeometryFreeze"]:
        if gates.get(name) != "hard-reject":
            fail(f"Prismel hard-reject gate drifted: {name}")


def validate_prismel_inspection() -> None:
    data = load_json(PRISMEL_INSPECTION, "Prismel HeroCel Master A inspection")
    if data.get("inspectionId") != "prismel-herocel-master-a-inspection":
        fail("Prismel Master A inspectionId drifted")
    if data.get("status") != "approved-master-a-geometry-authority-pending-same-artist-rendering-calibration":
        fail("Prismel Master A inspection status drifted")
    stress = data.get("multiviewStressTest", {})
    if stress.get("status") != "conditional-pass":
        fail("Prismel multiview stress test must remain conditional-pass until final promotion")
    comparison = data.get("sameArtistComparison", {})
    if comparison.get("status") != "calibration-required":
        fail("Prismel same-artist comparison must remain calibration-required before Master B")
    if comparison.get("currentScores", {}).get("overallSameArtistImpression") != 8.3:
        fail("Prismel historical same-artist baseline drifted")
    target = comparison.get("passTarget", {})
    if target.get("overallSameArtistImpressionMinimum") != 9.2 or target.get("elijahLikenessMinimum") != 9.3:
        fail("Prismel Master B promotion thresholds drifted")
    next_candidate = data.get("nextCandidate", {})
    if next_candidate.get("name") != "Prismel HeroCel Master B":
        fail("Prismel next candidate must remain Master B")
    if next_candidate.get("renderingRule") != "apply prismel-herocel-v1 revision 1.2-same-artist-calibration":
        fail("Prismel Master B rendering rule drifted")


def main() -> None:
    validate_herocel()
    validate_portability()
    validate_prismel()
    validate_prismel_inspection()
    print("PZ STYLE AUTHORITY PASS: HeroCel firewalls, portability, Prismel Master A geometry freeze, and Master B same-artist calibration are locked and valid")


if __name__ == "__main__":
    main()
