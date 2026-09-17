(function(){
  'use strict';
  const base = './rig-f10-8.js?v=f1013-base-f10-8';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('F10.13 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('F10.8 JIT FAULT WITNESS', 'F10.13 BARE WINE HARNESS');
      src = src.replaceAll('F10.8', 'F10.13');
      src = src.replaceAll('F108_', 'F1013_');
      src = src.replaceAll('mobmugen-f108-writtenjitoff-trace', 'mobmugen-f1013-bare-wine-trace');
      src = src.replace("cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p='+encodeURIComponent(prog)+'&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';", "cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p=&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';");
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
        if(!src.includes(shellFetchAnchor))throw new Error('F10.13 shell-fetch anchor not found in F10.8 base -- base script changed, patch is stale');
        src=src.replace(shellFetchAnchor,"let ss=await sr.text();ss+='\\n;window.__F105_Config=Config;window.__F105_setConfiguration=setConfiguration;window.__F105_start=start;window.__F105_startEmulator=startEmulator;window.__F105_Module=Module;';"+
"const F1013_explorerNeedle=/else\\s*\\{\\s*params\\.push\\(\"explorer\"\\);\\s*params\\.push\\(\"\\/desktop=shell\"\\);\\s*\\}/;if(!F1013_explorerNeedle.test(ss))throw new Error('F10.13 explorer-fallback needle not found in fetched shell -- upstream shell text changed, patch is stale');ss=ss.replace(F1013_explorerNeedle,'else{console.log(\"F10.13 HARNESS \\u00b7 bare /bin/wine launch \\u00b7 no explorer fallback\");}');");
      }
      src = src.replace('written-code JIT disabled · Wine 1.7.55 proven root', 'bare /bin/wine harness · no explorer fallback · written-code JIT disabled · Wine 1.7.55 proven root');
      src = src.replace('const BASE=', "console.log('F10.13 WRAPPER · loaded F10.8 base · bare /bin/wine with no program and no explorer fallback');\nconst BASE=");
      src = src.replace("try{await navigator.clipboard.writeText(text);copyBtn.textContent='COPIED'}catch(_){copyBtn.textContent='COPY FAILED'}setTimeout(()=>copyBtn.textContent='COPY TRACE',1000)", "try{await navigator.clipboard.writeText(text);copyBtn.textContent='COPIED'}catch(_){let ta=document.getElementById('traceFallback');if(!ta){ta=document.createElement('textarea');ta.id='traceFallback';ta.setAttribute('readonly','readonly');ta.style.cssText='position:fixed;left:10px;right:10px;bottom:62px;z-index:30;height:42vh;background:#05070c;color:#eef4ff;border:1px solid #7a6227;border-radius:12px;padding:10px;font:10px ui-monospace;white-space:pre-wrap';document.body.appendChild(ta)}ta.value=text;ta.classList.remove('hide');ta.focus();ta.select();copyBtn.textContent='SELECT TRACE'}setTimeout(()=>copyBtn.textContent='COPY TRACE',2500)");
      const s = document.createElement('script');
      s.text = src + "\n//# sourceURL=rig-f10-13.generated.js";
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'F10.13 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · F10.13 WRAPPER';
    });
})();
