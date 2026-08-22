// PriZim Kineza Attack Style Lab v3
// Clean browser-native image loading against verified binary style sheets.
const BUILD_MARKER = 'KINEZA-STYLE-AUDITION-003';
const MANIFESTS = [
  './pv-data/sequences/kineza_attack_style_epic.sequence.json',
  './pv-data/sequences/kineza_attack_style_jrpg.sequence.json',
  './pv-data/sequences/kineza_attack_style_graphic.sequence.json'
];
const VERSION = '3';
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

class KinezaAttackStyleLabV3 {
  constructor() {
    this.manifests=[]; this.images=new Map(); this.visited=new Map();
    this.styleIndex=0; this.frameIndex=0; this.playing=false; this.loop=true; this.speed=1; this.token=0;
    this.canvas=$('#attack-canvas');
    this.ctx=this.canvas.getContext('2d',{willReadFrequently:true});
  }

  async init() {
    this.manifests = await Promise.all(MANIFESTS.map(async url => {
      const r=await fetch(`${url}?v=${VERSION}`,{cache:'no-store'});
      if(!r.ok) throw new Error(`Manifest load failed: ${url} (${r.status})`);
      return r.json();
    }));
    this.assertLock();
    this.manifests.forEach(m=>this.visited.set(m.id,new Set()));
    await Promise.all(this.manifests.map(m=>this.loadSheet(m)));
    this.bind(); this.renderStyleButtons(); this.resize(); this.render();
    window.addEventListener('resize',()=>{this.resize();this.render();});
    $('#boot-status').textContent=`PRIZIM LOCK • 3 STYLES • 6 FRAMES • ${BUILD_MARKER}`;
    window.__KINEZA_STYLE_LAB__={
      ready:true, buildMarker:BUILD_MARKER,
      selectStyle:i=>this.selectStyle(i), setFrame:i=>this.setFrame(i),
      playOnce:i=>this.playOnce(i), compareOnce:()=>this.compareOnce(),
      getState:()=>this.getState()
    };
  }

  signature(m){return (m.frames||[]).map(f=>[f.label,f.holdMs,f.blendMs,f.cue||'']);}
  assertLock(){
    if(this.manifests.length!==3) throw new Error(`Expected 3 style manifests, found ${this.manifests.length}`);
    const base=JSON.stringify(this.signature(this.manifests[0]));
    const group=this.manifests[0].comparisonGroup;
    for(const m of this.manifests){
      if(m.comparisonGroup!==group) throw new Error('Comparison group mismatch');
      if((m.frames||[]).length!==6) throw new Error(`${m.styleVariant} does not contain 6 frames`);
      if(JSON.stringify(this.signature(m))!==base) throw new Error(`Choreography lock mismatch: ${m.styleVariant}`);
    }
  }

  async loadSheet(m){
    const sheet=m.sheets?.attack;
    if(!sheet?.asset) throw new Error(`Missing attack sheet: ${m.styleVariant}`);
    const img=new Image(); img.decoding='async';
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=()=>reject(new Error(`Sheet failed: ${sheet.asset}`));
      img.src=`${sheet.asset}?v=${BUILD_MARKER}`;
    });
    if(!img.naturalWidth||!img.naturalHeight) throw new Error(`Sheet has no dimensions: ${sheet.asset}`);
    const cols=Number(sheet.cols)||1, rows=Number(sheet.rows)||1;
    if(img.naturalWidth<cols||img.naturalHeight<rows) throw new Error(`Sheet dimensions invalid: ${sheet.asset}`);
    this.images.set(m.id,img);
  }

  bind(){
    $('#play').onclick=()=>this.togglePlay(); $('#compare').onclick=()=>this.toggleCompare();
    $('#prev').onclick=()=>this.step(-1); $('#next').onclick=()=>this.step(1);
    $('#loop').onclick=()=>{this.loop=!this.loop;$('#loop').classList.toggle('on',this.loop);$('#loop').textContent=this.loop?'LOOP ON':'LOOP OFF';};
    $('#speed').onchange=e=>{this.speed=Number(e.target.value)||1;};
    document.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>this.setFrame(Number(b.dataset.frame)));
  }

  renderStyleButtons(){
    const wrap=$('#styles'); wrap.innerHTML='';
    this.manifests.forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.textContent=m.styleVariant.replaceAll('-',' ').toUpperCase();b.onclick=()=>this.selectStyle(i);wrap.appendChild(b);});
  }

  resize(){
    const r=this.canvas.parentElement.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,3);
    this.canvas.width=Math.max(1,Math.round(r.width*dpr)); this.canvas.height=Math.max(1,Math.round(r.height*dpr));
    this.canvas.style.width=`${r.width}px`; this.canvas.style.height=`${r.height}px`;
    this.ctx.setTransform(dpr,0,0,dpr,0,0); this.ctx.imageSmoothingEnabled=true; this.ctx.imageSmoothingQuality='high';
  }

  render(){
    const m=this.manifests[this.styleIndex], img=m&&this.images.get(m.id); if(!m||!img)return;
    const f=m.frames[this.frameIndex], sheet=m.sheets.attack, cols=Number(sheet.cols)||1, rows=Number(sheet.rows)||1;
    const cw=Math.floor(img.naturalWidth/cols), ch=Math.floor(img.naturalHeight/rows), idx=Number(f.sheetIndex)||0;
    const sx=(idx%cols)*cw, sy=Math.floor(idx/cols)*ch, r=this.canvas.parentElement.getBoundingClientRect();
    this.ctx.clearRect(0,0,r.width,r.height); this.ctx.fillStyle='#08101e'; this.ctx.fillRect(0,0,r.width,r.height);
    const scale=Math.min(r.width/cw,r.height/ch), dw=cw*scale, dh=ch*scale;
    this.ctx.drawImage(img,sx,sy,cw,ch,(r.width-dw)/2,(r.height-dh)/2,dw,dh);
    this.visited.get(m.id)?.add(this.frameIndex);
    $('#style-label').textContent=m.styleVariant.replaceAll('-',' ').toUpperCase();
    $('#frame-label').textContent=`${this.frameIndex+1}/6 · ${f.label.toUpperCase()}`;
    $('#timing').textContent=`${f.holdMs}ms HOLD · ${f.blendMs}ms BLEND`; $('#cue').textContent=(f.cue||'—').toUpperCase();
    document.querySelectorAll('[data-frame]').forEach((b,i)=>b.classList.toggle('active',i===this.frameIndex));
    [...$('#styles').children].forEach((b,i)=>b.classList.toggle('active',i===this.styleIndex));
  }

  stop(){this.playing=false;this.token++;$('#play').textContent='PLAY';$('#compare').textContent='COMPARE A→B→C';}
  async selectStyle(i){this.stop();this.styleIndex=(Number(i)+3)%3;this.frameIndex=0;this.render();}
  async setFrame(i){this.stop();this.frameIndex=(Number(i)+6)%6;this.render();}
  async step(d){await this.setFrame(this.frameIndex+d);}
  async runStyle(i,token){this.styleIndex=i;for(let f=0;f<6;f++){if(!this.playing||token!==this.token)return false;this.frameIndex=f;this.render();await sleep(Math.max(35,Number(this.manifests[i].frames[f].holdMs||160)/this.speed));}return this.playing&&token===this.token;}
  async playOnce(i=this.styleIndex){this.stop();this.playing=true;$('#play').textContent='STOP';const t=++this.token;const ok=await this.runStyle(Number(i),t);if(t===this.token){this.playing=false;$('#play').textContent='PLAY';}return ok;}
  async compareOnce(){this.stop();this.playing=true;$('#compare').textContent='STOP COMPARE';const t=++this.token;for(let i=0;i<3;i++){if(!(await this.runStyle(i,t)))return false;if(i<2)await sleep(120/this.speed);}if(t===this.token){this.playing=false;$('#play').textContent='PLAY';$('#compare').textContent='COMPARE A→B→C';}return t===this.token;}
  async togglePlay(){if(this.playing)return this.stop();if(!this.loop)return this.playOnce();this.stop();this.playing=true;$('#play').textContent='STOP';const t=++this.token;while(this.playing&&t===this.token){if(!(await this.runStyle(this.styleIndex,t)))break;}}
  async toggleCompare(){if(this.playing)return this.stop();await this.compareOnce();}

  canvasHasPixels(){
    const dpr=Math.min(devicePixelRatio||1,3), w=Math.max(1,Math.floor(this.canvas.width/dpr)), h=Math.max(1,Math.floor(this.canvas.height/dpr));
    const sw=Math.min(w,220), sh=Math.min(h,160), x=Math.max(0,Math.floor((w-sw)/2)), y=Math.max(0,Math.floor((h-sh)/2));
    const data=this.ctx.getImageData(x,y,sw,sh).data; let art=0;
    for(let i=0;i<data.length;i+=4){const delta=Math.abs(data[i]-8)+Math.abs(data[i+1]-16)+Math.abs(data[i+2]-30);if(data[i+3]>32&&delta>42&&++art>=40)return true;}return false;
  }
  getState(){return{styleIndex:this.styleIndex,frameIndex:this.frameIndex,playing:this.playing,buildMarker:BUILD_MARKER,canvasHasPixels:this.canvasHasPixels(),visited:Object.fromEntries([...this.visited].map(([k,v])=>[k,[...v].sort((a,b)=>a-b)]))};}
}

window.addEventListener('DOMContentLoaded',async()=>{try{await new KinezaAttackStyleLabV3().init();}catch(error){console.error(error);$('#boot-status').textContent=`PRIZIM FAIL • ${error.message}`;$('#boot-status').classList.add('fail');}});
