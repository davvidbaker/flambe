import { expect, test, type Locator, type Page } from '@playwright/test';

// Run against Storybook: PLAYWRIGHT_MAGIC_BUTTON_STORIES=1
// PLAYWRIGHT_BASE_URL=http://localhost:6006 npx playwright test magic_button.spec.ts
test.skip(!process.env.PLAYWRIGHT_MAGIC_BUTTON_STORIES, 'requires the local Storybook target');

async function open(page: Page, story = 'inline') {
  await page.goto(`/iframe.html?id=primitives-magicbutton--${story}&viewMode=story`);
}
async function selected(editor: Locator, text: string) {
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue(text);
  expect(await editor.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd]))
    .toEqual([0, text.length]);
}
async function matchesBox(editor: Locator, box: { x: number; y: number; width: number; height: number }) {
  const actual = (await editor.boundingBox())!;
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - box[key]), key).toBeLessThanOrEqual(1);
  }
}

test('tracks width-only changes and preserves editor geometry on repeated activation', async ({ page }) => {
  await open(page);
  const before = (await page.getByRole('button', { name: 'Current name', exact: true }).boundingBox())!;
  await page.getByRole('button', { name: 'Change displayed name' }).click();
  const display = page.getByRole('button', { name: 'A much longer displayed activity name', exact: true });
  const box = (await display.boundingBox())!;
  expect(box.width).toBeGreaterThan(before.width);
  expect(box.height).toBe(before.height);
  await display.click();
  const editor = page.getByRole('textbox');
  await matchesBox(editor, box);
  await selected(editor, 'A much longer displayed activity name');
  await page.getByRole('button', { name: 'Outside editor' }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByLabel('Commits')).toHaveText('0');
  await display.click();
  await selected(editor, 'A much longer displayed activity name');
  await matchesBox(editor, box);
});

test('isolates shortcut keys, commits once on Enter, and does not submit the surrounding form', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Current name', exact: true }).click();
  const editor = page.getByRole('textbox');
  await selected(editor, 'Current name');
  await expect(editor).toHaveAttribute('data-1p-ignore');
  await expect(editor).toHaveAttribute('autocomplete', 'off');
  await editor.press('e');
  await editor.press('ArrowLeft');
  await editor.press('Control+z');
  await expect(page.getByLabel('Document shortcuts')).toHaveText('0');
  await editor.fill('Updated name');
  await editor.press('Enter');
  await expect(editor).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Updated name', exact: true })).toBeVisible();
  await expect(page.getByLabel('Commits')).toHaveText('1');
  await expect(page.getByLabel('Form submissions')).toHaveText('0');
});

test('blur discards edits without committing or changing display geometry', async ({ page }) => {
  await open(page);
  const display = page.getByRole('button', { name: 'Current name', exact: true });
  const box = (await display.boundingBox())!;
  await display.click();
  await page.getByRole('textbox').fill('Uncommitted draft');
  await page.getByRole('button', { name: 'Outside editor' }).click();
  await matchesBox(display, box);
  await expect(page.getByLabel('Commits')).toHaveText('0');
  await display.click();
  await selected(page.getByRole('textbox'), 'Current name');
});

for (const story of ['start-as-input', 'inside-modal']) {
  test(`${story} measures, focuses and selects the initial editor`, async ({ page }) => {
    await open(page, story);
    const editor = page.getByRole('textbox');
    await selected(editor, 'Current name');
    const box = (await editor.boundingBox())!;
    await expect(editor).toHaveAttribute('data-1p-ignore');
    await editor.press('e');
    await expect(editor).toHaveValue('e');
    await editor.fill('Current name');
    await editor.press('Enter');
    await matchesBox(page.getByRole('button', { name: 'Current name', exact: true }), box);
    await expect(page.getByLabel('Commits')).toHaveText('1');
  });
}

test('creation keeps its placeholder empty and rejects blank Enter', async ({ page }) => {
  await open(page, 'creation');
  await page.getByRole('button', { name: 'Current name', exact: true }).click();
  const editor = page.getByRole('textbox');
  await expect(editor).toHaveValue('');
  await expect(editor).toHaveAttribute('placeholder', 'Current name');
  await editor.press('Enter');
  await expect(editor).toBeFocused();
  await expect(page.getByLabel('Commits')).toHaveText('0');
  await editor.fill('Created');
  await editor.press('Enter');
  await expect(page.getByLabel('Commits')).toHaveText('1');
});
