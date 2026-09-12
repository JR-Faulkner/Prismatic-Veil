(()=>{
  'use strict';
  const BASE='./assets/audio/overworld/menu_sfx/';
  const FILES={
    move:'pv_menu_move_harvest.m4a',
    confirm:'pv_menu_confirm_harvest.m4a',
    back:'pv_menu_back_harvest.m4a',
    tab:'pv_menu_tab_harvest.m4a',
    locked:'pv_menu_locked_harvest.m4a'
  };
  const VOLUME={move:.34,confirm:.42,back:.36,tab:.36,locked:.38};
  let enabled=true,unlocked=false;
  const pool={};
  for(const [kind,file] of Object.entries(FILES)){
    const a=new Audio(BASE+file+'?pvasset=live29e-harvest1');
    a.preload='auto';
    a.volume=VOLUME[kind];
    pool[kind]=a;
  }
  async function unlock(){
    unlocked=true;
    return true;
  }
  function play(kind){
    if(!enabled)return;
    unlocked=true;
    const base=pool[kind];
    if(!base)return;
    try{
      const a=base.cloneNode(true);
      a.volume=VOLUME[kind];
      a.currentTime=0;
      a.play().catch(()=>{});
    }catch(_){ }
  }
  function setEnabled(v){enabled=!!v}
  window.PVMenuSFX={unlock,play,setEnabled,get unlocked(){return unlocked},files:{...FILES}};
})();
