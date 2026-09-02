import assert from 'node:assert/strict';
import test from 'node:test';

import { FlambeClient, configFromEnv } from '../src/client.mjs';
import { run } from '../src/cli.mjs';

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

  assert.equal(await client.start({ name: 'Inspect authentication flow' }), 42);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'http://flambe.test/api/traces/9');
  assert.equal(requests[1].url, 'http://flambe.test/api/activities');
  assert.equal(requests[1].options.headers.authorization, 'Bearer flb_test_token');
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    trace_id: 9,
    thread_id: 4,
    activity: { name: 'Inspect authentication flow', categories: [] },
    event: { timestamp_integer: 1_788_360_000_123, phase: 'B' },
  });
});

test('explicit thread skips trace discovery', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    return jsonResponse({ data: { activity: { id: 8 }, event: { id: 9 } } }, 201);
  };

  const client = new FlambeClient({ baseUrl: 'http://flambe.test', token: 't', traceId: 2, fetchImpl });
  assert.equal(await client.start({ name: 'Run tests', threadId: '11', description: 'CI' }), 8);
  assert.equal(requests.length, 1);
  assert.equal(JSON.parse(requests[0].options.body).thread_id, 11);
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

test('CLI start and end print machine-friendly ids', async () => {
  const output = [];
  const stdout = { write(value) { output.push(value); } };
  const calls = [];
  const client = {
    async start(input) { calls.push(['start', input]); return 123; },
    async end(input) { calls.push(['end', input]); return 456; },
  };

  await run(['start', 'Inspect', 'auth', '--description', 'Agent work'], { stdout, client });
  await run(['end', '123', 'Done'], { stdout, client });

  assert.deepEqual(output, ['123\n', '456\n']);
  assert.deepEqual(calls, [
    ['start', { name: 'Inspect auth', description: 'Agent work', threadId: undefined }],
    ['end', { activityId: '123', message: 'Done' }],
  ]);
});
