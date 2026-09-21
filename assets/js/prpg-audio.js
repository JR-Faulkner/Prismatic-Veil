(()=>{
  if(window.__PRPG_AUDIO__) return;
  window.__PRPG_AUDIO__=true;

  const page=new Audio('./assets/party_battle_audio/legacy_reference_sfx/legacy_step.wav');
  page.volume=.18;
  page.preload='auto';

  let enabled=localStorage.getItem('prpg.sfx')!=='0';
  let primed=false;

  function playPage(){
    if(!enabled) return;
    try{
      const a=page.cloneNode();
      a.volume=page.volume;
      a.play().catch(()=>{});
    }catch(e){}
  }

  function prime(){
    if(primed) return;
    primed=true;
    try{
      const old=page.volume;
      page.volume=0;
      const p=page.play();
      if(p&&p.then) p.then(()=>{page.pause();page.currentTime=0;page.volume=old}).catch(()=>{page.volume=old});
      else {page.pause();page.currentTime=0;page.volume=old}
    }catch(e){}
  }

  function addToggle(){
    if(document.getElementById('prpgSfx')) return;
    const b=document.createElement('button');
    b.id='prpgSfx';
    b.type='button';
    b.textContent=enabled?'🔊':'🔇';
    b.setAttribute('aria-label','Toggle page sound');
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
    });
  }

  document.addEventListener('pointerdown',prime,{once:true,capture:true});

  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');
    if(!el||el.id==='prpgSfx') return;

    const pageChange=
      el.classList.contains('back') ||
      ['newTutorial','newGame','continueGame','enterVerdant','start','begin','end','finishLesson'].includes(el.id) ||
      !!el.dataset.next ||
      !!el.closest('.nav');

    if(pageChange) playPage();
  },true);

  addToggle();
})();