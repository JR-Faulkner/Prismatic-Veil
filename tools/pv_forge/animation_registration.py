#!/usr/bin/env python3
"""PriZim animation registration gate.

Measures horizontal frame strips, distinguishes intended pose compression from model-scale drift,
and can emit a mechanically normalized preview without touching source art.

Usage:
  python tools/pv_forge/animation_registration.py path/to/strip.png \
    --frames 6 --profile idle --normalize

Outputs JSON/Markdown plus an optional normalized PNG under build/prizim/animation-registration/.
"""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

from PIL import Image


PROFILES = {
    "idle": {
        "height_ratios": [1.00, 0.98, 0.99, 1.00, 0.99, 1.00],
        "baseline_tolerance_px": 2,
        "scale_tolerance_pct": 3.0,
        "loop_tolerance_pct": 2.5,
    },
    "attack": {
        "height_ratios": [1.00, 0.96, 0.98, 0.99, 0.97, 1.00],
        "baseline_tolerance_px": 3,
        "scale_tolerance_pct": 4.0,
        "loop_tolerance_pct": 3.0,
    },
    "generic": {
        "height_ratios": None,
        "baseline_tolerance_px": 3,
        "scale_tolerance_pct": 4.0,
        "loop_tolerance_pct": 3.0,
    },
}


@dataclass
class FrameMetric:
    frame: int
    x0: int
    y0: int
    x1: int
    y1: int
    width: int
    height: int
    baseline: int
    expected_ratio: float
    observed_ratio: float
    scale_error_pct: float
    suggested_scale: float
    suggested_y_shift: int


def foreground_bbox(cell: Image.Image, white_threshold: int = 245, alpha_threshold: int = 12):
    rgba = cell.convert("RGBA")
    px = rgba.load()
    xs, ys = [], []
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = px[x, y]
            if a <= alpha_threshold:
                continue
            if r >= white_threshold and g >= white_threshold and b >= white_threshold:
                continue
            xs.append(x)
            ys.append(y)
    if not xs:
        return None
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def split_cells(img: Image.Image, frames: int) -> list[Image.Image]:
    if img.width % frames != 0:
        raise ValueError(f"strip width {img.width} is not divisible by {frames} frames")
    fw = img.width // frames
    return [img.crop((i * fw, 0, (i + 1) * fw, img.height)) for i in range(frames)]


def choose_expected_ratios(profile: str, frames: int) -> list[float]:
    ratios = PROFILES[profile]["height_ratios"]
    if ratios is None or len(ratios) != frames:
        return [1.0] * frames
    return list(ratios)


def analyze(img: Image.Image, frames: int, profile: str, white_threshold: int):
    cells = split_cells(img, frames)
    boxes = [foreground_bbox(c, white_threshold=white_threshold) for c in cells]
    if any(b is None for b in boxes):
        missing = [i + 1 for i, b in enumerate(boxes) if b is None]
        raise ValueError(f"no foreground detected in frame(s): {missing}")

    heights = [b[3] - b[1] for b in boxes]
    baselines = [b[3] - 1 for b in boxes]
    anchor_height = heights[0]
    anchor_baseline = baselines[0]
    expected = choose_expected_ratios(profile, frames)
    metrics: list[FrameMetric] = []

    for i, (box, h, base, er) in enumerate(zip(boxes, heights, baselines, expected)):
        target_height = anchor_height * er
        observed_ratio = h / anchor_height if anchor_height else 1.0
        scale_error_pct = ((h - target_height) / target_height * 100.0) if target_height else 0.0
        suggested_scale = target_height / h if h else 1.0
        suggested_y_shift = anchor_baseline - base
        x0, y0, x1, y1 = box
        metrics.append(FrameMetric(
            frame=i + 1,
            x0=x0, y0=y0, x1=x1, y1=y1,
            width=x1 - x0, height=h, baseline=base,
            expected_ratio=round(er, 4),
            observed_ratio=round(observed_ratio, 4),
            scale_error_pct=round(scale_error_pct, 2),
            suggested_scale=round(suggested_scale, 5),
            suggested_y_shift=int(suggested_y_shift),
        ))

    return cells, metrics


def normalize(cells: list[Image.Image], metrics: list[FrameMetric], canvas_height: int) -> Image.Image:
    fw = cells[0].width
    out = Image.new("RGBA", (fw * len(cells), canvas_height), (255, 255, 255, 0))
    anchor_baseline = metrics[0].baseline

    for i, (cell, m) in enumerate(zip(cells, metrics)):
        rgba = cell.convert("RGBA")
        bbox = (m.x0, m.y0, m.x1, m.y1)
        subject = rgba.crop(bbox)
        scale = m.suggested_scale
        nw = max(1, round(subject.width * scale))
        nh = max(1, round(subject.height * scale))
        subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

        # Keep each subject horizontally centered within its original detected region,
        # while anchoring the boot/ground bottom to Frame 1's baseline.
        original_center = (m.x0 + m.x1) / 2
        x = round(original_center - nw / 2)
        y = round(anchor_baseline - nh + 1)
        x = max(0, min(fw - nw, x))
        y = max(0, min(canvas_height - nh, y))
        out.alpha_composite(subject, (i * fw + x, y))

    return out


def build_report(path: Path, profile: str, metrics: list[FrameMetric], normalized_path: Path | None):
    cfg = PROFILES[profile]
    baseline_drift = max(m.baseline for m in metrics) - min(m.baseline for m in metrics)
    scale_failures = [m.frame for m in metrics if abs(m.scale_error_pct) > cfg["scale_tolerance_pct"]]
    baseline_fail = baseline_drift > cfg["baseline_tolerance_px"]
    loop_height_delta_pct = abs(metrics[-1].height - metrics[0].height) / metrics[0].height * 100.0
    loop_fail = loop_height_delta_pct > cfg["loop_tolerance_pct"]
    passed = not scale_failures and not baseline_fail and not loop_fail

    issues = []
    if baseline_fail:
        issues.append(f"baseline drift {baseline_drift}px exceeds {cfg['baseline_tolerance_px']}px")
    if scale_failures:
        issues.append(f"unexpected scale drift in frame(s) {scale_failures}")
    if loop_fail:
        issues.append(f"loop seam height delta {loop_height_delta_pct:.2f}% exceeds {cfg['loop_tolerance_pct']}%")

    return {
        "tool": "PriZim Animation Registration Gate",
        "source": str(path),
        "profile": profile,
        "status": "success" if passed else "failure",
        "baseline_drift_px": baseline_drift,
        "baseline_tolerance_px": cfg["baseline_tolerance_px"],
        "scale_tolerance_pct": cfg["scale_tolerance_pct"],
        "loop_height_delta_pct": round(loop_height_delta_pct, 2),
        "loop_tolerance_pct": cfg["loop_tolerance_pct"],
        "issues": issues,
        "frames": [asdict(m) for m in metrics],
        "normalized_preview": str(normalized_path) if normalized_path else None,
    }


def markdown(report: dict) -> str:
    lines = [
        "## PriZim Animation Registration",
        f"- Source: `{report['source']}`",
        f"- Profile: `{report['profile']}`",
        f"- Result: **{report['status'].upper()}**",
        f"- Baseline drift: {report['baseline_drift_px']}px / {report['baseline_tolerance_px']}px allowed",
        f"- Loop seam height delta: {report['loop_height_delta_pct']}% / {report['loop_tolerance_pct']}% allowed",
        "",
        "| Frame | Height | Baseline | Expected ratio | Observed ratio | Scale error | Suggested scale | Y shift |",
        "|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for m in report["frames"]:
        lines.append(
            f"| {m['frame']} | {m['height']} | {m['baseline']} | {m['expected_ratio']:.3f} | "
            f"{m['observed_ratio']:.3f} | {m['scale_error_pct']:+.2f}% | {m['suggested_scale']:.5f} | {m['suggested_y_shift']:+d}px |"
        )
    if report["issues"]:
        lines += ["", "### Tripwires", *[f"- ❌ {issue}" for issue in report["issues"]]]
    else:
        lines += ["", "- ✅ Baseline, expected pose compression, and loop seam are within tolerance."]
    if report.get("normalized_preview"):
        lines.append(f"- Mechanical normalized preview: `{report['normalized_preview']}`")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("--frames", type=int, default=6)
    parser.add_argument("--profile", choices=sorted(PROFILES), default="generic")
    parser.add_argument("--white-threshold", type=int, default=245)
    parser.add_argument("--normalize", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=Path("build/prizim/animation-registration"))
    parser.add_argument("--soft-fail", action="store_true", help="write reports but return 0 even on tripwire failure")
    args = parser.parse_args()

    if not args.image.exists():
        print(f"PriZim Animation Registration: SKIP missing {args.image}")
        return 0 if args.soft_fail else 2

    img = Image.open(args.image).convert("RGBA")
    cells, metrics = analyze(img, args.frames, args.profile, args.white_threshold)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    stem = args.image.stem
    normalized_path = None
    if args.normalize:
        normalized_path = args.output_dir / f"{stem}.normalized.png"
        normalize(cells, metrics, img.height).save(normalized_path)

    report = build_report(args.image, args.profile, metrics, normalized_path)
    json_path = args.output_dir / f"{stem}.json"
    md_path = args.output_dir / f"{stem}.md"
    json_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(markdown(report), encoding="utf-8")
    print(markdown(report))
    return 0 if report["status"] == "success" or args.soft_fail else 1


if __name__ == "__main__":
    raise SystemExit(main())
