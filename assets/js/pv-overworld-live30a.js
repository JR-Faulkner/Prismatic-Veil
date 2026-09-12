(()=>{
  'use strict';
  if(window.__PV_OVERWORLD30A__)return;
  window.__PV_OVERWORLD30A__=true;

  const CLEAR_PREFIX='pv.locationClear.';
  const CURRENT_KEY='pv.currentLocation';
  const LAST_KEY='pv.lastLocation';

  const LOCATIONS=Object.freeze({
    home:{name:'Home',x:18.3,y:69.6,state:'Safe Haven',desc:'The Bearers’ anchor point between journeys. Recover, reorganize, consult the Grimoire, and choose the next route.',objective:'Choose a destination beyond Home.',meta:['Safe Haven','Party','Save'],threats:[],rewards:[],travel:'Return Home',type:'home'},
    echo:{name:'Echo Playground',x:36.7,y:35.8,state:'Reachable',desc:'A familiar neighborhood playground distorted by Resonance. The laughter is gone, but something in the Veil still answers.',objective:'Stabilize the disturbance at Echo Playground.',meta:['Encounter','First Clear','Resonance'],threats:['Veil Wraith','Hushling'],rewards:['Experience','Veil Shard','Memory Fragment'],travel:'Enter Echo Playground',type:'battle'},
    glassway:{name:'Glassway Bridge',x:50.2,y:61.8,state:'Route Sealed',desc:'A luminous bridge spanning the fractured waterways. Its glasswork resonates with paths that have not fully opened.',objective:'Stabilize Echo Playground to reveal the Glassway route.',meta:['Route','Bridge','Discovery'],threats:['Unknown'],rewards:['Route Access'],travel:'Route Not Yet Open',type:'locked'},
    whisper:{name:'Whispering Grove',x:46.0,y:28.3,state:'Route Sealed',desc:'A grove where prismatic leaves repeat fragments of voices from nearby realities.',objective:'Stabilize Echo Playground to reveal the Grove route.',meta:['Route','Mystery','Discovery'],threats:['Unknown'],rewards:['Discovery'],travel:'Route Not Yet Open',type:'locked'},
    oldwater:{name:'Old Water Tower',x:67.8,y:49.0,state:'Distant Signal',desc:'An old landmark now broadcasting a faint Veil pulse across the region. The road is visible, but not yet stable.',objective:'Open the routes beyond Glassway Bridge or Whispering Grove.',meta:['Landmark','Signal','Story'],threats:['Unknown'],rewards:['Unknown'],travel:'Path Unstable',type:'locked'},
    rift:{name:'Veil Rift',x:85.1,y:24.2,state:'Locked',desc:'A wound in the spectrum where several realities appear to overlap. Its route remains beyond the party’s current reach.',objective:'Find a stable path to the Veil Rift.',meta:['Story','Fracture','Locked'],threats:['Unknown'],rewards:['Unknown'],travel:'Path Locked',type:'locked'}
  });

  const EDGES=Object.freeze([
    ['home','echo','M18.3 69.6 C24 64,30 49,36.7 35.8'],
    ['home','glassway','M18.3 69.6 C29 73,40 68,50.2 61.8'],
    ['echo','glassway','M36.7 35.8 C41 44,45 54,50.2 61.8'],
    ['echo','whisper','M36.7 35.8 C39 31,42.5 29,46 28.3'],
    ['glassway','oldwater','M50.2 61.8 C57 59,62 53,67.8 49'],
    ['whisper','oldwater','M46 28.3 C54 31,61 40,67.8 49'],
    ['oldwater','rift','M67.8 49 C75 43,81 32,85.1 24.2']
  ]);

  const edgeKey=(a,b)=>[a,b].sort().join('|');
  const adjacency={};
  Object.keys(LOCATIONS).forEach(id=>adjacency[id]=[]);
  EDGES.forEach(([a,b])=>{adjacency[a].push(b);adjacency[b].push(a)});

  function cleared(id){return localStorage.getItem(CLEAR_PREFIX+id)==='1'}
  function unlocked(id){
    if(id==='home'||id==='echo')return true;
    if(id==='glassway'||id==='whisper')return cleared('echo');
    if(id==='oldwater')return cleared('glassway')||cleared('whisper');
    if(id==='rift')return cleared('oldwater');
    return false;
  }

  const params=new URLSearchParams(location.search);
  const returned=params.get('pvreturn');
  const result=params.get('pvresult');
  let current=localStorage.getItem(CURRENT_KEY)||'home';
  if(!LOCATIONS[current])current='home';
  if(returned&&LOCATIONS[returned]){
    if(result==='victory')current=returned;
    else if(result==='defeat')current=localStorage.getItem(LAST_KEY)||'home';
    localStorage.setItem(CURRENT_KEY,current);
  }
  let selected=current;

  const STYLE=`
  :root{--pv30-gold:#e8c96f;--pv30-gold2:#fff0ad;--pv30-cyan:#73e8ff;--pv30-violet:#9b67ff;--pv30-ink:#f7edcf;--pv30-panel:#07152be9}
  .shell{grid-template-columns:minmax(180px,21.5%) minmax(0,1fr) minmax(150px,18.5%)!important;grid-template-rows:minmax(0,1fr) clamp(62px,14vh,86px)!important;gap:5px!important;padding:max(5px,env(safe-area-inset-top)) max(6px,env(safe-area-inset-right)) max(5px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left))!important}
  .left,.right,.bottom{border-color:#d9bc6caa!important;background:linear-gradient(155deg,#061329f5,#091a38f0 52%,#060d20f7)!important;box-shadow:inset 0 0 0 1px #fff2b51a,0 15px 35px #0008!important}
  .left:after,.right:after{content:"";position:absolute;inset:5px;pointer-events:none;border:1px solid #7c6cff1a;clip-path:polygon(0 12px,12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)}
  .brand{background:linear-gradient(180deg,#091b39f5,#071126f3)!important}.brand h1{font-size:clamp(19px,3.8vh,34px)!important;text-shadow:0 0 18px #745cff3d!important}.brand .sub{color:#ead084!important;letter-spacing:.29em!important}
  .map-wrap{border-color:#dfc471bb!important;background:#020817!important;box-shadow:0 0 0 1px #020817,0 15px 40px #000a,0 0 28px #765eff20!important;overflow:hidden!important}
  .map-plate{filter:saturate(.92) contrast(1.06) brightness(.70)!important;transform:scale(1.008);transition:filter .2s ease!important}
  .map-tint{z-index:2!important;background:radial-gradient(circle at 50% 48%,#24396811 0 43%,#040b1c35 73%,#02051188 100%),linear-gradient(180deg,#6c5cff08,#07111f18)!important;box-shadow:inset 0 0 65px #020612aa!important}
  .map-caption{z-index:12!important;left:50%!important;top:10px!important;transform:translateX(-50%);padding:5px 14px!important;border-color:#d9bc6c66!important;background:#061128c7!important;color:#f4dc96!important;letter-spacing:.22em!important;clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 50%,calc(100% - 8px) 100%,8px 100%,0 50%)}
  .map-caption{font-size:7px!important}.map-caption::after{content:' · PROJECTED ROUTE NETWORK';color:#9fb7d6}
  .hotspot:not(.pv30-node){display:none!important}
  .pv30-chamber{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
  .pv30-chamber:before{content:"";position:absolute;left:50%;top:-29%;width:74%;height:42%;transform:translateX(-50%);border:2px solid #d8bb6b2c;border-radius:0 0 50% 50%;box-shadow:0 16px 35px #785cff12,inset 0 -12px 35px #75dbff0b}
  .pv30-chamber:after{content:"◇";position:absolute;left:50%;top:1.1%;transform:translateX(-50%) rotate(45deg);color:#dff8ff;font:700 clamp(18px,3.2vw,34px) Georgia,serif;text-shadow:0 0 8px #79e9ff,0 0 22px #8d5cff,0 0 34px #d6bd6b;opacity:.88}
  .pv30-routes{position:absolute;inset:0;z-index:4;width:100%;height:100%;pointer-events:none;overflow:visible}
  .pv30-route{fill:none;stroke:#9db6d843;stroke-width:.34;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 2px #6d95d533);transition:opacity .18s,stroke-width .18s,filter .18s}
  .pv30-route.dim{opacity:.22}.pv30-route.active{stroke:url(#pv30RouteGlow);stroke-width:.72;opacity:1;filter:drop-shadow(0 0 3px #ffe79d) drop-shadow(0 0 8px #7ae9ff)}
  .pv30-route.current{stroke:#f6d983aa;stroke-width:.48;opacity:.82}
  .pv30-node{z-index:8!important;width:auto!important;height:auto!important;aspect-ratio:auto!important;border-radius:0!important;display:grid!important;place-items:center!important;transform:translate(-50%,-50%)!important;overflow:visible!important;min-width:0!important;outline:none!important}
  .pv30-node:before{display:none!important}
  .pv30-node .pv30-glyph{display:grid;place-items:center;width:clamp(28px,3.7vw,42px);height:clamp(28px,3.7vw,42px);transform:rotate(45deg);border:1px solid #d7bf79aa;background:linear-gradient(145deg,#06162de8,#11163de8);box-shadow:0 5px 14px #000a,0 0 11px #6b5cff2b;transition:.16s ease}
  .pv30-node .pv30-glyph i{transform:rotate(-45deg);font:800 clamp(12px,1.7vw,18px) system-ui;color:#eef9ff;text-shadow:0 0 7px #75e9ff}
  .pv30-node .pv30-name{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);white-space:nowrap;padding:3px 8px;border:1px solid #d8bb6b77;background:#061126e8;color:#f6e7b7;font:700 clamp(7px,1.05vw,10px) Georgia,serif;letter-spacing:.045em;box-shadow:0 4px 12px #0009;clip-path:polygon(5px 0,calc(100% - 5px) 0,100% 50%,calc(100% - 5px) 100%,5px 100%,0 50%)}
  .pv30-node.locked .pv30-glyph{filter:grayscale(.45) brightness(.7);border-color:#7f829766}.pv30-node.locked .pv30-glyph i{color:#a9afc0;text-shadow:none}.pv30-node.locked .pv30-name{color:#aab4c8;border-color:#69789255}
  .pv30-node.sel .pv30-glyph{border-color:#fff0a8;transform:rotate(45deg) scale(1.12);box-shadow:0 0 0 3px #f1d2751c,0 0 17px #ffdc72aa,0 0 32px #735cff78}.pv30-node.sel .pv30-name{border-color:#f1d478;color:#fff1bd;box-shadow:0 0 14px #a479ff55,0 5px 12px #000a}
  .pv30-node.current .pv30-glyph:after{content:"";position:absolute;inset:-8px;border:1px solid #77efff99;border-radius:50%;animation:pv30pulse 1.6s ease-in-out infinite;box-shadow:0 0 14px #74e8ff66}.pv30-node.cleared .pv30-name:after{content:'  ✓';color:#83ffd0}
  @keyframes pv30pulse{50%{transform:scale(1.16);opacity:.45}}
  .right{gap:7px!important;padding:10px 11px!important}.side-kicker{letter-spacing:.24em!important;color:#f2d786!important}.objective{padding:9px 2px!important}.objective .star{font-size:16px!important}.objective strong{font-size:clamp(13px,2.2vh,19px)!important}
  .location-card{padding:7px 3px 8px!important}.location-card h2{font-size:clamp(15px,2.75vh,24px)!important;text-align:left!important}.location-card .state{text-align:left!important;margin-bottom:6px!important}.location-card p{font-size:clamp(8px,1.33vh,10.5px)!important}.location-card .meta{justify-content:flex-start!important}
  .pv30-intel{display:grid;gap:6px;margin-top:8px;padding-top:7px;border-top:1px solid #d8b75d44;font-family:system-ui}.pv30-intel-row{display:grid;grid-template-columns:52px 1fr;gap:5px;align-items:start}.pv30-intel-row b{font-size:6px;letter-spacing:.13em;color:#a8b8d1;text-transform:uppercase}.pv30-intel-row span{font-size:8px;line-height:1.3;color:#f3dfaa}.pv30-intel-row span.empty{color:#788aa8}
  .travel button{padding:8px 6px!important}.bottom{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))}.tabs{gap:4px!important}.tab{clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px)!important}.tab strong{letter-spacing:.06em!important}.tab .ico{color:#e8d08a!important;text-shadow:0 0 9px #7964ff55}
  .hero-card{grid-template-columns:40% 1fr!important}.hero-name{font-size:clamp(14px,2.8vh,23px)!important}.pv-ow-row{background:#061127aa!important;border-color:#8b86c62f!important}.hero-card.front{box-shadow:inset 4px 0 0 var(--primary),inset 0 0 24px rgba(var(--leader-rgb),.13)!important}
  @media(max-width:900px),(max-height:520px){.shell{grid-template-columns:minmax(160px,22%) minmax(0,1fr) minmax(145px,19%)!important}.pv30-node .pv30-name{top:calc(100% + 5px);padding:2px 5px}.pv30-intel{gap:3px;margin-top:4px;padding-top:4px}.pv30-intel-row{grid-template-columns:43px 1fr}.pv30-intel-row b{font-size:5.4px}.pv30-intel-row span{font-size:6.8px}.map-caption{top:6px!important}}
  `;
  const style=document.createElement('style');style.id='pv-overworld-live30a-style';style.textContent=STYLE;document.head.appendChild(style);

  const map=document.querySelector('.map-wrap');
  if(!map)return;
  map.querySelectorAll('.hotspot').forEach(n=>n.remove());

  const chamber=document.createElement('div');chamber.className='pv30-chamber';map.appendChild(chamber);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','pv30-routes');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
  svg.innerHTML=`<defs><linearGradient id="pv30RouteGlow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6d77f"/><stop offset=".48" stop-color="#fff0a8"/><stop offset=".72" stop-color="#72eaff"/><stop offset="1" stop-color="#a570ff"/></linearGradient></defs>`;
  const edgeEls=new Map();
  EDGES.forEach(([a,b,d])=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('class','pv30-route');p.dataset.edge=edgeKey(a,b);svg.appendChild(p);edgeEls.set(edgeKey(a,b),p)});
  map.appendChild(svg);

  const glyphs={home:'⌂',echo:'✦',glassway:'◇',whisper:'♧',oldwater:'◎',rift:'◆'};
  const nodeEls={};
  Object.entries(LOCATIONS).forEach(([id,d])=>{
    const b=document.createElement('button');b.type='button';b.className='hotspot pv30-node';b.dataset.location=id;b.setAttribute('aria-label',d.name);b.style.left=d.x+'%';b.style.top=d.y+'%';
    b.innerHTML=`<span class="pv30-glyph"><i>${glyphs[id]||'◇'}</i></span><span class="pv30-name">${d.name}</span>`;
    map.appendChild(b);nodeEls[id]=b;
    b.addEventListener('click',()=>select(id));
  });

  const objective=document.getElementById('objectiveText');
  const locationName=document.getElementById('locationName');
  const locationState=document.getElementById('locationState');
  const locationDesc=document.getElementById('locationDesc');
  const locationMeta=document.getElementById('locationMeta');
  const travel=document.getElementById('travelButton');
  const clear=document.getElementById('clearButton');
  const card=document.getElementById('locationCard');
  document.querySelector('.side-kicker')?.replaceChildren(document.createTextNode('Destination Intel'));
  if(document.querySelector('.map-caption'))document.querySelector('.map-caption').textContent='Regional Projection';

  let intel=card?.querySelector('.pv30-intel');
  if(card&&!intel){intel=document.createElement('div');intel.className='pv30-intel';card.appendChild(intel)}

  function shortestPath(from,to){
    if(from===to)return [from];
    const q=[[from]],seen=new Set([from]);
    while(q.length){const path=q.shift(),last=path[path.length-1];for(const next of adjacency[last]||[]){if(seen.has(next))continue;const nextPath=[...path,next];if(next===to)return nextPath;seen.add(next);q.push(nextPath)}}
    return [from,to];
  }

  function renderRoutes(){
    const path=shortestPath(current,selected),active=new Set();
    for(let i=0;i<path.length-1;i++)active.add(edgeKey(path[i],path[i+1]));
    edgeEls.forEach((el,key)=>{el.classList.toggle('active',active.has(key));el.classList.toggle('dim',active.size>0&&!active.has(key));el.classList.remove('current')});
  }

  function syncNodes(){
    Object.entries(nodeEls).forEach(([id,el])=>{
      const isUnlocked=unlocked(id);el.classList.toggle('locked',!isUnlocked);el.classList.toggle('cleared',cleared(id));el.classList.toggle('current',id===current);el.classList.toggle('sel',id===selected);el.setAttribute('aria-current',id===current?'location':'false');el.setAttribute('aria-disabled',isUnlocked?'false':'true');
    });
  }

  function statusFor(id){
    const d=LOCATIONS[id];
    if(id===current)return id==='home'?'Current Location':'Current Location';
    if(cleared(id))return 'Cleared · Route Stable';
    if(unlocked(id))return d.state;
    return d.state;
  }

  function actionFor(id){
    if(id==='home')return current==='home'?'Current Location':'Return Home';
    if(id==='echo')return cleared('echo')?'Revisit Encounter':'Enter Echo Playground';
    if(!unlocked(id))return LOCATIONS[id].travel;
    return 'Route Available Soon';
  }

  function renderPanel(){
    const d=LOCATIONS[selected],isUnlocked=unlocked(selected);
    if(objective)objective.textContent=d.objective;
    if(locationName)locationName.textContent=d.name;
    if(locationState)locationState.textContent=statusFor(selected);
    if(locationDesc)locationDesc.textContent=d.desc;
    if(locationMeta)locationMeta.innerHTML=d.meta.map(x=>`<span>${x}</span>`).join('');
    if(travel){travel.textContent=actionFor(selected);travel.disabled=(selected===current&&selected==='home')||(!isUnlocked&&selected!=='echo')||(selected!=='home'&&selected!=='echo');}
    if(intel){
      const threats=d.threats?.length?d.threats.join(' · '):'None known';
      const rewards=d.rewards?.length?d.rewards.join(' · '):'—';
      intel.innerHTML=`<div class="pv30-intel-row"><b>From</b><span>${LOCATIONS[current].name}</span></div><div class="pv30-intel-row"><b>Route</b><span>${shortestPath(current,selected).map(id=>LOCATIONS[id].name).join(' → ')}</span></div><div class="pv30-intel-row"><b>Threats</b><span class="${d.threats?.length?'':'empty'}">${threats}</span></div><div class="pv30-intel-row"><b>Rewards</b><span class="${d.rewards?.length?'':'empty'}">${rewards}</span></div>`;
    }
  }

  function select(id){
    if(!LOCATIONS[id])return;selected=id;syncNodes();renderRoutes();renderPanel();
  }

  function clearSelection(){selected=current;syncNodes();renderRoutes();renderPanel()}

  // Replace the old generic selection behavior without touching the validated HR7 base.
  clear?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();clearSelection()},true);
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#travelButton');if(!b)return;
    if(selected==='echo')return; // LIVE29F owns Echo encounter travel.
    e.preventDefault();e.stopImmediatePropagation();
    if(selected==='home'&&current!=='home'){
      localStorage.setItem(LAST_KEY,current);current='home';localStorage.setItem(CURRENT_KEY,current);select('home');window.PVMenuSFX?.play?.('confirm');
    }else if(!unlocked(selected))window.PVMenuSFX?.play?.('locked');
  },true);

  // Preserve the location we leave from so a defeat can retreat correctly.
  document.addEventListener('click',e=>{
    if(!e.target.closest?.('#travelButton')||selected!=='echo')return;
    try{localStorage.setItem(LAST_KEY,current)}catch(_){}
  },true);

  select(returned&&LOCATIONS[returned]?returned:current);
  if(returned&&LOCATIONS[returned])setTimeout(()=>{select(returned);},160);

  window.PV_OVERWORLD30A={locations:LOCATIONS,edges:EDGES,get current(){return current},get selected(){return selected},select};
})();
