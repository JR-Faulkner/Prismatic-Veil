import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.PZ_BASE_URL || 'http://127.0.0.1:8000';
const fixture = process.env.PZ_FIXTURE || 'tools/prizim/mobmugen/fixtures/prizim_winmugen_fixture.zip';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage();
const consoleLines=[];
const pageErrors=[];
page.on('console', msg => consoleLines.push(msg.text()));
page.on('pageerror', err => pageErrors.push(String(err)));
await page.goto(`${base}/mugen-lab/rig-f7.html?pz_ci=1`, {waitUntil:'domcontentloaded', timeout:120000});

const brand = await page.locator('.brand').innerText();
if (!brand.includes('MOBMUGEN')) throw new Error('MOBMUGEN brand missing');

let delivered=[];
await page.exposeFunction('__pzKey', e => delivered.push(e));
await page.evaluate(() => {
  document.addEventListener('keydown', e => window.__pzKey({type:e.type,code:e.code,key:e.key}), true);
});
await page.locator('[data-k="Enter"]').dispatchEvent('pointerdown', {pointerId:1, pointerType:'touch', isPrimary:true});
await page.locator('[data-k="Enter"]').dispatchEvent('pointerup', {pointerId:1, pointerType:'touch', isPrimary:true});
if (!delivered.some(e => e.code === 'Enter')) throw new Error('controller did not dispatch Enter');

await page.locator('#zipInput').setInputFiles(fixture);
await page.locator('#zipStart').click();
await page.waitForFunction(() => document.querySelector('#diag')?.textContent?.includes('DIRECT ZIP STREAM READY'), null, {timeout:120000});
const diag = await page.locator('#diag').innerText();
const required = ['CENTRAL DIR READY','STREAM PLAN','DIRECT ZIP STREAM READY'];
for (const marker of required) if (!diag.includes(marker)) throw new Error(`missing runtime marker: ${marker}`);

const report = {
  suite:'PriZim MOBMUGEN browser simulation',
  brand,
  input_enter_dispatched:true,
  stream_ready:true,
  page_errors:pageErrors.slice(0,10),
  console_tail:consoleLines.slice(-20),
  note:'Synthetic fixture validates browser boot plumbing through selective ZIP stream. Full WinMUGEN execution still requires the real game fixture/mobile witness.'
};
fs.writeFileSync('prizim-mobmugen-runtime.json', JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
