#!/usr/bin/env python3
from pathlib import Path
import subprocess

ANCHOR='5b9d8638118b1cb10aafcbdf95cd504fa78e7e19'
p=Path('mugen-lab/rig-f7.html')

# Start from the exact F7.9.2 runner that visibly rendered WinMUGEN on iPhone.
s=subprocess.check_output(['git','show',f'{ANCHOR}:mugen-lab/rig-f7.html'],text=True)

required=[
    'MOBMUGEN · RIG F · F7.9.2',
    'MobMugen · Rig F · F7.9.2',
    'WASM JIT · LOCAL WINE 3.1',
    "const F7_CORE='./boxedwine-f7/'",
    "const prefix=exeDir?exeDir.replace(/\\\\/g,'/')+'/':'';",
    "const dp='/d_drive/'+ent.name.replace(/^\\\\/+/,''),slash=dp.lastIndexOf('/');",
    "status('WINMUGEN VIDEO ✓')",
]
missing=[x for x in required if x not in s]
if missing:
    raise SystemExit('F8.9 exact-anchor point missing: '+' | '.join(missing))

# Version only. Keep the anchor's actual launch/render behavior intact.
s=s.replace('F7.9.2','F8.9')
s=s.replace('WASM JIT · LOCAL WINE 3.1','EXACT ANCHOR · JIT + CFG FIX')
s=s.replace(
    'F7.1 keeps the modern BoxedWine WASM JIT core but replaces the blocking second-copy D: ingest with a staged low-memory transfer that yields to Safari and frees source files as they move.',
    'F8.9 starts from the exact F7.9.2 iPhone-visible WinMUGEN runner, then adds only the proven primary data/mugen.cfg normalization and input trace logging. No fallback core, no viewport experiment, no Wine override experiment.'
)

# Keep the witness honest without changing render behavior.
s=s.replace("status('WINMUGEN VIDEO ✓')","status('VIDEO ACTIVE · VERIFY MUGEN')")
s=s.replace("log('F6.1 FIRST FRAME CHANGE')","log('F8.9 VIDEO CHANGE · EXACT F7.9.2 ANCHOR CANVAS ACTIVE')",1)

# Add input trace logging without changing dispatch targets or key semantics.
old_emit="""function emitKey(code,key,down){const m=keyMeta[code]||[0,key||''];const type=down?'keydown':'keyup',opts={key:key||m[1],code,keyCode:m[0],which:m[0],bubbles:true,cancelable:true};canvas.focus();for(const target of [canvas,document,window]){try{const ev=new KeyboardEvent(type,opts);try{Object.defineProperty(ev,'keyCode',{get:()=>m[0]});Object.defineProperty(ev,'which',{get:()=>m[0]})}catch(_){}target.dispatchEvent(ev)}catch(_){}}}"""
new_emit="""function emitKey(code,key,down){const m=keyMeta[code]||[0,key||''];const type=down?'keydown':'keyup',opts={key:key||m[1],code,keyCode:m[0],which:m[0],bubbles:true,cancelable:true};canvas.focus();for(const target of [canvas,document,window]){try{const ev=new KeyboardEvent(type,opts);try{Object.defineProperty(ev,'keyCode',{get:()=>m[0]});Object.defineProperty(ev,'which',{get:()=>m[0]})}catch(_){}target.dispatchEvent(ev)}catch(_){}}if(down)log('F8.9 INPUT · '+code+' · targets=3 · SENT')}"""
if old_emit not in s:
    raise SystemExit('F8.9 input anchor changed')
s=s.replace(old_emit,new_emit,1)

# Replace only the boot-file selector. Prefer the exact executable-adjacent
# WinMugen/data/mugen.cfg. Accept archive-root data/mugen.cfg only as fallback.
old_keep="""  const prefix=exeDir?exeDir.replace(/\\\\/g,'/')+'/':'';
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
new_keep="""  const prefix=exeDir?exeDir.replace(/\\\\/g,'/')+'/':'';
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
  let chosen=entries.filter(keep);
  const normName=e=>e.name.replace(/\\\\/g,'/').replace(/^\\/+/,''),lowName=e=>normName(e).toLowerCase();
  const primaryLow=(prefixLow+'data/mugen.cfg'),primary=chosen.find(e=>lowName(e)===primaryLow);
  const rootFallback=chosen.find(e=>lowName(e)==='data/mugen.cfg');
  const cfgSource=primary||rootFallback;
  log('F8.9 CFG SOURCE · count='+(cfgSource?1:0)+(cfgSource?' · '+(primary?'PRIMARY=':'ROOT_FALLBACK=')+cfgSource.name:' · MISSING'));
  if(!cfgSource)throw new Error('F8.9 preflight: primary/root data/mugen.cfg not found');
  chosen=chosen.filter(e=>{const l=lowName(e),isCfg=(l===primaryLow||l==='data/mugen.cfg');return !isCfg||e===cfgSource});
  window.RIGF_EXE_DIR=exeDir;window.RIGF_CFG_SOURCE=cfgSource.name;
"""
if old_keep not in s:
    raise SystemExit('F8.9 lean selector anchor changed')
s=s.replace(old_keep,new_keep,1)

# Preserve the anchor streamer, changing only destination normalization for
# root-level boot folders and the exact lowercase cfg alias.
old_dp="""            const dp='/d_drive/'+ent.name.replace(/^\\\\/+/,''),slash=dp.lastIndexOf('/');
            if(slash>0)mkdirpE(dp.slice(0,slash));
            FS.writeFile(dp,raw);files++;bytes+=raw.byteLength;
            raw=null;
"""
new_dp="""            let relName=ent.name.replace(/\\\\/g,'/').replace(/^\\/+/,''),exeRoot=(window.RIGF_EXE_DIR||'').replace(/\\\\/g,'/').replace(/^\\/+|\\/+$/g,'');
            if(exeRoot&&!relName.toLowerCase().startsWith((exeRoot+'/').toLowerCase())&&/^(data|font|sound|plugins)\\//i.test(relName))relName=exeRoot+'/'+relName;
            const dp='/d_drive/'+relName,slash=dp.lastIndexOf('/');
            if(slash>0)mkdirpE(dp.slice(0,slash));
            FS.writeFile(dp,raw);
            if(ent.name===window.RIGF_CFG_SOURCE&&exeRoot){
              const cfgDp='/d_drive/'+exeRoot+'/data/mugen.cfg',cfgSlash=cfgDp.lastIndexOf('/');
              if(cfgSlash>0)mkdirpE(cfgDp.slice(0,cfgSlash));
              if(cfgDp!==dp)FS.writeFile(cfgDp,raw);
              console.log('RIGF F8.9: CFG READY path='+cfgDp+' bytes='+raw.byteLength+' source='+ent.name);
            }
            files++;bytes+=raw.byteLength;
            raw=null;
"""
if old_dp not in s:
    raise SystemExit('F8.9 stream destination anchor changed')
s=s.replace(old_dp,new_dp,1)

# Add one immutable anchor marker to the trace.
needle="log('F7.2 XHR TRACE ARMED')}"
if needle not in s:
    raise SystemExit('F8.9 trace marker anchor changed')
s=s.replace(needle,"log('F7.2 XHR TRACE ARMED');log('F8.9 EXACT ANCHOR · source=5b9d863 · F7.9.2 visible-WinMUGEN runner')}" ,1)

p.write_text(s,encoding='utf-8')
print('F8.9 exact-anchor runner generated from',ANCHOR)
