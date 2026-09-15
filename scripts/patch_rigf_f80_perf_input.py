from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text()

# Version and presentation.
s=s.replace('MobMugen · Rig F · F7.9.2','MobMugen · Rig F · F8.0')
s=s.replace('MOBMUGEN · RIG F · F7.9.2','MOBMUGEN · RIG F · F8.0')
s=s.replace('Rig F · F7.9.2','Rig F · F8.0')
s=s.replace('F7.9.2 witness log','F8.0 witness log')
s=s.replace('WASM JIT · LOCAL WINE 3.1','WASM JIT · PERF + INPUT')
s=s.replace('F7.9.2 ROOT · same-origin split TinyCore15Wine3.1 · overlay=NONE','F8.0 ROOT · same-origin TinyCore15Wine3.1 · overlay=NONE')
s=s.replace('RIGF F7.9.2: LOCAL ROOT BEGIN','RIGF F8.0: LOCAL ROOT BEGIN')
s=s.replace('RIGF F7.9.2: LOCAL ROOT READY','RIGF F8.0: LOCAL ROOT READY')
s=s.replace('RIGF F7.9.2: LOCAL ROOT ERROR','RIGF F8.0: LOCAL ROOT ERROR')

old_desc='F7.1 keeps the modern BoxedWine WASM JIT core but replaces the blocking second-copy D: ingest with a staged low-memory transfer that yields to Safari and frees source files as they move.'
new_desc='F8 keeps the proven modern BoxedWine WASM JIT + local Wine 3.1 boot path, adds live scheduler telemetry, and witnesses whether touch/gamepad key events are consumed by the Emscripten SDL keyboard bridge.'
s=s.replace(old_desc,new_desc)

# Reduce stream logging from every 2 files to roughly every 25 files.
s=s.replace("if((i%2)===1||i===plan.length-1){console.log('RIGF F7.2: STREAM '+files+'/'+plan.length+' bytes='+bytes);", "if((i%25)===24||i===plan.length-1){console.log('RIGF F8.0: STREAM '+files+'/'+plan.length+' bytes='+bytes);")
s=s.replace("console.log('RIGF F7.2: DIRECT ZIP STREAM BEGIN files='+plan.length);", "console.log('RIGF F8.0: DIRECT ZIP STREAM BEGIN files='+plan.length);")
s=s.replace("console.log('RIGF F7.2: DIRECT ZIP STREAM READY files='+files+' bytes='+bytes);", "console.log('RIGF F8.0: DIRECT ZIP STREAM READY files='+files+' bytes='+bytes);")

# Install performance telemetry and SDL-input acknowledgement witness.
old="const fpsBadge=document.getElementById('fpsBadge');if(fpsBadge)fpsBadge.textContent='JIT';"
new="""const fpsBadge=document.getElementById('fpsBadge');
let __f8InputSent=0,__f8InputAck=0,__f8RafFrames=0,__f8RafHz=0,__f8RafMark=performance.now();
function __f8Badge(){if(fpsBadge)fpsBadge.textContent='RAF '+(__f8RafHz||'--')+' · IN '+(__f8InputAck?'SDL✓':(__f8InputSent?'DOM':'--'));}
function __f8Raf(t){__f8RafFrames++;if(t-__f8RafMark>=1000){__f8RafHz=Math.round(__f8RafFrames*1000/(t-__f8RafMark));__f8RafFrames=0;__f8RafMark=t;__f8Badge();}requestAnimationFrame(__f8Raf)}
requestAnimationFrame(__f8Raf);__f8Badge();"""
if old not in s:
    raise SystemExit('F8 fps badge patch point not found')
s=s.replace(old,new,1)

old_emit="function emitKey(code,key,down){const m=keyMeta[code]||[0,key||''];const type=down?'keydown':'keyup',opts={key:key||m[1],code,keyCode:m[0],which:m[0],bubbles:true,cancelable:true};canvas.focus();for(const target of [canvas,document,window]){try{const ev=new KeyboardEvent(type,opts);try{Object.defineProperty(ev,'keyCode',{get:()=>m[0]});Object.defineProperty(ev,'which',{get:()=>m[0]})}catch(_){}target.dispatchEvent(ev)}catch(_){}}}"
new_emit="""function emitKey(code,key,down){
  const m=keyMeta[code]||[0,key||''],type=down?'keydown':'keyup',opts={key:key||m[1],code,keyCode:m[0],which:m[0],bubbles:true,cancelable:true};
  canvas.focus();let ack=false,delivered=0;
  for(const target of [canvas,document,window]){try{const ev=new KeyboardEvent(type,opts);try{Object.defineProperty(ev,'keyCode',{get:()=>m[0]});Object.defineProperty(ev,'which',{get:()=>m[0]})}catch(_){}target.dispatchEvent(ev);delivered++;if(ev.defaultPrevented)ack=true}catch(_){}}
  __f8InputSent++;if(ack)__f8InputAck++;__f8Badge();
  if(down)log('F8.0 INPUT · '+code+' · targets='+delivered+(ack?' · SDL ACK ✓':' · DOM ONLY'));
}"""
if old_emit not in s:
    raise SystemExit('F8 emitKey patch point not found')
s=s.replace(old_emit,new_emit,1)

# Add a clear performance/input witness after first rendered frame.
s=s.replace("status('WINMUGEN VIDEO ✓');log('F6.1 FIRST FRAME CHANGE')", "status('WINMUGEN VIDEO ✓');log('F8.0 FIRST FRAME CHANGE · JIT VIDEO LIVE');log('F8.0 PERF WITNESS · RAF badge measures browser scheduler; INPUT badge becomes SDL✓ when BoxedWine consumes a synthetic key event')")

# Copy trace identity.
s=s.replace("const text='MOBMUGEN · RIG F · F7.9.2\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F8.0\\nRUNTIME STATUS")

p.write_text(s)

# Continuity note.
d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
heading='## Rig F F8.0 - performance + input witness'
if heading not in t:
    t += '''\n\n## Rig F F8.0 - performance + input witness\n- F7.9.2 is the first proven modern WASM-JIT path to render WinMUGEN video on iPhone Safari using TinyCore15Wine3.1 and the same-origin split root.\n- F8.0 locks that compatibility stack and avoids further Wine/root churn.\n- Stream telemetry is reduced from every 2 files to about every 25 files.\n- Top badge now shows browser RAF cadence and input status. IN SDL✓ means a synthetic touch/gamepad keyboard event reached an Emscripten/SDL listener that prevented default; IN DOM means the event dispatched but no SDL acknowledgement was observed.\n- First-frame trace is renamed as an F8 JIT video witness. Audio remains disabled until performance and input are proven.\n'''
    d.write_text(t)
print('F8.0 performance/input witness patch applied')
