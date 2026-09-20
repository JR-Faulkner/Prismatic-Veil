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
  // Screen Wake Lock: once a match actually starts, keep the display
  // from dimming/locking just because the player's fingers are on the
  // touch controller rather than tapping the screen surface directly --
  // WebKit doesn't count controller taps as the kind of activity that
  // resets the idle timer the way native app input does. Requested only
  // at match start (not before, so the setup/picker screen doesn't hold
  // the display awake for no reason), and the OS releases the lock
  // automatically whenever the tab is backgrounded -- re-request it on
  // return to foreground if a match is still the reason we wanted it.
  // Unsupported browsers (no navigator.wakeLock) just silently no-op.
  // -------------------------------------------------------------------
  let wakeLock = null;
  let wakeLockWanted = false;
  async function requestWakeLock() {
    wakeLockWanted = true;
    if (!('wakeLock' in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      log('I3 WAKE LOCK · acquired -- screen will stay on for the match');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) {
      log('I3 WAKE LOCK · request failed (' + ((e && e.message) || e) + ') -- continuing without it');
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wakeLockWanted && !wakeLock) requestWakeLock();
  });

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
      log('I3 QUOTA · ' + label + ' · using ' + mb(est.usage || 0) + ' of ' + mb(est.quota || 0) + ' available');
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
      log('I3 STORAGE · persistent storage ' + (granted ? 'granted' : 'not granted (browser may evict under disk pressure)'));
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
        log('I3 STORAGE · zip too large for this origin\'s storage quota -- running without persistence, ' +
          'you\'ll need to pick the zip again next visit');
        await reportQuota('at quota failure');
      } else {
        log('I3 STORAGE · could not persist zip (' + name + ') -- running without persistence');
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
  // A crash/failure leaves the WASM instance dead -- there is no real
  // "un-crash" transition back to running, so the only actual recovery
  // is a full page reload. Shown once, over the canvas, so a real crash
  // has a visible affordance beyond the pill/frame quietly tinting red.
  let crashOverlayShown = false;
  function showCrashOverlay(reason) {
    if (crashOverlayShown) return;
    const stageEl = document.querySelector('.stage');
    if (!stageEl) return;
    crashOverlayShown = true;
    const el = document.createElement('div');
    el.className = 'crash-overlay';
    const title = document.createElement('div');
    title.className = 'crash-title';
    title.textContent = 'SOMETHING WENT WRONG';
    const detail = document.createElement('div');
    detail.className = 'crash-detail';
    detail.textContent = reason ? String(reason).slice(0, 220) : 'The fight engine stopped unexpectedly.';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'crash-reload-btn';
    btn.textContent = 'RELOAD & TRY AGAIN';
    btn.addEventListener('click', () => location.reload());
    el.append(title, detail, btn);
    stageEl.appendChild(el);
  }
  function status(s) {
    state.textContent = s;
    const cls = classifyStatus(s);
    if (pill) { pill.textContent = s; pill.dataset.state = cls; }
    document.body.dataset.runtimeState = cls;
    if (prepDiag) prepDiag.textContent = s;
    if (cls === 'error') showCrashOverlay(s);
  }
  function log(s) {
    s = String(s);
    lines.push(s);
    if (lines.length > 700) lines.shift();
    diag.textContent = lines.join('\n');
    diag.scrollTop = diag.scrollHeight;
  }
  function pin(tag, s) {
    if (pinned.length < 60) pinned.push('I3 ' + tag + ' · ' + String(s).slice(0, 1400));
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
  async function lazyMaterialize(path) {
    if (vfsFiles.has(path) || vfsDirs.has(path)) return true;
    let key = zipIndex.has(path) ? path : zipIndexLower.get(path.toLowerCase());
    if (!key) return false;
    const ent = zipIndex.get(key);
    const raw = await entryRaw(currentZipFile, ent);
    vfsPutFile(key, raw);
    zipIndex.delete(key);
    zipIndexLower.delete(key.toLowerCase());
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
  function vfsPutFile(path, data) {
    path = normPath(path);
    vfsFiles.set(path, { data, dir: false, mtimeMs: Date.now() });
    vfsFilesLower.set(path.toLowerCase(), path);
    ensureParentDirs(path);
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

  log('I3 VFS ARMED · in-memory filesystem installed before wasm_exec.js loads');

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

  async function loadRuntimeAssets() {
    if (runtimeAssetsLoaded) return;
    status('LOADING ENGINE RUNTIME ASSETS');
    log('I3 RUNTIME ASSETS · fetching ikemen-runtime-assets.zip (engine\'s own data/font/external -- required regardless of game content, per RIG I2\'s first probe hitting "open external/script/main.lua")');
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
    log('I3 RUNTIME ASSETS LOADED · ' + n + ' engine files into VFS (data/, font/, external/)');
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
  function isEagerBootstrap(lowerRelPath) {
    if (lowerRelPath === 'winmugen.exe') return true;
    if (!lowerRelPath.includes('/') && /\.(dll|ini|cfg|dat|txt)$/i.test(lowerRelPath)) return true;
    return lowerRelPath.startsWith('data/') || lowerRelPath.startsWith('font/') || lowerRelPath.startsWith('plugins/');
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

  async function loadZipIntoVfs(file) {
    status('READING ZIP');
    log('I3 ZIP · reading central directory of ' + file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB)');
    currentZipFile = file;
    const entries = await listZipEntries(file);
    log('I3 ZIP · ' + entries.length + ' entries found');
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
    if (prefix) log('I3 ZIP · stripping common wrapper folder "' + prefix + '" so chars/data/stages land at VFS root');

    let eagerCount = 0, indexedCount = 0;
    for (const ent of realEntries) {
      if (prefix && !ent.name.startsWith(prefix)) continue;
      const stripped = prefix ? ent.name.slice(prefix.length) : ent.name;
      const lower = stripped.toLowerCase();
      if (isEagerBootstrap(lower)) {
        const raw = await entryRaw(file, ent);
        vfsPutFile(stripped, raw);
        if (lower.endsWith('/system.def') || lower === 'system.def') motifPath = stripped;
        eagerCount++;
        if (eagerCount % 20 === 0) status('LOADING ' + eagerCount);
      } else {
        zipIndex.set(stripped, ent);
        zipIndexLower.set(lower, stripped);
        indexedCount++;
      }
    }
    log('I3 ZIP · ' + eagerCount + ' engine-config files loaded now, ' + indexedCount +
      ' roster files (chars/stages/sound) indexed for on-demand loading -- not read yet');

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
      log('I3 ROSTER · select.def parsed: ' + parsed.chars.length + ' character lines, ' + parsed.stages.length +
        ' extra-stage lines -- found ' + allChars.length + ' resolvable characters, ' + allStages.length + ' stages');
      const shown = allChars.slice(0, 60);
      const rosterMsg = 'I3 ROSTER · ' + allChars.length + ' playable names found: ' +
        shown.join(', ') + (allChars.length > shown.length ? ' ... (+' + (allChars.length - shown.length) + ' more)' : '');
      log(rosterMsg);
      pin('ROSTER', rosterMsg);
    } else {
      log('I3 ROSTER · no select.def found -- scanning for all resolvable characters/stages');
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

    log('I3 DETECTED · motif=' + (motifPath || '(none found)') + ' stage=' + (stagePath || '(none found)') + ' chars=' + JSON.stringify(charNames));
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
            log('I3 STORAGE · zip saved for next visit (' + file.name + ', hash ' + zipHash + ') -- ' +
              'reloading this page will skip the file picker');
            pin('STORAGE', 'zip persisted: ' + file.name);
            await reportQuota('after save');
          }
        }
      }
    } catch (e) {
      const msg = 'I3 ZIP ERROR · ' + ((e && e.stack) || e);
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
    log('I3 PICKER · ' + allChars.length + ' characters / ' + allStages.length + ' stages offered');
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
    // Scope the highlight swap to THIS grid. Clearing .selected across all
    // three grids would wipe the other two rows' marks every time one of
    // them changed, leaving only the most recent pick visibly chosen.
    const grid = document.getElementById(GRID_IDS[mode]);
    grid.querySelectorAll('.roster-item.selected').forEach(el => el.classList.remove('selected'));
    const chosen = grid.querySelector('.roster-item[data-idx="' + idx + '"]');
    if (chosen) chosen.classList.add('selected');
    updateSelectionDisplay();
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
  }

  function startMatch() {
    const p1 = allChars[pickerState.p1Idx];
    const p2 = allChars[pickerState.p2Idx];
    if (!p1) { log('I3 PICKER · no character selected -- nothing to start'); return; }
    charNames[0] = p1;
    charNames[1] = p2 || p1;
    const stageName = allStages[pickerState.stageIdx];
    if (stageName) stagePath = findStageDefKey(stageName) || stagePath;
    log('I3 PICKER · starting match: P1=' + charNames[0] + ' P2=' + charNames[1] +
      ' stage=' + (stagePath || '(engine default)'));
    pin('PICKED', 'P1=' + charNames[0] + ' P2=' + charNames[1] + ' stage=' + stagePath);
    document.getElementById('setup').classList.add('hide');
    requestWakeLock();
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
    log('I3 PICKER · cleared saved zip -- pick a new one');
  }

  // On page load, check whether a previously-picked zip is still in
  // IndexedDB and reuse it instead of making the user find the file again.
  async function autoLoadStoredZip() {
    try {
      await initDB();
      const recs = await listStoredZips();
      if (!recs.length) {
        log('I3 STORAGE · no saved zip yet -- pick one and it\'ll be remembered for next time');
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
        log('I3 STORAGE · saved zip "' + (rec.filename || '?') + '" is no longer readable ' +
          '(evicted by the browser) -- clearing it, please pick the zip again');
        await clearAllStoredZips();
        status('WAITING FOR ZIP');
        return;
      }

      log('I3 STORAGE · reusing saved zip: ' + rec.filename + ' (' + (rec.file.size / 1048576).toFixed(1) + ' MB) -- no re-upload needed');
      pin('STORAGE', 'reused saved zip: ' + rec.filename);
      status('LOADING SAVED ZIP');
      await loadAndShowPicker(rec.file, true);
      return;
    } catch (e) {
      log('I3 STORAGE · IndexedDB unavailable (' + ((e && e.message) || e) + ') -- falling back to file picker');
    }
    status('WAITING FOR ZIP');
  }

  async function boot() {
    if (started) return;
    started = true;
    try {
      status('LOADING GO RUNTIME');
      log('I3 WRAPPER · loaded rig-ikemen-2 · VFS + CLI quick-match boot probe');
      log('I3 USER AGENT · ' + navigator.userAgent);

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
      log('I3 ARGV · ' + JSON.stringify(argv));
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
      log('I3 WASM INSTANTIATED · module compiled and linked successfully');
      pin('MILESTONE', 'WASM module instantiated with real VFS installed');
      setup.classList.add('hide');

      status('RUNNING · go.run(instance)');
      const runPromise = go.run(result.instance);
      runPromise.then(() => {
        log('I3 GO.RUN RETURNED · the Go program exited');
        pin('MILESTONE', 'go.run() resolved -- Go program exited, no JS-level crash');
        status('EXITED · SEE TRACE');
      }).catch(e => {
        const msg = 'I3 GO.RUN THREW · ' + ((e && e.stack) || e);
        log(msg); pin('CRASH', msg); status('CRASHED · SEE TRACE');
      });

      setTimeout(() => {
        if (state.textContent === 'RUNNING · go.run(instance)') {
          status('STILL RUNNING AFTER 5s · NO JS CRASH');
          pin('MILESTONE', 'Still executing 5s after go.run() with no JS-level exception');
        }
      }, 5000);
    } catch (e) {
      const msg = 'I3 BOOT ERROR · ' + ((e && e.stack) || e);
      log(msg); pin('CRASH', msg); status('FAILED · SEE TRACE');
    }
  }

  copyBtn.addEventListener('click', async () => {
    const pinnedText = pinned.length ? pinned.join('\n') : 'none captured yet';
    const text = 'MOBMUGEN · IKEMEN · RIG I3 PLAYABLE\n' +
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
  function bindPress(el, codes) {
    let held = false;
    const dn = e => { e.preventDefault(); if (held) return; held = true; el.classList.add('on'); codes.forEach(k => emitKey(k[0], k[1], true)); };
    const up = e => { e.preventDefault(); if (!held) return; held = false; el.classList.remove('on'); [...codes].reverse().forEach(k => emitKey(k[0], k[1], false)); };
    el.addEventListener('pointerdown', dn);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', e => { if (held) up(e); });
  }
  document.querySelectorAll('#controls [data-k]').forEach(el => bindPress(el, [[el.dataset.k, el.dataset.key]]));
  const macros = {
    UL: [['ArrowUp', 'ArrowUp'], ['ArrowLeft', 'ArrowLeft']], UR: [['ArrowUp', 'ArrowUp'], ['ArrowRight', 'ArrowRight']],
    DL: [['ArrowDown', 'ArrowDown'], ['ArrowLeft', 'ArrowLeft']], DR: [['ArrowDown', 'ArrowDown'], ['ArrowRight', 'ArrowRight']],
  };
  document.querySelectorAll('#controls [data-macro]').forEach(el => bindPress(el, macros[el.dataset.macro] || []));

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

  log('I3 READY · waiting for zip (checking storage)');
})();
