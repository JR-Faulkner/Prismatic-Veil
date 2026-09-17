(function(){
  'use strict';
  const base = './rig-f10-8.js?v=f109-base-f10-8';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('F10.9 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('F10.8 JIT FAULT WITNESS', 'F10.9 JIT RECORD WITNESS');
      src = src.replaceAll('F10.8', 'F10.9');
      src = src.replaceAll('F108_', 'F109_');
      src = src.replaceAll('mobmugen-f108-writtenjitoff-trace', 'mobmugen-f109-jitrecord-trace');
      src = src.replace('jit-record=false&disableWasmJitForWrittenCode=true', 'jit-record=true&disableWasmJitForWrittenCode=true');
      src = src.replace('written-code JIT disabled · Wine 1.7.55 proven root', 'jit-record enabled · written-code JIT disabled · Wine 1.7.55 proven root');
      src = src.replace('const BASE=', "console.log('F10.9 WRAPPER · loaded F10.8 base · jit-record=true');\nconst BASE=");
      const s = document.createElement('script');
      s.text = src + "\n//# sourceURL=rig-f10-9.generated.js";
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'F10.9 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · F10.9 WRAPPER';
    });
})();
