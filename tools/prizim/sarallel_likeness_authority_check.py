#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"
LIKENESS_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_a_inspection.json"
DESIGN_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_design_master_a_inspection.json"
HERO = ROOT / "pv-data/style_authority/characters/sarallel_herocel_v1.json"
REJECT = ROOT / "pv-data/style_authority/characters/sarallel_herocel_attempt_01_reject.json"
FACE_REJECT = ROOT / "pv-data/style_authority/characters/sarallel_herocel_face_calibration_attempt_01_reject.json"


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
    reject = load(REJECT, "Sarallel rejected HeroCel full-body attempt")
    face_reject = load(FACE_REJECT, "Sarallel rejected face calibration attempt")

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

    if reject.get("attemptId") != "sarallel-herocel-attempt-01":
        fail("rejected full-body HeroCel attempt id drifted")
    if reject.get("status") != "hard-reject-likeness-drift":
        fail("HeroCel attempt 01 must remain a hard reject")
    if reject.get("sha256") != "f672a54bd4433bbfde13bacbdfcc7429aa3048e15ce575136e5d0cca5de8bb8e":
        fail("rejected HeroCel attempt evidence hash drifted")

    if face_reject.get("attemptId") != "sarallel-herocel-face-calibration-attempt-01":
        fail("face calibration reject id drifted")
    if face_reject.get("status") != "reject-insufficient-animation-model-read":
        fail("face calibration attempt 01 must remain rejected for insufficient animation read")
    asset = face_reject.get("asset", {})
    if asset.get("generationId") != "f8cabc3c-f317-4a47-aefe-82fc5e8bf419":
        fail("face calibration reject generation evidence drifted")
    if asset.get("sha256") != "2ba4a0a339ce709217113fb1af33c843f9e63e69ca02fb3f5a9d2c139bcd1f3e":
        fail("face calibration reject image hash drifted")
    pz = face_reject.get("pZAssessment", {})
    if pz.get("heroCelAnimationRead") != "fail":
        fail("face calibration attempt must remain a HeroCel animation-read failure")
    if pz.get("productionPromotion") is not False:
        fail("rejected face calibration cannot be production-promoted")
    if pz.get("useAsGeometryAuthority") is not False or pz.get("useAsRenderingAuthority") is not False:
        fail("rejected face calibration cannot become geometry/rendering authority")
    require_items(
        face_reject.get("failureVectors"),
        [
            "too many soft skin transitions",
            "painterly modeling remained in cheeks, nose, lips, and forehead",
            "hair remained strand-by-strand instead of grouped animation-readable masses",
            "armor retained realistic material gradients and gloss",
            "facial planes were not simplified enough for animation-model readability",
        ],
        "face calibration negative evidence",
    )

    if hero.get("schemaVersion") != 2:
        fail("Sarallel HeroCel schemaVersion must remain 2")
    if hero.get("profileId") != "sarallel-herocel-v1":
        fail("Sarallel HeroCel profile id drifted")
    if hero.get("profileRevision") != "1.1-face-rendering-calibration-v2":
        fail("Sarallel Face Adapter v2 revision drifted")
    if hero.get("status") != "locked-face-calibration-profile-pending-pass":
        fail("Sarallel must remain in face-calibration stage until pass")
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

    mode = hero.get("faceCalibrationMode", {})
    if mode.get("priority") != "current-production-stage":
        fail("face calibration must remain the current Sarallel production stage")
    if mode.get("scope") != "face-and-upper-torso-rendering-only":
        fail("Sarallel calibration scope must remain face-and-upper-torso only")
    for key in ["fullBodyGenerationAllowed", "multiViewSheetAllowed", "actionPoseAllowed", "magicFxAllowed", "alternateExpressionAllowed"]:
        if mode.get(key) is not False:
            fail(f"Sarallel face calibration must block {key}")
    if mode.get("nextAsset") != "Sarallel HeroCel Face Calibration B":
        fail("next Sarallel asset must remain Face Calibration B")
    if "upper-torso portrait" not in mode.get("presentation", "") or "no sheet" not in mode.get("presentation", ""):
        fail("Face Calibration B presentation drifted")
    if "Do not return to full-body" not in mode.get("promotionRule", ""):
        fail("full-body Sarallel must remain blocked until face pass")

    targets = hero.get("renderingOnlyTargets", {})
    if not targets.get("facialValueGrouping", "").startswith("2-to-3 major skin value groups"):
        fail("Sarallel face value-group target drifted")
    if targets.get("facialTransitionBands") != "maximum one restrained transition band between major skin value groups":
        fail("Sarallel facial transition-band limit drifted")
    if "no airbrushed skin" not in targets.get("skinRendering", ""):
        fail("Sarallel skin rendering must explicitly reject airbrushing")
    if "group hair into large animation-readable masses" not in targets.get("hairTreatment", ""):
        fail("Sarallel hair must use grouped animation-readable masses")
    if targets.get("hairMicrodetailRule") != "strand-by-strand rendering may not be the primary hair language":
        fail("Sarallel hair microdetail rule drifted")
    if not targets.get("armorTreatment", "").startswith("2-to-4 major value groups per material"):
        fail("Sarallel armor value-group target drifted")

    animation = hero.get("animationModelFirewall", {})
    if animation.get("requiredRead") != "clean premium animated game character, not painted fantasy portraiture":
        fail("Sarallel required animation-model read drifted")
    require_items(
        animation.get("hardReject"),
        [
            "photoreal portrait rendering",
            "painterly concept-art facial finish",
            "continuous soft facial gradients as the primary form language",
            "airbrushed cheek or forehead modeling",
            "strand-by-strand hair rendering as the dominant hair treatment",
            "realistic glossy armor gradients dominating over graphic value blocks",
            "illustration polish that weakens animation-model readability",
        ],
        "Sarallel animation-model firewall",
    )

    require_items(
        hero.get("hardReject"),
        [
            "face narrowing",
            "jaw taper increase",
            "cheek-volume loss",
            "nose narrowing or sharpening",
            "eye enlargement",
            "generic animated-heroine eye construction",
            "generic heroine smile substitution",
            "age regression",
            "hairline or face-framing redesign",
            "hair curl-pattern redesign that changes Sarah appearance",
            "strong likeness with insufficient HeroCel animation rendering",
            "strong HeroCel rendering with insufficient Sarah likeness",
        ],
        "Sarallel Face Adapter v2 hard rejects",
    )

    contract = hero.get("generationContract", {})
    if contract.get("nextAsset") != "Sarallel HeroCel Face Calibration B":
        fail("generation contract next asset must remain Face Calibration B")
    presentation = contract.get("presentation", "")
    for required in ["single upper-torso Sarallel portrait only", "no sheet", "no full body", "no magic FX"]:
        if required not in presentation:
            fail(f"Face Calibration B presentation missing: {required}")
    if "2-to-3 facial value groups" not in contract.get("styleInstruction", ""):
        fail("Face Calibration B style instruction must enforce 2-to-3 facial value groups")
    excluded = set(contract.get("excludeAsVisualAppearanceReferences", []))
    for item in ["Kineza", "Prismel", "legacy Sarallel fantasy iterations", "generated portraits as replacement likeness authority"]:
        if item not in excluded:
            fail(f"Sarallel visual reference exclusion missing: {item}")

    target = hero.get("passTarget", {})
    if target.get("sarahLikenessMinimum") != 9.0:
        fail("Sarallel likeness floor drifted")
    if target.get("heroCelAnimationReadMinimum") != 9.2:
        fail("Sarallel HeroCel animation-read floor drifted")
    if target.get("faceGeometryRetentionMinimum") != 9.2:
        fail("Sarallel face-geometry retention floor drifted")
    if target.get("hairDownAppearanceMinimum") != 9.2:
        fail("Sarallel hair-down floor drifted")
    if target.get("upperTorsoDesignFidelityMinimum") != 9.3:
        fail("Sarallel upper-torso design floor drifted")
    if target.get("bothIdentityAndAnimationMustPass") is not True:
        fail("identity and animation must both pass")
    if target.get("fullBodyRemainsBlockedUntilMet") is not True:
        fail("full-body must remain blocked until face calibration passes")

    gates = hero.get("prizimGates", {})
    for name in [
        "sarahGeometryOwnership",
        "zeroHeroCelGeometryTransfer",
        "zeroKinezaGeometryTransfer",
        "zeroLegacyFantasyFaceTransfer",
        "animationModelFirewall",
        "identityVsStyleTradeoff",
    ]:
        if gates.get(name) != "hard-reject":
            fail(f"Sarallel hard-reject gate drifted: {name}")
    for name in [
        "hairDownAppearanceRetention",
        "sarahLikenessRetention",
        "adultAgeRead",
        "upperTorsoDesignFidelity",
        "heroCelAnimationRead",
        "singlePortraitPresentation",
    ]:
        if gates.get(name) != "required":
            fail(f"Sarallel required gate drifted: {name}")

    print("PZ SARALLEL LIKENESS PASS: Sarah geometry + hair-down appearance are locked; Face Adapter v2 enforces animation-model rendering; full-body HC remains blocked pending Face Calibration B pass")


if __name__ == "__main__":
    main()
