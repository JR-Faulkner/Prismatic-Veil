import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.PZ_BASE_URL || 'http://127.0.0.1:8000';
const route = process.env.PZ_ROUTE || '/mugen-lab/rig-f7.html?pz_perf=1';
const fixture = process.env.PZ_PERF_FIXTURE || 'tools/prizim/mobmugen/fixtures/prizim_ddraw_perf_fixture.zip';
const out = process.env.PZ_PERF_REPORT || 'prizim-mobmugen-perf.json';
const sampleMs = Number(process.env.PZ_SAMPLE_MS || 8000);
const samplesWanted = Number(process.env.PZ_SAMPLES || 3);

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:430,height:932}});
const consoleLines=[];
const pageErrors=[];
page.on('console', msg => consoleLines.push(msg.text()));
page.on('pageerror', err => pageErrors.push(String(err)));

await page.goto(`${base}${route}`, {waitUntil:'domcontentloaded', timeout:120000});
const brand = await page.locator('.brand').innerText();
if (!brand.includes('MOBMUGEN')) throw new Error(`unexpected runner brand: ${brand}`);

await page.locator('#zipInput').setInputFiles(fixture);
await page.waitForFunction(() => document.querySelector('#diag')?.textContent?.includes('BOXEDWINE ENGINE STARTED'), null, {timeout:120000});

// Wait for the emulator main loop to become measurable. This is intentionally
// independent of the browser RAF rate so a 60 Hz scheduler cannot fake success.
await page.waitForFunction(() => (window.RIGF_LOOP_COUNT || 0) > 5, null, {timeout:90000});

// Warm the Wine/DirectDraw path before measuring.
await page.waitForTimeout(5000);

async function sampleWindow(ms) {
  return await page.evaluate(async (duration) => {
    const startLoop = window.RIGF_LOOP_COUNT || 0;
    const startDraw = window.RIGF_FRAME_COUNT || 0;
    let rafCount = 0;
    let alive = true;
    const rafTick = () => {
      rafCount++;
      if (alive) requestAnimationFrame(rafTick);
    };
    requestAnimationFrame(rafTick);
    const t0 = performance.now();
    await new Promise(r => setTimeout(r, duration));
    const t1 = performance.now();
    alive = false;
    const seconds = (t1 - t0) / 1000;
    const loopDelta = (window.RIGF_LOOP_COUNT || 0) - startLoop;
    const drawDelta = (window.RIGF_FRAME_COUNT || 0) - startDraw;
    return {
      duration_ms: t1 - t0,
      loop_delta: loopDelta,
      draw_delta: drawDelta,
      raf_delta: rafCount,
      loop_fps: loopDelta / seconds,
      draw_fps: drawDelta / seconds,
      raf_fps: rafCount / seconds
    };
  }, ms);
}

const samples=[];
for (let i=0; i<samplesWanted; i++) {
  samples.push(await sampleWindow(sampleMs));
}

function median(values) {
  const a=[...values].sort((x,y)=>x-y);
  if (!a.length) return 0;
  const m=Math.floor(a.length/2);
  return a.length%2 ? a[m] : (a[m-1]+a[m])/2;
}

const loopFps = median(samples.map(x=>x.loop_fps));
const drawFps = median(samples.map(x=>x.draw_fps));
const rafFps = median(samples.map(x=>x.raf_fps));
const diag = await page.locator('#diag').innerText();

const fatalPatterns=[
  'WASM ABORT',
  'Out of bounds memory access',
  'nested code invalidation preparation',
  'PROMISE · RuntimeError'
];
const fatalHits=fatalPatterns.filter(x => diag.includes(x) || consoleLines.some(l=>l.includes(x)) || pageErrors.some(l=>l.includes(x)));
const usable = loopFps > 0.5 && drawFps > 0.5 && rafFps > 10 && fatalHits.length === 0;

const report={
  suite:'PriZim MOBMUGEN deterministic DirectDraw performance probe',
  brand,
  route,
  fixture,
  workload:'32-bit Win32 DirectDraw 7, 320x240, paced for ~60 presents/sec',
  sample_ms:sampleMs,
  samples,
  median_loop_fps:loopFps,
  median_draw_fps:drawFps,
  median_raf_fps:rafFps,
  target_45_met:drawFps >= 45,
  target_60_met:drawFps >= 58,
  usable_for_ab:usable,
  fatal_runtime_signatures:fatalHits,
  page_errors:pageErrors.slice(0,10),
  console_tail:consoleLines.slice(-40),
  diag_tail:diag.split('\n').slice(-60),
  note:'draw_fps is the BoxedWine presentation counter rate under a deterministic DirectDraw workload; loop_fps is emulator main-loop throughput; raf_fps is browser scheduler cadence. Compare draw/loop rates between candidates, never RAF alone.'
};

fs.writeFileSync(out, JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();

if (!usable) process.exitCode = 2;
