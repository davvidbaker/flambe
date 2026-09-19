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

async function openCleanPlayground(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('flambe-share.localSnapshot.v1'));
  await page.reload();
}

test('homepage shows example JSON beside a live chart', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await openCleanPlayground(page);
  const shell = page.locator('[data-auth-shell="true"]');
  await expect(page.getByRole('heading', { name: /flambé/ })).toBeVisible();
  await expect.poll(() => shell.evaluate(el => getComputedStyle(el).borderTopColor)).toBe('rgb(255, 88, 38)');
  await expect.poll(() => page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  );

  const editor = page.getByLabel('Timeline snapshot JSON');
  await expect(editor).toContainText('"traceName": "Share playground"');
  await expect(editor).toContainText('"agent_name": "Cursor"');
  await expect(editor).toContainText('pudl');
  await expect(editor).toContainText('Finish the upstairs bath');
  await expect(editor).not.toContainText('elastic');
  const parsed = JSON.parse(await editor.inputValue()) as {
    exportedAt: number;
    viewport: { leftBoundaryTime: number; rightBoundaryTime: number };
    fixture: { threads: unknown[] };
  };
  expect(parsed.fixture.threads.length).toBeGreaterThan(1);
  expect(parsed.viewport.rightBoundaryTime - parsed.viewport.leftBoundaryTime).toBeGreaterThan(
    90 * 24 * 60 * 60 * 1000,
  );
  await expect(editor).toContainText('Clip events to the selected window');
  await expect(editor).toContainText('Are these co-gens or paper mills?');
  expect(Date.now() - parsed.exportedAt).toBeLessThan(5 * 60 * 1000);
  await expect(page.getByText('Nothing leaves this browser', { exact: false })).toBeVisible();
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();
  await expect(page).toHaveTitle(/Share playground/);
  expect(pageErrors).toEqual([]);
});

test('JSON edits render live and survive refresh', async ({ page }) => {
  await openCleanPlayground(page);
  const editor = page.getByLabel('Timeline snapshot JSON');
  const text = await editor.inputValue();
  await editor.fill(text.replace('Share playground', 'Live edited trace'));
  await expect(page).toHaveTitle(/Live edited trace/);
  await expect(page.getByText('Valid snapshot. Saved in this browser only.')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Timeline snapshot JSON')).toContainText('Live edited trace');
  await expect(page).toHaveTitle(/Live edited trace/);
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();
});

test('invalid JSON keeps the last good chart', async ({ page }) => {
  await openCleanPlayground(page);
  await page.getByLabel('Timeline snapshot JSON').fill('{');
  await expect(page.getByText('That file is not valid JSON.')).toBeVisible();
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();
});

test('dropping a file replaces the editor snapshot', async ({ page }) => {
  await openCleanPlayground(page);
  await page.evaluate(json => {
    const file = new File([json], 'snapshot.json', { type: 'application/json' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    window.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
  }, JSON.stringify(snapshot));

  await expect(page.getByLabel('Timeline snapshot JSON')).toContainText('Dropped locally');
  await expect(page).toHaveTitle(/Dropped locally/);
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();
});
