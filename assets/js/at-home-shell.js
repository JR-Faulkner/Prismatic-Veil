(()=>{
const SAVE='at_game_v4_week1';
const FALLBACK_BUILD='v4.20.1';
const ART='./assets/ui/at-mock1/at_splash_mock1_982x2129.webp?v=v4.20.1';
document.documentElement.style.background='#020709';

const style=document.createElement('style');
style.textContent=`
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;height:100dvh;background:#020709;color:#fff;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif}
.atRoot{position:fixed;inset:0;background:#020709;overflow:hidden}
.art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block;user-select:none;-webkit-user-drag:none}
.splashShade{position:absolute;inset:0;background:#020709;opacity:1;transition:opacity .45s ease;pointer-events:none}
.ready .splashShade{opacity:0}
.menuUI{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .42s ease}
.menuMode .menuUI{opacity:1;pointer-events:auto}
.actions{position:absolute;left:50%;top:63.5%;transform:translateX(-50%);width:min(82vw,372px);display:grid;gap:10px}
.launch{position:relative;width:100%;height:55px;border:1px solid #67f4ee;border-radius:4px;clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px);background:linear-gradient(180deg,#0a2830e8,#031319f2);color:#f5ffff;font:900 12px/1 system-ui;letter-spacing:.12em;text-shadow:0 1px 2px #000;box-shadow:inset 0 0 0 2px #051114,inset 0 0 20px #2aece521,0 0 10px #2de6df38;touch-action:manipulation}
.launch:before,.launch:after{content:"";position:absolute;top:13px;width:5px;height:29px;border-radius:2px;background:#ffb52e;box-shadow:0 0 10px #ffb52ea8}
.launch:before{left:5px}.launch:after{right:5px}
.launch:active{transform:translateY(1px);filter:brightness(1.16)}
.launch[hidden]{display:none}
.continue{border-color:#7eece7}
.saveNote{position:absolute;left:50%;top:83.8%;transform:translateX(-50%);width:86vw;margin:0;text-align:center;color:#b7cbce;font:800 8px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-shadow:0 2px 4px #000}
.version{position:absolute;left:calc(8px + env(safe-area-inset-left));bottom:calc(6px + env(safe-area-inset-bottom));padding:4px 6px;border:1px solid #5fe4de44;background:#020709b8;color:#7f9a9f;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}
.tapSkip{position:absolute;right:calc(8px + env(safe-area-inset-right));bottom:calc(7px + env(safe-area-inset-bottom));font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;color:#789093;opacity:.65}
.menuMode .tapSkip{display:none}
@media(max-width:430px){.actions{top:64.2%;width:min(84vw,350px);gap:9px}.launch{height:52px;font-size:11px}.saveNote{top:84.2%}}
@media(max-height:720px){.actions{top:61.5%;gap:7px}.launch{height:47px}.saveNote{top:84.5%}}
@media(prefers-reduced-motion:reduce){.splashShade,.menuUI{transition:none}}
`;
document.head.appendChild(style);

document.body.innerHTML=`
<main class="atRoot" id="atRoot">
  <img class="art" id="atArt" alt="A+T · Alterations of Transformations · The Verdant">
  <div class="splashShade"></div>
  <section class="menuUI" aria-label="A+T launcher">
    <div class="actions">
      <button class="launch" id="newTutorial">NEW GAME · TUTORIAL</button>
      <button class="launch" id="newGame">NEW GAME · SKIP TUTORIAL</button>
      <button class="launch continue" id="continueGame" hidden>CONTINUE</button>
    </div>
    <p class="saveNote" id="saveNote"></p>
  </section>
  <div class="version" id="version">A+T V4.20.0 · PLAYTEST</div>
  <div class="tapSkip">TAP TO CONTINUE</div>
</main>`;

const root=document.getElementById('atRoot');
const art=document.getElementById('atArt');
const params=new URLSearchParams(location.search);
if(params.get('reset')==='1'){
  localStorage.removeItem(SAVE);
  const q=new URLSearchParams(location.search);q.delete('reset');
  history.replaceState({},'',location.pathname+(q.toString()?'?'+q.toString():''));
}

let BUILD=localStorage.getItem('at.liveBuild')||FALLBACK_BUILD;
const version=document.getElementById('version');
const continueBtn=document.getElementById('continueGame');
const note=document.getElementById('saveNote');

function setBuild(v){
  if(!v)return;
  BUILD=v;
  localStorage.setItem('at.liveBuild',v);
  version.textContent='A+T '+String(v).toUpperCase()+' · PLAYTEST';
}
function refreshSave(){
  const saved=!!localStorage.getItem(SAVE);
  continueBtn.hidden=!saved;
  note.textContent=saved?'VERDANT SAVE DETECTED':'FRESH START READY';
}
function launch(path){
  sessionStorage.setItem('at_launch_token','1');
  location.href=path;
}
function showMenu(){
  if(root.classList.contains('menuMode'))return;
  root.classList.add('menuMode');
}
art.onload=()=>{
  root.classList.add('ready');
  if(params.get('menu')==='1'||matchMedia('(prefers-reduced-motion:reduce)').matches) showMenu();
  else setTimeout(showMenu,1650);
};
art.onerror=()=>{
  root.classList.add('ready','menuMode');
  root.style.background='radial-gradient(circle at 50% 35%,#0b252b,#020709 70%)';
};
art.src=ART;

root.addEventListener('click',e=>{
  if(!root.classList.contains('menuMode')&&!e.target.closest('button'))showMenu();
});
addEventListener('keydown',()=>{if(!root.classList.contains('menuMode'))showMenu()},{once:true});
addEventListener('pageshow',refreshSave);
refreshSave();

document.getElementById('newTutorial').onclick=()=>{
  localStorage.removeItem(SAVE);
  launch('./at-tutorial.html?v='+encodeURIComponent(BUILD));
};
document.getElementById('newGame').onclick=()=>{
  localStorage.removeItem(SAVE);
  launch('./at-game-v4.html?new=1&v='+encodeURIComponent(BUILD));
};
continueBtn.onclick=()=>launch('./at-game-v4.html?continue=1&v='+encodeURIComponent(BUILD));

fetch('./at-build.json?ts='+Date.now(),{cache:'no-store'})
  .then(r=>r.ok?r.json():null)
  .then(b=>{if(b&&b.build)setBuild(b.build)})
  .catch(()=>{});
})();