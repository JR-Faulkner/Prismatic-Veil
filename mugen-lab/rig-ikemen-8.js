(function(){
  'use strict';
  const base = './rig-ikemen-3.js?v=i8-base-i3';

  const bindOld = `function bindPress(el, codes) {
    let held = false;
    const dn = e => { e.preventDefault(); if (held) return; held = true; el.classList.add('on'); codes.forEach(k => emitKey(k[0], k[1], true)); };
    const up = e => { e.preventDefault(); if (!held) return; held = false; el.classList.remove('on'); [...codes].reverse().forEach(k => emitKey(k[0], k[1], false)); };
    el.addEventListener('pointerdown', dn);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', e => { if (held) up(e); });
  }`;

  const bindNew = `function pickerOpen() {
    const section = document.getElementById('charPickerSection');
    return !!(section && !section.classList.contains('hide'));
  }
  function firstPickerButton(mode) {
    const grid = document.getElementById(GRID_IDS[mode]);
    if (!grid) return null;
    return grid.querySelector('.roster-item.selected') || grid.querySelector('.roster-item');
  }
  function focusPickerMode(mode) {
    const btn = firstPickerButton(mode);
    if (btn) btn.focus();
    else focusStartButton();
  }
  function focusStartButton() {
    const start = document.getElementById('startBtn');
    if (start) start.focus();
  }
  function currentPickerTarget() {
    const active = document.activeElement;
    if (active && active.id === 'startBtn') return active;
    if (active && active.id === 'changeZipBtn') return active;
    if (active && active.classList && active.classList.contains('roster-item')) return active;
    return firstPickerButton('p1') || firstPickerButton('p2') || firstPickerButton('stage') || document.getElementById('startBtn');
  }
  function pickerCommit(target) {
    if (!target) return;
    target.focus();
    target.click();
    if (target.classList && target.classList.contains('roster-item')) {
      log('I8 PICKER · touch committed ' + (target.dataset.mode || '?') + ' #' + (target.dataset.idx || '?'));
    } else {
      log('I8 PICKER · touch clicked ' + (target.id || target.tagName));
    }
  }
  function handlePickerControl(codes) {
    const first = codes[0] && codes[0][0];
    const target = currentPickerTarget();
    if (!target) return;
    if (first === 'Enter' || first === 'KeyA' || first === 'KeyS' || first === 'KeyD' ||
        first === 'KeyZ' || first === 'KeyX' || first === 'KeyC') {
      pickerCommit(target);
      return;
    }
    const evKey = first === 'ArrowUp' ? 'ArrowUp' : first === 'ArrowDown' ? 'ArrowDown' :
      first === 'ArrowLeft' ? 'ArrowLeft' : first === 'ArrowRight' ? 'ArrowRight' : null;
    if (!evKey || !(target.classList && target.classList.contains('roster-item'))) return;
    target.focus();
    const ev = new KeyboardEvent('keydown', { key: evKey, code: evKey, bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
  }
  function bindPress(el, codes) {
    let held = false;
    const dn = e => {
      e.preventDefault();
      if (held) return;
      held = true;
      el.classList.add('on');
      if (pickerOpen()) { handlePickerControl(codes); return; }
      codes.forEach(k => emitKey(k[0], k[1], true));
    };
    const up = e => {
      e.preventDefault();
      if (!held) return;
      held = false;
      el.classList.remove('on');
      if (pickerOpen()) return;
      [...codes].reverse().forEach(k => emitKey(k[0], k[1], false));
    };
    el.addEventListener('pointerdown', dn);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', e => { if (held) up(e); });
  }`;

  const selectOld = `function selectItem(mode, idx) {
    if (mode === 'p1') pickerState.p1Idx = idx;
    else if (mode === 'p2') pickerState.p2Idx = idx;
    else if (mode === 'stage') pickerState.stageIdx = idx;
    // Scope the highlight swap to THIS grid. Clearing .selected across all
    // three grids would wipe the other two rows' marks every time one of
    // them changed, leaving only the most recent pick visibly chosen.
    const grid = document.getElementById(GRID_IDS[mode]);
    grid.querySelectorAll('.roster-item.selected').forEach(el => el.classList.remove('selected'));
    const chosen = grid.querySelector('.roster-item[data-idx="' + idx + '"]');
    if (chosen) chosen.classList.add('selected');
    updateSelectionDisplay();
  }`;

  const selectNew = `function selectItem(mode, idx) {
    if (mode === 'p1') pickerState.p1Idx = idx;
    else if (mode === 'p2') pickerState.p2Idx = idx;
    else if (mode === 'stage') pickerState.stageIdx = idx;
    const grid = document.getElementById(GRID_IDS[mode]);
    grid.querySelectorAll('.roster-item.selected').forEach(el => el.classList.remove('selected'));
    const chosen = grid.querySelector('.roster-item[data-idx="' + idx + '"]');
    if (chosen) chosen.classList.add('selected');
    updateSelectionDisplay();
    if (mode === 'p1') {
      focusPickerMode('p2');
      log('I8 PICKER · P1 selected; focus moved to P2');
    } else if (mode === 'p2') {
      if (allStages.length) {
        focusPickerMode('stage');
        log('I8 PICKER · P2 selected; focus moved to Stage');
      } else {
        focusStartButton();
        log('I8 PICKER · P2 selected; no stages listed; focus moved to START MATCH');
      }
    } else if (mode === 'stage') {
      focusStartButton();
      log('I8 PICKER · Stage selected; focus moved to START MATCH');
    }
  }`;

  const parseNeedle = `const parsed = parseSelectDef(text);
      allChars = [...new Set(parsed.chars.filter(n => findCharDefKey(n)))];
      allStages = parsed.stages.filter(n => findStageDefKey(n));`;

  const parsePatch = `const parsed = parseSelectDef(text);
      allChars = [...new Set(parsed.chars.filter(n => findCharDefKey(n)))];
      allStages = parsed.stages.filter(n => findStageDefKey(n));
      function sanitizeSelectDefPreservingSections(src) {
        let section = '';
        let removedChars = 0, removedStages = 0;
        const out = [];
        for (const line of src.split(/\r?\n/)) {
          const trimmed = line.trim();
          const header = trimmed.match(/^\[([^\]]+)\]/);
          if (header) { section = header[1].trim().toLowerCase(); out.push(line); continue; }
          if (!trimmed || trimmed.startsWith(';')) { out.push(line); continue; }
          const value = trimmed.split(';')[0].split(',')[0].trim();
          if (section === 'characters') {
            if (!value || value.toLowerCase() === 'blank' || !findCharDefKey(value)) { removedChars++; continue; }
          } else if (section === 'extrastages') {
            if (!value || !findStageDefKey(value)) { removedStages++; continue; }
          }
          out.push(line);
        }
        log('I8 SELECT.DEF PRESERVED · removed ' + removedChars + ' bad character rows and ' + removedStages + ' bad stage rows; kept original sections/options');
        return out.join('\r\n');
      }
      selectRec.data = encoder.encode(sanitizeSelectDefPreservingSections(text));`;

  fetch(base, { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('I8 base JS HTTP '+r.status); return r.text(); })
    .then(function(src){
      src = src.replaceAll('RIG I3 PLAYABLE', 'RIG I8 PRESERVED SELECT');
      src = src.replaceAll('I3 ', 'I8 ');
      src = src.replaceAll('I3_', 'I8_');
      if (!src.includes(bindOld)) throw new Error('I8 bindPress patch point not found');
      if (!src.includes(selectOld)) throw new Error('I8 selectItem patch point not found');
      if (!src.includes(parseNeedle)) throw new Error('I8 select.def preserve patch point not found');
      src = src.replace(bindOld, bindNew);
      src = src.replace(selectOld, selectNew);
      src = src.replace(parseNeedle, parsePatch);
      src = src.replace("log('I8 READY · waiting for zip (checking storage)');", "log('I8 READY · preserved select.def + explicit picker flow active');");
      const s = document.createElement('script');
      s.text = src + '\n//# sourceURL=rig-ikemen-8.generated.js';
      document.head.appendChild(s);
    })
    .catch(function(e){
      const msg = 'I8 WRAPPER ERROR · ' + ((e && e.stack) || e);
      console.error(msg);
      const diag = document.getElementById('diag') || document.body;
      diag.textContent = (diag.textContent || '') + '\n' + msg;
      const state = document.getElementById('runtimeState');
      if (state) state.textContent = 'FAILED · I8 WRAPPER';
    });
})();
