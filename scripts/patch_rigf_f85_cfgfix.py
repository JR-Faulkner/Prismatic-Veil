#!/usr/bin/env python3
from pathlib import Path

p = Path('mugen-lab/rig-f7.html')
s = p.read_text(encoding='utf-8')

required = [
    'MobMugen · Rig F · F8.4',
    'MOBMUGEN · RIG F · F8.4',
    'F8.4 CFG SOURCE',
    'RIGF F8.4: CFG READY',
    "const F7_CORE='./boxedwine-f83-fallback/'",
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('F8.5 patch point missing: ' + ' | '.join(missing))

# Version / labels only. Keep the proven F8.3 non-JIT core unchanged.
for old, new in [
    ('MobMugen · Rig F · F8.4', 'MobMugen · Rig F · F8.5'),
    ('MOBMUGEN · RIG F · F8.4', 'MOBMUGEN · RIG F · F8.5'),
    ('Rig F · F8.4', 'Rig F · F8.5'),
    ('F8.4 witness log', 'F8.5 witness log'),
    ('FALLBACK · CFG PATH NORMALIZER', 'FALLBACK · CFG SELECTOR FIX'),
    ('F8.4 INPUT · ', 'F8.5 INPUT · '),
    ('RIGF F8.4:', 'RIGF F8.5:'),
    ('F8.4 ROOT · ', 'F8.5 ROOT · '),
    ('F8.4 FIRST FRAME CHANGE · FALLBACK VIDEO LIVE', 'F8.5 FIRST FRAME CHANGE · FALLBACK VIDEO LIVE'),
    ('F8.4 CPU MODE · BOXEDWINE NON-JIT FALLBACK', 'F8.5 CPU MODE · BOXEDWINE NON-JIT FALLBACK'),
    ('F8.4 MONO SUPPRESS · ', 'F8.5 MONO SUPPRESS · '),
    ('F8.4 PERF WITNESS · ', 'F8.5 PERF WITNESS · '),
    ('F8.4 CFG SOURCE', 'F8.5 CFG SOURCE'),
    ('F8.4 preflight:', 'F8.5 preflight:'),
]:
    s = s.replace(old, new)

s = s.replace(
    'F8.4 keeps the proven non-JIT fallback core and normalizes WinMUGEN boot-resource paths so data/mugen.cfg is mounted beside the executable even when the ZIP stores boot folders at archive root.',
    'F8.5 keeps the proven non-JIT fallback core, fixes the generated-shell syntax regression, and selects only the primary WinMUGEN data/mugen.cfg instead of nested resource copies.'
)

old_cfg = """  const cfgHits=chosen.filter(x=>x.name.replace(/\\\\/g,'/').toLowerCase().endsWith('/data/mugen.cfg')||x.name.replace(/\\\\/g,'/').toLowerCase()==='data/mugen.cfg');
  log('F8.5 CFG SOURCE · count='+cfgHits.length+(cfgHits.length?' · '+cfgHits[0].name:' · MISSING'));
  if(!cfgHits.length)throw new Error('F8.5 preflight: data/mugen.cfg not found in executable tree or ZIP root');
  window.RIGF_EXE_DIR=exeDir;
"""
new_cfg = """  const cfgCandidates=chosen.filter(x=>{const n=x.name.replace(/\\\\/g,'/').replace(/^\\/+/,''),l=n.toLowerCase();return l==='data/mugen.cfg'||(prefixLow&&l===prefixLow+'data/mugen.cfg');});
  const cfgPrimary=cfgCandidates.find(x=>{const l=x.name.replace(/\\\\/g,'/').replace(/^\\/+/, '').toLowerCase();return prefixLow&&l===prefixLow+'data/mugen.cfg';})||cfgCandidates.find(x=>x.name.replace(/\\\\/g,'/').replace(/^\\/+/, '').toLowerCase()==='data/mugen.cfg')||null;
  log('F8.5 CFG SOURCE · count='+cfgCandidates.length+(cfgPrimary?' · PRIMARY='+cfgPrimary.name:' · MISSING'));
  if(!cfgPrimary)throw new Error('F8.5 preflight: primary data/mugen.cfg not found at '+(prefix||'ZIP root'));
  window.RIGF_EXE_DIR=exeDir;
  window.RIGF_PRIMARY_CFG=cfgPrimary.name;
"""
if old_cfg not in s:
    raise SystemExit('F8.5 cfg selector block changed')
s = s.replace(old_cfg, new_cfg, 1)

# F8.4 failed because path regex escapes were consumed inside patchShell's template literal.
# Keep this generated-shell block entirely free of regexes and backslash literals.
old_inject = """            let relName=ent.name.replace(/\\\\/g,'/').replace(/^\\/+/,''),exeRoot=(window.RIGF_EXE_DIR||'').replace(/\\\\/g,'/').replace(/^\\/+|\\/+$/g,'');
            if(exeRoot&&!relName.toLowerCase().startsWith((exeRoot+'/').toLowerCase())&&/^(data|font|sound|plugins)\\//i.test(relName))relName=exeRoot+'/'+relName;
            const dp='/d_drive/'+relName,slash=dp.lastIndexOf('/');
            if(slash>0)mkdirpE(dp.slice(0,slash));
            FS.writeFile(dp,raw);
            if(exeRoot&&/(^|\\/)data\\/mugen\\.cfg$/i.test(relName)){
              const cfgDp='/d_drive/'+exeRoot+'/data/mugen.cfg',cfgSlash=cfgDp.lastIndexOf('/');
              if(cfgSlash>0)mkdirpE(cfgDp.slice(0,cfgSlash));
              if(cfgDp!==dp)FS.writeFile(cfgDp,raw);
              console.log('RIGF F8.5: CFG READY path='+cfgDp+' bytes='+raw.byteLength+' source='+ent.name);
            }
"""
new_inject = """            const bs=String.fromCharCode(92);
            let relName=String(ent.name||'').split(bs).join('/');
            while(relName.charAt(0)==='/')relName=relName.slice(1);
            let exeRoot=String(window.RIGF_EXE_DIR||'').split(bs).join('/');
            while(exeRoot.charAt(0)==='/')exeRoot=exeRoot.slice(1);
            while(exeRoot.charAt(exeRoot.length-1)==='/')exeRoot=exeRoot.slice(0,-1);
            const relLow=relName.toLowerCase(),exeLow=exeRoot.toLowerCase();
            const isRootBoot=relLow.indexOf('data/')===0||relLow.indexOf('font/')===0||relLow.indexOf('sound/')===0||relLow.indexOf('plugins/')===0;
            if(exeRoot&&relLow.indexOf(exeLow+'/')!==0&&isRootBoot)relName=exeRoot+'/'+relName;
            const dp='/d_drive/'+relName,slash=dp.lastIndexOf('/');
            if(slash>0)mkdirpE(dp.slice(0,slash));
            FS.writeFile(dp,raw);
            const primaryCfg=String(window.RIGF_PRIMARY_CFG||'').split(bs).join('/').toLowerCase();
            const sourceNorm=String(ent.name||'').split(bs).join('/').toLowerCase();
            if(exeRoot&&primaryCfg&&sourceNorm===primaryCfg){
              const cfgDp='/d_drive/'+exeRoot+'/data/mugen.cfg',cfgSlash=cfgDp.lastIndexOf('/');
              if(cfgSlash>0)mkdirpE(cfgDp.slice(0,cfgSlash));
              if(cfgDp!==dp)FS.writeFile(cfgDp,raw);
              console.log('RIGF F8.5: CFG READY path='+cfgDp+' bytes='+raw.byteLength+' source='+ent.name);
            }
"""
if old_inject not in s:
    raise SystemExit('F8.5 generated-shell normalizer block changed')
s = s.replace(old_inject, new_inject, 1)

p.write_text(s, encoding='utf-8')
print('Patched rig-f7.html to F8.5 cfg selector + generated-shell syntax fix')
