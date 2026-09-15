#!/usr/bin/env python3
from pathlib import Path

p = Path('mugen-lab/rig-f7.html')
s = p.read_text(encoding='utf-8')

required = [
    'MobMugen · Rig F · F8.3',
    'MOBMUGEN · RIG F · F8.3',
    "const F7_CORE='./boxedwine-f83-fallback/'",
    "const prefix=exeDir?exeDir.replace(/\\\\/g,'/')+'/':'';",
    "const dp='/d_drive/'+ent.name.replace(/^\\\\/+/,''),slash=dp.lastIndexOf('/');",
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('F8.4 patch point missing: ' + ' | '.join(missing))

# Version / witness labels.
s = s.replace('MobMugen · Rig F · F8.3', 'MobMugen · Rig F · F8.4')
s = s.replace('MOBMUGEN · RIG F · F8.3', 'MOBMUGEN · RIG F · F8.4')
s = s.replace('Rig F · F8.3', 'Rig F · F8.4')
s = s.replace('F8.3 witness log', 'F8.4 witness log')
s = s.replace('HYBRID FALLBACK · NON-JIT CORE', 'FALLBACK · CFG PATH NORMALIZER')
s = s.replace(
    'F8.3 keeps the proven Wine 3.1, ZIP streamer, video, and controls, but swaps only the CPU core to BoxedWine non-JIT fallback for a clean stability A/B.',
    'F8.4 keeps the proven non-JIT fallback core and normalizes WinMUGEN boot-resource paths so data/mugen.cfg is mounted beside the executable even when the ZIP stores boot folders at archive root.'
)
for old, new in [
    ('F8.3 INPUT · ', 'F8.4 INPUT · '),
    ('RIGF F8.3:', 'RIGF F8.4:'),
    ('F8.3 ROOT · ', 'F8.4 ROOT · '),
    ('F8.3 FIRST FRAME CHANGE · FALLBACK VIDEO LIVE', 'F8.4 FIRST FRAME CHANGE · FALLBACK VIDEO LIVE'),
    ('F8.3 CPU MODE · BOXEDWINE NON-JIT FALLBACK', 'F8.4 CPU MODE · BOXEDWINE NON-JIT FALLBACK'),
    ('F8.3 MONO SUPPRESS · ', 'F8.4 MONO SUPPRESS · '),
    ('F8.3 PERF WITNESS · ', 'F8.4 PERF WITNESS · '),
    ("const text='MOBMUGEN · RIG F · F8.3\\nRUNTIME STATUS · '", "const text='MOBMUGEN · RIG F · F8.4\\nRUNTIME STATUS · '")
]:
    s = s.replace(old, new)

# Replace the lean-plan selector with a case-insensitive layout-aware selector.
old_keep = """  const prefix=exeDir?exeDir.replace(/\\\\/g,'/')+'/':'';
  const keep=ent=>{
    if(ent.dir||!ent.name)return false;
    if(prefix&&!ent.name.startsWith(prefix))return false;
    const rel=(prefix?ent.name.slice(prefix.length):ent.name).toLowerCase();
    if(rel==='winmugen.exe')return true;
    if(!rel.includes('/'))return /\\.(dll|cfg|ini|def|txt|bat|cmd|dat)$/i.test(rel);
    return rel.startsWith('data/')||rel.startsWith('font/')||rel.startsWith('sound/')||rel.startsWith('plugins/');
  };
  const chosen=entries.filter(keep);
"""
new_keep = """  const prefix=exeDir?exeDir.replace(/\\\\/g,'/')+'/':'';
  const prefixLow=prefix.toLowerCase();
  const bootRoots=['data/','font/','sound/','plugins/'];
  const keep=ent=>{
    if(ent.dir||!ent.name)return false;
    const norm=ent.name.replace(/\\\\/g,'/').replace(/^\\/+/,''),low=norm.toLowerCase();
    let rel='';
    if(prefixLow&&low.startsWith(prefixLow))rel=low.slice(prefixLow.length);
    else if(bootRoots.some(r=>low.startsWith(r)))rel=low;
    else if(!prefixLow)rel=low;
    else return false;
    if(rel==='winmugen.exe')return true;
    if(!rel.includes('/'))return /\\.(dll|cfg|ini|def|txt|bat|cmd|dat)$/i.test(rel);
    return bootRoots.some(r=>rel.startsWith(r));
  };
  const chosen=entries.filter(keep);
  const cfgHits=chosen.filter(x=>x.name.replace(/\\\\/g,'/').toLowerCase().endsWith('/data/mugen.cfg')||x.name.replace(/\\\\/g,'/').toLowerCase()==='data/mugen.cfg');
  log('F8.4 CFG SOURCE · count='+cfgHits.length+(cfgHits.length?' · '+cfgHits[0].name:' · MISSING'));
  if(!cfgHits.length)throw new Error('F8.4 preflight: data/mugen.cfg not found in executable tree or ZIP root');
  window.RIGF_EXE_DIR=exeDir;
"""
if old_keep not in s:
    raise SystemExit('F8.4 keep-selector block changed')
s = s.replace(old_keep, new_keep, 1)

# Normalize root-level boot folders into the executable directory and create an
# exact lowercase data/mugen.cfg alias before Wine starts.
old_dp = """            const dp='/d_drive/'+ent.name.replace(/^\\\\/+/,''),slash=dp.lastIndexOf('/');
            if(slash>0)mkdirpE(dp.slice(0,slash));
            FS.writeFile(dp,raw);files++;bytes+=raw.byteLength;
            raw=null;
"""
new_dp = """            let relName=ent.name.replace(/\\\\/g,'/').replace(/^\\/+/,''),exeRoot=(window.RIGF_EXE_DIR||'').replace(/\\\\/g,'/').replace(/^\\/+|\\/+$/g,'');
            if(exeRoot&&!relName.toLowerCase().startsWith((exeRoot+'/').toLowerCase())&&/^(data|font|sound|plugins)\\//i.test(relName))relName=exeRoot+'/'+relName;
            const dp='/d_drive/'+relName,slash=dp.lastIndexOf('/');
            if(slash>0)mkdirpE(dp.slice(0,slash));
            FS.writeFile(dp,raw);
            if(exeRoot&&/(^|\\/)data\\/mugen\\.cfg$/i.test(relName)){
              const cfgDp='/d_drive/'+exeRoot+'/data/mugen.cfg',cfgSlash=cfgDp.lastIndexOf('/');
              if(cfgSlash>0)mkdirpE(cfgDp.slice(0,cfgSlash));
              if(cfgDp!==dp)FS.writeFile(cfgDp,raw);
              console.log('RIGF F8.4: CFG READY path='+cfgDp+' bytes='+raw.byteLength+' source='+ent.name);
            }
            files++;bytes+=raw.byteLength;
            raw=null;
"""
if old_dp not in s:
    raise SystemExit('F8.4 stream destination block changed')
s = s.replace(old_dp, new_dp, 1)

p.write_text(s, encoding='utf-8')
print('Patched rig-f7.html to F8.4 cfg-path normalizer')
