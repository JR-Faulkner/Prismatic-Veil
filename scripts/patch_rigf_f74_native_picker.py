from pathlib import Path
p=Path('mugen-lab/rig-f7.html')
s=p.read_text()
s=s.replace('MobMugen · Rig F · F7.3','MobMugen · Rig F · F7.4')
s=s.replace('MOBMUGEN · RIG F · F7.3','MOBMUGEN · RIG F · F7.4')
s=s.replace('Rig F · F7.3','Rig F · F7.4')
s=s.replace('F7.3 witness log','F7.4 witness log')
s=s.replace('WASM JIT · PICKER WITNESS','WASM JIT · NATIVE PICKER')
old='<label class="pick">CHOOSE WINMUGEN ZIP<input id="zipInput" type="file" accept=".zip,application/zip" hidden></label>'
new='<div style="margin-top:12px"><input id="zipInput" type="file" accept=".zip,application/zip" style="display:block;width:100%;max-width:520px;margin:0 auto;padding:12px;border:1px solid #7a6227;border-radius:12px;background:#181307;color:#f1bf55;font:900 12px ui-monospace"><button id="zipStart" type="button" class="pick" style="margin-top:10px">START SELECTED ZIP</button></div>'
if old not in s:
    raise SystemExit('F7.4 native picker markup patch point not found')
s=s.replace(old,new)
oldjs="""let __rigfLastFile=null;\nfunction __rigfChoose(){const f=zipInput.files&&zipInput.files[0];if(!f){status('ZIP PICKER RETURNED · NO FILE');log('F7.3 PICKER · no file');return;}if(__rigfLastFile===f&&bootStarted){log('F7.3 PICKER · same File object ignored because boot already started');return;}__rigfLastFile=f;status('ZIP SELECTED · '+(f.name||'WinMUGEN.zip')+' · '+(f.size/1048576).toFixed(1)+' MB');prep.textContent='ZIP selected · starting index…';log('F7.3 PICKER · selected '+(f.name||'?')+' · '+f.size+' bytes');setTimeout(()=>{if(!bootStarted)boot(f)},0);}\nzipInput.addEventListener('click',()=>{if(!bootStarted){try{zipInput.value=''}catch(e){}}});\nzipInput.addEventListener('input',__rigfChoose);\nzipInput.addEventListener('change',__rigfChoose);"""
newjs="""const zipStart=document.getElementById('zipStart');\nfunction __rigfSelected(){const f=zipInput.files&&zipInput.files[0];if(!f){status('NO ZIP SELECTED');prep.textContent='No ZIP selected yet.';log('F7.4 PICKER · no file');return null;}status('ZIP SELECTED · '+(f.name||'WinMUGEN.zip')+' · '+(f.size/1048576).toFixed(1)+' MB');prep.textContent='ZIP selected · '+(f.name||'?')+' · tap START SELECTED ZIP';log('F7.4 PICKER · selected '+(f.name||'?')+' · '+f.size+' bytes');return f;}\nzipInput.addEventListener('change',__rigfSelected);\nzipInput.addEventListener('input',__rigfSelected);\nzipStart.addEventListener('click',()=>{const f=__rigfSelected();if(!f||bootStarted)return;prep.textContent='Starting ZIP index…';status('STARTING ZIP INDEX');log('F7.4 START · boot requested');setTimeout(()=>boot(f),0);});"""
if oldjs not in s:
    raise SystemExit('F7.4 picker JS patch point not found')
s=s.replace(oldjs,newjs)
s=s.replace("const text='MOBMUGEN · RIG F · F7.3\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.4\\nRUNTIME STATUS")
p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
if '## Rig F F7.4 - native visible picker' not in t:
    t += '\n\n## Rig F F7.4 - native visible picker\n- Replaces hidden label-driven ZIP input with a visible native iOS file input.\n- Adds explicit START SELECTED ZIP button so file selection and boot start are separate witness points.\n- Removes input-value pre-clear behavior.\n- Keeps F7.2 direct stream and modern JIT architecture unchanged.\n'
    d.write_text(t)
