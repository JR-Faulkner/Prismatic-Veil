(function(){
  'use strict';
  const base = './rig-ikemen-3.js?v=i4-base-i3';
  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('I4 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('RIG I3 PLAYABLE', 'RIG I4 TOUCH PICKER FIX');
      src = src.replaceAll('I3 ', 'I4 ');
      src = src.replaceAll('I3_', 'I4_');
      src = src.replace('function bindPress(el, codes) {\n    let held = false;\n    const dn = e => { e.preventDefault(); if (held) return; held = true; el.classList.add(\'on\'); codes.forEach(k => emitKey(k[0], k[1], true)); };\n    const up = e => { e.preventDefault(); if (!held) return; held = false; el.classList.remove(\'on\'); [...codes].reverse().forEach(k => emitKey(k[0], k[1], false)); };\n    el.addEventListener(\'pointerdown\', dn);\n    el.addEventListener(\'pointerup\', up);\n    el.addEventListener(\'pointercancel\', up);\n    el.addEventListener(\'pointerleave\', e => { if (held) up(e); });\n  }', 'function pickerOpen() {\n    const section = document.getElementById(\'charPickerSection\');\n    return !!(section && !section.classList.contains(\'hide\'));\n  }\n  function currentPickerButton() {\n    const active = document.activeElement;\n    if (active && active.classList && active.classList.contains(\'roster-item\')) return active;\n    return document.querySelector(\'#p1Grid .roster-item.selected\') ||\n      document.querySelector(\'#p1Grid .roster-item\') ||\n      document.querySelector(\'#p2Grid .roster-item.selected\') ||\n      document.querySelector(\'#stageGrid .roster-item.selected\');\n  }\n  function handlePickerControl(codes) {\n    const first = codes[0] && codes[0][0];\n    const btn = currentPickerButton();\n    if (!btn) return;\n    if (first === \'Enter\' || first === \'KeyA\' || first === \'KeyS\' || first === \'KeyD\' ||\n        first === \'KeyZ\' || first === \'KeyX\' || first === \'KeyC\') {\n      btn.focus();\n      btn.click();\n      log(\'I4 PICKER · touch control selected \' + (btn.dataset.mode || \'?\') + \' #\' + (btn.dataset.idx || \'?\'));\n      return;\n    }\n    const evKey = first === \'ArrowUp\' ? \'ArrowUp\' : first === \'ArrowDown\' ? \'ArrowDown\' :\n      first === \'ArrowLeft\' ? \'ArrowLeft\' : first === \'ArrowRight\' ? \'ArrowRight\' : null;\n    if (!evKey) return;\n    btn.focus();\n    const ev = new KeyboardEvent(\'keydown\', { key: evKey, code: evKey, bubbles: true, cancelable: true });\n    document.dispatchEvent(ev);\n  }\n  function bindPress(el, codes) {\n    let held = false;\n    const dn = e => {\n      e.preventDefault();\n      if (held) return;\n      held = true;\n      el.classList.add(\'on\');\n      if (pickerOpen()) { handlePickerControl(codes); return; }\n      codes.forEach(k => emitKey(k[0], k[1], true));\n    };\n    const up = e => {\n      e.preventDefault();\n      if (!held) return;\n      held = false;\n      el.classList.remove(\'on\');\n      if (pickerOpen()) return;\n      [...codes].reverse().forEach(k => emitKey(k[0], k[1], false));\n    };\n    el.addEventListener(\'pointerdown\', dn);\n    el.addEventListener(\'pointerup\', up);\n    el.addEventListener(\'pointercancel\', up);\n    el.addEventListener(\'pointerleave\', e => { if (held) up(e); });\n  }');
      src = src.replace("log('I4 READY · waiting for zip (checking storage)');", "log('I4 READY · waiting for zip (checking storage) · touch picker START fix active');");
      const s = document.createElement('script');
      s.text = src + '\n//# sourceURL=rig-ikemen-4.generated.js';
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'I4 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · I4 WRAPPER';
    });
})();
