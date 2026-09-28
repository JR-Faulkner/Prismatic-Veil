(()=>{
  'use strict';
  if(window.PVGrowthAudio)return;
  const TOWER='./assets/audio/tower/audition-v1/';
  const MENU='./assets/audio/overworld/menu_sfx/';
  const SOURCES={
    move:[MENU+'pv_menu_move_harvest.m4a',.24],
    back:[MENU+'pv_menu_back_harvest.m4a',.30],
    locked:[TOWER+'harmonic-search.wav',.22],
    preview:[TOWER+'ring-turn.wav',.34],
    align:[TOWER+'ring-align.wav',.36],
    focus:[TOWER+'memory-link.wav',.42],
    skill:[TOWER+'harmonic-lock.wav',.48],
    ascend:[TOWER+'tower-resolve.wav',.38]
  };
  const masters={};
  let enabled=localStorage.getItem('pv.musicEnabled')!=='0';
  let pendingAscend=false;
  for(const [name,[src,volume]] of Object.entries(SOURCES)){
    const audio=new Audio(src+'?pvasset=live31b1');
    audio.preload='auto';
    audio.volume=volume;
    masters[name]=audio;
  }
  function voice(name,volumeScale=1){
    const master=masters[name];
    if(!enabled||!master)return Promise.resolve(false);
    try{
      const audio=master.cloneNode(true);
      audio.volume=Math.min(1,master.volume*volumeScale);
      audio.currentTime=0;
      return audio.play().then(()=>true).catch(()=>false);
    }catch(_){return Promise.resolve(false)}
  }
  function move(){voice('move')}
  function preview(branch='identity'){
    voice('preview',branch==='veilcraft'?.92:branch==='bond'?.82:1);
  }
  function align(){voice('align')}
  function locked(){voice('locked',.72)}
  function focus(){voice('focus');setTimeout(()=>voice('align',.72),180)}
  function skill(){voice('skill');setTimeout(()=>voice('ascend',.62),260)}
  function ascend(){voice('ascend').then(ok=>{pendingAscend=!ok})}
  function back(){voice('back')}
  function unlock(){
    if(pendingAscend){pendingAscend=false;voice('ascend',.82)}
  }
  function setEnabled(value){enabled=!!value}
  addEventListener('storage',event=>{if(event.key==='pv.musicEnabled')setEnabled(event.newValue!=='0')});
  addEventListener('pointerdown',unlock,{once:true,capture:true});
  addEventListener('keydown',unlock,{once:true,capture:true});
  window.PVGrowthAudio={move,preview,align,locked,focus,skill,ascend,back,unlock,setEnabled,sources:{...SOURCES}};
})();
