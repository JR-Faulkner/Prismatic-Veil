(()=>{
  'use strict';
  if(window.__PV_PARTY31F__)return;
  window.__PV_PARTY31F__=true;

  const UNLOCK_KEY='pv.party.unlocks.v1';
  const PORTRAITS={
    prismel:'./assets/ui/overworld/v1/portraits/prismel_hr2.jpg?pvasset=live31f',
    auryi:'./assets/ui/overworld/v1/portraits/auryi_hr2.jpg?pvasset=live31f',
    kineza:'./assets/ui/overworld/v1/portraits/kineza_hr2.jpg?pvasset=live31f',
    sarallel:'./assets/ui/party/v1/characters/party_sarallel_chibi.png?pvasset=live31f',
    vyan:'./assets/ui/party/v1/characters/party_vyan_chibi.png?pvasset=live31f'
  };
  const SUPPORT_ASSETS={
    sarallel:'./assets/ui/party/v1/characters/party_sarallel_chibi.png?pvasset=live31f',
    vyan:'./assets/ui/party/v1/characters/party_vyan_chibi.png?pvasset=live31f'
  };
  const SUPPORT_NAMES={sarallel:'Sarallel',vyan:'Vyan'};
  let reserveSelection='support1';
  let patchQueued=false;
  let patching=false;
  let profileObserver=null;

  const STYLE=`
    :root{--pv31-gold:#e4bd62;--pv31-gold-bright:#ffe59a;--pv31-blue:#54d9ff;--pv31-violet:#8a64ff;--pv31-navy:#040c1d;--pv31-panel:#07152ce8}
    html,body{width:100vw!important;max-width:100vw!important;overflow:hidden!important;overscroll-behavior:none!important;background:#02050c!important}
    #app{width:100vw!important;max-width:100vw!important;min-width:0!important;grid-template-rows:64px minmax(0,1fr)!important;gap:0!important;padding:0!important;background:radial-gradient(circle at 56% 48%,#2a83a42b,transparent 32%),linear-gradient(145deg,#07162c,#02050c 72%)!important}
    #app:after{content:"";position:fixed;inset:0;pointer-events:none;border:1px solid #d9b86c9c;clip-path:polygon(0 22px,22px 0,calc(100% - 22px) 0,100% 22px,100% calc(100% - 22px),calc(100% - 22px) 100%,22px 100%,0 calc(100% - 22px));box-shadow:inset 0 0 42px #704fff13;z-index:99}
    .topbar{padding:0 42px!important;gap:14px!important;border-color:#d9b86c94!important;background:linear-gradient(180deg,#0d1f3ce8,#050c1ae9)!important;clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px)!important;box-shadow:0 10px 32px #0009,inset 0 0 0 1px #fff2b013!important}
    .crest{display:none!important}.titleblock{display:flex!important;align-items:center!important;gap:20px!important;min-width:max-content!important;margin-left:2px!important}.eyebrow{position:relative!important;font:500 20px/1 Georgia,serif!important;letter-spacing:.14em!important;color:#f0d487!important}.eyebrow:after{content:"|";margin-left:20px;color:#d9b86c!important}.screen-title{font:500 26px/1 Georgia,serif!important;letter-spacing:.16em!important;color:#fff5dc!important}.formation-readout{font-size:9px!important;color:#adbed8!important}.mode-chip,.return-btn{border-color:#d9b86c65!important;background:#061126e6!important;color:#f4d98b!important}
    .layout{width:100%!important;max-width:100%!important;min-width:0!important;grid-template-columns:minmax(0,1fr) clamp(340px,30.3vw,390px)!important;gap:0!important}
    .stage-shell,.panel{border-color:#d9b86c9a!important;background:linear-gradient(180deg,#07172ff0,#030814f5)!important;clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px)!important;box-shadow:0 18px 48px #000b,inset 0 0 0 1px #fff2b012!important}
    .stage-shell:before{background:linear-gradient(105deg,transparent 0 33%,#fff2c00b 44%,transparent 53% 100%)!important}
    .stage-head{display:none!important}
    .party-stage{inset:0 0 70px 0!important;perspective:none!important;background-image:linear-gradient(180deg,#02081835 0%,#05112618 50%,#0308159c 100%),url('./assets/ui/party/v1/party-stage-approved.png?pvasset=live31k3')!important;background-size:cover!important;background-position:center center!important}
    .party-stage:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 51% 78%,#b9efff29 0 8%,transparent 34%),linear-gradient(180deg,transparent 45%,#02081492 100%);pointer-events:none;z-index:1}
    .back-wall{left:0!important;right:0!important;top:0!important;width:100%!important;height:100%!important;border:0!important;background:linear-gradient(180deg,transparent,#07112612 45%,#040b19a8 100%)!important;clip-path:none!important;z-index:0!important}.veil-lines{opacity:.16!important}
    .floor{left:-5%!important;right:-5%!important;bottom:-21%!important;height:53%!important;transform:perspective(1100px) rotateX(62deg)!important;background:radial-gradient(circle at 25% 55%,#b8ecff4b 0 1px,transparent 2px),radial-gradient(circle at 66% 38%,#c7a6ff44 0 1px,transparent 2px),linear-gradient(145deg,#3a5871a6,#152c44b8 42%,#1b3d54b8)!important;border-top-color:#f0d58688!important;opacity:.82!important;z-index:2!important}.floor-reflect{bottom:2%!important;height:19%!important;opacity:.32!important;background:radial-gradient(ellipse at 49% 50%,#a6e8ffb8,transparent 62%)!important;z-index:3!important}
    .party-stage:after{content:"";position:absolute;left:23%;right:1%;bottom:10%;height:1px;background:linear-gradient(90deg,transparent,#e8cb7788 35%,#8de6ff66 63%,transparent);box-shadow:0 0 18px #a2eaff55;z-index:4;pointer-events:none}
    .slot{width:29%!important;min-width:122px!important;max-width:290px!important;height:82%!important;bottom:8%!important;top:auto!important;z-index:7!important}.slot[data-slot="field1"]{left:37%!important}.slot[data-slot="field2"]{left:65%!important;height:82%!important;bottom:6%!important;z-index:10!important}.slot[data-slot="field3"]{left:89%!important}.slot[data-slot="support1"],.slot[data-slot="support2"]{left:10%!important;width:18%!important;min-width:92px!important;max-width:182px!important;height:40%!important;z-index:12!important}.slot[data-slot="support1"]{top:6%!important;bottom:auto!important}.slot[data-slot="support2"]{top:53%!important;bottom:auto!important}
    .slot.field .char-art{height:110%!important;max-width:135%!important;bottom:3%!important;filter:drop-shadow(0 13px 10px #0009)!important}.slot[data-slot="field1"] .char-art{height:116%!important}.slot[data-slot="field2"] .char-art{height:106%!important}.slot[data-slot="field3"] .char-art{height:100%!important}.slot.selected .char-art{filter:drop-shadow(0 15px 10px #000b) drop-shadow(0 0 12px #65ddff5c)!important}.slot .pad{height:19%!important;bottom:-1%!important;border-color:#90e4ff70!important;background:radial-gradient(ellipse,#75dfff4e,#38648b24 52%,transparent 73%)!important;box-shadow:0 0 30px #63dfff25,inset 0 0 15px #b1efff1d!important}.slot.leader .pad:after{border-color:#f1d17ca8!important;box-shadow:0 0 16px #f1d17c55!important}.slot-label{bottom:1%!important;min-width:75%!important;padding:5px 8px 6px!important;border-color:#d9b86c83!important;background:#041026e9!important;box-shadow:0 5px 12px #0007!important}.slot-label .slot-kind{font-size:6px!important;color:#afbed3!important}.slot-label .name{font:500 13px Georgia,serif!important;letter-spacing:.04em!important;color:#f2e5c6!important}.leader-badge{bottom:24%!important;border-color:#edcc78d9!important;color:#ffe397!important;background:#061027f2!important}
    .pv-reserve-rail-title{position:absolute;z-index:15;left:3.2%;top:2.4%;width:14%;text-align:center;color:#f0d68d;font:800 12px Georgia,serif;letter-spacing:.18em;text-shadow:0 0 12px #ffe29a55;pointer-events:none}.pv-reserve-lock{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:7px;border:2px solid #d9b86c;background:linear-gradient(145deg,#040c1fdd,#08122be8 55%,#121138e8);clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px);box-shadow:0 0 24px #facd6540,inset 0 0 18px #714bff38;transition:.18s ease}.pv-reserve-lock:before,.pv-reserve-lock:after{content:"";position:absolute;width:12px;height:12px;border:1px solid #ffd878;pointer-events:none}.pv-reserve-lock:before{left:-5px;top:50%;transform:translateY(-50%) rotate(45deg)}.pv-reserve-lock:after{right:-5px;top:50%;transform:translateY(-50%) rotate(45deg)}.pv-reserve-glyph{display:grid;place-items:center;width:52%;aspect-ratio:1;color:#fff4c9;font:500 clamp(28px,4vw,52px) Georgia,serif;border:2px solid #8eb4ff;background:linear-gradient(140deg,#111d62,#4e43bd 48%,#17113c);transform:rotate(45deg);box-shadow:0 0 18px #619cff8c,inset 0 0 17px #b995ff55}.pv-reserve-glyph::first-letter{transform:rotate(-45deg)}.pv-reserve-glyph{line-height:1}.pv-reserve-caption{margin-top:3px;color:#f3d88c;font:800 9px/1.2 Georgia,serif;letter-spacing:.12em;text-align:center}.pv-locked-reserve .pad,.pv-locked-reserve .slot-label,.pv-locked-reserve .leader-badge{display:none!important}.pv-locked-reserve.pv-reserve-selected .pv-reserve-lock{border-color:#ffe196;box-shadow:0 0 32px #ffd15a9e,inset 0 0 22px #7057ff55}.pv-locked-reserve:not(.pv-reserve-selected) .pv-reserve-lock{border-color:#5b9cff;box-shadow:0 0 24px #4a7dff52,inset 0 0 20px #3f63c72e}.pv-locked-reserve:not(.pv-reserve-selected) .pv-reserve-glyph{border-color:#569aff;box-shadow:0 0 16px #467fff6b,inset 0 0 16px #9c7dff38}
    .stage-controls{left:0!important;right:0!important;bottom:0!important;height:70px!important;padding:10px 13px 9px!important;grid-template-columns:185px 145px minmax(120px,1fr) 145px!important;gap:8px!important;background:linear-gradient(180deg,#06132ae8,#030916f5)!important;border-top:1px solid #d9b86c72!important;z-index:30!important}.control-btn{border-color:#d9b86c72!important;background:linear-gradient(180deg,#0d2342f2,#061026f2)!important;font:800 9px Georgia,serif!important;letter-spacing:.14em!important;color:#f4e1ad!important}.control-btn.active,.control-btn:hover,.control-btn:focus-visible{border-color:#83e3ff!important;box-shadow:0 0 0 1px #83e3ff55,0 0 17px #64dfff45!important}.control-btn.leader-action{border-color:#f1d076!important;box-shadow:0 0 18px #facf6e2b!important}.status-strip{border-color:#d9b86c43!important;background:#041029e8!important;justify-content:center!important}.status-dot{background:#75e9ff!important;box-shadow:0 0 10px #75e9ff!important}.status-strip #statusText{font:500 12px Georgia,serif!important;color:#e8e9e3!important}
    .panel{grid-template-rows:auto auto auto minmax(0,1fr) auto!important;background:linear-gradient(180deg,#06152beF,#030a17f8)!important}.identity{padding:9px 12px 7px!important;border-bottom-color:#d9b86c53!important}.identity:before{content:"BEARER PROFILE"!important;display:block!important;margin-bottom:5px!important;color:#d9c17f!important;font:800 8px system-ui!important;letter-spacing:.22em!important}.identity:after{right:-22px!important;top:-20px!important;width:100px!important;height:100px!important;border-color:#75dcff23!important}.pv-profile-head{display:grid;grid-template-columns:100px minmax(0,1fr);gap:10px;align-items:center}.pv-profile-portrait{position:relative;min-height:100px;border:1px solid #d9b86c98;background:linear-gradient(145deg,#0f2850,#071028);clip-path:polygon(9px 0,calc(100% - 9px) 0,100% 9px,100% calc(100% - 9px),calc(100% - 9px) 100%,9px 100%,0 calc(100% - 9px),0 9px);box-shadow:inset 0 0 16px #70bfff2f,0 0 17px #0008;overflow:hidden}.pv-profile-portrait:after{content:"";position:absolute;inset:7px;border:1px solid #88dfff55;pointer-events:none}.pv-profile-portrait img{width:100%;height:100%;display:block;object-fit:cover;object-position:center 23%;filter:saturate(1.1) contrast(1.05)}.pv-profile-copy{min-width:0}.pv-profile-copy #charName{font:500 clamp(19px,2vw,28px)/1 Georgia,serif!important;letter-spacing:.10em!important;color:#fff5dd!important}.pv-profile-copy #charTitle{font-size:10px!important;color:#d9b86c!important;letter-spacing:.08em!important}.mini-line{display:grid!important;grid-template-columns:1fr!important;gap:0!important;padding:5px 12px!important;border-bottom-color:#d9b86c3b!important}.mini-stat{display:block!important;position:relative!important;padding:3px 2px 5px!important;border:0!important;background:transparent!important;border-bottom:1px solid #87a0c21c!important}.mini-stat:last-child{border-bottom:0}.mini-stat b{display:block!important;font-size:7px!important;color:#c0cee0!important}.mini-stat span{display:block!important;margin:0!important;font:700 11px Georgia,serif!important;color:#f0d48b!important}.mini-stat:after{content:"";display:block;height:5px;margin-top:4px;border:1px solid #6683a355;border-radius:3px;background:linear-gradient(90deg,var(--pv-bar,#f0cf7b) 0 var(--pv-fill,0%),#0c1830 var(--pv-fill,0%) 100%);box-shadow:inset 0 0 6px #0008}.mini-stat:nth-child(1){--pv-fill:34%}.mini-stat:nth-child(2){--pv-bar:#62e58a;--pv-fill:100%}.mini-stat:nth-child(3){--pv-bar:#55c9ff;--pv-fill:100%}.affinity{padding:6px 12px!important;border-bottom-color:#d9b86c45!important}.section-kicker{font-size:7px!important;color:#c9d4e4!important}.affinity #affinityText{font:500 14px Georgia,serif!important;color:#f2e4bd!important;margin-top:4px!important}.core-wrap{padding:7px 12px!important;overflow:auto!important}.core-wrap>.section-kicker{font-size:9px!important;color:#f2d68e!important}.core-grid{gap:4px!important;margin-top:5px!important}.core{min-height:30px!important;padding:4px 6px!important;border-color:#5f89ba45!important;background:#041029a9!important}.core b{font-size:7px!important;color:#c9d8ea!important}.core span{font-size:11px!important;color:#f1e3b7!important}.context-box{margin-top:6px!important;padding:6px 8px!important;border-color:#d9b86c3c!important;background:#041028a2!important}.context-title{font-size:7px!important;color:#d9c17f!important}.context-body{font-size:8px!important;color:#b7c9de!important}.commands{padding:6px 10px 8px!important;gap:5px!important;border-top-color:#d9b86c42!important}.command{min-height:34px!important;border-color:#77dfff73!important;background:linear-gradient(180deg,#0d2e49ef,#061128f2)!important;font:800 8px Georgia,serif!important;letter-spacing:.11em!important;color:#e8f6ff!important}.command.primary,.command:hover,.command:focus-visible{border-color:#f1d17c!important;box-shadow:0 0 17px #5fdfff35!important;color:#fff0bd!important}
    .reserve-drawer{display:none!important}
    @media(max-width:900px),(max-height:560px){#app{grid-template-rows:48px minmax(0,1fr)!important;gap:5px!important;padding:5px!important}.topbar{padding:0 12px!important;gap:9px!important}.titleblock{gap:10px!important}.eyebrow{font-size:11px!important;letter-spacing:.08em!important}.eyebrow:after{margin-left:10px!important}.screen-title{font-size:19px!important;letter-spacing:.10em!important}.formation-readout{display:none!important}.layout{grid-template-columns:minmax(0,1fr) clamp(230px,30vw,285px)!important;gap:5px!important}.party-stage{inset:0 0 50px 0!important}.slot{min-width:82px!important}.slot[data-slot="support1"],.slot[data-slot="support2"]{min-width:68px!important}.pv-reserve-rail-title{font-size:8px!important}.pv-reserve-caption{font-size:6px!important}.pv-reserve-glyph{font-size:28px!important}.stage-controls{height:50px!important;padding:6px!important;grid-template-columns:78px 78px minmax(80px,1fr) 78px!important;gap:4px!important}.control-btn{min-width:0!important;font-size:6px!important;padding:0 3px!important}.status-strip #statusText{font-size:8px!important}.panel{min-width:0!important}.identity{padding:8px 9px 6px!important}.identity:before{font-size:6px!important;margin-bottom:5px!important}.pv-profile-head{grid-template-columns:72px minmax(0,1fr);gap:7px}.pv-profile-portrait{min-height:75px}.pv-profile-copy #charName{font-size:17px!important}.pv-profile-copy #charTitle{font-size:7px!important}.mini-line{padding:5px 9px!important}.mini-stat{padding:3px 0!important}.mini-stat b{font-size:5.5px!important}.mini-stat span{font-size:8px!important}.affinity{padding:6px 9px!important}.affinity #affinityText{font-size:10px!important}.core-wrap{padding:6px 9px!important}.core{min-height:29px!important;padding:3px 5px!important}.core b{font-size:5.5px!important}.core span{font-size:8px!important}.context-box{margin-top:5px!important;padding:5px 6px!important}.context-title{font-size:5.5px!important}.context-body{font-size:6.5px!important}.commands{padding:5px 8px 7px!important;gap:3px!important}.command{min-height:28px!important;font-size:5.7px!important;padding:4px 2px!important}}
    @media(orientation:landscape){html,body,#app{width:100vw!important;max-width:100vw!important;overflow:hidden!important}.topbar,.layout,.stage-shell,.panel,.party-stage,.stage-controls{min-width:0!important;max-width:100%!important}.topbar{overflow:hidden!important}.titleblock{min-width:0!important;overflow:hidden!important}.eyebrow,.screen-title{overflow:hidden!important;text-overflow:ellipsis!important}.return-btn{flex:0 1 auto!important;max-width:26vw!important;overflow:hidden!important;text-overflow:ellipsis!important}}
    @media(orientation:portrait){body:before{content:"ROTATE TO LANDSCAPE";position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 44%,#172449,#030610 64%);color:#f6dfa1;font:900 16px system-ui;letter-spacing:.12em;text-align:center}#app{visibility:hidden!important}}
    @media(max-width:620px){.pv-profile-head{grid-template-columns:58px minmax(0,1fr)}.pv-profile-portrait{min-height:62px}.pv-profile-copy #charName{font-size:14px!important}.slot[data-slot="field1"]{left:34%!important}.slot[data-slot="field2"]{left:60%!important}.slot[data-slot="field3"]{left:87%!important}.slot[data-slot="support1"],.slot[data-slot="support2"]{left:9%!important;width:19%!important}.slot-label .name{font-size:9px!important}.slot-label .slot-kind{font-size:5px!important}}
  `;
  const style=document.createElement('style');style.id='pv-party-live31f-style';style.textContent=STYLE;document.head.appendChild(style);
  const cleanup=document.createElement('style');cleanup.id='pv-party-live31f-cleanup';cleanup.textContent='.pv30e-progress,.affinity:after,.context-box{display:none!important}';document.head.appendChild(cleanup);

  function readUnlocks(){
    try{
      const raw=JSON.parse(localStorage.getItem(UNLOCK_KEY)||'null');
      if(Array.isArray(raw))return new Set(raw.map(v=>String(v).toLowerCase()));
      if(raw&&Array.isArray(raw.unlocked))return new Set(raw.unlocked.map(v=>String(v).toLowerCase()));
      if(raw&&raw.characters&&typeof raw.characters==='object')return new Set(Object.keys(raw.characters).filter(k=>raw.characters[k]).map(k=>k.toLowerCase()));
      if(raw&&typeof raw==='object')return new Set(Object.keys(raw).filter(k=>raw[k]).map(k=>k.toLowerCase()));
    }catch(_){/* A missing or malformed unlock ledger is intentionally locked. */}
    return new Set();
  }
  function isUnlocked(id){return readUnlocks().has(String(id||'').toLowerCase())}
  function selectedSlot(){return document.querySelector('.slot.selected')?.dataset.character||localStorage.getItem('pv.partySelected')||'prismel'}
  function addReserveTitle(){
    const stage=document.getElementById('partyStage');
    if(stage&&!stage.querySelector('.pv-reserve-rail-title')){const title=document.createElement('div');title.className='pv-reserve-rail-title';title.textContent='RESERVE';stage.appendChild(title)}
  }
  function ensureProfile(){
    const identity=document.querySelector('.identity');
    if(!identity)return null;
    let head=identity.querySelector('.pv-profile-head');
    if(head)return head;
    const name=document.getElementById('charName'),title=document.getElementById('charTitle');
    head=document.createElement('div');head.className='pv-profile-head';
    const frame=document.createElement('div');frame.className='pv-profile-portrait';
    const img=document.createElement('img');img.id='pvProfilePortrait';img.alt='Selected Bearer portrait';frame.appendChild(img);
    const copy=document.createElement('div');copy.className='pv-profile-copy';
    if(name)copy.appendChild(name);if(title)copy.appendChild(title);
    head.append(frame,copy);identity.appendChild(head);
    return head;
  }
  function syncProfile(){
    ensureProfile();
    const img=document.getElementById('pvProfilePortrait');if(!img)return;
    const id=selectedSlot(),src=PORTRAITS[id]||PORTRAITS.prismel;
    if(!img.src.endsWith(src.split('?')[0]))img.src=src;
    img.alt=(id||'Bearer')+' portrait';
    const status=document.getElementById('statusText');
    if(status&&!/^Formation mode|Swap|Locked reserve/.test(status.textContent||'')){
      const label={prismel:'Prismel',auryi:'Auryi',kineza:'Kineza',sarallel:'Sarallel',vyan:'Vyan'}[id]||'Bearer';
      status.textContent=label+' selected.';
    }
  }
  function makeSupportArt(id){
    const img=document.createElement('img');img.className='char-art';img.alt=SUPPORT_NAMES[id]||'Reserve Bearer';img.draggable=false;img.src=SUPPORT_ASSETS[id]||'';return img;
  }
  function restoreUnlocked(slot,id){
    slot.classList.remove('pv-locked-reserve','pv-reserve-selected');
    slot.querySelector('.pv-reserve-lock')?.remove();
    if(!slot.querySelector('.char-art'))slot.appendChild(makeSupportArt(id));
    if(!slot.querySelector('.pad')){const pad=document.createElement('span');pad.className='pad';slot.appendChild(pad)}
    if(!slot.querySelector('.slot-label')){const label=document.createElement('span');label.className='slot-label';label.innerHTML='<span class="slot-kind">SUPPORT '+slot.dataset.slot.slice(-1)+'</span><span class="name">'+(SUPPORT_NAMES[id]||id)+'</span>';slot.appendChild(label)}
  }
  function applyReserveLocks(){
    const stage=document.getElementById('partyStage');if(!stage||patching)return;
    patching=true;
    try{
      addReserveTitle();
      stage.querySelectorAll('.slot[data-slot^="support"]').forEach(slot=>{
        const id=slot.dataset.character,locked=!isUnlocked(id),wasLocked=slot.classList.contains('pv-locked-reserve');
        if(!locked){if(wasLocked)restoreUnlocked(slot,id);return}
        slot.classList.add('pv-locked-reserve');slot.classList.toggle('pv-reserve-selected',reserveSelection===slot.dataset.slot);slot.setAttribute('aria-label','Locked reserve slot');
        slot.querySelectorAll('.char-art,.char-fallback,.pad,.leader-badge,.slot-label').forEach(node=>node.remove());
        if(!slot.querySelector('.pv-reserve-lock')){
          const lock=document.createElement('span');lock.className='pv-reserve-lock';lock.innerHTML='<span class="pv-reserve-glyph">?</span><span class="pv-reserve-caption">LOCKED<br>RESERVE</span>';slot.appendChild(lock);
        }
      });
      syncProfile();
    }finally{patching=false}
  }
  function queuePatch(){if(patchQueued)return;patchQueued=true;requestAnimationFrame(()=>{patchQueued=false;applyReserveLocks()})}

  const stage=document.getElementById('partyStage');
  stage?.addEventListener('click',event=>{
    const locked=event.target.closest?.('.slot.pv-locked-reserve');
    if(!locked)return;
    event.preventDefault();event.stopImmediatePropagation();
    reserveSelection=locked.dataset.slot||'support1';
    applyReserveLocks();
    const status=document.getElementById('statusText');if(status)status.textContent='Locked reserve slot selected.';
  },true);
  const stageObserver=new MutationObserver(queuePatch);
  if(stage)stageObserver.observe(stage,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-character']});
  const identity=document.querySelector('.identity');
  if(identity){profileObserver=new MutationObserver(syncProfile);profileObserver.observe(identity,{subtree:true,childList:true,characterData:true})}
  addEventListener('storage',event=>{if(event.key===UNLOCK_KEY||event.key==='pv.partyFormation'||event.key==='pv.partySelected')queuePatch()});
  ensureProfile();
  queuePatch();
})();
