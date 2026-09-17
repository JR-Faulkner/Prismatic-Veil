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

  function status(s) { state.textContent = s; if (pill) pill.textContent = s; if (prepDiag) prepDiag.textContent = s; }
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
      const method = u16(cv, p + 10), comp = u32(cv, p + 20), uncomp = u32(cv, p + 24),
        fn = u16(cv, p + 28), ex = u16(cv, p + 30), cm = u16(cv, p + 32), local = u32(cv, p + 42),
        name = dec.decode(new Uint8Array(cb, p + 46, fn));
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

    // Discover the real roster from select.def instead of assuming two
    // hardcoded names.
    charNames.length = 0;
    const selectRec = vfsFiles.get(motifPath ? motifPath.replace(/system\.def$/i, 'select.def') : 'data/select.def');
    if (selectRec) {
      const text = decoder.decode(selectRec.data);
      const parsed = parseSelectDef(text);
      for (const name of parsed.chars) {
        if (charNames.length >= 2) break;
        if (findCharDefKey(name) && !charNames.includes(name)) charNames.push(name);
      }
      for (const name of parsed.stages) {
        const key = findStageDefKey(name);
        if (key) { stagePath = key; break; }
      }
      log('I3 ROSTER · select.def parsed: ' + parsed.chars.length + ' character lines, ' + parsed.stages.length +
        ' extra-stage lines -- picked ' + JSON.stringify(charNames) + ' (first two that actually resolve)');
    } else {
      log('I3 ROSTER · no select.def found at the expected path -- falling back to scanning for any playable character/stage');
    }
    // Fall back to just scanning the index for *something* playable if
    // select.def didn't get us a full pair (e.g. it lists names we
    // couldn't resolve, or wasn't found at all).
    if (charNames.length < 2) {
      for (const key of zipIndexLower.keys()) {
        const m = key.match(/^chars\/([^\/]+)\/([^\/]+)\.def$/);
        if (m && m[1] === m[2] && !charNames.includes(m[1])) {
          charNames.push(m[1]);
          if (charNames.length >= 2) break;
        }
      }
    }
    if (!stagePath) {
      for (const key of zipIndexLower.keys()) {
        if (/^stages\/[^\/]+\.def$/.test(key)) { stagePath = zipIndexLower.get(key); break; }
      }
    }

    log('I3 DETECTED · motif=' + (motifPath || '(none found)') + ' stage=' + (stagePath || '(none found)') + ' chars=' + JSON.stringify(charNames));
    pin('DETECTED', 'motif=' + motifPath + ' stage=' + stagePath + ' chars=' + JSON.stringify(charNames));
    zipLoaded = true;
    status('ZIP LOADED · STARTING ENGINE');
  }

  zipInput.addEventListener('change', async () => {
    const f = zipInput.files && zipInput.files[0];
    if (!f) return;
    try {
      status('LOADING UNZIP LIB');
      await ensureFflate();
      await loadRuntimeAssets();
      await loadZipIntoVfs(f);
      await boot();
    } catch (e) {
      const msg = 'I3 ZIP ERROR · ' + ((e && e.stack) || e);
      log(msg); pin('CRASH', msg); status('FAILED · SEE TRACE');
    }
  });

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

  function setControlsHidden(h) { controls.classList.toggle('hidden', h); ctrlToggle.textContent = h ? 'SHOW CTRL' : 'HIDE CTRL'; }
  ctrlToggle.addEventListener('click', () => setControlsHidden(!controls.classList.contains('hidden')));
  function setDebugHidden(h) { diagWrap.classList.toggle('hidden', h); debugToggle.textContent = h ? 'SHOW DEBUG' : 'HIDE DEBUG'; }
  debugToggle.addEventListener('click', () => setDebugHidden(!diagWrap.classList.contains('hidden')));
  diagInlineToggle.addEventListener('click', () => setDebugHidden(!diagWrap.classList.contains('hidden')));

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

  log('I3 READY · tap CHOOSE MUGEN ZIP');
})();
