#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"
LIKENESS_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_a_inspection.json"
DESIGN_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_design_master_a_inspection.json"
HERO = ROOT / "pv-data/style_authority/characters/sarallel_herocel_v1.json"
HYBRID = ROOT / "pv-data/style_authority/characters/sarallel_herocel_hybrid_calibration_v1.json"
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
    authority = load(AUTHORITY, "Sarallel likeness authority")
    likeness = load(LIKENESS_MASTER, "Sarallel likeness Master A inspection")
    design = load(DESIGN_MASTER, "Sarallel Design Master A inspection")
    hero = load(HERO, "Sarallel HeroCel profile")
    hybrid = load(HYBRID, "Sarallel hybrid calibration")
    reject = load(REJECT, "Sarallel rejected HeroCel attempt")
    face_reject = load(FACE_REJECT, "Sarallel rejected face calibration")

    if authority.get("schemaVersion") != 2:
        fail("likeness authority schemaVersion must remain 2")
    if authority.get("status") != "locked-hair-down-primary-likeness-authority":
        fail("hair-down likeness authority must remain locked")
    if authority.get("approvedDerivedMaster", {}).get("name") != "Sarallel Likeness Master A":
        fail("Sarallel Likeness Master A drifted")
    if authority.get("likenessSourcePolicy", {}).get("legacyFantasyIterations", {}).get("likenessContributionPercent") != 0:
        fail("legacy fantasy face likeness contribution must remain zero")

    if likeness.get("status") != "approved-user-accepted-hair-down-primary-likeness-authority":
        fail("likeness Master A must remain approved")
    if likeness.get("hairAuthority", {}).get("presentation") != "hair down":
        fail("hair-down appearance must remain primary")

    if design.get("status") != "approved-design-master-a-pending-herocel-retention-pass":
        fail("Design Master A status drifted")
    scores = design.get("pZInspection", {}).get("scores", {})
    if scores.get("sarahLikeness", 0) < 9.0 or scores.get("sarallelDesignFidelity", 0) < 9.3:
        fail("Design Master A evidence fell below locked floors")

    if reject.get("status") != "hard-reject-likeness-drift":
        fail("HeroCel attempt 01 must remain rejected")
    if face_reject.get("status") != "reject-insufficient-animation-model-read":
        fail("face calibration attempt 01 must remain rejected")

    if hybrid.get("calibrationId") != "sarallel-herocel-hybrid-calibration-v1":
        fail("hybrid calibration id drifted")
    if hybrid.get("status") != "locked-hybrid-target-pending-candidate-f":
        fail("hybrid calibration status drifted")

    d = hybrid.get("identityDesignReference", {})
    if d.get("name") != "Sarallel HeroCel Candidate D":
        fail("Candidate D must remain identity/design reference")
    if d.get("generationId") != "75f69ea3-fe00-4f75-af51-a06667b25be5":
        fail("Candidate D generation evidence drifted")
    if d.get("sha256") != "363f82108a1280c11037491ffda3a1cb0d0485ed7bc63bcd877df8469edbdb7b":
        fail("Candidate D image hash drifted")

    e = hybrid.get("renderingIntensityReference", {})
    if e.get("name") != "Sarallel HeroCel Rendering Pass E":
        fail("Rendering Pass E must remain rendering reference")
    if e.get("generationId") != "646feea9-b459-4817-afde-0080af1cd88d":
        fail("Rendering Pass E generation evidence drifted")
    if e.get("sha256") != "bd141c80ac8969ce991a64c86cb4a1ddc1a0dcea3cb1481191b12c4708d61b3d":
        fail("Rendering Pass E image hash drifted")
    if e.get("heroCelAnimationRead", 0) < 9.2:
        fail("Rendering Pass E animation read fell below floor")
    for key in ["geometryContributionPercent", "likenessContributionPercent", "designGeometryContributionPercent"]:
        if e.get(key) != 0:
            fail(f"Rendering Pass E must contribute zero {key}")

    target = hybrid.get("hybridTarget", {})
    if target.get("nextAsset") != "Sarallel HeroCel Candidate F":
        fail("hybrid next asset must remain Candidate F")
    if target.get("formula") != "Candidate D identity/design + Rendering Pass E animation intensity":
        fail("hybrid formula drifted")
    require_items(target.get("requiredIdentityCorrections"), [
        "keep Candidate D face width",
        "keep Candidate D cheek fullness",
        "keep Candidate D softer broader jaw transition",
        "keep Candidate D rounded chin",
        "keep Candidate D broader softer nose family",
        "keep Candidate D Sarah-specific smile geometry",
    ], "Candidate D identity locks")
    require_items(target.get("requiredRenderingLocks"), [
        "match Rendering Pass E cel-value strength",
        "match Rendering Pass E graphic shadow clarity",
        "match Rendering Pass E grouped hair treatment",
        "match Rendering Pass E material abstraction",
        "match Rendering Pass E edge hierarchy",
    ], "Rendering Pass E style locks")

    if hero.get("schemaVersion") != 4:
        fail("Sarallel HeroCel schemaVersion must remain 4")
    if hero.get("profileRevision") != "1.3-hybrid-identity-rendering-lock":
        fail("Sarallel hybrid profile revision drifted")
    if hero.get("status") != "locked-hybrid-calibration-pending-candidate-f":
        fail("Sarallel must remain in hybrid calibration stage")
    if hero.get("inherits") != "prismatic-herocel-v1" or hero.get("ageAdapter") != "adult":
        fail("Sarallel HeroCel inheritance drifted")

    stack = hero.get("authorityStack", {})
    if stack.get("likenessAuthority", {}).get("master") != "Sarallel Likeness Master A":
        fail("likeness authority drifted")
    if stack.get("characterDesignAuthority", {}).get("master") != "Sarallel Design Master A":
        fail("design authority drifted")
    if stack.get("identityDesignCalibration", {}).get("candidate") != "Sarallel HeroCel Candidate D":
        fail("Candidate D must remain identity/design calibration")
    if stack.get("renderingCalibration", {}).get("candidate") != "Sarallel HeroCel Rendering Pass E":
        fail("Rendering Pass E must remain rendering calibration")

    firewall = hero.get("identityFirewall", {})
    for key in [
        "kinezaGeometryContributionPercent",
        "kinezaLikenessContributionPercent",
        "legacySarallelFaceContributionPercent",
        "heroCelGeometryContributionPercent",
        "renderingPassEGeometryContributionPercent",
        "renderingPassELikenessContributionPercent",
    ]:
        if firewall.get(key) != 0:
            fail(f"geometry/likeness contribution must remain zero: {key}")

    stage = hero.get("currentStage", {})
    if stage.get("name") != "hybrid-identity-rendering-calibration":
        fail("current Sarallel stage drifted")
    if stage.get("identityDesignReference") != "Sarallel HeroCel Candidate D":
        fail("Candidate D stage reference drifted")
    if stage.get("renderingIntensityReference") != "Sarallel HeroCel Rendering Pass E":
        fail("Rendering Pass E stage reference drifted")
    if stage.get("nextAsset") != "Sarallel HeroCel Candidate F":
        fail("next Sarallel asset must remain Candidate F")
    if stage.get("fullBodyGenerationAllowed") is not True or stage.get("singleCharacterOnly") is not True:
        fail("Candidate F must remain single full-body character")
    if stage.get("multiViewSheetAllowed") is not False:
        fail("Candidate F must remain no-sheet")
    require_items(stage.get("forbiddenCorrection"), [
        "use Rendering Pass E face geometry",
        "use Rendering Pass E nose geometry",
        "use Rendering Pass E jaw geometry",
        "use Rendering Pass E smile geometry",
        "push animation materially beyond Rendering Pass E",
        "change pose or camera",
    ], "hybrid geometry firewall")

    lock = hero.get("renderingLock", {})
    if lock.get("source") != "Sarallel HeroCel Rendering Pass E":
        fail("rendering lock source drifted")
    if lock.get("heroCelAnimationRead") != 9.4 or lock.get("minimumAllowed") != 9.2:
        fail("rendering lock thresholds drifted")

    contract = hero.get("generationContract", {})
    if contract.get("nextAsset") != "Sarallel HeroCel Candidate F":
        fail("generation contract next asset drifted")
    if contract.get("primaryVisualSource") != "Sarallel HeroCel Candidate D for identity/design retention":
        fail("Candidate D must remain primary identity/design visual source")
    if contract.get("renderingCalibrationSource") != "Sarallel HeroCel Rendering Pass E for rendering intensity only":
        fail("Rendering Pass E must remain rendering-only source")
    if "Do not borrow any Rendering Pass E face geometry" not in contract.get("artistInstruction", ""):
        fail("Candidate F instruction must explicitly block Rendering Pass E face geometry")

    pass_target = hero.get("passTarget", {})
    if pass_target.get("sarahLikenessMinimum") != 9.0:
        fail("Sarallel likeness floor drifted")
    if pass_target.get("heroCelAnimationReadMinimum") != 9.2:
        fail("animation floor drifted")
    if pass_target.get("sarallelDesignFidelityMinimum") != 9.3:
        fail("design fidelity floor drifted")
    if pass_target.get("sameArtistImpressionMinimum") != 9.2:
        fail("same-artist floor drifted")
    if pass_target.get("renderingPassEGeometryContributionRequired") != 0:
        fail("Rendering Pass E geometry contribution must remain zero")

    gates = hero.get("prizimGates", {})
    for name in [
        "sarahGeometryOwnership",
        "zeroHeroCelGeometryTransfer",
        "zeroRenderingPassEGeometryTransfer",
        "zeroKinezaGeometryTransfer",
        "zeroLegacyFantasyFaceTransfer",
        "animationIntensityDrift",
    ]:
        if gates.get(name) != "hard-reject":
            fail(f"hard-reject gate drifted: {name}")
    for name in [
        "hairDownAppearanceRetention",
        "sarahLikenessRetention",
        "adultAgeRead",
        "sarallelDesignFidelity",
        "heroCelAnimationRead",
        "singleCharacterPresentation",
    ]:
        if gates.get(name) != "required":
            fail(f"required gate drifted: {name}")

    print("PZ SARALLEL LIKENESS PASS: Candidate D owns identity/design retention; Rendering Pass E supplies HeroCel intensity only; Candidate F is the locked hybrid target")


if __name__ == "__main__":
    main()
