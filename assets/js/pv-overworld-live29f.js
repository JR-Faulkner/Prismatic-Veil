(()=>{
  'use strict';
  const LOCATION='echo';
  const CLEAR_KEY=`pv.locationClear.${LOCATION}`;
  const RESULT_KEY='pv.encounterResult';
  const PENDING_KEY='pv.pendingEncounter';

  const style=document.createElement('style');
  style.id='pv-live29f-overworld';
  style.textContent=`
    .hotspot[data-location="echo"].pv-cleared{filter:drop-shadow(0 0 13px #77ffd388) brightness(1.08)!important}
    .hotspot[data-location="echo"].pv-cleared:after{content:"✓";position:absolute;right:-7px;top:-8px;display:grid;place-items:center;width:20px;height:20px;border:1px solid #e7ca76;border-radius:50%;background:#071a23;color:#8effd2;font:900 11px system-ui;box-shadow:0 0 13px #6dffd366}
    .pv-encounter-curtain{position:fixed;inset:0;z-index:9998;display:grid;place-items:center;background:radial-gradient(circle at 50% 48%,#263469dd,#070916f7 64%);opacity:0;transition:opacity .22s ease;pointer-events:none}
    .pv-encounter-curtain.show{opacity:1}
    .pv-encounter-card{min-width:min(460px,72vw);padding:18px 28px;border:1px solid #e1c46f99;clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px),0 12px);background:linear-gradient(150deg,#101d3cf2,#080c1df5);text-align:center;box-shadow:0 18px 50px #000c,0 0 35px #805dff33}
    .pv-encounter-card b{display:block;color:#f4d77d;font:900 clamp(15px,2.5vw,24px) Georgia,serif;letter-spacing:.15em}.pv-encounter-card span{display:block;margin-top:7px;color:#b9cae8;font:800 8px system-ui;letter-spacing:.2em;text-transform:uppercase}
    .pv-return-toast{position:fixed;left:50%;top:10%;z-index:9997;transform:translate(-50%,-14px);opacity:0;transition:.24s ease;min-width:min(440px,78vw);padding:11px 18px;border:1px solid #e3c77288;background:#081127f3;color:#f6df99;text-align:center;box-shadow:0 12px 30px #000a,0 0 22px #6e5cff33;pointer-events:none;clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)}.pv-return-toast.show{opacity:1;transform:translate(-50%,0)}
    .pv-return-toast b{display:block;color:#f6df99;font:900 10px system-ui;letter-spacing:.14em}.pv-return-toast span{display:block;margin-top:5px;color:#b9d7ee;font:800 7px system-ui;letter-spacing:.10em}
    .pv-return-toast.defeat{border-color:#a283c688;color:#d9c7ed;box-shadow:0 12px 30px #000a,0 0 22px #8b5cff2e}.pv-return-toast.defeat b{color:#d9c7ed}
  `;
  document.head.appendChild(style);

  const safeParse=raw=>{try{return raw?JSON.parse(raw):null}catch(_){return null}};
  const isCleared=()=>localStorage.getItem(CLEAR_KEY)==='1';
  const echoNode=()=>document.querySelector('.hotspot[data-location="echo"]');

  function syncClearMarker(){echoNode()?.classList.toggle('pv-cleared',isCleared())}
  function patchEchoPanel(){
    if(!isCleared()||!echoNode()?.classList.contains('sel'))return;
    const objective=document.getElementById('objectiveText');
    const state=document.getElementById('locationState');
    const desc=document.getElementById('locationDesc');
    const meta=document.getElementById('locationMeta');
    const travel=document.getElementById('travelButton');
    if(objective)objective.textContent='Echo Playground is stabilized. Revisit the encounter or choose another route.';
    if(state)state.textContent='Cleared';
    if(desc)desc.textContent='The Veil disturbance here has been beaten back. The route remains open for a rematch.';
    if(meta)meta.innerHTML='<span>Cleared</span><span>Route Stable</span><span>Revisit</span>';
    if(travel&&!travel.disabled)travel.textContent='Revisit Encounter';
  }

  function curtain(mode){
    const el=document.createElement('div');el.className='pv-encounter-curtain';
    el.innerHTML=`<div class="pv-encounter-card"><b>ECHO PLAYGROUND</b><span>${mode==='first-clear'?'First-Clear Encounter':'Resonance Rematch'}</span></div>`;
    document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));return el;
  }
  function rewardLine(result){
    const p=result?.payout;if(!p?.awarded)return '';
    const bits=[];
    if(Number(p.xpEach)>0)bits.push(`+${Number(p.xpEach)} XP × ${(p.bearers||[]).length||3} BEARERS`);
    const items=p.items||{};
    if(Number(items.veilShard)>0)bits.push(`VEIL SHARD ×${Number(items.veilShard)}`);
    if(Number(items.memoryFragment)>0)bits.push(`MEMORY FRAGMENT ×${Number(items.memoryFragment)}`);
    return bits.join('  ·  ');
  }
  function toast(result){
    const el=document.createElement('div');el.className='pv-return-toast';
    const headline=document.createElement('b');
    const detail=document.createElement('span');
    if(result?.result==='defeat'){
      el.classList.add('defeat');
      headline.textContent='ROUTE RETREAT · ECHO PLAYGROUND REMAINS UNSTABLE';
      detail.textContent='NO REWARDS AWARDED';
    }else{
      headline.textContent=result?.firstClear?'FIRST CLEAR COMPLETE · ECHO PLAYGROUND STABILIZED':'ENCOUNTER CLEARED · ECHO PLAYGROUND';
      detail.textContent=rewardLine(result)||'PROGRESSION RECORDED';
    }
    el.append(headline,detail);
    document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300)},2800);
  }

  async function enterEcho(){
    const mode=isCleared()?'revisit':'first-clear';
    try{localStorage.setItem(PENDING_KEY,JSON.stringify({locationId:LOCATION,mode,enteredAt:Date.now()}))}catch(_){}
    curtain(mode);
    let entry='./hybrid-main.html';
    try{
      const r=await fetch(`./live-build.json?ts=${Date.now()}`,{cache:'no-store'});
      if(r.ok){const build=await r.json();if(build.hybrid)entry=`./${build.hybrid}`}
    }catch(_){}
    const q=new URLSearchParams({pvloc:LOCATION,pvencounter:mode});
    setTimeout(()=>{location.href=`${entry}?${q.toString()}`},520);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('.hotspot[data-location="echo"]'))setTimeout(()=>{syncClearMarker();patchEchoPanel()},0);
  },false);

  document.addEventListener('click',e=>{
    const travel=e.target.closest?.('#travelButton');
    if(!travel||travel.disabled)return;
    const selected=document.querySelector('.hotspot.sel');
    if(selected?.dataset?.location!==LOCATION)return;
    e.preventDefault();e.stopImmediatePropagation();
    enterEcho();
  },true);

  syncClearMarker();
  const params=new URLSearchParams(location.search);
  if(params.get('pvreturn')===LOCATION){
    const result=safeParse(localStorage.getItem(RESULT_KEY))||{result:params.get('pvresult')||'unknown',firstClear:false};
    setTimeout(()=>{
      syncClearMarker();
      echoNode()?.click();
      setTimeout(patchEchoPanel,0);
      toast(result);
      try{localStorage.removeItem(RESULT_KEY)}catch(_){}
    },80);
  }
})();
