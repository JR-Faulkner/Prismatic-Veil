(function(){
  'use strict';
  const base = './rig-ikemen-10.js?v=i12-base-i10';

  function appendDiag(line) {
    const diag = document.getElementById('diag');
    if (!diag) return;
    const current = diag.textContent || '';
    const next = (current ? current + '\n' : '') + line;
    const lines = next.split('\n');
    diag.textContent = lines.slice(Math.max(0, lines.length - 700)).join('\n');
    diag.scrollTop = diag.scrollHeight;
  }

  let counts = { blank: 0, stage: 0 };
  function installNoiseGuard() {
    if (console.error && console.error.__i12NoiseGuard) return;
    const previous = console.error.bind(console);
    const guarded = function(...args) {
      const s = args.map(x => {
        if (typeof x === 'string') return x;
        try { return JSON.stringify(x); } catch (_) { return String(x); }
      }).join(' ');
      if (s.indexOf('Failed to add char: blank') !== -1) {
        counts.blank++;
        if (counts.blank % 50 === 0) appendDiag('I12 NOISE · suppressed blank character spam x' + counts.blank);
        return;
      }
      if (s.indexOf('Failed to add stage. File read error: stages/.def') !== -1 || s.indexOf('open stages/.def') !== -1) {
        counts.stage++;
        if (counts.stage % 50 === 0) appendDiag('I12 NOISE · suppressed empty stage spam x' + counts.stage);
        return;
      }
      previous(...args);
    };
    guarded.__i12NoiseGuard = true;
    console.error = guarded;
  }

  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('I12 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('RIG I10 CONTROL RELEASE', 'RIG I12 I10 SAFE NOISE GUARD');
      src = src.replaceAll('I10 ', 'I12 ');
      src = src.replaceAll('I10_', 'I12_');
      src = src.replaceAll('rig-ikemen-10.generated.js', 'rig-ikemen-12.generated.js');
      src = src.replace("./rig-ikemen-3.js?v=i10-base-i3", "./rig-ikemen-3.js?v=i12-base-i3");
      src = src.replace("log('I12 READY · I6 start flow + hardened touch-control releases');", "log('I12 READY · I10 controls + safe non-blocking noise guard');");
      const s = document.createElement('script');
      s.text = src + '\n//# sourceURL=rig-ikemen-12.generated.js';
      document.head.appendChild(s);
      installNoiseGuard();
      const timer = setInterval(installNoiseGuard, 250);
      setTimeout(function(){ clearInterval(timer); installNoiseGuard(); }, 15000);
    })
    .catch(function(e){
      const msg = 'I12 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      appendDiag(msg);
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · I12 WRAPPER';
    });
})();
