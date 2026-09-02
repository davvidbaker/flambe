import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { FlambeClient, configFromEnv } from '../src/client.mjs';
import { run } from '../src/cli.mjs';
import { loadProjectEnv } from '../src/env.mjs';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('configFromEnv requires exactly the agent-facing configuration', () => {
  assert.deepEqual(
    configFromEnv({
      FLAMBE_URL: 'http://localhost:4001/',
      FLAMBE_API_TOKEN: 'flb_secret',
      FLAMBE_TRACE_ID: '7',
    }),
    { baseUrl: 'http://localhost:4001', token: 'flb_secret', traceId: 7 },
  );

  assert.throws(() => configFromEnv({}), /FLAMBE_URL, FLAMBE_API_TOKEN, FLAMBE_TRACE_ID/);
  assert.throws(
    () => configFromEnv({ FLAMBE_URL: 'x', FLAMBE_API_TOKEN: 'y', FLAMBE_TRACE_ID: 'nope' }),
    /positive integer/,
  );
});

test('loadProjectEnv reads .env from cwd without overriding existing environment values', () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-env-'));

  try {
    writeFileSync(
      join(directory, '.env'),
      [
        'FLAMBE_URL=http://from-dotenv:4001',
        'FLAMBE_API_TOKEN="flb_from_dotenv"',
        'FLAMBE_TRACE_ID=27',
      ].join('\n'),
    );

    const env = { FLAMBE_URL: 'http://from-shell:4001' };
    assert.equal(loadProjectEnv({ cwd: directory, env }), join(directory, '.env'));
    assert.deepEqual(env, {
      FLAMBE_URL: 'http://from-shell:4001',
      FLAMBE_API_TOKEN: 'flb_from_dotenv',
      FLAMBE_TRACE_ID: '27',
    });
    assert.deepEqual(configFromEnv(env), {
      baseUrl: 'http://from-shell:4001',
      token: 'flb_from_dotenv',
      traceId: 27,
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('loadProjectEnv is a no-op when the project has no .env', () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-no-env-'));

  try {
    const env = { KEEP_ME: 'yes' };
    assert.equal(loadProjectEnv({ cwd: directory, env }), null);
    assert.deepEqual(env, { KEEP_ME: 'yes' });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('start discovers the default thread and posts an authenticated begin event', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    if (options.method === undefined || options.method === 'GET') {
      return jsonResponse({ data: { id: 9, threads: [{ id: 12, name: 'Later', rank: 2 }, { id: 4, name: 'Main', rank: 0 }] } });
    }
    return jsonResponse({ data: { activity: { id: 42 }, event: { id: 50 } } }, 201);
  };

  const client = new FlambeClient({
    baseUrl: 'http://flambe.test/',
    token: 'flb_test_token',
    traceId: 9,
    fetchImpl,
    now: () => 1_788_360_000_123,
  });

  assert.equal(await client.start({ name: 'Inspect authentication flow', categoryIds: ['5', '5', '8'] }), 42);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'http://flambe.test/api/traces/9');
  assert.equal(requests[1].url, 'http://flambe.test/api/activities');
  assert.equal(requests[1].options.headers.authorization, 'Bearer flb_test_token');
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    trace_id: 9,
    thread_id: 4,
    activity: { name: 'Inspect authentication flow', categories: [5, 8] },
    event: { timestamp_integer: 1_788_360_000_123, phase: 'B' },
  });
});

test('explicit thread skips trace discovery', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    return jsonResponse({ data: { activity: { id: 8 }, event: { id: 9 } } }, 201);
  };

  const client = new FlambeClient({ baseUrl: 'http://flambe.test', token: 't', traceId: 2, fetchImpl, now: () => 7 });
  assert.equal(await client.start({ name: 'Run tests', threadId: '11', description: 'CI', categoryIds: ['4'] }), 8);
  assert.equal(requests.length, 1);
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    trace_id: 2,
    thread_id: 11,
    activity: { name: 'Run tests', description: 'CI', categories: [4] },
    event: { timestamp_integer: 7, phase: 'B' },
  });
});

test('start accepts a timezone-aware ISO timestamp for a backdated begin event', async () => {
  let request;
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2,
    fetchImpl: async (_url, options = {}) => {
      request = options;
      return jsonResponse({ data: { activity: { id: 8 }, event: { id: 9 } } }, 201);
    },
    now: () => 7,
  });

  await client.start({ name: 'Last night', threadId: '11', startedAt: '2026-09-01T20:00:00-06:00' });

  assert.equal(JSON.parse(request.body).event.timestamp_integer, Date.parse('2026-09-01T20:00:00-06:00'));
});

test('start rejects timestamps without a timezone before posting an activity', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2,
    fetchImpl: async () => { throw new Error('should not make a request'); },
  });

  await assert.rejects(
    client.start({ name: 'Last night', threadId: '11', startedAt: '2026-09-01T20:00:00' }),
    /--started-at must be an ISO-8601 timestamp with a timezone/,
  );
});

test('start rejects invalid category IDs before posting an activity', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2,
    fetchImpl: async () => { throw new Error('should not make a request'); },
  });

  await assert.rejects(client.start({ name: 'Run tests', threadId: '11', categoryIds: ['nope'] }), /--category must be a positive integer/);
});

test('end posts an authenticated end event with the completion message', async () => {
  let request;
  const fetchImpl = async (url, options = {}) => {
    request = { url, options };
    return jsonResponse({ data: { id: 77, phase: 'E' } }, 201);
  };

  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    fetchImpl,
    now: () => 456,
  });

  assert.equal(await client.end({ activityId: 42, message: 'Found the issue' }), 77);
  assert.equal(request.options.headers.authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(request.options.body), {
    trace_id: 3,
    activity_id: 42,
    event: { timestamp_integer: 456, phase: 'E', message: 'Found the issue' },
  });
});

test('suspend and resume post lifecycle events', async () => {
  const requests = [];
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 'secret', traceId: 3, now: () => 456,
    fetchImpl: async (_url, options = {}) => {
      requests.push(JSON.parse(options.body));
      return jsonResponse({ data: { id: requests.length, phase: requests.length === 1 ? 'S' : 'R' } }, 201);
    },
  });

  assert.equal(await client.suspend({ activityId: 42, message: 'Waiting' }), 1);
  assert.equal(await client.resume({ activityId: 42, message: 'Back to it' }), 2);
  assert.deepEqual(requests, [
    { trace_id: 3, activity_id: 42, event: { timestamp_integer: 456, phase: 'S', message: 'Waiting' } },
    { trace_id: 3, activity_id: 42, event: { timestamp_integer: 456, phase: 'R', message: 'Back to it' } },
  ]);
});

test('queues offline start and end operations, then flushes them in order', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-queue-'));
  const queuePath = join(directory, 'queue.json');
  const requests = [];
  let connected = false;

  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'do-not-store-me',
    traceId: 3,
    queuePath,
    now: () => 456,
    fetchImpl: async (url, options = {}) => {
      if (!connected) throw new TypeError('network unavailable');
      requests.push({ url, options });
      if (url.endsWith('/api/activities')) {
        return jsonResponse({ data: { activity: { id: 42 }, event: { id: 50 } } }, 201);
      }
      return jsonResponse({ data: { id: 77, phase: 'E' } }, 201);
    },
  });

  try {
    const activityId = await client.start({ name: 'Work offline', threadId: 4, categoryIds: [5] });
    assert.match(activityId, /^offline-/);
    assert.equal(await client.end({ activityId, message: 'Finished offline' }), 'queued');

    const queued = readFileSync(queuePath, 'utf8');
    assert.doesNotMatch(queued, /do-not-store-me/);
    assert.deepEqual(JSON.parse(queued).entries.map(entry => entry.type), ['start', 'end']);

    connected = true;
    await client.flushQueue();

    assert.equal(requests.length, 2);
    assert.deepEqual(JSON.parse(requests[0].options.body), {
      trace_id: 3,
      thread_id: 4,
      activity: { name: 'Work offline', categories: [5] },
      event: { timestamp_integer: 456, phase: 'B' },
    });
    assert.deepEqual(JSON.parse(requests[1].options.body), {
      trace_id: 3,
      activity_id: 42,
      event: { timestamp_integer: 456, phase: 'E', message: 'Finished offline' },
    });
    assert.throws(() => readFileSync(queuePath, 'utf8'), /ENOENT/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('status identifies active and suspended activities by their latest lifecycle event', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    fetchImpl: async () => jsonResponse({
      data: {
        id: 3,
        name: 'Agent work',
        events: [
          { id: 3, timestamp: '2026-09-02T12:00:00Z', phase: 'E', message: 'Done', activity: { id: 10, name: 'Closed work', thread: { id: 2 }, categories: [7] } },
          { id: 1, timestamp: '2026-09-02T10:00:00Z', phase: 'B', message: null, activity: { id: 10, name: 'Closed work', thread: { id: 2 }, categories: [7] } },
          { id: 2, timestamp: '2026-09-02T11:00:00Z', phase: 'B', message: null, activity: { id: 11, name: 'Open work', thread: { id: 4 }, categories: [5] } },
          { id: 4, timestamp: '2026-09-02T13:00:00Z', phase: 'S', message: 'Waiting', activity: { id: 12, name: 'Paused work', thread: { id: 4 }, categories: [] } },
          { id: 5, timestamp: '2026-09-02T12:30:00Z', phase: 'B', message: null, activity: { id: 12, name: 'Paused work', thread: { id: 4 }, categories: [] } },
          { id: 6, timestamp: '2026-09-02T14:00:00Z', phase: 'R', message: null, activity: { id: 13, name: 'Resumed work', thread: { id: 4 }, categories: [] } },
          { id: 7, timestamp: '2026-09-02T12:15:00Z', phase: 'B', message: null, activity: { id: 13, name: 'Resumed work', thread: { id: 4 }, categories: [] } },
        ],
        threads: [{ id: 2, name: 'Closed' }, { id: 4, name: 'Open' }],
      },
    }),
  });

  assert.deepEqual(await client.status({ activeOnly: true }), {
    trace: { id: 3, name: 'Agent work' },
    activities: [{
      id: 11,
      name: 'Open work',
      threadId: 4,
      threadName: 'Open',
      categoryIds: [5],
      startedAt: '2026-09-02T11:00:00Z',
      latestEvent: { id: 2, phase: 'B', timestamp: '2026-09-02T11:00:00Z' },
    }, {
      id: 13,
      name: 'Resumed work',
      threadId: 4,
      threadName: 'Open',
      categoryIds: [],
      startedAt: '2026-09-02T12:15:00Z',
      latestEvent: { id: 6, phase: 'R', timestamp: '2026-09-02T14:00:00Z' },
    }],
  });

  assert.deepEqual((await client.status({ suspendedOnly: true })).activities, [{
    id: 12,
    name: 'Paused work',
    threadId: 4,
    threadName: 'Open',
    categoryIds: [],
    startedAt: '2026-09-02T12:30:00Z',
    latestEvent: { id: 4, phase: 'S', timestamp: '2026-09-02T13:00:00Z', message: 'Waiting' },
  }]);
});

test('threads sorts by rank and identifies the default thread', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 'secret', traceId: 3,
    fetchImpl: async () => jsonResponse({ data: { threads: [{ id: 8, name: 'Later', rank: 2 }, { id: 4, name: 'Main', rank: 0 }, { id: 3, name: 'Also main', rank: 0 }] } }),
  });

  assert.deepEqual(await client.threads(), [
    { id: 3, name: 'Also main', rank: 0, default: true },
    { id: 4, name: 'Main', rank: 0, default: false },
    { id: 8, name: 'Later', rank: 2, default: false },
  ]);
});

test('categories returns the authenticated user categories', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 'secret', traceId: 3,
    fetchImpl: async () => jsonResponse({ data: [{ id: 5, name: 'Client', color_background: '#fff', color_text: '#000' }] }),
  });

  assert.deepEqual(await client.categories(), [{ id: 5, name: 'Client', color_background: '#fff', color_text: '#000' }]);
});

test('API errors are useful without echoing credentials', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'do-not-print-me',
    traceId: 1,
    fetchImpl: async () => jsonResponse({ error: 'UNAUTHENTICATED' }, 401),
  });

  await assert.rejects(client.getTrace(), error => {
    assert.match(error.message, /401/);
    assert.match(error.message, /UNAUTHENTICATED/);
    assert.doesNotMatch(error.message, /do-not-print-me/);
    return true;
  });
});

test('CLI commands print machine-friendly output', async () => {
  const output = [];
  const stdout = { write(value) { output.push(value); } };
  const calls = [];
  const client = {
    async flushQueue() { calls.push(['flushQueue']); },
    async start(input) { calls.push(['start', input]); return 123; },
    async end(input) { calls.push(['end', input]); return 456; },
    async suspend(input) { calls.push(['suspend', input]); return 457; },
    async resume(input) { calls.push(['resume', input]); return 458; },
    async status(input) {
      calls.push(['status', input]);
      return { trace: { id: 1, name: 'Work' }, activities: [{ id: 9, name: 'Open work', threadId: 2, threadName: 'Main', categoryIds: [5], latestEvent: { id: 3, phase: 'B', timestamp: '2026-09-02T11:00:00Z' } }] };
    },
    async threads() { calls.push(['threads']); return [{ id: 2, name: 'Main', rank: 0, default: true }]; },
    async categories() { calls.push(['categories']); return [{ id: 5, name: 'Work', color_background: '#fff', color_text: '#000' }]; },
  };

  await run(['start', 'Inspect', 'auth', '--description', 'Agent work', '--category', '5', '--started-at', '2026-09-01T20:00:00-06:00'], { stdout, client });
  await run(['end', '123', 'Done'], { stdout, client });
  await run(['suspend', '123', 'Waiting'], { stdout, client });
  await run(['resume', '123', 'Continue'], { stdout, client });
  await run(['status', '--active', '--json'], { stdout, client });
  await run(['threads'], { stdout, client });
  await run(['categories', '--json'], { stdout, client });

  assert.deepEqual(output, ['123\n', '456\n', '457\n', '458\n', '{"trace":{"id":1,"name":"Work"},"activities":[{"id":9,"name":"Open work","threadId":2,"threadName":"Main","categoryIds":[5],"latestEvent":{"id":3,"phase":"B","timestamp":"2026-09-02T11:00:00Z"}}]}\n', '2\t0\tMain\tdefault\n', '[{"id":5,"name":"Work","color_background":"#fff","color_text":"#000"}]\n']);
  assert.deepEqual(calls, [
    ['flushQueue'],
    ['start', { name: 'Inspect auth', description: 'Agent work', threadId: undefined, categoryIds: ['5'], startedAt: '2026-09-01T20:00:00-06:00' }],
    ['flushQueue'],
    ['end', { activityId: '123', message: 'Done' }],
    ['flushQueue'],
    ['suspend', { activityId: '123', message: 'Waiting' }],
    ['flushQueue'],
    ['resume', { activityId: '123', message: 'Continue' }],
    ['flushQueue'],
    ['status', { activeOnly: true, suspendedOnly: false }],
    ['flushQueue'],
    ['threads'],
    ['flushQueue'],
    ['categories'],
  ]);
});
