#!/usr/bin/env python3
"""PriZim Tactical Preflight.

Static production guard for phone-test harnesses. This checker exists to catch
repeat regressions before human QA: disabled active-turn slices, legacy BP
fallback exposure, missing lawn-side staging, legacy HUD slabs, stale module
chains, and deprecated pose authority leaking into the current harness.

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
SLICE_BASE = ROOT / "src" / "tactical" / "ActiveTurnBattleSlice.js"


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
        "06A": SCENE_06A,
        "slice": SLICE_BASE,
    }
    texts = {k: read(v) for k, v in files.items()}
    results: list[Check] = []

    for label, path in files.items():
        results.append(check(
            f"required file: {label}",
            path.exists(),
            f"{path.relative_to(ROOT)} exists",
            f"missing {path.relative_to(ROOT)}",
        ))

    harness = texts["harness"]
    d = texts["06D"]
    c = texts["06C"]
    b = texts["06B"]
    a = texts["06A"]
    base = texts["slice"]

    # Entry chain and cache-bust invariants.
    results.append(check(
        "06D harness entry",
        "IntegratedTacticalScene06D.js?v=" in harness,
        "phone harness imports 06D with explicit module version",
        "phone harness is not pinned to a versioned 06D module",
    ))

    chain = [("06D→06C", d), ("06C→06B", c), ("06B→06A", b)]
    for label, text in chain:
        rel = versioned_imports(text)
        ok = bool(rel) and all("?v=" in p for p in rel)
        results.append(check(
            f"versioned import chain {label}",
            ok,
            f"{label} relative imports are cache-versioned",
            f"{label} contains an unversioned relative import: {rel}",
        ))

    # Tactical view authority.
    results.append(check(
        "shallow tactical lock",
        "return 'shallow'" in c and "halfH:13" in b,
        "06C locks shallow presentation and 06B defines shallow half-height 13",
        "shallow presentation is not deterministically locked",
    ))

    # Human-QA staging invariant.
    required_moves = [
        "_moveUnitForQa(auryi, 7, 5)",
        "_moveUnitForQa(prismel, 8, 6)",
        "_moveUnitForQa(kineza, 8, 7)",
        "_moveUnitForQa(h1, 9, 5)",
        "_moveUnitForQa(h2, 10, 6)",
        "_moveUnitForQa(h3, 9, 7)",
        "focusOn(8.7, 6.2, 0)",
    ]
    missing_moves = [x for x in required_moves if x not in d]
    results.append(check(
        "lawn-side quick-start staging",
        not missing_moves,
        "approved lawn-side QA cluster and camera focus are present",
        f"quick-start staging drifted; missing: {missing_moves}",
    ))

    # Compact HUD must suppress inherited encounter slab.
    suppress_ok = (
        "_suppressLegacyEncounterHUD06D" in d
        and "encounterHUD.container.setVisible(false)" in d
        and d.count("_suppressLegacyEncounterHUD06D()") >= 3
    )
    results.append(check(
        "legacy encounter HUD suppression",
        suppress_ok,
        "06D suppresses the inherited TacticalEncounterHUD during create/layout/refresh",
        "legacy TacticalEncounterHUD can reappear over the compact shell",
    ))

    # The active-turn base is intentionally query-gated in production.
    gate_exists = "params.get('battleslice')" in base and "isEnabled()" in base
    results.append(check(
        "production active-turn gate documented",
        gate_exists,
        "base active-turn slice remains explicitly battleslice-gated",
        "active-turn production gate cannot be verified",
    ))

    # Dedicated QA harness must defeat the missing-query regression internally.
    force_ok = (
        "_forceActiveTurnHarness06D" in d
        and "this.activeTurnBattleSlice.isEnabled = () => true" in d
        and "this._forceActiveTurnHarness06D();" in d
    )
    results.append(check(
        "QA active-turn force-enable",
        force_ok,
        "06D force-enables active-turn locally; URL query omission cannot disable the slice",
        "06D can silently fall through because active-turn enablement depends on URL state",
    ))

    # Canon guard: Auryi/Kineza may not reach inherited substitute poses or BP.
    canon_guard_ok = (
        "hero.id === 'auryi' || hero.id === 'kineza'" in d
        and "CANON ENTRANCE + ATTACK QUEUED" in d
        and re.search(r"if \(hero && \(hero\.id === 'auryi' \|\| hero\.id === 'kineza'\)\) \{[\s\S]*?return;", d)
    )
    results.append(check(
        "Auryi/Kineza false-canon guard",
        bool(canon_guard_ok),
        "06D blocks Auryi/Kineza before inherited substitute presentation or legacy BP",
        "Auryi/Kineza can reach deprecated substitute presentation or BP fallback",
    ))

    # Prismel must force the slice immediately before delegating to inherited bridge.
    prismel_guard_ok = (
        "this._forceActiveTurnHarness06D();\n    return super.enterLinkedBattle" in d
        or "this._forceActiveTurnHarness06D();\r\n    return super.enterLinkedBattle" in d
    )
    results.append(check(
        "Prismel BP fallback guard",
        prismel_guard_ok,
        "06D reasserts active-turn enablement immediately before inherited battle entry",
        "Prismel can delegate to inherited battle entry without reasserting active-turn",
    ))

    # Known debt is surfaced rather than hidden: deprecated pose assets still exist in 06A.
    deprecated_refs = [
        "Pose01_BattleReady_BattleMasterA_LOCKED.png",
        "Kineza01_Idle_LOCKED.png",
    ]
    old_present = any(x in a for x in deprecated_refs)
    results.append(check(
        "deprecated substitute assets isolated",
        not old_present,
        "deprecated Auryi/Kineza substitute pose assets are absent from inherited 06A",
        "deprecated substitute pose assets still exist in 06A; 06D runtime guards must remain until production masters are ingested",
        warn=True,
    ))

    # Production canon ingestion is not complete yet. Make that explicit every run.
    attack_master_refs = (
        "auryi_attack_master" in a.lower() and "kineza_attack_master" in a.lower()
    )
    results.append(check(
        "Attack Master A production ingestion",
        attack_master_refs,
        "Auryi and Kineza Attack Master A runtime assets are referenced in active-turn wiring",
        "Auryi/Kineza Attack Master A production binaries are not yet referenced by 06A",
        warn=True,
    ))

    failures = [r for r in results if r.status == "FAIL"]
    warnings = [r for r in results if r.status == "WARN"]
    summary = "FAIL" if failures else ("WARN" if warnings else "PASS")

    payload = {
        "tool": "PriZim Tactical Preflight",
        "summary": summary,
        "failures": len(failures),
        "warnings": len(warnings),
        "checks": [asdict(r) for r in results],
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "tactical-preflight.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# PriZim Tactical Preflight",
        "",
        f"**Result: {summary}**  ",
        f"Failures: {len(failures)} · Warnings: {len(warnings)}",
        "",
        "| Check | Status | Detail |",
        "|---|---|---|",
    ]
    for r in results:
        detail = r.detail.replace("|", "\\|")
        lines.append(f"| {r.name} | **{r.status}** | {detail} |")
    lines.append("")
    lines.append("Phone QA should not begin while any **FAIL** remains.")
    (OUT / "tactical-preflight.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"PriZim Tactical Preflight: {summary}")
    for r in results:
        print(f"[{r.status}] {r.name}: {r.detail}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
