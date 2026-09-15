from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text()

# Version / presentation.
s=s.replace('MobMugen · Rig F · F8.1','MobMugen · Rig F · F8.2')
s=s.replace('MOBMUGEN · RIG F · F8.1','MOBMUGEN · RIG F · F8.2')
s=s.replace('Rig F · F8.1','Rig F · F8.2')
s=s.replace('F8.1 witness log','F8.2 witness log')
s=s.replace('WASM JIT · PERF + INPUT · NO MONO','WASM JIT · STABILITY + INPUT')
s=s.replace('F8.1 keeps the proven JIT + Wine 3.1 path, suppresses Wine Mono/Gecko installer prompts, and preserves the live performance + SDL input witness.','F8.2 keeps the proven JIT + Wine 3.1 path, protects rewritten x86 code from WASM-JIT reuse, and keeps the working touch/gamepad controls.')

# Keep JIT globally on, but force written/self-modifying code down the safe path.
old="'auto=true','sound=false','bpp=16','storage=memory'"
new="'auto=true','sound=false','disableWasmJitForWrittenCode=true','bpp=16','storage=memory'"
if old not in s:
    raise SystemExit('F8.2 buildParams patch point not found')
s=s.replace(old,new,1)

# Input witness now reflects what we actually know from the phone: events were sent and WinMUGEN responded.
s=s.replace("function __f8Badge(){if(fpsBadge)fpsBadge.textContent='RAF '+(__f8RafHz||'--')+' · IN '+(__f8InputAck?'SDL✓':(__f8InputSent?'DOM':'--'));}","function __f8Badge(){if(fpsBadge)fpsBadge.textContent='RAF '+(__f8RafHz||'--')+' · IN '+(__f8InputSent?'SENT':'--');}")
s=s.replace("  canvas.focus();let ack=false,delivered=0;","  canvas.focus();let delivered=0;")
s=s.replace("target.dispatchEvent(ev);delivered++;if(ev.defaultPrevented)ack=true","target.dispatchEvent(ev);delivered++")
s=s.replace("  __f8InputSent++;if(ack)__f8InputAck++;__f8Badge();\n  if(down)log('F8.1 INPUT · '+code+' · targets='+delivered+(ack?' · SDL ACK ✓':' · DOM ONLY'));","  __f8InputSent++;__f8Badge();\n  if(down)log('F8.2 INPUT · '+code+' · targets='+delivered+' · DELIVERED');")

# Collapse repeated identical runtime errors so a single fault cannot bury the useful trace.
old_log="function log(s){s=String(s); if(/^BW OUT · creating:/.test(s)) return; lines.push(s);while(lines.length>180)lines.shift();diag.textContent=lines.join('\\n');diag.scrollTop=diag.scrollHeight;persist(false)}"
new_log="""let __f82Last='',__f82Repeat=0;
function log(s){
  s=String(s); if(/^BW OUT · creating:/.test(s)) return;
  if(s===__f82Last){__f82Repeat++;if(__f82Repeat>2)return;s=s+' · repeat '+(__f82Repeat+1)}else{__f82Last=s;__f82Repeat=0}
  lines.push(s);while(lines.length>180)lines.shift();diag.textContent=lines.join('\\n');diag.scrollTop=diag.scrollHeight;persist(false)
}"""
if old_log not in s:
    raise SystemExit('F8.2 log dedupe patch point not found')
s=s.replace(old_log,new_log,1)

# Update trace identities.
for a,b in [
 ('F8.1 ROOT ·','F8.2 ROOT ·'),
 ('RIGF F8.1:','RIGF F8.2:'),
 ("log('F8.1 FIRST FRAME CHANGE · JIT VIDEO LIVE')","log('F8.2 FIRST FRAME CHANGE · JIT VIDEO LIVE');log('F8.2 JIT STABILITY · disableWasmJitForWrittenCode=true')"),
 ("log('F8.1 MONO SUPPRESS", "log('F8.2 MONO SUPPRESS"),
 ("log('F8.1 PERF WITNESS", "log('F8.2 PERF WITNESS"),
 ("const text='MOBMUGEN · RIG F · F8.1\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F8.2\\nRUNTIME STATUS")
]:
    s=s.replace(a,b)

p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
heading='## Rig F F8.2 - JIT stability under rewritten code'
if heading not in t:
    t += '''\n\n## Rig F F8.2 - JIT stability under rewritten code\n- F8.0 phone witness proved WinMUGEN accepts the on-screen controls even though the old defaultPrevented-based badge reported DOM ONLY.\n- The same witness showed repeated `nested code invalidation preparation` messages followed by an out-of-bounds WASM failure before later input faults.\n- F8.2 keeps modern WASM JIT enabled globally but sets `disableWasmJitForWrittenCode=true`, using BoxedWine's supported safety switch for code pages that are rewritten/self-modified.\n- Input telemetry now reports SENT/DELIVERED rather than pretending defaultPrevented is an SDL acknowledgement.\n- Repeated identical runtime-error lines are collapsed to preserve useful trace context. Wine 3.1, same-origin root, 259-file stream, Mono suppression, and audio-off state remain locked.\n'''
    d.write_text(t)

print('F8.2 JIT stability patch applied')
