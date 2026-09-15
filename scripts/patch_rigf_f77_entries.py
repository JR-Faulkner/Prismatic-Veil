from pathlib import Path
p=Path('mugen-lab/rig-f7.html')
s=p.read_text()
s=s.replace('MobMugen · Rig F · F7.6','MobMugen · Rig F · F7.7')
s=s.replace('MOBMUGEN · RIG F · F7.6','MOBMUGEN · RIG F · F7.7')
s=s.replace('Rig F · F7.6','Rig F · F7.7')
s=s.replace('F7.6 witness log','F7.7 witness log')
s=s.replace('WASM JIT · JS REPAIRED','WASM JIT · ZIP INDEX FIX')
old="""async function buildLeanAppFS(file){
  status('PLANNING LEAN APP STREAM');
  const keep=ent=>{
    const n=ent.name.replace(/^\\/+/,''),l=n.toLowerCase();
    if(ent.dir)return false;
    const rel=l.includes('/')?l.slice(l.indexOf('/')+1):l;
    if(rel==='winmugen.exe')return true;
    if(!rel.includes('/'))return /\\.(dll|cfg|ini|def|txt|bat|cmd|dat)$/i.test(rel);
    return rel.startsWith('data/')||rel.startsWith('font/')||rel.startsWith('sound/')||rel.startsWith('plugins/');
  };
  const chosen=entries.filter(keep);
"""
new="""async function buildLeanAppFS(file){
  status('PLANNING LEAN APP STREAM');
  prep.textContent='Reading full ZIP central directory metadata…';
  const tailStart=Math.max(0,file.size-65557),tailBuf=await file.slice(tailStart).arrayBuffer(),tv=new DataView(tailBuf);
  let e=-1;for(let i=tv.byteLength-22;i>=0;i--){if(u32(tv,i)===0x06054b50){e=i;break}}
  if(e<0)throw new Error('ZIP end record not found for stream plan.');
  const cdSize=u32(tv,e+12),cdOffset=u32(tv,e+16),cdBuf=await file.slice(cdOffset,cdOffset+cdSize).arrayBuffer(),cv=new DataView(cdBuf),dec=new TextDecoder('utf-8');
  let p=0,entries=[];
  while(p+46<=cv.byteLength&&u32(cv,p)===0x02014b50){
    const method=u16(cv,p+10),comp=u32(cv,p+20),uncomp=u32(cv,p+24),fn=u16(cv,p+28),ex=u16(cv,p+30),cm=u16(cv,p+32),local=u32(cv,p+42);
    const name=dec.decode(new Uint8Array(cdBuf,p+46,fn));
    entries.push({name,method,comp,uncomp,local,dir:name.endsWith('/')});
    p+=46+fn+ex+cm;
  }
  log('F7.7 CENTRAL DIR READY · entries='+entries.length);
  const prefix=exeDir?exeDir.replace(/\\\\/g,'/')+'/':'';
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
if old not in s: raise SystemExit('F7.7 buildLeanAppFS patch point not found')
s=s.replace(old,new)
s=s.replace('F7.2 STREAM PLAN','F7.7 STREAM PLAN').replace("const text='MOBMUGEN · RIG F · F7.6\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.7\\nRUNTIME STATUS")
p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
if '## Rig F F7.7 - ZIP central directory fix' not in t:
    t += '\n\n## Rig F F7.7 - ZIP central directory fix\n- F7.6 phone witness reached boot and stopped at buildLeanAppFS line 62.\n- Root cause: F7.2 metadata-only planner referenced `entries` even though `entries` existed only as a local count in `inspectZip`, not as the central-directory entry array.\n- F7.7 rebuilds the complete central-directory metadata array inside `buildLeanAppFS`, matching the proven F6 parser, then filters it without extracting payload bytes.\n- Adds central-directory entry-count witness before lean selection.\n- JS syntax validation is mandatory before commit.\n'
    d.write_text(t)
