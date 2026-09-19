import { expect, test } from '@playwright/test';

const snapshot = {
  version: 1,
  exportedAt: 1_700_000_000_000,
  viewport: { leftBoundaryTime: 1_699_996_400_000, rightBoundaryTime: 1_700_000_000_000 },
  timeLabels: { absoluteTimeLabels: false, twelveHourClock: false },
  fixture: {
    attentionShifts: [],
    categories: [{ id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' }],
    threads: [{ id: 1, name: 'main', rank: 0 }],
    traceId: 9001,
    traceName: 'Dropped locally',
    events: [
      {
        id: 1,
        timestamp: 1_699_998_200_000,
        phase: 'B',
        activity: {
          id: 10,
          name: 'Dropped file render',
          categories: [1],
          thread_id: 1,
          thread: { id: 1, name: 'main' },
        },
      },
      {
        id: 2,
        timestamp: 1_699_999_100_000,
        phase: 'E',
        activity: {
          id: 10,
          name: 'Dropped file render',
          categories: [1],
          thread_id: 1,
          thread: { id: 1, name: 'main' },
        },
      },
    ],
  },
};

test.skip(!process.env.PLAYWRIGHT_SHARE_VIEWER, 'share viewer is not the default smoke target');

test('homepage is light and keeps a dropped snapshot after refresh', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('flambe-share.localSnapshot.v1'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Flambe share' })).toBeVisible();
  await expect.poll(() => page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  );

  await page.setInputFiles('input[type=file]', {
    name: 'snapshot.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(snapshot)),
  });

  await expect(page.getByText('Local snapshot. Drop another JSON file to replace it.')).toBeVisible();
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('flambe-share.localSnapshot.v1'))).toContain(
    'Dropped locally',
  );

  await page.reload();
  await expect(page.getByText('Local snapshot. Drop another JSON file to replace it.')).toBeVisible();
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('window drop renders a snapshot JSON file', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('flambe-share.localSnapshot.v1'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Flambe share' })).toBeVisible();

  await page.evaluate(json => {
    const file = new File([json], 'snapshot.json', { type: 'application/json' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    window.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
  }, JSON.stringify(snapshot));

  await expect(page.getByText('Local snapshot. Drop another JSON file to replace it.')).toBeVisible();
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();
});
