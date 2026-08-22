import { chromium } from 'playwright';

const url = process.env.PRIZIM_STYLE_URL || 'http://127.0.0.1:4173/kineza-attack-style-lab.html?prizim=KINEZA-STYLE-AUDITION-002';
const expectedMarker = process.env.PRIZIM_BUILD_MARKER || 'KINEZA-STYLE-AUDITION-002';
const width = Number(process.env.PRIZIM_VIEWPORT_WIDTH || 844);
const height = Number(process.env.PRIZIM_VIEWPORT_HEIGHT || 390);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', message => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('requestfailed', request => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`));

try {
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  if (!response || !response.ok()) throw new Error(`Style lab HTTP ${response?.status() ?? 'no-response'}`);

  await page.waitForFunction(
    () => window.__KINEZA_STYLE_LAB__?.ready === true,
    null,
    { timeout: 20000 }
  );

  const bootText = await page.locator('#boot-status').innerText();
  if (!bootText.includes(expectedMarker)) throw new Error(`Build marker missing in boot status: ${bootText}`);

  const htmlMarker = await page.locator('main[data-build]').getAttribute('data-build');
  if (htmlMarker !== expectedMarker) throw new Error(`HTML build marker ${htmlMarker} != ${expectedMarker}`);

  for (let style = 0; style < 3; style++) {
    await page.evaluate(styleIndex => window.__KINEZA_STYLE_LAB__.selectStyle(styleIndex), style);
    for (let frame = 0; frame < 6; frame++) {
      await page.evaluate(frameIndex => window.__KINEZA_STYLE_LAB__.setFrame(frameIndex), frame);
      const state = await page.evaluate(() => window.__KINEZA_STYLE_LAB__.getState());
      if (state.buildMarker !== expectedMarker) throw new Error(`Runtime marker ${state.buildMarker} != ${expectedMarker}`);
      if (state.styleIndex !== style || state.frameIndex !== frame) {
        throw new Error(`Selection mismatch: expected style ${style} frame ${frame}, got style ${state.styleIndex} frame ${state.frameIndex}`);
      }
      if (!state.canvasHasPixels) throw new Error(`Rendered canvas blank at style ${style} frame ${frame}`);
    }
  }

  await page.locator('#compare').click();
  await page.waitForFunction(
    () => window.__KINEZA_STYLE_LAB__?.getState().playing === false,
    null,
    { timeout: 15000 }
  );

  const finalState = await page.evaluate(() => window.__KINEZA_STYLE_LAB__.getState());
  const visited = Object.values(finalState.visited || {});
  if (visited.length !== 3) throw new Error(`Expected 3 visited style sets, found ${visited.length}`);
  for (const frames of visited) {
    if (frames.length !== 6 || frames.some((value, index) => value !== index)) {
      throw new Error(`Incomplete frame coverage: ${JSON.stringify(frames)}`);
    }
  }

  const geometry = await page.evaluate(() => {
    const selectors = ['#styles', '.stage', '.bottom', '#play', '#compare'];
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    return {
      viewport: [vw, vh],
      overflowX: document.documentElement.scrollWidth > vw + 2,
      elements: Object.fromEntries(selectors.map(selector => {
        const el = document.querySelector(selector);
        if (!el) return [selector, null];
        const r = el.getBoundingClientRect();
        return [selector, { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }];
      }))
    };
  });

  if (geometry.overflowX) throw new Error(`Horizontal overflow at ${width}x${height}`);
  for (const [selector, rect] of Object.entries(geometry.elements)) {
    if (!rect) throw new Error(`Missing UI element ${selector}`);
    if (rect.width < 1 || rect.height < 1) throw new Error(`Collapsed UI element ${selector}`);
    if (rect.left < -2 || rect.right > geometry.viewport[0] + 2 || rect.top < -2 || rect.bottom > geometry.viewport[1] + 2) {
      throw new Error(`Offscreen UI element ${selector}: ${JSON.stringify(rect)} viewport=${JSON.stringify(geometry.viewport)}`);
    }
  }

  if (errors.length) throw new Error(errors.join('\n'));

  console.log(JSON.stringify({
    tool: 'PriZim Kineza Style Lab Delivery Gate',
    status: 'success',
    build_marker: expectedMarker,
    url,
    viewport: `${width}x${height}`,
    styles: 3,
    frames_per_style: 6,
    frame_coverage: '18/18',
    compare_cycle: 'success',
    canvas_render: 'success',
    ui_bounds: 'success'
  }, null, 2));
} finally {
  await browser.close();
}
