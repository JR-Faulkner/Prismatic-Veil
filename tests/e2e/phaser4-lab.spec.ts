import { expect, test } from '@playwright/test';

test('Phaser 4 renderer lab boots with WebGL and native filters', async ({ page }) => {
  const pageErrors: string[] = [];
  let rejectPageError: ((reason?: unknown) => void) | undefined;
  const pageError = new Promise<never>((_, reject) => {
    rejectPageError = reject;
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    rejectPageError?.(err);
  });

  await page.goto('/renderer-lab-phaser4.html');
  await expect(page).toHaveTitle(/PriZim Phaser 4 Renderer Lab/);

  await Promise.race([
    page.waitForFunction(() => window.__pvPhaser4LabReady === true),
    pageError
  ]);

  await expect(page.locator('#lab canvas')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Phaser 4.2.1');
  await expect(page.locator('#status')).toContainText('WebGL');
  await expect(page.locator('#status')).toContainText('Glow');
  await expect(page.locator('#status')).toContainText('Barrel');
  await expect(page.locator('#status')).toContainText('ColorMatrix');

  const lab = await page.evaluate(() => window.__pvPhaser4Lab);
  expect(lab).toEqual({
    phaserVersion: '4.2.1',
    renderer: 'WebGL',
    filters: ['Glow', 'Barrel', 'ColorMatrix'],
    productionRendererChanged: false
  });
  expect(pageErrors).toEqual([]);
});
