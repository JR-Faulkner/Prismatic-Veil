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
      src = src.replace(/else\s*\{\s*params\.push\("explorer"\);\s*params\.push\("\/desktop=shell"\);\s*\}/, 'else{console.log("F10.13 HARNESS · bare /bin/wine launch · no explorer fallback");}');
      src = src.replace('written-code JIT disabled · Wine 1.7.55 proven root', 'bare /bin/wine harness · no explorer fallback · written-code JIT disabled · Wine 1.7.55 proven root');
      src = src.replace('const BASE=', "console.log('F10.13 WRAPPER · loaded F10.8 base · bare /bin/wine with no program and no explorer fallback');\nconst BASE=");
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
