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
  function center(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
  function navMoveSpatial(dir){
    const t=navTargets();if(!t.length)return;
    navIndex=Math.max(0,Math.min(navIndex,t.length-1));
    const from=t[navIndex]||t[0],a=center(from);
    let best=-1,bestScore=Infinity;
    for(let i=0;i<t.length;i++){
      if(i===navIndex)continue;
      const b=center(t[i]),dx=b.x-a.x,dy=b.y-a.y;
      const primary=dir==='l'?-dx:dir==='r'?dx:dir==='u'?-dy:dy;
      if(primary<=4)continue;
      const cross=(dir==='l'||dir==='r')?Math.abs(dy):Math.abs(dx);
      const score=primary+cross*2.35;
      if(score<bestScore){bestScore=score;best=i}
    }
    if(best>=0){navFocus(best);window.PVMenuSFX?.play?.('move')}
  }
  function navBack(){const x=document.querySelector('#closeModal:not([disabled]),.close:not([disabled])');if(x&&visible(x)){x.click();return}const ev=new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});document.dispatchEvent(ev)}
  function pads(){
    const p=navigator.getGamepads?.()[0];
    if(p){
      const st={u:!!p.buttons[12]?.pressed||(p.axes?.[1]??0)<-.58,d:!!p.buttons[13]?.pressed||(p.axes?.[1]??0)>.58,l:!!p.buttons[14]?.pressed||(p.axes?.[0]??0)<-.58,r:!!p.buttons[15]?.pressed||(p.axes?.[0]??0)>.58,a:!!p.buttons[0]?.pressed,b:!!p.buttons[1]?.pressed};
      if(st.r&&!lastPad.r)navMoveSpatial('r');
      else if(st.l&&!lastPad.l)navMoveSpatial('l');
      else if(st.d&&!lastPad.d)navMoveSpatial('d');
      else if(st.u&&!lastPad.u)navMoveSpatial('u');
      else if(st.a&&!lastPad.a){const t=navTargets();navFocus(navIndex);t[navIndex]?.click?.()}
      else if(st.b&&!lastPad.b)navBack();
      lastPad=st;
    }
    requestAnimationFrame(pads);
  }
  addEventListener('gamepadconnected',()=>navFocus(0));pads();
})();

(()=>{
  const EXTRA=`
  body{background:#030815!important}
  body:after{content:"";position:fixed;inset:7px;z-index:69;pointer-events:none;border:1px solid #d9bd6f42;clip-path:polygon(0 18px,18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px));box-shadow:inset 0 0 42px #7657ff18,0 0 20px #0008}
  .map-plate{filter:saturate(1.08) contrast(1.03) brightness(.96)!important;box-shadow:0 0 0 1px #d8b95b55,0 0 38px #5f50cf22!important}
  .hero-card{position:relative;overflow:hidden!important;clip-path:polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px))!important}
  .hero-card:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,transparent 18%,#9ee8ff10 42%,transparent 64%);transform:translateX(-70%);transition:transform .28s ease}
  .hero-card:hover:before,.hero-card.navfocus:before{transform:translateX(70%)}
  .tab{position:relative;overflow:hidden;clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)!important;text-transform:uppercase!important;letter-spacing:.12em!important}
  .tab:before{content:"✦";margin-right:6px;color:#dfc472;opacity:.8;font-size:.8em}
  #travelButton,#clearButton,#saveNow{clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)!important;text-transform:uppercase!important;letter-spacing:.1em!important}
  .hotspot{transform-origin:center;transition:transform .16s ease,filter .16s ease!important}.hotspot.navfocus{transform:scale(1.08)!important}
  .pv-spectrum-corners{position:fixed;inset:0;z-index:68;pointer-events:none}
  .pv-spectrum-corners i{position:absolute;width:42px;height:42px;border-color:#dfc26d88;border-style:solid;filter:drop-shadow(0 0 8px #866dff44)}
  .pv-spectrum-corners i:nth-child(1){left:9px;top:9px;border-width:1px 0 0 1px}.pv-spectrum-corners i:nth-child(2){right:9px;top:9px;border-width:1px 1px 0 0}.pv-spectrum-corners i:nth-child(3){right:9px;bottom:9px;border-width:0 1px 1px 0}.pv-spectrum-corners i:nth-child(4){left:9px;bottom:9px;border-width:0 0 1px 1px}
  .pv-spectrum-mark{position:fixed;left:50%;top:9px;z-index:69;transform:translateX(-50%);pointer-events:none;padding:2px 11px 4px;border-left:1px solid #d8b75d55;border-right:1px solid #d8b75d55;color:#e8ce86cc;font:800 7px/1 system-ui;letter-spacing:.32em;text-transform:uppercase;text-shadow:0 0 8px #946bff66}
  @media(max-width:800px),(max-height:500px){body:after{inset:4px}.pv-spectrum-corners i{width:28px;height:28px}.pv-spectrum-mark{top:5px;font-size:6px}}
  `;
  const s=document.createElement('style');s.id='pv-live29e-spectrum-frame';s.textContent=EXTRA;document.head.appendChild(s);
  if(!document.querySelector('.pv-spectrum-corners')){
    const corners=document.createElement('div');corners.className='pv-spectrum-corners';corners.innerHTML='<i></i><i></i><i></i><i></i>';
    document.body.appendChild(corners);
    const mark=document.createElement('div');mark.className='pv-spectrum-mark';mark.textContent='Bearers of the Spectrum';document.body.appendChild(mark);
  }
})();
