from pathlib import Path

p = Path('mugen-lab/rig-f.html')
s = p.read_text()
if 'MOBMUGEN · RIG F · F6.1' not in s:
    raise SystemExit('Expected F6.1 base not found')

s = s.replace('MobMugen · Rig F · F6.1.1', 'MobMugen · Rig F · F6.2')
s = s.replace('MobMugen · Rig F · F6.1', 'MobMugen · Rig F · F6.2')
s = s.replace('MOBMUGEN · RIG F · F6.1', 'MOBMUGEN · RIG F · F6.2')
s = s.replace('Rig F · F6.1', 'Rig F · F6.2')
s = s.replace('F6.1 witness log', 'F6.2 witness log')
for a,b in [('F6.1 ERROR','F6.2 ERROR'),('F6.1 LEAN','F6.2 LEAN'),('RIGF F6.1','RIGF F6.2'),('F6.1 XHR','F6.2 XHR'),('F6.1 ROOT','F6.2 ROOT'),('F6.1 MODULE','F6.2 MODULE'),('F6.1 POST','F6.2 POST')]:
    s=s.replace(a,b)

css = r'''
.ctrlbtn{border:1px solid #6d5722;background:#151208;color:var(--gold);border-radius:999px;padding:8px 10px;font:900 10px ui-monospace;letter-spacing:.04em;white-space:nowrap}.bar .ctrlbtn:first-of-type{margin-left:6px}.controls{position:relative;margin-top:8px;height:228px;border:1px solid #273750;border-radius:18px;background:radial-gradient(circle at 50% 0,#20203a55,transparent 48%),linear-gradient(180deg,#101722,#06080f);overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}.controls.hidden,.diag-wrap.hidden{display:none}.controls:before{content:'MOBMUGEN CONTROLLER';position:absolute;left:50%;top:6px;transform:translateX(-50%);font:900 7px ui-monospace;letter-spacing:.18em;color:#ffffff3d}.cz{position:absolute;top:18px;bottom:42px;width:50%;display:flex;align-items:center;justify-content:center}.cz.left{left:0}.cz.right{right:0}.dpad{width:min(36vw,150px);height:min(36vw,150px);display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:7px;border-radius:50%;border:2px solid #6dafff88;background:radial-gradient(circle,#0b0e18 0 26%,#121a2c 27% 48%,#080b14 49% 100%);box-shadow:0 0 22px #2c8eff44,inset 0 0 22px #5940c844}.dir{appearance:none;border:0;background:transparent;color:#dcecff;font:950 22px ui-monospace;display:flex;align-items:center;justify-content:center;touch-action:none}.dir.center{pointer-events:none;font-size:8px;color:#8fa7c4;border:1px solid #6dafff44;border-radius:50%;margin:12%;background:radial-gradient(circle,#11182a,#070a11)}.dir.on{background:radial-gradient(circle,#308dff88,transparent 68%);transform:scale(.92)}.acts{position:relative;width:min(44vw,190px);height:154px}.act{position:absolute;width:min(13vw,55px);height:min(13vw,55px);border-radius:50%;color:#fff;font:950 12px ui-monospace;touch-action:none;background:radial-gradient(circle at 36% 28%,#ffffff55,#182037 45%,#070a12 100%);box-shadow:0 7px 14px #000a,inset 0 0 14px #ffffff12}.act.on{transform:scale(.91);filter:brightness(1.5)}.lp,.lk{border:2px solid #209cffcc}.mp,.mk{border:2px solid #f2b94fcc}.hp,.hk{border:2px solid #ff5050cc}.lp{left:0;top:12%}.mp{left:35%;top:0}.hp{right:0;top:12%}.lk{left:0;bottom:0}.mk{left:35%;bottom:10%}.hk{right:0;bottom:0}.util{position:absolute;left:50%;bottom:7px;transform:translateX(-50%);width:94%;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.util button{height:29px;border:1px solid #f2c45d55;background:#15130fdd;color:#f8dda0;border-radius:9px;font:950 9px ui-monospace;touch-action:none}.util button.on{background:#805c1dcc;transform:scale(.96)}.gamepad-note{display:none;margin:6px 3px 0;color:#9bf0c5;font:900 9px ui-monospace;letter-spacing:.05em}.gamepad-note.show{display:block}.diag-head{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.diag-head span{font:900 9px ui-monospace;color:#7f8ca1;letter-spacing:.08em}.diag-toggle{border:1px solid #364c67;background:#0d1520;color:#b9c9dd;border-radius:999px;padding:6px 9px;font:900 9px ui-monospace}.diag-wrap{margin-top:4px}@media(max-width:520px){.stage{min-height:0}.controls{height:218px}.diag{max-height:175px}}
'''
if '#bw-hidden{display:none!important}' not in s:
    raise SystemExit('CSS marker missing')
s=s.replace('#bw-hidden{display:none!important}', css+'#bw-hidden{display:none!important}',1)

pill='<div class="pill">LEAN APP FS · BOXEDWINE</div>'
if pill not in s:
    raise SystemExit('pill marker missing')
s=s.replace(pill, pill+'<button id="ctrlToggle" class="ctrlbtn" type="button">HIDE CTRL</button><button id="debugToggle" class="ctrlbtn" type="button">HIDE DEBUG</button>',1)

old='<div class="statusline">INPUT <b>READY</b> · RUNTIME <b id="runtimeState">WAITING FOR ZIP</b></div><div id="diag" class="diag">F6.2 witness log</div>'
if old not in s:
    raise SystemExit('status/diag marker missing')
controller=r'''<div class="statusline">INPUT <b>READY</b> · RUNTIME <b id="runtimeState">WAITING FOR ZIP</b></div>
<div id="gamepadNote" class="gamepad-note">GAMEPAD CONNECTED · TOUCH CONTROLS AUTO-HIDDEN</div>
<div id="controls" class="controls">
  <div class="cz left"><div class="dpad">
    <button class="dir" data-macro="UL">↖</button><button class="dir" data-k="ArrowUp" data-key="ArrowUp">↑</button><button class="dir" data-macro="UR">↗</button>
    <button class="dir" data-k="ArrowLeft" data-key="ArrowLeft">←</button><div class="dir center">P1</div><button class="dir" data-k="ArrowRight" data-key="ArrowRight">→</button>
    <button class="dir" data-macro="DL">↙</button><button class="dir" data-k="ArrowDown" data-key="ArrowDown">↓</button><button class="dir" data-macro="DR">↘</button>
  </div></div>
  <div class="cz right"><div class="acts">
    <button class="act lp" data-k="KeyA" data-key="a">LP</button><button class="act mp" data-k="KeyS" data-key="s">MP</button><button class="act hp" data-k="KeyD" data-key="d">HP</button>
    <button class="act lk" data-k="KeyZ" data-key="z">LK</button><button class="act mk" data-k="KeyX" data-key="x">MK</button><button class="act hk" data-k="KeyC" data-key="c">HK</button>
  </div></div>
  <div class="util"><button data-macro="2P">2P</button><button data-macro="2K">2K</button><button data-k="Enter" data-key="Enter">START</button><button data-k="Escape" data-key="Escape">BACK</button></div>
</div>
<div class="diag-head"><span>DEBUG TRACE</span><button id="diagInlineToggle" class="diag-toggle" type="button">COLLAPSE</button></div>
<div id="diagWrap" class="diag-wrap"><div id="diag" class="diag">F6.2 witness log</div></div>'''
s=s.replace(old,controller,1)

dom="const zipInput=document.getElementById('zipInput'),setup=document.getElementById('setup'),prep=document.getElementById('prepDiag'),diag=document.getElementById('diag'),state=document.getElementById('runtimeState'),canvas=document.getElementById('canvas'),bwStatus=document.getElementById('status'),copyBtn=document.getElementById('copyTrace');"
if dom not in s:
    raise SystemExit('DOM marker missing')
bridge=r'''
const controls=document.getElementById('controls'),ctrlToggle=document.getElementById('ctrlToggle'),debugToggle=document.getElementById('debugToggle'),diagInlineToggle=document.getElementById('diagInlineToggle'),diagWrap=document.getElementById('diagWrap'),gamepadNote=document.getElementById('gamepadNote');
const keyMeta={ArrowUp:[38,'ArrowUp'],ArrowDown:[40,'ArrowDown'],ArrowLeft:[37,'ArrowLeft'],ArrowRight:[39,'ArrowRight'],KeyA:[65,'a'],KeyS:[83,'s'],KeyD:[68,'d'],KeyZ:[90,'z'],KeyX:[88,'x'],KeyC:[67,'c'],Enter:[13,'Enter'],Escape:[27,'Escape']};
function emitKey(code,key,down){const m=keyMeta[code]||[0,key||''];const type=down?'keydown':'keyup',opts={key:key||m[1],code,keyCode:m[0],which:m[0],bubbles:true,cancelable:true};canvas.focus();for(const target of [canvas,document,window]){try{const ev=new KeyboardEvent(type,opts);try{Object.defineProperty(ev,'keyCode',{get:()=>m[0]});Object.defineProperty(ev,'which',{get:()=>m[0]})}catch(_){}target.dispatchEvent(ev)}catch(_){}}}
function bindPress(el,codes){let held=false;const dn=e=>{e.preventDefault();if(held)return;held=true;el.classList.add('on');codes.forEach(k=>emitKey(k[0],k[1],true))};const up=e=>{e.preventDefault();if(!held)return;held=false;el.classList.remove('on');[...codes].reverse().forEach(k=>emitKey(k[0],k[1],false))};el.addEventListener('pointerdown',dn);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',e=>{if(held)up(e)})}
document.querySelectorAll('#controls [data-k]').forEach(el=>bindPress(el,[[el.dataset.k,el.dataset.key]]));
const macros={UL:[['ArrowUp','ArrowUp'],['ArrowLeft','ArrowLeft']],UR:[['ArrowUp','ArrowUp'],['ArrowRight','ArrowRight']],DL:[['ArrowDown','ArrowDown'],['ArrowLeft','ArrowLeft']],DR:[['ArrowDown','ArrowDown'],['ArrowRight','ArrowRight']],'2P':[['KeyA','a'],['KeyS','s']],'2K':[['KeyZ','z'],['KeyX','x']]};document.querySelectorAll('#controls [data-macro]').forEach(el=>bindPress(el,macros[el.dataset.macro]||[]));
function setControlsHidden(h){controls.classList.toggle('hidden',h);ctrlToggle.textContent=h?'SHOW CTRL':'HIDE CTRL'}ctrlToggle.addEventListener('click',()=>setControlsHidden(!controls.classList.contains('hidden')));
function setDebugHidden(h){diagWrap.classList.toggle('hidden',h);debugToggle.textContent=h?'SHOW DEBUG':'HIDE DEBUG';diagInlineToggle.textContent=h?'EXPAND':'COLLAPSE'}debugToggle.addEventListener('click',()=>setDebugHidden(!diagWrap.classList.contains('hidden')));diagInlineToggle.addEventListener('click',()=>setDebugHidden(!diagWrap.classList.contains('hidden')));
let gpPrev={},autoHidden=false;function gamepadLoop(){const pads=navigator.getGamepads?navigator.getGamepads():[],gp=[...pads].find(Boolean);if(gp){gamepadNote.classList.add('show');if(!autoHidden&&!controls.classList.contains('hidden')){setControlsHidden(true);autoHidden=true}const map={12:['ArrowUp','ArrowUp'],13:['ArrowDown','ArrowDown'],14:['ArrowLeft','ArrowLeft'],15:['ArrowRight','ArrowRight'],2:['KeyA','a'],3:['KeyS','s'],5:['KeyD','d'],0:['KeyZ','z'],1:['KeyX','x'],7:['KeyC','c'],9:['Enter','Enter'],8:['Escape','Escape']};for(const [i,k] of Object.entries(map)){const on=!!(gp.buttons[+i]&&gp.buttons[+i].pressed),was=!!gpPrev[i];if(on!==was){emitKey(k[0],k[1],on);gpPrev[i]=on}}}else{gamepadNote.classList.remove('show');gpPrev={};autoHidden=false}requestAnimationFrame(gamepadLoop)}requestAnimationFrame(gamepadLoop);
'''
s=s.replace(dom,dom+bridge,1)

p.write_text(s)

# Update the PV title-screen/Home Screen shortcuts to target the current Rig F build.
ip=Path('index.html')
idx=ip.read_text()
idx=idx.replace('href="./mugen-lab/" aria-label="Open MobMugen Lab"','href="./mugen-lab/rig-f.html?v=f62" aria-label="Open MobMugen F6.2"')
idx=idx.replace('<span class="mobmugen-label">MOBMUGEN · LAB</span>','<span class="mobmugen-label">MOBMUGEN · F6.2</span>')
idx=idx.replace('href="./mugen-lab/rig-f.html" aria-label="Open BoxedWine Rig F"','href="./mugen-lab/rig-f.html?v=f62" aria-label="Open BoxedWine Rig F6.2"')
ip.write_text(idx)

cp=Path('docs/MOBMUGEN_LIVE.md')
with cp.open('a') as f:
    f.write('''\n## Rig F F6.2 - playable shell integration\n- F6.1 phone witness produced real WinMUGEN video on iPhone.\n- Restores the prior portrait touch-controller layout: D-pad, LP/MP/HP, LK/MK/HK, 2P/2K, START/BACK.\n- Controls are independently collapsible via HIDE/SHOW CTRL.\n- Debug trace area is independently collapsible via HIDE/SHOW DEBUG or its inline COLLAPSE/EXPAND button.\n- Browser Gamepad API/Xbox mapping restored with touch controls auto-hidden while a physical gamepad is connected.\n- PV title/Home Screen MobMugen and Rig F shortcuts now point directly to `rig-f.html?v=f62`.\n''')
