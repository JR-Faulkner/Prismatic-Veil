(()=>{
  if(window.__PRPG_AUDIO__) return;
  window.__PRPG_AUDIO__=true;

  const BASE='./assets/party_battle_audio/legacy_reference_sfx/';
  const sounds={
    select:new Audio(BASE+'legacy_select.wav'),
    activate:new Audio(BASE+'legacy_restore.wav'),
    step:new Audio(BASE+'legacy_step.wav'),
    reject:new Audio(BASE+'legacy_reject.wav'),
    refresh:new Audio(BASE+'legacy_hush.wav')
  };
  sounds.select.volume=.28;
  sounds.activate.volume=.34;
  sounds.step.volume=.20;
  sounds.reject.volume=.27;
  sounds.refresh.volume=.30;
  Object.values(sounds).forEach(a=>a.preload='auto');

  let enabled=localStorage.getItem('prpg.sfx')!=='0';
  let primed=false;

  function play(name){
    if(!enabled)return;
    const src=sounds[name]||sounds.select;
    try{const a=src.cloneNode();a.volume=src.volume;a.play().catch(()=>{})}catch(e){}
  }

  function prime(){
    if(primed)return;primed=true;
    const src=sounds.select;
    try{
      const old=src.volume;src.volume=0;
      const p=src.play();
      if(p&&p.then)p.then(()=>{src.pause();src.currentTime=0;src.volume=old}).catch(()=>{src.volume=old});
      else{src.pause();src.currentTime=0;src.volume=old}
    }catch(e){}
  }

  function failedResult(){
    const game=(document.getElementById('result')?.textContent||'').toLowerCase();
    const logs=[...document.querySelectorAll('.log')].filter(x=>x.offsetParent!==null).map(x=>x.textContent.toLowerCase()).join(' ');
    const t=game+' '+logs;
    return /⚠|not enough|cannot|no ap|no stable|nothing changes|does not become writable|does not resolve|never settles|blocked/.test(t);
  }

  function addToggle(){
    if(document.getElementById('prpgSfx'))return;
    const b=document.createElement('button');b.id='prpgSfx';b.type='button';b.textContent=enabled?'🔊':'🔇';b.setAttribute('aria-label','Toggle sound effects');
    Object.assign(b.style,{border:'1px solid #ffffff66',background:'#1b1737cc',color:'#fff',borderRadius:'999px',padding:'8px 10px',fontSize:'12px',fontWeight:'900',backdropFilter:'blur(8px)',zIndex:'40'});
    const top=document.querySelector('.top');
    if(top){b.style.marginLeft='auto';const back=top.querySelector('.back');if(back)top.insertBefore(b,back);else top.appendChild(b)}
    else{Object.assign(b.style,{position:'fixed',right:'calc(12px + env(safe-area-inset-right))',top:'calc(12px + env(safe-area-inset-top))'});document.body.appendChild(b)}
    b.addEventListener('click',e=>{e.stopPropagation();enabled=!enabled;localStorage.setItem('prpg.sfx',enabled?'1':'0');b.textContent=enabled?'🔊':'🔇';if(enabled){prime();play('select')}});
  }

  document.addEventListener('pointerdown',prime,{once:true,capture:true});

  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');
    if(!el||el.id==='prpgSfx')return;
    if(el.disabled){play('reject');return}

    if(el.id==='end'){play('refresh');return}

    const pageChange=el.classList.contains('back')||['newTutorial','newGame','continueGame','enterVerdant','start','begin','finishLesson'].includes(el.id)||!!el.dataset.next||!!el.closest('.nav');
    if(pageChange){play('step');return}

    const activates=el.classList.contains('choice')||el.classList.contains('alterChoice')||el.classList.contains('primary');
    if(activates){
      play('select');
      setTimeout(()=>play(failedResult()?'reject':'activate'),55);
      return;
    }

    if(el.classList.contains('prop')||el.classList.contains('simpleClaim')||el.classList.contains('btn')||el.classList.contains('launch')){
      play('select');
    }
  },true);

  addToggle();
})();