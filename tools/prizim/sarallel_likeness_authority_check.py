#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORITY = ROOT / "pv-data/style_authority/characters/sarallel_likeness_authority_v1.json"


def fail(msg: str) -> None:
    raise SystemExit(f"PZ SARALLEL LIKENESS FAIL: {msg}")


def load() -> dict:
    if not AUTHORITY.exists():
        fail("Sarallel likeness authority is missing")
    try:
        return json.loads(AUTHORITY.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"Sarallel likeness authority is invalid JSON: {exc}")


def require_items(actual, required, label):
    actual = set(actual or [])
    missing = sorted(set(required) - actual)
    if missing:
        fail(f"{label} missing: {', '.join(missing)}")


def main() -> None:
    data = load()

    if data.get("schemaVersion") != 1:
        fail("schemaVersion must remain 1")
    if data.get("authorityId") != "sarallel-likeness-authority-v1":
        fail("authorityId drifted")
    if data.get("characterId") != "sarallel":
        fail("characterId drifted")
    if data.get("status") != "locked-likeness-calibration-authority-pending-master-generation":
        fail("likeness authority status drifted")

    sources = data.get("likenessSourcePolicy", {})
    primary = sources.get("primaryGeometrySources", [])
    if len(primary) < 2:
        fail("at least two real-photo geometry source classes are required")
    if any(src.get("sourceClass", "").startswith("legacy") for src in primary):
        fail("legacy fantasy art cannot be a primary likeness source")

    legacy = sources.get("legacyFantasyIterations", {})
    if legacy.get("role") != "design-only":
        fail("legacy Sarallel iterations must remain design-only")
    if legacy.get("facialGeometryContributionPercent") != 0:
        fail("legacy Sarallel facial geometry contribution must remain 0%")
    if legacy.get("likenessContributionPercent") != 0:
        fail("legacy Sarallel likeness contribution must remain 0%")
    require_items(
        legacy.get("mustNeverContribute"),
        [
            "face shape",
            "eye geometry",
            "eyebrow geometry",
            "nose geometry",
            "mouth or smile geometry",
            "cheek contour",
            "jaw or chin geometry",
            "age read",
            "beauty-model facial normalization",
        ],
        "legacy likeness firewall",
    )

    geometry = data.get("geometryAuthority", {})
    if geometry.get("priority") != "absolute":
        fail("real-photo geometry authority must remain absolute")
    if geometry.get("owner") != "real-photo-likeness-subject":
        fail("real-photo likeness subject must remain geometry owner")
    require_items(
        geometry.get("lockedAnchors"),
        [
            "broader face through cheek region",
            "shorter rounder overall facial silhouette rather than elongated oval",
            "full lower-cheek volume",
            "soft broad jaw transition",
            "rounded chin rather than pointed chin",
            "natural adult eye scale and spacing",
            "broader softer nose family including base and tip",
            "wider mouth geometry",
            "warm broad smile with distinctive cheek lift",
            "adult age read consistent with real reference",
        ],
        "Sarallel likeness anchors",
    )
    require_items(
        geometry.get("geometryOwned"),
        [
            "eye shape",
            "eye size",
            "eye spacing",
            "eyebrow shape and arch",
            "cheek width, contour, and volume",
            "nose width, bridge, base, tip, and placement",
            "lip proportions",
            "mouth width",
            "smile geometry",
            "jaw width and contour",
            "chin shape",
            "head shape",
            "adult age read",
        ],
        "Sarallel geometry ownership",
    )

    expression = data.get("expressionAuthority", {})
    if "wide warm smile" not in expression.get("signatureSmile", ""):
        fail("signature smile authority drifted")
    if "may not replace it with glamorized fantasy-heroine geometry" not in expression.get("rule", ""):
        fail("expression geometry firewall drifted")

    require_items(
        data.get("hardReject"),
        [
            "elongated narrow fantasy-model face",
            "pointed or sharply tapered chin",
            "cheek-volume reduction",
            "dramatically upturned or enlarged eyes",
            "narrow sculpted nose substitution",
            "small narrow mouth substitution",
            "generic glamorous fantasy-woman face",
            "beauty normalization that weakens likeness",
            "legacy Sarallel iteration face used as likeness authority",
            "younger-looking face caused by stylization",
        ],
        "Sarallel hard rejects",
    )

    prep = data.get("generationPreparation", {})
    if prep.get("nextAsset") != "Sarallel Likeness Master A":
        fail("next likeness asset must remain Sarallel Likeness Master A")
    if prep.get("referenceStack") != "real-photo likeness sources only":
        fail("likeness master must use real-photo sources only")
    require_items(
        prep.get("excludeDuringLikenessMaster"),
        [
            "legacy Sarallel fantasy images",
            "HeroCel calibration character images",
            "other Prismatic Veil character faces",
            "multi-character sheets",
        ],
        "likeness-master exclusions",
    )
    if "Do not apply Sarallel design canon or HeroCel" not in prep.get("promotionRule", ""):
        fail("HeroCel/design must remain blocked until likeness-only Master A is accepted")

    gates = data.get("prizimGates", {})
    for name in [
        "realPhotoGeometryOwnership",
        "legacyFantasyFaceContributionZero",
        "genericFantasyBeautyDrift",
    ]:
        if gates.get(name) != "hard-reject":
            fail(f"hard-reject gate drifted: {name}")
    for name in [
        "broaderShorterFaceRetention",
        "cheekVolumeRetention",
        "naturalEyeGeometry",
        "broaderSoftNoseFamily",
        "mouthAndSmileGeometry",
        "adultAgeRead",
        "expressionBehaviorRetention",
    ]:
        if gates.get(name) != "required":
            fail(f"required likeness gate drifted: {name}")

    print("PZ SARALLEL LIKENESS PASS: real-photo geometry owns identity; legacy fantasy faces are design-only with 0% likeness authority")


if __name__ == "__main__":
    main()
