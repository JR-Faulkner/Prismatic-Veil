#!/usr/bin/env python3
"""Validate PriZim Sequence Lab manifests, assets, and comparison choreography locks."""
from __future__ import annotations
import json, math, sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SEQUENCE_DIR = ROOT / "pv-data" / "sequences"
CANONICAL_EXPECTED = (
    "prismel_active_turn.sequence.json",
    "auryi_auorb.sequence.json",
    "kineza_gauntlet_ignition.sequence.json",
)

class SequenceError(RuntimeError):
    pass

def load(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SequenceError(f"Missing sequence manifest: {path.relative_to(ROOT)}") from exc
    except json.JSONDecodeError as exc:
        raise SequenceError(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc

def asset_exists(asset: str, context: str) -> None:
    if not asset or asset.startswith("/") or ".." in Path(asset).parts:
        raise SequenceError(f"{context}: invalid repo-relative asset path: {asset!r}")
    if not (ROOT / asset).is_file():
        raise SequenceError(f"{context}: missing asset: {asset}")

def validate_sheets(data: dict[str, Any], context: str) -> dict[str, Any]:
    sheets = data.get("sheets", {})
    if sheets is None:
        sheets = {}
    if not isinstance(sheets, dict):
        raise SequenceError(f"{context}: sheets must be an object")
    for name, sheet in sheets.items():
        sc = f"{context}.sheets.{name}"
        if not isinstance(sheet, dict):
            raise SequenceError(f"{sc} must be an object")
        asset = sheet.get("asset")
        if not isinstance(asset, str):
            raise SequenceError(f"{sc}.asset must be a string")
        asset_exists(asset, sc)
        for field in ("cols", "rows"):
            value = sheet.get(field)
            if not isinstance(value, int) or value < 1 or value > 16:
                raise SequenceError(f"{sc}.{field} must be an integer from 1 to 16")
    return sheets

def validate_motion_profile(data: dict[str, Any], context: str) -> None:
    profile = data.get("motionProfile")
    if profile is None:
        return
    if not isinstance(profile, dict):
        raise SequenceError(f"{context}.motionProfile must be an object")
    if profile.get("style") not in ("controlled", "float", "impact"):
        raise SequenceError(f"{context}.motionProfile.style must be controlled, float, or impact")
    if profile.get("axis") not in ("x", "y"):
        raise SequenceError(f"{context}.motionProfile.axis must be x or y")
    if profile.get("direction") not in (-1, 1):
        raise SequenceError(f"{context}.motionProfile.direction must be -1 or 1")
    ranges = {
        "minBlendMs": (30, 300),
        "blendScale": (0.25, 3.0),
        "travelPx": (0, 20),
        "enterScale": (0.90, 1.10),
        "overlap": (0.0, 1.0),
        "settleMs": (0, 250),
        "settleScale": (0.95, 1.05),
    }
    for field, (lo, hi) in ranges.items():
        value = profile.get(field)
        if not isinstance(value, (int, float)) or not math.isfinite(float(value)) or not lo <= float(value) <= hi:
            raise SequenceError(f"{context}.motionProfile.{field} must be between {lo} and {hi}")

def validate_continuity_gate(data: dict[str, Any], context: str) -> None:
    gate = data.get("continuityGate")
    if gate is None:
        return
    if not isinstance(gate, dict):
        raise SequenceError(f"{context}.continuityGate must be an object")
    fraction_ranges = {
        "heightPct": (0.02, 0.50),
        "widthPct": (0.05, 0.70),
        "baselinePct": (0.01, 0.25),
        "centerPct": (0.01, 0.30),
        "lowerAnchorPct": (0.01, 0.35),
        "areaPct": (0.05, 0.90),
        "silhouetteDistance": (0.20, 0.98),
    }
    for field, (lo, hi) in fraction_ranges.items():
        value = gate.get(field)
        if not isinstance(value, (int, float)) or not math.isfinite(float(value)) or not lo <= float(value) <= hi:
            raise SequenceError(f"{context}.continuityGate.{field} must be between {lo} and {hi}")
    for field in ("passScore", "bridgeScore"):
        value = gate.get(field)
        if not isinstance(value, int) or not 0 <= value <= 100:
            raise SequenceError(f"{context}.continuityGate.{field} must be an integer from 0 to 100")
    if gate["bridgeScore"] >= gate["passScore"]:
        raise SequenceError(f"{context}.continuityGate.bridgeScore must be lower than passScore")

def validate_frame(frame: Any, context: str, sheets: dict[str, Any]) -> None:
    if not isinstance(frame, dict):
        raise SequenceError(f"{context}: frame must be an object")
    for field in ("id", "label"):
        if not isinstance(frame.get(field), str) or not frame[field].strip():
            raise SequenceError(f"{context}.{field} must be a non-empty string")
    has_asset = isinstance(frame.get("asset"), str) and bool(frame["asset"].strip())
    has_sheet = isinstance(frame.get("sheet"), str) and bool(frame["sheet"].strip())
    if has_asset == has_sheet:
        raise SequenceError(f"{context}: provide exactly one of asset or sheet")
    if has_asset:
        asset_exists(frame["asset"], context)
    else:
        name = frame["sheet"]
        if name not in sheets:
            raise SequenceError(f"{context}.sheet references unknown sheet: {name}")
        index = frame.get("sheetIndex")
        capacity = sheets[name]["cols"] * sheets[name]["rows"]
        if not isinstance(index, int) or not 0 <= index < capacity:
            raise SequenceError(f"{context}.sheetIndex must be 0..{capacity - 1}")
    hold, blend = frame.get("holdMs"), frame.get("blendMs")
    if not isinstance(hold, (int, float)) or not 30 <= hold <= 1200:
        raise SequenceError(f"{context}.holdMs must be between 30 and 1200")
    if not isinstance(blend, (int, float)) or not 0 <= blend <= 300:
        raise SequenceError(f"{context}.blendMs must be between 0 and 300")
    scale = frame.get("scale", 1)
    if not isinstance(scale, (int, float)) or not math.isfinite(float(scale)) or not 0.75 <= float(scale) <= 1.25:
        raise SequenceError(f"{context}.scale must be between 0.75 and 1.25")
    for axis in ("x", "y"):
        value = frame.get(axis, 0)
        if not isinstance(value, (int, float)) or not math.isfinite(float(value)) or abs(float(value)) > 32:
            raise SequenceError(f"{context}.{axis} must be within ±32")

def validate_manifest(data: dict[str, Any], path: Path) -> None:
    context = str(path.relative_to(ROOT))
    if data.get("schemaVersion") != 1:
        raise SequenceError(f"{context}: schemaVersion must be 1")
    for field in ("id", "character", "displayName", "sequenceName", "status"):
        if not isinstance(data.get(field), str) or not data[field].strip():
            raise SequenceError(f"{context}: {field} must be a non-empty string")
    if not isinstance(data.get("signatureReady"), bool):
        raise SequenceError(f"{context}: signatureReady must be boolean")
    validate_motion_profile(data, context)
    validate_continuity_gate(data, context)
    sheets = validate_sheets(data, context)
    frames = data.get("frames") if data["signatureReady"] else data.get("previewFrames")
    if not isinstance(frames, list) or not frames:
        raise SequenceError(f"{context}: active playback frames are required")
    for i, frame in enumerate(frames):
        validate_frame(frame, f"{context}.frames[{i}]", sheets)
    if not data["signatureReady"]:
        plan = data.get("signaturePlan")
        if not isinstance(plan, list) or len(plan) != 6:
            raise SequenceError(f"{context}: bootstrap signaturePlan must contain exactly six canonical beats")

def playback_frames(data: dict[str, Any]) -> list[dict[str, Any]]:
    return data["frames"] if data["signatureReady"] else data["previewFrames"]

def choreography_signature(data: dict[str, Any]) -> list[tuple[Any, ...]]:
    return [
        (
            frame.get("label"),
            frame.get("holdMs"),
            frame.get("blendMs"),
            frame.get("cue", ""),
            frame.get("scale", 1),
            frame.get("x", 0),
            frame.get("y", 0),
        )
        for frame in playback_frames(data)
    ]

def validate_comparison_groups(records: list[tuple[Path, dict[str, Any]]]) -> None:
    groups: dict[str, list[tuple[Path, dict[str, Any]]]] = {}
    for path, data in records:
        group = data.get("comparisonGroup")
        if group is None:
            continue
        if not isinstance(group, str) or not group.strip():
            raise SequenceError(f"{path.relative_to(ROOT)}: comparisonGroup must be a non-empty string")
        variant = data.get("styleVariant")
        if not isinstance(variant, str) or not variant.strip():
            raise SequenceError(f"{path.relative_to(ROOT)}: styleVariant is required for comparisonGroup manifests")
        groups.setdefault(group, []).append((path, data))

    for group, members in groups.items():
        variants = [data["styleVariant"] for _, data in members]
        if len(set(variants)) != len(variants):
            raise SequenceError(f"comparisonGroup {group}: styleVariant values must be unique")

        expected_counts = {data.get("comparisonExpectedVariants") for _, data in members if data.get("comparisonExpectedVariants") is not None}
        if len(expected_counts) > 1:
            raise SequenceError(f"comparisonGroup {group}: comparisonExpectedVariants values disagree")
        if expected_counts:
            expected = next(iter(expected_counts))
            if not isinstance(expected, int) or expected < 2:
                raise SequenceError(f"comparisonGroup {group}: comparisonExpectedVariants must be an integer >= 2")
            if len(members) != expected:
                raise SequenceError(f"comparisonGroup {group}: expected {expected} variants, found {len(members)}")

        baseline = choreography_signature(members[0][1])
        for path, data in members[1:]:
            if choreography_signature(data) != baseline:
                raise SequenceError(
                    f"comparisonGroup {group}: choreography drift in {path.relative_to(ROOT)}; "
                    "labels/timing/cues/registration must match exactly"
                )
        print(f"LOCK comparisonGroup {group}: {len(members)} variants share identical choreography")

def main() -> int:
    try:
        paths = sorted(SEQUENCE_DIR.glob("*.sequence.json"))
        present = {path.name for path in paths}
        missing = [name for name in CANONICAL_EXPECTED if name not in present]
        if missing:
            raise SequenceError(f"Missing canonical manifests: {', '.join(missing)}")

        records: list[tuple[Path, dict[str, Any]]] = []
        for path in paths:
            data = load(path)
            validate_manifest(data, path)
            records.append((path, data))
            mode = "authority-qa" if data.get("qaProxy") else ("signature" if data["signatureReady"] else "bootstrap")
            motion = (data.get("motionProfile") or {}).get("style", "default")
            group = data.get("comparisonGroup", "standalone")
            print(f"OK  {data['displayName']}: {data['sequenceName']} [{mode}/{motion}/{group}]")

        validate_comparison_groups(records)
        print(f"PriZim Sequence Check OK · {len(records)} manifests")
        return 0
    except SequenceError as exc:
        print(f"PriZim Sequence Check FAILED: {exc}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
