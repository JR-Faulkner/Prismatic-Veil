(()=>{
  if(window.__PRPG_AUDIO__) return;
  window.__PRPG_AUDIO__=true;

  const MENU='./assets/audio/overworld/menu_sfx/';
  const LEGACY='./assets/party_battle_audio/legacy_reference_sfx/';
  const sounds={
    select:new Audio(MENU+'pv_menu_move_harvest.m4a'),
    confirm:new Audio(MENU+'pv_menu_confirm_harvest.m4a'),
    back:new Audio(MENU+'pv_menu_back_harvest.m4a'),
    reject:new Audio(MENU+'pv_menu_locked_harvest.m4a'),
    step:new Audio(MENU+'pv_menu_tab_harvest.m4a'),
    alter:new Audio(LEGACY+'legacy_restore.wav'),
    unlock:new Audio(LEGACY+'legacy_win.wav')
  };
  sounds.select.volume=.22;
  sounds.confirm.volume=.28;
  sounds.back.volume=.22;
  sounds.reject.volume=.24;
  sounds.step.volume=.20;
  sounds.alter.volume=.27;
  sounds.unlock.volume=.32;
  Object.values(sounds).forEach(a=>a.preload='auto');

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
      const old=a.volume;
      a.volume=0;
      const p=a.play();
      if(p&&p.then) p.then(()=>{a.pause();a.currentTime=0;a.volume=old}).catch(()=>{a.volume=old});
      else {a.pause();a.currentTime=0;a.volume=old}
    }catch(e){}
  }

  function resultText(){
    const game=document.getElementById('result')?.textContent||'';
    const logs=[...document.querySelectorAll('.log')].filter(x=>x.offsetParent!==null).map(x=>x.textContent).join(' ');
    return (game+' '+logs).toLowerCase();
  }

  function resultTone(){
    const t=resultText();
    if(/⚠|not enough|cannot|no ap|locked|does not know|more cash|no new category/.test(t)) play('reject');
    else if(/worth unlocked|new sense|unlocked|tutorial complete/.test(t)) play('unlock');
    else if(/✦|altered|improved|purchased|learned|success|claim established/.test(t)) play('alter');
  }

  function makeToggle(){
    if(document.getElementById('prpgSfx')) return;
    const b=document.createElement('button');
    b.id='prpgSfx';
    b.type='button';
    b.textContent=enabled?'🔊':'🔇';
    b.setAttribute('aria-label','Toggle sound effects');
    Object.assign(b.style,{
      border:'1px solid #ffffff66',
      background:'#1b1737cc',
      color:'#fff',
      borderRadius:'999px',
      padding:'8px 10px',
      fontSize:'12px',
      fontWeight:'900',
      backdropFilter:'blur(8px)',
      zIndex:'40'
    });

    const top=document.querySelector('.top');
    if(top){
      b.style.marginLeft='auto';
      const back=top.querySelector('.back');
      if(back) top.insertBefore(b,back); else top.appendChild(b);
    }else{
      Object.assign(b.style,{
        position:'fixed',
        right:'calc(12px + env(safe-area-inset-right))',
        top:'calc(12px + env(safe-area-inset-top))'
      });
      document.body.appendChild(b);
    }

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

    if(el.classList.contains('back')){
      play('back');
      return;
    }

    if(['newTutorial','newGame','continueGame','enterVerdant','start','begin'].includes(el.id)){
      play('confirm');
      return;
    }

    if(el.id==='finishLesson'){
      play('unlock');
      return;
    }

    if(el.id==='end'||el.dataset.next){
      play('step');
      return;
    }

    if(el.classList.contains('choice')){
      play('select');
      setTimeout(resultTone,45);
      return;
    }

    if(el.classList.contains('alterChoice')){
      play('select');
      setTimeout(resultTone,45);
      return;
    }

    if(el.classList.contains('prop')||el.closest('.nav')){
      play('select');
      return;
    }

    if(el.classList.contains('primary')){
      play('confirm');
      setTimeout(resultTone,45);
      return;
    }

    if(el.disabled){
      play('reject');
      return;
    }

    play('select');
  },true);

  const obs=new MutationObserver(()=>{
    const u=document.getElementById('worthUnlock');
    if(u&&!u.classList.contains('hidden')&&!u.dataset.sounded){
      u.dataset.sounded='1';
      play('unlock');
    }
  });
  obs.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});

  makeToggle();
})();