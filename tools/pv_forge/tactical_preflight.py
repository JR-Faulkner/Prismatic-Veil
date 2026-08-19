#!/usr/bin/env python3
"""PriZim Tactical Preflight.

Static production guard for phone-test harnesses. Catches repeat regressions
before human QA: disabled active-turn slices, legacy BP fallback exposure,
missing lawn staging, legacy HUD slabs, stale module chains, missing canon
masters, unsafe spritesheet handoffs, and deprecated asset authority leaking
into Tactical runtime.

PASS = invariant verified
WARN = known debt, test may proceed
FAIL = do not hand this build to phone QA
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "build" / "prizim"

HARNESS = ROOT / "tactical-shell-06d-clean.html"
SCENE_06D = ROOT / "src" / "tactical" / "IntegratedTacticalScene06D.js"
SCENE_06C = ROOT / "src" / "tactical" / "IntegratedTacticalScene06C.js"
SCENE_06B = ROOT / "src" / "tactical" / "IntegratedTacticalViewFlavor06B.js"
SCENE_06A = ROOT / "src" / "tactical" / "IntegratedTacticalScene06A.js"
SLICE_06A = ROOT / "src" / "tactical" / "ActiveTurnBattleSlice06A.js"
SLICE_BASE = ROOT / "src" / "tactical" / "ActiveTurnBattleSlice.js"

PRODUCTION_MASTERS = [
    ROOT / "assets/sequences/production/auryi_auorb_entrance_master_a.png",
    ROOT / "assets/sequences/production/auryi_attack_master_a.png",
    ROOT / "assets/sequences/production/kineza_gauntlet_ignition_master_a.png",
    ROOT / "assets/sequences/production/kineza_attack_master_a.png",
]

@dataclass
class Check:
    name: str
    status: str
    detail: str

def read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""

def check(name: str, ok: bool, good: str, bad: str, *, warn: bool = False) -> Check:
    if ok:
        return Check(name, "PASS", good)
    return Check(name, "WARN" if warn else "FAIL", bad)

def versioned_imports(text: str) -> list[str]:
    imports = re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]", text)
    return [p for p in imports if p.startswith(".")]

def main() -> int:
    files = {
        "harness": HARNESS,
        "06D": SCENE_06D,
        "06C": SCENE_06C,
        "06B": SCENE_06B,
        "06A scene": SCENE_06A,
        "06A slice": SLICE_06A,
        "base slice": SLICE_BASE,
    }
    texts = {k: read(v) for k, v in files.items()}
    results: list[Check] = []

    for label, path in files.items():
        results.append(check(f"required file: {label}", path.exists(), f"{path.relative_to(ROOT)} exists", f"missing {path.relative_to(ROOT)}"))

    harness = texts["harness"]
    d = texts["06D"]
    c = texts["06C"]
    b = texts["06B"]
    scene_a = texts["06A scene"]
    slice_a = texts["06A slice"]
    base = texts["base slice"]

    results.append(check("06D harness entry", "IntegratedTacticalScene06D.js?v=" in harness, "phone harness imports versioned 06D", "phone harness is not pinned to a versioned 06D module"))

    chain = [("06D→06C", d), ("06C→06B", c), ("06B→06A", b), ("06A scene→06A slice", scene_a)]
    for label, text in chain:
        rels = versioned_imports(text)
        ok = bool(rels) and all("?v=" in p for p in rels)
        results.append(check(f"versioned import chain {label}", ok, f"{label} relative imports are cache-versioned", f"{label} contains an unversioned relative import: {rels}"))

    results.append(check("shallow tactical lock", "return 'shallow'" in c and "halfH:13" in b, "06C locks shallow and 06B defines half-height 13", "shallow presentation is not deterministically locked"))

    required_moves = [
        "_moveUnitForQa(auryi, 7, 5)",
        "_moveUnitForQa(prismel, 8, 6)",
        "_moveUnitForQa(kineza, 9, 6)",
        "_moveUnitForQa(h1, 9, 5)",
        "_moveUnitForQa(h2, 10, 6)",
        "_moveUnitForQa(h3, 9, 7)",
        "focusOn(8.7, 6.2, 0)",
    ]
    missing_moves = [x for x in required_moves if x not in d]
    results.append(check("lawn-side quick-start staging", not missing_moves, "approved lawn-side QA cluster and corrected Kineza right-side start are present", f"quick-start staging drifted; missing: {missing_moves}"))

    suppress_ok = "_suppressLegacyEncounterHUD06D" in d and "encounterHUD.container.setVisible(false)" in d and d.count("_suppressLegacyEncounterHUD06D()") >= 3
    results.append(check("legacy encounter HUD suppression", suppress_ok, "06D suppresses TacticalEncounterHUD during create/layout/refresh", "legacy TacticalEncounterHUD can reappear over compact shell"))

    gate_exists = "params.get('battleslice')" in base and "isEnabled()" in base
    results.append(check("production active-turn gate documented", gate_exists, "base active-turn slice remains battleslice-gated", "active-turn production gate cannot be verified"))

    force_ok = "_forceActiveTurnHarness06D" in d and "this.activeTurnBattleSlice.isEnabled = () => true" in d and "return super.enterLinkedBattle(hero, target, actionKind);" in d
    results.append(check("QA active-turn force-enable", force_ok, "06D reasserts active-turn before inherited battle entry", "06D can silently fall through to legacy BP"))

    intercept_ok = all(x in slice_a for x in ["'prismel'", "'auryi'", "'kineza'", "shouldIntercept"])
    results.append(check("three-hero active-turn interception", intercept_ok, "06A active-turn slice intercepts Prismel, Auryi, and Kineza", "06A does not prove all three heroes stay inside active-turn"))

    master_names = [p.stem for p in PRODUCTION_MASTERS]
    missing_files = [p.relative_to(ROOT).as_posix() for p in PRODUCTION_MASTERS if not p.exists()]
    results.append(check("production master binaries", not missing_files, "all four Auryi/Kineza production masters exist", f"missing production masters: {missing_files}"))

    missing_preloads = [name for name in master_names if name not in scene_a]
    results.append(check("production master preload wiring", not missing_preloads and "frameWidth: 512" in scene_a and "frameHeight: 512" in scene_a, "06A preloads all four production masters as 512x512 spritesheets", f"06A preload/frame contract missing: {missing_preloads}"))

    registration_ok = "attackRegistration" in slice_a and "0.98869" in slice_a and "0.94027" in slice_a and "_registration06A" in slice_a
    results.append(check("PriZim registration applied", registration_ok, "Auryi deterministic registration and Kineza normalization profiles are wired", "PriZim attack registration profiles are not wired into 06A"))

    handoff_ok = all(x in slice_a for x in ["this.scene.add.sprite", "_assertSheetFrame06A", "textures.exists(sheet)", "img.setTexture(sheet)", "img.setFrame(index)", "this._assertSheetFrame06A(spec.attackSheet, i)"]) and "img.setTexture(sheet, index)" not in slice_a
    results.append(check("runtime spritesheet handoff guard", handoff_ok, "06A validates all attack frames and uses explicit Sprite texture/frame handoff", "06A can regress to an unvalidated cross-spritesheet setTexture(key, frame) handoff"))

    diagnostics_ok = "overflow-wrap:anywhere" in harness and "error?.message" in harness and "error?.stack" in harness
    results.append(check("mobile runtime diagnostics", diagnostics_ok, "phone harness preserves readable error message + wrapped stack diagnostics", "phone runtime errors can collapse back into clipped stack-only output"))

    results.append(check("temporary canon block removed", "CANON ENTRANCE + ATTACK QUEUED" not in d, "06D no longer blocks Auryi/Kineza from their production presenter", "06D still contains the temporary Auryi/Kineza block"))

    deprecated_refs = ["Pose01_BattleReady_BattleMasterA_LOCKED.png", "Kineza01_Idle_LOCKED.png"]
    old_present = any(x in slice_a or x in scene_a for x in deprecated_refs)
    results.append(check("deprecated substitute assets isolated", not old_present, "deprecated Auryi/Kineza substitute pose assets are absent from current 06A wiring", "deprecated substitute pose assets leaked back into current 06A wiring"))

    qa_proxy_refs = ["auryi_auorb.webp", "kineza_gauntlet_ignition.webp"]
    proxy_leak = any(x in slice_a or x in scene_a or x in d for x in qa_proxy_refs)
    results.append(check("QA proxies excluded from Tactical runtime", not proxy_leak, "Tactical runtime references production masters only", "QA proxy asset leaked into Tactical runtime"))

    failures = [r for r in results if r.status == "FAIL"]
    warnings = [r for r in results if r.status == "WARN"]
    summary = "FAIL" if failures else ("WARN" if warnings else "PASS")
    payload = {"tool": "PriZim Tactical Preflight", "summary": summary, "failures": len(failures), "warnings": len(warnings), "checks": [asdict(r) for r in results]}

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "tactical-preflight.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    lines = ["# PriZim Tactical Preflight", "", f"**Result: {summary}**  ", f"Failures: {len(failures)} · Warnings: {len(warnings)}", "", "| Check | Status | Detail |", "|---|---|---|"]
    for r in results:
        lines.append(f"| {r.name} | **{r.status}** | {r.detail.replace('|', '\\|')} |")
    lines += ["", "Phone QA should not begin while any **FAIL** remains."]
    (OUT / "tactical-preflight.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"PriZim Tactical Preflight: {summary}")
    for r in results:
        print(f"[{r.status}] {r.name}: {r.detail}")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
