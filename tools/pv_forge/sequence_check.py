#!/usr/bin/env python3
"""Validate PriZim Sequence Lab manifests and authority/asset references."""
from __future__ import annotations
import json, math, sys
from pathlib import Path
from typing import Any
ROOT = Path(__file__).resolve().parents[2]
SEQUENCE_DIR = ROOT / "pv-data" / "sequences"
EXPECTED = ("prismel_active_turn.sequence.json","auryi_auorb.sequence.json","kineza_gauntlet_ignition.sequence.json")
class SequenceError(RuntimeError): pass

def load(path: Path) -> dict[str, Any]:
    try: return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc: raise SequenceError(f"Missing sequence manifest: {path.relative_to(ROOT)}") from exc
    except json.JSONDecodeError as exc: raise SequenceError(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc

def asset_exists(asset: str, context: str) -> None:
    if not asset or asset.startswith("/") or ".." in Path(asset).parts: raise SequenceError(f"{context}: invalid repo-relative asset path: {asset!r}")
    if not (ROOT / asset).is_file(): raise SequenceError(f"{context}: missing asset: {asset}")

def validate_sheets(data: dict[str, Any], context: str) -> dict[str, Any]:
    sheets = data.get("sheets", {})
    if sheets is None: sheets = {}
    if not isinstance(sheets, dict): raise SequenceError(f"{context}: sheets must be an object")
    for name, sheet in sheets.items():
        sc = f"{context}.sheets.{name}"
        if not isinstance(sheet, dict): raise SequenceError(f"{sc} must be an object")
        asset = sheet.get("asset")
        if not isinstance(asset, str): raise SequenceError(f"{sc}.asset must be a string")
        asset_exists(asset, sc)
        for field in ("cols","rows"):
            value = sheet.get(field)
            if not isinstance(value, int) or value < 1 or value > 16: raise SequenceError(f"{sc}.{field} must be an integer from 1 to 16")
    return sheets

def validate_frame(frame: Any, context: str, sheets: dict[str, Any]) -> None:
    if not isinstance(frame, dict): raise SequenceError(f"{context}: frame must be an object")
    for field in ("id","label"):
        if not isinstance(frame.get(field), str) or not frame[field].strip(): raise SequenceError(f"{context}.{field} must be a non-empty string")
    has_asset = isinstance(frame.get("asset"), str) and bool(frame["asset"].strip())
    has_sheet = isinstance(frame.get("sheet"), str) and bool(frame["sheet"].strip())
    if has_asset == has_sheet: raise SequenceError(f"{context}: provide exactly one of asset or sheet")
    if has_asset:
        asset_exists(frame["asset"], context)
    else:
        name = frame["sheet"]
        if name not in sheets: raise SequenceError(f"{context}.sheet references unknown sheet: {name}")
        index = frame.get("sheetIndex")
        capacity = sheets[name]["cols"] * sheets[name]["rows"]
        if not isinstance(index, int) or not 0 <= index < capacity: raise SequenceError(f"{context}.sheetIndex must be 0..{capacity-1}")
    hold, blend = frame.get("holdMs"), frame.get("blendMs")
    if not isinstance(hold,(int,float)) or not 30 <= hold <= 1200: raise SequenceError(f"{context}.holdMs must be between 30 and 1200")
    if not isinstance(blend,(int,float)) or not 0 <= blend <= 300: raise SequenceError(f"{context}.blendMs must be between 0 and 300")
    scale = frame.get("scale",1)
    if not isinstance(scale,(int,float)) or not math.isfinite(float(scale)) or not 0.75 <= float(scale) <= 1.25: raise SequenceError(f"{context}.scale must be between 0.75 and 1.25")
    for axis in ("x","y"):
        value = frame.get(axis,0)
        if not isinstance(value,(int,float)) or not math.isfinite(float(value)) or abs(float(value)) > 32: raise SequenceError(f"{context}.{axis} must be within ±32")

def validate_manifest(data: dict[str, Any], filename: str) -> None:
    context=f"pv-data/sequences/{filename}"
    if data.get("schemaVersion") != 1: raise SequenceError(f"{context}: schemaVersion must be 1")
    for field in ("id","character","displayName","sequenceName","status"):
        if not isinstance(data.get(field),str) or not data[field].strip(): raise SequenceError(f"{context}: {field} must be a non-empty string")
    if not isinstance(data.get("signatureReady"),bool): raise SequenceError(f"{context}: signatureReady must be boolean")
    sheets=validate_sheets(data,context)
    frames=data.get("frames") if data["signatureReady"] else data.get("previewFrames")
    if not isinstance(frames,list) or not frames: raise SequenceError(f"{context}: active playback frames are required")
    for i,frame in enumerate(frames): validate_frame(frame,f"{context}.frames[{i}]",sheets)
    if not data["signatureReady"]:
        plan=data.get("signaturePlan")
        if not isinstance(plan,list) or len(plan)!=6: raise SequenceError(f"{context}: bootstrap signaturePlan must contain exactly six canonical beats")

def main()->int:
    try:
        for filename in EXPECTED:
            data=load(SEQUENCE_DIR/filename); validate_manifest(data,filename)
            mode="authority-qa" if data.get("qaProxy") else ("signature" if data["signatureReady"] else "bootstrap")
            print(f"OK  {data['displayName']}: {data['sequenceName']} [{mode}]")
        print("PriZim Sequence Check OK"); return 0
    except SequenceError as exc:
        print(f"PriZim Sequence Check FAILED: {exc}",file=sys.stderr); return 1
if __name__ == "__main__": raise SystemExit(main())
