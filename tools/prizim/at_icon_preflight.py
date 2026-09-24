#!/usr/bin/env python3
"""PriZim A+T icon-family preflight for Behemoth2 claim UI."""
from __future__ import annotations
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "build" / "prizim"
ICON_ROOT = ROOT / "assets" / "ui" / "behemoth2" / "icons" / "v42134"
REQUIRED = [
    "pcu_b2.png",
    "starter_tool_kit.png",
    "virog_4.png",
    "survey_beacon.png",
    "field_pack.png",
    "base_property.png",
    "claim.png",
]

rows=[]
failures=[]

for name in REQUIRED:
    p=ICON_ROOT/name
    try:
        if not p.exists():
            raise ValueError("missing")
        with Image.open(p) as src:
            src.verify()
        with Image.open(p).convert("RGBA") as im:
            w,h=im.size
            a=list(im.getchannel("A").getdata())
            total=len(a)
            clear=sum(v==0 for v in a)
            visible=sum(v>0 for v in a)
            solid=sum(v>=250 for v in a)
            partial=sum(0<v<250 for v in a)
            border=[]
            alpha=im.getchannel("A")
            border.extend(alpha.crop((0,0,w,1)).getdata())
            border.extend(alpha.crop((0,h-1,w,h)).getdata())
            border.extend(alpha.crop((0,0,1,h)).getdata())
            border.extend(alpha.crop((w-1,0,w,h)).getdata())
            if visible == 0:
                raise ValueError("no visible subject pixels")
            if clear == 0:
                raise ValueError("no transparent background")
            if max(border, default=0) != 0:
                raise ValueError("outer safety border is not fully transparent")
            if solid / visible < 0.70:
                raise ValueError(f"subject opacity too soft ({solid/visible:.1%} solid)")
            rows.append({
                "asset":name,"status":"PASS","dimensions":[w,h],
                "transparent_pixels":clear,"visible_pixels":visible,
                "solid_visible_ratio":round(solid/visible,4),
                "partial_alpha_pixels":partial,
            })
    except Exception as exc:
        failures.append(f"{name}: {exc}")
        rows.append({"asset":name,"status":"FAIL","detail":str(exc)})

js=(ROOT/"assets/js/at-game-v42134.js").read_text(encoding="utf-8")
css=(ROOT/"assets/at-game-v42134.css").read_text(encoding="utf-8")
html=(ROOT/"at-game-v42134.html").read_text(encoding="utf-8")
home=(ROOT/"assets/js/at-home-shell-v42134.js").read_text(encoding="utf-8")
live=json.loads((ROOT/"at-live-map.json").read_text(encoding="utf-8"))

contracts={
    "runtime_icon_root": "assets/ui/behemoth2/icons/v42134/" in js,
    "item_glyph_renderer": "itemGlyph(id)" in js,
    "category_glyph_renderer": "categoryGlyph(cat)" in js,
    "claim_glyph_renderer": "claimGlyph()" in js,
    "selected_claim_glyph": "selectedClaimGlyph" in js and "selectedClaimGlyph" in css,
    "html_v42134_js": "assets/js/at-game-v42134.js" in html,
    "html_v42134_css": "assets/at-game-v42134.css" in html,
    "home_targets_v42134": "at-game-v42134.html" in home,
    "live_map_v42134": live.get("build")=="v4.21.34" and live.get("runtime")=="assets/js/at-home-shell-v42134.js",
}
for key,ok in contracts.items():
    if not ok:
        failures.append("contract: "+key)

result="FAIL" if failures else "PASS"
payload={
    "tool":"PriZim A+T Icon Preflight",
    "result":result,
    "build":"v4.21.34",
    "icon_root":"assets/ui/behemoth2/icons/v42134/",
    "assets":rows,
    "contracts":contracts,
    "failures":failures,
}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/"at-icon-preflight.json").write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
lines=["# PriZim A+T Icon Preflight","",f"**Result: {result}**","","Build: `v4.21.34`","","| Asset | Status | Dimensions |","|---|---|---|"]
for row in rows:
    dims=row.get("dimensions",[])
    lines.append(f"| `{row['asset']}` | **{row['status']}** | {'×'.join(map(str,dims)) if dims else row.get('detail','')} |")
lines += ["","## Runtime contracts"]
for key,ok in contracts.items():
    lines.append(f"- {'PASS' if ok else 'FAIL'} · {key}")
if failures:
    lines += ["","## Failures",*[f"- {x}" for x in failures]]
(OUT/"at-icon-preflight.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
print(f"PriZim A+T Icon Preflight: {result}")
for row in rows:
    print(f"[{row['status']}] {row['asset']}: {row.get('dimensions',row.get('detail',''))}")
for key,ok in contracts.items():
    print(f"[{'PASS' if ok else 'FAIL'}] contract {key}")
return_code=1 if failures else 0
sys.exit(return_code)

# PriZim lane trigger: A+T claim icons
