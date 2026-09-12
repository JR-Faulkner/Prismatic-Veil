(()=>{
  const AC=window.AudioContext||window.webkitAudioContext;
  let ctx=null;
  let enabled=true;

  function getCtx(){
    if(!AC)return null;
    if(!ctx)ctx=new AC();
    return ctx;
  }

  async function unlock(){
    const c=getCtx();
    if(!c)return false;
    try{if(c.state==='suspended')await c.resume();return c.state==='running'}catch(e){return false}
  }

  function gain(c,t,v=1){
    const g=c.createGain();
    g.gain.setValueAtTime(v,t);
    return g;
  }

  function tone(c,t,{freq=880,endFreq=freq,dur=.09,vol=.05,type='sine',attack=.004}={}){
    const o=c.createOscillator(),g=c.createGain();
    o.type=type;
    o.frequency.setValueAtTime(freq,t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+dur);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+attack);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(c.destination);
    o.start(t);o.stop(t+dur+.02);
  }

  function noise(c,t,{dur=.08,vol=.025,highpass=1200,lowpass=9000}={}){
    const n=Math.max(64,Math.floor(c.sampleRate*dur));
    const b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    const s=c.createBufferSource(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),g=c.createGain();
    s.buffer=b;hp.type='highpass';hp.frequency.value=highpass;lp.type='lowpass';lp.frequency.value=lowpass;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(hp).connect(lp).connect(g).connect(c.destination);s.start(t);
  }

  function emit(kind,c){
    const t=c.currentTime+.002;
    switch(kind){
      case 'move':
        tone(c,t,{freq:1450,endFreq:1080,dur:.055,vol:.022,type:'triangle'});
        noise(c,t,{dur:.045,vol:.011,highpass:2800,lowpass:9800});
        break;
      case 'confirm':
        tone(c,t,{freq:740,endFreq:930,dur:.13,vol:.033,type:'sine'});
        tone(c,t+.035,{freq:1110,endFreq:1390,dur:.16,vol:.021,type:'triangle'});
        tone(c,t,{freq:120,endFreq:82,dur:.075,vol:.025,type:'sine'});
        break;
      case 'back':
        tone(c,t,{freq:980,endFreq:620,dur:.13,vol:.026,type:'triangle'});
        tone(c,t+.02,{freq:680,endFreq:430,dur:.11,vol:.017,type:'sine'});
        noise(c,t,{dur:.06,vol:.008,highpass:1900,lowpass:7200});
        break;
      case 'tab':
        noise(c,t,{dur:.105,vol:.018,highpass:700,lowpass:5400});
        tone(c,t+.025,{freq:1250,endFreq:1540,dur:.105,vol:.024,type:'triangle'});
        tone(c,t+.055,{freq:1880,endFreq:2050,dur:.085,vol:.012,type:'sine'});
        break;
      case 'locked':
        tone(c,t,{freq:185,endFreq:145,dur:.16,vol:.027,type:'triangle'});
        tone(c,t+.018,{freq:278,endFreq:220,dur:.12,vol:.012,type:'sine'});
        break;
    }
  }

  function play(kind){
    if(!enabled)return;
    const c=getCtx();if(!c)return;
    if(c.state==='running'){emit(kind,c);return}
    if(c.state==='suspended'){
      c.resume().then(()=>{if(c.state==='running'&&enabled)emit(kind,c)}).catch(()=>{});
    }
  }

  window.PVMenuSFX={unlock,play,setEnabled:v=>{enabled=!!v},get context(){return ctx}};
})();
