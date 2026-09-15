#!/usr/bin/env python3
from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text(encoding='utf-8')

required=[
    'MOBMUGEN · RIG F · F8.5',
    'MobMugen · Rig F · F8.5',
    '<button id="ctrlToggle" class="ctrlbtn" type="button">HIDE CTRL</button>',
    'const controls=document.getElementById(\'controls\')',
    'FALLBACK · CFG SELECTOR FIX',
    'boxedwine-f83-fallback',
]
missing=[x for x in required if x not in s]
if missing:
    raise SystemExit('F8.6 patch point missing: '+' | '.join(missing))

# Version labels only. Runtime architecture remains the proven F8.5 non-JIT fallback.
s=s.replace('F8.5','F8.6')
s=s.replace('FALLBACK · CFG SELECTOR FIX','FALLBACK · VIEWPORT CLARITY')
s=s.replace(
    'F8.6 keeps the proven non-JIT fallback core, fixes the generated-shell syntax regression, and selects only the primary WinMUGEN data/mugen.cfg instead of nested resource copies.',
    'F8.6 keeps the proven non-JIT fallback runtime untouched and adds a phone-friendly viewport zoom toggle for easier visual confirmation during play.'
)

# Crisp nearest-neighbor scaling and an optional 125% visual zoom. Overflow remains clipped to the stage.
css_anchor='#canvas{display:block;width:100%;height:58vh;background:#000;outline:none}'
css_new='#canvas{display:block;width:100%;height:58vh;background:#000;outline:none;image-rendering:pixelated;image-rendering:crisp-edges;transform-origin:center center;transition:transform .12s ease}.stage.view-zoom #canvas{transform:scale(1.25)}'
if css_anchor not in s:
    raise SystemExit('F8.6 canvas CSS anchor changed')
s=s.replace(css_anchor,css_new,1)

# Add a dedicated view toggle without changing existing controller/debug behavior.
btn_anchor='<button id="ctrlToggle" class="ctrlbtn" type="button">HIDE CTRL</button>'
btn_new='<button id="viewToggle" class="ctrlbtn" type="button">VIEW 100%</button>'+btn_anchor
s=s.replace(btn_anchor,btn_new,1)

# Wire the toggle. This is presentation-only and never touches key dispatch or BoxedWine.
ref_anchor="const fpsBadge=document.getElementById('fpsBadge');"
ref_new="const fpsBadge=document.getElementById('fpsBadge'),viewToggle=document.getElementById('viewToggle'),stage=document.querySelector('.stage');\nlet __f86Zoom=false;viewToggle.addEventListener('click',()=>{__f86Zoom=!__f86Zoom;stage.classList.toggle('view-zoom',__f86Zoom);viewToggle.textContent=__f86Zoom?'VIEW 125%':'VIEW 100%';log('F8.6 VIEW · '+(__f86Zoom?'ZOOM 125%':'FIT 100%'))});"
if ref_anchor not in s:
    raise SystemExit('F8.6 fpsBadge anchor changed')
s=s.replace(ref_anchor,ref_new,1)

p.write_text(s,encoding='utf-8')
print('Patched rig-f7.html to F8.6 viewport clarity mode')
