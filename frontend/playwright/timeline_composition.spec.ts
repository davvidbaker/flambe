import { expect, test, type Locator, type Page } from '@playwright/test';

test.skip(!process.env.PLAYWRIGHT_TIMELINE_STORIES, 'requires the local Storybook target');
const flame = (page: Page) => page.getByRole('img', { name: 'Flambe flamechart', exact: true });
const series = (page: Page) => page.getByRole('img', { name: 'Timeline timeseries', exact: true });
async function range(page: Page) {
  return page.locator('[data-timeline-surface]').evaluate(element => ({
    left: Number((element as HTMLElement).dataset.lbt), right: Number((element as HTMLElement).dataset.rbt),
  }));
}
async function coloredPoint(canvas: Locator) {
  return canvas.evaluate((element: HTMLCanvasElement) => {
    const { width, height } = element;
    const data = element.getContext('2d')!.getImageData(0, 0, width, height).data;
    const dpr = window.devicePixelRatio || 1;
    for (let y = 40 * dpr; y < height - 5; y += 5 * dpr) {
      for (let x = 170 * dpr; x < width - 25 * dpr; x += 4 * dpr) {
        const offset = (y * width + x) * 4;
        const [r, g, b] = data.slice(offset, offset + 3);
        if (r > 120 && g > 90 && r > b + 50 && g > b + 35) return { x: x / dpr, y: y / dpr };
      }
    }
    return null;
  });
}
async function pixels(canvas: Locator) {
  return canvas.evaluate((element: HTMLCanvasElement) => {
    const data = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
    let hash = 0;
    for (let i = 0; i < data.length; i += 16) hash = (Math.imul(hash, 31) + data[i] + data[i + 1] + data[i + 2]) | 0;
    return hash;
  });
}
async function open(page: Page, story: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/iframe.html?id=${story}&viewMode=story`);
  await expect(flame(page)).toBeVisible();
  await expect.poll(async () => { const r = await range(page); return r.right - r.left; }).toBeGreaterThan(0);
  await expect.poll(() => coloredPoint(flame(page))).not.toBeNull();
}
async function selectAndCheckLocalOverlay(page: Page) {
  const canvas = flame(page);
  const point = (await coloredPoint(canvas))!;
  await canvas.click({ position: point });
  const focus = page.locator('[data-flamechart-focus]');
  await expect(focus).toBeVisible();
  const chart = (await canvas.boundingBox())!;
  const selected = (await focus.boundingBox())!;
  expect(selected.y).toBeGreaterThanOrEqual(chart.y);
  expect(selected.y).toBeLessThanOrEqual(chart.y + point.y);
  expect(selected.y + selected.height).toBeGreaterThan(chart.y + point.y);
  return selected;
}

test('standalone flamechart retains local overlays, navigation, and resize', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, 'app-timeline-composition--flamechart-only');
  await expect(series(page)).toHaveCount(0);
  await expect(page.getByRole('separator')).toHaveCount(0);
  const selected = await selectAndCheckLocalOverlay(page);
  await page.mouse.move(selected.x + selected.width / 2, selected.y + selected.height / 2);
  await expect(page.locator('[data-flamechart-tooltip]')).toHaveCSS('opacity', '1');
  const before = await range(page);
  await flame(page).hover({ position: { x: 400, y: 120 } });
  await page.mouse.wheel(80, 0);
  await expect.poll(() => range(page)).not.toEqual(before);
  const afterPan = await range(page);
  expect(afterPan.right - afterPan.left).toBeCloseTo(before.right - before.left, 0);
  expect((await page.locator('[data-flamechart-focus]').boundingBox())!.x).not.toBe(selected.x);
  await page.mouse.wheel(0, -80);
  await expect.poll(async () => { const r = await range(page); return r.right - r.left; }).toBeLessThan(before.right - before.left);
  await page.setViewportSize({ width: 800, height: 600 });
  await expect.poll(() => flame(page).evaluate((el: HTMLCanvasElement) => el.width)).toBe(800);
  await expect.poll(() => flame(page).evaluate((el: HTMLCanvasElement) => el.height)).toBe(600);
  await expect.poll(() => coloredPoint(flame(page))).not.toBeNull();
  expect(errors).toEqual([]);
});

test('custom panes redraw together at different widths and tolerate timeseries remounts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, 'app-timeline-composition--synced-panes');
  await page.getByRole('button', { name: 'Resize timeseries' }).click();
  await expect.poll(async () => (await series(page).boundingBox())!.width).toBeCloseTo((await flame(page).boundingBox())!.width * 0.6, 0);
  const oldFlame = await pixels(flame(page));
  const oldSeries = await pixels(series(page));
  const before = await range(page);
  const box = (await series(page).boundingBox())!;
  await series(page).hover({ position: { x: box.width / 2, y: 60 } });
  await page.mouse.wheel(0, -120);
  await expect.poll(() => range(page)).not.toEqual(before);
  await expect.poll(() => pixels(flame(page))).not.toBe(oldFlame);
  await expect.poll(() => pixels(series(page))).not.toBe(oldSeries);
  const retained = await range(page);
  await page.getByRole('button', { name: 'Toggle timeseries' }).click();
  await expect(series(page)).toHaveCount(0);
  expect(await range(page)).toEqual(retained);
  await page.getByRole('button', { name: 'Toggle timeseries' }).click();
  await expect(series(page)).toBeVisible();
  expect(await range(page)).toEqual(retained);
  await expect.poll(() => pixels(series(page))).not.toBe(0);
  await series(page).evaluate((target: HTMLCanvasElement) => {
    const rect = target.getBoundingClientRect();
    const send = (type: string, fractions: number[]) => {
      const touches = fractions.map((fraction, id) => new Touch({ identifier: id, target,
        clientX: rect.left + rect.width * fraction, clientY: rect.top + 60 }));
      target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true,
        touches, targetTouches: touches, changedTouches: touches }));
    };
    send('touchstart', [0.35, 0.65]); send('touchmove', [0.25, 0.75]); send('touchend', []);
  });
  await expect.poll(async () => { const r = await range(page); return r.right - r.left; }).toBeLessThan(retained.right - retained.left);
  expect(errors).toEqual([]);
});

test('default app layout keeps split panes and local selection after resizing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, 'app-flamechart--nested-work');
  await expect(series(page)).toBeVisible();
  const divider = (await page.getByRole('separator').first().boundingBox())!;
  await page.mouse.move(divider.x + divider.width / 2, divider.y + 2);
  await page.mouse.down();
  await page.mouse.move(divider.x + divider.width / 2, divider.y + 90, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await series(page).boundingBox())!.height).toBeGreaterThan(170);
  await expect.poll(() => coloredPoint(flame(page))).not.toBeNull();
  await selectAndCheckLocalOverlay(page);
  expect(errors).toEqual([]);
});

test('animated presets and touch panning keep composed panes working', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, 'app-timeline-composition--synced-panes');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const before = await range(page);
  const oldSeries = await pixels(series(page));
  await page.keyboard.press('n');
  await expect.poll(async () => { const r = await range(page); return r.right - r.left; })
    .toBeLessThan((before.right - before.left) / 2);
  await expect.poll(() => pixels(series(page))).not.toBe(oldSeries);
  await flame(page).evaluate((target: HTMLCanvasElement) => {
    const rect = target.getBoundingClientRect();
    const send = (type: string, x: number, active: boolean) => {
      const touch = new Touch({ identifier: 1, target, clientX: rect.left + x, clientY: rect.top + 60 });
      target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true,
        touches: active ? [touch] : [], targetTouches: active ? [touch] : [], changedTouches: [touch] }));
    };
    send('touchstart', 250, true); send('touchmove', 180, true); send('touchend', 180, false);
  });
  const afterGesture = await range(page);
  await expect.poll(() => range(page)).not.toEqual(afterGesture);
  // A short viewport makes the fixture overflow; Shift+wheel must scroll the flamechart.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 900, height: 260 });
  const surface = page.locator('[data-timeline-surface]');
  await expect.poll(async () => Number(await surface.getAttribute('data-max-top-offset'))).toBeGreaterThan(0);
  await flame(page).hover({ position: { x: 300, y: 40 } });
  await page.keyboard.down('Shift');
  await page.mouse.wheel(0, 60);
  await page.keyboard.up('Shift');
  await expect.poll(async () => Number(await surface.getAttribute('data-top-offset'))).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
