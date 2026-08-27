import { expect, test } from '@playwright/test';

test('modernization probe boots and reports the new stack', async ({ page }) => {
  await page.goto('/modernization-probe.html');
  await expect(page).toHaveTitle(/PriZim Modernization Probe/);
  await expect(page.locator('#probe')).toContainText('TypeScript');
  await expect(page.locator('#probe')).toContainText('Vite');
});

test('current PV menu still exposes the live hybrid battle route', async ({ page }) => {
  await page.goto('/index.html');
  const enter = page.getByRole('link', { name: /ENTER THE VEIL/i });
  await expect(enter).toBeVisible();
  await expect(enter).toHaveAttribute('href', './hybrid-battle-live.html');
});

test('hybrid shell boots without surfacing its boot-error panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/hybrid-battle-live.html');
  await expect(page.locator('#commands')).toBeVisible();
  await expect(page.locator('#party')).toBeVisible();
  await expect(page.locator('#enemy')).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.locator('#boot')).not.toContainText('LIVE BATTLE BOOT ERROR');
  expect(errors).toEqual([]);
});

test('portrait hybrid route presents the rotate gate', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'webkit-portrait', 'portrait-only contract');
  await page.goto('/hybrid-battle-live.html');
  await expect(page.locator('#rotate')).toBeVisible();
  await expect(page.locator('#rotate')).toContainText('ROTATE TO LANDSCAPE');
});
