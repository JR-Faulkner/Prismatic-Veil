(function(){
  'use strict';
  const base = './rig-ikemen-10.js?v=i11-base-i10';
  const errOld = "console.error = (...a) => { nativeErr(...a); const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' '); log('ERR · ' + s.slice(0, 1400)); pin('ERR', s); };";
  const errNew = "let knownRosterNoise = { blank: 0, stage: 0, other: 0 };\n  function flushKnownRosterNoise(force) {\n    const total = knownRosterNoise.blank + knownRosterNoise.stage + knownRosterNoise.other;\n    if (!total) return;\n    if (!force && total % 50 !== 0) return;\n    log('I11 NOISE · suppressed known roster parse spam: blank=' + knownRosterNoise.blank + ' stageEmpty=' + knownRosterNoise.stage + ' other=' + knownRosterNoise.other);\n  }\n  console.error = (...a) => {\n    nativeErr(...a);\n    const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' ');\n    if (s.indexOf('Failed to add char: blank') !== -1) { knownRosterNoise.blank++; flushKnownRosterNoise(false); return; }\n    if (s.indexOf('Failed to add stage. File read error: stages/.def') !== -1 || s.indexOf('open stages/.def') !== -1) { knownRosterNoise.stage++; flushKnownRosterNoise(false); return; }\n    log('ERR · ' + s.slice(0, 1400)); pin('ERR', s);\n  };\n  window.addEventListener('pagehide', () => flushKnownRosterNoise(true));";
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('I11 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('RIG I10 CONTROL RELEASE', 'RIG I11 NOISE THROTTLE');
      src = src.replaceAll('I10 ', 'I11 ');
      src = src.replaceAll('I10_', 'I11_');
      src = src.replaceAll('rig-ikemen-10.generated.js', 'rig-ikemen-11.generated.js');
      src = src.replace("./rig-ikemen-3.js?v=i10-base-i3", "./rig-ikemen-3.js?v=i11-base-i3");
      src = src.replace("log('I11 READY · I6 start flow + hardened touch-control releases');", "log('I11 READY · I10 controls + throttled known roster noise');");
      const injectAt = "src = src.replace(\"log('I11 READY · waiting for zip (checking storage)');\", \"log('I11 READY · I10 controls + throttled known roster noise');\");";
      if (!src.includes(injectAt)) throw new Error('I11 ready patch point not found');
      src = src.replace(injectAt, injectAt + "\n      if (!src.includes(errOld)) throw new Error('I11 console.error patch point not found');\n      src = src.replace(errOld, errNew);");
      const s = document.createElement('script');
      s.text = src + '\n//# sourceURL=rig-ikemen-11.wrapper.generated.js';
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'I11 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · I11 WRAPPER';
    });
})();
