#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / "pv-data/style_authority/characters/vyan_herocel_v1.json"
INSPECTION = ROOT / "pv-data/style_authority/characters/vyan_herocel_candidate_a_inspection.json"


def fail(msg):
    raise SystemExit(f"PZ VYAN HEROCEL FAIL: {msg}")


def load(path, label):
    if not path.exists():
        fail(f"{label} missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{label} invalid JSON: {exc}")


def main():
    profile = load(PROFILE, "Vyan HeroCel profile")
    inspection = load(INSPECTION, "Vyan Candidate A inspection")

    if profile.get("schemaVersion") != 1:
        fail("schemaVersion must remain 1")
    if profile.get("profileId") != "vyan-herocel-v1":
        fail("profileId drifted")
    if profile.get("profileRevision") != "1.0-candidate-a-lock-pending-same-artist":
        fail("profile revision drifted")
    if profile.get("status") != "candidate-a-pz-pass-pending-same-artist-comparison":
        fail("Vyan must remain pending same-artist comparison before production promotion")
    if profile.get("inherits") != "prismatic-herocel-v1":
        fail("Vyan must inherit Prismatic HeroCel v1")
    if profile.get("ageAdapter") != "adult":
        fail("Vyan must remain on adult age adapter")

    stack = profile.get("authorityStack", {})
    anchors = set(stack.get("likenessAuthority", {}).get("identityAnchors", []))
    required_anchors = {"adult Black male", "bald head", "short goatee", "calm controlled expression", "adult heroic proportions"}
    if not required_anchors.issubset(anchors):
        fail("Vyan identity anchors drifted")

    design = set(stack.get("characterDesignAuthority", {}).get("preserveExactly", []))
    required_design = {"burgundy black and gold palette", "layered armored robe silhouette", "gold geometric trim", "orange-gold geometric arcana", "raised-hand controlled casting posture"}
    if not required_design.issubset(design):
        fail("Vyan design anchors drifted")

    current = stack.get("currentHeroCelCandidate", {})
    if current.get("candidate") != "Vyan HeroCel Candidate A":
        fail("Candidate A must remain current lock candidate")

    firewall = profile.get("identityFirewall", {})
    if firewall.get("priority") != "absolute":
        fail("identity firewall must remain absolute")
    if firewall.get("heroCelGeometryContributionPercent") != 0:
        fail("HeroCel geometry contribution must remain zero")
    for key in ["kinezaGeometryContributionPercent", "prismelGeometryContributionPercent", "auryiGeometryContributionPercent", "sarallelGeometryContributionPercent"]:
        if firewall.get(key) != 0:
            fail(f"cross-character geometry contribution must remain zero: {key}")

    candidate = profile.get("candidateA", {})
    if candidate.get("generationId") != "1c806e0f-da38-490d-a84a-01bcee979f0c":
        fail("Candidate A generation evidence drifted")
    if candidate.get("sha256") != "aad0e3e6740a17f4f89b0c8d486140110c77418b9fb929ab7a7a40a139bc3ea2":
        fail("Candidate A hash evidence drifted")
    if candidate.get("status") != "pz-pass-lock-candidate":
        fail("Candidate A must remain a PZ pass lock candidate")

    scores = candidate.get("scores", {})
    if scores.get("identityRetention", 0) < 9.3:
        fail("Vyan identity retention below floor")
    if scores.get("heroCelAnimationRead", 0) < 9.2:
        fail("Vyan HeroCel animation read below floor")
    if scores.get("designFidelity", 0) < 9.3:
        fail("Vyan design fidelity below floor")
    if scores.get("magicIdentityRead", 0) < 9.3:
        fail("Vyan magic identity below floor")
    if scores.get("sameArtistImpressionPreComparison", 0) < 9.2:
        fail("Vyan same-artist pre-comparison score below floor")

    if inspection.get("inspectionId") != "vyan-herocel-candidate-a-inspection":
        fail("inspection id drifted")
    if inspection.get("status") != "pz-pass-lock-candidate-pending-same-artist-comparison":
        fail("inspection status drifted")
    ic = inspection.get("candidate", {})
    if ic.get("generationId") != candidate.get("generationId") or ic.get("sha256") != candidate.get("sha256"):
        fail("profile/inspection evidence mismatch")

    gate = profile.get("nextGate", {})
    if gate.get("name") != "untouched-same-artist-comparison":
        fail("next gate must remain untouched same-artist comparison")
    if gate.get("sameArtistMinimum") != 9.2:
        fail("same-artist minimum drifted")
    if "Do not regenerate characters together" not in gate.get("method", ""):
        fail("comparison method must remain untouched masters/candidates only")

    print("PZ VYAN HEROCEL PASS: Candidate A clears identity/design/animation/magic floors and is locked pending untouched same-artist comparison")


if __name__ == "__main__":
    main()
