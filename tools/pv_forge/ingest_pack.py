#!/usr/bin/env python3
"""PriZim ingest-pack validator/promoter.

Usage:
    python tools/pv_forge/ingest_pack.py prizim-inbox/<pack>.zip

Validates manifest/checksums/dimensions, copies approved production masters to
repo destinations, and emits build/prizim/ingest-report.{json,md}.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "build" / "prizim"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def safe_dest(rel: str) -> Path:
    p = (ROOT / rel).resolve()
    root = ROOT.resolve()
    if root not in p.parents and p != root:
        raise ValueError(f"destination escapes repo: {rel}")
    if not rel.startswith("assets/sequences/production/"):
        raise ValueError(f"destination outside production sequence root: {rel}")
    return p


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: ingest_pack.py <pack.zip>")

    pack = Path(sys.argv[1]).resolve()
    if not pack.exists() or pack.suffix.lower() != ".zip":
        raise SystemExit(f"invalid pack: {pack}")

    rows = []
    failures = []
    promoted = []

    with tempfile.TemporaryDirectory(prefix="prizim_ingest_") as td:
        tmp = Path(td)
        with zipfile.ZipFile(pack) as zf:
            bad = [n for n in zf.namelist() if n.startswith("/") or ".." in Path(n).parts]
            if bad:
                raise SystemExit(f"unsafe zip entries: {bad}")
            zf.extractall(tmp)

        manifests = list(tmp.rglob("manifest.json"))
        if len(manifests) != 1:
            raise SystemExit(f"expected exactly one manifest.json, found {len(manifests)}")
        manifest_path = manifests[0]
        base = manifest_path.parent
        data = json.loads(manifest_path.read_text(encoding="utf-8"))

        if data.get("schema") != "prizim.ingest-pack.v0.1":
            failures.append("unsupported manifest schema")

        assets = data.get("assets", [])
        if not assets:
            failures.append("manifest contains no assets")

        for asset in assets:
            aid = asset.get("id", "unknown")
            prod_rel = asset.get("production_file")
            repo_rel = asset.get("repo_destination")
            expected_hash = asset.get("production_sha256")
            expected_dims = asset.get("dimensions")

            try:
                src = (base / prod_rel).resolve()
                if base.resolve() not in src.parents:
                    raise ValueError("production_file escapes pack")
                if not src.exists():
                    raise ValueError(f"missing production file {prod_rel}")
                got_hash = sha256(src)
                if expected_hash and got_hash != expected_hash:
                    raise ValueError(f"sha256 mismatch for {aid}")
                with Image.open(src) as im:
                    dims = [im.width, im.height]
                    if im.width != 1536 or im.height != 1024:
                        raise ValueError(f"unexpected sheet size {dims}, expected 1536x1024")
                    if expected_dims and dims != expected_dims:
                        raise ValueError(f"manifest dimension mismatch {dims} != {expected_dims}")
                dst = safe_dest(repo_rel)
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
                promoted.append(repo_rel)
                rows.append({"asset": aid, "status": "PASS", "detail": repo_rel})
            except Exception as exc:
                failures.append(f"{aid}: {exc}")
                rows.append({"asset": aid, "status": "FAIL", "detail": str(exc)})

    OUT.mkdir(parents=True, exist_ok=True)
    result = "FAIL" if failures else "PASS"
    payload = {
        "tool": "PriZim Ingest Pack",
        "result": result,
        "pack": pack.name,
        "promoted": promoted,
        "failures": failures,
        "rows": rows,
    }
    (OUT / "ingest-report.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# PriZim Ingest Pack",
        "",
        f"**Result: {result}**",
        "",
        f"Pack: `{pack.name}`",
        "",
        "| Asset | Status | Destination / Error |",
        "|---|---|---|",
    ]
    for row in rows:
        lines.append(f"| `{row['asset']}` | **{row['status']}** | {row['detail']} |")
    if failures:
        lines += ["", "## Failures", *[f"- {f}" for f in failures]]
    (OUT / "ingest-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"PriZim Ingest Pack: {result}")
    for row in rows:
        print(f"[{row['status']}] {row['asset']}: {row['detail']}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
