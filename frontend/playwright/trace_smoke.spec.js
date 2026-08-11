const { test, expect } = require('@playwright/test');

const collapseStorageKey = 'flambe.thread-collapse-state.v1';
const email = process.env.PLAYWRIGHT_EMAIL || 'e2e@flambe.local';
const password = process.env.PLAYWRIGHT_PASSWORD || 'e2e-password';

test('logs in, renders a trace, and persists thread collapse', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);

  const traceResponse = page.waitForResponse(response =>
    response.request().method() === 'GET' && /\/api\/traces\/\d+$/.test(new URL(response.url()).pathname),
  );

  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/[^/]+\/traces\/\d+$/);

  const response = await traceResponse;
  const trace = await response.json();
  const [firstThread] = [...trace.data.threads].sort((left, right) => left.rank - right.rank);
  const traceId = String(trace.data.id);

  const canvas = page.locator('#chart-wrapper canvas');
  await expect(canvas).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(
        ({ storageKey, id, threadId }) => JSON.parse(localStorage.getItem(storageKey) || '{}')[id]?.[threadId],
        { storageKey: collapseStorageKey, id: traceId, threadId: String(firstThread.id) },
      ),
    )
    .toBe(false);

  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 100, box.y + 10);

  await expect
    .poll(() =>
      page.evaluate(
        ({ storageKey, id, threadId }) => JSON.parse(localStorage.getItem(storageKey) || '{}')[id]?.[threadId],
        { storageKey: collapseStorageKey, id: traceId, threadId: String(firstThread.id) },
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(canvas).toBeVisible();

  const afterReload = await page.evaluate(
    ({ storageKey, id, threadId }) => JSON.parse(localStorage.getItem(storageKey) || '{}')[id]?.[threadId],
    { storageKey: collapseStorageKey, id: traceId, threadId: String(firstThread.id) },
  );
  expect(afterReload).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('redirects an unauthenticated trace route to login', async ({ page }) => {
  await page.goto('/flambe_e2e/traces/2');
  await expect(page).toHaveURL(/\/login$/);
});

test('registers a local account and opens its private Main trace', async ({ page }) => {
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 10_000).toString(36)}`;
  const account = {
    email: `playwright-${suffix}@flambe.local`,
    name: `Playwright ${suffix}`,
    password: 'playwright-password',
    username: `pw-${suffix}`,
  };

  await page.goto('/register');
  await page.getByLabel('Name', { exact: true }).fill(account.name);
  await page.getByLabel('Username').fill(account.username);
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(account.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/login$/);

  const traceResponse = page.waitForResponse(response =>
    response.request().method() === 'GET' && /\/api\/traces\/\d+$/.test(new URL(response.url()).pathname),
  );

  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(account.password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(new RegExp(`/${account.username}/traces/\\d+$`));

  const trace = await (await traceResponse).json();
  expect(trace.data.events).toEqual([]);
  expect(trace.data.threads).toEqual([
    expect.objectContaining({ name: 'Main', rank: 0 }),
  ]);
});

test('creates, renames, and deletes a thread through the authenticated same-origin API', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/[^/]+\/traces\/\d+$/);

  const traceId = Number(page.url().match(/\/traces\/(\d+)$/)[1]);
  const name = `Smoke thread ${Date.now()}`;

  const thread = await page.evaluate(async ({ traceId: id, threadName }) => {
    const response = await fetch('/api/threads', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        trace_id: id,
        thread: { name: threadName, rank: 9_999 },
      }),
    });

    return { status: response.status, body: await response.json() };
  }, { traceId, threadName: name });

  expect(thread.status).toBe(201);
  expect(thread.body.data).toMatchObject({ name, rank: 9_999 });

  const renamedName = `${name} renamed`;
  const updated = await page.evaluate(async ({ threadId, nextName }) => {
    const response = await fetch(`/api/threads/${threadId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ thread: { name: nextName } }),
    });

    return { status: response.status, body: await response.json() };
  }, { threadId: thread.body.data.id, nextName: renamedName });

  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ id: thread.body.data.id, name: renamedName });

  const deletion = await page.evaluate(async threadId => {
    const response = await fetch(`/api/threads/${threadId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    return response.status;
  }, thread.body.data.id);

  expect(deletion).toBe(204);
});

test('starts a new activity through the command palette', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/[^/]+\/traces\/\d+$/);
  const traceId = Number(page.url().match(/\/traces\/(\d+)$/)[1]);
  await expect(page.locator('#chart-wrapper canvas')).toBeVisible();

  // Playwright's Linux shortcut mapping does not emulate macOS Command keys,
  // so dispatch the same browser event the keyboard shortcut produces.
  await page.evaluate(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  });

  const commandInput = page.locator('input[role="combobox"]');
  await commandInput.fill('start');
  await commandInput.press('Enter');

  const name = `Browser activity ${Date.now()}`;
  const nameInput = page.locator(
    'input[placeholder="gist/description of the activity"]',
  );
  await nameInput.fill(name);
  await nameInput.press('Enter');

  await page.locator('.commander-result').first().click();
  await page.locator('input[placeholder="category"]').waitFor();

  const createResponse = page.waitForResponse(response =>
    response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/activities',
  );
  await page.getByText('none', { exact: true }).click();

  const created = await (await createResponse).json();
  expect(created.data.activity).toMatchObject({ name });

  const ended = await page.evaluate(async ({ activityId, traceId: id }) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        trace_id: id,
        activity_id: activityId,
        event: { timestamp_integer: Date.now(), phase: 'E' },
      }),
    });

    return { status: response.status, body: await response.json() };
  }, { activityId: created.data.activity.id, traceId });

  expect(ended.status).toBe(201);
  expect(ended.body.data).toMatchObject({ phase: 'E' });

  const deletion = await page.evaluate(async activityId => {
    const response = await fetch(`/api/activities/${activityId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    return response.status;
  }, created.data.activity.id);

  expect(deletion).toBe(204);
  expect(pageErrors).toEqual([]);
});

test('logs out through the UI and clears the protected session', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/[^/]+\/traces\/\d+$/);

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/flambe_e2e/traces/2');
  await expect(page).toHaveURL(/\/login$/);
});
