(function () {
  'use strict';

  // Safari's back-forward cache can restore this exact page -- including
  // a hidden #setup overlay and an already-exited WASM instance -- when
  // the user simply re-taps the same link after a previous session ended,
  // rather than doing a true reload. Force a real reload in that case so
  // CHOOSE MUGEN ZIP is always reachable on revisit.
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

  // Audio unlock backstop. The engine's audio backend (oto's driver_js.go)
  // already does the textbook autoplay-policy fix -- it waits for a real
  // document-level touchend/mouseup/keyup before calling
  // audioContext.resume() -- but it only starts listening once the WASM
  // module is actually running, well after the CHOOSE MUGEN ZIP tap that
  // kicked off loading. The next real interaction on the page is a touch
  // control, which fires a real pointerdown/pointerup but only a
  // *synthetic* KeyboardEvent (emitKey(), further down) -- and iOS Safari
  // has been known to gate resume() on the currently-processing event's
  // own trustedness rather than a general "activation happened somewhere
  // in this task" flag, so oto's own keyup listener may never see a
  // trusted event to react to. Patch AudioContext to track every instance
  // created (by the engine or anything else) and resume any suspended one
  // on the next REAL touchend/mouseup/keydown -- independent of oto's own
  // listeners, so this works whether or not that gating theory is exactly
  // right. A harmless no-op if oto's own unlock already succeeded.
  (function () {
    const Native = window.AudioContext || window.webkitAudioContext;
    if (!Native) return;
    const tracked = [];
    function Patched(...args) {
      const ctx = new Native(...args);
      tracked.push(ctx);
      return ctx;
    }
    Patched.prototype = Native.prototype;
    window.AudioContext = Patched;
    window.webkitAudioContext = Patched;
    function resumeAll() {
      for (const ctx of tracked) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      }
    }
    for (const ev of ['touchend', 'mouseup', 'keydown', 'pointerup']) {
      document.addEventListener(ev, resumeAll, { passive: true });
    }
  })();

  const stageBox = document.querySelector('.stage');
  const state = document.getElementById('runtimeState');
  const pill = document.getElementById('runtimePill');
  const diag = document.getElementById('diag');
  const prepDiag = document.getElementById('prepDiag');
  const zipInput = document.getElementById('zipInput');
  const copyBtn = document.getElementById('copyTrace');
  const setup = document.getElementById('setup');
  const canvas = document.getElementById('ikemen-canvas');
  const controls = document.getElementById('controls');
  const ctrlToggle = document.getElementById('ctrlToggle');
  const debugToggle = document.getElementById('debugToggle');
  const diagInlineToggle = document.getElementById('diagInlineToggle');
  const diagWrap = document.getElementById('diagWrap');

  let lines = [];
  let pinned = [];
  let started = false;
  let zipLoaded = false;

  // -------------------------------------------------------------------
  // IndexedDB persistence for the picked content zip.
  //
  // The record stores the File object ITSELF, never file.arrayBuffer().
  // Reading a 1.7GB zip into an ArrayBuffer materializes the whole thing
  // in the JS heap at once, which on an iPhone is a tab crash long before
  // it's a quota error. File/Blob are structured-cloneable and WebKit
  // keeps them in its own on-disk blob store, handing back a reference --
  // so put() stays cheap no matter how big the zip is, and the File that
  // comes back out still has .name/.size/.slice() for the ranged central-
  // directory reads listZipEntries()/entryRaw() do. Nothing ever needs
  // the whole zip resident.
  // -------------------------------------------------------------------
  let db = null;
  async function initDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open('I3RosterDB', 2);
      req.onerror = () => rej(req.error);
      req.onsuccess = () => { db = req.result; res(db); };
      req.onupgradeneeded = e => {
        const d = e.target.result;
        // v1 stored {data: ArrayBuffer}; drop it wholesale rather than
        // migrate -- those records are exactly the memory hazard this
        // version exists to remove, and re-picking the zip is cheap.
        if (d.objectStoreNames.contains('zips')) d.deleteObjectStore('zips');
        d.createObjectStore('zips', { keyPath: 'hash' });
      };
    });
  }

  async function reportQuota(label) {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    try {
      const est = await navigator.storage.estimate();
      const mb = n => (n / 1048576).toFixed(0) + 'MB';
      log('I29 QUOTA · ' + label + ' · using ' + mb(est.usage || 0) + ' of ' + mb(est.quota || 0) + ' available');
      return est;
    } catch (_) { return null; }
  }

  // Persistent storage is opt-in on WebKit; without it the origin's data
  // is "best-effort" and Safari will evict it under disk pressure -- which
  // for a multi-GB zip is exactly the case that gets evicted first.
  async function requestPersistence() {
    if (!navigator.storage || !navigator.storage.persist) return false;
    try {
      if (await navigator.storage.persisted()) return true;
      const granted = await navigator.storage.persist();
      log('I29 STORAGE · persistent storage ' + (granted ? 'granted' : 'not granted (browser may evict under disk pressure)'));
      return granted;
    } catch (_) { return false; }
  }

  // Returns true if the zip was persisted, false if it could not be --
  // never throws. Failing to persist is a convenience loss, not a reason
  // to block the match that's already loaded and ready to boot.
  async function storeZipInDB(file, zipHash) {
    if (!db) return false;
    try {
      await new Promise((res, rej) => {
        const tx = db.transaction('zips', 'readwrite');
        tx.objectStore('zips').put({
          hash: zipHash, filename: file.name, size: file.size,
          file, timestamp: Date.now(),
        });
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      });
      return true;
    } catch (e) {
      const name = (e && e.name) || 'unknown';
      if (name === 'QuotaExceededError') {
        log('I29 STORAGE · zip too large for this origin\'s storage quota -- running without persistence, ' +
          'you\'ll need to pick the zip again next visit');
        await reportQuota('at quota failure');
      } else {
        log('I29 STORAGE · could not persist zip (' + name + ') -- running without persistence');
      }
      return false;
    }
  }

  async function listStoredZips() {
    if (!db) return [];
    try {
      return await new Promise((res, rej) => {
        const tx = db.transaction('zips', 'readonly');
        const req = tx.objectStore('zips').getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(tx.error);
      });
    } catch (_) { return []; }
  }

  async function clearAllStoredZips() {
    if (!db) return;
    try {
      await new Promise((res, rej) => {
        const tx = db.transaction('zips', 'readwrite');
        tx.objectStore('zips').clear();
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
    } catch (_) {}
  }

  function classifyStatus(s) {
    // "CRASHED" (an event that happened), not "CRASH" -- the healthy
    // "STILL RUNNING AFTER 5s · NO JS CRASH" message contains the
    // substring "CRASH" too and was being misclassified as an error.
    if (/CRASHED|FAILED|EXITED/.test(s)) return 'error';
    if (/RUNNING/.test(s)) return 'running';
    if (/WAITING FOR ZIP|SELECT FIGHTERS/.test(s)) return 'idle';
    return 'loading';
  }
  function status(s) {
    state.textContent = s;
    const cls = classifyStatus(s);
    if (pill) { pill.textContent = s; pill.dataset.state = cls; }
    document.body.dataset.runtimeState = cls;
    if (prepDiag) prepDiag.textContent = s;
  }
  function log(s) {
    s = String(s);
    lines.push(s);
    if (lines.length > 700) lines.shift();
    diag.textContent = lines.join('\n');
    diag.scrollTop = diag.scrollHeight;
  }
  function pin(tag, s) {
    if (pinned.length < 60) pinned.push('I29 ' + tag + ' · ' + String(s).slice(0, 1400));
  }

  const nativeLog = console.log.bind(console);
  const nativeErr = console.error.bind(console);
  const nativeWarn = console.warn.bind(console);
  function safeJson(x) { try { return JSON.stringify(x); } catch (_) { return String(x); } }
  console.log = (...a) => { nativeLog(...a); const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' '); log('OUT · ' + s.slice(0, 1400)); pin('OUT', s); };
  console.error = (...a) => { nativeErr(...a); const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' '); log('ERR · ' + s.slice(0, 1400)); pin('ERR', s); };
  console.warn = (...a) => { nativeWarn(...a); const s = a.map(x => (typeof x === 'string' ? x : safeJson(x))).join(' '); log('WARN · ' + s.slice(0, 1400)); pin('WARN', s); };
  window.addEventListener('error', e => { const m = e.message + ' @ ' + e.filename + ':' + e.lineno; log('JS ERROR · ' + m); pin('JS ERROR', m); });
  window.addEventListener('unhandledrejection', e => { const m = (e.reason && e.reason.stack) || e.reason; log('PROMISE · ' + m); pin('PROMISE', m); });

  // ---------------------------------------------------------------------
  // Minimal ZIP central-directory reader (same shape as the BoxedWine lane's
  // inspect()/entryRaw() in rig-f10-8.js -- proven working there, reused
  // here instead of re-deriving it). No compression-method-8 support beyond
  // fflate, loaded from the same CDN the BoxedWine lane already trusts.
  // ---------------------------------------------------------------------
  function u16(v, o) { return v.getUint16(o, true); }
  function u32(v, o) { return v.getUint32(o, true); }

  // Storage key for a picked zip. Not cryptographic and not a integrity
  // check -- it only has to tell "same zip as last time" from "different
  // zip", so it folds over the entry table listZipEntries() already
  // parses rather than re-deriving a second end-of-central-directory
  // scan. (It did have its own, and it was wrong twice over: it treated
  // the central directory's absolute file offset as a relative one, and
  // stepped the EOCD signature search 4 bytes at a time when the record
  // can begin at any byte.) Reuses the proven reader; reads no bytes the
  // load path doesn't already read.
  async function zipFingerprint(file) {
    try {
      const entries = await listZipEntries(file);
      let h = 5381;
      const mix = s => { for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0; };
      mix(String(file.size));
      mix(String(entries.length));
      for (const e of entries) { mix(e.name); mix(String(e.uncomp)); }
      return h.toString(36);
    } catch (_) { return null; }
  }

  // Zip64 sentinel: a 32-bit size/offset field of exactly this value means
  // "the real value is 64-bit and lives in the Zip64 extra field instead"
  // -- it is NOT a literal ~4.29GB size. Trusting it literally was a real,
  // reproduced bug: entryRaw()'s file.slice(start, start + ent.comp) gets
  // silently clamped by the Blob spec to "the rest of the file", so a
  // single Zip64-flagged entry anywhere in a multi-gigabyte zip made the
  // next read materialize the ENTIRE remainder of the archive into memory
  // before decompression even started -- confirmed with a synthetic
  // repro: an unrelated 150MB tail added ~860ms just to the file-read
  // step on a fast dev machine; scaled to a real ~1.7GB zip on an iPhone,
  // this is a multi-second-plus fully-blocked main thread with no error,
  // matching a real device report exactly ("frozen, couldn't even tap
  // Copy Trace"). Some zip encoders write Zip64 fields per-entry
  // regardless of whether that entry actually needs 64-bit sizes.
  const ZIP64_SENTINEL = 0xFFFFFFFF;
  function readZip64Extra(cv, extraStart, extraLen, need) {
    // need: {uncomp: bool, comp: bool, local: bool} -- which fields were
    // sentinel'd in the main record and must be read from here instead,
    // in this fixed order per the zip spec (only the needed ones appear).
    let p = extraStart;
    const end = extraStart + extraLen;
    while (p + 4 <= end) {
      const id = u16(cv, p), size = u16(cv, p + 2);
      if (id === 0x0001) {
        let q = p + 4;
        const out = {};
        if (need.uncomp && q + 8 <= p + 4 + size) { out.uncomp = Number(cv.getBigUint64(q, true)); q += 8; }
        if (need.comp && q + 8 <= p + 4 + size) { out.comp = Number(cv.getBigUint64(q, true)); q += 8; }
        if (need.local && q + 8 <= p + 4 + size) { out.local = Number(cv.getBigUint64(q, true)); q += 8; }
        return out;
      }
      p += 4 + size;
    }
    return {};
  }
  async function listZipEntries(file) {
    const tailStart = Math.max(0, file.size - 65557);
    const tb = await file.slice(tailStart).arrayBuffer();
    const tv = new DataView(tb);
    let e = -1;
    for (let i = tv.byteLength - 22; i >= 0; i--) { if (u32(tv, i) === 0x06054b50) { e = i; break; } }
    if (e < 0) throw new Error('ZIP end record not found');
    const cdSize = u32(tv, e + 12), cdOffset = u32(tv, e + 16);
    const cb = await file.slice(cdOffset, cdOffset + cdSize).arrayBuffer();
    const cv = new DataView(cb);
    const dec = new TextDecoder();
    let p = 0, entries = [];
    while (p + 46 <= cv.byteLength && u32(cv, p) === 0x02014b50) {
      let method = u16(cv, p + 10), comp = u32(cv, p + 20), uncomp = u32(cv, p + 24),
        fn = u16(cv, p + 28), ex = u16(cv, p + 30), cm = u16(cv, p + 32), local = u32(cv, p + 42),
        name = dec.decode(new Uint8Array(cb, p + 46, fn));
      const needZip64 = comp === ZIP64_SENTINEL || uncomp === ZIP64_SENTINEL || local === ZIP64_SENTINEL;
      if (needZip64 && ex > 0) {
        const real = readZip64Extra(cv, p + 46 + fn, ex, {
          uncomp: uncomp === ZIP64_SENTINEL, comp: comp === ZIP64_SENTINEL, local: local === ZIP64_SENTINEL,
        });
        if (real.uncomp !== undefined) uncomp = real.uncomp;
        if (real.comp !== undefined) comp = real.comp;
        if (real.local !== undefined) local = real.local;
      }
      entries.push({ name, method, comp, uncomp, local });
      p += 46 + fn + ex + cm;
    }
    return entries;
  }
  async function entryRaw(file, ent) {
    const hb = await file.slice(ent.local, ent.local + 30).arrayBuffer();
    const hv = new DataView(hb);
    if (u32(hv, 0) !== 0x04034b50) throw new Error('Bad local ZIP header: ' + ent.name);
    const fn = u16(hv, 26), ex = u16(hv, 28), start = ent.local + 30 + fn + ex;
    const pb = await file.slice(start, start + ent.comp).arrayBuffer();
    const packed = new Uint8Array(pb);
    if (ent.method === 0) return packed;
    if (ent.method === 8) return fflate.inflateSync(packed);
    throw new Error('Unsupported ZIP method ' + ent.method + ' for ' + ent.name);
  }

  // ---------------------------------------------------------------------
  // In-memory VFS + a real globalThis.fs implementing the Node-fs subset
  // Go's syscall/fs_js.go actually calls. Installed BEFORE wasm_exec.js
  // runs, so its own `if (!globalThis.fs)` stub-install never fires.
  // Flag/mode values below are the real Linux syscall constants Go expects
  // (its GOOS=js target speaks the Linux syscall ABI) -- NOT Node's own
  // per-platform constants object, and NOT the stub's placeholder -1s.
  // ---------------------------------------------------------------------
  const O_RDONLY = 0, O_WRONLY = 1, O_RDWR = 2, O_CREAT = 64, O_EXCL = 128,
    O_NOCTTY = 256, O_TRUNC = 512, O_APPEND = 1024, O_DIRECTORY = 65536;
  const S_IFREG = 32768, S_IFDIR = 16384;

  const vfsFiles = new Map(); // normalized path -> {data: Uint8Array, dir: bool, mtimeMs}
  const vfsDirs = new Set();  // explicit + implied directory paths
  const vfsFilesLower = new Map(); // lowercased path -> real (correctly-cased) path

  // Lazy loading: a full MUGEN roster is way more data than any one match
  // needs. Rather than decompressing every chars/*, stages/*, sound/* entry
  // up front (fine for a 2-character test capsule, not fine for a
  // multi-gigabyte full install), the zip's central directory is indexed
  // here without touching entry bytes -- open()/stat() decompress a single
  // entry on demand, the moment the engine actually asks for that path.
  const zipIndex = new Map();      // stripped path (real case) -> zip entry
  const zipIndexLower = new Map(); // lowercased stripped path -> real-case key
  let currentZipFile = null;
  const lazyActivity = { count: 0, listeners: [] };
  function lazyActivityPing(key) { lazyActivity.listeners.forEach(fn => { try { fn(key); } catch (_) {} }); }
  async function lazyMaterialize(path) {
    if (vfsFiles.has(path) || vfsDirs.has(path)) return true;
    let key = zipIndex.has(path) ? path : zipIndexLower.get(path.toLowerCase());
    if (!key) return false;
    const ent = zipIndex.get(key);
    lazyActivity.count++;
    lazyActivityPing(key);
    const raw = await entryRaw(currentZipFile, ent);
    vfsPutFile(key, raw, ent);
    zipIndex.delete(key);
    zipIndexLower.delete(key.toLowerCase());
    evictIfOverBudget();
    lazyActivityPing(key);
    return true;
  }

  function normPath(p) {
    if (!p) return p;
    p = p.replace(/\\/g, '/');
    while (p.startsWith('./')) p = p.slice(2);
    p = p.replace(/\/{2,}/g, '/');
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }
  // MUGEN/Ikemen content is riddled with .def files that reference a file
  // by a different case than what's actually on disk (fine on
  // case-insensitive Windows/macOS, silently 404s on a case-sensitive VFS
  // like this one). Resolve a requested path against the real one if an
  // exact match isn't found, rather than chasing every mismatch by hand.
  function resolvePath(path) {
    if (vfsFiles.has(path) || vfsIsDir(path)) return path;
    const real = vfsFilesLower.get(path.toLowerCase());
    return real !== undefined ? real : path;
  }
  function ensureParentDirs(path) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) vfsDirs.add(parts.slice(0, i).join('/'));
  }
  let vfsMemoryBytes = 0, vfsMemoryLargestFile = 0, vfsMemoryLargestPath = '';
  let vfsEvictedCount = 0, vfsEvictedBytes = 0;
  const VFS_MEMORY_BUDGET_BYTES = 300 * 1048576;
  function vfsPutFile(path, data, zipEnt) {
    path = normPath(path);
    const now = Date.now();
    const prior = vfsFiles.get(path);
    if (prior) vfsMemoryBytes -= prior.data.length;
    vfsFiles.set(path, { data, dir: false, mtimeMs: now, lastAccess: now, zipEnt: zipEnt || null });
    vfsFilesLower.set(path.toLowerCase(), path);
    ensureParentDirs(path);
    vfsMemoryBytes += data.length;
    if (data.length > vfsMemoryLargestFile) { vfsMemoryLargestFile = data.length; vfsMemoryLargestPath = path; }
  }
  function mb(n) { return (n / 1048576).toFixed(1) + 'MB'; }
  function reportMemory(label) {
    const parts = ['own VFS: ' + mb(vfsMemoryBytes) + ' across ' + vfsFiles.size + ' file(s) (largest: ' + mb(vfsMemoryLargestFile) + ' ' + vfsMemoryLargestPath + ')'];
    if (vfsEvictedCount > 0) parts.push('evicted lifetime: ' + vfsEvictedCount + ' file(s), ' + mb(vfsEvictedBytes) + ' reclaimed');
    if (typeof performance !== 'undefined' && performance.memory && performance.memory.usedJSHeapSize) {
      parts.push('JS heap (Chrome/Blink only, unavailable on iOS Safari): ' + mb(performance.memory.usedJSHeapSize) + ' used / ' + mb(performance.memory.jsHeapSizeLimit) + ' limit');
    } else {
      parts.push('JS heap: unavailable on this browser (expected on iOS Safari -- own VFS figure above is the real signal here)');
    }
    const msg = label + ' -- ' + parts.join(' | ');
    log('I29 MEMORY \u00b7 ' + msg);
    pin('MEMORY', msg);
  }
  function anyFdOpenFor(path) {
    for (const h of fdTable.values()) if (h.path === path) return true;
    return false;
  }
  function evictIfOverBudget() {
    if (vfsMemoryBytes <= VFS_MEMORY_BUDGET_BYTES) return;
    const candidates = [];
    for (const entry of vfsFiles) {
      const p = entry[0], rec = entry[1];
      if (!rec.zipEnt) continue;
      if (anyFdOpenFor(p)) continue;
      candidates.push([p, rec]);
    }
    candidates.sort(function(a, b) { return a[1].lastAccess - b[1].lastAccess; });
    let reclaimed = 0, evicted = 0;
    for (const entry of candidates) {
      if (vfsMemoryBytes <= VFS_MEMORY_BUDGET_BYTES) break;
      const p = entry[0], rec = entry[1];
      vfsFiles.delete(p);
      vfsFilesLower.delete(p.toLowerCase());
      vfsMemoryBytes -= rec.data.length;
      reclaimed += rec.data.length;
      evicted++;
      zipIndex.set(p, rec.zipEnt);
      zipIndexLower.set(p.toLowerCase(), p);
    }
    if (evicted > 0) {
      vfsEvictedCount += evicted;
      vfsEvictedBytes += reclaimed;
      const msg = 'evicted ' + evicted + ' cold zip-backed file(s) (LRU, none with an open handle), reclaimed ' + mb(reclaimed) + ' -- ' + mb(vfsMemoryBytes) + ' resident now (budget ' + mb(VFS_MEMORY_BUDGET_BYTES) + ')';
      log('I29 EVICT \u00b7 ' + msg);
      pin('EVICT', msg);
    } else {
      const msg = 'over budget (' + mb(vfsMemoryBytes) + ' resident, budget ' + mb(VFS_MEMORY_BUDGET_BYTES) + ') but no evictable file found -- resident set is all eager, in-use, or open-handle data';
      log('I29 EVICT \u00b7 ' + msg);
      pin('EVICT', msg);
    }
  }
  function trimSelectDefForMatch(keepNames, keepStage) {
    const selectPath = normPath(motifPath ? motifPath.replace(/system\.def$/i, 'select.def') : 'data/select.def');
    const rec = vfsFiles.get(selectPath);
    if (!rec) { log('I29 SELECT TRIM \u00b7 no select.def found at ' + selectPath + ' -- nothing to trim'); return; }
    const keep = new Set(keepNames.filter(Boolean));
    const found = new Set();
    const text = decoder.decode(rec.data);
    let section = '', kept = 0, dropped = 0, charsHeaderIdx = -1;
    let stagesKept = 0, stagesDropped = 0, stagesHeaderIdx = -1, stageFound = false;
    const outLines = [];
    for (const raw of text.split(/\r?\n/)) {
      const sm = raw.match(/^\s*\[(.+?)\]/);
      if (sm) {
        section = sm[1].trim().toLowerCase();
        if (section === 'characters') charsHeaderIdx = outLines.length;
        if (section === 'extrastages') stagesHeaderIdx = outLines.length;
        outLines.push(raw);
        continue;
      }
      if (section === 'characters') {
        const semi = raw.indexOf(';');
        const line = (semi >= 0 ? raw.slice(0, semi) : raw).trim();
        const first = line ? line.split(',')[0].trim() : '';
        if (first && !keep.has(first)) { dropped++; continue; }
        if (first) { kept++; found.add(first); }
        outLines.push(raw);
        continue;
      }
      if (section === 'extrastages' && keepStage) {
        const semi = raw.indexOf(';');
        const line = (semi >= 0 ? raw.slice(0, semi) : raw).trim();
        const first = line ? line.split(',')[0].trim() : '';
        if (first === keepStage) { stagesKept++; stageFound = true; outLines.push(raw); }
        else { stagesDropped++; }
        continue;
      }
      outLines.push(raw);
    }
    if (keepStage && !stageFound) {
      if (stagesHeaderIdx >= 0) outLines.splice(stagesHeaderIdx + 1, 0, keepStage);
      else outLines.push('[ExtraStages]', keepStage);
      stagesKept++;
    }
    const injected = [...keep].filter(n => !found.has(n));
    if (injected.length) {
      if (charsHeaderIdx >= 0) outLines.splice(charsHeaderIdx + 1, 0, ...injected);
      else outLines.push('[Characters]', ...injected);
    }
    vfsPutFile(selectPath, encoder.encode(outLines.join('\n')));
    const msg = 'select.def [Characters] trimmed to ' + (kept + injected.length) + ' line(s) for this match'
      + (injected.length ? ' (' + injected.length + ' injected: ' + injected.join(', ') + ')' : '')
      + ', ' + dropped + ' other roster entries dropped so the internal engine reparse never opens them'
      + (keepStage ? '; [ExtraStages] trimmed to ' + stagesKept + ' line(s), ' + stagesDropped + ' dropped' : '; [ExtraStages] left untouched (engine-default stage)');
    log('I29 SELECT TRIM \u00b7 ' + msg);
    pin('SELECT TRIM', msg);
  }
  function vfsIsDir(path) {
    path = normPath(path);
    if (path === '' || path === '.') return true;
    return vfsDirs.has(path);
  }
  function vfsExists(path) {
    path = normPath(path);
    return vfsFiles.has(path) || vfsIsDir(path);
  }

  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();
  const fdTable = new Map();
  let nextFd = 3;
  let stdoutBuf = '', stderrBuf = '';

  function enosys() { const e = new Error('not implemented'); e.code = 'ENOSYS'; return e; }
  function enoent(path) { const e = new Error('ENOENT: no such file or directory, ' + path); e.code = 'ENOENT'; return e; }
  function statObjFor(path) {
    path = normPath(path);
    const isDir = vfsIsDir(path);
    const rec = vfsFiles.get(path);
    const size = rec ? rec.data.length : 0;
    const mode = (isDir ? S_IFDIR : S_IFREG) | (isDir ? 0o755 : 0o644);
    const now = Date.now();
    return {
      dev: 0, ino: 0, mode, nlink: 1, uid: 0, gid: 0, rdev: 0,
      size, blksize: 4096, blocks: Math.ceil(size / 512),
      atimeMs: now, mtimeMs: rec ? rec.mtimeMs : now, ctimeMs: now,
      isDirectory() { return isDir; },
    };
  }

  globalThis.fs = {
    constants: { O_WRONLY, O_RDWR, O_CREAT, O_TRUNC, O_APPEND, O_EXCL, O_DIRECTORY },
    writeSync(fd, buf) {
      const s = decoder.decode(buf);
      if (fd === 2) {
        stderrBuf += s; const nl = stderrBuf.lastIndexOf('\n');
        if (nl !== -1) { console.error(stderrBuf.substring(0, nl)); stderrBuf = stderrBuf.substring(nl + 1); }
      } else {
        stdoutBuf += s; const nl = stdoutBuf.lastIndexOf('\n');
        if (nl !== -1) { console.log(stdoutBuf.substring(0, nl)); stdoutBuf = stdoutBuf.substring(nl + 1); }
      }
      return buf.length;
    },
    write(fd, buf, offset, length, position, callback) {
      if (fd === 1 || fd === 2) {
        if (offset !== 0 || length !== buf.length || position !== null) { callback(enosys()); return; }
        callback(null, this.writeSync(fd, buf));
        return;
      }
      const h = fdTable.get(fd);
      if (!h) { callback(enoent('fd ' + fd)); return; }
      const rec = vfsFiles.get(h.path);
      if (!rec) { callback(enoent(h.path)); return; }
      const pos = position !== null && position !== undefined ? position : h.pos;
      const needed = pos + length;
      if (rec.data.length < needed) {
        const grown = new Uint8Array(needed);
        grown.set(rec.data);
        rec.data = grown;
      }
      rec.data.set(buf.subarray(offset, offset + length), pos);
      rec.mtimeMs = Date.now();
      if (position === null || position === undefined) h.pos += length;
      callback(null, length);
    },
    read(fd, buffer, offset, length, position, callback) {
      const h = fdTable.get(fd);
      if (!h) { callback(enoent('fd ' + fd)); return; }
      const rec = vfsFiles.get(h.path);
      if (!rec) { callback(enoent(h.path)); return; }
      rec.lastAccess = Date.now();
      const pos = position !== null && position !== undefined ? position : h.pos;
      const avail = Math.max(0, rec.data.length - pos);
      const n = Math.min(length, avail);
      if (n > 0) buffer.set(rec.data.subarray(pos, pos + n), offset);
      if (position === null || position === undefined) h.pos += n;
      callback(null, n);
    },
    async open(path, flags, mode, callback) {
      path = normPath(path);
      await lazyMaterialize(path);
      path = resolvePath(path);
      const wantCreate = (flags & O_CREAT) !== 0;
      const wantTrunc = (flags & O_TRUNC) !== 0;
      if (vfsIsDir(path)) {
        const fd = nextFd++; fdTable.set(fd, { path, pos: 0, isDir: true });
        callback(null, fd);
        return;
      }
      let rec = vfsFiles.get(path);
      if (!rec) {
        if (!wantCreate) { callback(enoent(path)); return; }
        rec = { data: new Uint8Array(0), dir: false, mtimeMs: Date.now() };
        vfsFiles.set(path, rec);
        ensureParentDirs(path);
      } else if (wantTrunc) {
        rec.data = new Uint8Array(0);
      }
      const fd = nextFd++;
      fdTable.set(fd, { path, pos: 0 });
      callback(null, fd);
    },
    close(fd, callback) { fdTable.delete(fd); callback(null); },
    fstat(fd, callback) {
      const h = fdTable.get(fd);
      if (!h) { callback(enoent('fd ' + fd)); return; }
      callback(null, statObjFor(h.path));
    },
    async stat(path, callback) {
      path = normPath(path);
      await lazyMaterialize(path);
      path = resolvePath(path);
      if (!vfsExists(path)) { callback(enoent(path)); return; }
      callback(null, statObjFor(path));
    },
    lstat(path, callback) { this.stat(path, callback); },
    fsync(fd, callback) { callback(null); },
    ftruncate(fd, length, callback) {
      const h = fdTable.get(fd);
      if (!h) { callback(enoent('fd ' + fd)); return; }
      const rec = vfsFiles.get(h.path);
      if (!rec) { callback(enoent(h.path)); return; }
      const grown = new Uint8Array(length);
      grown.set(rec.data.subarray(0, Math.min(length, rec.data.length)));
      rec.data = grown;
      callback(null);
    },
    mkdir(path, perm, callback) { path = normPath(path); vfsDirs.add(path); ensureParentDirs(path); callback(null); },
    rmdir(path, callback) { vfsDirs.delete(normPath(path)); callback(null); },
    unlink(path, callback) { vfsFiles.delete(normPath(path)); callback(null); },
    rename(from, to, callback) {
      from = normPath(from); to = normPath(to);
      if (vfsFiles.has(from)) { vfsFiles.set(to, vfsFiles.get(from)); vfsFiles.delete(from); ensureParentDirs(to); }
      callback(null);
    },
    readdir(path, callback) {
      path = normPath(path);
      if (!vfsIsDir(path) && path !== '') { callback(enoent(path)); return; }
      const prefix = path === '' ? '' : path + '/';
      const names = new Set();
      for (const p of vfsFiles.keys()) {
        if (p.startsWith(prefix)) {
          const rest = p.slice(prefix.length);
          const seg = rest.split('/')[0];
          if (seg) names.add(seg);
        }
      }
      for (const p of vfsDirs) {
        if (p.startsWith(prefix) && p !== path) {
          const rest = p.slice(prefix.length);
          const seg = rest.split('/')[0];
          if (seg) names.add(seg);
        }
      }
      callback(null, [...names]);
    },
    readlink(path, callback) { callback(enosys()); },
    symlink(path, link, callback) { callback(enosys()); },
    link(path, link, callback) { callback(enosys()); },
    chmod(path, mode, callback) { callback(null); },
    fchmod(fd, mode, callback) { callback(null); },
    chown(path, uid, gid, callback) { callback(null); },
    fchown(fd, uid, gid, callback) { callback(null); },
    lchown(path, uid, gid, callback) { callback(null); },
    truncate(path, length, callback) { callback(null); },
    utimes(path, atime, mtime, callback) { callback(null); },
  };
  if (!globalThis.process) {
    globalThis.process = {
      getuid() { return 0; }, getgid() { return 0; }, geteuid() { return 0; }, geteid() { return 0; },
      getgroups() { return [0]; }, pid: 1, ppid: 0,
      umask() { return 0; }, cwd() { return '/'; }, chdir() {},
    };
  }

  log('I29 VFS ARMED · in-memory filesystem installed before wasm_exec.js loads');

  // ---------------------------------------------------------------------
  // ZIP -> VFS loading
  // ---------------------------------------------------------------------
  let motifPath = null, stagePath = null;
  const charNames = [];
  let allChars = [], allStages = [];
  let runtimeAssetsLoaded = false;

  async function ensureFflate() {
    if (typeof fflate !== 'undefined') return;
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js';
      s.onload = res; s.onerror = () => rej(new Error('fflate CDN load failed'));
      document.head.appendChild(s);
    });
  }

  const EXTRA_CHAR_PACKS = [{ name: 'kineza', url: './assets/ikemen-web/kineza-char-v03b-input.zip' }];
  let extraCharsLoaded = false;
  const extraCharNames = [];
  async function loadExtraChars() {
    if (extraCharsLoaded) return;
    extraCharNames.length = 0;
    for (const pack of EXTRA_CHAR_PACKS) {
      try {
        status('LOADING ' + pack.name.toUpperCase());
        const resp = await fetch(pack.url, { cache: 'no-store' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const blob = await resp.blob();
        const entries = await listZipEntries(blob);
        let n = 0, bytes = 0;
        for (const ent of entries) {
          if (!ent.name || ent.name.endsWith('/')) continue;
          const raw = await entryRaw(blob, ent);
          vfsPutFile(ent.name, raw);
          n++; bytes += raw.length;
        }
        extraCharNames.push(pack.name);
        const msg = pack.name + ' merged into VFS -- ' + n + ' file(s), ' + mb(bytes) + ' (repo-hosted, not from the user zip)';
        log('I29 EXTRA CHAR \u00b7 ' + msg);
        pin('EXTRA CHAR', msg);
      } catch (e) {
        log('I29 EXTRA CHAR \u00b7 ' + pack.name + ' failed to load (' + ((e && e.message) || e) + ') -- continuing without it');
      }
    }
    extraCharsLoaded = true;
  }

  async function loadRuntimeAssets() {
    if (runtimeAssetsLoaded) return;
    status('LOADING ENGINE RUNTIME ASSETS');
    log('I29 RUNTIME ASSETS · fetching ikemen-runtime-assets.zip (engine\'s own data/font/external -- required regardless of game content, per RIG I2\'s first probe hitting "open external/script/main.lua")');
    const resp = await fetch('./assets/ikemen-web/ikemen-runtime-assets.zip', { cache: 'no-store' });
    if (!resp.ok) throw new Error('runtime assets fetch HTTP ' + resp.status);
    const blob = await resp.blob();
    const entries = await listZipEntries(blob);
    let n = 0;
    for (const ent of entries) {
      if (!ent.name || ent.name.endsWith('/')) continue;
      const raw = await entryRaw(blob, ent);
      vfsPutFile(ent.name, raw);
      n++;
    }
    log('I29 RUNTIME ASSETS LOADED · ' + n + ' engine files into VFS (data/, font/, external/)');
    pin('RUNTIME ASSETS', n + ' files loaded');
    runtimeAssetsLoaded = true;
  }

  // Ikemen's own character/stage resolution (system.go AddChar, SearchFile)
  // hardcodes lookup roots like "chars/", "data/", "stages/" -- it has no
  // concept of an arbitrary top-level wrapper folder a MUGEN capsule zip
  // might use (e.g. "Winmugen/"). Same problem the BoxedWine lane already
  // solved via exeDir/prefix stripping in rig-f10-8.js; reused here: find
  // the shared leading directory across every real entry and strip it so
  // "chars/", "data/", "stages/" land at VFS root where the engine expects.
  function detectCommonPrefix(names) {
    let prefix = null;
    for (const name of names) {
      const parts = name.split('/');
      if (parts.length < 2) return '';
      const top = parts[0] + '/';
      if (prefix === null) prefix = top;
      else if (prefix !== top) return '';
    }
    return prefix || '';
  }

  // Entries loaded eagerly, before the engine even starts: the shared
  // engine-config files every boot needs regardless of which characters
  // get picked (data/, font/, plugins/, a few root config file types).
  // Everything else -- every chars/*, stages/*, sound/* entry, i.e. the
  // actual roster -- goes into zipIndex instead and is decompressed lazily
  // by lazyMaterialize() the moment the engine actually opens it. A full
  // roster zip can be gigabytes; reading only what a given match actually
  // touches is what makes that tractable at all.
  const EAGER_MAX_BYTES = 4 * 1048576;
  let eagerDeferredCount = 0, eagerDeferredBytes = 0, eagerDeferredLargest = 0, eagerDeferredLargestPath = '';
  function isEagerBootstrap(lowerRelPath, uncompressedSize) {
    if (lowerRelPath === 'winmugen.exe') return true;
    if (!lowerRelPath.includes('/') && /\.(dll|ini|cfg|dat|txt)$/i.test(lowerRelPath)) return true;
    const engineDir = lowerRelPath.startsWith('data/') || lowerRelPath.startsWith('font/') || lowerRelPath.startsWith('plugins/');
    if (!engineDir) return false;
    if (/\.(def|cns|cmd|air|ini|cfg|txt|dat|snd)$/i.test(lowerRelPath)) return true;
    if (!(uncompressedSize >= EAGER_MAX_BYTES)) return true;
    eagerDeferredCount++;
    eagerDeferredBytes += uncompressedSize;
    if (uncompressedSize > eagerDeferredLargest) { eagerDeferredLargest = uncompressedSize; eagerDeferredLargestPath = lowerRelPath; }
    return false;
  }

  // Light client-side parse of select.def, just enough to hand the engine
  // real -p1/-p2/-s candidates instead of hardcoded names -- the engine
  // does its own full, authoritative parse internally regardless. Each
  // candidate is validated against the zip index (a real chars/<name>/
  // <name>.def or stages/<name>.def has to actually exist) before being
  // used, so a stray comment or keyword line can't produce a bad argv.
  function parseSelectDef(text) {
    const chars = [], stages = [];
    let section = '';
    for (const raw of text.split(/\r?\n/)) {
      const sm = raw.match(/^\s*\[(.+?)\]/);
      if (sm) { section = sm[1].trim().toLowerCase(); continue; }
      const semi = raw.indexOf(';');
      const line = (semi >= 0 ? raw.slice(0, semi) : raw).trim();
      if (!line) continue;
      const first = line.split(',')[0].trim();
      if (!first) continue;
      if (section === 'characters' && !/^(randomselect|blank|skipslot)$/i.test(first)) chars.push(first);
      else if (section === 'extrastages') stages.push(first);
    }
    return { chars, stages };
  }
  function findCharDefKey(name) {
    name = name.replace(/\\/g, '/');
    const base = name.includes('/') ? name.split('/').pop() : name;
    const candidates = name.toLowerCase().endsWith('.def')
      ? [name]
      : [name + '/' + base + '.def', 'chars/' + name + '/' + base + '.def'];
    return candidates.some(c => zipIndexLower.has(c.toLowerCase()) || vfsFilesLower.has(c.toLowerCase()));
  }
  function findStageDefKey(name) {
    name = name.replace(/\\/g, '/');
    const candidates = name.toLowerCase().endsWith('.def') ? [name] : [name + '.def', 'stages/' + name + '.def'];
    return candidates.find(c => zipIndexLower.has(c.toLowerCase()) || vfsFilesLower.has(c.toLowerCase()));
  }

  // ---------------------------------------------------------------------
  // MobMugen beauty lane: real character portraits from the character SFF.
  // This first pass intentionally supports legacy SFF v1 / PCX only. That
  // covers WinMUGEN-era rosters without adding a second WASM runtime or a
  // heavy image library to the proven I29 boot path. SFF v2 falls back to
  // the existing monogram until a dedicated decoder is added.
  // Standard large select portrait convention: group 9000, image 1.
  // ---------------------------------------------------------------------
  function findAnyVfsKey(path) {
    path = normPath(path);
    const lower = path.toLowerCase();
    return vfsFilesLower.get(lower) || zipIndexLower.get(lower) || null;
  }

  function findCharDefPath(name) {
    name = String(name || '').replace(/\\/g, '/');
    const base = name.includes('/') ? name.split('/').pop().replace(/\.def$/i, '') : name.replace(/\.def$/i, '');
    const candidates = name.toLowerCase().endsWith('.def')
      ? [name, 'chars/' + name]
      : [name + '/' + base + '.def', 'chars/' + name + '/' + base + '.def'];
    for (const c of candidates) {
      const key = findAnyVfsKey(c);
      if (key) return key;
    }
    return null;
  }

  async function portraitBytes(path) {
    let key = findAnyVfsKey(path);
    if (!key) return null;
    if (!vfsFiles.has(key)) {
      const ok = await lazyMaterialize(key);
      if (!ok) return null;
      key = findAnyVfsKey(key) || key;
    }
    const rec = vfsFiles.get(key);
    return rec ? rec.data : null;
  }

  function parseSpriteRefFromDef(text) {
    let section = '';
    for (const raw of text.split(/\r?\n/)) {
      const sm = raw.match(/^\s*\[(.+?)\]/);
      if (sm) { section = sm[1].trim().toLowerCase(); continue; }
      if (section !== 'files') continue;
      const noComment = raw.split(';')[0];
      const m = noComment.match(/^\s*sprite\s*=\s*(.+?)\s*$/i);
      if (!m) continue;
      return m[1].trim().replace(/^["']|["']$/g, '').replace(/\\/g, '/');
    }
    return null;
  }

  async function resolveCharSffPath(name) {
    const defPath = findCharDefPath(name);
    if (!defPath) return null;
    const defBytes = await portraitBytes(defPath);
    if (!defBytes) return null;

    // Ikemen supports a compact defname_preload.sff for portraits. Prefer it
    // when present so the beauty pass doesn't wake a huge full character SFF.
    const preload = defPath.replace(/\.def$/i, '_preload.sff');
    const preloadKey = findAnyVfsKey(preload);
    if (preloadKey) return preloadKey;

    const ref = parseSpriteRefFromDef(decoder.decode(defBytes));
    if (!ref) return null;
    const dir = defPath.includes('/') ? defPath.slice(0, defPath.lastIndexOf('/')) : '';
    const candidates = [];
    if (dir) candidates.push(dir + '/' + ref);
    candidates.push(ref);
    if (!/^chars\//i.test(ref)) candidates.push('chars/' + ref);
    for (const c of candidates) {
      const key = findAnyVfsKey(c);
      if (key) return key;
    }
    return null;
  }

  function sff1Entries(bytes) {
    if (!bytes || bytes.length < 544) return null;
    const sig = String.fromCharCode(...bytes.subarray(0, 11));
    if (sig !== 'ElecbyteSpr') return null;
    const major = bytes[12];
    if (major !== 1) return { version: major, entries: [] };

    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const imageCount = dv.getUint32(20, true);
    let off = dv.getUint32(24, true);
    let subHeader = dv.getUint32(28, true);
    if (subHeader < 32 || subHeader > 256) subHeader = 32;
    const entries = [];
    const seen = new Set();

    for (let i = 0; i < imageCount && off > 0 && off + 32 <= bytes.length; i++) {
      if (seen.has(off)) break;
      seen.add(off);
      const next = dv.getUint32(off, true);
      const length = dv.getUint32(off + 4, true);
      const group = dv.getInt16(off + 12, true);
      const image = dv.getInt16(off + 14, true);
      const link = dv.getUint16(off + 16, true);
      const samePalette = bytes[off + 18] !== 0;
      const dataStart = off + subHeader;
      const dataEnd = Math.min(bytes.length, dataStart + length);
      entries.push({ off, next, length, group, image, link, samePalette, dataStart, dataEnd });
      if (!next) break;
      off = next;
    }
    return { version: major, entries };
  }

  function resolveSff1Linked(entries, idx) {
    let cur = idx, guard = 0;
    while (guard++ < entries.length) {
      const e = entries[cur];
      if (!e) return null;
      if (e.length > 0) return { entry: e, index: cur };
      if (e.link === cur || e.link >= entries.length) return null;
      cur = e.link;
    }
    return null;
  }

  function pcxPalette(bytes, entry) {
    if (!entry || entry.dataEnd - entry.dataStart < 769) return null;
    const marker = entry.dataEnd - 769;
    if (bytes[marker] !== 12) return null;
    return bytes.subarray(marker + 1, marker + 769);
  }

  function findSff1Palette(bytes, entries, startIdx) {
    for (let i = startIdx; i >= 0; i--) {
      const linked = resolveSff1Linked(entries, i);
      if (!linked) continue;
      const pal = pcxPalette(bytes, linked.entry);
      if (pal) return pal;
    }
    return null;
  }

  function decodePcx8(bytes, entry, palette) {
    const start = entry.dataStart, end = entry.dataEnd;
    if (end - start < 128 || bytes[start] !== 10) return null;
    const dv = new DataView(bytes.buffer, bytes.byteOffset + start, end - start);
    const encoding = bytes[start + 2], bpp = bytes[start + 3];
    const xmin = dv.getUint16(4, true), ymin = dv.getUint16(6, true);
    const xmax = dv.getUint16(8, true), ymax = dv.getUint16(10, true);
    const planes = bytes[start + 65];
    const bytesPerLine = dv.getUint16(66, true);
    const width = xmax - xmin + 1, height = ymax - ymin + 1;
    if (encoding !== 1 || bpp !== 8 || planes !== 1 || width <= 0 || height <= 0 || width > 4096 || height > 4096) return null;

    const palMarker = end - 769 >= start + 128 && bytes[end - 769] === 12 ? end - 769 : end;
    const decoded = new Uint8Array(bytesPerLine * height);
    let p = start + 128, out = 0;
    while (p < palMarker && out < decoded.length) {
      const b = bytes[p++];
      if ((b & 0xC0) === 0xC0) {
        const count = b & 0x3F;
        if (p >= palMarker) break;
        const value = bytes[p++];
        const n = Math.min(count, decoded.length - out);
        decoded.fill(value, out, out + n);
        out += n;
      } else {
        decoded[out++] = b;
      }
    }
    if (out < Math.min(decoded.length, width * height)) return null;
    if (!palette || palette.length < 768) return null;

    const rgba = new Uint8ClampedArray(width * height * 4);
    let q = 0;
    for (let y = 0; y < height; y++) {
      const row = y * bytesPerLine;
      for (let x = 0; x < width; x++) {
        const idx = decoded[row + x];
        const pi = idx * 3;
        rgba[q++] = palette[pi];
        rgba[q++] = palette[pi + 1];
        rgba[q++] = palette[pi + 2];
        rgba[q++] = idx === 0 ? 0 : 255;
      }
    }
    return { width, height, rgba };
  }

  function rgbaToDataUrl(decoded) {
    const c = document.createElement('canvas');
    c.width = decoded.width; c.height = decoded.height;
    const ctx = c.getContext('2d', { alpha: true });
    if (!ctx) return null;
    const image = new ImageData(decoded.rgba, decoded.width, decoded.height);
    ctx.putImageData(image, 0, 0);
    return c.toDataURL('image/png');
  }

  const portraitCache = new Map();

  function motifPortraitRefs() {
    const refs = [];
    const rec = motifPath ? vfsFiles.get(motifPath) : null;
    if (rec) {
      const text = decoder.decode(rec.data);
      // Screenpacks commonly define the large select faces here. Read the
      // loaded motif rather than assuming one hard-coded sprite pair.
      const re = /^\s*(p1\.face\.spr|p2\.face\.spr|portrait\.spr)\s*=\s*(-?\d+)\s*,\s*(-?\d+)/gim;
      let m;
      while ((m = re.exec(text))) refs.push([Number(m[2]), Number(m[3]), m[1]]);
    }
    // Standard big portrait first, then standard small portrait as an honest
    // fallback. Kineza's current validated SFF has 9000,0 but no 9000,1.
    refs.push([9000, 1, 'standard-big'], [9000, 0, 'standard-small']);
    const seen = new Set();
    return refs.filter(([g,i]) => {
      const k = g + ',' + i;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  async function loadSffPortraitForCharacter(name) {
    name = String(name || '');
    if (!name) return { url:null, status:'empty name' };
    if (portraitCache.has(name)) return portraitCache.get(name);

    const promise = (async () => {
      try {
        const sffPath = await resolveCharSffPath(name);
        if (!sffPath) throw new Error('sprite SFF not found');
        const bytes = await portraitBytes(sffPath);
        if (!bytes) throw new Error('sprite SFF unreadable');

        const parsed = sff1Entries(bytes);
        if (!parsed) throw new Error('unrecognized SFF signature');
        if (parsed.version !== 1) {
          return { url:null, status:'SFF v' + parsed.version + ' decoder pending', sffPath, version:parsed.version };
        }

        const refs = motifPortraitRefs();
        const available = refs.map(([g,i,label]) => {
          const idx = parsed.entries.findIndex(e => e.group === g && e.image === i);
          return { g, i, label, idx };
        });

        for (const cand of available) {
          if (cand.idx < 0) continue;
          const linked = resolveSff1Linked(parsed.entries, cand.idx);
          if (!linked) continue;
          const palette = pcxPalette(bytes, linked.entry) || findSff1Palette(bytes, parsed.entries, cand.idx);
          const decoded = decodePcx8(bytes, linked.entry, palette);
          if (!decoded) continue;
          const url = rgbaToDataUrl(decoded);
          if (!url) continue;

          const ref = cand.g + ',' + cand.i;
          const status = ref + ' ' + decoded.width + 'x' + decoded.height;
          log('I29 PORTRAIT · ' + name + ' ' + ref + ' decoded from ' + sffPath +
            ' via ' + cand.label + ' (' + decoded.width + 'x' + decoded.height + ')');
          return { url, status, sffPath, version:1, group:cand.g, image:cand.i, source:cand.label };
        }

        const found = available.filter(x => x.idx >= 0).map(x => x.g + ',' + x.i).join(' / ');
        throw new Error(found
          ? 'portrait sprite(s) found (' + found + ') but PCX/palette decode failed'
          : 'no configured/standard portrait sprite found; tried ' + refs.map(r => r[0] + ',' + r[1]).join(' / '));
      } catch (e) {
        const msg = ((e && e.message) || e);
        log('I29 PORTRAIT · ' + name + ' fallback -- ' + msg);
        return { url:null, status:msg };
      }
    })();

    portraitCache.set(name, promise);
    return promise;
  }

  let portraitRefreshToken = 0;
  let portraitSelfTestResult = 'not run';

  function setPortraitWell(well, result) {
    if (!well) return;
    const img = well.querySelector('.portrait-art');
    const span = well.querySelector('span');
    if (result && result.url) {
      if (img) {
        img.onload = () => {
          well.dataset.imageState = 'loaded';
          log('I29 PORTRAIT IMG · loaded ' + result.url);
        };
        img.onerror = () => {
          well.dataset.imageState = 'error';
          log('I29 PORTRAIT IMG · failed ' + result.url);
          if (span) span.hidden = false;
          img.hidden = true;
          well.classList.remove('has-art');
          well.classList.remove('portrait-authority');
        };
        img.src = result.url;
        img.hidden = false;
      }
      if (span) span.hidden = true;
      well.classList.add('has-art');
      well.classList.toggle('portrait-authority', result.source === 'approved-asset');
      well.dataset.portraitSource = result.status || 'loaded';
      return;
    }
    if (img) {
      img.removeAttribute('src');
      img.hidden = true;
    }
    if (span) span.hidden = false;
    well.classList.remove('has-art');
    well.classList.remove('portrait-authority');
    well.dataset.portraitSource = (result && result.status) || 'fallback';
  }

  async function runPortraitSelfTest() {
    // Kineza is repo-hosted and its validated manifest proves 9000,0 exists.
    // Decode it before the user's library is scanned so a phone test tells us
    // whether the SFF/PCX decoder itself works independently of roster paths.
    try {
      portraitCache.delete('kineza');
      const result = await loadSffPortraitForCharacter('kineza');
      portraitSelfTestResult = result && result.url
        ? 'KINEZA PASS · ' + (result.status || 'decoded')
        : 'KINEZA FAIL · ' + ((result && result.status) || 'unknown');
      pin('PORTRAIT SELFTEST', portraitSelfTestResult);
      log('I29 PORTRAIT SELFTEST · ' + portraitSelfTestResult);
      // Do not let the self-test cache dictate later motif-aware selection.
      portraitCache.delete('kineza');
      return !!(result && result.url);
    } catch (e) {
      portraitSelfTestResult = 'KINEZA FAIL · ' + ((e && e.message) || e);
      pin('PORTRAIT SELFTEST', portraitSelfTestResult);
      log('I29 PORTRAIT SELFTEST · ' + portraitSelfTestResult);
      portraitCache.delete('kineza');
      return false;
    }
  }

  const PORTRAIT_OVERRIDES = Object.freeze({
    kineza: '../kineza_portrait.png'
  });

  function portraitOverrideKey(name) {
    const clean = String(name || '').replace(/\\/g, '/').replace(/\.def$/i, '');
    return clean.split('/').pop().toLowerCase();
  }

  async function loadPortraitForCharacter(name) {
    const key = portraitOverrideKey(name);
    const override = PORTRAIT_OVERRIDES[key];
    if (override) {
      return {
        url: override + '?v=79524498',
        status: 'APPROVED SELECT ART',
        source: 'approved-asset'
      };
    }
    return loadSffPortraitForCharacter(name);
  }

  async function refreshSelectedPortraits() {
    const token = ++portraitRefreshToken;
    const diagEl = document.getElementById('portraitDiag');
    const pairs = [
      ['P1', document.getElementById('selP1'), document.getElementById('p1Portrait')],
      ['CPU', document.getElementById('selP2'), document.getElementById('p2Portrait')],
    ];
    const diagParts = ['BUILD: V17', 'SELFTEST: ' + portraitSelfTestResult];

    await Promise.all(pairs.map(async ([slot, label, well]) => {
      if (!label || !well) return;
      const name = (label.textContent || '').trim();
      if (!name || name === '-' || /choose/i.test(name)) {
        setPortraitWell(well, null);
        diagParts.push(slot + ': waiting');
        return;
      }

      const result = await loadPortraitForCharacter(name);
      if (token !== portraitRefreshToken) return;
      const current = (label.textContent || '').trim();
      if (current !== name) return;

      setPortraitWell(well, result);
      if (result && result.url) {
        diagParts.push(slot + ': ' + name + ' ✓ ' + (result.status || 'loaded'));
      } else {
        diagParts.push(slot + ': ' + name + ' · ' + ((result && result.status) || 'fallback'));
      }
    }));

    if (token === portraitRefreshToken && diagEl) {
      diagEl.textContent = diagParts.join('\n');
    }
  }

  async function loadZipIntoVfs(file) {
    status('READING ZIP');
    log('I29 ZIP · reading central directory of ' + file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB)');
    currentZipFile = file;
    const entries = await listZipEntries(file);
    log('I29 ZIP · ' + entries.length + ' entries found');
    const realEntries = entries.filter(e => e.name && !e.name.endsWith('/'));

    // Find Winmugen.exe (or an Ikemen-style content zip with no exe at all)
    // to establish the prefix to strip, same convention as the BoxedWine
    // lane.
    const exe = realEntries.find(e => {
      const l = e.name.toLowerCase();
      return l === 'winmugen.exe' || l.endsWith('/winmugen.exe');
    });
    let prefix = '';
    if (exe) {
      const exeDir = exe.name.includes('/') ? exe.name.slice(0, exe.name.lastIndexOf('/')) : '';
      prefix = exeDir ? exeDir.replace(/\\/g, '/') + '/' : '';
    } else {
      prefix = detectCommonPrefix(realEntries.map(e => e.name));
    }
    if (prefix) log('I29 ZIP · stripping common wrapper folder "' + prefix + '" so chars/data/stages land at VFS root');

    let eagerCount = 0, indexedCount = 0;
    for (const ent of realEntries) {
      if (prefix && !ent.name.startsWith(prefix)) continue;
      const stripped = prefix ? ent.name.slice(prefix.length) : ent.name;
      const lower = stripped.toLowerCase();
      if (isEagerBootstrap(lower, ent.uncomp)) {
        const raw = await entryRaw(file, ent);
        vfsPutFile(stripped, raw);
        if (lower.endsWith('/system.def') || lower === 'system.def') motifPath = stripped;
        eagerCount++;
        if (eagerCount % 20 === 0) { status('LOADING ' + eagerCount); reportMemory('eager load, file ' + eagerCount); }
      } else {
        zipIndex.set(stripped, ent);
        zipIndexLower.set(lower, stripped);
        indexedCount++;
      }
    }
    log('I29 ZIP · ' + eagerCount + ' engine-config files loaded now, ' + indexedCount +
      ' roster files (chars/stages/sound) indexed for on-demand loading -- not read yet');
    if (eagerDeferredCount > 0) {
      const dmsg = 'deferred ' + eagerDeferredCount + ' large engine-config file(s) totalling ' + mb(eagerDeferredBytes) + ' out of the eager load (threshold ' + mb(EAGER_MAX_BYTES) + ', largest ' + mb(eagerDeferredLargest) + ' ' + eagerDeferredLargestPath + ') -- they load on demand only if the engine opens them';
      log('I29 LEAN BOOT \u00b7 ' + dmsg);
      pin('LEAN BOOT', dmsg);
    }
    reportMemory('after eager load complete');

    // Discover the real roster from select.def for the UI picker.
    charNames.length = 0;
    allChars = [];
    allStages = [];
    const selectRec = vfsFiles.get(motifPath ? motifPath.replace(/system\.def$/i, 'select.def') : 'data/select.def');
    if (selectRec) {
      const text = decoder.decode(selectRec.data);
      const parsed = parseSelectDef(text);
      allChars = [...new Set(parsed.chars.filter(n => findCharDefKey(n)))];
      allStages = parsed.stages.filter(n => findStageDefKey(n));
      log('I29 ROSTER · select.def parsed: ' + parsed.chars.length + ' character lines, ' + parsed.stages.length +
        ' extra-stage lines -- found ' + allChars.length + ' resolvable characters, ' + allStages.length + ' stages');
      const shown = allChars.slice(0, 60);
      const rosterMsg = 'I29 ROSTER · ' + allChars.length + ' playable names found: ' +
        shown.join(', ') + (allChars.length > shown.length ? ' ... (+' + (allChars.length - shown.length) + ' more)' : '');
      log(rosterMsg);
      pin('ROSTER', rosterMsg);
    } else {
      log('I29 ROSTER · no select.def found -- scanning for all resolvable characters/stages');
      for (const key of zipIndexLower.keys()) {
        const m = key.match(/^chars\/([^\/]+)\/([^\/]+)\.def$/);
        if (m && m[1] === m[2]) allChars.push(m[1]);
      }
      allChars = [...new Set(allChars)].sort();
      for (const key of zipIndexLower.keys()) {
        const m = key.match(/^stages\/([^\/]+)\.def$/);
        if (m) allStages.push(m[1]);
      }
      allStages = [...new Set(allStages)].sort();
    }
    for (const nm of extraCharNames) {
      if (findCharDefKey(nm) && allChars.indexOf(nm) < 0) {
        allChars.unshift(nm);
        log('I29 EXTRA CHAR \u00b7 ' + nm + ' added to the picker roster at position 1 of ' + allChars.length);
      }
    }
    // Fallback: auto-pick first two characters for initial selection
    if (charNames.length < 2 && allChars.length >= 2) {
      charNames.push(allChars[0], allChars[1]);
    } else if (charNames.length < 1 && allChars.length >= 1) {
      charNames.push(allChars[0]);
    }
    if (!stagePath && allStages.length > 0) {
      const key = findStageDefKey(allStages[0]);
      if (key) stagePath = key;
    }

    log('I29 DETECTED · motif=' + (motifPath || '(none found)') + ' stage=' + (stagePath || '(none found)') + ' chars=' + JSON.stringify(charNames));
    pin('DETECTED', 'motif=' + motifPath + ' stage=' + stagePath + ' chars=' + JSON.stringify(charNames));
    zipLoaded = true;
    status('ZIP LOADED · STARTING ENGINE');
  }

  // fromStorage: this File came back out of IndexedDB, so it's already
  // persisted -- skip re-writing it.
  async function loadAndShowPicker(file, fromStorage) {
    try {
      status('LOADING UNZIP LIB');
      await ensureFflate();
      await loadRuntimeAssets();
      await loadExtraChars();
      await runPortraitSelfTest();
      await loadZipIntoVfs(file);
      showCharacterPicker();

      // Persist AFTER the picker is up. The zip is already indexed and
      // playable at this point, so a slow or refused write costs the user
      // nothing -- and storeZipInDB() never throws, it reports.
      if (!fromStorage) {
        const zipHash = await zipFingerprint(file);
        if (zipHash) {
          await requestPersistence();
          const ok = await storeZipInDB(file, zipHash);
          if (ok) {
            log('I29 STORAGE · zip saved for next visit (' + file.name + ', hash ' + zipHash + ') -- ' +
              'reloading this page will skip the file picker');
            pin('STORAGE', 'zip persisted: ' + file.name);
            await reportQuota('after save');
          }
        }
      }
    } catch (e) {
      const msg = 'I29 ZIP ERROR · ' + ((e && e.stack) || e);
      log(msg); pin('CRASH', msg); status('FAILED · SEE TRACE');
    }
  }

  zipInput.addEventListener('change', async () => {
    const f = zipInput.files && zipInput.files[0];
    if (!f) return;
    await loadAndShowPicker(f, false);
  });

  // Character picker UI
  // ---------------------------------------------------------------------
  const SETUP_DESC = 'Load a MUGEN content zip. It stays saved in this browser, ' +
    'so you only pick the file once.';
  const GRID_IDS = { p1: 'p1Grid', p2: 'p2Grid', stage: 'stageGrid' };
  const pickerState = { p1Idx: 0, p2Idx: 0, stageIdx: 0 };
  let pickerWired = false;

  function showCharacterPicker() {
    pickerState.p1Idx = Math.max(0, allChars.indexOf(charNames[0]));
    pickerState.p2Idx = Math.max(0, allChars.indexOf(charNames[1]));
    pickerState.stageIdx = 0;

    document.getElementById('setupDesc').textContent =
      'Pick your fighter, an opponent and a stage. D-pad moves, START selects.';
    document.getElementById('zipLabel').classList.add('hide');
    document.getElementById('prepDiag').classList.add('hide');
    document.getElementById('charPickerSection').classList.remove('hide');

    buildRosterGrid('p1', allChars, pickerState.p1Idx);
    buildRosterGrid('p2', allChars, pickerState.p2Idx);
    buildRosterGrid('stage', allStages, pickerState.stageIdx);
    updateSelectionDisplay();

    // Bind once. showCharacterPicker() runs again after CHANGE ZIP, and
    // re-adding these every time would stack listeners -- one tap of START
    // would then fire startMatch() once per zip the user had ever loaded.
    if (!pickerWired) {
      document.getElementById('startBtn').addEventListener('click', startMatch);
      document.getElementById('changeZipBtn').addEventListener('click', resetForNewZip);
      pickerWired = true;
    }

    const first = document.querySelector('#p1Grid .roster-item.selected') ||
      document.querySelector('#p1Grid .roster-item');
    if (first) first.focus();

    status('SELECT FIGHTERS');
    log('I29 PICKER · ' + allChars.length + ' characters / ' + allStages.length + ' stages offered');
  }

  function buildRosterGrid(mode, names, selectedIdx) {
    const grid = document.getElementById(GRID_IDS[mode]);
    grid.innerHTML = '';
    names.forEach((name, idx) => {
      const btn = document.createElement('button');
      btn.className = 'roster-item' + (idx === selectedIdx ? ' selected' : '');
      btn.textContent = name;
      btn.dataset.mode = mode;
      btn.dataset.idx = idx;
      btn.addEventListener('click', () => selectItem(mode, idx));
      grid.appendChild(btn);
    });
    if (!names.length) {
      const empty = document.createElement('div');
      empty.className = 'roster-empty';
      empty.textContent = mode === 'stage'
        ? 'no stages found in this zip — the engine will use its own default'
        : 'no characters found in this zip';
      grid.appendChild(empty);
    }
  }

  function selectItem(mode, idx) {
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
      log('I29 PICKER · P1 selected; focus moved to P2');
    } else if (mode === 'p2') {
      if (allStages.length) {
        focusPickerMode('stage');
        log('I29 PICKER · P2 selected; focus moved to Stage');
      } else {
        focusStartButton();
        log('I29 PICKER · P2 selected; no stages listed; focus moved to START MATCH');
      }
    } else if (mode === 'stage') {
      focusStartButton();
      log('I29 PICKER · Stage selected; focus moved to START MATCH');
    }
  }

  function updateSelectionDisplay() {
    const p1Name = allChars[pickerState.p1Idx];
    const p2Name = allChars[pickerState.p2Idx];
    const stageName = allStages[pickerState.stageIdx];
    const selP1 = document.getElementById('selP1');
    const selP2 = document.getElementById('selP2');
    const selStage = document.getElementById('selStage');
    selP1.textContent = p1Name || '-';
    selP2.textContent = p2Name || '-';
    selStage.textContent = stageName || '(engine default)';
    selP1.closest('.sel-item').classList.toggle('filled', !!p1Name);
    selP2.closest('.sel-item').classList.toggle('filled', !!p2Name);
    selStage.closest('.sel-item').classList.toggle('filled', !!stageName);
    refreshSelectedPortraits();
  }

  function startMatch() {
    const p1 = allChars[pickerState.p1Idx];
    const p2 = allChars[pickerState.p2Idx];
    if (!p1) { log('I29 PICKER · no character selected -- nothing to start'); return; }
    charNames[0] = p1;
    charNames[1] = p2 || p1;
    const stageName = allStages[pickerState.stageIdx];
    if (stageName) stagePath = findStageDefKey(stageName) || stagePath;
    log('I29 PICKER · starting match: P1=' + charNames[0] + ' P2=' + charNames[1] +
      ' stage=' + (stagePath || '(engine default)'));
    pin('PICKED', 'P1=' + charNames[0] + ' P2=' + charNames[1] + ' stage=' + stagePath);
    if (typeof releaseAllControlKeys === 'function') releaseAllControlKeys('match start');
    document.getElementById('setup').classList.add('hide');
    showMatchLoadingOverlay();
    trimSelectDefForMatch([charNames[0], charNames[1]], stageName);
    boot();
  }

  async function resetForNewZip() {
    charNames.length = 0;
    zipLoaded = false;
    started = false;
    allChars = [];
    allStages = [];
    zipIndex.clear();
    zipIndexLower.clear();
    vfsFiles.clear();
    vfsDirs.clear();
    runtimeAssetsLoaded = false;
    extraCharsLoaded = false;
    portraitCache.clear();
    motifPath = null;
    stagePath = null;

    // The saved copy has to go too, or the next reload silently restores
    // the zip the user just asked to replace.
    await clearAllStoredZips();

    const setupDesc = document.getElementById('setupDesc');
    const zipLabel = document.getElementById('zipLabel');
    const prepDiag = document.getElementById('prepDiag');
    const charPickerSec = document.getElementById('charPickerSection');

    setupDesc.textContent = SETUP_DESC;
    zipLabel.classList.remove('hide');
    charPickerSec.classList.add('hide');
    prepDiag.classList.remove('hide');
    prepDiag.textContent = 'Waiting for zip…';
    status('WAITING FOR ZIP');
    zipInput.value = '';
    log('I29 PICKER · cleared saved zip -- pick a new one');
  }

  // On page load, check whether a previously-picked zip is still in
  // IndexedDB and reuse it instead of making the user find the file again.
  async function autoLoadStoredZip() {
    try {
      await initDB();
      const recs = await listStoredZips();
      if (!recs.length) {
        log('I29 STORAGE · no saved zip yet -- pick one and it\'ll be remembered for next time');
        status('WAITING FOR ZIP');
        return;
      }
      const rec = recs[0];
      // Safari can hand back a record whose blob-store backing is gone
      // (evicted, or the File's underlying disk entry vanished). The
      // record survives; the bytes don't. Probe with a 1-byte ranged read
      // before committing to it, so a dead reference falls back to the
      // picker instead of failing deep inside the zip reader.
      let usable = false;
      try {
        if (rec.file && typeof rec.file.slice === 'function' && rec.file.size > 0) {
          await rec.file.slice(0, 1).arrayBuffer();
          usable = true;
        }
      } catch (_) { usable = false; }

      if (!usable) {
        log('I29 STORAGE · saved zip "' + (rec.filename || '?') + '" is no longer readable ' +
          '(evicted by the browser) -- clearing it, please pick the zip again');
        await clearAllStoredZips();
        status('WAITING FOR ZIP');
        return;
      }

      log('I29 STORAGE · reusing saved zip: ' + rec.filename + ' (' + (rec.file.size / 1048576).toFixed(1) + ' MB) -- no re-upload needed');
      pin('STORAGE', 'reused saved zip: ' + rec.filename);
      status('LOADING SAVED ZIP');
      await loadAndShowPicker(rec.file, true);
      return;
    } catch (e) {
      log('I29 STORAGE · IndexedDB unavailable (' + ((e && e.message) || e) + ') -- falling back to file picker');
    }
    status('WAITING FOR ZIP');
  }

  const LOAD_OVERLAY_QUIET_MS = 900;
  const LOAD_OVERLAY_MAX_MS = 180000;
  let loadOverlayEl = null, loadOverlayCountEl = null, loadOverlaySettleTimer = null, loadOverlayHardTimer = null, loadOverlayListener = null;
  function showMatchLoadingOverlay() {
    if (loadOverlayEl) return;
    const stageEl = document.querySelector('.stage');
    if (!stageEl) return;
    const el = document.createElement('div');
    el.id = 'matchLoadOverlay';
    el.style.cssText = 'position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#070b13;color:#f1bf55;font:900 13px ui-monospace;letter-spacing:.08em;text-align:center;padding:20px';
    const title = document.createElement('div');
    title.textContent = 'LOADING MATCH\u2026';
    const count = document.createElement('div');
    count.style.cssText = 'font-size:10px;color:#8390a4;letter-spacing:.04em;max-width:90%;overflow-wrap:anywhere';
    count.textContent = 'preparing\u2026';
    el.appendChild(title);
    el.appendChild(count);
    stageEl.appendChild(el);
    loadOverlayEl = el;
    loadOverlayCountEl = count;
    const shownAt = performance.now();
    const startCount = lazyActivity.count;
    const shownMsg = 'shown -- covering canvas until at least one real asset loads and then settles (quiet ' + LOAD_OVERLAY_QUIET_MS + 'ms) or ' + LOAD_OVERLAY_MAX_MS + 'ms elapses';
    log('I29 LOAD OVERLAY \u00b7 ' + shownMsg);
    pin('LOAD OVERLAY', shownMsg);
    reportMemory('match load starting');
    const remove = reason => {
      if (!loadOverlayEl) return;
      if (loadOverlaySettleTimer) { clearTimeout(loadOverlaySettleTimer); loadOverlaySettleTimer = null; }
      if (loadOverlayHardTimer) { clearTimeout(loadOverlayHardTimer); loadOverlayHardTimer = null; }
      if (loadOverlayListener) { const i = lazyActivity.listeners.indexOf(loadOverlayListener); if (i >= 0) lazyActivity.listeners.splice(i, 1); loadOverlayListener = null; }
      loadOverlayEl.remove();
      loadOverlayEl = null; loadOverlayCountEl = null;
      const elapsedMs = Math.round(performance.now() - shownAt);
      const removedMsg = 'removed after ' + elapsedMs + 'ms (' + reason + '), ' + (lazyActivity.count - startCount) + ' lazy asset(s) materialized during load';
      log('I29 LOAD OVERLAY \u00b7 ' + removedMsg);
      pin('LOAD OVERLAY', removedMsg);
      reportMemory('match load ' + reason);
    };
    const armSettle = () => {
      if (loadOverlaySettleTimer) clearTimeout(loadOverlaySettleTimer);
      loadOverlaySettleTimer = setTimeout(() => {
        if (lazyActivity.count <= startCount) { armSettle(); return; }
        remove('asset loading settled');
      }, LOAD_OVERLAY_QUIET_MS);
    };
    let lastPinnedAt = 0;
    loadOverlayListener = key => {
      const n = lazyActivity.count - startCount;
      if (loadOverlayCountEl) loadOverlayCountEl.textContent = n + ' asset' + (n === 1 ? '' : 's') + ' loaded' + (key ? ' \u2014 ' + key.split('/').pop() : '');
      if (n > 0 && n % 15 === 0 && performance.now() - lastPinnedAt > 4000) {
        lastPinnedAt = performance.now();
        pin('LOAD OVERLAY', 'still loading \u2014 ' + n + ' asset(s) so far, ' + Math.round(performance.now() - shownAt) + 'ms elapsed');
        reportMemory('mid-load, ' + n + ' assets in');
      }
      armSettle();
    };
    lazyActivity.listeners.push(loadOverlayListener);
    armSettle();
    loadOverlayHardTimer = setTimeout(() => remove('hard timeout -- asset loading did not settle in time'), LOAD_OVERLAY_MAX_MS);
  }

  async function boot() {
    if (started) return;
    started = true;
    try {
      status('LOADING GO RUNTIME');
      log('I29 WRAPPER · loaded rig-ikemen-2 · VFS + CLI quick-match boot probe');
      log('I29 USER AGENT · ' + navigator.userAgent);

      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = './assets/ikemen-web/wasm_exec.js';
        s.onload = res; s.onerror = () => rej(new Error('wasm_exec.js load failed'));
        document.head.appendChild(s);
      });
      if (typeof Go !== 'function') throw new Error('wasm_exec.js did not define Go');

      const go = new Go();
      const argv = ['ikemen'];
      if (charNames[0]) argv.push('-p1', charNames[0]);
      if (charNames[1] || charNames[0]) argv.push('-p2', charNames[1] || charNames[0]);
      if (motifPath) argv.push('-loadmotif', motifPath);
      // main.lua reads flags['-s'] for the stage, NOT '-stage' -- confirmed
      // by tracing f_commandLine() directly (main.lua ~line 1065). Passing
      // '-stage' here silently no-ops and falls through to Ikemen's own
      // default stage candidates, which we haven't bundled -> hard panic.
      if (stagePath) argv.push('-s', stagePath);
      // NOTE: '-r <path>' is Ikemen's OWN alternate spelling of -loadmotif
      // (confirmed against this exact build's --help text), not "rounds" --
      // an earlier draft of this probe passed '-r 1' expecting round count
      // and it silently clobbered -loadmotif with the literal path "1",
      // producing "Can't load motif : 1: ... open 1: no such file". Do not
      // reintroduce '-r' here for anything other than an actual motif path.
      argv.push('-p2.ai', '5');
      go.argv = argv;
      log('I29 ARGV · ' + JSON.stringify(argv));
      pin('ARGV', JSON.stringify(argv));

      status('INSTANTIATING WASM');
      const wasmUrl = './assets/ikemen-web/ikemen-v2.wasm';
      let result;
      if (WebAssembly.instantiateStreaming) {
        result = await WebAssembly.instantiateStreaming(fetch(wasmUrl, { cache: 'no-store' }), go.importObject);
      } else {
        const buf = await (await fetch(wasmUrl, { cache: 'no-store' })).arrayBuffer();
        result = await WebAssembly.instantiate(buf, go.importObject);
      }
      log('I29 WASM INSTANTIATED · module compiled and linked successfully');
      pin('MILESTONE', 'WASM module instantiated with real VFS installed');
      setup.classList.add('hide');

      status('RUNNING · go.run(instance)');
      const runPromise = go.run(result.instance);
      runPromise.then(() => {
        log('I29 GO.RUN RETURNED · the Go program exited');
        pin('MILESTONE', 'go.run() resolved -- Go program exited, no JS-level crash');
        status('EXITED · SEE TRACE');
      }).catch(e => {
        const msg = 'I29 GO.RUN THREW · ' + ((e && e.stack) || e);
        log(msg); pin('CRASH', msg); status('CRASHED · SEE TRACE');
      });

      setTimeout(() => {
        if (state.textContent === 'RUNNING · go.run(instance)') {
          status('STILL RUNNING AFTER 5s · NO JS CRASH');
          pin('MILESTONE', 'Still executing 5s after go.run() with no JS-level exception');
        }
      }, 5000);
    } catch (e) {
      const msg = 'I29 BOOT ERROR · ' + ((e && e.stack) || e);
      log(msg); pin('CRASH', msg); status('FAILED · SEE TRACE');
    }
  }

  copyBtn.addEventListener('click', async () => {
    const pinnedText = pinned.length ? pinned.join('\n') : 'none captured yet';
    const text = 'MOBMUGEN · IKEMEN · RIG I29 INPUT WATCHDOG\n' +
      'RUNTIME STATUS · ' + state.textContent + '\n' +
      'PAGE · ' + location.href + '\n' +
      'USER AGENT · ' + navigator.userAgent + '\n\n' +
      'PINNED (captured once)\n' + pinnedText + '\n\n' +
      'TRACE (most recent, may have rotated past earlier events)\n' + lines.join('\n') + '\n';
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'COPIED';
      setTimeout(() => (copyBtn.textContent = 'COPY TRACE'), 1500);
    } catch (_) {
      let ta = document.getElementById('traceFallback');
      if (!ta) {
        ta = document.createElement('textarea');
        ta.id = 'traceFallback';
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;left:10px;right:10px;bottom:62px;z-index:30;height:42vh;background:#05070c;color:#eef4ff;border:1px solid #7a6227;border-radius:12px;padding:10px;font:10px ui-monospace;white-space:pre-wrap';
        document.body.appendChild(ta);
      }
      ta.value = text; ta.classList.remove('hide'); ta.focus(); ta.select();
      copyBtn.textContent = 'SELECT TRACE';
      setTimeout(() => (copyBtn.textContent = 'COPY TRACE'), 2500);
    }
  });

  // ---------------------------------------------------------------------
  // Touch controls -- same dispatch pattern already proven on the
  // BoxedWine lane (rig-f10-8.js): real KeyboardEvent objects fired at
  // canvas/document/window. Ikemen's own system_js.go listens via
  // document.addEventListener('keydown'/'keyup', ...) reading event.code,
  // so no engine-specific bridge is needed -- the same mechanism that
  // already worked there works here. Key codes below match this engine's
  // own default config (src/resources/defaultConfig.ini): arrows for
  // movement, Z/X/C and A/S/D for the six attack buttons, Enter for start.
  // ---------------------------------------------------------------------
  const keyMeta = {
    ArrowUp: [38, 'ArrowUp'], ArrowDown: [40, 'ArrowDown'], ArrowLeft: [37, 'ArrowLeft'], ArrowRight: [39, 'ArrowRight'],
    KeyA: [65, 'a'], KeyS: [83, 's'], KeyD: [68, 'd'], KeyZ: [90, 'z'], KeyX: [88, 'x'], KeyC: [67, 'c'],
    Enter: [13, 'Enter'], Escape: [27, 'Escape'],
  };
  function emitKey(code, key, down) {
    const m = keyMeta[code] || [0, key || ''];
    const type = down ? 'keydown' : 'keyup';
    const opts = { key: key || m[1], code, keyCode: m[0], which: m[0], bubbles: true, cancelable: true };
    canvas.focus();
    for (const target of [canvas, document, window]) {
      try {
        const ev = new KeyboardEvent(type, opts);
        try {
          Object.defineProperty(ev, 'keyCode', { get: () => m[0] });
          Object.defineProperty(ev, 'which', { get: () => m[0] });
        } catch (_) {}
        target.dispatchEvent(ev);
      } catch (_) {}
    }
  }
  const keyHolders = new Map();
  const activeControlButtons = new Set();
  let ctrlLogged = 0;
  const CTRL_LOG_MAX = 240;
  function ctrlLog(msg) {
    if (ctrlLogged > CTRL_LOG_MAX) return;
    ctrlLogged++;
    if (ctrlLogged > CTRL_LOG_MAX) { log('I29 CTRL · control logging capped to protect the trace'); return; }
    log('I29 CTRL · ' + msg);
  }
  function heldNow() { return keyHolders.size ? [...keyHolders.keys()].join(' ') : 'none'; }
  function controlKey(k, el, down) {
    const code = k[0];
    let holders = keyHolders.get(code);
    if (down) {
      if (!holders) { holders = new Set(); keyHolders.set(code, holders); }
      const wasEmpty = holders.size === 0;
      holders.add(el);
      if (wasEmpty) emitKey(k[0], k[1], true);
    } else {
      if (!holders) return;
      holders.delete(el);
      if (holders.size === 0) { keyHolders.delete(code); emitKey(k[0], k[1], false); }
    }
    ctrlLog((down ? 'keydown ' : 'keyup   ') + code + ' [' + (el && (el.dataset.k || el.dataset.macro) || '?') + '] -> engine | held: ' + heldNow());
  }
  const dpadResetHooks = [];
  function releaseAllControlKeys(reason) {
    if (!keyHolders.size && !activeControlButtons.size) return;
    const codes = [...keyHolders.entries()].reverse();
    keyHolders.clear();
    activeControlButtons.forEach(btn => btn.classList && btn.classList.remove('on'));
    activeControlButtons.clear();
    dpadResetHooks.forEach(fn => fn());
    codes.forEach(([code]) => emitKey(code, (keyMeta[code] || [0, ''])[1], false));
    log('I29 CONTROLS · released ' + codes.length + ' stuck key(s)' + (reason ? ' after ' + reason : ''));
  }
  window.addEventListener('blur', () => releaseAllControlKeys('window blur'));
  window.addEventListener('pagehide', () => releaseAllControlKeys('pagehide'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAllControlKeys('visibility hidden'); });
  function pickerOpen() {
    const section = document.getElementById('charPickerSection');
    if (!section || section.classList.contains('hide')) return false;
    return section.offsetParent !== null;
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
      log('I29 PICKER · touch committed ' + (target.dataset.mode || '?') + ' #' + (target.dataset.idx || '?'));
    } else {
      log('I29 PICKER · touch clicked ' + (target.id || target.tagName));
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
    const release = reason => {
      if (!held) return;
      held = false;
      el.classList.remove('on');
      activeControlButtons.delete(el);
      [...codes].reverse().forEach(k => controlKey(k, el, false));
      ctrlLog('release via ' + reason + ' | held: ' + heldNow());
    };
    const dn = e => {
      e.preventDefault();
      if (held) release('new pointerdown');
      held = true;
      el.classList.add('on');
      const toPicker = pickerOpen();
      ctrlLog('press ' + (codes[0] ? codes[0][0] : '?') + ' routed to ' + (toPicker ? 'PICKER' : 'engine'));
      if (toPicker) {
        handlePickerControl(codes);
        held = false;
        el.classList.remove('on');
        return;
      }
      activeControlButtons.add(el);
      try { if (e.pointerId !== undefined && el.setPointerCapture) el.setPointerCapture(e.pointerId); } catch (_) {}
      codes.forEach(k => controlKey(k, el, true));
    };
    const up = e => { e.preventDefault(); release('pointerup'); };
    el.addEventListener('pointerdown', dn);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', e => { if (held) up(e); });
    el.addEventListener('lostpointercapture', () => release('lostpointercapture'));
  }
  let actionPulseSeq = 0;
  function bindActionPulse(el, k) {
    let active = false, timer = null, seq = 0;
    const finish = reason => {
      if (!active) return;
      active = false;
      if (timer) { clearTimeout(timer); timer = null; }
      el.classList.remove('on');
      activeControlButtons.delete(el);
      controlKey(k, el, false);
      ctrlLog('ACTION #' + seq + ' UP ' + k[0] + ' via ' + reason + ' | held: ' + heldNow());
    };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      const toPicker = pickerOpen();
      if (toPicker) { handlePickerControl([k]); return; }
      if (active) finish('preflight');
      seq = ++actionPulseSeq;
      active = true;
      el.classList.add('on');
      activeControlButtons.add(el);
      ctrlLog('ACTION #' + seq + ' DOWN ' + k[0] + ' | held before: ' + heldNow());
      controlKey(k, el, true);
      timer = setTimeout(() => finish('75ms watchdog'), 75);
    });
    el.addEventListener('pointerup', e => { e.preventDefault(); });
    el.addEventListener('pointercancel', e => { e.preventDefault(); });
    el.addEventListener('lostpointercapture', () => {});
  }
  function bindDpadGroup(dpadEl, macros) {
    const state = new Map();
    function codesFor(el) {
      if (el.dataset.k) return [[el.dataset.k, el.dataset.key]];
      if (el.dataset.macro) return macros[el.dataset.macro] || [];
      return [];
    }
    function isDpadTarget(el) {
      return !!(el && el.classList && el.classList.contains('dir') && !el.classList.contains('center') &&
        (el.dataset.k || el.dataset.macro) && el.closest('.dpad') === dpadEl);
    }
    function pressAt(el) {
      const codes = codesFor(el);
      el.classList.add('on');
      activeControlButtons.add(el);
      const toPicker = pickerOpen();
      ctrlLog('press ' + (codes[0] ? codes[0][0] : '?') + ' routed to ' + (toPicker ? 'PICKER' : 'engine'));
      if (toPicker) {
        handlePickerControl(codes);
        el.classList.remove('on');
        activeControlButtons.delete(el);
        return null;
      }
      codes.forEach(k => controlKey(k, el, true));
      return { el, codes };
    }
    function releaseEntry(entry, reason) {
      if (!entry) return;
      entry.el.classList.remove('on');
      activeControlButtons.delete(entry.el);
      [...entry.codes].reverse().forEach(k => controlKey(k, entry.el, false));
      ctrlLog('release via ' + reason + ' | held: ' + heldNow());
    }
    function endPointer(pointerId, reason) {
      const entry = state.get(pointerId);
      if (!entry) return;
      releaseEntry(entry, reason);
      state.delete(pointerId);
    }
    dpadResetHooks.push(() => state.clear());
    dpadEl.querySelectorAll('.dir[data-k], .dir[data-macro]').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        endPointer(e.pointerId, 'new pointerdown same pointer');
        try { if (el.setPointerCapture) el.setPointerCapture(e.pointerId); } catch (_) {}
        const entry = pressAt(el);
        if (entry) state.set(e.pointerId, entry);
      });
    });
    dpadEl.addEventListener('pointermove', e => {
      const entry = state.get(e.pointerId);
      if (!entry) return;
      const under = document.elementFromPoint(e.clientX, e.clientY);
      if (under === entry.el) return;
      if (isDpadTarget(under)) {
        ctrlLog('roll ' + (entry.codes[0] ? entry.codes[0][0] : '?') + ' -> ' + (under.dataset.k || under.dataset.macro));
        releaseEntry(entry, 'roll');
        const next = pressAt(under);
        if (next) state.set(e.pointerId, next); else state.delete(e.pointerId);
      } else if (!under || under.closest('.dpad') !== dpadEl) {
        releaseEntry(entry, 'rolled off pad');
        state.delete(e.pointerId);
      }
    });
    dpadEl.addEventListener('pointerup', e => { e.preventDefault(); endPointer(e.pointerId, 'pointerup'); });
    dpadEl.addEventListener('pointercancel', e => endPointer(e.pointerId, 'pointercancel'));
    dpadEl.addEventListener('lostpointercapture', e => endPointer(e.pointerId, 'lostpointercapture'));
  }
  document.querySelectorAll('#controls [data-k]').forEach(el => {
    if (el.closest('.dpad')) return;
    const pair = [el.dataset.k, el.dataset.key];
    if (el.closest('.acts')) bindActionPulse(el, pair);
    else bindPress(el, [pair]);
  });
  const macros = {
    UL: [['ArrowUp', 'ArrowUp'], ['ArrowLeft', 'ArrowLeft']], UR: [['ArrowUp', 'ArrowUp'], ['ArrowRight', 'ArrowRight']],
    DL: [['ArrowDown', 'ArrowDown'], ['ArrowLeft', 'ArrowLeft']], DR: [['ArrowDown', 'ArrowDown'], ['ArrowRight', 'ArrowRight']],
  };
  document.querySelectorAll('.dpad').forEach(el => bindDpadGroup(el, macros));

  function setControlsHidden(h) { controls.classList.toggle('hidden', h); ctrlToggle.textContent = h ? 'SHOW CTRL' : 'HIDE CTRL'; fitStage(); }
  ctrlToggle.addEventListener('click', () => setControlsHidden(!controls.classList.contains('hidden')));
  function setDebugHidden(h) {
    diagWrap.classList.toggle('hidden', h);
    debugToggle.textContent = h ? 'SHOW DEBUG' : 'HIDE DEBUG';
    diagInlineToggle.textContent = h ? 'EXPAND' : 'COLLAPSE';
    fitStage();
  }
  debugToggle.addEventListener('click', () => setDebugHidden(!diagWrap.classList.contains('hidden')));
  diagInlineToggle.addEventListener('click', () => setDebugHidden(!diagWrap.classList.contains('hidden')));

  // -------------------------------------------------------------------
  // Stage sizing: fit the GAMEPLAY VIEWPORT to the canvas's real aspect
  // ratio and let it grow to whatever the screen actually has room for,
  // instead of the old flat vh-based min/max-height. A flat vh guess is
  // wrong for every aspect ratio except the one it happened to be tuned
  // for -- it either leaves letterbox dead space (guess too tall) or
  // clips/crams the canvas (guess too short). canvas.width/canvas.height
  // are set by the Go/Ebiten WASM runtime once it boots, not by us, and
  // it fires no event when it does -- so this polls rather than trying
  // to hook a call site this codebase doesn't own.
  // -------------------------------------------------------------------
  const DEFAULT_AR = 16 / 9; // matches every real canvas size seen from this
                             // engine so far (1280x720); used only before it
                             // has set a real canvas size of its own
  let lastFitKey = '';
  function fitStage() {
    const cw = canvas.width, ch = canvas.height;
    // 300x150 is the browser's own default canvas size, present before
    // the engine has ever touched it -- not a real resolution to fit to.
    const hasRealSize = cw > 0 && ch > 0 && !(cw === 300 && ch === 150);
    const ar = hasRealSize ? cw / ch : DEFAULT_AR;

    const availW = stageBox.parentElement.clientWidth;
    const stageTop = stageBox.getBoundingClientRect().top;
    const controlsH = controls.classList.contains('hidden') ? 0 : controls.getBoundingClientRect().height + 8;
    const diagH = diagWrap.classList.contains('hidden') ? 0 : diagWrap.getBoundingClientRect().height + 8;
    const statusEl = document.querySelector('.statusline');
    const diagHeadEl = document.querySelector('.diag-head');
    const chromeBelow = (statusEl ? statusEl.getBoundingClientRect().height : 0) +
      (diagHeadEl ? diagHeadEl.getBoundingClientRect().height : 0) + controlsH + diagH + 24;
    const availH = Math.max(160, window.innerHeight - stageTop - chromeBelow);

    const key = availW + 'x' + Math.round(availH) + '@' + ar.toFixed(4);
    if (key === lastFitKey) return;
    lastFitKey = key;

    let w, h;
    if (availW / ar <= availH) { w = availW; h = availW / ar; }
    else { h = availH; w = availH * ar; }
    stageBox.style.width = Math.round(w) + 'px';
    stageBox.style.height = Math.round(h) + 'px';
  }
  fitStage();
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', () => setTimeout(fitStage, 50));
  // No DOM event exists for the engine setting canvas.width/height, so
  // poll -- fitStage() itself is a cheap no-op once nothing has changed.
  setInterval(fitStage, 300);

  // D-pad navigation for the character picker. The touch controller's
  // arrows and the six action buttons already dispatch real KeyboardEvents
  // (emitKey, below) aimed at the engine -- while the picker is open the
  // engine isn't running yet, so the same events drive the grid instead.
  // A real gamepad's d-pad reaches this the same way once the browser maps
  // it, and a physical keyboard works unchanged.
  const COMMIT_KEYS = new Set(['Enter', ' ', 'z', 'x', 'c', 'a', 's', 'd']);

  // CSS grid uses auto-fill, so the column count depends on the rendered
  // width -- it is not derivable from the item count. Read what the
  // browser actually laid out.
  function gridColumnCount(grid) {
    const tracks = getComputedStyle(grid).gridTemplateColumns;
    const n = tracks && tracks !== 'none' ? tracks.trim().split(/\s+/).length : 1;
    return Math.max(1, n);
  }

  document.addEventListener('keydown', e => {
    const section = document.getElementById('charPickerSection');
    if (!section || section.classList.contains('hide')) return;

    const focused = document.activeElement;
    if (!focused || !focused.classList.contains('roster-item')) return;

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (COMMIT_KEYS.has(key)) {
      // Enter/Space already activate a focused <button> natively; the
      // attack keys do not, so route those through the same click path.
      if (key !== 'Enter' && key !== ' ') { e.preventDefault(); focused.click(); }
      return;
    }

    const grid = focused.parentElement;
    const items = [...grid.querySelectorAll('.roster-item')];
    const idx = items.indexOf(focused);
    if (idx < 0) return;
    const cols = gridColumnCount(grid);

    let next = idx;
    if (e.key === 'ArrowRight') next = Math.min(idx + 1, items.length - 1);
    else if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0);
    else if (e.key === 'ArrowDown') next = Math.min(idx + cols, items.length - 1);
    else if (e.key === 'ArrowUp') next = Math.max(idx - cols, 0);
    else return;

    e.preventDefault();
    if (next !== idx) {
      items[next].focus();
      // .focus() alone doesn't reliably auto-scroll an overflow:auto
      // container on iOS Safari for a synthetic (non-native-tab) focus
      // call -- confirmed by testing, not assumed. block:'nearest' keeps
      // horizontal position untouched and only scrolls the axis needed.
      items[next].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });

  // Landscape usually means a Bluetooth/USB controller is in hand (the
  // engine already polls navigator.getGamepads() every frame on its own --
  // no code needed there), so the touch D-pad is just dead weight blocking
  // the view. Auto-hide it on rotation to landscape, auto-show back in
  // portrait. HIDE/SHOW CTRL still works as a manual override in either
  // orientation on top of this.
  const landscapeMq = window.matchMedia('(orientation: landscape)');
  function applyOrientation(isLandscape) { setControlsHidden(isLandscape); }
  applyOrientation(landscapeMq.matches);
  landscapeMq.addEventListener('change', e => applyOrientation(e.matches));

  // Try to load stored zip on page load
  autoLoadStoredZip();

  log('I29 READY · COLLAPSED STATIC BUILD -- this file is the direct, non-wrapper materialization of the prior wrapper rig\'s real runtime output (no fetch+patch step; captured mechanically from that rig\'s own tested code path, not hand-rewritten): INPUT WATCHDOG (fixed 75ms action pulses with forced key-up, action sequence tracing), LEAN BOOT (defers engine-config files at or above 4MB out of the eager load), QUIET STAGES (trims [ExtraStages] to the picked stage as well as [Characters]), KINEZA (merges repo-hosted character packs into the VFS over HTTP), and SELECT.DEF TRIM (rewrites select.def to only the two picked characters right before boot), on top of I13/I14/I15/I16/I17/I18/I19 fixes');
})();
