#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"
MASTER_A = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_a_inspection.json"
MASTER_B = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_b_inspection.json"
TRANSITION_A = ROOT / "pv-data/style_authority/characters/sarallel_herocel_likeness_transition_a_inspection.json"
DESIGN = ROOT / "pv-data/style_authority/characters/sarallel_design_master_a_inspection.json"
HERO = ROOT / "pv-data/style_authority/characters/sarallel_herocel_v1.json"
CANDIDATE_G = ROOT / "pv-data/style_authority/characters/sarallel_herocel_candidate_g_inspection.json"
CANDIDATE_G_REVIEW = ROOT / "pv-data/style_authority/characters/sarallel_herocel_candidate_g_human_review.json"


def fail(msg):
    raise SystemExit(f"PZ SARALLEL LIKENESS FAIL: {msg}")


def load(path, label):
    if not path.exists():
        fail(f"{label} missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{label} invalid JSON: {exc}")


def main():
    authority = load(AUTHORITY, "Sarallel likeness authority")
    master_a = load(MASTER_A, "Sarallel Likeness Master A history")
    master_b = load(MASTER_B, "Sarah Likeness Master B")
    transition_a = load(TRANSITION_A, "Sarah HeroCel Likeness Transition A")
    design = load(DESIGN, "Sarallel design master")
    hero = load(HERO, "Sarallel HeroCel profile")
    g = load(CANDIDATE_G, "Sarallel Candidate G historical inspection")
    g_review = load(CANDIDATE_G_REVIEW, "Sarallel Candidate G human review")

    if authority.get("schemaVersion") != 4:
        fail("likeness authority schemaVersion must be 4")
    if authority.get("status") != "locked-transition-a-animated-likeness-hair-down-presentation-authority":
        fail("Transition A animated likeness authority drifted")

    master = authority.get("approvedDerivedMaster", {})
    if master.get("name") != "Sarah Likeness Master B":
        fail("Sarah Likeness Master B must remain derived geometry calibration")
    if master.get("generationId") != "7ae81a0a-4bba-47cc-a523-70751f1374a0":
        fail("Master B generation evidence drifted")
    if master.get("sha256") != "c5bb063d958eebf6af676c3390ec524cc3f9eccfcc4d2724e0e21ffbc7a7f7e0":
        fail("Master B hash evidence drifted")
    if master.get("separateSarahApprovalRecorded") is not False:
        fail("do not falsely claim separate Sarah approval for Master B")

    animated = authority.get("approvedAnimatedLikenessTransition", {})
    if animated.get("name") != "Sarah HeroCel Likeness Transition A":
        fail("Transition A must remain approved animated likeness bridge")
    if animated.get("generationId") != "860801ab-5670-45cc-aec1-2f9b0cdd6c93":
        fail("Transition A generation evidence drifted")
    if animated.get("sha256") != "b99ab75732bd7066ee1f92b3c2cf05ea8fc0ed3879c3dab59b2f4ef64c0c45a5":
        fail("Transition A hash evidence drifted")
    if animated.get("userApproved") is not True:
        fail("Transition A must remain user-approved")
    if animated.get("separateSarahApprovalRecorded") is not False:
        fail("do not falsely claim separate Sarah approval for Transition A")

    if master_b.get("inspectionId") != "sarallel-likeness-master-b-inspection":
        fail("Master B inspection id drifted")
    if master_b.get("master", {}).get("sha256") != master.get("sha256"):
        fail("Master B inspection/authority hash mismatch")

    if transition_a.get("inspectionId") != "sarallel-herocel-likeness-transition-a-inspection":
        fail("Transition A inspection id drifted")
    if transition_a.get("status") != "user-approved-animated-likeness-transition":
        fail("Transition A approval state drifted")
    evidence = transition_a.get("transition", {})
    if evidence.get("generationId") != animated.get("generationId"):
        fail("Transition A inspection/authority generation mismatch")
    if evidence.get("sha256") != animated.get("sha256"):
        fail("Transition A inspection/authority hash mismatch")
    if evidence.get("sourceBase") != "Sarah Likeness Master B":
        fail("Transition A must originate from Master B")
    if transition_a.get("humanReview", {}).get("likenessRetained") is not True:
        fail("Transition A likeness retention must remain approved")
    if transition_a.get("humanReview", {}).get("heroCelTransitionVisible") is not True:
        fail("Transition A HeroCel transition must remain visibly approved")

    surface = set(authority.get("geometryAuthority", {}).get("surfaceTruthOverrides", []))
    required_surface = {
        "do not invent or deepen dimples absent from the real references",
        "do not invent or deepen nasolabial crease lines absent from the real references",
        "do not invent cheek crease marks as animation shorthand",
        "do not invent under-eye crease lines as animation shorthand",
        "do not use cel-shadow boundaries to imply older age than the real references",
    }
    if not required_surface.issubset(surface):
        fail("real-photo facial-surface truth protections drifted")

    if master_a.get("status") != "approved-user-accepted-hair-down-primary-likeness-authority":
        fail("Master A historical record drifted")
    if design.get("status") != "approved-design-master-a-pending-herocel-retention-pass":
        fail("Sarallel Design Master A history drifted")

    if hero.get("schemaVersion") != 8:
        fail("Sarallel HeroCel schemaVersion must remain 8")
    if hero.get("profileRevision") != "1.7-transition-a-approved-design-reintroduction":
        fail("Transition A design-reintroduction profile revision drifted")
    if hero.get("status") != "transition-a-approved-pending-sarallel-design-reintroduction":
        fail("Sarallel must remain at Transition A design-reintroduction stage")

    stack = hero.get("authorityStack", {})
    if stack.get("animatedLikenessAuthority", {}).get("master") != "Sarah HeroCel Likeness Transition A":
        fail("HeroCel profile must use Transition A as animated face authority")
    design_stack = stack.get("characterDesignAuthority", {})
    if design_stack.get("master") != "Sarallel Design Master A":
        fail("Sarallel Design Master A must remain active design authority")
    if "zero-face-authority" not in design_stack.get("priority", ""):
        fail("Sarallel design authority must have zero face authority")

    firewall = hero.get("identityFirewall", {})
    if firewall.get("animatedFaceOwner") != "Sarah HeroCel Likeness Transition A":
        fail("Transition A must own the animated face")
    for field in [
        "heroCelGeometryContributionPercent",
        "sarallelDesignFaceContributionPercent",
        "legacySarallelFaceContributionPercent",
        "candidateGFaceContributionPercent",
        "kinezaGeometryContributionPercent",
        "kinezaLikenessContributionPercent",
    ]:
        if firewall.get(field) != 0:
            fail(f"{field} must remain zero")

    approved_transition = hero.get("approvedTransition", {})
    if approved_transition.get("generationId") != animated.get("generationId"):
        fail("HeroCel profile Transition A generation evidence drifted")
    if approved_transition.get("sha256") != animated.get("sha256"):
        fail("HeroCel profile Transition A hash evidence drifted")
    if approved_transition.get("status") != "user-approved-animated-likeness-transition":
        fail("HeroCel profile Transition A approval drifted")

    stage = hero.get("currentStage", {})
    if stage.get("name") != "Sarallel HeroCel Design Reintroduction A":
        fail("current Sarallel stage must be design reintroduction A")
    if stage.get("faceSource") != "Sarah HeroCel Likeness Transition A":
        fail("design reintroduction must use Transition A face")
    if stage.get("designSource") != "Sarallel Design Master A":
        fail("design reintroduction must use Design Master A")

    frozen = set(stage.get("faceFrozen", []))
    required_frozen = {
        "face silhouette",
        "cheek width and fullness",
        "jaw transition",
        "chin shape",
        "eye size and spacing",
        "nose family",
        "mouth width",
        "smile geometry",
        "adult age read",
        "absence of invented dimples",
        "absence of invented age-signaling crease lines",
    }
    if not required_frozen.issubset(frozen):
        fail("Transition A frozen-face protections drifted")

    if g.get("inspectionId") != "sarallel-herocel-candidate-g-inspection":
        fail("Candidate G historical inspection drifted")
    if g_review.get("status") != "superseded-after-human-age-read-feedback":
        fail("Candidate G must remain superseded after Sarah age-read feedback")

    gate = hero.get("nextGate", {})
    if gate.get("name") != "sarallel-design-reintroduction-with-frozen-transition-a-face":
        fail("next gate must be frozen-face Sarallel design reintroduction")
    if gate.get("requiredFaceSource") != "Sarah HeroCel Likeness Transition A":
        fail("next gate face source must be Transition A")
    if gate.get("requiredDesignSource") != "Sarallel Design Master A":
        fail("next gate design source must be Design Master A")
    if "untouched same-artist comparison" not in gate.get("promotionOnPass", ""):
        fail("design pass must lead to untouched same-artist comparison")

    print("PZ SARALLEL LIKENESS PASS: Sarah HeroCel Likeness Transition A is locked as animated face authority; real photos retain geometry/surface supremacy; Sarallel Design Master A may return only with zero face contribution")


if __name__ == "__main__":
    main()
