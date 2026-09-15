#!/usr/bin/env python3
from pathlib import Path

p = Path('mugen-lab/rig-f7.html')
s = p.read_text()

if 'MOBMUGEN · RIG F · F9.0' not in s:
    raise SystemExit('F9.1 patch requires the frozen F9.0 visual anchor')

s = s.replace('<title>MobMugen · Rig F · F9.0</title>', '<title>MobMugen · Rig F · F9.1</title>', 1)
s = s.replace('MOBMUGEN · RIG F · F9.0', 'MOBMUGEN · RIG F · F9.1', 1)
s = s.replace('EXACT F6.5 VISUAL ANCHOR', 'F9.0 ANCHOR · CNC GDI PERF', 1)
s = s.replace('<h2>Rig F · F9.0</h2>', '<h2>Rig F · F9.1</h2>', 1)
s = s.replace(
    'F9.0 is the exact F6.5 visual runtime that previously rendered real WinMUGEN on iPhone: legacy pinned BoxedWine, local Wine 1.7.55 root, lean userapp FS, and RAF/swap lock. No modern JIT/Wine 3.1 changes are mixed into this recovery witness.',
    'F9.1 preserves the exact F9.0 WinMUGEN visual/runtime anchor and changes only the DirectDraw layer: PriZim-selected cnc-ddraw GDI is injected beside Winmugen.exe. Boot, Wine 1.7.55, lean FS, RAF/swap lock, viewport, and controls remain unchanged.',
    1,
)
s = s.replace('F9.0 witness log', 'F9.1 witness log', 1)

# Inject the pinned GDI wrapper into the already-proven in-memory D: filesystem.
needle = """  window.RIGF_APP_FS=mem;
  log('F6.3 LEAN FS READY · files='+done+' · resident='+(liveBytes/1048576).toFixed(1)+' MB');"""
insert = """  status('INJECTING CNC-DDRAW GDI');
  const cncBase='./assets/cnc-ddraw-gdi/';
  const cncFiles=['ddraw.dll','ddraw.ini'];
  const appBase='/'+(exeDir?exeDir.replace(/\\\\/g,'/')+'/':'');
  for(const name of cncFiles){
    const rr=await fetch(cncBase+name,{cache:'no-store'});
    if(!rr.ok)throw new Error('F9.1 cnc-ddraw asset HTTP '+rr.status+' '+name);
    const raw=new Uint8Array(await rr.arrayBuffer());
    const out=appBase+name;
    const slash=out.lastIndexOf('/');if(slash>0)mkdirp(out.slice(0,slash));
    nfs.writeFileSync(out,Buffer.from(raw));
    log('F9.1 CNC FILE · '+out+' · '+raw.byteLength+' bytes');
  }
  log('F9.1 CNC-DDRAW GDI READY · app='+appBase+' · override=ddraw=n,b');
  window.RIGF_APP_FS=mem;
  log('F6.3 LEAN FS READY · files='+done+' · resident='+(liveBytes/1048576).toFixed(1)+' MB');"""
if needle not in s:
    raise SystemExit('F9.1 app FS injection anchor not found')
s = s.replace(needle, insert, 1)

# Force Wine to use the native ddraw.dll placed beside Winmugen.exe.
needle2 = "src=src.replace('console.log(\"Emulator params:\" + params);','console.log(\"RIGF F6.3 ARGV · \" + params.join(\" | \")); console.log(\"Emulator params:\" + params);');"
insert2 = needle2 + "src=src.replace('params.push(\"/bin/wine\");','params.push(\"-env\"); params.push(\"WINEDLLOVERRIDES=ddraw=n,b\"); params.push(\"/bin/wine\");');"
if needle2 not in s:
    raise SystemExit('F9.1 Wine argv injection anchor not found')
s = s.replace(needle2, insert2, 1)

# Add an explicit witness without disturbing the old F6.5 lifecycle.
needle3 = "log('F6 URLPARAMS · '+cfg.urlParams);installNetTrace();"
insert3 = "log('F6 URLPARAMS · '+cfg.urlParams);log('F9.1 PERF MODE · CNC-DDRAW GDI · F9.0 VISUAL ANCHOR PRESERVED');installNetTrace();"
if needle3 not in s:
    raise SystemExit('F9.1 witness anchor not found')
s = s.replace(needle3, insert3, 1)

# Copy-trace identity should match the candidate.
s = s.replace("const text='MOBMUGEN · RIG F · F9.0\\", "const text='MOBMUGEN · RIG F · F9.1\\", 1)

required = [
    'MOBMUGEN · RIG F · F9.1',
    'F9.0 ANCHOR · CNC GDI PERF',
    'F9.1 CNC-DDRAW GDI READY',
    'WINEDLLOVERRIDES=ddraw=n,b',
    'F9.1 PERF MODE · CNC-DDRAW GDI',
]
for marker in required:
    if marker not in s:
        raise SystemExit(f'missing F9.1 marker after patch: {marker}')

p.write_text(s)
print({'patched': str(p), 'bytes': p.stat().st_size, 'mode': 'F9.0 anchor + cnc-ddraw GDI only'})
