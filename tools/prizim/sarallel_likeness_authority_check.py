#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"
MASTER_A = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_a_inspection.json"
MASTER_B = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_b_inspection.json"
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
    design = load(DESIGN, "Sarallel design master")
    hero = load(HERO, "Sarallel HeroCel profile")
    g = load(CANDIDATE_G, "Sarallel Candidate G historical inspection")
    g_review = load(CANDIDATE_G_REVIEW, "Sarallel Candidate G human review")

    if authority.get("schemaVersion") != 3:
        fail("likeness authority schemaVersion must be 3")
    if authority.get("status") != "locked-master-b-geometry-hair-down-presentation-authority":
        fail("Master B / hair-down presentation authority drifted")

    approved = authority.get("approvedDerivedMaster", {})
    if approved.get("name") != "Sarah Likeness Master B":
        fail("Sarah Likeness Master B must remain current derived likeness calibration")
    if approved.get("generationId") != "7ae81a0a-4bba-47cc-a523-70751f1374a0":
        fail("Master B generation evidence drifted")
    if approved.get("sha256") != "c5bb063d958eebf6af676c3390ec524cc3f9eccfcc4d2724e0e21ffbc7a7f7e0":
        fail("Master B hash evidence drifted")
    if approved.get("separateSarahApprovalRecorded") is not False:
        fail("do not falsely claim separate Sarah approval for Master B")

    if master_b.get("inspectionId") != "sarallel-likeness-master-b-inspection":
        fail("Master B inspection id drifted")
    if master_b.get("status") != "user-accepted-strongest-current-likeness-base-pending-separate-sarah-approval":
        fail("Master B acceptance state drifted")
    if master_b.get("master", {}).get("sha256") != approved.get("sha256"):
        fail("Master B inspection/authority hash mismatch")

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

    if hero.get("schemaVersion") != 7:
        fail("Sarallel HeroCel schemaVersion must remain 7")
    if hero.get("profileRevision") != "1.6-master-b-likeness-transition-reset":
        fail("Master B transition profile revision drifted")
    if hero.get("status") != "master-b-locked-pending-likeness-only-herocel-transition":
        fail("Sarallel must remain at likeness-only transition stage")

    stack = hero.get("authorityStack", {})
    if stack.get("likenessAuthority", {}).get("master") != "Sarah Likeness Master B":
        fail("HeroCel profile must use Master B as current derived likeness calibration")
    if "withheld" not in stack.get("characterDesignAuthority", {}).get("priority", ""):
        fail("Sarallel design must remain withheld until likeness transition passes")
    if stack.get("historicalAnimationReference", {}).get("candidate") != "Sarallel HeroCel Candidate G":
        fail("Candidate G must remain historical animation reference")

    firewall = hero.get("identityFirewall", {})
    if firewall.get("candidateGFaceContributionPercent") != 0:
        fail("Candidate G face contribution must remain zero")
    if firewall.get("heroCelGeometryContributionPercent") != 0:
        fail("HeroCel geometry contribution must remain zero")
    if firewall.get("legacySarallelFaceContributionPercent") != 0:
        fail("legacy Sarallel face contribution must remain zero")

    transition = hero.get("currentTransition", {})
    if transition.get("name") != "Sarah HeroCel Likeness Transition A":
        fail("next transition name drifted")
    if transition.get("stage") != "likeness-only":
        fail("next transition must remain likeness-only")
    if transition.get("visualBase") != "Sarah Likeness Master B":
        fail("next transition must originate from Master B")

    forbidden = set(transition.get("explicitlyForbidden", []))
    for item in [
        "invented dimples",
        "invented nasolabial lines",
        "invented cheek crease lines",
        "invented under-eye crease lines",
        "Sarallel armor",
        "Sarallel crystals",
        "Sarallel cape",
    ]:
        if item not in forbidden:
            fail(f"transition protection missing: {item}")

    if g.get("inspectionId") != "sarallel-herocel-candidate-g-inspection":
        fail("Candidate G historical inspection drifted")
    if g_review.get("status") != "superseded-after-human-age-read-feedback":
        fail("Candidate G must remain superseded after Sarah age-read feedback")
    if g_review.get("candidate") != "Sarallel HeroCel Candidate G":
        fail("Candidate G human review target drifted")

    gate = hero.get("nextGate", {})
    if gate.get("name") != "human-reviewed-likeness-only-herocel-transition":
        fail("next gate must be human-reviewed likeness-only HeroCel transition")
    if gate.get("requiredSource") != "Sarah Likeness Master B":
        fail("next gate must use Master B")
    if "Sarallel Design Master A" not in gate.get("designReintroductionOnPass", ""):
        fail("Sarallel design may only return after likeness gate passes")

    print("PZ SARALLEL LIKENESS PASS: Master B is current likeness calibration; Candidate G face authority is zero; next stage is Sarah-only HeroCel transition with no invented dimples/age lines and no Sarallel design until human likeness approval")


if __name__ == "__main__":
    main()
