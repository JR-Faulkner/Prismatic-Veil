(function(){
  'use strict';
  const base = './rig-f10-8.js?v=f1012-base-f10-8';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('F10.12 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('F10.8 JIT FAULT WITNESS', 'F10.12 WINE NO-PROGRAM HARNESS');
      src = src.replaceAll('F10.8', 'F10.12');
      src = src.replaceAll('F108_', 'F1012_');
      src = src.replaceAll('mobmugen-f108-writtenjitoff-trace', 'mobmugen-f1012-wine-noprogram-trace');
      src = src.replace("cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p='+encodeURIComponent(prog)+'&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';", "cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p=&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';");
      src = src.replace('written-code JIT disabled · Wine 1.7.55 proven root', 'wine no-program harness · written-code JIT disabled · Wine 1.7.55 proven root');
      src = src.replace('const BASE=', "console.log('F10.12 WRAPPER · loaded F10.8 base · /bin/wine with no WinMUGEN program');\nconst BASE=");
      const s = document.createElement('script');
      s.text = src + "\n//# sourceURL=rig-f10-12.generated.js";
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'F10.12 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · F10.12 WRAPPER';
    });
})();
