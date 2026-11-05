import { expect, test, type Page } from '@playwright/test';

test.skip(!process.env.PLAYWRIGHT_MOBILE_STORIES, 'requires the local Storybook target');
const phone = { width: 390, height: 844 };
const flame = (page: Page) => page.getByRole('img', { name: 'Flambe flamechart', exact: true });
async function open(page: Page) {
  await page.setViewportSize(phone);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/iframe.html?id=app-mobile-workspace--navigator&viewMode=story');
  await expect(page.getByRole('heading', { name: 'Threads', exact: true })).toBeVisible();
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function pixels(page: Page) {
  return page.getByRole('img', { name: 'Timeline timeseries', exact: true }).evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 0;
    for (let i = 0; i < data.length; i += 4) hash = (Math.imul(hash, 31) + data[i] + data[i + 1] + data[i + 2]) | 0;
    return hash;
  });
}

test('phone defaults to compact, natively scrollable threads, with no chart or metric strip', async ({ page, browserName }) => {
  await open(page);
  await expect(flame(page)).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Timeline timeseries', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Current trace')).toBeVisible();
  await expect(page.getByRole('button', { name: /Idle thread 1 Idle/, exact: true })).toBeVisible();
  await fits(page);
  const scroll = page.locator('[data-mobile-workspace] > [data-native-scroll]');
  if (browserName === 'chromium') {
    await scroll.hover();
    await page.mouse.wheel(0, 1200);
  } else {
    // Mobile WebKit has no wheel API; verify scrollability via native focus scrolling.
    await page.getByRole('button', { name: /Idle thread 16 Idle/ }).focus();
  }
  await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  const touchActions = await scroll.evaluate(el => {
    const actions = [];
    for (let node: Element | null = el; node; node = node.parentElement) actions.push(getComputedStyle(node).touchAction);
    return actions;
  });
  expect(touchActions).not.toContain('none');
});

test('active hierarchy wraps long labels and opens real activity details', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /flambe🔥/ }).click();
  const stack = page.getByRole('region', { name: 'Active stack' });
  await expect(stack.getByRole('button')).toHaveCount(4);
  const leaf = stack.getByRole('button', { name: /Verify a long current activity/ });
  await expect(leaf).toBeVisible();
  expect((await leaf.boundingBox())!.height).toBeGreaterThan(60);
  await fits(page);
  await leaf.click();
  await expect(page.getByRole('dialog', { name: 'Activity details' })).toBeVisible();
});

test('Limbo fills the phone, keeps dismiss accessible, and returns to the navigator', async ({ page }) => {
  await open(page);
  const trigger = page.getByRole('button', { name: /Limbo ·/ });
  await expect(trigger).not.toHaveText('Limbo · 0');
  // Safari taps do not focus buttons. Start with keyboard focus to test restoration.
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Limbo', exact: true });
  await expect(dialog).toBeVisible();
  const content = dialog.locator('[data-app-modal-fullscreen="true"]');
  const box = (await content.boundingBox())!;
  expect(Math.round(box.width)).toBe(phone.width);
  expect(Math.round(box.height)).toBe(phone.height);
  expect(Math.round(box.y)).toBe(0);
  await expect(dialog.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
  await expect(dialog.getByText('Plan the next mobile improvement')).toBeVisible();
  await fits(page);
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Threads', exact: true })).toBeVisible();
  await trigger.press('Enter');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Done', exact: true }).press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('stack exploration retains zoomable history and metrics are opt-in', async ({ page, browserName }) => {
  await open(page);
  await page.getByRole('button', { name: /flambe🔥/ }).click();
  await page.getByRole('button', { name: 'Explore stack in timeline' }).click();
  await expect(flame(page)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Timeline timeseries', exact: true })).toHaveCount(0);
  const surface = page.locator('[data-timeline-surface]');
  const span = async () => surface.evaluate(el => Number(el.getAttribute('data-rbt')) - Number(el.getAttribute('data-lbt')));
  await expect.poll(span).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Day', exact: true }).click();
  const day = await span();
  await page.getByRole('button', { name: 'Now', exact: true }).click();
  await expect.poll(span).toBeLessThan(day);
  if (browserName === 'chromium') {
    const before = await span();
    await flame(page).evaluate(el => {
      const box = el.getBoundingClientRect();
      const touch = (id: number, x: number) => new Touch({ identifier: id, target: el, clientX: x, clientY: box.y + 100 });
      const fire = (type: string, points: Touch[]) => el.dispatchEvent(new TouchEvent(type,
        { bubbles: true, cancelable: true, touches: points, targetTouches: points, changedTouches: points }));
      fire('touchstart', [touch(1, box.x + 130), touch(2, box.x + 210)]);
      fire('touchmove', [touch(1, box.x + 80), touch(2, box.x + 260)]);
      fire('touchend', []);
    });
    await expect.poll(span).toBeLessThan(before);
  }
  await page.getByRole('button', { name: 'Metrics', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Timeline timeseries', exact: true })).toBeVisible();
  await fits(page);
});

test('timeseries controls group legends, hide actual plots, and persist choices', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await page.getByRole('button', { name: 'Metrics', exact: true }).click();
  const manager = page.getByRole('button', { name: 'Manage timeseries' });
  await manager.click();
  const dialog = page.getByRole('dialog', { name: 'Timeseries visibility' });
  await expect(dialog.locator('fieldset')).not.toHaveCount(0);
  await expect(dialog.getByRole('checkbox').first()).toBeChecked();
  // The chart's old floating legend must never paint or intercept taps above the modal.
  expect(await dialog.evaluate(el => el.contains(document.elementFromPoint(window.innerWidth - 40, 200)))).toBe(true);
  const firstGroup = dialog.getByRole('group').first();
  await firstGroup.getByRole('button', { name: 'Hide group', exact: true }).click();
  await expect(firstGroup.getByRole('checkbox').first()).not.toBeChecked();
  await firstGroup.getByRole('button', { name: 'Show group', exact: true }).click();
  await expect(firstGroup.getByRole('checkbox').first()).toBeChecked();
  await firstGroup.getByRole('checkbox').first().uncheck();
  await expect(firstGroup.getByRole('checkbox').first()).not.toBeChecked();
  await firstGroup.getByRole('checkbox').first().check();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  const before = await pixels(page);
  await manager.click();
  await dialog.getByRole('button', { name: 'Hide all', exact: true }).click();
  const checkboxes = dialog.getByRole('checkbox');
  for (const checkbox of await checkboxes.all()) await expect(checkbox).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect.poll(() => pixels(page)).not.toBe(before);
  await expect(manager).toHaveText(/Series · 0\//);
  await page.reload();
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await page.getByRole('button', { name: 'Metrics', exact: true }).click();
  await expect(manager).toHaveText(/Series · 0\//);
  await manager.click();
  await dialog.getByRole('button', { name: 'Show all', exact: true }).click();
  await expect(dialog.getByRole('checkbox').first()).toBeChecked();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await fits(page);
});

test('desktop retains the chart workspace and resizes cleanly into mobile navigation', async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(flame(page)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Timeline timeseries', exact: true })).toBeVisible();
  await expect(page.locator('[data-mobile-workspace]')).toHaveCount(0);
  await page.setViewportSize(phone);
  await expect(page.getByRole('heading', { name: 'Threads', exact: true })).toBeVisible();
  await expect(flame(page)).toHaveCount(0);
  await fits(page);
});
