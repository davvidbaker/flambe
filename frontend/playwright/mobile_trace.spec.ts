import { expect, test } from '@playwright/test';

const email = process.env.PLAYWRIGHT_EMAIL || 'e2e@flambe.local';
const password = process.env.PLAYWRIGHT_PASSWORD || 'e2e-password';

test('keeps the flame chart usable in a phone-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/[^/]+\/traces\/\d+$/);

  const canvas = page.locator('#chart-wrapper canvas');
  await expect(canvas).toBeVisible();

  await expect.poll(async () => {
    const box = await canvas.boundingBox();
    return box ? { width: Math.round(box.width), height: Math.round(box.height) } : null;
  }).toEqual(expect.objectContaining({
    width: expect.any(Number),
    height: expect.any(Number),
  }));

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Flame chart canvas has no bounding box');

  expect(box.width).toBeGreaterThan(350);
  expect(box.height).toBeGreaterThan(500);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y + box.height).toBeLessThanOrEqual(844);

  const pageSize = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageSize.scrollWidth).toBe(pageSize.clientWidth);
});

test('renders the post-login timeline on WebKit without requestIdleCallback', async ({ browserName, page }) => {
  test.skip(browserName !== 'webkit', 'WebKit/Safari regression only');

  await page.setViewportSize({ width: 390, height: 844 });

  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/[^/]+\/traces\/\d+$/);

  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('#chart-wrapper canvas');
    const box = canvas?.getBoundingClientRect();
    return {
      hasIdle: typeof (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback,
      appHeight: Math.round(document.getElementById('app-root')?.getBoundingClientRect().height ?? 0),
      canvasHeight: Math.round(box?.height ?? 0),
      headerText: document.querySelector('header')?.textContent ?? '',
    };
  });

  expect(metrics.hasIdle).toBe('undefined');
  expect(metrics.appHeight).toBeGreaterThan(500);
  expect(metrics.canvasHeight).toBeGreaterThan(500);
  expect(metrics.headerText).toMatch(/Traces|Log out/);
  expect(pageErrors.filter(message => /requestIdleCallback/i.test(message))).toEqual([]);
});
