(()=>{
  if(window.__PRPG_AUDIO__) return;
  window.__PRPG_AUDIO__=true;

  const BASE='./assets/party_battle_audio/legacy_reference_sfx/';
  const sounds={
    select:new Audio(BASE+'legacy_select.wav'),
    confirm:new Audio(BASE+'legacy_restore.wav'),
    reject:new Audio(BASE+'legacy_reject.wav'),
    step:new Audio(BASE+'legacy_step.wav'),
    unlock:new Audio(BASE+'legacy_win.wav')
  };
  sounds.select.volume=.28;
  sounds.confirm.volume=.34;
  sounds.reject.volume=.28;
  sounds.step.volume=.20;
  sounds.unlock.volume=.34;
  Object.values(sounds).forEach(a=>{a.preload='auto';});

  let enabled=localStorage.getItem('prpg.sfx')!=='0';
  let primed=false;

  function play(name){
    if(!enabled) return;
    const src=sounds[name]||sounds.select;
    try{
      const a=src.cloneNode();
      a.volume=src.volume;
      a.play().catch(()=>{});
    }catch(e){}
  }

  function prime(){
    if(primed) return;
    primed=true;
    const a=sounds.select;
    try{
      a.volume=0;
      const p=a.play();
      if(p&&p.then) p.then(()=>{a.pause();a.currentTime=0;a.volume=.28}).catch(()=>{a.volume=.28});
      else {a.pause();a.currentTime=0;a.volume=.28;}
    }catch(e){a.volume=.28}
  }

  function resultTone(){
    const t=(document.getElementById('result')?.textContent||'').toLowerCase();
    if(/⚠|not enough|only \d+ remains|cannot|does not know|more cash|no ap|no new category/.test(t)) play('reject');
    else if(/worth unlocked|new sense|unlocked/.test(t)) play('unlock');
    else if(/✦|improved|purchased|learned|success/.test(t)) play('confirm');
  }

  function addToggle(){
    const top=document.querySelector('.top');
    if(!top||document.getElementById('prpgSfx')) return;
    const b=document.createElement('button');
    b.id='prpgSfx';
    b.type='button';
    b.textContent=enabled?'🔊':'🔇';
    b.setAttribute('aria-label','Toggle sound effects');
    Object.assign(b.style,{border:'1px solid #ffffff66',background:'#1b173777',color:'#fff',borderRadius:'999px',padding:'8px 10px',fontSize:'12px',fontWeight:'900',backdropFilter:'blur(8px)',marginLeft:'auto'});
    const back=top.querySelector('.back');
    if(back) top.insertBefore(b,back); else top.appendChild(b);
    b.addEventListener('click',e=>{
      e.stopPropagation();
      enabled=!enabled;
      localStorage.setItem('prpg.sfx',enabled?'1':'0');
      b.textContent=enabled?'🔊':'🔇';
      if(enabled){prime();play('select')}
    });
  }

  document.addEventListener('pointerdown',prime,{once:true,capture:true});
  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');
    if(!el||el.id==='prpgSfx') return;
    if(el.id==='end'){play('step');return;}
    if(el.classList.contains('alterChoice')){
      play('select');
      setTimeout(resultTone,35);
      return;
    }
    if(el.classList.contains('choice')){
      play('select');
      setTimeout(resultTone,35);
      return;
    }
    if(el.classList.contains('prop')||el.closest('.nav')){play('select');return;}
    if(el.id==='start'){play('confirm');return;}
    if(el.classList.contains('primary')){
      play('select');
      setTimeout(resultTone,35);
      return;
    }
    if(el.classList.contains('back')) play('step');
  },true);

  const obs=new MutationObserver(()=>{
    const u=document.getElementById('worthUnlock');
    if(u&&!u.classList.contains('hidden')&&!u.dataset.sounded){u.dataset.sounded='1';play('unlock')}
  });
  obs.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
  addToggle();
})();
