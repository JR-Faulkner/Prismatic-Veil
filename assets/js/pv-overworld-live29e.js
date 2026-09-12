(()=>{
  const STYLE=`
  :root{--pv-gold:#e7c66f;--pv-cyan:#8cecff;--pv-violet:#9b67ff;--pv-night:#06112b}
  body:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:2;background:radial-gradient(circle at 50% 45%,transparent 42%,#02061166 100%);box-shadow:inset 0 0 80px #02040bbb}
  .hero-card,.tab,.hotspot,button{transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease,filter .14s ease}
  .hero-card{border-color:#d8ba6c88!important;background:linear-gradient(145deg,#08162de8,#10183ae0)!important;box-shadow:inset 0 0 0 1px #ffffff09,0 10px 26px #0009!important}
  .hero-card.front{border-color:#f2d784cc!important;box-shadow:inset 0 0 0 1px #fff3b733,0 0 24px rgba(var(--leader-rgb),.24),0 12px 28px #000b!important}
  .hero-name,.hero-card strong{letter-spacing:.08em}
  .tab{border-color:#bda15f80!important;background:linear-gradient(180deg,#0b1734e8,#071027ed)!important;box-shadow:inset 0 0 0 1px #ffffff08,0 5px 14px #0008!important}
  .tab:hover,.tab:focus-visible,.tab.navfocus{transform:translateY(-2px);border-color:#f0d27acc!important;box-shadow:inset 0 0 0 1px #fff2bf22,0 0 16px #8d5cff55,0 8px 18px #000b!important}
  .hotspot{filter:drop-shadow(0 0 8px #70dfff44)}
  .hotspot:hover,.hotspot:focus-visible,.hotspot.navfocus{filter:drop-shadow(0 0 14px #9d6cff99) brightness(1.1)}
  button:not(.pv-music-toggle){border-color:#c9aa6288!important;box-shadow:inset 0 0 0 1px #ffffff09,0 5px 16px #0007}
  button:not(.pv-music-toggle):focus-visible,.navfocus{outline:2px solid var(--pv-cyan)!important;outline-offset:2px!important;box-shadow:0 0 20px #8d5cff66!important}
  .pv-music-toggle{border-color:#e2c36caa!important;box-shadow:0 5px 18px #0009,0 0 18px #8d5cff33!important}
  `;
  const style=document.createElement('style');style.id='pv-live29e-identity';style.textContent=STYLE;document.head.appendChild(style);

  function silenceLegacy(){
    const a=window.PV_HR7_AUDIO;
    if(!a?.sfx)return false;
    Object.values(a.sfx).forEach(x=>{try{x.volume=0;x.pause?.()}catch(e){}});
    return true;
  }
  let tries=0;const timer=setInterval(()=>{if(silenceLegacy()||++tries>40)clearInterval(timer)},50);

  const unlock=()=>window.PVMenuSFX?.unlock?.();
  addEventListener('pointerdown',unlock,{once:true,capture:true});
  addEventListener('keydown',unlock,{once:true,capture:true});
  addEventListener('touchstart',unlock,{once:true,capture:true,passive:true});

  function classify(t){
    if(!t)return null;
    if(t.closest?.('#pvMusicToggle'))return 'confirm';
    const x=t.closest?.('.hotspot,.tab,#travelButton,#clearButton,#closeModal,.close,[data-front],[data-setfront],#saveNow,button');
    if(!x)return t.id==='overlay'?'back':null;
    if(x.matches?.('.hotspot'))return x.dataset.location==='rift'?'locked':'move';
    if(x.matches?.('.tab'))return 'tab';
    if(x.id==='closeModal'||x.classList?.contains('close'))return 'back';
    if(x.disabled||x.getAttribute?.('aria-disabled')==='true')return 'locked';
    if(x.id==='travelButton'&&/locked/i.test(x.textContent||''))return 'locked';
    return 'confirm';
  }
  document.addEventListener('click',e=>{const k=classify(e.target);if(k)window.PVMenuSFX?.play?.(k)},true);

  let navIndex=0,lastPad={u:false,d:false,l:false,r:false,a:false,b:false};
  function visible(el){const s=getComputedStyle(el);const r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&s.pointerEvents!=='none'&&r.width>1&&r.height>1&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'}
  function navTargets(){return [...document.querySelectorAll('.hotspot,.tab,#travelButton,#clearButton,#closeModal,.close,[data-front],[data-setfront],#saveNow,button')].filter(visible)}
  function navFocus(i=navIndex){const t=navTargets();document.querySelectorAll('.navfocus').forEach(x=>x.classList.remove('navfocus'));if(!t.length)return;navIndex=(i+t.length)%t.length;const el=t[navIndex];if(!el.hasAttribute('tabindex'))el.tabIndex=-1;el.classList.add('navfocus');try{el.focus({preventScroll:true})}catch(e){el.focus?.()}}
  function navMove(d){navFocus(navIndex+d);window.PVMenuSFX?.play?.('move')}
  function navBack(){const x=document.querySelector('#closeModal:not([disabled]),.close:not([disabled])');if(x&&visible(x)){x.click();return}const ev=new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});document.dispatchEvent(ev)}
  function pads(){
    const p=navigator.getGamepads?.()[0];
    if(p){
      const st={u:!!p.buttons[12]?.pressed||(p.axes?.[1]??0)<-.58,d:!!p.buttons[13]?.pressed||(p.axes?.[1]??0)>.58,l:!!p.buttons[14]?.pressed||(p.axes?.[0]??0)<-.58,r:!!p.buttons[15]?.pressed||(p.axes?.[0]??0)>.58,a:!!p.buttons[0]?.pressed,b:!!p.buttons[1]?.pressed};
      if((st.r&&!lastPad.r)||(st.d&&!lastPad.d))navMove(1);
      else if((st.l&&!lastPad.l)||(st.u&&!lastPad.u))navMove(-1);
      else if(st.a&&!lastPad.a){const t=navTargets();navFocus(navIndex);t[navIndex]?.click?.()}
      else if(st.b&&!lastPad.b)navBack();
      lastPad=st;
    }
    requestAnimationFrame(pads);
  }
  addEventListener('gamepadconnected',()=>navFocus(0));pads();
})();
