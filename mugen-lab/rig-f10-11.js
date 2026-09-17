(function(){
  'use strict';
  const base = './rig-f10-8.js?v=f1011-base-f10-8';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('F10.11 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('F10.8 JIT FAULT WITNESS', 'F10.11 WINESERVER HARNESS');
      src = src.replaceAll('F10.8', 'F10.11');
      src = src.replaceAll('F108_', 'F1011_');
      src = src.replaceAll('mobmugen-f108-writtenjitoff-trace', 'mobmugen-f1011-wineserver-trace');
      src = src.replace('jit-record=false&disableWasmJitForWrittenCode=true', 'jit-record=false&disableWasmJitForWrittenCode=true');
      src = src.replace("cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p='+encodeURIComponent(prog)+'&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';", "cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p=&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';");
      src = src.replace("ss+='\\n;window.__F105_Config=Config;window.__F105_setConfiguration=setConfiguration;window.__F105_start=start;window.__F105_startEmulator=startEmulator;window.__F105_Module=Module;';", "ss=ss.replace('params.push(\"/bin/wine\");','params.push(\"/bin/wineserver\");console.log(\"F10.11 HARNESS · direct /bin/wineserver launch · no WinMUGEN program arg\");');ss+='\\n;window.__F105_Config=Config;window.__F105_setConfiguration=setConfiguration;window.__F105_start=start;window.__F105_startEmulator=startEmulator;window.__F105_Module=Module;';");
      src = src.replace('written-code JIT disabled · Wine 1.7.55 proven root', 'direct wineserver harness · written-code JIT disabled · Wine 1.7.55 proven root');
      src = src.replace('const BASE=', "console.log('F10.11 WRAPPER · loaded F10.8 base · direct /bin/wineserver harness');\nconst BASE=");
      const s = document.createElement('script');
      s.text = src + "\n//# sourceURL=rig-f10-11.generated.js";
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'F10.11 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · F10.11 WRAPPER';
    });
})();
