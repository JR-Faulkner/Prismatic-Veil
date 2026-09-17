(function(){
  'use strict';
  // F10.14: same bare-/bin/wine launch shape as F10.13 (no explorer fallback,
  // no WinMUGEN program argument), same root/overlay/capsule. The ONLY
  // variable changed from F10.13 is the CPU core: this build points BASE at
  // boxedwine-f83-fallback/ (CPU_MODE.txt = NON_JIT_RELEASE), whose shell is
  // byte-identical to the JIT core's shell (both hash 564ae0c4...). Nothing
  // else moves. If this boots WinMUGEN, the fault is JIT-core-specific, not
  // the new shell or the bare-wine launch path; if it faults the same way,
  // the seven-test Wine-launch bisection has been chasing the wrong subsystem.
  const base = './rig-f10-8.js?v=f1014-base-f10-8';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('F10.14 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('F10.8 JIT FAULT WITNESS', 'F10.14 NON-JIT CORE HARNESS');
      src = src.replaceAll('F10.8', 'F10.14');
      src = src.replaceAll('F108_', 'F1014_');
      src = src.replaceAll('mobmugen-f108-writtenjitoff-trace', 'mobmugen-f1014-nonjit-core-trace');

      // Same bare-/bin/wine, no-program, no-explorer-fallback launch shape as F10.13.
      src = src.replace(
        "cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p='+encodeURIComponent(prog)+'&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory&jit-record=false&disableWasmJitForWrittenCode=true';",
        "cfg.urlParams='root='+ROOT+'&overlay=wine1.7.55-v8-min-online.zip&app='+APP+'&p=&w='+encodeURIComponent(work)+'&auto=true&sound=false&bpp=16&storage=memory';"
      );
      src = src.replace(
        /else\s*\{\s*params\.push\("explorer"\);\s*params\.push\("\/desktop=shell"\);\s*\}/,
        'else{console.log("F10.14 HARNESS · bare /bin/wine launch · no explorer fallback · non-JIT core");}'
      );
      src = src.replace(
        'written-code JIT disabled · Wine 1.7.55 proven root',
        'NON-JIT core · bare /bin/wine harness · no explorer fallback · Wine 1.7.55 proven root'
      );

      // The explorer/desktop=shell fallback lives inside boxedwine-shell.js,
      // fetched AT RUNTIME by the base script into a local `ss` -- it is not
      // part of rig-f10-8.js's own source text (confirmed: the literal string
      // "explorer" does not appear anywhere in rig-f10-8.js), so no replace
      // against `src` here can ever touch it. Patch `ss` itself right after it
      // is fetched, inside the generated script, and assert the needle so a
      // shell-source change upstream fails loudly instead of silently keeping
      // the explorer fallback in place.
      {
        const shellFetchAnchor="let ss=await sr.text();ss+='\\n;window.__F105_Config=Config;window.__F105_setConfiguration=setConfiguration;window.__F105_start=start;window.__F105_startEmulator=startEmulator;window.__F105_Module=Module;';";
        if(!src.includes(shellFetchAnchor))throw new Error('F10.14 shell-fetch anchor not found in F10.8 base -- base script changed, patch is stale');
        src=src.replace(shellFetchAnchor,"let ss=await sr.text();ss+='\\n;window.__F105_Config=Config;window.__F105_setConfiguration=setConfiguration;window.__F105_start=start;window.__F105_startEmulator=startEmulator;window.__F105_Module=Module;';"+
"const F1014_explorerNeedle=/else\\s*\\{\\s*params\\.push\\(\"explorer\"\\);\\s*params\\.push\\(\"\\/desktop=shell\"\\);\\s*\\}/;if(!F1014_explorerNeedle.test(ss))throw new Error('F10.14 explorer-fallback needle not found in fetched shell -- upstream shell text changed, patch is stale');ss=ss.replace(F1014_explorerNeedle,'else{console.log(\"F10.14 HARNESS \\u00b7 bare /bin/wine launch \\u00b7 no explorer fallback \\u00b7 non-JIT core\");}');");
      }

      // THE variable under test: point BASE at the never-before-used non-JIT
      // core. Everything else (SHELL filename, ROOT, APP, capsule selection,
      // ZIP repacking) is untouched because it lives above this line.
      src = src.replace(
        "const BASE='./assets/boxedwine-jit/',SHELL=BASE+'boxedwine-shell.js',ENGINE=BASE+'boxedwine.js',ROOT='fullWine1.7.55-v8.zip',APP='userapp.zip',TRACE_KEY='mobmugen-f1014-nonjit-core-trace';",
        "console.log('F10.14 WRAPPER · loaded F10.8 base · non-JIT core · bare /bin/wine, no program, no explorer fallback');\nconst BASE='./boxedwine-f83-fallback/',SHELL=BASE+'boxedwine-shell.js',ENGINE=BASE+'boxedwine.js',ROOT='fullWine1.7.55-v8.zip',APP='userapp.zip',TRACE_KEY='mobmugen-f1014-nonjit-core-trace';"
      );

      // The heap-growth witness targets emscripten source strings that exist
      // ONLY in the JIT build's compiled output (confirmed: grep count 0 in
      // boxedwine-f83-fallback/boxedwine.js). Patching for them here would
      // either throw (if asserted, per the base's own "never silently no-op
      // on a missing needle" rule) or -- worse -- silently do nothing while
      // claiming a witness is armed. Skip the patch outright and say so in
      // the trace, rather than pretending a JIT-only instrument applies to a
      // non-JIT core.
      src = src.replace(
        /const growNeedle=[\s\S]*?log\('F10\.14 HEAP WITNESS ARMED · growMemory \+ resize_heap'\);\n/,
        "log('F10.14 HEAP WITNESS SKIPPED · non-JIT core has no getHeapMax/growMemory instrumentation point (not applicable to this build)');\n"
      );

      const s = document.createElement('script');
      s.text = src + "\n//# sourceURL=rig-f10-14.generated.js";
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'F10.14 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · F10.14 WRAPPER';
    });
})();
