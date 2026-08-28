#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / "pv-data/style_authority/prismatic_herocel_v1.json"
PRISMEL = ROOT / "pv-data/style_authority/characters/prismel_herocel_v1.json"
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
    if "painterly fantasy concept art" not in set(style.get("notEquivalentTo", [])):
        fail("HeroCel must explicitly reject painterly fantasy concept art")

    master = data.get("calibrationMaster", {})
    if master.get("character") != "kineza":
        fail("Kineza must remain the historical rendering calibration master")
    if master.get("role") != "rendering-authority-only":
        fail("Kineza authority must remain rendering-only")
    if master.get("transferScope") != "style-properties-only":
        fail("Kineza transfer scope must remain style-properties-only")

    never_transfer = set(master.get("neverTransfer", []))
    for item in (
        "face shape",
        "eye shape",
        "eye spacing",
        "cheek contour",
        "nose geometry",
        "mouth geometry",
        "jaw width",
        "chin shape",
        "head-to-body ratio",
        "body proportions",
    ):
        if item not in never_transfer:
            fail(f"Kineza geometry firewall missing: {item}")

    firewall = data.get("identityFirewall", {})
    if firewall.get("priority") != "absolute":
        fail("HeroCel identity firewall must remain absolute")
    ownership = firewall.get("ownership", {})
    expected_owners = {
        "facialGeometry": "likenessAuthority",
        "facialFeatureSpacing": "likenessAuthority",
        "headShape": "likenessAuthority",
        "bodyProportions": "characterDesignAuthority + likenessAuthority",
        "costumeGeometry": "characterDesignAuthority",
        "edgeTreatment": "prismatic-herocel-v1",
        "shadowGrouping": "prismatic-herocel-v1",
        "highlightTreatment": "prismatic-herocel-v1",
        "materialStylization": "prismatic-herocel-v1",
    }
    for key, value in expected_owners.items():
        if ownership.get(key) != value:
            fail(f"HeroCel ownership drifted: {key}")

    animation_firewall = data.get("animationRenderingFirewall", {})
    if animation_firewall.get("priority") != "absolute":
        fail("HeroCel animation rendering firewall must remain absolute")
    if animation_firewall.get("requiredRead") != "clean animated character model with premium game finish":
        fail("HeroCel required animation-model read drifted")

    value_contract = animation_firewall.get("valueGroupContract", {})
    if value_contract.get("targetMajorGroupsPerMaterial") != "2-to-4":
        fail("HeroCel must retain the 2-to-4 major value-group target")

    hard_reject = set(animation_firewall.get("hardReject", []))
    for item in (
        "painterly concept-art finish",
        "photoreal portrait rendering",
        "continuous gradient shading as the primary form language",
        "airbrushed skin modeling",
        "uniform high-frequency fabric texture",
        "dense costume micro-detail distributed evenly across the character",
        "illustration polish that weakens animation readability",
    ):
        if item not in hard_reject:
            fail(f"HeroCel animation firewall reject missing: {item}")

    surface = animation_firewall.get("surfaceContract", {})
    if "no pore detail" not in surface.get("skin", ""):
        fail("HeroCel skin surface contract drifted")
    if "organized star clusters" not in surface.get("cosmicFabric", ""):
        fail("HeroCel cosmic-fabric simplification drifted")

    facial_model = animation_firewall.get("facialModelContract", {})
    if "animation-readable planes" not in facial_model.get("rule", ""):
        fail("HeroCel facial animation-model contract drifted")

    detail_frequency = animation_firewall.get("detailFrequencyContract", {})
    if detail_frequency.get("face") != "low":
        fail("HeroCel face micro-detail must remain low")
    if detail_frequency.get("backgroundOrNonfocalTexture") != "minimal":
        fail("HeroCel nonfocal texture must remain minimal")

    portability = data.get("portabilityContract", {})
    if portability.get("randomCharacterTest") != "required":
        fail("HeroCel must remain portable to unrelated characters")

    stack = data.get("translationContract", {}).get("requiredAuthorityStack", [])
    required = ["likenessAuthority", "characterDesignAuthority", "prismatic-herocel-v1"]
    if stack != required:
        fail("three-part translation authority stack changed")

    drift = set(data.get("forbiddenDrift", []))
    for item in (
        "painterly concept-art finish",
        "photoreal portrait rendering",
        "continuous gradient shading as primary form language",
        "uniform high-frequency costume detail",
        "illustration polish that weakens animation readability",
    ):
        if item not in drift:
            fail(f"HeroCel forbidden animation drift missing: {item}")

    gates = data.get("prizimGates", {})
    for name in (
        "likenessRetention",
        "designFidelity",
        "animationReadability",
        "animationModelRead",
        "styleFingerprintMatch",
        "ageAdapterApplied",
        "randomCharacterPortability",
    ):
        if gates.get(name) != "required":
            fail(f"{name} gate must remain required")
    for name in ("identityFirewall", "animationRenderingFirewall", "forbiddenDrift"):
        if gates.get(name) != "hard-reject":
            fail(f"{name} gate must remain hard-reject")


def validate_portability() -> None:
    data = load_json(PORTABILITY, "HeroCel portability fixture")

    if data.get("testId") != "herocel-portability-v1":
        fail("HeroCel portability testId drifted")
    if data.get("styleAuthority") != "prismatic-herocel-v1":
        fail("HeroCel portability fixture must use HeroCel v1")
    if data.get("kinezaLikenessContributionPercent") != 0:
        fail("HeroCel portability fixture must keep Kineza likeness at 0%")
    if data.get("kinezaGeometryContributionPercent") != 0:
        fail("HeroCel portability fixture must keep Kineza geometry at 0%")

    cases = data.get("cases", [])
    required_ids = {
        "unrelated-adult-human",
        "nonhuman-synthetic",
        "young-character-not-kineza",
    }
    found_ids = {case.get("id") for case in cases}
    if found_ids != required_ids:
        fail("HeroCel portability cases drifted")

    style_only_allowed = {
        "edge treatment",
        "shadow grouping",
        "highlight treatment",
        "surface simplification",
        "material readability",
        "detail hierarchy",
        "value grouping",
        "specular simplification",
        "facial surface rendering",
        "highlight clarity",
        "animation readability",
    }
    forbidden_geometry_tokens = (
        "face geometry",
        "eye spacing",
        "eye geometry",
        "nose geometry",
        "jaw geometry",
        "cheek contour",
        "mouth geometry",
        "head proportions",
        "body proportions",
        "costume geometry",
        "shell geometry",
        "expression identity",
    )

    for case in cases:
        allowed = set(case.get("heroCelMayChange", []))
        if not allowed or not allowed.issubset(style_only_allowed):
            fail(f"portability case grants HeroCel non-style authority: {case.get('id')}")
        may_not_change = set(case.get("heroCelMayNotChange", []))
        if not may_not_change:
            fail(f"portability case missing geometry firewall: {case.get('id')}")
        if not any(token in may_not_change for token in forbidden_geometry_tokens):
            fail(f"portability case does not protect subject geometry: {case.get('id')}")


def validate_prismel() -> None:
    data = load_json(PRISMEL, "Prismel HeroCel profile")

    if data.get("schemaVersion") != 2:
        fail("Prismel HeroCel schemaVersion must remain 2")
    if data.get("profileId") != "prismel-herocel-v1":
        fail("Prismel profileId must remain prismel-herocel-v1")
    if data.get("profileRevision") != "1.1-identity-firewall":
        fail("Prismel identity-firewall revision drifted")
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
    if likeness.get("subject") != "Elijah":
        fail("Prismel likeness subject must remain Elijah")
    if likeness.get("priority") != "absolute-geometry-authority":
        fail("Elijah likeness must remain absolute geometry authority")
    anchors = set(likeness.get("identityAnchors", []))
    for anchor in (
        "full cheeks",
        "subtle chin dimple",
        "soft rounded youthful jaw",
        "older-child age read",
    ):
        if anchor not in anchors:
            fail(f"Prismel likeness anchor missing: {anchor}")

    geometry_owned = set(likeness.get("geometryOwned", []))
    for item in (
        "eye shape",
        "eye size",
        "eye spacing",
        "cheek contour and volume",
        "nose width, bridge, tip, and placement",
        "lip proportions and mouth geometry",
        "smile geometry",
        "jaw width and contour",
        "chin shape and dimple",
        "head shape and head-to-body relationship",
    ):
        if item not in geometry_owned:
            fail(f"Elijah geometry ownership missing: {item}")

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

    firewall = data.get("identityFirewall", {})
    if firewall.get("subjectGeometryOwner") != "likenessAuthority":
        fail("Prismel subject geometry owner must remain likenessAuthority")
    if firewall.get("characterGeometryOwner") != "characterDesignAuthority":
        fail("Prismel character geometry owner must remain characterDesignAuthority")
    if firewall.get("styleOwner") != "prismatic-herocel-v1":
        fail("Prismel style owner must remain HeroCel v1")
    if firewall.get("kinezaGeometryContributionPercent") != 0:
        fail("Kineza geometry contribution must remain 0%")
    if firewall.get("kinezaLikenessContributionPercent") != 0:
        fail("Kineza likeness contribution must remain 0%")
    if firewall.get("heroCelStyleApplicationPercent") != 100:
        fail("HeroCel style application must remain 100% style-only")

    gates = data.get("prizimGates", {})
    for name in (
        "likenessRetention",
        "subjectGeometryOwnership",
        "designFidelity",
        "HeroCelFingerprintMatch",
        "olderChildAgeRead",
        "hoodDominantSilhouette",
        "expressionIdentity",
    ):
        if gates.get(name) != "required":
            fail(f"Prismel gate must remain required: {name}")
    for name in (
        "identityFirewall",
        "zeroKinezaGeometryTransfer",
        "forbiddenLikenessDrift",
        "forbiddenDesignDrift",
    ):
        if gates.get(name) != "hard-reject":
            fail(f"Prismel drift gate must remain hard-reject: {name}")

    artist_instruction = data.get("generationContract", {}).get("artistInstruction", "")
    if "Do not use Kineza as an appearance" not in artist_instruction:
        fail("Prismel generation contract must explicitly exclude Kineza appearance authority")


def main() -> None:
    validate_herocel()
    validate_portability()
    validate_prismel()
    print("PZ STYLE AUTHORITY PASS: HeroCel identity + animation rendering firewalls, portability fixture, and Prismel likeness authority are locked and valid")


if __name__ == "__main__":
    main()
