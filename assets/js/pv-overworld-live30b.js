(()=>{
  'use strict';
  if(window.__PV_OVERWORLD30B__)return;
  window.__PV_OVERWORLD30B__=true;

  const STYLE=`
  :root{--pvb-gold:#d9b86c;--pvb-gold2:#f7dc96;--pvb-blue:#71d7ff;--pvb-violet:#9d6cff;--pvb-ink:#f5ead0;--pvb-panel:rgba(4,10,23,.88)}
  html,body{background:#02050e!important}
  body:before{display:none!important}
  body:after{content:""!important;position:fixed!important;inset:0!important;z-index:1!important;pointer-events:none!important;background:radial-gradient(ellipse at 50% 43%,transparent 28%,#02040a33 59%,#01030a99 100%),linear-gradient(180deg,#4933780b,#07101f20)!important;opacity:1!important;mix-blend-mode:normal!important;box-shadow:inset 0 0 95px #000d!important}

  .shell{position:fixed!important;inset:0!important;display:block!important;padding:0!important;z-index:3!important;overflow:hidden!important}
  .map-wrap{position:fixed!important;inset:0!important;z-index:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:#020713!important;box-shadow:none!important}
  .map-plate{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 48%!important;filter:saturate(1.03) contrast(1.05) brightness(.84)!important;transform:scale(1.025)!important}
  .map-tint{z-index:2!important;background:radial-gradient(ellipse at 51% 50%,transparent 20%,#07102115 57%,#02040b80 100%),linear-gradient(90deg,#02040a99 0%,transparent 16%,transparent 82%,#02040aa8 100%)!important;box-shadow:inset 0 0 140px #01030bdd!important}
  .map-wrap:after{display:none!important}
  .map-caption{display:none!important}

  .pv30b-arch{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
  .pv30b-arch:before{content:"";position:absolute;left:50%;top:-30%;width:76%;height:65%;transform:translateX(-50%);border:clamp(2px,.22vw,4px) solid #c79e5842;border-bottom-color:#e5c7765e;border-radius:0 0 50% 50%;box-shadow:0 20px 55px #8f6eff1c,inset 0 -18px 55px #69dfff0f}
  .pv30b-arch:after{content:"";position:absolute;left:50%;top:-20%;width:56%;height:52%;transform:translateX(-50%);border:1px solid #d6bd7642;border-radius:0 0 50% 50%;box-shadow:0 12px 28px #0007}
  .pv30b-crystal{position:absolute;z-index:5;left:50%;top:1.6%;width:clamp(20px,2.6vw,38px);aspect-ratio:.7;transform:translateX(-50%) rotate(45deg);border:1px solid #f4d88899;background:linear-gradient(145deg,#92ecff88,#845cff66 48%,#f0c66d88);box-shadow:0 0 14px #74e9ff,0 0 32px #825cff77,0 0 52px #d9b86944;pointer-events:none;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
  .pv30b-crystal:after{content:"";position:absolute;inset:22%;border:1px solid #fff9;box-shadow:0 0 10px #fff7}

  .pv30b-title{position:absolute;z-index:18;left:2.3vw;top:2.1vh;pointer-events:auto;text-shadow:0 2px 10px #000c}
  .pv30b-title a{color:#efd395;text-decoration:none;display:block;font:500 clamp(25px,3.7vw,58px)/.92 Georgia,serif;letter-spacing:.018em}
  .pv30b-title small{display:block;margin-top:7px;padding-left:24px;color:#d9d8dc;font:700 clamp(6px,.7vw,10px)/1 system-ui;letter-spacing:.34em;text-transform:uppercase;white-space:nowrap}
  .pv30b-title small:before{content:"";display:inline-block;width:22px;height:1px;margin:0 8px 2px 0;background:#d4b66e88}

  .pv30b-location{position:absolute;z-index:18;right:2.4vw;top:2vh;min-width:clamp(190px,17vw,285px);padding:10px 15px 10px 44px;border:1px solid #d9bb6a55;background:linear-gradient(135deg,#061126d9,#0a1730c7);clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);box-shadow:0 10px 24px #0008,0 0 24px #6a5cff18;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
  .pv30b-location:before{content:"✧";position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:23px;color:#f1d27c;text-shadow:0 0 13px #82dfff66}
  .pv30b-location b{display:block;color:#afbed7;font:800 7px system-ui;letter-spacing:.17em;text-transform:uppercase}.pv30b-location span{display:block;margin-top:2px;color:#f6e8c4;font:500 clamp(14px,1.55vw,22px) Georgia,serif}

  .left.chrome{position:absolute!important;z-index:15!important;left:1.15vw!important;top:13.7vh!important;bottom:15.2vh!important;width:clamp(170px,14.7vw,245px)!important;display:grid!important;grid-template-rows:repeat(3,minmax(0,1fr))!important;border:1px solid #d9b96a9e!important;background:linear-gradient(180deg,#050b18e8,#071329e8)!important;clip-path:polygon(0 12px,12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px))!important;box-shadow:inset 0 0 0 1px #fff1a713,0 20px 45px #000a,0 0 28px #6d5cff15!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
  .left .brand{display:none!important}
  .left:before{content:"PARTY"!important;position:absolute!important;left:14px!important;top:-25px!important;width:auto!important;height:auto!important;border:0!important;color:#f3db96!important;opacity:1!important;font:700 11px Georgia,serif!important;letter-spacing:.13em!important}
  .left:after{content:""!important;position:absolute!important;left:12px!important;right:12px!important;top:-8px!important;height:1px!important;border:0!important;background:linear-gradient(90deg,#d8b86d99,transparent)!important;opacity:1!important}
  .hero-card{min-height:0!important;grid-template-columns:42% 58%!important;border:0!important;border-bottom:1px solid #d8b76a4f!important;background:linear-gradient(100deg,#0a1730b5,#050b18a3)!important;clip-path:none!important;box-shadow:none!important;overflow:hidden!important}
  .hero-card:last-child{border-bottom:0!important}
  .hero-card:before{display:none!important}
  .hero-card.front{background:linear-gradient(100deg,rgba(var(--leader-rgb),.24),#061027b8)!important;box-shadow:inset 3px 0 0 var(--primary)!important}
  .hero-portrait{background:radial-gradient(circle at 50% 45%,rgba(var(--leader-rgb),.19),#020713 72%)!important}
  .hero-portrait:after{background:linear-gradient(90deg,transparent 74%,#041022ad)!important;border-right:1px solid #d8b76a55!important}
  .hero-portrait img{object-fit:cover!important;object-position:center 37%!important;filter:saturate(.97) contrast(1.02)!important}
  .hero-info{padding:8px 8px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:4px!important}
  .hero-name{font-size:clamp(16px,1.65vw,25px)!important;color:#f5e7c6!important;letter-spacing:.035em!important}
  .hero-role{font:700 clamp(6px,.66vw,9px) system-ui!important;letter-spacing:.12em!important;margin:0 0 3px!important;color:#c7d4e8!important}
  .pv-ow-meta{gap:3px!important}.pv-ow-row{grid-template-columns:42px 1fr!important;padding:3px 5px!important;border-color:#7f95ba2c!important;background:#050b18a8!important}.pv-ow-row b{font-size:5.6px!important}.pv-ow-row span{font-size:clamp(6px,.61vw,8px)!important;color:#f0d791!important}
  .pv-leader-badge{left:48%!important;bottom:7px!important;padding:3px 8px!important;font-size:6px!important;background:#061126ee!important}
  .pv-leader-reticle{width:70%!important}

  .right.chrome{position:absolute!important;z-index:15!important;right:1.2vw!important;top:13.7vh!important;bottom:15.2vh!important;width:clamp(215px,18.6vw,315px)!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;gap:7px!important;padding:13px 14px!important;border:1px solid #d9b96a9e!important;background:linear-gradient(180deg,#050b18ed,#071329ed)!important;clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px),0 12px)!important;box-shadow:inset 0 0 0 1px #fff1a713,0 20px 45px #000a,0 0 28px #6d5cff15!important;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
  .right:before,.right:after{display:none!important}
  .side-kicker{justify-content:flex-start!important;padding:0 0 7px!important;color:#f1d584!important;font:700 clamp(8px,.72vw,11px) Georgia,serif!important;letter-spacing:.16em!important}.side-kicker:before,.side-kicker:after{display:none!important}
  .objective{padding:9px 0 12px!important;border-top:1px solid #d8b76a4a!important;border-bottom:1px solid #d8b76a4a!important;text-align:left!important}.objective .star{display:none!important}.objective small{text-align:left!important;margin:0 0 5px!important;font-size:6.5px!important;letter-spacing:.16em!important;color:#c5b176!important}.objective strong{text-align:left!important;font-size:clamp(15px,1.55vw,23px)!important;line-height:1.05!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .location-card{padding:6px 0 8px!important;overflow:hidden!important;border-bottom:0!important}.location-card h2{font-size:clamp(18px,2vw,29px)!important;margin:0 0 2px!important;color:#f4e5c4!important}.location-card .state{font-size:6.5px!important;letter-spacing:.16em!important;color:#77e8ff!important;margin-bottom:8px!important}.location-card p{font-size:clamp(8px,.83vw,11px)!important;line-height:1.36!important;color:#d0dbed!important;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.location-card .meta{gap:4px!important;margin-top:8px!important}.location-card .meta span{font-size:5.6px!important;padding:3px 5px!important;background:#061329c8!important;border-color:#8ba0c03a!important;color:#c8d5e9!important}
  .pv30-intel{gap:4px!important;margin-top:7px!important;padding-top:7px!important}.pv30-intel-row{grid-template-columns:45px minmax(0,1fr)!important;gap:6px!important}.pv30-intel-row b{font-size:5.4px!important}.pv30-intel-row span{font-size:6.7px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  .travel{align-self:end!important;display:grid!important;gap:6px!important}.travel button{min-height:40px!important;padding:8px 9px!important;font-size:8px!important;letter-spacing:.12em!important;clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)!important}.travel button:first-child{background:linear-gradient(180deg,#102e52,#07172e)!important;color:#f5e8c6!important;border-color:#e2c675!important;box-shadow:inset 0 0 0 1px #75dfff27,0 0 16px #5f62ff22!important}.travel .ghost{background:#061124!important;color:#ceb97c!important;border-color:#806f493f!important;min-height:31px!important}

  #pvMusicToggle{position:absolute!important;z-index:20!important;right:3vw!important;top:7.8vh!important;width:34px!important;height:34px!important;border-radius:50%!important;background:#071126e8!important;color:#efd27e!important;border-color:#d8b86d66!important}

  .bottom.chrome{position:absolute!important;z-index:16!important;left:50%!important;right:auto!important;bottom:1.6vh!important;top:auto!important;width:min(70vw,1070px)!important;height:clamp(72px,10.5vh,102px)!important;transform:translateX(-50%)!important;display:block!important;border:1px solid #d9b96a9e!important;background:linear-gradient(180deg,#061126ee,#030712f2)!important;clip-path:polygon(28px 0,calc(100% - 28px) 0,100% 50%,calc(100% - 28px) 100%,28px 100%,0 50%)!important;box-shadow:0 20px 45px #000c,0 0 28px #6d5cff22,inset 0 0 0 1px #fff1a710!important;overflow:visible!important;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
  .bottom:before{content:"✧"!important;position:absolute!important;left:50%!important;top:-24px!important;transform:translateX(-50%)!important;width:47px!important;height:47px!important;display:grid!important;place-items:center!important;border:1px solid #d8b76a8d!important;border-radius:50%!important;background:#061126!important;color:#f1d177!important;font-size:20px!important;box-shadow:0 0 16px #6a5cff33!important;z-index:4!important}
  .bottom:after{display:none!important}.menu-home{display:none!important}.tabs{height:100%!important;display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:0!important;padding:9px 34px!important}.tab{height:100%!important;border:0!important;border-right:1px solid #d8b76a2e!important;background:transparent!important;clip-path:none!important;grid-template-columns:auto minmax(0,1fr)!important;gap:8px!important;padding:8px 12px!important;justify-content:center!important;align-items:center!important;box-shadow:none!important}.tab:last-child{border-right:0!important}.tab:before{display:none!important}.tab:after{left:22%!important;right:22%!important;height:2px!important;bottom:5px!important;background:linear-gradient(90deg,#67dfff,#8f67ff)!important;box-shadow:0 0 10px #6e7cff!important}.tab.on{background:linear-gradient(90deg,#5ea8ff0c,#8a5cff12,#5ea8ff0c)!important}.tab .ico{width:34px;height:34px;display:grid;place-items:center;border:1px solid #6f84a852;border-radius:50%;font-size:17px!important;color:#e8cf87!important;text-shadow:0 0 8px #7d64ff4f}.tab .txt{text-align:left!important}.tab strong{font-size:clamp(10px,1.1vw,16px)!important;color:#f1e4c6!important;letter-spacing:.04em!important}.tab small{font-size:5.8px!important;color:#7f93b0!important;letter-spacing:.04em!important;text-transform:none!important}

  .hotspot.pv30-node{z-index:9!important}.pv30-node .pv30-glyph{width:clamp(30px,3.25vw,48px)!important;height:clamp(30px,3.25vw,48px)!important;background:linear-gradient(145deg,#061126f0,#111632ed)!important;border-color:#d6ba6d99!important}.pv30-node .pv30-name{top:calc(100% + 7px)!important;padding:3px 9px!important;background:#040a18e8!important;border-color:#d7b86d73!important;font-size:clamp(7px,.78vw,10px)!important}.pv30-route{stroke:#91a7c32e!important}.pv30-route.active{stroke-width:.92!important;filter:drop-shadow(0 0 4px #ffe092) drop-shadow(0 0 10px #6be9ff)!important}.pv30-route.dim{opacity:.13!important}

  .overlay{z-index:80!important;background:#01040ad6!important;backdrop-filter:blur(12px)!important;padding:6vh 10vw!important}.modal{width:min(78vw,1120px)!important;height:min(74vh,690px)!important;grid-template-rows:54px minmax(0,1fr)!important;border:1px solid #d8b76a99!important;background:linear-gradient(150deg,#061126f7,#020713fa)!important;clip-path:polygon(15px 0,calc(100% - 15px) 0,100% 15px,100% calc(100% - 15px),calc(100% - 15px) 100%,15px 100%,0 calc(100% - 15px),0 15px)!important;box-shadow:0 30px 80px #000d,0 0 30px #6d5cff22,inset 0 0 0 1px #fff1a713!important}.modal-head{padding:0 18px!important;border-bottom:1px solid #d8b76a55!important}.modal-head h2{margin:0!important;font-size:19px!important;letter-spacing:.08em!important;color:#efd796!important}.modal-body{min-height:0!important;overflow:auto!important;padding:18px!important}.close{padding:7px 12px!important;font-size:8px!important;letter-spacing:.12em!important;background:#071329!important;border:1px solid #8c7b574f!important;color:#ddc584!important}.grimoire-grid,.party-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-content:start!important}.grimoire-entry,.party-sheet,.log{min-height:0!important;padding:14px!important;border:1px solid #7e8fa92f!important;background:linear-gradient(145deg,#08172fe8,#040a18e8)!important}.journal{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-content:start!important}.save-panel{height:100%!important;display:grid!important;place-items:center!important}.save-panel>div{width:min(460px,70%)!important;padding:28px!important;border:1px solid #d8b76a5c!important;background:#061126d8!important;text-align:center!important}

  @media(max-width:980px),(max-height:560px){
    .pv30b-title{left:2vw;top:1.5vh}.pv30b-title a{font-size:clamp(23px,3.1vw,42px)}.pv30b-title small{margin-top:4px}
    .pv30b-location{right:1.8vw;top:1.4vh;padding:7px 10px 7px 34px;min-width:170px}.pv30b-location:before{left:10px;font-size:18px}.pv30b-location span{font-size:13px}
    .left.chrome{left:.9vw!important;top:13.5vh!important;bottom:14.3vh!important;width:clamp(160px,15.2vw,205px)!important}
    .right.chrome{right:.9vw!important;top:13.5vh!important;bottom:14.3vh!important;width:clamp(205px,19.5vw,265px)!important;padding:9px 10px!important}
    .bottom.chrome{bottom:.8vh!important;width:75vw!important;height:clamp(60px,10.8vh,82px)!important}.tabs{padding:6px 26px!important}.tab{padding:4px 7px!important;gap:6px!important}.tab .ico{width:27px;height:27px;font-size:13px!important}.tab strong{font-size:10px!important}.tab small{font-size:5.2px!important}
    .hero-info{padding:5px 6px!important;gap:2px!important}.hero-name{font-size:15px!important}.pv-ow-row{grid-template-columns:38px 1fr!important;padding:2px 4px!important}.pv-ow-row b{font-size:5px!important}.pv-ow-row span{font-size:6px!important}
    .objective{padding:6px 0 8px!important}.objective strong{font-size:14px!important}.location-card h2{font-size:18px!important}.location-card p{font-size:7.2px!important}.pv30-intel{gap:3px!important;margin-top:4px!important;padding-top:4px!important}.pv30-intel-row span{font-size:6px!important}.travel button{min-height:31px!important;padding:5px 7px!important}
    .overlay{padding:4vh 7vw!important}.modal{width:86vw!important;height:80vh!important}.modal-body{padding:11px!important}.grimoire-grid,.journal,.party-grid{gap:8px!important}
  }
  `;
  const st=document.createElement('style');st.id='pv-overworld-live30b-style';st.textContent=STYLE;document.head.appendChild(st);

  const map=document.querySelector('.map-wrap');
  if(map){
    const arch=document.createElement('div');arch.className='pv30b-arch';
    const crystal=document.createElement('div');crystal.className='pv30b-crystal';
    map.append(arch,crystal);
  }
  const shell=document.querySelector('.shell');
  if(shell&&!document.querySelector('.pv30b-title')){
    const title=document.createElement('div');title.className='pv30b-title';title.innerHTML='<a href="./index.html">PRISMATIC VEIL</a><small>The World Remembers</small>';
    const loc=document.createElement('div');loc.className='pv30b-location';loc.innerHTML='<b>Current Location</b><span>Home</span>';
    shell.append(title,loc);
  }

  function syncLocation(){
    const api=window.PV_OVERWORLD30A;
    const id=api?.current||localStorage.getItem('pv.currentLocation')||'home';
    const name=api?.locations?.[id]?.name||'Home';
    const s=document.querySelector('.pv30b-location span');if(s)s.textContent=name;
  }
  syncLocation();
  document.addEventListener('click',()=>setTimeout(syncLocation,0),true);
  addEventListener('pageshow',syncLocation);

  // Keep modal content from inheriting stale fixed-width spacing.
  const observer=new MutationObserver(()=>{
    const body=document.getElementById('modalBody');
    if(!body)return;
    body.querySelectorAll('[style*="width"]').forEach(el=>{
      if(el.classList.contains('sheet-top'))return;
      el.style.maxWidth='100%';
    });
  });
  const modal=document.getElementById('overlay');if(modal)observer.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
})();
