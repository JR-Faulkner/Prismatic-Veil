import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.PZ_BASE_URL || 'http://127.0.0.1:8000';
const fixture = process.env.PZ_FIXTURE || 'tools/prizim/mobmugen/fixtures/prizim_winmugen_fixture.zip';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:430,height:932}});
const consoleLines=[];
const pageErrors=[];
page.on('console', msg => consoleLines.push(msg.text()));
page.on('pageerror', err => pageErrors.push(String(err)));
await page.goto(`${base}/mugen-lab/rig-f7.html?pz_ci=1`, {waitUntil:'domcontentloaded', timeout:120000});

const brand = await page.locator('.brand').innerText();
if (!brand.includes('MOBMUGEN')) throw new Error('MOBMUGEN brand missing');
if (!brand.includes('F8.5')) throw new Error(`expected F8.5 runner, got: ${brand}`);

const delivered=[];
await page.exposeFunction('__pzKey', e => delivered.push(e));
await page.evaluate(() => {
  document.addEventListener('keydown', e => window.__pzKey({type:e.type,code:e.code,key:e.key}), true);
  document.addEventListener('keyup', e => window.__pzKey({type:e.type,code:e.code,key:e.key}), true);
});

await page.locator('#zipInput').setInputFiles(fixture);
await page.locator('#zipStart').click();
await page.waitForFunction(() => document.querySelector('#diag')?.textContent?.includes('DIRECT ZIP STREAM READY'), null, {timeout:120000});

let diag = await page.locator('#diag').innerText();
const required = [
  'CENTRAL DIR READY',
  'F8.5 CFG SOURCE · count=1 · PRIMARY=WinMugen/data/mugen.cfg',
  'RIGF F8.5: CFG READY path=/d_drive/WinMugen/data/mugen.cfg',
  'STREAM PLAN',
  'DIRECT ZIP STREAM READY'
];
for (const marker of required) if (!diag.includes(marker)) throw new Error(`missing runtime marker: ${marker}`);

const sequence = [
  ['ArrowUp','data-k'],['ArrowDown','data-k'],['ArrowLeft','data-k'],['ArrowRight','data-k'],
  ['KeyA','data-k'],['KeyS','data-k'],['KeyD','data-k'],['KeyZ','data-k'],['KeyX','data-k'],['KeyC','data-k'],
  ['Enter','data-k'],['Escape','data-k'],
  ['UL','data-macro'],['UR','data-macro'],['DL','data-macro'],['DR','data-macro'],['2P','data-macro'],['2K','data-macro']
];
const expectedCodes = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyA','KeyS','KeyD','KeyZ','KeyX','KeyC','Enter','Escape']);
const pzLog=[];

async function tap(kind, value, pointerId){
  const el = page.locator(`#controls [${kind}="${value}"]`).first();
  if (await el.count() !== 1) throw new Error(`missing control ${kind}=${value}`);
  await el.dispatchEvent('pointerdown', {pointerId, pointerType:'touch', isPrimary:true});
  await page.waitForTimeout(20);
  await el.dispatchEvent('pointerup', {pointerId, pointerType:'touch', isPrimary:true});
  pzLog.push(`PZ INPUT · ${value} · pointer down/up`);
}

let pointerId=10;
for (const [value,kind] of sequence) await tap(kind,value,pointerId++);

// Rapid-fire pass, intentionally deterministic so builds can be compared.
for (let round=1; round<=3; round++) {
  for (const code of ['ArrowDown','ArrowRight','KeyZ','KeyX','KeyA','KeyS','KeyD','Enter']) {
    await tap('data-k',code,pointerId++);
    pzLog.push(`PZ RAPID · round=${round} · ${code}`);
  }
}

await page.waitForTimeout(5000);
diag = await page.locator('#diag').innerText();
const fatalPatterns = [
  'Out of bounds memory access',
  'nested code invalidation preparation',
  'WASM ABORT',
  'PROMISE · RuntimeError'
];
const fatalHits = fatalPatterns.filter(x => diag.includes(x) || consoleLines.some(l => l.includes(x)) || pageErrors.some(l => l.includes(x)));
if (fatalHits.length) throw new Error(`fatal runtime signature(s): ${fatalHits.join(', ')}`);

const downs = delivered.filter(e => e.type === 'keydown');
const ups = delivered.filter(e => e.type === 'keyup');
const seenCodes = new Set(downs.map(e => e.code));
const missingCodes = [...expectedCodes].filter(code => !seenCodes.has(code));
if (missingCodes.length) throw new Error(`input codes not dispatched: ${missingCodes.join(', ')}`);
if (!downs.length || !ups.length) throw new Error('missing keydown/keyup delivery');

const report = {
  suite:'PriZim MOBMUGEN deterministic input torture',
  brand,
  fixture_cfg_primary:'WinMugen/data/mugen.cfg',
  stream_ready:true,
  controller_controls_tested:sequence.length,
  rapid_fire_rounds:3,
  keydown_events_observed:downs.length,
  keyup_events_observed:ups.length,
  unique_codes:[...seenCodes].sort(),
  missing_codes:missingCodes,
  fatal_runtime_signatures:fatalHits,
  survived_post_input_ms:5000,
  input_log:pzLog,
  page_errors:pageErrors.slice(0,10),
  console_tail:consoleLines.slice(-30),
  diag_tail:diag.split('\n').slice(-40),
  note:'Synthetic fixture validates F8.5 browser/stream/controller plumbing and deterministic input delivery. Real WinMUGEN execution and iPhone WebKit remain final witness authority.'
};
fs.writeFileSync('prizim-mobmugen-runtime.json', JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
