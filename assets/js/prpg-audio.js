(()=>{
  if(window.__PRPG_AUDIO__) return;
  window.__PRPG_AUDIO__=true;

  let enabled=localStorage.getItem('prpg.sfx')!=='0';
  let primed=false;
  let ctx=null;

  const volumes={select:.28,activate:.34,step:.22,reject:.27,refresh:.30};

  function audioCtx(){
    ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
    return ctx;
  }

  function envGain(c,t,a,d,s,r,dur,level){
    const g=c.createGain();
    const floor=.0001;
    g.gain.setValueAtTime(floor,t);
    g.gain.linearRampToValueAtTime(level,t+a);
    g.gain.exponentialRampToValueAtTime(Math.max(floor,level*s),t+a+d);
    g.gain.setValueAtTime(Math.max(floor,level*s),t+Math.max(a+d,dur-r));
    g.gain.exponentialRampToValueAtTime(floor,t+dur);
    return g;
  }

  function bus(c,level){
    const gain=c.createGain();
    gain.gain.value=level;
    const comp=c.createDynamicsCompressor();
    comp.threshold.value=-18;
    comp.knee.value=14;
    comp.ratio.value=5;
    comp.attack.value=.002;
    comp.release.value=.09;
    const low=c.createBiquadFilter();
    low.type='lowpass';
    low.frequency.value=6200;
    gain.connect(comp).connect(low).connect(c.destination);
    return gain;
  }

  function osc(c,d,t,dur,freq,type,gain){
    const o=c.createOscillator();
    o.type=type;
    o.frequency.setValueAtTime(freq,t);
    const g=envGain(c,t,.003,.035,.18,.05,dur,gain);
    o.connect(g).connect(d);
    o.start(t);
    o.stop(t+dur+.02);
  }

  function sweep(c,d,t,dur,from,to,type,gain){
    const o=c.createOscillator();
    o.type=type;
    o.frequency.setValueAtTime(from,t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1,to),t+dur);
    const g=envGain(c,t,.006,.05,.22,.08,dur,gain);
    o.connect(g).connect(d);
    o.start(t);
    o.stop(t+dur+.02);
  }

  function noise(c,d,t,dur,gain,highpass=650){
    const len=Math.max(1,Math.floor(c.sampleRate*dur));
    const b=c.createBuffer(1,len,c.sampleRate);
    const a=b.getChannelData(0);
    for(let i=0;i<len;i++) a[i]=(Math.random()*2-1)*(1-i/len);
    const s=c.createBufferSource();
    s.buffer=b;
    const hp=c.createBiquadFilter();
    hp.type='highpass';
    hp.frequency.value=highpass;
    const g=envGain(c,t,.001,.025,.08,.04,dur,gain);
    s.connect(hp).connect(g).connect(d);
    s.start(t);
    s.stop(t+dur+.02);
  }

  function hit(c,d,t,o){
    osc(c,d,t,o.len,o.freq,'triangle',o.gain);
    osc(c,d,t,o.len,o.freq*2.03,'sine',o.gain*.22);
    noise(c,d,t,Math.min(o.len,.09),o.grit||.04,o.highpass||650);
  }

  function cueSelect(c,t,d){
    hit(c,d,t,{len:.07,freq:1320,gain:.38,grit:.09,highpass:900});
    osc(c,d,t+.028,.08,420,'sine',.12);
  }

  function cueActivate(c,t,d){
    hit(c,d,t,{len:.075,freq:1480,gain:.62,grit:.28});
    hit(c,d,t+.032,{len:.11,freq:510,gain:.36,grit:.12});
    hit(c,d,t+.112,{len:.08,freq:890,gain:.20,grit:.05});
    osc(c,d,t,.22,86,'sine',.045);
  }

  function cueStep(c,t,d){
    hit(c,d,t,{len:.055,freq:760,gain:.24,grit:.07,highpass:780});
    sweep(c,d,t+.018,.12,190,145,'sine',.055);
  }

  function cueReject(c,t,d){
    hit(c,d,t,{len:.08,freq:260,gain:.30,grit:.12,highpass:520});
    sweep(c,d,t+.035,.16,180,92,'sawtooth',.075);
    hit(c,d,t+.11,{len:.055,freq:168,gain:.18,grit:.06,highpass:430});
  }

  function cueRefresh(c,t,d){
    hit(c,d,t,{len:.14,freq:330,gain:.72,grit:.20});
    hit(c,d,t+.09,{len:.16,freq:188,gain:.42,grit:.12});
    sweep(c,d,t+.12,.48,118,54,'sawtooth',.045);
    osc(c,d,t+.2,.36,54,'sine',.055);
    noise(c,d,t+.14,.42,.035,420);
    hit(c,d,t+.49,{len:.11,freq:620,gain:.16,grit:.04});
    hit(c,d,t+.69,{len:.08,freq:1040,gain:.16,grit:.035});
    osc(c,d,t,.82,52,'sine',.038);
  }

  const cues={select:cueSelect,activate:cueActivate,step:cueStep,reject:cueReject,refresh:cueRefresh};

  function play(name){
    if(!enabled)return;
    try{
      const c=audioCtx();
      if(c.state==='suspended') c.resume().catch(()=>{});
      const t=c.currentTime+.012;
      const d=bus(c,volumes[name]||volumes.select);
      (cues[name]||cueSelect)(c,t,d);
    }catch(e){}
  }

  function prime(){
    if(primed)return;
    primed=true;
    try{
      const c=audioCtx();
      if(c.state==='suspended') c.resume().catch(()=>{});
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
