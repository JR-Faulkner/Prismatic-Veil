#!/usr/bin/env python3
"""PriZim Party Battle attack-authority gate.

Fails closed when current/preserved/pending attack authority drifts. This is
presentation/continuity validation only; it does not evaluate combat balance.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_json(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def require(condition: bool, message: str):
    if not condition:
        raise SystemExit(f"PZ ATTACK AUTHORITY FAIL: {message}")


def validate_markers(doc: dict, frame_count: int):
    markers = doc.get("markerFramesZeroBased", {})
    for name in ("gather", "release", "impact", "recover"):
        values = markers.get(name)
        require(isinstance(values, list) and values, f"missing marker list: {name}")
        for frame in values:
            require(isinstance(frame, int), f"{name} marker is not an integer")
            require(0 <= frame < frame_count, f"{name} marker {frame} outside {frame_count} frames")


def main():
    authority_text = (ROOT / "src/PartyAttackAuthority.js").read_text(encoding="utf-8")

    # Current H2.8 promotion map. Pending art must never preload as production.
    require("id: 'prismel_attack_jrpg_10a'" in authority_text, "Prismel 10A target missing")
    require("status: 'conditional-pz-pass-pending-runtime-extraction'" in authority_text, "Prismel pending status drifted")
    require("id: 'auryi_attack_jrpg_10a'" in authority_text, "Auryi 10A target missing")
    require("status: 'refresh-target-pending-source-art'" in authority_text, "Auryi pending status drifted")
    require("id: 'kineza_attack_master_a'" in authority_text, "Kineza Master A missing")
    require("status: 'production-current'" in authority_text, "Kineza must remain production-current")

    prismel = load_json("pv-data/sequence_authority/prismel_attack_jrpg_10a.registration.json")
    require(prismel.get("id") == "PRISMEL_ATTACK_JRPG_10A", "Prismel PZ id mismatch")
    require(prismel.get("source", {}).get("frameCount") == 10, "Prismel must remain 10 frames")
    validate_markers(prismel, 10)
    require(prismel.get("authorityRules", {}).get("oldSixFrameSetMayNotMasqueradeAsCurrent") is True,
            "Prismel old six-frame retirement rule missing")

    auryi = load_json("pv-data/sequence_authority/auryi_attack_jrpg_10a.refresh.json")
    require(auryi.get("id") == "AURYI_ATTACK_JRPG_10A", "Auryi refresh id mismatch")
    require(auryi.get("frameCount") == 10, "Auryi refresh must remain 10 frames")
    validate_markers(auryi, 10)
    require(auryi.get("referenceAuthority", {}).get("preserve") is True,
            "Auryi Master A reference preservation missing")

    old_auryi = load_json("pv-data/sequence_authority/auryi_attack_master_a.registration.json")
    require(old_auryi.get("status") == "canon-approved-tactical-reference",
            "old Auryi Master A still looks current")
    require(old_auryi.get("supersededForPartyBattleBy") == "AURYI_ATTACK_JRPG_10A",
            "old Auryi supersession missing")

    old_prismel = load_json("pv-data/animations/prismel_active_turn.registration.json")
    require(old_prismel.get("status") == "canon-preserved-tactical-reference",
            "old Prismel active-turn registration still looks current")
    require(old_prismel.get("supersededForPartyBattleAttackBy") == "PRISMEL_ATTACK_JRPG_10A",
            "old Prismel supersession missing")

    require((ROOT / "assets/sequences/production/kineza_attack_master_a.png").exists(),
            "Kineza production attack asset missing")
    require((ROOT / "assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png").exists(),
            "Prismel JRPG visual anchor missing")
    require((ROOT / "assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png").exists(),
            "Auryi JRPG visual anchor missing")

    print("PZ ATTACK AUTHORITY PASS")
    print("- Prismel: JRPG 10A conditional, old six-frame preserved reference")
    print("- Auryi: JRPG 10A refresh target, Master A preserved reference")
    print("- Kineza: Master A production-current")


if __name__ == "__main__":
    main()
