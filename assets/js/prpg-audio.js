(()=>{
  if(window.__PRPG_AUDIO__) return;
  window.__PRPG_AUDIO__=true;

  let enabled=localStorage.getItem('prpg.sfx')!=='0';
  let primed=false;
  let ctx=null;

  const volumes={select:.28,activate:.34,step:.22,reject:.27,refresh:.30,newClaim:.36,worthUnlock:.32,apRestore:.30};

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

  function cueNewClaim(c,t,d){
    hit(c,d,t,{len:.12,freq:260,gain:.74,grit:.18,highpass:440});
    hit(c,d,t+.075,{len:.14,freq:390,gain:.48,grit:.12,highpass:560});
    sweep(c,d,t+.04,.28,92,64,'sawtooth',.09);
    hit(c,d,t+.24,{len:.10,freq:760,gain:.22,grit:.05,highpass:680});
    osc(c,d,t,.42,48,'sine',.045);
  }

  function cueWorthUnlock(c,t,d){
    hit(c,d,t,{len:.07,freq:620,gain:.20,grit:.035,highpass:720});
    hit(c,d,t+.105,{len:.08,freq:820,gain:.22,grit:.04,highpass:760});
    hit(c,d,t+.215,{len:.10,freq:1120,gain:.24,grit:.045,highpass:840});
    sweep(c,d,t+.04,.46,160,420,'sine',.055);
    osc(c,d,t+.18,.40,74,'sine',.035);
  }

  function cueApRestore(c,t,d){
    hit(c,d,t,{len:.10,freq:420,gain:.36,grit:.10,highpass:580});
    sweep(c,d,t+.04,.32,82,132,'sine',.07);
    hit(c,d,t+.29,{len:.08,freq:980,gain:.18,grit:.035,highpass:820});
    osc(c,d,t,.42,60,'sine',.036);
  }

  const cues={select:cueSelect,activate:cueActivate,step:cueStep,reject:cueReject,refresh:cueRefresh,newClaim:cueNewClaim,worthUnlock:cueWorthUnlock,apRestore:cueApRestore};

  function addFeelStyles(){
    if(document.getElementById('prpgSfxFeel'))return;
    const s=document.createElement('style');
    s.id='prpgSfxFeel';
    s.textContent='.prpg-press{transform:translateY(2px) scale(.995)!important;filter:brightness(1.18) saturate(1.12)!important}.prpg-confirm{box-shadow:0 0 0 1px rgba(245,194,101,.72),0 0 20px rgba(245,172,70,.34)!important}.prpg-commit{box-shadow:0 0 0 1px rgba(143,218,151,.72),0 0 24px rgba(143,218,151,.28)!important}.prpg-reject{box-shadow:0 0 0 1px rgba(255,96,82,.72),0 0 18px rgba(255,80,70,.30)!important}';
    document.head.appendChild(s);
  }

  function pulseEl(el,kind='press'){
    if(!el||!el.classList)return;
    addFeelStyles();
    const cls=kind==='confirm'?'prpg-confirm':kind==='commit'?'prpg-commit':kind==='reject'?'prpg-reject':'prpg-press';
    el.classList.remove('prpg-press','prpg-confirm','prpg-commit','prpg-reject');
    void el.offsetWidth;
    el.classList.add('prpg-press',cls);
    setTimeout(()=>el.classList.remove('prpg-press',cls),kind==='commit'?420:180);
  }

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

  window.PRPGAudio={play,pulse:pulseEl};

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

  function watchSpecialResults(){
    const result=document.getElementById('result');
    if(!result||result.dataset.prpgSfxWatch)return;
    result.dataset.prpgSfxWatch='1';
    let last='';
    const scan=()=>{
      const text=(result.textContent||'').trim();
      if(!text||text===last)return;
      last=text;
      if(/CLAIM ESTABLISHED/i.test(text)) play('newClaim');
      else if(/WORTH UNLOCKED/i.test(text)) play('worthUnlock');
      else if(/Alteration capacity returns/i.test(text)) play('apRestore');
    };
    new MutationObserver(scan).observe(result,{childList:true,characterData:true,subtree:true});
    scan();
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

  const choiceLockKey='prpg.choiceLocks.v42135';
  const branchRules=[
    {day:3,group:'jobNotice',labels:['Accept the recovery job','Pass on the job']},
    {day:4,group:'beaconClaim',labels:['Stake a recovery Claim','Leave it alone']},
    {day:5,group:'serviceSpurRoute',labels:['Use your tools creatively','Alter your tools for the job','Abandon the shortcut']},
    {day:9,group:'greenhouseOffer',labels:['Take the greenhouse job','Decline it']},
    {day:10,group:'greenhouseRun',labels:['Work your way inside','Back out and reassess']},
    {day:16,group:'pumpHouse',labels:['Plan the recovery normally','Walk away from bad conditions']},
    {day:19,group:'relayClaim',labels:['Stake a Claim on the shack','Mark it for later','Walk away']}
  ];

  function readChoiceLocks(){
    try{return JSON.parse(localStorage.getItem(choiceLockKey)||'{}')||{}}
    catch{return {}}
  }

  function writeChoiceLocks(locks){
    try{localStorage.setItem(choiceLockKey,JSON.stringify(locks||{}))}catch{}
  }

  function currentStoryDay(){
    const raw=(document.getElementById('day')?.textContent||'').match(/\d+/);
    return raw?Number(raw[0]):0;
  }

  function choiceLabel(button){
    return (button?.querySelector('strong')?.textContent||button?.textContent||'').replace(/\s+/g,' ').trim();
  }

  function branchForChoice(button){
    const day=currentStoryDay(),label=choiceLabel(button);
    const rule=branchRules.find(r=>r.day===day&&r.labels.includes(label));
    return rule?{key:day+'|'+rule.group,label,rule}:null;
  }

  function setResult(text){
    const box=document.getElementById('result');
    if(box)box.textContent=text;
  }

  function syncChoiceLocks(){
    const locks=readChoiceLocks();
    document.querySelectorAll('button.choice').forEach(button=>{
      const branch=branchForChoice(button);
      if(!branch)return;
      const locked=locks[branch.key];
      if(!locked||locked===branch.label)return;
      button.disabled=true;
      button.classList.add('used');
      button.dataset.choiceState='closed';
      const state=button.querySelector('.choiceState');
      if(state)state.textContent='RESOLVED';
    });
  }

  function installChoiceLocks(){
    document.addEventListener('click',e=>{
      const nav=e.target.closest('button,a');
      if(nav&&['newTutorial','newGame','start','begin'].includes(nav.id)){
        try{localStorage.removeItem(choiceLockKey)}catch{}
      }
      const button=e.target.closest('button.choice');
      if(!button)return;
      const branch=branchForChoice(button);
      if(!branch)return;
      const locks=readChoiceLocks(),locked=locks[branch.key];
      if(locked&&locked!==branch.label){
        e.preventDefault();
        e.stopImmediatePropagation();
        pulseEl(button,'reject');
        play('reject');
        setResult('That branch is already resolved by your earlier choice here. The opposite path is closed unless the story reopens it.');
        syncChoiceLocks();
        return;
      }
      if(!locked){
        locks[branch.key]=branch.label;
        writeChoiceLocks(locks);
      }
    },true);
    const choices=document.getElementById('choices');
    if(choices)new MutationObserver(syncChoiceLocks).observe(choices,{childList:true,subtree:true,characterData:true});
    const day=document.getElementById('day');
    if(day)new MutationObserver(syncChoiceLocks).observe(day,{childList:true,subtree:true,characterData:true});
    syncChoiceLocks();
  }
  installChoiceLocks();

  document.addEventListener('pointerdown',prime,{once:true,capture:true});

  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');
    if(!el||el.id==='prpgSfx')return;
    if(el.disabled){pulseEl(el,'reject');play('reject');return}

    if(el.id==='end'){pulseEl(el,'commit');play('refresh');return}

    const pageChange=el.classList.contains('back')||['newTutorial','newGame','continueGame','enterVerdant','start','begin','finishLesson'].includes(el.id)||!!el.dataset.next||!!el.closest('.nav');
    if(pageChange){pulseEl(el,'press');play('step');return}

    const activates=el.classList.contains('choice')||el.classList.contains('alterChoice')||el.classList.contains('primary');
    if(activates){
      pulseEl(el,'confirm');
      play('select');
      setTimeout(()=>play(failedResult()?'reject':'activate'),55);
      return;
    }

    if(el.classList.contains('prop')||el.classList.contains('simpleClaim')||el.classList.contains('btn')||el.classList.contains('launch')){
      pulseEl(el,'press');
      play('select');
    }
  },true);

  addToggle();
  watchSpecialResults();
})();
