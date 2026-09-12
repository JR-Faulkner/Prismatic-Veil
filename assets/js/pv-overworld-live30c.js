(()=>{
  'use strict';
  if(window.__PV_OVERWORLD30C__)return;
  window.__PV_OVERWORLD30C__=true;

  const MAP='./assets/ui/overworld/v2/map_world_base.jpg?pvasset=live30c-authority1';
  const POS=Object.freeze({
    home:[27.2,70.0],
    echo:[79.0,72.0],
    glassway:[50.5,69.3],
    whisper:[34.8,43.2],
    oldwater:[72.0,50.5],
    rift:[50.0,18.7]
  });
  const ROUTES=Object.freeze({
    'echo|home':'M27.2 70 C39 78,63 79,79 72',
    'glassway|home':'M27.2 70 C35 73,43 72,50.5 69.3',
    'echo|glassway':'M50.5 69.3 C61 70,70 74,79 72',
    'echo|whisper':'M79 72 C68 61,53 49,34.8 43.2',
    'glassway|oldwater':'M50.5 69.3 C59 64,66 57,72 50.5',
    'oldwater|whisper':'M34.8 43.2 C49 43,61 47,72 50.5',
    'oldwater|rift':'M72 50.5 C65 37,59 26,50 18.7'
  });
  const THUMB=Object.freeze({
    home:'25% 75%',echo:'82% 76%',glassway:'51% 76%',whisper:'35% 47%',oldwater:'73% 54%',rift:'50% 20%'
  });
  const COPY=Object.freeze({
    home:{desc:'The Bearers’ anchor between journeys. Recover, reorganize, and choose the next route.'},
    echo:{desc:'A familiar playground caught in Resonance. Something beyond the Veil still answers here.'},
    glassway:{desc:'A luminous crossing suspended over the fractured skyways. Its deeper route has not stabilized.'},
    whisper:{desc:'A living grove where prismatic leaves echo voices from nearby realities.'},
    oldwater:{desc:'An old landmark broadcasting a faint Veil pulse across the region.'},
    rift:{desc:'A wound in the spectrum where several realities overlap. The route remains sealed.'}
  });

  const STYLE=`
  :root{--c-gold:#d8b66a;--c-gold2:#f4dda1;--c-cyan:#77e8ff;--c-violet:#9a68ff;--c-panel:rgba(4,9,21,.90)}
  .map-plate{object-position:center 54%!important;transform:scale(1.006)!important;filter:saturate(1.03) contrast(1.025) brightness(.96)!important}
  .map-tint{background:radial-gradient(ellipse at 50% 49%,transparent 31%,#03071016 69%,#02040a77 100%),linear-gradient(90deg,#01030aa6 0%,transparent 14%,transparent 84%,#01030ab0 100%)!important;box-shadow:inset 0 0 70px #01030a66!important}
  .pv30b-arch{opacity:.72}.pv30b-crystal{opacity:.82;transform:translateX(-50%) rotate(45deg) scale(.86)!important}

  .pv30b-title{left:2.1vw!important;top:1.7vh!important}.pv30b-title a{font-size:clamp(26px,3.45vw,54px)!important}.pv30b-title small{margin-top:5px!important;letter-spacing:.30em!important}
  .pv30b-location{right:2.2vw!important;top:1.6vh!important;min-width:clamp(178px,16vw,265px)!important;padding:9px 14px 9px 41px!important;background:linear-gradient(135deg,#061126e8,#08162ee0)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important}

  .left.chrome{left:1.05vw!important;top:15.6vh!important;bottom:16.0vh!important;width:clamp(154px,13.8vw,228px)!important;grid-template-rows:repeat(3,minmax(0,1fr))!important;background:linear-gradient(180deg,#040a17e8,#07142be4)!important;border-color:#d8b86d82!important;box-shadow:inset 0 0 0 1px #fff1a70e,0 16px 40px #000a!important}
  .left:before{top:-23px!important;font-size:10px!important;letter-spacing:.15em!important}.left:after{top:-7px!important}
  .hero-card{grid-template-columns:43% 57%!important;background:linear-gradient(100deg,#07142ab7,#040a17a8)!important}
  .hero-card.front{background:linear-gradient(100deg,rgba(var(--leader-rgb),.23),#061126bd)!important}
  .hero-info{padding:7px 8px!important;gap:3px!important}.hero-name{font-size:clamp(15px,1.52vw,23px)!important}.hero-role{font-size:clamp(6px,.62vw,8.5px)!important;margin-top:1px!important;color:#c9d5e7!important}
  .pv-ow-meta{display:none!important}.pv-leader-badge{bottom:7px!important;left:50%!important;font-size:5.7px!important;padding:3px 7px!important}.pv-leader-reticle{width:66%!important}

  .right.chrome{right:1.05vw!important;top:15.0vh!important;bottom:15.9vh!important;width:clamp(205px,17.5vw,294px)!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;gap:0!important;padding:11px 12px 12px!important;background:linear-gradient(180deg,#040a17ee,#07142bf0)!important;border-color:#d8b86d88!important;box-shadow:inset 0 0 0 1px #fff1a70f,0 16px 42px #000b!important}
  .side-kicker{height:auto!important;padding:0 0 7px!important;font-size:clamp(8px,.7vw,10px)!important;letter-spacing:.17em!important}
  .objective{display:none!important}
  .pv30c-preview{position:relative;width:100%;aspect-ratio:1.94;margin:0 0 9px;border:1px solid #d8b86d7a;background-image:url('${MAP}');background-size:285% auto;background-repeat:no-repeat;background-position:50% 50%;box-shadow:inset 0 0 0 2px #030712,0 7px 18px #0009;clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px)}
  .pv30c-preview:after{content:"";position:absolute;inset:4px;border:1px solid #8ae9ff1f;pointer-events:none}
  .location-card{padding:0!important;overflow:visible!important}.location-card h2{font-size:clamp(17px,1.75vw,27px)!important;line-height:1.0!important;margin:0 0 3px!important}.location-card .state{font-size:6px!important;margin:0 0 7px!important}.location-card p{font-size:clamp(8px,.78vw,10.5px)!important;line-height:1.37!important;-webkit-line-clamp:3!important;margin:0!important}.location-card .meta,.pv30-intel{display:none!important}
  .pv30c-data{min-height:0;overflow:hidden;margin-top:9px;padding-top:8px;border-top:1px solid #d8b86d37;display:grid;align-content:start;gap:9px}
  .pv30c-section b{display:block;margin-bottom:5px;color:#d8b66a;font:700 6.4px system-ui;letter-spacing:.16em;text-transform:uppercase}.pv30c-list{display:grid;gap:4px}.pv30c-item{display:grid;grid-template-columns:15px minmax(0,1fr);align-items:center;gap:6px;min-height:18px;color:#dce6f4;font:600 7px system-ui}.pv30c-item i{width:12px;height:12px;display:grid;place-items:center;transform:rotate(45deg);border:1px solid #78dcff66;background:#0b1732;box-shadow:0 0 7px #815cff26}.pv30c-item i:after{content:"";width:4px;height:4px;background:#d9c171;box-shadow:0 0 5px #d9c171;transform:rotate(-45deg)}.pv30c-empty{color:#71839f!important;font-weight:500!important}
  .travel{margin-top:9px!important;gap:5px!important}.travel button{min-height:37px!important;padding:7px 8px!important;font-size:7.6px!important}.travel .ghost{display:none!important}

  .bottom.chrome{bottom:1.25vh!important;width:min(68vw,1040px)!important;height:clamp(64px,9.4vh,88px)!important;background:linear-gradient(180deg,#061126f2,#030711f5)!important}.bottom:before{top:-20px!important;width:41px!important;height:41px!important;font-size:17px!important}.tabs{padding:7px 30px!important}.tab{padding:6px 10px!important;gap:7px!important}.tab .ico{font-size:clamp(15px,1.7vw,23px)!important}.tab strong{font-size:clamp(7px,.72vw,10px)!important}.tab small{font-size:clamp(5px,.52vw,7px)!important;opacity:.72!important}

  .pv30-node{filter:none!important}.pv30-node .pv30-glyph{width:clamp(24px,3vw,36px)!important;height:clamp(24px,3vw,36px)!important;background:linear-gradient(145deg,#061327e9,#11173ae9)!important;border-color:#d9bd7390!important}.pv30-node .pv30-glyph i{font-size:clamp(10px,1.35vw,15px)!important}.pv30-node .pv30-name{top:calc(100% + 6px)!important;padding:3px 7px!important;background:#030817e6!important;border-color:#d5b76d7d!important;font-size:clamp(7px,.84vw,9.5px)!important;text-shadow:0 1px 5px #000}
  .pv30-route{stroke:#c8d8e238!important;stroke-width:.32!important}.pv30-route.dim{opacity:.10!important}.pv30-route.active{stroke-width:.63!important;filter:drop-shadow(0 0 3px #ffe599) drop-shadow(0 0 8px #7eeeff)!important}

  #pvMusicToggle{right:2.6vw!important;top:8.2vh!important;width:31px!important;height:31px!important;font-size:15px!important}

  @media(max-width:1000px),(max-height:600px){
    .pv30b-title{left:1.25vw!important;top:1.0vh!important}.pv30b-title a{font-size:clamp(22px,3.3vw,38px)!important}.pv30b-title small{font-size:5.4px!important;margin-top:3px!important}
    .pv30b-location{right:1.1vw!important;top:.9vh!important;min-width:170px!important;padding:7px 10px 7px 34px!important}.pv30b-location b{font-size:5.6px!important}.pv30b-location span{font-size:14px!important}
    .left.chrome{left:.75vw!important;top:14.8vh!important;bottom:15.4vh!important;width:clamp(145px,18.2vw,195px)!important}.left:before{top:-18px!important;font-size:7.5px!important}.hero-info{padding:4px 5px!important}.hero-name{font-size:clamp(13px,1.8vw,18px)!important}.hero-role{font-size:5.5px!important}.pv-leader-badge{font-size:5px!important}
    .right.chrome{right:.7vw!important;top:14.4vh!important;bottom:15.2vh!important;width:clamp(196px,23vw,250px)!important;padding:8px 9px 9px!important}.side-kicker{font-size:7px!important;padding-bottom:5px!important}.pv30c-preview{margin-bottom:6px!important}.location-card h2{font-size:16px!important}.location-card p{font-size:7px!important;line-height:1.3!important;-webkit-line-clamp:2!important}.pv30c-data{gap:5px!important;margin-top:6px!important;padding-top:5px!important}.pv30c-section b{font-size:5.3px!important;margin-bottom:3px!important}.pv30c-list{gap:2px!important}.pv30c-item{min-height:13px!important;font-size:5.9px!important;grid-template-columns:11px 1fr!important;gap:4px!important}.pv30c-item i{width:9px!important;height:9px!important}.travel{margin-top:5px!important}.travel button{min-height:30px!important;font-size:6.4px!important}
    .bottom.chrome{bottom:.6vh!important;width:min(74vw,860px)!important;height:58px!important}.bottom:before{top:-16px!important;width:32px!important;height:32px!important;font-size:14px!important}.tabs{padding:5px 22px!important}.tab{padding:4px 6px!important;gap:5px!important}.tab small{display:none!important}
    #pvMusicToggle{right:1.6vw!important;top:7.4vh!important;width:27px!important;height:27px!important}
    .pv30-node .pv30-name{padding:2px 5px!important;font-size:6.7px!important}.pv30-node .pv30-glyph{width:25px!important;height:25px!important}
  }
  `;
  const style=document.createElement('style');style.id='pv-overworld-live30c-style';style.textContent=STYLE;document.head.appendChild(style);

  const plate=document.querySelector('.map-plate');
  if(plate){plate.src=MAP;plate.decoding='async';plate.fetchPriority='high';}

  Object.entries(POS).forEach(([id,[x,y]])=>{
    const node=document.querySelector(`.pv30-node[data-location="${id}"]`);
    if(node){node.style.setProperty('left',x+'%','important');node.style.setProperty('top',y+'%','important');}
  });
  Object.entries(ROUTES).forEach(([key,d])=>document.querySelector(`.pv30-route[data-edge="${key}"]`)?.setAttribute('d',d));

  const right=document.querySelector('.right.chrome');
  const kicker=right?.querySelector('.side-kicker');
  const card=right?.querySelector('.location-card');
  let preview=right?.querySelector('.pv30c-preview');
  let dataBox=right?.querySelector('.pv30c-data');
  if(right&&kicker&&!preview){preview=document.createElement('div');preview.className='pv30c-preview';kicker.after(preview)}
  if(right&&card&&!dataBox){dataBox=document.createElement('div');dataBox.className='pv30c-data';card.after(dataBox)}

  function rows(items,emptyText){
    const list=(items||[]).filter(Boolean);
    if(!list.length)return `<div class="pv30c-item pv30c-empty"><i></i><span>${emptyText}</span></div>`;
    return list.map(x=>`<div class="pv30c-item"><i></i><span>${x}</span></div>`).join('');
  }
  function render(){
    const api=window.PV_OVERWORLD30A;if(!api)return;
    const id=api.selected||'home',loc=api.locations?.[id];if(!loc)return;
    if(preview){preview.style.backgroundPosition=THUMB[id]||'50% 50%';preview.setAttribute('aria-label',loc.name+' map preview')}
    const desc=document.getElementById('locationDesc');if(desc&&COPY[id]?.desc)desc.textContent=COPY[id].desc;
    if(dataBox)dataBox.innerHTML=`<section class="pv30c-section"><b>Threats</b><div class="pv30c-list">${rows(loc.threats,'None known')}</div></section><section class="pv30c-section"><b>Potential Rewards</b><div class="pv30c-list">${rows(loc.rewards,'Not yet revealed')}</div></section>`;
  }
  document.addEventListener('click',e=>{if(e.target.closest?.('.pv30-node,#clearButton,#travelButton'))setTimeout(render,0)},false);
  const nameEl=document.getElementById('locationName');if(nameEl)new MutationObserver(render).observe(nameEl,{childList:true,subtree:true,characterData:true});
  render();

  // Production witness marker: confirms the clean V2 map + cinematic GUI are active.
  document.documentElement.dataset.pvOverworld='LIVE30C';
})();
