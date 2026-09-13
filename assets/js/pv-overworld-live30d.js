(()=>{
  'use strict';
  if(window.__PV_OVERWORLD30D__)return;
  window.__PV_OVERWORLD30D__=true;

  const SIGILS=Object.freeze({
    home:'⌂',echo:'✦',glassway:'◇',whisper:'❧',oldwater:'⌁',rift:'◈'
  });
  const RISK=Object.freeze({
    home:['SANCTUARY','LOW'],
    echo:['RESONANCE','MODERATE'],
    glassway:['SEALED ROUTE','UNKNOWN'],
    whisper:['VEIL ECHO','UNKNOWN'],
    oldwater:['DISTANT SIGNAL','UNKNOWN'],
    rift:['FRACTURE','EXTREME']
  });
  const STYLE=`
  :root{--pv30d-gold:#efd284;--pv30d-cyan:#83ecff;--pv30d-violet:#a875ff;--pv30d-deep:#030711}
  .map-wrap:before{content:"";position:absolute;inset:-12%;z-index:3;pointer-events:none;background:
    radial-gradient(circle at 22% 28%,#8ee9ff12 0 1px,transparent 1.8px),
    radial-gradient(circle at 66% 21%,#fff0ad16 0 1px,transparent 1.8px),
    radial-gradient(circle at 83% 61%,#9d6cff14 0 1px,transparent 1.8px),
    radial-gradient(circle at 43% 76%,#8ee9ff10 0 1px,transparent 1.8px);background-size:160px 135px,210px 175px,185px 155px,225px 195px;animation:pv30dDrift 22s linear infinite;opacity:.68}
  @keyframes pv30dDrift{to{transform:translate3d(-34px,22px,0)}}
  .pv30-node .pv30-glyph{position:relative;overflow:visible!important}
  .pv30-node .pv30-glyph:before{content:"";position:absolute;inset:-6px;border:1px solid #8beaff22;transform:rotate(45deg);opacity:.55;transition:.18s ease}
  .pv30-node.sel .pv30-glyph:before{inset:-10px;border-color:#ffe39f8f;box-shadow:0 0 14px #8beaff55,0 0 25px #9b66ff55;animation:pv30dSigil 1.45s ease-in-out infinite}
  @keyframes pv30dSigil{50%{transform:rotate(45deg) scale(1.10);opacity:.35}}
  .pv30-route.active{stroke-dasharray:2.2 1.15!important;animation:pv30dRoute .72s linear infinite}
  @keyframes pv30dRoute{to{stroke-dashoffset:-6.7}}
  .pv30c-preview{isolation:isolate}
  .pv30c-preview:before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(115deg,transparent 18%,#8feaff16 39%,#ffe29a18 48%,transparent 64%);transform:translateX(-120%);animation:pv30dScan 5.6s ease-in-out infinite}
  @keyframes pv30dScan{0%,60%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}
  .pv30d-sigil{display:grid;place-items:center;position:absolute;right:8px;top:8px;width:25px;height:25px;z-index:3;border:1px solid #e5c66f77;background:#06142dd9;color:#f7e2a4;font:700 13px Georgia;transform:rotate(45deg);box-shadow:0 0 12px #795cff33}.pv30d-sigil span{transform:rotate(-45deg)}
  .pv30d-flavor{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:7px 8px;margin-top:7px;border:1px solid #d5b76a36;background:linear-gradient(90deg,#07142bc4,#08102394);clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}
  .pv30d-flavor b{display:block;color:#a9bbd7;font:800 5.5px system-ui;letter-spacing:.16em}.pv30d-flavor strong{display:block;margin-top:2px;color:#f0d58d;font:700 7px system-ui;letter-spacing:.08em}.pv30d-risk{justify-self:end;padding:3px 6px;border:1px solid #8cecff45;border-radius:999px;color:#cfefff;font:800 5.7px system-ui;letter-spacing:.12em;white-space:nowrap}
  .right.chrome:before{display:block!important;content:""!important;position:absolute;inset:7px!important;pointer-events:none!important;border:1px solid #83eaff0e!important;clip-path:polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)!important}
  .bottom.chrome{overflow:visible!important}
  .tab{position:relative!important}.tab:after{content:"";position:absolute;left:18%;right:18%;bottom:6px;height:1px;background:linear-gradient(90deg,transparent,#8aeaff88,#f0cf7f99,#8aeaff88,transparent);transform:scaleX(0);transition:transform .18s ease}.tab:hover:after,.tab.navfocus:after,.tab:focus-visible:after{transform:scaleX(1)}
  @media(max-width:1000px),(max-height:600px){.pv30d-flavor{padding:4px 5px;margin-top:4px}.pv30d-flavor b{font-size:4.8px}.pv30d-flavor strong,.pv30d-risk{font-size:5.2px}.pv30d-sigil{width:20px;height:20px;font-size:10px}}
  @media(prefers-reduced-motion:reduce){.map-wrap:before,.pv30-node.sel .pv30-glyph:before,.pv30-route.active,.pv30c-preview:before{animation:none!important}}
  `;
  const style=document.createElement('style');style.id='pv-overworld-live30d-style';style.textContent=STYLE;document.head.appendChild(style);

  const preview=document.querySelector('.pv30c-preview');
  if(preview&&!preview.querySelector('.pv30d-sigil')){
    const sig=document.createElement('div');sig.className='pv30d-sigil';sig.innerHTML='<span>✦</span>';preview.appendChild(sig);
  }
  const right=document.querySelector('.right.chrome');
  let flavor=right?.querySelector('.pv30d-flavor');
  const card=right?.querySelector('.location-card');
  if(right&&card&&!flavor){
    flavor=document.createElement('div');flavor.className='pv30d-flavor';
    const data=right.querySelector('.pv30c-data');
    if(data)right.insertBefore(flavor,data);else card.after(flavor);
  }

  function decorateNodes(){
    document.querySelectorAll('.pv30-node[data-location]').forEach(node=>{
      const id=node.dataset.location;
      const icon=node.querySelector('.pv30-glyph i');
      if(icon&&SIGILS[id])icon.textContent=SIGILS[id];
    });
  }
  function render(){
    decorateNodes();
    const api=window.PV_OVERWORLD30A;if(!api)return;
    const id=api.selected||'home',loc=api.locations?.[id];if(!loc)return;
    const sig=preview?.querySelector('.pv30d-sigil span');if(sig)sig.textContent=SIGILS[id]||'✦';
    const [kind,risk]=RISK[id]||['VEIL SIGNAL','UNKNOWN'];
    if(flavor)flavor.innerHTML=`<div><b>RESONANCE PROFILE</b><strong>${kind}</strong></div><span class="pv30d-risk">${risk}</span>`;
  }
  document.addEventListener('click',e=>{if(e.target.closest?.('.pv30-node,#clearButton,#travelButton,.tab'))setTimeout(render,0)},false);
  const name=document.getElementById('locationName');if(name)new MutationObserver(render).observe(name,{childList:true,subtree:true,characterData:true});
  render();
  document.documentElement.dataset.pvOverworld='LIVE30D';
})();
