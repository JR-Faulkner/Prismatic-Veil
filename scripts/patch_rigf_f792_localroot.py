from pathlib import Path

p=Path('mugen-lab/rig-f7.html')
s=p.read_text()
s=s.replace('MobMugen · Rig F · F7.9.1.1','MobMugen · Rig F · F7.9.2')
s=s.replace('MobMugen · Rig F · F7.9.1','MobMugen · Rig F · F7.9.2')
s=s.replace('MOBMUGEN · RIG F · F7.9.1','MOBMUGEN · RIG F · F7.9.2')
s=s.replace('Rig F · F7.9.1','Rig F · F7.9.2')
s=s.replace('F7.9.1 witness log','F7.9.2 witness log')
s=s.replace('WASM JIT · WINE 3.1 PARAMS','WASM JIT · LOCAL WINE 3.1')
s=s.replace("const ROOT_BASE='https://boxedwine.org/v2/2/'", "const ROOT_BASE='./assets/'")

anchor="  src=src.replace('console.log(\"Emulator params:\" + params);','console.log(\"RIGF F7.2 ARGV · \" + params.join(\" | \")); console.log(\"Emulator params:\" + params);');\n"
if anchor not in s:
    raise SystemExit('patchShell anchor not found')

inject=r'''  const __f792Needle='function loadFile(pathPrefix, filename, callback) {';
  const __f792Inject=`function loadFile(pathPrefix, filename, callback) {
            if (filename === 'TinyCore15Wine3.1.zip') {
                const parts=['TinyCore15Wine3.1.zip.part00','TinyCore15Wine3.1.zip.part01','TinyCore15Wine3.1.zip.part02'];
                console.log('RIGF F7.9.2: LOCAL ROOT BEGIN parts='+parts.length);
                Promise.all(parts.map((n,i)=>fetch('./assets/'+n,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('root part '+i+' HTTP '+r.status);return r.arrayBuffer();}))).then(bufs=>{
                    const total=bufs.reduce((a,b)=>a+b.byteLength,0),out=new Uint8Array(total);let off=0;
                    bufs.forEach(b=>{out.set(new Uint8Array(b),off);off+=b.byteLength;});
                    console.log('RIGF F7.9.2: LOCAL ROOT READY bytes='+total);
                    callback(out);
                }).catch(e=>console.error('RIGF F7.9.2: LOCAL ROOT ERROR',e));
                return;
            }
`;
  if(!src.includes(__f792Needle))throw new Error('F7.9.2 upstream loadFile patch point changed');
  src=src.replace(__f792Needle,__f792Inject);
'''
s=s.replace(anchor, anchor+inject, 1)
s=s.replace("log('F7.9.1 ROOT PARAMS · root=TinyCore15Wine3.1 · overlay=NONE');", "log('F7.9.2 ROOT · same-origin split TinyCore15Wine3.1 · overlay=NONE');")
s=s.replace("const text='MOBMUGEN · RIG F · F7.9.1\\nRUNTIME STATUS", "const text='MOBMUGEN · RIG F · F7.9.2\\nRUNTIME STATUS")
p.write_text(s)

d=Path('docs/MOBMUGEN_LIVE.md')
t=d.read_text()
if '## Rig F F7.9.2 - same-origin split Wine 3.1 root' not in t:
    t += '''\n\n## Rig F F7.9.2 - same-origin split Wine 3.1 root\n- F7.9.1 proved the runtime parameters were correct, but Safari returned PROMISE · Load failed before the Wine root was created.\n- F7.9.2 keeps root=TinyCore15Wine3.1 and stores the verified official filesystem as three same-origin chunks under mugen-lab/assets.\n- patchShell now patches upstream loadFile after boxedwine-shell.js is fetched, reconstructing the root before handing it to BoxedWine.\n- Expected reconstructed size: 119229367 bytes. Expected upstream SHA-256: 09296bb395cc2b8a563fc7986f242531e485b2664bd282270eb03e12015ca693.\n'''
    d.write_text(t)
print('F7.9.2 runtime shell local-root patch applied')
