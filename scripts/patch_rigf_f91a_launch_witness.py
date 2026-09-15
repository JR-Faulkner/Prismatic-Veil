#!/usr/bin/env python3
from pathlib import Path

p = Path('mugen-lab/rig-f7.html')
s = p.read_text()

required = [
    'MOBMUGEN · RIG F · F9.1',
    'F9.0 ANCHOR · CNC GDI PERF',
    'F9.1 CNC-DDRAW GDI READY',
    'WINEDLLOVERRIDES=ddraw=n,b',
    '<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v=9">',
]
for marker in required:
    if marker not in s:
        raise SystemExit(f'F9.1a requires current F9.1 candidate marker: {marker}')

s = s.replace('<title>MobMugen · Rig F · F9.1</title>', '<title>MobMugen · Rig F · F9.1a</title>', 1)
s = s.replace('MOBMUGEN · RIG F · F9.1', 'MOBMUGEN · RIG F · F9.1a', 1)
s = s.replace('<h2>Rig F · F9.1</h2>', '<h2>Rig F · F9.1a</h2>', 1)
s = s.replace('F9.1 witness log', 'F9.1a witness log', 1)
s = s.replace(
    'F9.1 preserves the exact F9.0 WinMUGEN visual/runtime anchor and changes only the DirectDraw layer: PriZim-selected cnc-ddraw GDI is injected beside Winmugen.exe. Boot, Wine 1.7.55, lean FS, RAF/swap lock, viewport, and controls remain unchanged.',
    'F9.1a preserves the exact F9.1 cnc-ddraw GDI candidate and changes diagnostics only: the video witness now starts from actual Wine launch, while Wine-root fetch timing is logged explicitly. Game/runtime/render behavior is unchanged.',
    1,
)

# Trace XHR duration so a cold Home Screen fetch cannot masquerade as a video failure.
old_open = "this.__rigf53url=u;this.__rigf53method=String(method);log('F6.5 XHR OPEN · '+this.__rigf53method+' · '+this.__rigf53url+' · async='+(async!==false));return o.call(this,method,u,async,user,pass)"
new_open = "this.__rigf53url=u;this.__rigf53method=String(method);this.__rigf53t0=performance.now();if(/fullWine1\\.7\\.55-v8\\.zip/.test(u))log('F9.1A ROOT FETCH BEGIN · '+u+' · standalone='+(navigator.standalone===true));log('F6.5 XHR OPEN · '+this.__rigf53method+' · '+this.__rigf53url+' · async='+(async!==false));return o.call(this,method,u,async,user,pass)"
if old_open not in s:
    raise SystemExit('F9.1a XHR open anchor not found')
s = s.replace(old_open, new_open, 1)

old_done = "const done=()=>{try{log('F6.5 XHR DONE · '+(xhr.__rigf53method||'?')+' · '+u+' · status='+xhr.status+' · ready='+xhr.readyState)}catch(e){}};"
new_done = "const done=()=>{try{const ms=Math.round(performance.now()-(xhr.__rigf53t0||performance.now()));let bytes=0;try{const r=xhr.response;bytes=(r&&r.byteLength)||((r&&r.size)||0)}catch(_){}log('F6.5 XHR DONE · '+(xhr.__rigf53method||'?')+' · '+u+' · status='+xhr.status+' · ready='+xhr.readyState+' · ms='+ms+(bytes?' · bytes='+bytes:''));if(/fullWine1\\.7\\.55-v8\\.zip/.test(u))log('F9.1A ROOT FETCH READY · ms='+ms+(bytes?' · bytes='+bytes:''))}catch(e){}};"
if old_done not in s:
    raise SystemExit('F9.1a XHR done anchor not found')
s = s.replace(old_done, new_done, 1)

# Arm video detection only when BoxedWine actually reports Wine launching Winmugen.exe.
old_console = "console.log=(...a)=>{nlog(...a);const s=fmt(a);if(/wine|mugen|emulator|mount|drive|error|warn|root|param|rIGF|zip|launch|running/i.test(s)&&!/^creating:/i.test(s))log('BW OUT · '+s.slice(0,900))};"
new_console = "console.log=(...a)=>{nlog(...a);const s=fmt(a);if(/Launching \\\"\\/bin\\/wine\\\" \\\"Winmugen\\.exe\\\"/i.test(s)){window.RIGF_WINE_LAUNCH_SEEN=true;armLaunchWitness('BOXEDWINE LAUNCH')}if(/wine|mugen|emulator|mount|drive|error|warn|root|param|rIGF|zip|launch|running/i.test(s)&&!/^creating:/i.test(s))log('BW OUT · '+s.slice(0,900))};"
if old_console not in s:
    raise SystemExit('F9.1a console wrapper anchor not found')
s = s.replace(old_console, new_console, 1)

old_witness = "function canvasSig(){try{return canvas.toDataURL('image/png')}catch(e){return null}}function witness(){setTimeout(()=>{probe();const base=canvasSig();let n=0,t=setInterval(()=>{n++;if(n===8)probe();const cur=canvasSig();if(base&&cur&&cur!==base){clearInterval(t);status('WINMUGEN VIDEO ✓');log('F6.1 FIRST FRAME CHANGE')}else if(n>=28){clearInterval(t);status('BOXEDWINE ALIVE · NO VIDEO');log('F6.1 VIDEO TIMEOUT · COPY TRACE')}},750)},2500)}"
new_witness = "function canvasSig(){try{return canvas.toDataURL('image/png')}catch(e){return null}}let launchWitnessArmed=false;function armLaunchWitness(reason){if(launchWitnessArmed)return;launchWitnessArmed=true;log('F9.1A VIDEO WITNESS ARMED · '+reason);setTimeout(()=>{probe();const base=canvasSig();let n=0,t=setInterval(()=>{n++;if(n===8)probe();const cur=canvasSig();if(base&&cur&&cur!==base){clearInterval(t);status('WINMUGEN VIDEO ✓');log('F9.1A FIRST POST-LAUNCH FRAME CHANGE')}else if(n>=60){clearInterval(t);status('WINE LAUNCHED · NO MUGEN VIDEO');log('F9.1A POST-LAUNCH VIDEO TIMEOUT · COPY TRACE')}},750)},750)}function witness(){log('F9.1A PRE-LAUNCH WITNESS · waiting for actual Wine launch');setTimeout(()=>{if(!window.RIGF_WINE_LAUNCH_SEEN){status('BOXEDWINE STARTING · WAITING FOR WINE');log('F9.1A STARTUP WATCHDOG · no Wine launch yet · do not classify as video failure');probe()}},45000)}"
if old_witness not in s:
    raise SystemExit('F9.1a witness anchor not found')
s = s.replace(old_witness, new_witness, 1)

# Add an explicit app-mode marker before engine startup. This helps distinguish a
# first cold Home Screen launch from ordinary Safari without altering runtime.
old_mode = "log('F6 URLPARAMS · '+cfg.urlParams);log('F9.1 PERF MODE · CNC-DDRAW GDI · F9.0 VISUAL ANCHOR PRESERVED');installNetTrace();"
new_mode = "log('F6 URLPARAMS · '+cfg.urlParams);log('F9.1 PERF MODE · CNC-DDRAW GDI · F9.0 VISUAL ANCHOR PRESERVED');log('F9.1A APP MODE · standalone='+(navigator.standalone===true)+' · displayStandalone='+(matchMedia('(display-mode: standalone)').matches));log('F9.1A WITNESS POLICY · launch-anchored · startup timeout is not video failure');installNetTrace();"
if old_mode not in s:
    raise SystemExit('F9.1a app-mode anchor not found')
s = s.replace(old_mode, new_mode, 1)

s = s.replace("const text='MOBMUGEN · RIG F · F9.1\\", "const text='MOBMUGEN · RIG F · F9.1a\\", 1)

for marker in [
    'MOBMUGEN · RIG F · F9.1a',
    'F9.1 CNC-DDRAW GDI READY',
    'F9.1A ROOT FETCH BEGIN',
    'F9.1A ROOT FETCH READY',
    'F9.1A VIDEO WITNESS ARMED',
    'F9.1A PRE-LAUNCH WITNESS',
    'F9.1A APP MODE',
    'F9.1A WITNESS POLICY',
    'apple-touch-icon.png?v=9',
]:
    if marker not in s:
        raise SystemExit(f'missing F9.1a marker after patch: {marker}')

p.write_text(s)
print({'patched': str(p), 'bytes': p.stat().st_size, 'mode': 'F9.1 runtime unchanged + launch-anchored diagnostics'})
