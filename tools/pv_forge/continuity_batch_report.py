#!/usr/bin/env python3
"""Generate a headless PriZim continuity report for all active authority sequences."""
from __future__ import annotations

import argparse
import json
import math
from collections import deque
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SEQUENCE_DIR = ROOT / "pv-data" / "sequences"
EXPECTED = (
    "prismel_active_turn.sequence.json",
    "auryi_auorb.sequence.json",
    "kineza_gauntlet_ignition.sequence.json",
)

DEFAULT_THRESHOLDS = {
    "heightPct": 0.12,
    "widthPct": 0.24,
    "baselinePct": 0.055,
    "centerPct": 0.075,
    "lowerAnchorPct": 0.10,
    "areaPct": 0.32,
    "silhouetteDistance": 0.80,
    "passScore": 82,
    "bridgeScore": 54,
}

WEIGHTS = {
    "heightPct": 1.15,
    "widthPct": 1.00,
    "baselinePct": 1.30,
    "centerPct": 1.15,
    "lowerAnchorPct": 1.35,
    "areaPct": 0.90,
    "silhouetteDistance": 1.05,
}

LABELS = {
    "heightPct": "body height",
    "widthPct": "silhouette width",
    "baselinePct": "baseline",
    "centerPct": "body center",
    "lowerAnchorPct": "lower anchor",
    "areaPct": "visible mass",
    "silhouetteDistance": "pose silhouette",
}


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def mean(a: float, b: float) -> float:
    return (a + b) / 2.0


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def is_edge_white(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    spread = max(r, g, b) - min(r, g, b)
    return r >= 220 and g >= 220 and b >= 220 and spread <= 38


def remove_edge_white(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size
    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= width or y >= height:
            return
        idx = y * width + x
        if seen[idx]:
            return
        r, g, b, a = px[x, y]
        if not is_edge_white(r, g, b, a):
            return
        seen[idx] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(1, height - 1):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        enqueue(x - 1, y)
        enqueue(x + 1, y)
        enqueue(x, y - 1)
        enqueue(x, y + 1)

    return rgba


def frame_image(manifest: dict[str, Any], frame: dict[str, Any]) -> Image.Image:
    if frame.get("asset"):
        return Image.open(ROOT / frame["asset"]).convert("RGBA")

    sheet = manifest["sheets"][frame["sheet"]]
    image = Image.open(ROOT / sheet["asset"]).convert("RGBA")
    cols = int(sheet.get("cols", 3))
    rows = int(sheet.get("rows", 2))
    index = int(frame.get("sheetIndex", 0))
    cell_w = image.width // cols
    cell_h = image.height // rows
    col = index % cols
    row = index // cols
    crop = image.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
    return remove_edge_white(crop)


def make_mask(alpha: Image.Image, size: int = 72) -> list[int]:
    width, height = alpha.size
    src = alpha.load()
    mask: list[int] = []
    for my in range(size):
        sy0 = math.floor(my * height / size)
        sy1 = max(sy0 + 1, math.floor((my + 1) * height / size))
        for mx in range(size):
            sx0 = math.floor(mx * width / size)
            sx1 = max(sx0 + 1, math.floor((mx + 1) * width / size))
            visible = False
            for y in range(sy0, min(sy1, height)):
                for x in range(sx0, min(sx1, width)):
                    if src[x, y] > 18:
                        visible = True
                        break
                if visible:
                    break
            mask.append(1 if visible else 0)
    return mask


def metrics(image: Image.Image) -> dict[str, Any]:
    alpha = image.getchannel("A")
    px = alpha.load()
    width, height = alpha.size
    left, top = width, height
    right, bottom = -1, -1
    area = 0
    sum_x = 0.0
    sum_y = 0.0

    for y in range(height):
        for x in range(width):
            if px[x, y] <= 18:
                continue
            area += 1
            sum_x += x
            sum_y += y
            left = min(left, x)
            right = max(right, x)
            top = min(top, y)
            bottom = max(bottom, y)

    if area == 0:
        raise RuntimeError("no visible subject after alpha cleanup")

    bbox_w = right - left + 1
    bbox_h = bottom - top + 1
    lower_start = max(top, math.floor(bottom - bbox_h * 0.18))
    lower_area = 0
    lower_sum_x = 0.0
    for y in range(lower_start, bottom + 1):
        for x in range(left, right + 1):
            if px[x, y] <= 18:
                continue
            lower_area += 1
            lower_sum_x += x

    return {
        "width": bbox_w,
        "height": bbox_h,
        "left": left,
        "right": right,
        "top": top,
        "bottom": bottom,
        "centerX": sum_x / area,
        "centerY": sum_y / area,
        "lowerAnchorX": (lower_sum_x / lower_area) if lower_area else (sum_x / area),
        "area": area,
        "fill": area / max(1, bbox_w * bbox_h),
        "sourceWidth": width,
        "sourceHeight": height,
        "mask": make_mask(alpha),
    }


def silhouette_distance(a: list[int], b: list[int]) -> float:
    intersection = 0
    union = 0
    for av, bv in zip(a, b):
        if av and bv:
            intersection += 1
        if av or bv:
            union += 1
    return 0.0 if union == 0 else 1.0 - intersection / union


def classify_reason(key: str, ratio: float, cue: str | None) -> str:
    if key in {"baselinePct", "centerPct", "lowerAnchorPct"}:
        return "REGISTRATION"
    if key in {"heightPct", "widthPct", "areaPct"}:
        return "SILHOUETTE/VFX" if cue and ratio >= 1.0 else "SILHOUETTE"
    if key == "silhouetteDistance":
        return "SILHOUETTE"
    return "MOTION"


def compare_pair(
    manifest: dict[str, Any],
    from_frame: dict[str, Any],
    to_frame: dict[str, Any],
    a: dict[str, Any],
    b: dict[str, Any],
    index: int,
) -> dict[str, Any]:
    thresholds = {**DEFAULT_THRESHOLDS, **(manifest.get("continuityGate") or {})}
    avg_height = max(1.0, mean(a["height"], b["height"]))
    avg_width = max(1.0, mean(a["width"], b["width"]))
    avg_area = max(1.0, mean(a["area"], b["area"]))
    source_height = max(1.0, mean(a["sourceHeight"], b["sourceHeight"]))
    source_width = max(1.0, mean(a["sourceWidth"], b["sourceWidth"]))

    values = {
        "heightPct": abs(b["height"] - a["height"]) / avg_height,
        "widthPct": abs(b["width"] - a["width"]) / avg_width,
        "baselinePct": abs(b["bottom"] - a["bottom"]) / source_height,
        "centerPct": abs(b["centerX"] - a["centerX"]) / source_width,
        "lowerAnchorPct": abs(b["lowerAnchorX"] - a["lowerAnchorX"]) / source_width,
        "areaPct": abs(b["area"] - a["area"]) / avg_area,
        "silhouetteDistance": silhouette_distance(a["mask"], b["mask"]),
    }

    severities = []
    weighted = 0.0
    weight_total = 0.0
    for key, weight in WEIGHTS.items():
        threshold = max(0.0001, float(thresholds[key]))
        ratio = values[key] / threshold
        weighted += ratio * weight
        weight_total += weight
        severities.append({"key": key, "value": values[key], "threshold": threshold, "ratio": ratio})

    severity = weighted / weight_total
    score = round(clamp(103.0 - severity * 30.0, 0.0, 100.0))
    peak = max(item["ratio"] for item in severities)
    status = "PASS"
    if score < int(thresholds["bridgeScore"]) or peak >= 1.60:
        status = "BRIDGE"
    elif score < int(thresholds["passScore"]) or peak >= 0.92:
        status = "TUNE"

    severities.sort(key=lambda item: item["ratio"], reverse=True)
    top = severities[:3]
    recommendation = classify_reason(top[0]["key"], top[0]["ratio"], to_frame.get("cue"))

    return {
        "index": index,
        "fromId": from_frame["id"],
        "toId": to_frame["id"],
        "fromLabel": from_frame.get("label", from_frame["id"]),
        "toLabel": to_frame.get("label", to_frame["id"]),
        "status": status,
        "score": score,
        "recommendation": recommendation,
        "reasons": [
            {
                "metric": LABELS[item["key"]],
                "key": item["key"],
                "value": round(item["value"], 5),
                "threshold": round(item["threshold"], 5),
                "ratio": round(item["ratio"], 3),
            }
            for item in top
        ],
        "metrics": {key: round(value, 5) for key, value in values.items()},
    }


def analyze_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    frames = manifest["frames"] if manifest.get("signatureReady") else manifest["previewFrames"]
    loaded = [(frame, metrics(frame_image(manifest, frame))) for frame in frames]
    handoffs = [
        compare_pair(manifest, loaded[i][0], loaded[i + 1][0], loaded[i][1], loaded[i + 1][1], i)
        for i in range(len(loaded) - 1)
    ]
    ranked = sorted(handoffs, key=lambda item: (item["score"], item["index"]))
    counts = {
        "PASS": sum(1 for item in handoffs if item["status"] == "PASS"),
        "TUNE": sum(1 for item in handoffs if item["status"] == "TUNE"),
        "BRIDGE": sum(1 for item in handoffs if item["status"] == "BRIDGE"),
    }
    return {
        "id": manifest["id"],
        "character": manifest["displayName"],
        "sequence": manifest["sequenceName"],
        "counts": counts,
        "worst": ranked[: min(3, len(ranked))],
        "handoffs": handoffs,
    }


def markdown_report(report: dict[str, Any]) -> str:
    lines = [
        "# PriZim Continuity Batch Report",
        "",
        "Generated headlessly from current sequence manifests and QA authority proxies.",
        "Phone QA remains the final motion-quality authority.",
        "",
    ]
    for sequence in report["sequences"]:
        c = sequence["counts"]
        lines += [
            f"## {sequence['character']} · {sequence['sequence']}",
            "",
            f"PASS {c['PASS']} · TUNE {c['TUNE']} · BRIDGE {c['BRIDGE']}",
            "",
            "| Rank | Handoff | Score | Decision | Primary recommendation |",
            "|---:|---|---:|---|---|",
        ]
        for rank, item in enumerate(sequence["worst"], 1):
            handoff = f"{item['fromLabel']} → {item['toLabel']}"
            lines.append(f"| {rank} | {handoff} | {item['score']} | {item['status']} | {item['recommendation']} |")
        lines.append("")
        lines.append("Top flags:")
        for item in sequence["worst"]:
            reasons = "; ".join(
                f"{reason['metric']} {reason['value']:.3f}/{reason['threshold']:.3f}"
                for reason in item["reasons"]
            )
            lines.append(f"- **{item['fromLabel']} → {item['toLabel']}**: {item['status']} {item['score']} · {reasons}")
        lines.append("")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-json", default="build/prizim/continuity-report.json")
    parser.add_argument("--out-md", default="build/prizim/continuity-report.md")
    args = parser.parse_args()

    sequences = [analyze_manifest(load_json(SEQUENCE_DIR / filename)) for filename in EXPECTED]
    report = {"schemaVersion": 1, "generator": "PriZim Continuity Batch Report", "sequences": sequences}

    out_json = ROOT / args.out_json
    out_md = ROOT / args.out_md
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    text = markdown_report(report)
    out_md.write_text(text, encoding="utf-8")

    print(text)
    print(f"Wrote {out_json.relative_to(ROOT)}")
    print(f"Wrote {out_md.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
