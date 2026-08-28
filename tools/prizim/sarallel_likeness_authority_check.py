#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"
LIKENESS = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_a_inspection.json"
DESIGN = ROOT / "pv-data/style_authority/characters/sarallel_design_master_a_inspection.json"
HERO = ROOT / "pv-data/style_authority/characters/sarallel_herocel_v1.json"
CANDIDATE_G = ROOT / "pv-data/style_authority/characters/sarallel_herocel_candidate_g_inspection.json"


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
    likeness = load(LIKENESS, "Sarallel likeness master")
    design = load(DESIGN, "Sarallel design master")
    hero = load(HERO, "Sarallel HeroCel profile")
    g = load(CANDIDATE_G, "Sarallel Candidate G inspection")

    if authority.get("status") != "locked-hair-down-primary-likeness-authority":
        fail("hair-down Sarah likeness authority drifted")
    if likeness.get("status") != "approved-user-accepted-hair-down-primary-likeness-authority":
        fail("Sarallel Likeness Master A drifted")
    if design.get("status") != "approved-design-master-a-pending-herocel-retention-pass":
        fail("Sarallel Design Master A drifted")

    if hero.get("schemaVersion") != 6:
        fail("Sarallel HeroCel schemaVersion must remain 6")
    if hero.get("profileRevision") != "1.5-candidate-g-lock-pending-same-artist":
        fail("Candidate G profile revision drifted")
    if hero.get("status") != "candidate-g-pz-pass-pending-same-artist-comparison":
        fail("Candidate G must remain pending same-artist comparison")

    single = hero.get("singleSourceEditMode", {})
    if single.get("status") != "proven-effective" or single.get("visualSourceCount") != 1:
        fail("single-source edit mode must remain proven and limited to one visual source")
    if single.get("onlyVisualSource") != "Sarallel HeroCel Candidate D":
        fail("Candidate D must remain the sole visual source for Candidate G")
    if single.get("result") != "Sarallel HeroCel Candidate G":
        fail("single-source edit result drifted")

    current = hero.get("authorityStack", {}).get("currentHeroCelCandidate", {})
    if current.get("candidate") != "Sarallel HeroCel Candidate G":
        fail("Candidate G must remain the current HeroCel lock candidate")

    if g.get("inspectionId") != "sarallel-herocel-candidate-g-inspection":
        fail("Candidate G inspection id drifted")
    if g.get("status") != "pass-lock-candidate":
        fail("Candidate G must remain a pass lock candidate")
    candidate = g.get("candidate", {})
    if candidate.get("generationId") != "7882f852-8c45-4ff4-a4ff-cd392056d3dc":
        fail("Candidate G generation evidence drifted")
    if candidate.get("sourceMode") != "single-source-hc-edit":
        fail("Candidate G must remain a single-source HC edit")

    scores = g.get("pzAssessment", {})
    if scores.get("sarahLikeness", 0) < 9.0:
        fail("Candidate G Sarah likeness below 9.0")
    if scores.get("heroCelAnimationRead", 0) < 9.2:
        fail("Candidate G HeroCel animation read below 9.2")
    if scores.get("sarallelDesignFidelity", 0) < 9.3:
        fail("Candidate G design fidelity below 9.3")
    if scores.get("sameArtistImpression", 0) < 9.2:
        fail("Candidate G pre-comparison same-artist impression below 9.2")

    gate = hero.get("nextGate", {})
    if gate.get("name") != "untouched-same-artist-comparison":
        fail("next Sarallel gate must be untouched same-artist comparison")
    if gate.get("sameArtistMinimum") != 9.2:
        fail("same-artist minimum drifted")
    required = set(gate.get("requiredCharacters", []))
    expected = {"Sarallel HeroCel Candidate G", "Auryi HeroCel Master A", "Prismel HeroCel Master B", "Kineza master"}
    if required != expected:
        fail("same-artist comparison roster drifted")
    if "Do not regenerate characters together" not in gate.get("method", ""):
        fail("same-artist comparison must use untouched masters only")

    print("PZ SARALLEL LIKENESS PASS: Candidate G clears likeness/design/animation floors; production promotion is blocked until untouched four-character same-artist comparison passes")


if __name__ == "__main__":
    main()
