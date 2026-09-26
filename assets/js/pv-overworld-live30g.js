(()=>{
  'use strict';
  if(window.__PV_OVERWORLD30G__)return;
  window.__PV_OVERWORLD30G__=true;

  const CURRENT_KEY='pv.currentLocation';
  const LAST_KEY='pv.lastLocation';
  const ASSET='./assets/ui/overworld/v2/party_board_piece.svg?pvasset=live30g1';
  const POS=Object.freeze({
    home:[27.2,70.0],
    whisper:[34.8,43.2],
    glassway:[50.5,69.3],
    echo:[77.0,31.0],
    frigid:[16.0,18.0],
    oldwater:[72.0,50.5],
    rift:[50.0,18.7]
  });
  const ROUTES=Object.freeze({
    'home>whisper':[[27.2,70.0],[27.0,58.0],[31.0,49.0],[34.8,43.2]],
    'whisper>home':[[34.8,43.2],[31.0,49.0],[27.0,58.0],[27.2,70.0]],
    'home>glassway':[[27.2,70.0],[34.6,71.7],[42.0,70.8],[50.5,69.3]],
    'glassway>home':[[50.5,69.3],[42.0,70.8],[34.6,71.7],[27.2,70.0]],
    'whisper>frigid':[[34.8,43.2],[28.0,34.0],[22.0,25.0],[16.0,18.0]],
    'frigid>whisper':[[16.0,18.0],[22.0,25.0],[28.0,34.0],[34.8,43.2]],
    'home>echo':[[27.2,70],[27,58],[31,49],[34.8,43.2],[49,36],[62,31],[77,31]],
    'echo>home':[[77,31],[62,31],[49,36],[34.8,43.2],[31,49],[27,58],[27.2,70]],
    'home>frigid':[[27.2,70],[27,58],[31,49],[34.8,43.2],[28,34],[22,25],[16,18]],
    'frigid>home':[[16,18],[22,25],[28,34],[34.8,43.2],[31,49],[27,58],[27.2,70]],
    'whisper>echo':[[34.8,43.2],[49.0,36.0],[62.0,31.0],[77.0,31.0]],
    'echo>whisper':[[77.0,31.0],[62.0,31.0],[49.0,36.0],[34.8,43.2]],
    'glassway>oldwater':[[50.5,69.3],[58.8,63.8],[65.8,56.8],[72.0,50.5]],
    'oldwater>glassway':[[72.0,50.5],[65.8,56.8],[58.8,63.8],[50.5,69.3]],
    'oldwater>whisper':[[72.0,50.5],[60.5,46.4],[47.8,43.4],[34.8,43.2]],
    'whisper>oldwater':[[34.8,43.2],[47.8,43.4],[60.5,46.4],[72.0,50.5]],
    'oldwater>rift':[[72.0,50.5],[65.2,37.8],[58.6,26.2],[50.0,18.7]],
    'rift>oldwater':[[50.0,18.7],[58.6,26.2],[65.2,37.8],[72.0,50.5]]
  });

  const STYLE=`
  .pv30g-piece{position:absolute;z-index:10;left:27.2%;top:70%;width:clamp(38px,5.1vw,70px);aspect-ratio:220/260;transform:translate(-50%,-82%);pointer-events:none;filter:drop-shadow(0 13px 10px #000b) drop-shadow(0 0 12px #7eefff88);transition:left .54s cubic-bezier(.2,.74,.21,1),top .54s cubic-bezier(.2,.74,.21,1),filter .2s ease;will-change:left,top,filter}
  .pv30g-piece:before{content:"";position:absolute;left:50%;bottom:4%;width:82%;height:19%;transform:translateX(-50%);background:radial-gradient(ellipse,#050814b5 0 47%,transparent 72%);filter:blur(1px)}
  .pv30g-piece img{position:relative;width:100%;height:100%;display:block;animation:pv30gBob 2.4s ease-in-out infinite;transform-origin:50% 88%}
  .pv30g-piece.moving{filter:drop-shadow(0 18px 14px #000d) drop-shadow(0 0 20px #fff0a5cc) drop-shadow(0 0 30px #71edff88)}
  .pv30g-piece.moving img{animation:pv30gTravel .62s ease-in-out infinite}
  .pv30g-piece.arrived img{animation:pv30gArrive .48s ease-out 1,pv30gBob 2.4s ease-in-out .48s infinite}
  .pv30g-trail{position:absolute;z-index:9;width:clamp(7px,1vw,12px);height:clamp(7px,1vw,12px);transform:translate(-50%,-50%) rotate(45deg);border:1px solid #fff0aa;background:linear-gradient(135deg,#fff0aa,#7debff 58%,#9b74ff);box-shadow:0 0 11px #7debff,0 0 18px #9b74ff;pointer-events:none;animation:pv30gTrail .95s ease-out forwards}
  .pv30g-encounter-note{position:absolute;z-index:11;left:50%;top:13%;transform:translateX(-50%);min-width:min(420px,62vw);padding:11px 18px;border:1px solid #efd27a99;background:radial-gradient(circle at 50% 0,#7feeff22,transparent 58%),linear-gradient(135deg,#051026ed,#071a36e6);color:#f8e7b5;text-align:center;font:800 clamp(8px,1.05vw,12px) system-ui;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 12px 32px #000b,0 0 24px #735cff40;clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,10px 100%,0 50%);opacity:0;pointer-events:none;transition:opacity .18s ease,top .18s ease}
  .pv30g-encounter-note.show{opacity:1;top:11.5%}
  .pv30g-encounter-note b{display:block;margin-bottom:3px;color:#7feeff;font:900 clamp(12px,1.6vw,18px) Georgia,serif;letter-spacing:.08em;text-transform:none;text-shadow:0 0 12px #7feeff66}
  @keyframes pv30gBob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-4px) rotate(1.2deg)}}
  @keyframes pv30gTravel{0%,100%{transform:translateY(-3px) rotate(-4deg)}50%{transform:translateY(-9px) rotate(5deg)}}
  @keyframes pv30gArrive{0%{transform:translateY(-11px) scale(1.06)}52%{transform:translateY(2px) scale(.96)}100%{transform:translateY(0) scale(1)}}
  @keyframes pv30gTrail{0%{opacity:.95;transform:translate(-50%,-50%) rotate(45deg) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) rotate(45deg) scale(.16)}}
  @media(max-width:900px),(max-height:520px){.pv30g-piece{width:clamp(34px,5.2vw,52px)}.pv30g-encounter-note{min-width:min(300px,62vw);padding:8px 13px}}
  `;

  function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
  function mapWrap(){return document.querySelector('.map-wrap')}
  function currentId(){
    const api=window.PV_OVERWORLD30A;
    const id=api?.current||localStorage.getItem(CURRENT_KEY)||'home';
    return POS[id]?id:'home';
  }
  function selectedId(){
    const api=window.PV_OVERWORLD30A;
    const id=api?.selected||currentId();
    return POS[id]?id:currentId();
  }
  function route(from,to){return ROUTES[`${from}>${to}`]||[POS[from]||POS.home,POS[to]||POS.whisper]}
  function setPosition(el,xy){el.style.left=xy[0]+'%';el.style.top=xy[1]+'%'}

  const style=document.createElement('style');style.id='pv-overworld-live30g-style';style.textContent=STYLE;document.head.appendChild(style);
  const wrap=mapWrap();
  if(!wrap)return;

  const piece=document.createElement('div');
  piece.className='pv30g-piece';
  piece.setAttribute('aria-hidden','true');
  piece.innerHTML=`<img alt="" src="${ASSET}">`;
  wrap.appendChild(piece);

  const note=document.createElement('div');
  note.className='pv30g-encounter-note';
  note.innerHTML='<b>Party Moving</b><span>Route locked: Home → Whispering Grove</span>'; 
  wrap.appendChild(note);

  function spark(xy){
    const s=document.createElement('i');
    s.className='pv30g-trail';
    s.style.left=xy[0]+'%';
    s.style.top=xy[1]+'%';
    wrap.appendChild(s);
    setTimeout(()=>s.remove(),980);
  }
  function sync(id=currentId()){
    setPosition(piece,POS[id]||POS.home);
  }
  async function animateTo(dest,opts={}){
    const from=opts.from&&POS[opts.from]?opts.from:currentId();
    const to=POS[dest]?dest:'whisper';
    const points=route(from,to);
    piece.classList.add('moving');
    piece.classList.remove('arrived');
    for(const point of points){
      setPosition(piece,point);
      spark(point);
      await wait(opts.stepMs||330);
    }
    piece.classList.remove('moving');
    piece.classList.add('arrived');
    await wait(180);
  }
  async function moveTo(dest,opts={}){
    const to=POS[dest]?dest:'home';
    const from=opts.from&&POS[opts.from]?opts.from:currentId();
    try{localStorage.setItem(LAST_KEY,from)}catch(_){}
    note.innerHTML=`<b>Route Movement</b><span>${from} → ${to}</span>`;
    note.classList.add('show');
    await animateTo(to,{from,stepMs:opts.stepMs||300});
    try{localStorage.setItem(CURRENT_KEY,to)}catch(_){}
    note.innerHTML=`<b>Arrived</b><span>${to}</span>`;
    await wait(opts.holdMs||420);
    note.classList.remove('show');
    sync(to);
    return to;
  }
  async function departWhisper(){
    const from=currentId();
    try{localStorage.setItem(LAST_KEY,from)}catch(_){}
    note.classList.add('show');
    await animateTo('whisper',{from,stepMs:300});
    note.innerHTML='<b>First Encounter</b><span>Whispering Grove signal detected.</span>'; 
    await wait(320);
    note.classList.remove('show');
  }

  document.addEventListener('click',e=>{
    const node=e.target.closest?.('.pv30-node[data-location]');
    if(!node)return;
    const id=node.dataset.location;
    if(id===currentId())sync(id);
  },false);

  const nameEl=document.getElementById('locationName');
  if(nameEl)new MutationObserver(()=>{
    if(selectedId()===currentId())sync(currentId());
  }).observe(nameEl,{childList:true,subtree:true,characterData:true});

  sync();
  document.documentElement.dataset.pvOverworldPiece='LIVE30G';
  window.PV_OVERWORLD30G={piece,note,sync,animateTo,moveTo,departWhisper,departEcho:departWhisper};
})();

