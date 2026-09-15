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
if (!brand.includes('MOBMUGEN · RIG F · F9.0')) throw new Error(`unexpected brand: ${brand}`);

const delivered=[];
await page.exposeFunction('__pzKeyF90', e => delivered.push(e));
await page.evaluate(() => {
  document.addEventListener('keydown', e => window.__pzKeyF90({type:e.type,code:e.code,key:e.key}), true);
  document.addEventListener('keyup', e => window.__pzKeyF90({type:e.type,code:e.code,key:e.key}), true);
});

async function tap(kind, value, pointerId){
  const el = page.locator(`#controls [${kind}="${value}"]`).first();
  if (await el.count() !== 1) throw new Error(`missing control ${kind}=${value}`);
  await el.dispatchEvent('pointerdown', {pointerId, pointerType:'touch', isPrimary:true});
  await page.waitForTimeout(15);
  await el.dispatchEvent('pointerup', {pointerId, pointerType:'touch', isPrimary:true});
}

const sequence = [
  ['ArrowUp','data-k'],['ArrowDown','data-k'],['ArrowLeft','data-k'],['ArrowRight','data-k'],
  ['KeyA','data-k'],['KeyS','data-k'],['KeyD','data-k'],['KeyZ','data-k'],['KeyX','data-k'],['KeyC','data-k'],
  ['Enter','data-k'],['Escape','data-k'],['UL','data-macro'],['UR','data-macro'],['DL','data-macro'],['DR','data-macro'],['2P','data-macro'],['2K','data-macro']
];
let pointerId=100;
for (const [value,kind] of sequence) await tap(kind,value,pointerId++);

await page.locator('#zipInput').setInputFiles(fixture);
await page.waitForFunction(() => document.querySelector('#diag')?.textContent?.includes('F6.3 LEAN FS READY'), null, {timeout:120000});
const diag = await page.locator('#diag').innerText();
for (const marker of ['F6 ZIP META','F6 EXE FOUND · WinMugen/Winmugen.exe','F6.3 LEAN FS READY']) {
  if (!diag.includes(marker)) throw new Error(`missing F9.0 legacy anchor marker: ${marker}`);
}

const fatalPatterns=['JS ERROR','PROMISE ·','WASM ABORT'];
const fatalHits=fatalPatterns.filter(x => diag.includes(x) || consoleLines.some(l=>l.includes(x)) || pageErrors.some(l=>l.includes(x)));
if (fatalHits.length) throw new Error(`fatal pre-boot signature(s): ${fatalHits.join(', ')}`);

const downs=delivered.filter(e=>e.type==='keydown');
const ups=delivered.filter(e=>e.type==='keyup');
const expected=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyA','KeyS','KeyD','KeyZ','KeyX','KeyC','Enter','Escape']);
const seen=new Set(downs.map(e=>e.code));
const missing=[...expected].filter(x=>!seen.has(x));
if (missing.length) throw new Error(`input codes not dispatched: ${missing.join(', ')}`);
if (!downs.length || !ups.length) throw new Error('missing keydown/keyup delivery');

const report={
  suite:'PriZim MOBMUGEN F9.0 exact F6.5 visual-anchor plumbing',
  brand,
  anchor:'70a7016c50ca4375cd77eca92e920adc3e0d6933',
  fixture_ingest_ready:true,
  controller_controls_tested:sequence.length,
  keydown_events_observed:downs.length,
  keyup_events_observed:ups.length,
  unique_codes:[...seen].sort(),
  missing_codes:missing,
  fatal_preboot_signatures:fatalHits,
  page_errors:pageErrors.slice(0,10),
  console_tail:consoleLines.slice(-20),
  diag_tail:diag.split('\n').slice(-30),
  note:'PZ verifies the exact F6.5-derived page, lean fixture ingest, and controller dispatch. Real WinMUGEN rendering on iPhone Safari remains the visual authority.'
};
fs.writeFileSync('prizim-mobmugen-f90-runtime.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
