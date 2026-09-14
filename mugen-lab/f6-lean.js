async function buildLeanAppFS(file){
  status('BUILDING LEAN APP FS · STREAMED');
  prep.textContent='Extracting boot-critical files only…';
  const tailStart=Math.max(0,file.size-65557);
  const tailBuf=await file.slice(tailStart).arrayBuffer();
  const tv=new DataView(tailBuf);
  let e=-1;
  for(let i=tv.byteLength-22;i>=0;i--){if(u32(tv,i)===0x06054b50){e=i;break}}
  if(e<0)throw new Error('ZIP end record not found for lean build.');
  const cdSize=u32(tv,e+12),cdOffset=u32(tv,e+16);
  const cdBuf=await file.slice(cdOffset,cdOffset+cdSize).arrayBuffer();
  const cv=new DataView(cdBuf),dec=new TextDecoder('utf-8');
  let p=0,entries=[];
  while(p+46<=cv.byteLength&&u32(cv,p)===0x02014b50){
    const method=u16(cv,p+10),comp=u32(cv,p+20),uncomp=u32(cv,p+24),fn=u16(cv,p+28),ex=u16(cv,p+30),cm=u16(cv,p+32),local=u32(cv,p+42);
    const name=dec.decode(new Uint8Array(cdBuf,p+46,fn));
    entries.push({name,method,comp,uncomp,local});
    p+=46+fn+ex+cm;
  }
  const prefix=exeDir?exeDir.replace(/\\/g,'/')+'/':'';
  function keep(ent){
    if(!ent.name||ent.name.endsWith('/'))return false;
    if(prefix&&!ent.name.startsWith(prefix))return false;
    const rel=prefix?ent.name.slice(prefix.length):ent.name;
    const l=rel.toLowerCase();
    if(l==='winmugen.exe')return true;
    if(!l.includes('/')&&/\.(dll|ini|cfg|dat|txt)$/i.test(l))return true;
    return l.startsWith('data/')||l.startsWith('font/')||l.startsWith('sound/')||l.startsWith('plugins/');
  }
  const chosen=entries.filter(keep);
  const packed=chosen.reduce((a,x)=>a+x.comp,0),plain=chosen.reduce((a,x)=>a+x.uncomp,0);
  log('F6 LEAN PLAN · files='+chosen.length+' · compressed='+(packed/1048576).toFixed(1)+' MB · expanded='+(plain/1048576).toFixed(1)+' MB');
  if(!chosen.some(x=>x.name.toLowerCase()==='winmugen.exe'||x.name.toLowerCase().endsWith('/winmugen.exe')))throw new Error('Lean plan lost Winmugen.exe');
  const mem=await new Promise((res,rej)=>BrowserFS.FileSystem.InMemory.Create({},(err,fs)=>err?rej(err):res(fs)));
  BrowserFS.initialize(mem);
  const nfs=BrowserFS.BFSRequire('fs'),Buffer=BrowserFS.BFSRequire('buffer').Buffer;
  function mkdirp(path){const parts=path.split('/').filter(Boolean);let cur='';for(const part of parts){cur+='/'+part;try{nfs.mkdirSync(cur)}catch(err){if(!/EEXIST/.test(String(err)))throw err}}}
  let done=0,liveBytes=0;
  for(const ent of chosen){
    const lh=await file.slice(ent.local,ent.local+30).arrayBuffer(),lv=new DataView(lh);
    if(u32(lv,0)!==0x04034b50)throw new Error('Bad local ZIP header: '+ent.name);
    const fn=u16(lv,26),ex=u16(lv,28),start=ent.local+30+fn+ex;
    const packedBytes=new Uint8Array(await file.slice(start,start+ent.comp).arrayBuffer());
    let raw;
    if(ent.method===0)raw=packedBytes;
    else if(ent.method===8){if(!window.fflate)throw new Error('fflate unavailable');raw=window.fflate.inflateSync(packedBytes)}
    else throw new Error('Unsupported ZIP method '+ent.method+' for '+ent.name);
    const out='/'+ent.name.replace(/^\/+/,''),slash=out.lastIndexOf('/');
    if(slash>0)mkdirp(out.slice(0,slash));
    nfs.writeFileSync(out,Buffer.from(raw));
    liveBytes+=raw.byteLength;done++;
    if(done===1||done%25===0||done===chosen.length){
      prep.textContent='Lean boot FS '+done+'/'+chosen.length+' · '+(liveBytes/1048576).toFixed(1)+' MB';
      log('F6 LEAN PROGRESS · '+done+'/'+chosen.length+' · '+(liveBytes/1048576).toFixed(1)+' MB');
      await new Promise(r=>setTimeout(r,0));
    }
  }
  window.RIGF_APP_FS=mem;
  log('F6 LEAN FS READY · files='+done+' · resident='+(liveBytes/1048576).toFixed(1)+' MB');
  prep.textContent='Lean WinMUGEN filesystem ready · '+done+' files · '+(liveBytes/1048576).toFixed(1)+' MB';
  return mem;
}
