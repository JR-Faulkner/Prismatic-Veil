from pathlib import Path
import re

src = Path('mugen-lab/rig-f.html').read_text()
s = src
s = s.replace('MobMugen · Rig F · F6.5', 'MobMugen · Rig F · F7')
s = s.replace('MOBMUGEN · RIG F · F6.5', 'MOBMUGEN · RIG F · F7')
s = s.replace('Rig F · F6.5', 'Rig F · F7')
s = s.replace('F6.5 witness log', 'F7 witness log')
s = s.replace('RAF LOCK · LOCAL ROOT', 'WASM JIT · MODERN CORE')
s = s.replace(
    'F6.5 keeps the full local Wine root and pinned WASM path, then locks EGL swap timing to requestAnimationFrame so a later swapInterval(0) cannot kick the main loop back to timeout mode.',
    'F7 isolates the current upstream BoxedWine WASM JIT core while preserving the proven lean WinMUGEN payload, local Wine root, touch controls, and sound-off performance test.'
)
s = s.replace('.bar{display:flex;align-items:center;gap:8px;height:52px}', '.bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:52px}.brand{margin-right:auto}')
s = s.replace('.pill{margin-left:auto;', '.pill{margin-left:0;')
s = s.replace('<div id="fpsBadge" class="pill">L -- · D --</div>', '<div id="fpsBadge" class="pill">JIT</div>')

old_consts = "const PIN='c6049f9684f3c6895c8f31f361a0a29462793f41',CDN='https://cdn.jsdelivr.net/gh/andrewnakas/exebrowser@'+PIN+'/public/boxedwine/';\nconst SHELL=CDN+'build/default/boxedwine-shell.js',ENGINE=CDN+'build/default/boxedwine.js';\nconst ROOT_BASE='./assets/',OVERLAY_BASE=CDN+'apps/',TRACE_KEY='mobmugen-rigf-last-trace-v1';"
new_consts = "const LEGACY_PIN='c6049f9684f3c6895c8f31f361a0a29462793f41',LEGACY_CDN='https://cdn.jsdelivr.net/gh/andrewnakas/exebrowser@'+LEGACY_PIN+'/public/boxedwine/';\nconst F7_CORE='./boxedwine-f7/',SHELL=F7_CORE+'boxedwine-shell.js',ENGINE=F7_CORE+'boxedwine.js';\nconst ROOT_BASE='./assets/',OVERLAY_BASE=LEGACY_CDN+'apps/',TRACE_KEY='mobmugen-rigf-last-trace-v1';"
if old_consts not in s:
    raise SystemExit('F7 constants patch point not found')
s = s.replace(old_consts, new_consts)

s, n = re.subn(
    r"const fpsBadge=document\.getElementById\('fpsBadge'\);let drawLast=0,loopLast=0;setInterval\(\(\)=>\{.*?\},1000\);",
    "const fpsBadge=document.getElementById('fpsBadge');if(fpsBadge)fpsBadge.textContent='JIT';",
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('F7 FPS patch failed')

s, n = re.subn(
    r"function buildParams\(\)\{.*?\}",
    "function buildParams(){const work=exeDir?'d:/'+exeDir:'d:/';return ['root=fullWine1.7.55-v8','overlay=wine1.7.55-v8-min-online','p=Winmugen.exe','w='+work,'auto=true','sound=false','bpp=16','storage=memory'].join('&')}",
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('F7 params patch failed')

new_patch_shell = r'''function patchShell(src){
  src=src.replace('Config.locateRootBaseUrl = "";','Config.locateRootBaseUrl = "'+ROOT_BASE+'";')
         .replace('Config.locateOverlayBaseUrl = "";','Config.locateOverlayBaseUrl = "'+OVERLAY_BASE+'";')
         .replace('Config.storageMode = STORAGE_INDEXED_DB;','Config.storageMode = STORAGE_MEMORY;')
         .replace('Config.persist_d_drive = true;','Config.persist_d_drive = false;');
  const needle='function initBrowserFilesystem(callback) {';
  if(!src.includes(needle))throw new Error('F7 modern shell initBrowserFilesystem patch point changed');
  const inject=`function initBrowserFilesystem(callback) {
    const __rigF7Callback=callback;
    callback=function(){
      try{
        if(window.RIGF_APP_FS){
          console.log('RIGF F7: DIRECT D DRIVE INGEST BEGIN');
          const nfs=BrowserFS.BFSRequire('fs');
          let files=0,bytes=0;
          function mkdirpE(path){let cur='';for(const part of path.split('/').filter(Boolean)){cur+='/'+part;try{FS.mkdir(cur)}catch(e){}}}
          function copyDir(srcPath,dstPath){
            for(const name of nfs.readdirSync(srcPath)){
              const sp=(srcPath==='/'?'':srcPath)+'/'+name,dp=dstPath+'/'+name,st=nfs.statSync(sp);
              if(st.isDirectory()){mkdirpE(dp);copyDir(sp,dp)}else{
                const buf=nfs.readFileSync(sp),view=new Uint8Array(buf.buffer,buf.byteOffset||0,buf.byteLength||buf.length);
                FS.writeFile(dp,view);files++;bytes+=view.byteLength;
              }
            }
          }
          copyDir('/','/d_drive');
          console.log('RIGF F7: DIRECT D DRIVE READY files='+files+' bytes='+bytes);
          window.RIGF_APP_FS_COPIED=true;
        }
      }catch(e){console.error('RIGF F7 D DRIVE ERROR',e);throw e}
      return __rigF7Callback.apply(this,arguments);
    };`;
  src=src.replace(needle,inject);
  src=src.replace('console.log("Emulator params:" + params);','console.log("RIGF F7 ARGV · " + params.join(" | ")); console.log("Emulator params:" + params);');
  src+='\n;try{window.__RigFConfig=Config;window.__RigFGetParams=getEmulatorParams;}catch(e){console.error("RIGF F7 expose failed",e)}\n';
  return src
}'''
s, n = re.subn(r"function patchShell\(src\)\{.*?return src\}", new_patch_shell, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('F7 patchShell replacement failed')

new_boot = r'''async function boot(file){if(bootStarted)return;bootStarted=true;lines=[];persist();try{
await inspectZip(file);status('STREAMING BOOT-CRITICAL APP FILES');await buildLeanAppFS(file);window.RIGF_APP_ZIP_DATA=null;
status('FETCHING MODERN BOXEDWINE JIT SHELL');const r=await fetch(SHELL,{cache:'no-store'});if(!r.ok)throw new Error('F7 shell HTTP '+r.status);const src=patchShell(await r.text());
status('LOADING MODERN BOXEDWINE JIT SHELL');await scriptText(src);const cfg=window.__RigFConfig;if(!cfg)throw new Error('F7 BoxedWine Config bridge not exposed');
cfg.isRunningInline=true;cfg.locateRootBaseUrl=ROOT_BASE;cfg.locateAppBaseUrl='';cfg.locateOverlayBaseUrl=OVERLAY_BASE;cfg.urlParams=buildParams();log('F7 URLPARAMS · '+cfg.urlParams);
installNetTrace();setup.classList.add('hide');status('LOADING MODERN BOXEDWINE WASM JIT');await scriptURL(ENGINE);status('BOXEDWINE WASM JIT STARTED');armLifecycle();
setTimeout(()=>{log('F7 POST-LAUNCH HEARTBEAT · 2s');probe();persist(true)},2000);setTimeout(()=>{log('F7 POST-LAUNCH HEARTBEAT · 6s');probe();persist(true)},6000);witness()
}catch(e){fail(e)}}'''
s, n = re.subn(r"async function boot\(file\)\{.*?\}\nzipInput\.addEventListener", new_boot + "\nzipInput.addEventListener", s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('F7 boot replacement failed')

s = s.replace('F6.5 XHR', 'F7 XHR').replace('F6.5 MODULE', 'F7 MODULE').replace('F6.5 POST-LAUNCH', 'F7 POST-LAUNCH')
s = s.replace("const text='MOBMUGEN · RIG F · F6.5\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7\\nRUNTIME STATUS")
Path('mugen-lab/rig-f7.html').write_text(s)

d = Path('docs/MOBMUGEN_LIVE.md')
t = d.read_text()
if '## Rig F F7 - modern upstream WASM JIT experiment' not in t:
    t += '''\n\n## Rig F F7 - modern upstream WASM JIT experiment\n- F6.5 proved RAF timing is holding, while phone witness remained around only a few emulated frames per second.\n- F7 is isolated from the F6.5 baseline and pins current upstream BoxedWine commit `940cb6fe2c771c2275d57d4fbb5a8f77bfa7b167`.\n- Builds upstream single-threaded `make jit` WASM JIT so GitHub Pages does not require COOP/COEP SharedArrayBuffer headers.\n- Keeps the proven lean WinMUGEN selection and old local Wine 1.7.55 root for an engine-only performance comparison.\n- Copies the lean BrowserFS payload into modern BoxedWine `/d_drive` before launch, then maps it to Wine D:.\n- Sound remains off. F6.5 remains the safe proven baseline.\n'''
d.write_text(t)
