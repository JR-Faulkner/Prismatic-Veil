(()=>{
  'use strict';
  const STYLE=`
  :root{--pv-cyan:#8cecff;--pv-gold:#e7c66f;--pv-violet:#9b67ff}
  body:before{content:"";position:fixed;inset:6px;z-index:90;pointer-events:none;border:1px solid #d8ba6c3d;clip-path:polygon(0 16px,16px 0,calc(100% - 16px) 0,100% 16px,100% calc(100% - 16px),calc(100% - 16px) 100%,16px 100%,0 calc(100% - 16px));box-shadow:inset 0 0 34px #7c5cff14}
  .topbar,.stage-shell,.panel{box-shadow:inset 0 0 0 1px #ffffff08,0 12px 30px #0008!important}
  .stage-shell{background:radial-gradient(circle at 50% 42%,#27486924,transparent 38%),linear-gradient(180deg,#0b1733ef,#050a18f5)!important}
  .panel{background:linear-gradient(180deg,#0d1d3bf2,#060c1cf8)!important}
  .identity{background:linear-gradient(110deg,#17264c88,transparent 62%)}
  .slot.navfocus .pad,.slot:focus-visible .pad{border-color:#9eeeff!important;box-shadow:0 0 26px #64d9ff66,inset 0 0 18px #71dcff29!important}
  .slot.navfocus .char-art,.slot:focus-visible .char-art{transform:translateX(-50%) translateY(-3px) scale(1.035)!important;filter:drop-shadow(0 10px 9px #0008) drop-shadow(0 0 11px #73ddff66)!important}
  .slot.navfocus .slot-label,.slot:focus-visible .slot-label{border-color:#8cecffaa!important;color:#f4fbff!important;box-shadow:0 0 14px #65dfff2b!important}
  .control-btn.navfocus,.command.navfocus,.return-btn.navfocus,.drawer-close.navfocus,.modal-close.navfocus,.leader-confirm button.navfocus{outline:2px solid var(--pv-cyan)!important;outline-offset:2px!important;box-shadow:0 0 18px #8d5cff66!important;transform:translateY(-1px)}
  .affinity{position:relative}.affinity:after{content:"BEARER OF THE SPECTRUM";position:absolute;right:12px;top:9px;font:800 6px system-ui;letter-spacing:.14em;color:#d9c17f88}
  .context-box{border-color:#d8ba6c42!important;background:linear-gradient(145deg,#09152bde,#10142ee8)!important}
  @media(max-width:900px),(max-height:520px){body:before{inset:3px}.affinity:after{display:none}}
  `;
  const style=document.createElement('style');style.id='pv-party-live29e';style.textContent=STYLE;document.head.appendChild(style);

  const sfx=()=>window.parent!==window?(window.parent.PVMenuSFX||window.PVMenuSFX):window.PVMenuSFX;
  const selectors='.slot,.control-btn,.command,.return-btn,.drawer-close,.modal-close,.leader-confirm button';
  let current=null,last={u:false,d:false,l:false,r:false,a:false,b:false};
  function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'}
  function targets(){return [...document.querySelectorAll(selectors)].filter(visible)}
  function clearFocus(){document.querySelectorAll('.navfocus').forEach(x=>x.classList.remove('navfocus'))}
  function focusEl(el){if(!visible(el))return;clearFocus();current=el;el.classList.add('navfocus');if(!el.hasAttribute('tabindex'))el.tabIndex=-1;try{el.focus({preventScroll:true})}catch(_){el.focus?.()}}
  function center(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
  function spatial(dir){const list=targets();if(!list.length)return;if(!current||!visible(current)){focusEl(list[0]);return}const a=center(current);let best=null,bestScore=Infinity;for(const el of list){if(el===current)continue;const b=center(el),dx=b.x-a.x,dy=b.y-a.y;let primary,secondary;if(dir==='l'){if(dx>=-2)continue;primary=-dx;secondary=Math.abs(dy)}else if(dir==='r'){if(dx<=2)continue;primary=dx;secondary=Math.abs(dy)}else if(dir==='u'){if(dy>=-2)continue;primary=-dy;secondary=Math.abs(dx)}else{if(dy<=2)continue;primary=dy;secondary=Math.abs(dx)}const score=primary+secondary*1.65;if(score<bestScore){bestScore=score;best=el}}if(best){focusEl(best);sfx()?.play?.('move')}}
  function back(){const modal=document.getElementById('modal');if(modal?.classList.contains('open')){document.getElementById('modalClose')?.click();sfx()?.play?.('back');return}const drawer=document.getElementById('reserveDrawer');if(drawer?.classList.contains('open')){document.getElementById('reserveClose')?.click();sfx()?.play?.('back');return}const form=document.getElementById('formationBtn');if(form?.classList.contains('active')){form.click();sfx()?.play?.('back');return}document.getElementById('returnBtn')?.click()}
  function poll(){const p=navigator.getGamepads?.()[0];if(p){const st={u:!!p.buttons[12]?.pressed||(p.axes?.[1]??0)<-.58,d:!!p.buttons[13]?.pressed||(p.axes?.[1]??0)>.58,l:!!p.buttons[14]?.pressed||(p.axes?.[0]??0)<-.58,r:!!p.buttons[15]?.pressed||(p.axes?.[0]??0)>.58,a:!!p.buttons[0]?.pressed,b:!!p.buttons[1]?.pressed};if(st.l&&!last.l)spatial('l');else if(st.r&&!last.r)spatial('r');else if(st.u&&!last.u)spatial('u');else if(st.d&&!last.d)spatial('d');else if(st.a&&!last.a){if(current&&visible(current)){sfx()?.play?.('confirm');current.click()}}else if(st.b&&!last.b)back();last=st}requestAnimationFrame(poll)}
  document.addEventListener('focusin',e=>{const el=e.target?.closest?.(selectors);if(el&&visible(el)){current=el;clearFocus();el.classList.add('navfocus')}});
  document.addEventListener('click',e=>{const el=e.target?.closest?.(selectors);if(el&&visible(el))focusEl(el)},true);
  addEventListener('gamepadconnected',()=>{const first=document.querySelector('.slot.selected')||targets()[0];focusEl(first);sfx()?.unlock?.()});
  poll();
})();
