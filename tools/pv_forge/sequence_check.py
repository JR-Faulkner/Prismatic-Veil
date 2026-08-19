#!/usr/bin/env python3
"""Validate PriZim Sequence Lab manifests and their asset references."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SEQUENCE_DIR = ROOT / "pv-data" / "sequences"
EXPECTED = (
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
    path = ROOT / asset
    if not path.is_file():
        raise SequenceError(f"{context}: missing asset: {asset}")


def validate_frame(frame: Any, context: str) -> None:
    if not isinstance(frame, dict):
        raise SequenceError(f"{context}: frame must be an object")
    for field in ("id", "asset", "label"):
        if not isinstance(frame.get(field), str) or not frame[field].strip():
            raise SequenceError(f"{context}.{field} must be a non-empty string")
    asset_exists(frame["asset"], context)

    hold = frame.get("holdMs")
    blend = frame.get("blendMs")
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


def validate_manifest(data: dict[str, Any], filename: str) -> None:
    context = f"pv-data/sequences/{filename}"
    if data.get("schemaVersion") != 1:
        raise SequenceError(f"{context}: schemaVersion must be 1")
    for field in ("id", "character", "displayName", "sequenceName", "status"):
        if not isinstance(data.get(field), str) or not data[field].strip():
            raise SequenceError(f"{context}: {field} must be a non-empty string")
    if not isinstance(data.get("signatureReady"), bool):
        raise SequenceError(f"{context}: signatureReady must be boolean")

    if data["signatureReady"]:
        frames = data.get("frames")
        if not isinstance(frames, list) or not frames:
            raise SequenceError(f"{context}: signature-ready manifest requires frames")
        for index, frame in enumerate(frames, start=1):
            validate_frame(frame, f"{context}.frames[{index - 1}]")
    else:
        preview = data.get("previewFrames")
        plan = data.get("signaturePlan")
        if not isinstance(preview, list) or not preview:
            raise SequenceError(f"{context}: bootstrap manifest requires previewFrames")
        if not isinstance(plan, list) or len(plan) != 6:
            raise SequenceError(f"{context}: bootstrap signaturePlan must contain exactly six canonical beats")
        for index, frame in enumerate(preview, start=1):
            validate_frame(frame, f"{context}.previewFrames[{index - 1}]")
        for expected_frame, beat in enumerate(plan, start=1):
            if not isinstance(beat, dict) or beat.get("frame") != expected_frame:
                raise SequenceError(f"{context}.signaturePlan must be ordered frames 1..6")
            if not isinstance(beat.get("beat"), str) or not beat["beat"].strip():
                raise SequenceError(f"{context}.signaturePlan[{expected_frame - 1}].beat is required")
            asset = beat.get("asset")
            reference = beat.get("referenceAsset")
            if asset is not None:
                if not isinstance(asset, str):
                    raise SequenceError(f"{context}.signaturePlan[{expected_frame - 1}].asset must be string or null")
                asset_exists(asset, f"{context}.signaturePlan[{expected_frame - 1}]")
            if reference is not None:
                if not isinstance(reference, str):
                    raise SequenceError(f"{context}.signaturePlan[{expected_frame - 1}].referenceAsset must be string or null")
                asset_exists(reference, f"{context}.signaturePlan[{expected_frame - 1}].referenceAsset")


def main() -> int:
    try:
        for filename in EXPECTED:
            data = load(SEQUENCE_DIR / filename)
            validate_manifest(data, filename)
            mode = "signature" if data["signatureReady"] else "bootstrap"
            print(f"OK  {data['displayName']}: {data['sequenceName']} [{mode}]")
        print("PriZim Sequence Check OK")
        return 0
    except SequenceError as exc:
        print(f"PriZim Sequence Check FAILED: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
