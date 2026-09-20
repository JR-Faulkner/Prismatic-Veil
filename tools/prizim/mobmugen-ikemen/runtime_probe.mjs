import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mirrors tools/prizim/mobmugen/runtime_probe.mjs's role for the
// BoxedWine lane: load the ACTUAL current page, feed it a tiny synthetic
// fixture (not a stand-in for a real ~1.7GB install -- see the note this
// lane's own docs and PriZim's BoxedWine doc both make: real WinMUGEN
// content and real iPhone Safari/WebKit memory pressure remain the phone
// witness's job, not this probe's), and assert on the same behaviors
// this lane's ad-hoc scratchpad Playwright scripts have been proving by
// hand across I13-I17: routing, the two control-layer fixes, and the
// load-gate overlay's settle behavior.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const MUGEN_LAB = path.join(ROOT, 'mugen-lab');

const base = process.env.PZ_BASE_URL || 'http://127.0.0.1:8000';
const fixture = process.env.PZ_FIXTURE || path.join(__dirname, 'fixtures', 'prizim_ikemen_fixture.zip');

function findCurrentProbePage() {
  const files = fs.readdirSync(MUGEN_LAB);
  const beauty = files
    .map(f => {
      const m = f.match(/^rig-ikemen-(\d+)-beauty-v(\d+)\.html$/);
      return m ? { file:f, rig:parseInt(m[1],10), beauty:parseInt(m[2],10) } : null;
    })
    .filter(Boolean)
    .sort((a,b) => (b.beauty - a.beauty) || (b.rig - a.rig));
  if (beauty.length) return { ...beauty[0], label:'I' + beauty[0].rig + ' Beauty V' + beauty[0].beauty };

  const numeric = files
    .map(f => {
      const m = f.match(/^rig-ikemen-(\d+)\.html$/);
      return m ? { file:f, rig:parseInt(m[1],10), beauty:null } : null;
    })
    .filter(Boolean)
    .sort((a,b) => b.rig - a.rig);
  if (!numeric.length) throw new Error('no rig-ikemen page found under mugen-lab/');
  return { ...numeric[0], label:'I' + numeric[0].rig };
}

const probePage = findCurrentProbePage();
const rigNum = probePage.rig;
const pageUrl = `${base}/mugen-lab/${probePage.file}`;
console.log(`PriZim Ikemen probe targeting ${probePage.label}: ${pageUrl}`);

// PZ_CHROMIUM_PATH is for local/sandboxed runs against a pre-installed
// browser outside Playwright's own managed install (CI installs its own
// via `npx playwright install --with-deps chromium`, same as the
// BoxedWine lane's workflow, and leaves this unset).
const launchOpts = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] };
if (process.env.PZ_CHROMIUM_PATH) launchOpts.executablePath = process.env.PZ_CHROMIUM_PATH;
const browser = await chromium.launch(launchOpts);
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);

// The engine loads fflate from a CDN for zip decompression. PZ_FFLATE_PATH
// lets a sandboxed/offline runner serve a local copy instead; CI reaches
// the real CDN and leaves this unset.
if (process.env.PZ_FFLATE_PATH) {
  await page.route('**cdn.jsdelivr.net/**', r =>
    r.fulfill({ path: process.env.PZ_FFLATE_PATH, contentType: 'application/javascript' }));
}

const consoleLines = [];
const pageErrors = [];
page.on('console', msg => consoleLines.push(msg.text()));
page.on('pageerror', err => pageErrors.push(String(err)));

await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);

const bodyText0 = await page.evaluate(() => document.body.textContent);
if (/WRAPPER ERROR|FAILED · I\d+ WRAPPER/.test(bodyText0)) {
  throw new Error('page wrapper failed to boot: ' + bodyText0.slice(0, 400));
}

const [fc] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.click('#zipLabel'),
]);
await fc.setFiles(fixture);
await page.waitForSelector('#charPickerSection:not(.hide)', { timeout: 20000 });
await page.waitForTimeout(300);

let v24UiSounds = null;
if (probePage.beauty !== null && probePage.beauty >= 24) {
  v24UiSounds = await page.evaluate(() => ({
    state: document.body.dataset.uiSoundState || '',
    count: Number(document.body.dataset.uiSoundCount || 0),
    source: document.body.dataset.uiSoundSource || '',
    skin: document.getElementById('controls')?.dataset.skin || ''
  }));
  if (v24UiSounds.state !== 'ready' || v24UiSounds.count < 3) {
    throw new Error('V24 native motif UI sounds not ready: ' + JSON.stringify(v24UiSounds));
  }
  if (v24UiSounds.skin !== 'fighter-v24') {
    throw new Error('V24 controller skin marker missing');
  }
}

// Beautification witness: when the latest page is a beauty build, prove
// the repo-authority Kineza roster cell actually becomes an image.
let beautyRosterThumbnail = null;
if (probePage.beauty !== null) {
  const kinezaHandle = await page.evaluateHandle(() => {
    return [...document.querySelectorAll('#p1Grid .roster-item')]
      .find(el => (el.dataset.charName || '').toLowerCase() === 'kineza') || null;
  });
  const hasKineza = await kinezaHandle.evaluate(el => !!el);
  if (!hasKineza) throw new Error('beauty probe fixture does not expose a Kineza roster cell');
  await kinezaHandle.evaluate(el => el.scrollIntoView({ block:'nearest' }));
  await page.waitForFunction(() => {
    const el = [...document.querySelectorAll('#p1Grid .roster-item')]
      .find(x => (x.dataset.charName || '').toLowerCase() === 'kineza');
    if (!el) return false;
    const img = el.querySelector('.roster-thumb-img');
    return el.dataset.thumbState === 'ready' && !!img && img.naturalWidth > 0;
  }, { timeout: 5000 });
  beautyRosterThumbnail = await page.evaluate(() => {
    const el = [...document.querySelectorAll('#p1Grid .roster-item')]
      .find(x => (x.dataset.charName || '').toLowerCase() === 'kineza');
    const img = el && el.querySelector('.roster-thumb-img');
    return el ? {
      state: el.dataset.thumbState,
      naturalWidth: img ? img.naturalWidth : 0,
      naturalHeight: img ? img.naturalHeight : 0,
      src: img ? img.getAttribute('src') : ''
    } : null;
  });
}

let genericSff2RosterThumbnails = null;
if (probePage.beauty !== null && probePage.beauty >= 23) {
  const expected = [
    ['mole', 'rle5'],
    ['g.ken', 'rle8'],
    ['lz5dummy', 'lz5'],
  ];
  genericSff2RosterThumbnails = [];
  for (const [fighter, codec] of expected) {
    await page.evaluate(name => {
      const el = [...document.querySelectorAll('#p1Grid .roster-item')]
        .find(x => (x.dataset.charName || '').toLowerCase() === name);
      if (el) el.scrollIntoView({ block:'nearest' });
    }, fighter);
    await page.waitForFunction(name => {
      const el = [...document.querySelectorAll('#p1Grid .roster-item')]
        .find(x => (x.dataset.charName || '').toLowerCase() === name);
      if (!el) return false;
      const img = el.querySelector('.roster-thumb-img');
      return el.dataset.thumbState === 'ready' && !!img && img.naturalWidth === 24 && img.naturalHeight === 24;
    }, fighter, { timeout: 5000 });
    genericSff2RosterThumbnails.push(await page.evaluate(([name, kind]) => {
      const el = [...document.querySelectorAll('#p1Grid .roster-item')]
        .find(x => (x.dataset.charName || '').toLowerCase() === name);
      const img = el && el.querySelector('.roster-thumb-img');
      return el ? {
        fighter:name, codec:kind, state:el.dataset.thumbState,
        naturalWidth:img ? img.naturalWidth : 0,
        naturalHeight:img ? img.naturalHeight : 0,
        srcPrefix:img ? (img.getAttribute('src') || '').slice(0,32) : '',
        fallbackReason:el.dataset.thumbReason || ''
      } : null;
    }, [fighter, codec]));
  }
}

// --- drive P1's pick via touch, BEFORE any direct .click() -- focus
// starts on the first P1 roster-item, so an attack-key tap here commits
// it through pickerCommit()'s "touch committed" branch (a DIFFERENT
// function than selectItem(), which the direct .click()s below also
// exercise). A DIRECTION key alone never reaches pickerCommit() at all
// (handlePickerControl() only calls it for Enter/attack codes), so this
// has to be an attack tap, not a direction tap. This exact branch
// carried a stale 'I14 PICKER' string through I15 and I16 undetected,
// because doing the whole picker via direct .click()s (as this probe
// originally did) never exercises it -- selectItem()'s own focus-advance
// moves off the roster grids and onto START MATCH before any later touch
// input would land back on a roster-item target.
{
  const controlsWereHidden = await page.evaluate(() => document.getElementById('controls').classList.contains('hidden'));
  if (controlsWereHidden) await page.evaluate(() => document.getElementById('controls').classList.remove('hidden'));
  const attackBtn = await centerOf('#controls [data-k="KeyZ"]');
  await touch('touchStart', [{ x: attackBtn.x, y: attackBtn.y, id: 9 }]);
  await page.waitForTimeout(60);
  await touch('touchEnd', []);
  await page.waitForTimeout(150);
  if (controlsWereHidden) await page.evaluate(() => document.getElementById('controls').classList.add('hidden'));
}

// --- finish P2/stage via direct clicks (exercises selectItem()'s own
// log lines the normal way) and commit via a touch tap on START MATCH
// itself -- a non-roster-item target, covering pickerCommit()'s OTHER
// branch ("touch clicked") in the same run. ---
await page.evaluate(() => document.querySelectorAll('#p2Grid .roster-item')[1]?.click()
  || document.querySelectorAll('#p2Grid .roster-item')[0]?.click());
const stageCount = await page.evaluate(() => document.querySelectorAll('#stageGrid .roster-item').length);
if (stageCount > 0) await page.evaluate(() => document.querySelectorAll('#stageGrid .roster-item')[0].click());

{
  const controlsWereHidden = await page.evaluate(() => document.getElementById('controls').classList.contains('hidden'));
  if (controlsWereHidden) await page.evaluate(() => document.getElementById('controls').classList.remove('hidden'));
  const attackBtn = await centerOf('#controls [data-k="KeyZ"]');
  await touch('touchStart', [{ x: attackBtn.x, y: attackBtn.y, id: 11 }]);
  await page.waitForTimeout(60);
  await touch('touchEnd', []);
  await page.waitForTimeout(150);
  if (controlsWereHidden) await page.evaluate(() => document.getElementById('controls').classList.add('hidden'));
}

// Beauty builds intentionally gate FIGHT behind portrait -> landscape.
// Honor that contract before applying the base I29 "match started" checks.
if (probePage.beauty !== null) {
  const gateShown = await page.evaluate(() => {
    const gate = document.getElementById('rotateGate');
    return !!gate && !gate.hidden;
  });
  if (!gateShown) {
    throw new Error('beauty rotation regression: FIGHT did not raise the portrait rotate gate');
  }
  await page.setViewportSize({ width: 844, height: 390 });
  if (probePage.beauty >= 24) {
    await page.waitForFunction(() =>
      document.body.dataset.v24LoadOverlaySeen === 'ready' &&
      document.body.dataset.v24LoadOverlayParts === 'complete',
      { timeout: 5000 });
  }
  await page.waitForFunction(() => document.body.classList.contains('match-live'), { timeout: 5000 });
  const controlDeck = await page.evaluate(() => {
    const controls = document.getElementById('controls');
    const dpad = document.querySelector('#controls .dpad');
    return {
      controlsDisplay: getComputedStyle(controls).display,
      dpadPointerEvents: getComputedStyle(dpad).pointerEvents,
      skin: controls?.dataset.skin || '',
      loadingSeen: document.body.dataset.v24LoadOverlaySeen || '',
      loadingParts: document.body.dataset.v24LoadOverlayParts || ''
    };
  });
  if (probePage.beauty >= 24 &&
      (controlDeck.loadingSeen !== 'ready' || controlDeck.loadingParts !== 'complete')) {
    throw new Error('V24 loading polish witness missing: ' + JSON.stringify(controlDeck));
  }
  if (controlDeck.controlsDisplay === 'none' || controlDeck.dpadPointerEvents === 'none') {
    throw new Error('V24 landscape touch deck is not active: ' + JSON.stringify(controlDeck));
  }
  await page.waitForTimeout(350);
}
await page.waitForTimeout(2000);

const inMatch = await page.evaluate(() => document.getElementById('setup').classList.contains('hide'));
if (!inMatch) throw new Error('match did not start -- #setup never hid after START MATCH');

await page.evaluate(() => document.getElementById('controls').classList.remove('hidden'));

// --- I14 refcount fix: a diagonal sharing a code with a cardinal must
// not release the cardinal's code while the cardinal is still held ---
async function centerOf(sel) {
  return page.evaluate(s => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, sel);
}
async function touch(type, points) {
  return cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(p => ({ x: p.x, y: p.y, id: p.id })) });
}

await page.evaluate(() => {
  window.__pzKeys = [];
  document.addEventListener('keydown', e => window.__pzKeys.push(['down', e.code]), true);
  document.addEventListener('keyup', e => window.__pzKeys.push(['up', e.code]), true);
});
async function held() {
  return page.evaluate(() => {
    const m = new Map();
    for (const [k, c] of window.__pzKeys) m.set(c, k === 'down');
    return [...m].filter(([, d]) => d).map(([c]) => c);
  });
}

const LEFT = await centerOf('#controls [data-k="ArrowLeft"]');
const DOWN = await centerOf('#controls [data-k="ArrowDown"]');
const DL = await centerOf('#controls [data-macro="DL"]');

await touch('touchStart', [{ x: LEFT.x, y: LEFT.y, id: 1 }]);
await page.waitForTimeout(70);
await touch('touchStart', [{ x: LEFT.x, y: LEFT.y, id: 1 }, { x: DL.x, y: DL.y, id: 2 }]);
await page.waitForTimeout(70);
await touch('touchEnd', [{ x: LEFT.x, y: LEFT.y, id: 1 }]);
await page.waitForTimeout(120);
const afterDiagRelease = await held();
if (!afterDiagRelease.includes('ArrowLeft')) {
  throw new Error('refcount regression: ArrowLeft released while its own button is still held (held=' + afterDiagRelease.join(',') + ')');
}
await touch('touchEnd', []);
await page.waitForTimeout(120);

// --- I14 roll fix: sliding LEFT -> DOWN without lifting must switch the
// active code, not leave ArrowLeft stuck ---
await page.evaluate(() => { window.__pzKeys = []; });
await touch('touchStart', [{ x: LEFT.x, y: LEFT.y, id: 1 }]);
await page.waitForTimeout(70);
await touch('touchMove', [{ x: DOWN.x, y: DOWN.y, id: 1 }]);
await page.waitForTimeout(100);
const rolled = await held();
await touch('touchEnd', []);
await page.waitForTimeout(120);
if (rolled.includes('ArrowLeft') || !rolled.includes('ArrowDown')) {
  throw new Error('roll regression: expected ArrowDown active mid-roll, got held=' + rolled.join(','));
}
const afterRoll = await held();
if (afterRoll.length) throw new Error('roll regression: keys left held after lift: ' + afterRoll.join(','));

// --- final trace-level assertions ---
const trace = await page.evaluate(() => document.getElementById('diag').textContent);

const stalePrefixed = [...trace.matchAll(/I(\d+) (CTRL|CONTROLS|PICKER|LOAD OVERLAY)/g)]
  .map(m => parseInt(m[1], 10))
  .filter(v => v !== rigNum);
if (stalePrefixed.length) {
  throw new Error(`stale rig label(s) in live trace: I${[...new Set(stalePrefixed)].join(', I')} (running I${rigNum})`);
}

const matchStartIdx = trace.indexOf('starting match:');
const afterStart = matchStartIdx >= 0 ? trace.slice(matchStartIdx) : trace;
if (/routed to PICKER/.test(afterStart)) {
  throw new Error('I13 routing regression: a control press routed to PICKER after the match started');
}

// I15/I16/I17: if a LOAD OVERLAY was ever shown, it must not report
// removal with zero assets materialized on a fixture that DOES have real
// lazy-loadable chars/stages -- that exact signature (0 lazy assets,
// removed anyway) is the I16 bug I17 fixed.
const removedZeroAssets = /removed after \d+ms \([^)]*\), 0 lazy asset\(s\) materialized/.test(trace);
if (removedZeroAssets) {
  throw new Error('load-gate regression: overlay removed itself with 0 lazy assets materialized (the exact I16 bug)');
}

const fatalPatterns = ['Out of bounds memory access', 'RuntimeError', 'PROMISE · RuntimeError'];
const fatalHits = fatalPatterns.filter(p => trace.includes(p) || consoleLines.some(l => l.includes(p)) || pageErrors.some(l => l.includes(p)));
if (fatalHits.length) throw new Error('fatal runtime signature(s): ' + fatalHits.join(', '));

const report = {
  suite: 'PriZim MOBMUGEN-IKEMEN runtime probe',
  rig: `I${rigNum}`,
  page_url: pageUrl,
  beauty_build: probePage.beauty,
  v24_ui_sounds: v24UiSounds,
  beauty_roster_thumbnail: beautyRosterThumbnail,
  generic_sff2_roster_thumbnails: genericSff2RosterThumbnails,
  match_started: inMatch,
  refcount_fix_intact: true,
  roll_fix_intact: true,
  no_stale_labels: true,
  no_stray_picker_routing_post_match: true,
  no_zero_asset_early_removal: true,
  fatal_runtime_signatures: fatalHits,
  page_errors: pageErrors.slice(0, 10),
  console_tail: consoleLines.slice(-20),
  diag_tail: trace.split('\n').slice(-40),
  note: `Synthetic fixture validates I${rigNum}'s routing/control/load-gate logic cheaply. Real MUGEN rosters, real iPhone Safari memory behavior, and real character-package quirks remain phone-witness territory -- this probe cannot and does not claim to reproduce those.`,
};
fs.writeFileSync('prizim-mobmugen-ikemen-runtime.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
