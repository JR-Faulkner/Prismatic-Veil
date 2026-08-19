import { chromium } from 'playwright';

const url = process.env.PRIZIM_TACTICAL_URL || 'http://127.0.0.1:4173/tactical-shell-06d-clean.html';
const expectedMarker = process.env.PRIZIM_BUILD_MARKER || '';
const failures = [];
let browser;

function record(kind, value) {
  const text = value instanceof Error ? (value.stack || value.message) : String(value);
  failures.push(`${kind}: ${text}`);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  page.on('pageerror', error => record('pageerror', error));
  page.on('console', msg => {
    if (msg.type() === 'error') record('console.error', msg.text());
  });
  page.on('requestfailed', request => {
    const failure = request.failure();
    record('requestfailed', `${request.url()} :: ${failure?.errorText || 'unknown'}`);
  });

  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  if (!response || !response.ok()) {
    record('navigation', `HTTP ${response?.status() ?? 'no response'} for ${url}`);
  }

  await page.waitForTimeout(1200);

  const canvasCount = await page.locator('canvas').count();
  if (canvasCount < 1) record('boot', 'Phaser canvas was not created');

  if (expectedMarker) {
    const actualMarker = await page.evaluate(() => window.PRIZIM_BUILD_MARKER || '');
    if (actualMarker !== expectedMarker) {
      record('delivery', `build marker mismatch: expected ${expectedMarker}, received ${actualMarker || '<none>'}`);
    }
  }

  const loadingState = await page.locator('#loading').evaluate(el => ({
    display: getComputedStyle(el).display,
    text: el.textContent || '',
  })).catch(error => {
    record('boot', `#loading inspection failed: ${error.message}`);
    return null;
  });

  if (loadingState) {
    if (/Boot Error/i.test(loadingState.text)) {
      record('boot', loadingState.text.trim());
    } else if (loadingState.display !== 'none') {
      record('boot', `loading overlay still visible: ${loadingState.text.trim()}`);
    }
  }

  if (failures.length) {
    console.error('PriZim Tactical Boot Smoke: FAIL');
    failures.forEach(f => console.error(`- ${f}`));
    process.exitCode = 1;
  } else {
    console.log('PriZim Tactical Boot Smoke: PASS');
    console.log(`Booted ${url} at 844x390, DPR 3, touch enabled.`);
    if (expectedMarker) console.log(`Verified deployed marker ${expectedMarker}.`);
  }
} catch (error) {
  record('runner', error);
  console.error('PriZim Tactical Boot Smoke: FAIL');
  failures.forEach(f => console.error(`- ${f}`));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
