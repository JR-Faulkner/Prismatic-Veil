(function(){
  'use strict';
  const base = './rig-f10-8.js?v=f1016-base-f10-8';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('F10.16 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('F10.8 JIT FAULT WITNESS', 'F10.16 CRASH-SITE WITNESS');
      src = src.replaceAll('F10.8', 'F10.16');
      src = src.replaceAll('F108_', 'F1016_');
      src = src.replaceAll('mobmugen-f108-writtenjitoff-trace', 'mobmugen-f1016-crashsite-trace');
      src = src.replace("cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p='+encodeURIComponent(prog)+'&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';", "cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p='+encodeURIComponent('cmd.exe')+'&args='+encodeURIComponent('/c echo F10.15-alive')+'&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';");
      // Widen the fault witness before shipping: cmd.exe headless-tests
      // showed Wine's OWN in-process crash handler emitting a completely
      // different message format -- "Unhandled page fault on read access
      // to <addr>" and "Call from <eip> to unimplemented function <name>,
      // aborting" -- neither matches "Page Fault at %.8X" (the base
      // witness's only pattern), so faultSummary() reported zero even
      // while these repeated dozens of times in the visible trace.
      {
        const stateAnchor="let faults=0,faultAddrs=new Map(),inDump=false,showDump=false,dumpsShown=0,lastSummary=0;";
        if(!src.includes(stateAnchor))throw new Error('F10.16 fault-state anchor not found in F10.8 base -- base script changed, patch is stale');
        src=src.replace(stateAnchor,"let faults=0,faultAddrs=new Map(),inDump=false,showDump=false,dumpsShown=0,lastSummary=0;\nlet unhFaults=0,unhAddrs=new Map(),unhShown=0,unimplCalls=0,unimplNames=new Map(),unimplShown=0;let unhLastSummary=0,unimplLastSummary=0;\nlet crashMods=new Map(),crashHits=0,crashShown=0,crashLastSummary=0,stackMods=new Map(),stackHits=0,stackShown=0,stackLastSummary=0;");
        const summaryAnchor="function faultSummary(){if(!faults)return 'none';const t=[...faultAddrs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([a,n])=>a+' x'+n).join(', ');return faults+' faults \u00b7 '+faultAddrs.size+' distinct addr \u00b7 '+t}";
        if(!src.includes(summaryAnchor))throw new Error('F10.16 faultSummary anchor not found in F10.8 base -- base script changed, patch is stale');
        src=src.replace(summaryAnchor,"function faultSummary(){if(!faults)return 'none';const t=[...faultAddrs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([a,n])=>a+' x'+n).join(', ');return faults+' faults \u00b7 '+faultAddrs.size+' distinct addr \u00b7 '+t+((typeof unhFaults!=='undefined'&&unhFaults)?(' \u00b7 '+unhFaults+' unhandled-page-faults \u00b7 '+[...unhAddrs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([a,n])=>a+' x'+n).join(', ')):'')+((typeof unimplCalls!=='undefined'&&unimplCalls)?(' \u00b7 '+unimplCalls+' unimplemented-function aborts \u00b7 '+[...unimplNames.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([a,n])=>a+' x'+n).join(', ')):'')+((typeof crashHits!=='undefined'&&crashHits)?(' \u00b7 CRASH SITE(S): '+crashHits+' \u00b7 '+[...crashMods.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([a,n])=>a+' x'+n).join(', ')):' \u00b7 CRASH SITE: none captured (module name never matched)')}");
        const siftAnchor="function sift(tag,s){\n  const fm=s.match(/Page Fault at\\s*([0-9A-Fa-f]+)/);\n  if(fm){";
        if(!src.includes(siftAnchor))throw new Error('F10.16 sift-head anchor not found in F10.8 base -- base script changed, patch is stale');
        src=src.replace(siftAnchor,"function sift(tag,s){\n  const rd=s.match(/^([0-9A-Fa-f]{8})\\s+EAX=[0-9A-Fa-f]{8}\\s+ECX=[0-9A-Fa-f]{8}\\s+EDX=[0-9A-Fa-f]{8}\\s+EBX=[0-9A-Fa-f]{8}\\s+ESP=[0-9A-Fa-f]{8}\\s+EBP=[0-9A-Fa-f]{8}\\s+ESI=[0-9A-Fa-f]{8}\\s+EDI=[0-9A-Fa-f]{8}\\s+(.+?)\\s+at\\s+([0-9A-Fa-f]{8})/);\n  if(rd){const mod=rd[2].trim();crashMods.set(mod,(crashMods.get(mod)||0)+1);crashHits++;\n    if(crashShown<2){crashShown++;log('F10.16 CRASH SITE \u00b7 '+s.slice(0,1200))}\n    else if(crashHits-crashLastSummary>=50){crashLastSummary=crashHits;log('F10.16 CRASH SITE SUMMARY \u00b7 '+crashHits+' \u00b7 '+[...crashMods.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([a,n])=>a+' x'+n).join(', '))}\n    return}\n  const sw=s.match(/^\\s*(\\S[\\S ]*?)\\s{2,}\\S*\\s*([0-9A-Fa-f]{8})\\s*\\/\\s*([0-9A-Fa-f]{8})\\s*$/);\n  if(sw){const mod=sw[1].trim();stackMods.set(mod,(stackMods.get(mod)||0)+1);stackHits++;\n    if(stackShown<10){stackShown++;log('F10.16 STACK \u00b7 '+s.slice(0,1200))}\n    else if(stackHits-stackLastSummary>=100){stackLastSummary=stackHits;log('F10.16 STACK SUMMARY \u00b7 '+stackHits+' \u00b7 '+[...stackMods.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([a,n])=>a+' x'+n).join(', '))}\n    return}\n  const uhf=s.match(/Unhandled page fault on read access to\\s*(0x[0-9A-Fa-f]+)/i);\n  if(uhf){const addr=uhf[1].toUpperCase();unhFaults++;unhAddrs.set(addr,(unhAddrs.get(addr)||0)+1);\n    if(unhShown<2){unhShown++;log('BW '+tag+' \u00b7 '+s.slice(0,1200));return}\n    if(unhFaults-unhLastSummary>=50){unhLastSummary=unhFaults;log('F10.16 UNHANDLED-FAULT SUMMARY \u00b7 '+unhFaults+' \u00b7 '+[...unhAddrs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([a,n])=>a+' x'+n).join(', '))}\n    return}\n  const uic=s.match(/to unimplemented function\\s*([^,]+),\\s*abort/i);\n  if(uic){const name=uic[1].trim();unimplCalls++;unimplNames.set(name,(unimplNames.get(name)||0)+1);\n    if(unimplShown<2){unimplShown++;log('BW '+tag+' \u00b7 '+s.slice(0,1200));return}\n    if(unimplCalls-unimplLastSummary>=50){unimplLastSummary=unimplCalls;log('F10.16 UNIMPLEMENTED-CALL SUMMARY \u00b7 '+unimplCalls+' \u00b7 '+[...unimplNames.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([a,n])=>a+' x'+n).join(', '))}\n    return}\n  const fm=s.match(/Page Fault at\\s*([0-9A-Fa-f]+)/);\n  if(fm){");
      }

      // BUG FIX (found while building F10.14): the explorer/desktop=shell
      // fallback lives inside boxedwine-shell.js, fetched AT RUNTIME by the
      // base script into a local `ss` -- the string "explorer" does not
      // appear anywhere in rig-f10-8.js, so the regex below (which matched
      // against `src`, the wrapper's own fetched source) could never have
      // matched anything. It silently no-op'd: F10.13 has been launching
      // /bin/wine explorer /desktop=shell all along, identical to F10.12,
      // contrary to its own stated purpose. Fixed by patching `ss` itself.
      {
        const shellFetchAnchor="let ss=await sr.text();ss+='\\n;window.__F105_Config=Config;window.__F105_setConfiguration=setConfiguration;window.__F105_start=start;window.__F105_startEmulator=startEmulator;window.__F105_Module=Module;';";
        if(!src.includes(shellFetchAnchor))throw new Error('F10.16 shell-fetch anchor not found in F10.8 base -- base script changed, patch is stale');
        src=src.replace(shellFetchAnchor,"let ss=await sr.text();ss+='\\n;window.__F105_Config=Config;window.__F105_setConfiguration=setConfiguration;window.__F105_start=start;window.__F105_startEmulator=startEmulator;window.__F105_Module=Module;';"+
"const F1016_explorerNeedle=/else\\s*\\{\\s*params\\.push\\(\"explorer\"\\);\\s*params\\.push\\(\"\\/desktop=shell\"\\);\\s*\\}/;if(!F1016_explorerNeedle.test(ss))throw new Error('F10.16 explorer-fallback needle not found in fetched shell -- upstream shell text changed, patch is stale');ss=ss.replace(F1016_explorerNeedle,'else{console.log(\"F10.16 HARNESS \\u00b7 cmd.exe launch \\u00b7 no explorer fallback\");}');");
      }
      src = src.replace('written-code JIT disabled · Wine 1.7.55 proven root', 'crash-site witness · cmd.exe PE-execution probe · Wine 1.7.55 proven root');
      src = src.replace('const BASE=', "console.log('F10.16 WRAPPER · loaded F10.8 base · same F10.15 test, widened fault filter to capture crash-site details');\nconst BASE=");
      src = src.replace("try{await navigator.clipboard.writeText(text);copyBtn.textContent='COPIED'}catch(_){copyBtn.textContent='COPY FAILED'}setTimeout(()=>copyBtn.textContent='COPY TRACE',1000)", "try{await navigator.clipboard.writeText(text);copyBtn.textContent='COPIED'}catch(_){let ta=document.getElementById('traceFallback');if(!ta){ta=document.createElement('textarea');ta.id='traceFallback';ta.setAttribute('readonly','readonly');ta.style.cssText='position:fixed;left:10px;right:10px;bottom:62px;z-index:30;height:42vh;background:#05070c;color:#eef4ff;border:1px solid #7a6227;border-radius:12px;padding:10px;font:10px ui-monospace;white-space:pre-wrap';document.body.appendChild(ta)}ta.value=text;ta.classList.remove('hide');ta.focus();ta.select();copyBtn.textContent='SELECT TRACE'}setTimeout(()=>copyBtn.textContent='COPY TRACE',2500)");
      const s = document.createElement('script');
      s.text = src + "\n//# sourceURL=rig-f10-16.generated.js";
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'F10.16 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · F10.16 WRAPPER';
    });
})();
