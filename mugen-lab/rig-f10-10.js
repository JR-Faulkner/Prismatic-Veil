(function(){
  'use strict';
  const base = './rig-f10-9.js?v=f1010-base-f10-9';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('F10.10 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('F10.9 JIT RECORD WITNESS', 'F10.10 MODULE BROKER OFF');
      src = src.replaceAll('F10.9', 'F10.10');
      src = src.replaceAll('F109_', 'F1010_');
      src = src.replaceAll('mobmugen-f109-jitrecord-trace', 'mobmugen-f1010-brokeroff-trace');
      src = src.replace('jit-record=true&disableWasmJitForWrittenCode=true', 'jit-record=true&disableWasmJitForWrittenCode=true&wasmModuleBroker=0');
      src = src.replace('jit-record enabled · written-code JIT disabled · Wine 1.7.55 proven root', 'jit-record enabled · written-code JIT disabled · wasmModuleBroker=0 · Wine 1.7.55 proven root');
      src = src.replace('const base =', "console.log('F10.10 WRAPPER · loaded F10.9 base · wasmModuleBroker=0');\nconst base =");
      const s = document.createElement('script');
      s.text = src + "\n//# sourceURL=rig-f10-10.generated.js";
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'F10.10 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · F10.10 WRAPPER';
    });
})();
