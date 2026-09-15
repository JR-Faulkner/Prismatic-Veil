#!/usr/bin/env python3
from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text(encoding='utf-8')

required=[
    'MOBMUGEN · RIG F · F8.6',
    'MobMugen · Rig F · F8.6',
    'FALLBACK · VIEWPORT CLARITY',
    'boxedwine-f83-fallback',
    "env=%22WINEDLLOVERRIDES:mscoree=d;mshtml=d%22",
    'id="viewToggle"',
    '.stage.view-zoom #canvas{transform:scale(1.25)}',
    'RIGF F8.6: CFG READY',
]
missing=[x for x in required if x not in s]
if missing:
    raise SystemExit('F8.7 patch point missing: '+' | '.join(missing))

# Version labels. Keep F8.5/F8.6 filesystem, input, Wine 3.1 and non-JIT fallback architecture.
s=s.replace('F8.6','F8.7')
s=s.replace('FALLBACK · VIEWPORT CLARITY','FALLBACK · BOOT RECOVERY')
s=s.replace(
    'F8.7 keeps the proven non-JIT fallback runtime untouched and adds a phone-friendly viewport zoom toggle for easier visual confirmation during play.',
    'F8.7 keeps the proven non-JIT fallback, ZIP stream, CFG selector and controls, while restoring the simpler launch/presentation path from the known-good WinMUGEN-running branch.'
)

# Undo the F8.6 CSS zoom experiment. Return to the presentation used by the earlier working runner.
old_css='#canvas{display:block;width:100%;height:58vh;background:#000;outline:none;image-rendering:pixelated;image-rendering:crisp-edges;transform-origin:center center;transition:transform .12s ease}.stage.view-zoom #canvas{transform:scale(1.25)}'
new_css='#canvas{display:block;width:100%;height:58vh;background:#000;outline:none}'
if old_css not in s:
    raise SystemExit('F8.7 canvas CSS anchor changed')
s=s.replace(old_css,new_css,1)

# Remove the viewport toggle and its JS. This is deliberately a recovery build, not another scaling experiment.
s=s.replace('<button id="viewToggle" class="ctrlbtn" type="button">VIEW 100%</button>','',1)
old_js="const fpsBadge=document.getElementById('fpsBadge'),viewToggle=document.getElementById('viewToggle'),stage=document.querySelector('.stage');\nlet __f86Zoom=false;viewToggle.addEventListener('click',()=>{__f86Zoom=!__f86Zoom;stage.classList.toggle('view-zoom',__f86Zoom);viewToggle.textContent=__f86Zoom?'VIEW 125%':'VIEW 100%';log('F8.7 VIEW · '+(__f86Zoom?'ZOOM 125%':'FIT 100%'))});"
if old_js not in s:
    raise SystemExit('F8.7 viewport JS anchor changed')
s=s.replace(old_js,"const fpsBadge=document.getElementById('fpsBadge');",1)

# Restore the known-good F7.9.2-style launch params by dropping the ineffective Wine DLL override.
old_params="return ['root=TinyCore15Wine3.1','env=%22WINEDLLOVERRIDES:mscoree=d;mshtml=d%22','p=d%3A%5CWinMugen%5CWinmugen.exe','w='+work,'auto=true','sound=false','bpp=16','storage=memory'].join('&')"
new_params="return ['root=TinyCore15Wine3.1','p=d%3A%5CWinMugen%5CWinmugen.exe','w='+work,'auto=true','sound=false','bpp=16','storage=memory'].join('&')"
if old_params not in s:
    raise SystemExit('F8.7 buildParams anchor changed')
s=s.replace(old_params,new_params,1)

# Tighten the witness language. A canvas change proves video activity, not that the MUGEN title was reached.
old_witness="status('WINMUGEN VIDEO ✓');log('F8.7 FIRST FRAME CHANGE · FALLBACK VIDEO LIVE');log('F8.7 CPU MODE · BOXEDWINE NON-JIT FALLBACK');log('F8.7 MONO SUPPRESS · WINEDLLOVERRIDES=mscoree=d;mshtml=d');log('F8.7 PERF WITNESS · RAF badge measures browser scheduler; INPUT badge becomes SDL✓ when BoxedWine consumes a synthetic key event')"
new_witness="status('VIDEO ACTIVE · VERIFY MUGEN');log('F8.7 VIDEO CHANGE · FALLBACK CANVAS ACTIVE');log('F8.7 CPU MODE · BOXEDWINE NON-JIT FALLBACK');log('F8.7 BOOT RECOVERY · F7.9.2 launch params restored · env override removed');log('F8.7 PERF WITNESS · RAF badge measures browser scheduler; iPhone visual remains authority for WinMUGEN title')"
if old_witness not in s:
    raise SystemExit('F8.7 witness anchor changed')
s=s.replace(old_witness,new_witness,1)

p.write_text(s,encoding='utf-8')
print('Patched rig-f7.html to F8.7 boot recovery mode')
