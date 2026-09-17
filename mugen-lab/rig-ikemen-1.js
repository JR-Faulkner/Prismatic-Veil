(function () {
  'use strict';
  const state = document.getElementById('runtimeState');
  const diag = document.getElementById('diag');
  const startBtn = document.getElementById('startBtn');
  const copyBtn = document.getElementById('copyTrace');
  const canvas = document.getElementById('gameCanvas');

  let lines = [];
  let pinned = [];
  let started = false;

  function status(s) { state.textContent = s; }

  function log(s) {
    s = String(s);
    lines.push(s);
    if (lines.length > 700) lines.shift();
    diag.textContent = lines.join('\n');
    diag.scrollTop = diag.scrollHeight;
  }

  // First-run instrumentation only: capture the FIRST handful of console
  // lines verbatim into a pinned, never-evicted array, exactly the fix
  // F10.18 needed for the BoxedWine lane -- do it from day one here so we
  // don't have to relearn that lesson on this engine too.
  function pin(tag, s) {
    if (pinned.length < 40) pinned.push('I1 ' + tag + ' · ' + String(s).slice(0, 1200));
  }

  const nativeLog = console.log.bind(console);
  const nativeErr = console.error.bind(console);
  const nativeWarn = console.warn.bind(console);
  console.log = (...a) => {
    nativeLog(...a);
    const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' ');
    log('OUT · ' + s.slice(0, 1200));
    pin('OUT', s);
  };
  console.error = (...a) => {
    nativeErr(...a);
    const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' ');
    log('ERR · ' + s.slice(0, 1200));
    pin('ERR', s);
  };
  console.warn = (...a) => {
    nativeWarn(...a);
    const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' ');
    log('WARN · ' + s.slice(0, 1200));
    pin('WARN', s);
  };
  function safeJson(x) { try { return JSON.stringify(x); } catch (_) { return String(x); } }

  window.addEventListener('error', e => {
    log('JS ERROR · ' + e.message + ' @ ' + e.filename + ':' + e.lineno);
    pin('JS ERROR', e.message + ' @ ' + e.filename + ':' + e.lineno);
  });
  window.addEventListener('unhandledrejection', e => {
    const msg = (e.reason && e.reason.stack) || e.reason;
    log('PROMISE · ' + msg);
    pin('PROMISE', msg);
  });

  async function boot() {
    if (started) return;
    started = true;
    startBtn.textContent = 'PROBE RUNNING';
    startBtn.disabled = true;
    try {
      status('FETCHING WASM');
      log('I1 WRAPPER · loaded rig-ikemen-1 · energyjp/ikemen-go-web boot probe');
      log('I1 USER AGENT · ' + navigator.userAgent);

      if (typeof Go !== 'function') throw new Error('wasm_exec.js did not define Go -- check <script src> order');
      const go = new Go();

      status('INSTANTIATING WASM');
      const wasmUrl = './assets/ikemen-web/ikemen-v2.wasm';
      let result;
      if (WebAssembly.instantiateStreaming) {
        result = await WebAssembly.instantiateStreaming(fetch(wasmUrl, { cache: 'no-store' }), go.importObject);
      } else {
        const buf = await (await fetch(wasmUrl, { cache: 'no-store' })).arrayBuffer();
        result = await WebAssembly.instantiate(buf, go.importObject);
      }
      log('I1 WASM INSTANTIATED · module compiled and linked successfully');
      pin('MILESTONE', 'WASM module instantiated (compiled + linked) without throwing');

      status('RUNNING · go.run(instance)');
      startedAt = Date.now();
      log('I1 GO.RUN · starting the Go runtime now. No VFS/content wired yet -- expect the engine to complain about missing files. We only care whether it crashes at the JS/WASM boundary or keeps logging.');

      const runPromise = go.run(result.instance);
      runPromise.then(() => {
        log('I1 GO.RUN RETURNED · the Go program exited (main() returned or os.Exit was called)');
        pin('MILESTONE', 'go.run() resolved -- Go program exited cleanly, no JS-level crash');
        status('EXITED · SEE TRACE');
      }).catch(e => {
        log('I1 GO.RUN THREW · ' + ((e && e.stack) || e));
        pin('CRASH', 'go.run() rejected: ' + ((e && e.stack) || e));
        status('CRASHED · SEE TRACE');
      });

      // If it's still running after a few seconds without throwing, that's
      // itself the headline result: the WASM boundary survived real
      // execution on this device, whatever the engine logs about missing
      // content.
      setTimeout(() => {
        if (state.textContent === 'RUNNING · go.run(instance)') {
          status('STILL RUNNING AFTER 5s · NO JS CRASH');
          pin('MILESTONE', 'Still executing 5s after go.run() with no JS-level exception');
        }
      }, 5000);
    } catch (e) {
      const msg = 'I1 BOOT ERROR · ' + ((e && e.stack) || e);
      log(msg);
      pin('CRASH', msg);
      status('FAILED · SEE TRACE');
    }
  }
  let startedAt = 0;

  startBtn.addEventListener('click', boot);

  copyBtn.addEventListener('click', async () => {
    const pinnedText = pinned.length ? pinned.join('\n') : 'none captured yet';
    const text = 'MOBMUGEN · IKEMEN · RIG I1 BOOT PROBE\n' +
      'RUNTIME STATUS · ' + state.textContent + '\n' +
      'PAGE · ' + location.href + '\n' +
      'USER AGENT · ' + navigator.userAgent + '\n\n' +
      'PINNED (first ~40 events, captured once)\n' + pinnedText + '\n\n' +
      'TRACE (most recent, may have rotated past earlier events)\n' + lines.join('\n') + '\n';
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'COPIED';
      setTimeout(() => (copyBtn.textContent = 'COPY TRACE'), 1500);
    } catch (_) {
      // Same fallback the BoxedWine lane needed (F10.13+): a visible,
      // pre-selected textarea, since navigator.clipboard silently fails
      // on some real-device Safari configurations.
      let ta = document.getElementById('traceFallback');
      if (!ta) {
        ta = document.createElement('textarea');
        ta.id = 'traceFallback';
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;left:10px;right:10px;bottom:62px;z-index:30;height:42vh;background:#05070c;color:#eef4ff;border:1px solid #7a6227;border-radius:12px;padding:10px;font:10px ui-monospace;white-space:pre-wrap';
        document.body.appendChild(ta);
      }
      ta.value = text;
      ta.classList.remove('hide');
      ta.focus();
      ta.select();
      copyBtn.textContent = 'SELECT TRACE';
      setTimeout(() => (copyBtn.textContent = 'COPY TRACE'), 2500);
    }
  });

  // Surface the canvas to Go's default GOOS=js glue in case it looks for
  // a DOM canvas by id/global -- energyjp's fork's own JS may look for a
  // specific hook once real rendering is wired; harmless to expose now.
  window.__ikemenCanvas = canvas;

  log('I1 READY · tap START PROBE');
})();
