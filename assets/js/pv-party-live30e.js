(()=>{
  'use strict';
  if(window.__PV_PARTY30E__)return;
  window.__PV_PARTY30E__=true;

  const STYLE=`
    .pv30e-progress{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center;margin-top:9px;padding:7px 8px;border:1px solid #d9b86c38;background:linear-gradient(90deg,#061126c9,#0b1430a8);clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}
    .pv30e-progress .xp b,.pv30e-loot b{display:block;color:#8799b7;font:800 5px system-ui;letter-spacing:.15em;text-transform:uppercase}.pv30e-progress .xp strong{display:block;margin-top:2px;color:#f2d68e;font:800 10px system-ui;letter-spacing:.05em}.pv30e-progress .curve{align-self:stretch;display:grid;place-items:center;padding:0 6px;border-left:1px solid #d8b86c24;border-right:1px solid #d8b86c24;color:#95abc9;font:800 5.2px system-ui;letter-spacing:.10em;text-align:center;max-width:86px}.pv30e-loot{display:grid;grid-template-columns:auto auto;gap:4px 7px;align-items:center}.pv30e-loot b{grid-column:1/-1}.pv30e-loot span{color:#cfe8f8;font:800 6px system-ui;white-space:nowrap}.pv30e-loot i{font-style:normal;color:#f1d27f}
    .pv30e-growth-note{margin-top:10px;padding:8px 9px;border:1px solid #7ddfff2d;background:#061226b8;color:#aabbd5;font:700 9px/1.4 system-ui}.pv30e-growth-note b{color:#efd17e}.pv30e-growth-note strong{color:#dff7ff}
    @media(max-width:900px),(max-height:520px){.pv30e-progress{margin-top:5px;padding:4px 5px;gap:4px}.pv30e-progress .xp strong{font-size:8px}.pv30e-progress .curve{font-size:4.5px;max-width:68px}.pv30e-loot span{font-size:5px}}
  `;
  const style=document.createElement('style');style.id='pv-party-live30e-style';style.textContent=STYLE;document.head.appendChild(style);

  let progression=null;
  let lastSig='';
  const moduleUrl=new URL('./src/progression/PVProgression.js?v=live30e1',document.baseURI).href;
  const currentId=()=>document.querySelector('.slot.selected')?.dataset.character||localStorage.getItem('pv.partySelected')||'prismel';

  async function authority(){
    if(progression)return progression;
    progression=await import(moduleUrl);
    return progression;
  }

  function ensureStrip(){
    const identity=document.querySelector('.identity');if(!identity)return null;
    let strip=identity.querySelector('.pv30e-progress');
    if(!strip){strip=document.createElement('div');strip.className='pv30e-progress';identity.appendChild(strip)}
    return strip;
  }

  function decorateGrowthModal(state,id){
    const modal=document.getElementById('modal');
    const title=document.getElementById('modalTitle')?.textContent?.trim().toUpperCase();
    const body=document.getElementById('modalBody');
    if(!modal?.classList.contains('open')||title!=='GROWTH'||!body)return;
    let note=body.querySelector('.pv30e-growth-note');
    if(!note){note=document.createElement('div');note.className='pv30e-growth-note';body.appendChild(note)}
    const hero=state.heroes?.[id]||{xp:0,level:null};
    note.innerHTML=`<b>PROGRESSION BANK</b><br><strong>${Number(hero.xp||0).toLocaleString()} XP</strong> banked for this Bearer. Level curve and player-directed per-level point quantities remain pending the production balance lock; earned XP will carry forward when that curve is assigned.`;
  }

  async function render(){
    try{
      const api=await authority();
      const state=api.loadProgression();
      const id=currentId(),hero=state.heroes?.[id]||{xp:0,level:null},inv=state.inventory||{};
      const sig=[id,hero.xp,hero.level,inv.veilShard,inv.memoryFragment,state.tuningRevision].join('|');
      const strip=ensureStrip();
      if(strip&&sig!==lastSig){
        lastSig=sig;
        strip.innerHTML=`<div class="xp"><b>XP Banked</b><strong>${Number(hero.xp||0).toLocaleString()} XP</strong></div><div class="curve">${state.levelCurveLocked&&hero.level?`LEVEL ${hero.level}`:'LEVEL CURVE PENDING'}</div><div class="pv30e-loot"><b>Party Finds</b><span>SHARD <i>×${Number(inv.veilShard||0)}</i></span><span>MEMORY <i>×${Number(inv.memoryFragment||0)}</i></span></div>`;
      }
      decorateGrowthModal(state,id);
      document.documentElement.dataset.pvPartyProgression='LIVE30E';
    }catch(err){console.warn('[PV] Party progression readout unavailable',err)}
  }

  const observer=new MutationObserver(()=>queueMicrotask(render));
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>queueMicrotask(render),true);
  addEventListener('storage',e=>{if(e.key==='pv.progression.v1')render()});
  render();
})();
