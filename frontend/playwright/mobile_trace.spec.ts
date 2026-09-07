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

test('scrubs the timeline with a one-finger drag and pinches to zoom', async ({ browserName, page }) => {
  // WebKit forbids `new Touch()` in scripted events; Chromium covers the gesture path.
  test.skip(browserName === 'webkit', 'WebKit cannot construct Touch events in page.evaluate');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/[^/]+\/traces\/\d+$/);

  const surface = page.locator('[data-timeline-surface="true"]');
  const canvas = page.locator('#chart-wrapper canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(100);
  await expect.poll(async () => Number(await surface.getAttribute('data-lbt'))).toBeGreaterThan(0);

  const before = {
    lbt: Number(await surface.getAttribute('data-lbt')),
    rbt: Number(await surface.getAttribute('data-rbt')),
  };
  const beforeSpan = before.rbt - before.lbt;
  expect(beforeSpan).toBeGreaterThan(0);

  const box = await canvas.boundingBox();
  if (!box) throw new Error('missing chart box');

  // One-finger scrub: drag left → later times (higher left bound).
  await page.evaluate(({ x, y }) => {
    const target = document.querySelector('[data-timeline-surface="true"]');
    if (!target) throw new Error('timeline surface missing');
    const touch = (id: number, cx: number, cy: number) =>
      new Touch({ identifier: id, target, clientX: cx, clientY: cy });
    target.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [touch(1, x, y)],
      targetTouches: [touch(1, x, y)],
      changedTouches: [touch(1, x, y)],
    }));
    target.dispatchEvent(new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [touch(1, x - 100, y)],
      targetTouches: [touch(1, x - 100, y)],
      changedTouches: [touch(1, x - 100, y)],
    }));
    target.dispatchEvent(new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: [touch(1, x - 100, y)],
    }));
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });

  await expect.poll(async () => Number(await surface.getAttribute('data-lbt'))).toBeGreaterThan(before.lbt);

  const afterPan = {
    lbt: Number(await surface.getAttribute('data-lbt')),
    rbt: Number(await surface.getAttribute('data-rbt')),
  };

  // Pinch out around the chart center → narrower time window.
  await page.evaluate(({ x, y }) => {
    const target = document.querySelector('[data-timeline-surface="true"]');
    if (!target) throw new Error('timeline surface missing');
    const touch = (id: number, cx: number, cy: number) =>
      new Touch({ identifier: id, target, clientX: cx, clientY: cy });
    target.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [touch(1, x - 40, y), touch(2, x + 40, y)],
      targetTouches: [touch(1, x - 40, y), touch(2, x + 40, y)],
      changedTouches: [touch(1, x - 40, y), touch(2, x + 40, y)],
    }));
    target.dispatchEvent(new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [touch(1, x - 90, y), touch(2, x + 90, y)],
      targetTouches: [touch(1, x - 90, y), touch(2, x + 90, y)],
      changedTouches: [touch(1, x - 90, y), touch(2, x + 90, y)],
    }));
    target.dispatchEvent(new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: [touch(1, x - 90, y), touch(2, x + 90, y)],
    }));
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });

  await expect.poll(async () => {
    const lbt = Number(await surface.getAttribute('data-lbt'));
    const rbt = Number(await surface.getAttribute('data-rbt'));
    return rbt - lbt;
  }).toBeLessThan(afterPan.rbt - afterPan.lbt);
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
