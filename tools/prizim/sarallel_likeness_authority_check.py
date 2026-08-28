#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"
LIKENESS_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_a_inspection.json"
DESIGN_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_design_master_a_inspection.json"
HERO = ROOT / "pv-data/style_authority/characters/sarallel_herocel_v1.json"
REJECT = ROOT / "pv-data/style_authority/characters/sarallel_herocel_attempt_01_reject.json"


def fail(msg: str) -> None:
    raise SystemExit(f"PZ SARALLEL LIKENESS FAIL: {msg}")


def load(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f"{label} missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{label} invalid JSON: {exc}")


def require_items(actual, required, label):
    actual = set(actual or [])
    missing = sorted(set(required) - actual)
    if missing:
        fail(f"{label} missing: {', '.join(missing)}")


def main() -> None:
    data = load(AUTHORITY, "Sarallel likeness authority")
    likeness = load(LIKENESS_MASTER, "Sarallel likeness Master A inspection")
    design = load(DESIGN_MASTER, "Sarallel Design Master A inspection")
    hero = load(HERO, "Sarallel HeroCel profile")
    reject = load(REJECT, "Sarallel rejected HeroCel attempt")

    if data.get("schemaVersion") != 2:
        fail("likeness authority schemaVersion must remain 2")
    if data.get("authorityId") != "sarallel-likeness-authority-v1":
        fail("authorityId drifted")
    if data.get("status") != "locked-hair-down-primary-likeness-authority":
        fail("Sarallel hair-down likeness authority must remain locked")

    approved = data.get("approvedDerivedMaster", {})
    if approved.get("name") != "Sarallel Likeness Master A":
        fail("approved derived likeness master drifted")
    if approved.get("presentation") != "hair-down primary":
        fail("hair-down presentation must remain primary")
    if approved.get("sha256") != "6a386387d712fcfdac6e34738842e79dc4df1f2788567ff11f602c25a1f63024":
        fail("Sarallel Likeness Master A evidence hash drifted")

    policy = data.get("likenessSourcePolicy", {})
    appearance = policy.get("appearancePriority", {})
    if appearance.get("primary") != "hair-down real-photo presentation and Sarallel Likeness Master A":
        fail("hair-down primary appearance policy drifted")
    legacy = policy.get("legacyFantasyIterations", {})
    if legacy.get("role") != "design-only":
        fail("legacy Sarallel iterations must remain design-only")
    if legacy.get("facialGeometryContributionPercent") != 0 or legacy.get("likenessContributionPercent") != 0:
        fail("legacy fantasy faces must remain at 0% likeness and geometry contribution")

    geometry = data.get("geometryAuthority", {})
    if geometry.get("priority") != "absolute" or geometry.get("owner") != "real-photo-likeness-subject":
        fail("real-photo Sarah geometry must remain absolute")
    require_items(
        geometry.get("lockedAnchors"),
        [
            "broader face through cheek region",
            "full lower-cheek volume",
            "soft broad jaw transition",
            "rounded chin rather than pointed chin",
            "natural adult eye scale and spacing",
            "broader softer nose family including base and tip",
            "wider mouth geometry",
            "warm broad smile with distinctive cheek lift",
            "hair-down face framing as primary Sarallel appearance",
        ],
        "Sarallel likeness anchors",
    )

    if likeness.get("inspectionId") != "sarallel-likeness-master-a-inspection":
        fail("likeness Master A inspection id drifted")
    if likeness.get("status") != "approved-user-accepted-hair-down-primary-likeness-authority":
        fail("likeness Master A must remain user-accepted hair-down authority")
    approval = likeness.get("approvalScope", {})
    if approval.get("userAcceptedInChat") is not True:
        fail("user acceptance of likeness Master A must remain recorded")
    if approval.get("separateSarahApprovalRecorded") is not False:
        fail("do not claim separate Sarah approval until explicitly recorded")
    if likeness.get("hairAuthority", {}).get("presentation") != "hair down":
        fail("likeness Master A hair authority drifted")

    if design.get("inspectionId") != "sarallel-design-master-a-inspection":
        fail("Design Master A inspection id drifted")
    if design.get("status") != "approved-design-master-a-pending-herocel-retention-pass":
        fail("Design Master A status drifted")
    if design.get("master", {}).get("sha256") != "d45e49cdd8bae8bce2c506a7266d3cb3eedf47dae433f197ba301c8f65f2d725":
        fail("Design Master A evidence hash drifted")
    scores = design.get("pZInspection", {}).get("scores", {})
    if scores.get("sarahLikeness", 0) < 9.0:
        fail("Design Master A Sarah likeness fell below 9.0")
    if scores.get("sarallelDesignFidelity", 0) < 9.3:
        fail("Design Master A design fidelity fell below 9.3")
    require_items(
        design.get("hardRejectDuringHeroCel"),
        [
            "additional face narrowing",
            "additional jaw taper",
            "cheek-volume loss",
            "nose sharpening or narrowing",
            "eye enlargement or upward tilt",
            "generic glamorous heroine face",
            "generic heroine smile",
            "age regression",
            "hair geometry redesign",
            "armor redesign",
        ],
        "Sarallel Design Master A HeroCel rejects",
    )

    if reject.get("attemptId") != "sarallel-herocel-attempt-01":
        fail("rejected HeroCel attempt id drifted")
    if reject.get("status") != "hard-reject-likeness-drift":
        fail("HeroCel attempt 01 must remain a hard reject")
    if reject.get("sha256") != "f672a54bd4433bbfde13bacbdfcc7429aa3048e15ce575136e5d0cca5de8bb8e":
        fail("rejected HeroCel attempt evidence hash drifted")
    require_items(
        reject.get("failureVectors"),
        [
            "face narrowed during style translation",
            "jaw became more tapered",
            "eyes became more stylized and lifted",
            "cheeks lost Sarah-specific fullness",
            "nose became slightly sharper and narrower",
            "smile became a generic animated-heroine smile",
        ],
        "HeroCel attempt 01 negative calibration",
    )

    if hero.get("profileId") != "sarallel-herocel-v1":
        fail("Sarallel HeroCel profile id drifted")
    if hero.get("profileRevision") != "1.0-identity-firewall":
        fail("Sarallel HeroCel identity firewall revision drifted")
    if hero.get("inherits") != "prismatic-herocel-v1" or hero.get("ageAdapter") != "adult":
        fail("Sarallel must inherit HeroCel with adult age adapter")

    stack = hero.get("authorityStack", {})
    if stack.get("likenessAuthority", {}).get("master") != "Sarallel Likeness Master A":
        fail("Sarallel Likeness Master A must remain likeness authority")
    if stack.get("characterDesignAuthority", {}).get("master") != "Sarallel Design Master A":
        fail("Sarallel Design Master A must remain design authority")
    if stack.get("renderingAuthority") != "prismatic-herocel-v1":
        fail("HeroCel must remain rendering authority only")

    firewall = hero.get("identityFirewall", {})
    if firewall.get("priority") != "absolute":
        fail("Sarallel identity firewall must remain absolute")
    for key in [
        "kinezaGeometryContributionPercent",
        "kinezaLikenessContributionPercent",
        "legacySarallelFaceContributionPercent",
        "heroCelGeometryContributionPercent",
    ]:
        if firewall.get(key) != 0:
            fail(f"Sarallel identity firewall contribution must remain zero: {key}")
    if firewall.get("heroCelStyleApplicationPercent") != 100:
        fail("HeroCel style application must remain 100% rendering-only")

    require_items(
        hero.get("hardReject"),
        [
            "face narrowing",
            "jaw taper increase",
            "cheek-volume loss",
            "nose narrowing or sharpening",
            "eye enlargement",
            "eye upward-tilt increase",
            "generic animated-heroine eye construction",
            "generic heroine smile substitution",
            "beauty normalization that weakens Sarah likeness",
            "age regression",
            "hair-up substitution",
            "hairline or face-framing redesign",
            "armor redesign",
            "legacy Sarallel fantasy face reintroduced",
        ],
        "Sarallel HeroCel hard rejects",
    )

    contract = hero.get("generationContract", {})
    if contract.get("nextAsset") != "Sarallel HeroCel Master B":
        fail("next Sarallel HeroCel asset must remain Master B")
    presentation = contract.get("presentation", "")
    if "single neutral full-body Sarallel character master only" not in presentation or "no sheet" not in presentation:
        fail("Sarallel HeroCel Master B must remain single-character, no-sheet presentation")
    if "Do not normalize Sarah toward a generic animated heroine" not in contract.get("artistInstruction", ""):
        fail("Sarallel artist instruction must explicitly reject generic heroine normalization")
    excluded = set(contract.get("excludeAsVisualAppearanceReferences", []))
    for item in ["Kineza", "Prismel", "legacy Sarallel fantasy iterations", "rejected Sarallel HeroCel attempt 01"]:
        if item not in excluded:
            fail(f"Sarallel visual reference exclusion missing: {item}")

    target = hero.get("passTarget", {})
    if target.get("sarahLikenessMinimum") != 9.0:
        fail("Sarallel likeness floor drifted")
    if target.get("sarallelDesignFidelityMinimum") != 9.3:
        fail("Sarallel design fidelity floor drifted")
    if target.get("heroCelStyleMinimum") != 9.2 or target.get("sameArtistImpressionMinimum") != 9.2:
        fail("Sarallel HeroCel/same-artist target drifted")
    if "Never regenerate the characters together" not in target.get("comparisonMethod", ""):
        fail("Sarallel same-artist comparison must remain untouched-master only")

    gates = hero.get("prizimGates", {})
    for name in [
        "sarahGeometryOwnership",
        "zeroHeroCelGeometryTransfer",
        "zeroKinezaGeometryTransfer",
        "zeroLegacyFantasyFaceTransfer",
    ]:
        if gates.get(name) != "hard-reject":
            fail(f"Sarallel hard-reject gate drifted: {name}")
    for name in [
        "hairDownAppearanceRetention",
        "sarahLikenessRetention",
        "adultAgeRead",
        "sarallelDesignFidelity",
        "heroCelRenderingFingerprint",
        "singleCharacterPresentation",
        "untouchedSameArtistComparison",
    ]:
        if gates.get(name) != "required":
            fail(f"Sarallel required gate drifted: {name}")

    print("PZ SARALLEL LIKENESS PASS: hair-down Sarah geometry + Sarallel Design Master A are locked; rejected HeroCel drift is quarantined; Master B must be rendering-only")


if __name__ == "__main__":
    main()
