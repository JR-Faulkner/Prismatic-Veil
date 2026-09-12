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
  .pv-growth-kicker{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
  .pv-growth-kicker small{font:800 6px system-ui;letter-spacing:.11em;color:#8295b8;text-transform:uppercase}
  .pv-growth-stars{font-size:9px!important;letter-spacing:.04em!important;color:#f0cf7b!important;white-space:nowrap;text-shadow:0 0 8px #e3bb5a29}
  .pv-growth-pending{font-size:8px!important;letter-spacing:.08em!important;color:#8597b8!important;text-transform:uppercase}
  .mini-stat span.pv-meta{font-size:10px!important;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .context-body b{color:#ecd083;font-weight:850}
  .pv-modal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}
  .pv-modal-cell{border:1px solid #d8ba6c3a;background:#071226cc;padding:8px 9px}
  .pv-modal-cell b{display:block;font-size:8px;letter-spacing:.12em;color:#92a9cf;text-transform:uppercase;margin-bottom:4px}
  .pv-modal-cell span{font-size:11px;color:#edf5ff}
  .pv-growth-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 10px;margin-top:9px}
  .pv-growth-row{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #7d90aa22;padding:3px 0;font-size:10px}
  .pv-growth-row b{color:#b7c8e5;font-weight:750}.pv-growth-row span{color:#efd17e;letter-spacing:.03em}
  @media(max-width:900px),(max-height:520px){body:before{inset:3px}.affinity:after{display:none}.pv-modal-grid{gap:5px}.pv-modal-cell{padding:6px}.pv-growth-list{gap:3px 7px}}
  `;
  const style=document.createElement('style');style.id='pv-party-live29e';style.textContent=STYLE;document.head.appendChild(style);

  const GROWTH=Object.freeze({
    prismel:Object.freeze({Might:1,Mind:5,Spirit:4,Agility:3,Resilience:2,Harmony:3}),
    kineza:Object.freeze({Might:5,Mind:2,Spirit:2,Agility:4,Resilience:4,Harmony:3}),
    auryi:Object.freeze({Might:1,Mind:4,Spirit:5,Agility:2,Resilience:3,Harmony:5})
  });
  const RESONART=Object.freeze({
    prismel:'Refracted-Reflections',
    kineza:'Thunder Tornado',
    auryi:'Aurora Pulse'
  });
  const ORDER=['Might','Mind','Spirit','Agility','Resilience','Harmony'];
  const stars=n=>'★'.repeat(Math.max(0,Number(n)||0))+'☆'.repeat(Math.max(0,5-(Number(n)||0)));
  const currentId=()=>document.querySelector('.slot.selected')?.dataset.character||localStorage.getItem('pv.partySelected')||'prismel';
  const slotFor=id=>document.querySelector(`.slot[data-character="${id}"]`)?.dataset.slot||'';
  const slotLabel=slot=>slot?.startsWith('field')?`FIELD ${slot.slice(-1)}`:slot?.startsWith('support')?`SUPPORT ${slot.slice(-1)}`:'RESERVE';
  const isLeader=id=>document.querySelector(`.slot[data-character="${id}"]`)?.classList.contains('leader')||false;
  const affinity=()=>document.getElementById('affinityText')?.textContent?.trim()||'—';
  const title=()=>document.getElementById('charTitle')?.textContent?.trim()||'';
  const name=()=>document.getElementById('charName')?.textContent?.trim()||currentId().toUpperCase();
  function growthHtml(id){
    const g=GROWTH[id];
    if(!g)return '<div style="margin-top:9px;color:#91a2bf">Natural growth profile is not mechanically locked yet.</div>';
    return `<div class="pv-growth-list">${ORDER.map(stat=>`<div class="pv-growth-row"><b>${stat}</b><span>${stars(g[stat])}</span></div>`).join('')}</div>`;
  }
  let lastDataSig='';
  function syncPartyData(){
    const id=currentId(),slot=slotFor(id),leader=isLeader(id),g=GROWTH[id];
    const sig=[id,slot,leader?1:0,affinity(),title()].join('|');
    const firstMini=document.querySelector('.mini-stat b');
    const firstCore=document.querySelector('#coreGrid .core span');
    const alreadyEnhanced=firstMini?.textContent==='Formation'&&!!firstCore&&(firstCore.classList.contains('pv-growth-stars')||firstCore.classList.contains('pv-growth-pending'));
    if(sig===lastDataSig&&alreadyEnhanced)return;
    lastDataSig=sig;
    const mini=[...document.querySelectorAll('.mini-stat')];
    if(mini[0]){mini[0].querySelector('b').textContent='Formation';const v=mini[0].querySelector('span');v.textContent=slotLabel(slot);v.className='pv-meta'}
    if(mini[1]){mini[1].querySelector('b').textContent='Leader';const v=mini[1].querySelector('span');v.textContent=leader?'ACTIVE':'NO';v.className='pv-meta'}
    if(mini[2]){mini[2].querySelector('b').textContent='Growth';const v=mini[2].querySelector('span');v.textContent=g?'LOCKED':'PENDING';v.className='pv-meta'}
    const coreWrap=document.querySelector('.core-wrap');
    const kicker=coreWrap?.querySelector('.section-kicker');
    if(kicker){kicker.innerHTML='<span>Natural Growth</span><small style="float:right;color:#7488a7;font-size:6px;letter-spacing:.1em">CURRENT STATS PENDING LOCK</small>'}
    const cores=[...document.querySelectorAll('#coreGrid .core')];
    cores.forEach((cell,i)=>{const stat=ORDER[i],v=cell.querySelector('span');if(!v)return;if(g){v.textContent=stars(g[stat]);v.className='pv-growth-stars'}else{v.textContent='PENDING';v.className='pv-growth-pending'}});
    const ct=document.getElementById('contextTitle'),cb=document.getElementById('contextBody');
    if(ct&&cb){
      if(leader){ct.textContent='Leader Readout';cb.innerHTML=`<b>${name()}</b> is the current Leader. Affinity: ${affinity()}. Turn Priority remains <b>Agility − Action Time ± modifiers</b>; Leader selection does not overwrite combat order.`}
      else if(slot?.startsWith('support')){ct.textContent='Support Readout';cb.innerHTML=`${slotLabel(slot)} • Harmony governs assists, linked attacks, party bonuses, healing/buff synergy, and Leader/Support synchronization.${g?'':' Natural growth profile remains pending lock.'}`}
      else{ct.textContent='Field Readout';cb.innerHTML=`${slotLabel(slot)} • Turn Priority = <b>Agility − Action Time ± modifiers</b>. Higher results resolve sooner; Action Time is a positive cost.`}
    }
  }

  function enhanceModal(){
    const modal=document.getElementById('modal');
    if(!modal?.classList.contains('open'))return;
    const heading=document.getElementById('modalTitle')?.textContent?.trim().toUpperCase();
    const body=document.getElementById('modalBody');
    if(!body)return;
    const id=currentId(),slot=slotFor(id),leader=isLeader(id),r=RESONART[id];
    const enhanceKey=heading+'|'+id+'|'+slot+'|'+(leader?'1':'0');
    if(body.dataset.pvEnhanced===enhanceKey)return;
    body.dataset.pvEnhanced=enhanceKey;
    if(heading==='GROWTH'){
      body.innerHTML=`<div><b>${name()}</b> follows the locked progression split: approximately <b>70% natural growth / 30% player-directed growth</b>, with milestone extras and soft diminishing returns.</div>${growthHtml(id)}<div style="margin-top:10px;color:#91a2bf;font-size:10px">Exact current stat numbers and final per-level bonus-point quantities remain intentionally unassigned until the production balance lock.</div>`;
    }else if(heading==='ABILITIES'){
      body.innerHTML=`<div class="pv-modal-grid"><div class="pv-modal-cell"><b>Bearer</b><span>${name()}</span></div><div class="pv-modal-cell"><b>Affinity</b><span>${affinity()}</span></div><div class="pv-modal-cell"><b>Formation</b><span>${slotLabel(slot)}</span></div><div class="pv-modal-cell"><b>Resonart</b><span>${r||'Not mechanically locked'}</span></div></div><div style="font-size:10px;color:#91a2bf">Ability scaling may draw from multiple core stats. Exact production costs, Action Time, and scaling coefficients remain balance-authority data and are not fabricated here.</div>`;
    }else if(heading==='DETAILS'){
      body.innerHTML=`<div class="pv-modal-grid"><div class="pv-modal-cell"><b>Bearer</b><span>${name()}</span></div><div class="pv-modal-cell"><b>Title</b><span>${title()}</span></div><div class="pv-modal-cell"><b>Affinity</b><span>${affinity()}</span></div><div class="pv-modal-cell"><b>Formation</b><span>${slotLabel(slot)}</span></div><div class="pv-modal-cell"><b>Leader</b><span>${leader?'Yes':'No'}</span></div><div class="pv-modal-cell"><b>Spectrum</b><span>Bearer of the Spectrum</span></div></div><div style="font-size:10px;color:#a8b8d1">Turn Priority: <b style="color:#efd17e">Agility − Action Time ± modifiers</b>. Harmony is the synchronization stat for support, assists, linked attacks, party bonuses, and cooperative synergy.</div>${growthHtml(id)}`;
    }
  }

  const observer=new MutationObserver(()=>{syncPartyData();enhanceModal()});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>queueMicrotask(()=>{syncPartyData();enhanceModal()}),true);
  syncPartyData();

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
