(()=>{
  'use strict';
  if(window.PVSaveState)return;

  const SAVE_KEY='pv.save.v1';
  const isOverworld=/hybrid-overworld\.html$/i.test(location.pathname);
  const RUN_KEYS=Object.freeze([
    'pv.currentLocation','pv.lastLocation','pv.resonance.sync','pv.progression.v1',
    'pv.encounterResult','pv.pendingEncounter','pv.partySelected','pv.homecomingResume'
  ]);
  const CLEAR_PREFIX='pv.locationClear.';
  const NEW_RUN_DEFAULTS=Object.freeze({
    'pv.currentLocation':'home',
    'pv.lastLocation':'home',
    'pv.partySelected':'prismel'
  });

  function storage(){return window.localStorage}
  function read(key){try{return storage().getItem(key)}catch(_){return null}}
  function write(key,value){try{storage().setItem(key,value);return true}catch(_){return false}}
  function remove(key){try{storage().removeItem(key)}catch(_){}
  }
  function clearRun(){
    RUN_KEYS.forEach(remove);
    try{Object.keys(storage()).filter(key=>key.startsWith(CLEAR_PREFIX)).forEach(remove)}catch(_){ }
  }
  function captureRun(){
    const run={};
    RUN_KEYS.forEach(key=>{const value=read(key);if(value!=null)run[key]=value});
    try{run.clears=Object.fromEntries(Object.keys(storage()).filter(key=>key.startsWith(CLEAR_PREFIX)).map(key=>[key,read(key)]))}catch(_){run.clears={}}
    return {schema:1,savedAt:Date.now(),run};
  }
  function saveRun(){
    const snapshot=captureRun();
    write(SAVE_KEY,JSON.stringify(snapshot));
    return snapshot;
  }
  function loadRun(){
    try{
      const parsed=JSON.parse(read(SAVE_KEY)||'null');
      return parsed?.schema===1&&parsed.run&&typeof parsed.run==='object'?parsed:null;
    }catch(_){return null}
  }
  function hasSave(){return !!loadRun()}
  function restoreRun(){
    const snapshot=loadRun();
    if(!snapshot)return false;
    clearRun();
    Object.entries(snapshot.run||{}).forEach(([key,value])=>{
      if(key==='clears'||!RUN_KEYS.includes(key))return;
      write(key,value);
    });
    Object.entries(snapshot.run?.clears||{}).forEach(([key,value])=>{
      if(key.startsWith(CLEAR_PREFIX))write(key,value);
    });
    return true;
  }
  function newGame(){clearRun();remove(SAVE_KEY);return true}
  function initializeNewRun(){
    newGame();
    Object.entries(NEW_RUN_DEFAULTS).forEach(([key,value])=>write(key,value));
    return captureRun();
  }
  function formatSavedAt(){const snapshot=loadRun();if(!snapshot)return '';try{return new Date(snapshot.savedAt).toLocaleString()}catch(_){return ''}}

  window.PVSaveState={SAVE_KEY,RUN_KEYS,NEW_RUN_DEFAULTS,captureRun,saveRun,loadRun,hasSave,restoreRun,newGame,initializeNewRun,clearRun,formatSavedAt};

  if(!isOverworld){
    const style=document.createElement('style');
    style.id='pv-save-menu-style';
    style.textContent='.menu{flex-wrap:wrap;max-height:30vh;overflow:auto}.menu .go{flex:0 1 auto}';
    document.head.appendChild(style);
  }

  // Autosave is intentionally bound to the map shell only. Battle remains
  // owned by the Hybrid/K adapter; its return writes the same run keys, and
  // this boundary snapshots them for Continue without touching combat state.
  if(isOverworld){
    const snapshot=()=>saveRun();
    setTimeout(snapshot,900);
    setInterval(snapshot,5000);
    addEventListener('pagehide',snapshot);
    addEventListener('visibilitychange',()=>{if(document.hidden)snapshot()});
    addEventListener('click',e=>{if(e.target.closest?.('#travelButton,.tab,[data-tab]'))setTimeout(snapshot,220)});
  }
})();

