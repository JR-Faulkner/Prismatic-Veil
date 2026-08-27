#!/usr/bin/env python3
"""PriZim high-res attack registration helper.

Measures a fixed-grid attack sheet without treating bright FX, particles, or staff
extremities as body-scale authority. It does not redraw art. Output is technical
registration evidence for renderer adapters and phone QA.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image


def quantile(values, q):
    if not values:
        return 0.0
    values = sorted(values)
    pos = (len(values) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(values) - 1)
    frac = pos - lo
    return values[lo] * (1 - frac) + values[hi] * frac


def body_points(frame):
    """Return conservative body/gear candidates, suppressing hot FX pixels."""
    pts = []
    px = frame.load()
    w, h = frame.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y][:3]
            hi = max(r, g, b)
            lo = min(r, g, b)
            # Source candidates may be RGB on black. Keep meaningful colored
            # body/gear pixels while suppressing black background and peak FX.
            if hi <= 18 or hi >= 220 or (hi - lo) <= 8:
                continue
            pts.append((x, y))
    return pts


def measure(frame, frame_index):
    pts = body_points(frame)
    if not pts:
        raise RuntimeError(f"frame {frame_index}: no measurable body pixels")

    ys = [p[1] for p in pts]
    top = quantile(ys, 0.02)
    bottom = quantile(ys, 0.993)
    body_h = max(1.0, bottom - top)

    # Horizontal anchor comes from the lower body, not staff/FX.
    lower_cut = bottom - body_h * 0.13
    lower_x = [x for x, y in pts if y >= lower_cut]
    anchor_x = quantile(lower_x, 0.5) if lower_x else frame.size[0] / 2

    return {
        "frame": frame_index,
        "bodyTopPx": round(top, 3),
        "bodyBottomPx": round(bottom, 3),
        "bodyHeightPx": round(body_h, 3),
        "lowerBodyAnchorXPx": round(anchor_x, 3),
        "baselinePx": round(bottom, 3),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet", type=Path)
    ap.add_argument("--cols", type=int, default=5)
    ap.add_argument("--rows", type=int, default=2)
    ap.add_argument("--out", type=Path)
    args = ap.parse_args()

    image = Image.open(args.sheet).convert("RGB")
    w, h = image.size
    xs = [round(i * w / args.cols) for i in range(args.cols + 1)]
    ys = [round(i * h / args.rows) for i in range(args.rows + 1)]

    frames = []
    n = 1
    for row in range(args.rows):
        for col in range(args.cols):
            crop = image.crop((xs[col], ys[row], xs[col + 1], ys[row + 1]))
            frames.append(measure(crop, n))
            n += 1

    target_h = quantile([f["bodyHeightPx"] for f in frames], 0.5)
    target_baseline = quantile([f["baselinePx"] for f in frames], 0.5)
    target_anchor = quantile([f["lowerBodyAnchorXPx"] for f in frames], 0.5)

    for f in frames:
        f["scaleToMedianBody"] = round(target_h / f["bodyHeightPx"], 6)
        f["xToMedianAnchorPx"] = round(target_anchor - f["lowerBodyAnchorXPx"], 3)
        f["yToMedianBaselinePx"] = round(target_baseline - f["baselinePx"], 3)

    result = {
        "schema": "prizim.attack_measurement.v1",
        "sheet": str(args.sheet),
        "sheetWidthPx": w,
        "sheetHeightPx": h,
        "columns": args.cols,
        "rows": args.rows,
        "frameCount": len(frames),
        "normalization": {
            "targetBodyHeightPx": round(target_h, 3),
            "targetBaselinePx": round(target_baseline, 3),
            "targetLowerBodyAnchorXPx": round(target_anchor, 3),
            "strategy": "body-quantile-plus-lower-body-anchor"
        },
        "frames": frames,
    }

    text = json.dumps(result, indent=2) + "\n"
    if args.out:
        args.out.write_text(text, encoding="utf-8")
    else:
        print(text, end="")


if __name__ == "__main__":
    main()
