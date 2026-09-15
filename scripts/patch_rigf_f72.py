from pathlib import Path
import re

p = Path('mugen-lab/rig-f7.html')
s = p.read_text()

s = s.replace('MobMugen · Rig F · F7.1', 'MobMugen · Rig F · F7.2')
s = s.replace('MOBMUGEN · RIG F · F7.1', 'MOBMUGEN · RIG F · F7.2')
s = s.replace('Rig F · F7.1', 'Rig F · F7.2')
s = s.replace('F7.1 witness log', 'F7.2 witness log')
s = s.replace('STAGED INGEST · WASM JIT', 'DIRECT STREAM · WASM JIT')
s = s.replace('F7.1 keeps the modern BoxedWine WASM JIT core but stages the lean app transfer in small batches and releases BrowserFS source files as they move into the Emscripten D: drive.', 'F7.2 removes the 223 MB intermediate BrowserFS copy entirely and streams selected WinMUGEN files directly from the source ZIP into the modern BoxedWine D: drive.')

# Replace buildLeanAppFS with metadata-only planner. No resident BrowserFS payload.
pat = r"async function buildLeanAppFS\(file\)\{.*?\n\}\nfunction buildParams"
rep = r'''async function buildLeanAppFS(file){
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
  const packed=chosen.reduce((a,x)=>a+x.comp,0),plain=chosen.reduce((a,x)=>a+x.uncomp,0);
  if(!chosen.some(x=>x.name.toLowerCase()==='winmugen.exe'||x.name.toLowerCase().endsWith('/winmugen.exe')))throw new Error('Lean plan lost Winmugen.exe');
  window.RIGF_STREAM_FILE=file;
  window.RIGF_STREAM_PLAN=chosen;
  log('F7.2 STREAM PLAN · files='+chosen.length+' · compressed='+(packed/1048576).toFixed(1)+' MB · expanded='+(plain/1048576).toFixed(1)+' MB · resident=metadata only');
  prep.textContent='Lean stream plan ready · '+chosen.length+' files · no 223 MB BrowserFS copy';
  return chosen;
}
function buildParams'''
s, n = re.subn(pat, rep, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('F7.2 planner replacement failed')

# Replace F7.1 staged BrowserFS callback with direct ZIP -> Emscripten FS streaming.
start = s.find("  const needle='function initBrowserFilesystem(callback) {';")
end = s.find("  src=src.replace('console.log(\"Emulator params:\" + params);'", start)
if start < 0 or end < 0:
    raise SystemExit('F7.2 shell patch bounds not found')
new = r'''  const needle='function initBrowserFilesystem(callback) {';
  if(!src.includes(needle))throw new Error('F7.2 modern shell initBrowserFilesystem patch point changed');
  const inject=`function initBrowserFilesystem(callback) {
    const __rigF7Callback=callback;
    callback=function(){
      const plan=window.RIGF_STREAM_PLAN,file=window.RIGF_STREAM_FILE;
      if(!plan||!file)return __rigF7Callback.apply(this,arguments);
      const __args=arguments;
      (async function(){
        try{
          console.log('RIGF F7.2: DIRECT ZIP STREAM BEGIN files='+plan.length);
          let files=0,bytes=0;
          function u16v(v,o){return v.getUint16(o,true)}
          function u32v(v,o){return v.getUint32(o,true)}
          function mkdirpE(path){let cur='';for(const part of path.split('/').filter(Boolean)){cur+='/'+part;try{FS.mkdir(cur)}catch(e){}}}
          for(let i=0;i<plan.length;i++){
            const ent=plan[i];
            const lh=await file.slice(ent.local,ent.local+30).arrayBuffer(),lv=new DataView(lh);
            if(u32v(lv,0)!==0x04034b50)throw new Error('Bad local ZIP header: '+ent.name);
            const fn=u16v(lv,26),ex=u16v(lv,28),off=ent.local+30+fn+ex;
            const packed=new Uint8Array(await file.slice(off,off+ent.comp).arrayBuffer());
            let raw;
            if(ent.method===0)raw=packed;
            else if(ent.method===8){if(!window.fflate)throw new Error('fflate unavailable');raw=window.fflate.inflateSync(packed)}
            else throw new Error('Unsupported ZIP method '+ent.method+' for '+ent.name);
            const dp='/d_drive/'+ent.name.replace(/^\\/+/,''),slash=dp.lastIndexOf('/');
            if(slash>0)mkdirpE(dp.slice(0,slash));
            FS.writeFile(dp,raw);files++;bytes+=raw.byteLength;
            raw=null;
            if((i%2)===1||i===plan.length-1){console.log('RIGF F7.2: STREAM '+files+'/'+plan.length+' bytes='+bytes);await new Promise(r=>setTimeout(r,0));}
          }
          window.RIGF_STREAM_PLAN=null;window.RIGF_STREAM_FILE=null;
          console.log('RIGF F7.2: DIRECT ZIP STREAM READY files='+files+' bytes='+bytes);
          return __rigF7Callback.apply(this,__args);
        }catch(e){console.error('RIGF F7.2 D DRIVE ERROR',e);throw e}
      })();
    };`;
  src=src.replace(needle,inject);
'''
s = s[:start] + new + s[end:]

s = s.replace('RIGF F7.1 ARGV', 'RIGF F7.2 ARGV')
s = s.replace('RIGF F7.1 expose failed', 'RIGF F7.2 expose failed')
s = s.replace('F7.1 XHR', 'F7.2 XHR').replace('F7.1 MODULE', 'F7.2 MODULE').replace('F7.1 POST-LAUNCH', 'F7.2 POST-LAUNCH')
s = s.replace('F7.1 shell HTTP', 'F7.2 shell HTTP').replace('F7.1 BoxedWine Config bridge', 'F7.2 BoxedWine Config bridge').replace('F7.1 URLPARAMS', 'F7.2 URLPARAMS')
s = s.replace("const text='MOBMUGEN · RIG F · F7.1\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.2\\nRUNTIME STATUS")

p.write_text(s)

d = Path('docs/MOBMUGEN_LIVE.md')
t = d.read_text()
if '## Rig F F7.2 - direct ZIP stream ingest' not in t:
    t += '''\n\n## Rig F F7.2 - direct ZIP stream ingest\n- F7.1 still froze on iPhone during the handoff.\n- F7.2 removes the intermediate ~223.6 MB BrowserFS payload entirely.\n- The lean selector now stores only entry metadata plus the original File handle.\n- Once the modern BoxedWine FS is ready, each selected ZIP entry is sliced, inflated, written directly to `/d_drive`, released, and Safari is yielded to every two files.\n- Modern single-threaded WASM JIT core is unchanged from F7.\n- F6.5 remains the safe baseline.\n'''
    d.write_text(t)
