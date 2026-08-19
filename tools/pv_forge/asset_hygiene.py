#!/usr/bin/env python3
"""PriZim Asset Hygiene.

Classifies tactical assets by authority instead of filename proximity.

KEEP              production/runtime authority
ARCHIVE            historical/QA reference, must not be executable from current runtime
PENDING            approved canon with binary ingestion still outstanding
DELETE_CANDIDATE   unreferenced file under explicitly archive-only roots

This script never deletes files. It reports only.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "pv-data" / "asset_authority" / "tactical_active_turn.assets.json"
OUT = ROOT / "build" / "prizim"

RUNTIME_DIR = ROOT / "src"
ROOT_RUNTIME_SUFFIXES = {".js", ".ts", ".html"}
SRC_RUNTIME_SUFFIXES = {".js", ".ts", ".json"}
ASSET_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_manifest() -> dict:
    if not MANIFEST.exists():
        raise SystemExit(f"missing asset authority manifest: {rel(MANIFEST)}")
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def runtime_text() -> str:
    """Return only executable/runtime-facing text.

    Scan runtime source plus root entry scripts/pages. Do not recursively scan
    asset manifests, Sequence Lab metadata, PriZim authority data, docs, tools,
    reports, or QA support files. QA assets may be referenced by QA metadata;
    they fail only when executable runtime code references them.
    """
    chunks: list[str] = []

    if RUNTIME_DIR.exists():
        for p in RUNTIME_DIR.rglob("*"):
            if not p.is_file() or p.suffix.lower() not in SRC_RUNTIME_SUFFIXES:
                continue
            try:
                chunks.append(p.read_text(encoding="utf-8"))
            except UnicodeDecodeError:
                pass

    for p in ROOT.iterdir():
        if not p.is_file() or p.suffix.lower() not in ROOT_RUNTIME_SUFFIXES:
            continue
        try:
            chunks.append(p.read_text(encoding="utf-8"))
        except UnicodeDecodeError:
            pass

    return "\n".join(chunks)


def referenced(path: str, text: str) -> bool:
    name = Path(path.rstrip("/")).name
    return path in text or (bool(name) and name in text)


def main() -> int:
    data = load_manifest()
    text = runtime_text()
    rows: list[dict] = []
    failures: list[str] = []

    for hero, spec in data.get("heroes", {}).items():
        status = spec.get("status", "unknown")
        if status == "active":
            rows.append({"asset": hero, "class": "KEEP", "detail": "active production authority"})
            continue

        if status == "pending_binary_ingestion":
            for beat in ("entrance", "attack"):
                item = spec.get(beat, {})
                path = item.get("expected_path")
                exists = bool(path) and (ROOT / path).exists()
                rows.append({
                    "asset": path or f"{hero}:{beat}",
                    "class": "KEEP" if exists else "PENDING",
                    "detail": "production binary present" if exists else f"approved canon awaiting binary ingestion ({hero} {beat})",
                })

    for item in data.get("archive", []):
        path = item["path"]
        p = ROOT / path
        is_dir = path.endswith("/")
        if is_dir:
            files = [x for x in p.rglob("*") if x.is_file() and x.suffix.lower() in ASSET_SUFFIXES] if p.exists() else []
            if not files:
                rows.append({"asset": path, "class": "ARCHIVE", "detail": "archive root absent/empty"})
            for f in files:
                rp = rel(f)
                live = referenced(rp, text)
                cls = "FAIL_ACTIVE_ARCHIVE" if live else "ARCHIVE"
                rows.append({"asset": rp, "class": cls, "detail": item.get("reason", "")})
                if live:
                    failures.append(rp)
        else:
            live = referenced(path, text)
            cls = "FAIL_ACTIVE_ARCHIVE" if live else "ARCHIVE"
            rows.append({"asset": path, "class": cls, "detail": item.get("reason", "")})
            if live:
                failures.append(path)

    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "tool": "PriZim Asset Hygiene",
        "result": "FAIL" if failures else "PASS",
        "failures": failures,
        "rows": rows,
    }
    (OUT / "asset-hygiene.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# PriZim Asset Hygiene",
        "",
        f"**Result: {payload['result']}**",
        "",
        "| Asset | Class | Detail |",
        "|---|---|---|",
    ]
    for row in rows:
        detail = str(row["detail"]).replace("|", "\\|")
        lines.append(f"| `{row['asset']}` | **{row['class']}** | {detail} |")
    lines += ["", "No file is deleted automatically. DELETE candidates require a separate reviewed purge step."]
    (OUT / "asset-hygiene.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"PriZim Asset Hygiene: {payload['result']}")
    for row in rows:
        print(f"[{row['class']}] {row['asset']}: {row['detail']}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
