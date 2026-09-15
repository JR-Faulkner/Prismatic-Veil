from pathlib import Path
p=Path('mugen-lab/rig-f7.html')
s=p.read_text()
s=s.replace('MobMugen · Rig F · F7.4','MobMugen · Rig F · F7.5')
s=s.replace('MOBMUGEN · RIG F · F7.4','MOBMUGEN · RIG F · F7.5')
s=s.replace('Rig F · F7.4','Rig F · F7.5')
s=s.replace('F7.4 witness log','F7.5 witness log')
s=s.replace('WASM JIT · NATIVE PICKER','WASM JIT · START WITNESS')
# Put a dependency-free inline witness directly on the native start button.
old='<button id="zipStart" type="button" class="pick" style="margin-top:10px">START SELECTED ZIP</button>'
new='<button id="zipStart" type="button" class="pick" style="margin-top:10px" onclick="this.textContent=\'START CLICKED ✓\';var rs=document.getElementById(\'runtimeState\');var pd=document.getElementById(\'prepDiag\');if(rs)rs.textContent=\'START CLICK RECEIVED\';if(pd)pd.textContent=\'Start click received by page. Handing ZIP to boot…\';">START SELECTED ZIP</button>'
if old not in s: raise SystemExit('F7.5 button patch point not found')
s=s.replace(old,new)
# Slow the handoff just enough for Safari to paint the witness before any ZIP work starts.
oldjs="zipStart.addEventListener('click',()=>{const f=__rigfSelected();if(!f||bootStarted)return;prep.textContent='Starting ZIP index…';status('STARTING ZIP INDEX');log('F7.4 START · boot requested');setTimeout(()=>boot(f),0);});"
newjs="zipStart.addEventListener('click',()=>{const f=__rigfSelected();if(!f){zipStart.textContent='NO ZIP SELECTED';return;}if(bootStarted){zipStart.textContent='BOOT ALREADY STARTED';return;}zipStart.textContent='STARTING…';prep.textContent='Starting ZIP index…';status('STARTING ZIP INDEX');log('F7.5 START · boot requested');setTimeout(()=>{try{boot(f)}catch(e){zipStart.textContent='BOOT ERROR';fail(e)}},250);});"
if oldjs not in s: raise SystemExit('F7.5 JS patch point not found')
s=s.replace(oldjs,newjs)
s=s.replace('F7.4 PICKER','F7.5 PICKER').replace("const text='MOBMUGEN · RIG F · F7.4\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.5\\nRUNTIME STATUS")
p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
if '## Rig F F7.5 - start-button bootstrap witness' not in t:
    t += '\n\n## Rig F F7.5 - start-button bootstrap witness\n- Adds a dependency-free inline visual witness to the native START SELECTED ZIP button.\n- Button immediately changes to START CLICKED before main boot code runs.\n- Main boot handoff waits 250 ms so iOS Safari can paint the state change before ZIP indexing.\n- If the button changes but boot does not advance, the failure is inside main JS/boot rather than the native tap itself.\n'
    d.write_text(t)
