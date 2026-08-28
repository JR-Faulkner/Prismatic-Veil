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
CANDIDATE_C = ROOT / "pv-data/style_authority/characters/sarallel_herocel_candidate_c_inspection.json"


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
    candidate = load(CANDIDATE_C, "Sarallel HeroCel Candidate C inspection")

    if data.get("schemaVersion") != 2:
        fail("likeness authority schemaVersion must remain 2")
    if data.get("status") != "locked-hair-down-primary-likeness-authority":
        fail("hair-down likeness authority must remain locked")
    if data.get("approvedDerivedMaster", {}).get("name") != "Sarallel Likeness Master A":
        fail("Sarallel Likeness Master A drifted")
    if data.get("likenessSourcePolicy", {}).get("legacyFantasyIterations", {}).get("likenessContributionPercent") != 0:
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

    if candidate.get("inspectionId") != "sarallel-herocel-candidate-c-inspection":
        fail("Candidate C inspection id drifted")
    if candidate.get("status") != "near-pass-animation-sufficient-identity-refinement-required":
        fail("Candidate C must remain a near-pass requiring identity refinement")
    cand = candidate.get("candidate", {})
    if cand.get("generationId") != "9006ca69-1ac7-428c-9418-d2d3162abc25":
        fail("Candidate C generation evidence drifted")
    if cand.get("sha256") != "7a4dcf77d0622a7d3621fbb66e2a05b4eb1fda3810939c8f9baa41f49988aaad":
        fail("Candidate C image hash drifted")
    inspect = candidate.get("inspection", {})
    if inspect.get("heroCelAnimationRead", 0) < 9.2:
        fail("Candidate C animation read must remain sufficient")
    if inspect.get("sarahLikeness", 10) >= 9.0:
        fail("Candidate C must remain below final likeness promotion floor")
    if inspect.get("animationVerdict") != "sufficient-lock-current-intensity":
        fail("Candidate C animation intensity must remain locked sufficient")

    if hero.get("schemaVersion") != 3:
        fail("Sarallel HeroCel schemaVersion must remain 3")
    if hero.get("profileRevision") != "1.2-identity-correction-fixed-animation-intensity":
        fail("Sarallel identity-correction revision drifted")
    if hero.get("status") != "locked-near-pass-profile-pending-identity-correction":
        fail("Sarallel must remain in identity-correction stage")
    if hero.get("inherits") != "prismatic-herocel-v1" or hero.get("ageAdapter") != "adult":
        fail("Sarallel HeroCel inheritance drifted")

    stack = hero.get("authorityStack", {})
    if stack.get("likenessAuthority", {}).get("master") != "Sarallel Likeness Master A":
        fail("likeness authority drifted")
    if stack.get("characterDesignAuthority", {}).get("master") != "Sarallel Design Master A":
        fail("design authority drifted")
    if stack.get("currentRenderingCalibration", {}).get("candidate") != "Sarallel HeroCel Candidate C":
        fail("Candidate C must remain animation-intensity reference")

    firewall = hero.get("identityFirewall", {})
    for key in ["kinezaGeometryContributionPercent", "kinezaLikenessContributionPercent", "legacySarallelFaceContributionPercent", "heroCelGeometryContributionPercent"]:
        if firewall.get(key) != 0:
            fail(f"geometry/likeness contribution must remain zero: {key}")
    if firewall.get("heroCelStyleApplicationPercent") != 100:
        fail("HeroCel style application must remain rendering-only 100%")

    stage = hero.get("currentStage", {})
    if stage.get("name") != "identity-correction-at-fixed-herocel-intensity":
        fail("current Sarallel stage drifted")
    if stage.get("animationIntensityStatus") != "locked-sufficient":
        fail("animation intensity must remain locked sufficient")
    if stage.get("animationReference") != "Sarallel HeroCel Candidate C":
        fail("Candidate C must remain animation reference")
    if stage.get("fullBodyGenerationAllowed") is not True:
        fail("full-body generation should be allowed for Candidate D")
    if stage.get("singleCharacterOnly") is not True or stage.get("multiViewSheetAllowed") is not False:
        fail("Candidate D must remain a single-character, no-sheet test")
    if stage.get("nextAsset") != "Sarallel HeroCel Candidate D":
        fail("next Sarallel asset must be Candidate D")
    require_items(stage.get("allowedCorrection"), [
        "restore cheek fullness",
        "restore jaw width and softer jaw transition",
        "restore rounded chin read",
        "restore broader softer nose family",
        "restore Sarah-specific smile width and cheek lift",
    ], "identity-only correction targets")
    require_items(stage.get("forbiddenCorrection"), [
        "increase HeroCel intensity",
        "decrease HeroCel intensity",
        "change graphic shadow language",
        "change grouped hair rendering language",
        "change material abstraction level",
        "change edge hierarchy",
        "change pose or camera",
    ], "fixed-animation correction firewall")

    lock = hero.get("renderingLock", {})
    if lock.get("source") != "Sarallel HeroCel Candidate C":
        fail("rendering lock source drifted")
    if lock.get("heroCelAnimationRead") != 9.3 or lock.get("minimumAllowed") != 9.2:
        fail("rendering lock thresholds drifted")

    require_items(hero.get("hardReject"), [
        "face narrowing",
        "jaw taper increase",
        "cheek-volume loss",
        "nose narrowing or sharpening",
        "generic heroine smile substitution",
        "animation intensity increased beyond Candidate C",
        "animation intensity softened below Candidate C",
        "new painterly regression",
        "new exaggerated anime normalization",
    ], "Sarallel Candidate D hard rejects")

    contract = hero.get("generationContract", {})
    if contract.get("nextAsset") != "Sarallel HeroCel Candidate D":
        fail("generation contract next asset drifted")
    if contract.get("primaryVisualSource") != "approved Sarallel Design Master A full-body image":
        fail("Design Master A must remain primary visual source")
    if contract.get("renderingCalibrationSource") != "Sarallel HeroCel Candidate C for animation intensity only":
        fail("Candidate C must remain rendering-intensity-only source")
    if "Do not intensify or soften HeroCel" not in contract.get("artistInstruction", ""):
        fail("Candidate D instruction must freeze HeroCel intensity")

    target = hero.get("passTarget", {})
    if target.get("sarahLikenessMinimum") != 9.0:
        fail("Sarallel likeness floor drifted")
    if target.get("heroCelAnimationReadMinimum") != 9.2:
        fail("animation floor drifted")
    if target.get("sarallelDesignFidelityMinimum") != 9.3:
        fail("design fidelity floor drifted")
    if target.get("sameArtistImpressionMinimum") != 9.2:
        fail("same-artist floor drifted")
    if target.get("animationIntensityMustRemainStable") is not True:
        fail("Candidate D must preserve animation intensity")

    gates = hero.get("prizimGates", {})
    for name in ["sarahGeometryOwnership", "zeroHeroCelGeometryTransfer", "zeroKinezaGeometryTransfer", "zeroLegacyFantasyFaceTransfer", "animationIntensityDrift"]:
        if gates.get(name) != "hard-reject":
            fail(f"hard-reject gate drifted: {name}")
    for name in ["hairDownAppearanceRetention", "sarahLikenessRetention", "adultAgeRead", "sarallelDesignFidelity", "heroCelAnimationRead", "singleCharacterPresentation"]:
        if gates.get(name) != "required":
            fail(f"required gate drifted: {name}")

    print("PZ SARALLEL LIKENESS PASS: Candidate C locks sufficient HeroCel intensity; Candidate D is identity/design correction only")


if __name__ == "__main__":
    main()
