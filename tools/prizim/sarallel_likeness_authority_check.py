#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"
LIKENESS_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_likeness_master_a_inspection.json"
DESIGN_MASTER = ROOT / "pv-data/style_authority/characters/sarallel_design_master_a_inspection.json"
HERO = ROOT / "pv-data/style_authority/characters/sarallel_herocel_v1.json"


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

    if authority.get("schemaVersion") != 2:
        fail("likeness authority schemaVersion must remain 2")
    if authority.get("status") != "locked-hair-down-primary-likeness-authority":
        fail("hair-down likeness authority must remain locked")
    if likeness.get("status") != "approved-user-accepted-hair-down-primary-likeness-authority":
        fail("likeness Master A must remain approved")
    if likeness.get("hairAuthority", {}).get("presentation") != "hair down":
        fail("hair-down appearance must remain primary")
    if design.get("status") != "approved-design-master-a-pending-herocel-retention-pass":
        fail("Design Master A status drifted")

    if hero.get("schemaVersion") != 5:
        fail("Sarallel HeroCel schemaVersion must remain 5")
    if hero.get("profileRevision") != "1.4-single-source-edit-reset":
        fail("Sarallel single-source revision drifted")
    if hero.get("status") != "locked-single-source-edit-pending-candidate-g":
        fail("Sarallel must remain in single-source edit mode")
    if hero.get("inherits") != "prismatic-herocel-v1":
        fail("Sarallel HeroCel inheritance drifted")

    stack = hero.get("authorityStack", {})
    if stack.get("singleVisualSource", {}).get("master") != "Sarallel HeroCel Candidate D":
        fail("Candidate D must remain the only visual source")
    if stack.get("singleVisualSource", {}).get("priority") != "only-visual-appearance-source":
        fail("Candidate D visual-source priority drifted")
    if stack.get("renderingFingerprint", {}).get("visualReferenceAllowed") is not False:
        fail("rendering fingerprint must remain text-only")

    mode = hero.get("singleSourceMode", {})
    if mode.get("enabled") is not True:
        fail("single-source mode must remain enabled")
    if mode.get("visualSourceCount") != 1:
        fail("exactly one visual source is required")
    if mode.get("onlyAllowedVisualSource") != "Sarallel HeroCel Candidate D":
        fail("only allowed visual source drifted")
    if mode.get("allOtherVisualSourcesForbidden") is not True:
        fail("all other visual sources must remain forbidden")
    require_items(mode.get("forbiddenVisualSources"), [
        "Sarallel HeroCel Rendering Pass E image",
        "Auryi",
        "Prismel",
        "Kineza",
        "Sarallel Likeness Master A image",
        "Sarallel Design Master A image",
        "legacy Sarallel art",
        "multi-character comparisons",
        "rejected Sarallel attempts",
        "character sheets",
        "turnarounds",
    ], "single-source exclusions")

    firewall = hero.get("identityFirewall", {})
    for key in [
        "heroCelGeometryContributionPercent",
        "externalVisualGeometryContributionPercent",
        "externalVisualLikenessContributionPercent",
        "externalVisualDesignContributionPercent",
    ]:
        if firewall.get(key) != 0:
            fail(f"single-source geometry firewall drifted: {key}")

    require_items(hero.get("frozenFromCandidateD"), [
        "face width",
        "cheek fullness",
        "jaw width and soft jaw transition",
        "rounded chin",
        "broader softer nose",
        "Sarah-specific smile width and cheek lift",
        "eye size shape spacing and tilt",
        "hairline part length and face framing",
        "body proportions",
        "pose",
        "camera",
        "royal blue black and gold costume geometry",
        "cape silhouette",
        "crystal count placement and geometry",
    ], "Candidate D frozen geometry")

    fingerprint = hero.get("renderingFingerprintTextOnly", {})
    if fingerprint.get("source") != "distilled from Rendering Pass E; image must not be provided":
        fail("Rendering Pass E must remain distilled text only")
    require_items(fingerprint.get("targets"), [
        "2-to-3 facial value groups",
        "crisp controlled shadow boundaries",
        "grouped hair masses with selective strand accents",
        "graphic armor material blocks",
        "restrained highlight bands",
        "clean animation-readable interior edges",
        "premium animated game character rather than painted fantasy portrait",
    ], "HeroCel text fingerprint")

    contract = hero.get("generationContract", {})
    if contract.get("nextAsset") != "Sarallel HeroCel Candidate G":
        fail("next Sarallel asset must remain Candidate G")
    if contract.get("mode") != "single-source image edit":
        fail("Candidate G must use single-source image edit mode")
    if contract.get("sourceImage") != "Sarallel HeroCel Candidate D only":
        fail("Candidate D must be the only source image")
    if "Edit the supplied Candidate D image itself" not in contract.get("editInstruction", ""):
        fail("Candidate G must be an edit of Candidate D, not a fresh redraw")
    if "Do not reinterpret the subject" not in contract.get("editInstruction", ""):
        fail("Candidate G must explicitly block subject reinterpretation")

    require_items(hero.get("hardReject"), [
        "more than one visual source used",
        "Auryi contamination",
        "different ethnicity or skin-tone identity",
        "different face",
        "different hair texture or curl family",
        "face narrowing",
        "cheek-volume loss",
        "jaw taper increase",
        "nose sharpening",
        "generic heroine smile",
        "pose change",
        "camera change",
        "costume redesign",
        "cape redesign",
        "crystal redesign",
        "lavender-white robe contamination",
        "gold-orb contamination",
        "character-sheet layout",
        "turnaround layout",
        "text or labels",
    ], "single-source hard rejects")

    target = hero.get("passTarget", {})
    if target.get("sarahLikenessMinimum") != 9.0:
        fail("Sarallel likeness floor drifted")
    if target.get("heroCelAnimationReadMinimum") != 9.2:
        fail("HeroCel animation floor drifted")
    if target.get("sarallelDesignFidelityMinimum") != 9.3:
        fail("Sarallel design floor drifted")
    if target.get("sameArtistImpressionMinimum") != 9.2:
        fail("same-artist floor drifted")
    if target.get("visualSourceCountRequired") != 1:
        fail("visual source count floor drifted")

    gates = hero.get("prizimGates", {})
    for name in [
        "singleVisualSourceOnly",
        "zeroExternalGeometryTransfer",
        "zeroHeroCelGeometryTransfer",
        "crossCharacterContamination",
    ]:
        if gates.get(name) != "hard-reject":
            fail(f"hard-reject gate drifted: {name}")
    for name in [
        "sarahLikenessRetention",
        "sarallelDesignFidelity",
        "heroCelAnimationRead",
        "singleCharacterPresentation",
    ]:
        if gates.get(name) != "required":
            fail(f"required gate drifted: {name}")

    print("PZ SARALLEL LIKENESS PASS: Candidate D is the only visual source; HeroCel rendering fingerprint is text-only; cross-character contamination is blocked")


if __name__ == "__main__":
    main()
