from pathlib import Path
p=Path('mugen-lab/rig-f7.html')
s=p.read_text()
s=s.replace('MobMugen · Rig F · F7.2','MobMugen · Rig F · F7.3')
s=s.replace('MOBMUGEN · RIG F · F7.2','MOBMUGEN · RIG F · F7.3')
s=s.replace('Rig F · F7.2','Rig F · F7.3')
s=s.replace('F7.2 witness log','F7.3 witness log')
s=s.replace('WASM JIT · LOW-MEM INGEST','WASM JIT · PICKER WITNESS')
old="zipInput.addEventListener('change',()=>{const f=zipInput.files&&zipInput.files[0];if(f)boot(f)});"
new="""let __rigfLastFile=null;\nfunction __rigfChoose(){const f=zipInput.files&&zipInput.files[0];if(!f){status('ZIP PICKER RETURNED · NO FILE');log('F7.3 PICKER · no file');return;}if(__rigfLastFile===f&&bootStarted){log('F7.3 PICKER · same File object ignored because boot already started');return;}__rigfLastFile=f;status('ZIP SELECTED · '+(f.name||'WinMUGEN.zip')+' · '+(f.size/1048576).toFixed(1)+' MB');prep.textContent='ZIP selected · starting index…';log('F7.3 PICKER · selected '+(f.name||'?')+' · '+f.size+' bytes');setTimeout(()=>{if(!bootStarted)boot(f)},0);}\nzipInput.addEventListener('click',()=>{if(!bootStarted){try{zipInput.value=''}catch(e){}}});\nzipInput.addEventListener('input',__rigfChoose);\nzipInput.addEventListener('change',__rigfChoose);"""
if old not in s:
    raise SystemExit('F7.3 picker patch point not found')
s=s.replace(old,new)
s=s.replace("const text='MOBMUGEN · RIG F · F7.2\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.3\\nRUNTIME STATUS")
p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
if '## Rig F F7.3 - picker witness' not in t:
    t += '\n\n## Rig F F7.3 - picker witness\n- Adds immediate visible telemetry when iOS returns a selected ZIP.\n- Clears file-input value before opening so reselecting the same ZIP still fires.\n- Listens to both input and change.\n- Does not alter the F7.2 direct-stream or modern JIT architecture.\n'
    d.write_text(t)
