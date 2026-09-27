(()=>{
  'use strict';
  if(window.__PV_OVERWORLD30H__)return;
  window.__PV_OVERWORLD30H__=true;

  const STYLE=`
  :root{--pv30h-gold:#ffe7a0;--pv30h-gold2:#fff7cf;--pv30h-cyan:#8cefff;--pv30h-violet:#ae82ff}
  .pv30-node.sel,.pv30-node.navfocus,.pv30-node.pv30h-focus{z-index:30!important}
  .pv30-node.sel .pv30-glyph{border:2px solid var(--pv30h-gold2)!important;background:radial-gradient(circle at 32% 28%,#fff6c4 0 8%,#eed37c 9% 17%,#5641b0 42%,#07152d 76%)!important;transform:rotate(45deg) scale(1.25)!important;box-shadow:0 0 0 3px #061126,0 0 0 5px #ffe39a,0 0 18px #ffed9b,0 0 38px #74edff,0 0 60px #986cff!important;animation:pv30hCore 1.6s ease-in-out infinite}
  .pv30-node.sel .pv30-glyph:before{inset:-12px!important;border:2px solid var(--pv30h-gold)!important;opacity:1!important;box-shadow:0 0 12px #ffe69b,0 0 28px #7cecff,0 0 42px #9b6cff!important;animation:pv30hRing 1.45s ease-in-out infinite!important}
  .pv30-node.sel .pv30-glyph:after{content:"";position:absolute;inset:-21px;border:1px solid #8cefffaa;border-radius:50%;box-shadow:0 0 20px #8cefff88,0 0 34px #a477ff55;animation:pv30hOrbit 2.7s linear infinite;pointer-events:none}
  .pv30-node.sel .pv30-name{top:calc(100% + 15px)!important;padding:5px 10px!important;border:2px solid var(--pv30h-gold)!important;background:linear-gradient(180deg,#172c53f5,#070f24f5)!important;color:#fff5c7!important;font-size:clamp(8px,1.12vw,12px)!important;letter-spacing:.08em!important;text-shadow:0 0 9px #ffe99c!important;box-shadow:0 0 0 2px #071126,0 0 17px #8cefff99,0 0 28px #996dff66,0 7px 15px #000c!important}
  .pv30-node.sel .pv30-name:before{content:"SELECTED STAGE";display:block;margin:-1px 0 3px;color:var(--pv30h-cyan);font:900 clamp(5px,.58vw,7px)/1 system-ui;letter-spacing:.22em;text-align:center}
  .pv30-node.navfocus:not(.sel) .pv30-glyph,.pv30-node.pv30h-focus:not(.sel) .pv30-glyph{border:2px solid var(--pv30h-cyan)!important;transform:rotate(45deg) scale(1.17)!important;box-shadow:0 0 0 3px #061126,0 0 15px #8cefff,0 0 31px #916dff!important;animation:pv30hFocus 1.1s ease-in-out infinite}
  .pv30-node.navfocus:not(.sel) .pv30-glyph:before,.pv30-node.pv30h-focus:not(.sel) .pv30-glyph:before{inset:-10px!important;border:2px solid #8cefff!important;opacity:.95!important;box-shadow:0 0 19px #8cefff99!important}
  .pv30-node.navfocus:not(.sel) .pv30-name,.pv30-node.pv30h-focus:not(.sel) .pv30-name{border-color:var(--pv30h-cyan)!important;color:#e9fbff!important;box-shadow:0 0 15px #8cefff77,0 5px 12px #000b!important}
  .pv30h-readout{position:relative;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px;margin:0 0 7px;padding:7px 9px;border:2px solid var(--pv30h-gold);background:linear-gradient(105deg,#132d58f5,#07142de8 72%);clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px);box-shadow:0 0 0 2px #071126,0 0 18px #ffe28a88,0 0 32px #78eaff66,inset 0 0 18px #9b70ff29}
  .pv30h-readout:before{content:"◈";display:grid;place-items:center;width:21px;height:21px;color:#fff2b1;font:900 12px Georgia;border:1px solid #8cefff;background:linear-gradient(145deg,#8060e8,#172f65);transform:rotate(45deg);text-shadow:0 0 8px #8cefff;box-shadow:0 0 12px #8cefff99}
  .pv30h-readout:after{content:"";position:absolute;inset:-3px;border:1px solid #8cefff66;pointer-events:none;animation:pv30hReadout 1.8s ease-in-out infinite}
  .pv30h-readout span{display:block;color:var(--pv30h-cyan);font:900 6px/1.1 system-ui;letter-spacing:.2em;text-transform:uppercase}
  .pv30h-readout strong{display:block;margin-top:3px;color:#fff3bd;font:700 clamp(11px,1.25vw,16px)/1.05 Georgia,serif;letter-spacing:.05em;text-shadow:0 0 9px #ffe79c}
  .right.chrome.pv30h-active{border-color:var(--pv30h-gold)!important;box-shadow:inset 0 0 0 2px #ffe39a33,0 0 0 2px #8cefff44,0 0 34px #8d5cff77,0 16px 42px #000c!important}
  .location-card.pv30h-active{box-shadow:inset 0 0 0 1px #ffe39a99,inset 0 0 24px #8665ff1f,0 0 20px #8cefff45!important}
  .location-card.pv30h-active h2{color:#fff2bd!important;text-shadow:0 0 12px #ffe79c,0 0 24px #8cefff55!important}
  .location-card.pv30h-active .state{color:#8cefff!important;text-shadow:0 0 9px #8cefff!important}
  .right.chrome.pv30h-looking .pv30h-readout{border-color:var(--pv30h-cyan);box-shadow:0 0 0 2px #071126,0 0 20px #8cefff99,0 0 35px #9b70ff66,inset 0 0 18px #8cefff22}
  .right.chrome.pv30h-looking .pv30h-readout span{color:#fff1b0}
  .travel button.pv30h-active,#travelButton.pv30h-active{border-color:var(--pv30h-gold)!important;box-shadow:0 0 0 1px #fff2b644,0 0 19px #ffe28a99,0 0 33px #8cefff55!important;color:#fff5cd!important}
  @keyframes pv30hCore{0%,100%{filter:brightness(1);box-shadow:0 0 0 3px #061126,0 0 0 5px #ffe39a,0 0 18px #ffed9b,0 0 38px #74edff,0 0 60px #986cff}50%{filter:brightness(1.28);box-shadow:0 0 0 4px #061126,0 0 0 7px #fff0b0,0 0 27px #fff1a1,0 0 52px #74edff,0 0 76px #986cff}}
  @keyframes pv30hRing{50%{transform:rotate(225deg) scale(1.16);opacity:.55}}
  @keyframes pv30hOrbit{to{transform:rotate(360deg)}}
  @keyframes pv30hFocus{50%{filter:brightness(1.23);box-shadow:0 0 0 4px #061126,0 0 21px #8cefff,0 0 39px #996dff}}
  @keyframes pv30hReadout{50%{opacity:.35;transform:scale(1.01)}}
  @media(max-width:900px),(max-height:520px){.pv30-node.sel .pv30-name{top:calc(100% + 11px)!important;padding:4px 7px!important;font-size:8px!important}.pv30-node.sel .pv30-name:before{font-size:5px!important;letter-spacing:.16em}.pv30h-readout{gap:5px;margin-bottom:4px;padding:5px 6px}.pv30h-readout:before{width:17px;height:17px;font-size:10px}.pv30h-readout strong{font-size:11px}.pv30h-readout span{font-size:5px}}
  @media(prefers-reduced-motion:reduce){.pv30-node.sel .pv30-glyph,.pv30-node.sel .pv30-glyph:before,.pv30-node.sel .pv30-glyph:after,.pv30-node.navfocus:not(.sel) .pv30-glyph,.pv30h-readout:after{animation:none!important}}
  `;
  const style=document.createElement('style');style.id='pv-overworld-live30h-style';style.textContent=STYLE;document.head.appendChild(style);

  const map=document.querySelector('.map-wrap');
  const right=document.querySelector('.right.chrome');
  const card=right?.querySelector('.location-card');
  const preview=right?.querySelector('.pv30c-preview');
  const travel=document.getElementById('travelButton');
  if(!map||!right||!card)return;

  let readout=right.querySelector('.pv30h-readout');
  if(!readout){
    readout=document.createElement('div');
    readout.className='pv30h-readout';
    readout.setAttribute('role','status');
    readout.setAttribute('aria-live','polite');
    const kicker=right.querySelector('.side-kicker');
    if(kicker)kicker.after(readout);else right.prepend(readout);
  }
  const readoutState=document.createElement('span');
  const readoutName=document.createElement('strong');
  readout.append(readoutState,readoutName);

  function label(node){
    return node?.querySelector('.pv30-name')?.textContent?.trim()||node?.getAttribute('aria-label')?.replace(/,.*$/,'').trim()||'Unknown stage';
  }
  function focusNode(){
    return map.querySelector('.pv30-node.pv30h-focus')||map.querySelector('.pv30-node.navfocus')||map.querySelector('.pv30-node:focus-visible');
  }
  function selectedNode(){
    return map.querySelector('.pv30-node.sel')||focusNode();
  }
  function sync(){
    const selected=selectedNode();
    const looking=focusNode();
    const active=selected||looking;
    const isLooking=!!(looking&&selected&&looking!==selected);
    map.querySelectorAll('.pv30-node.pv30h-stage-selected').forEach(n=>{if(n!==selected)n.classList.remove('pv30h-stage-selected')});
    if(selected&&!selected.classList.contains('pv30h-stage-selected'))selected.classList.add('pv30h-stage-selected');
    right.classList.toggle('pv30h-active',!!active);
    right.classList.toggle('pv30h-looking',isLooking);
    card.classList.toggle('pv30h-active',!!active);
    preview?.classList.toggle('pv30h-active',!!active);
    travel?.classList.toggle('pv30h-active',!!active&&!travel.disabled);
    if(active){
      readoutState.textContent=isLooking?'LOOKING AT':'SELECTED STAGE';
      readoutName.textContent=label(looking||selected);
    }else{
      readoutState.textContent='CHOOSE A STAGE';
      readoutName.textContent='No destination selected';
    }
  }
  function queue(){requestAnimationFrame(sync)}
  document.addEventListener('focusin',e=>{
    const node=e.target.closest?.('.pv30-node[data-location]');
    map.querySelectorAll('.pv30h-focus').forEach(n=>n.classList.remove('pv30h-focus'));
    if(node)node.classList.add('pv30h-focus');
    queue();
  },true);
  document.addEventListener('focusout',e=>{if(e.target.closest?.('.pv30-node[data-location]'))setTimeout(queue,0)},true);
  document.addEventListener('click',e=>{if(e.target.closest?.('.pv30-node[data-location],#clearButton,#travelButton'))setTimeout(queue,0)},true);
  const observer=new MutationObserver(queue);
  observer.observe(map,{subtree:true,attributes:true,attributeFilter:['class','aria-current']});
  queue();
  document.documentElement.dataset.pvOverworldSelection='LIVE30H';
})();
