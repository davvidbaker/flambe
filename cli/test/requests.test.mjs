import assert from 'node:assert/strict';
import test from 'node:test';
import { FlambeClient, configFromEnv } from '../src/client.mjs';
import { beginRequest, completeRequest, requestHeadline } from '../src/requests.mjs';

test('request helpers begin as a root and only end on explicit completion', async () => {
  const calls = [];
  const client = {
    start: async args => { calls.push(['start', args]); return 12; },
    end: async args => { calls.push(['end', args]); return 13; },
  };
  const id = await beginRequest(client, { prompt: '  Make   it work ' });
  assert.equal(id, 12);
  assert.deepEqual(calls, [['start', { name: 'Make it work', parentId: null }]]);
  assert.equal(await completeRequest(client, { activityId: id, message: 'Verified' }), 13);
  assert.deepEqual(calls[1], ['end', { activityId: 12, message: 'Verified', force: false }]);
  await assert.rejects(completeRequest(client, {}), /request activity id is required/);
});

test('the request-root env setting is validated without changing legacy defaults', () => {
  const env = { FLAMBE_URL: 'http://127.0.0.1:4123', FLAMBE_API_TOKEN: 'test', FLAMBE_TRACE_ID: '1' };
  assert.equal(configFromEnv(env).requestRootId, undefined);
  assert.equal(configFromEnv({ ...env, FLAMBE_REQUEST_ROOT_ID: '42' }).requestRootId, 42);
  for (const value of ['0', 'xyz', '-3', '2.5', '42x']) {
    assert.throws(() => configFromEnv({ ...env, FLAMBE_REQUEST_ROOT_ID: value }), /positive integer/);
  }
});

test('a worker joins a request root, then nests under its own newest running subactivity', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://127.0.0.1:4123', token: 'test', traceId: 1,
    agentId: 'worker-b', requestRootId: 12,
  });
  let activities = [
    { id: 12, parentId: null, status: 'running', agentId: 'worker-a', startedAt: '2026-11-01T00:00:00Z' },
    { id: 13, parentId: 12, status: 'running', agentId: 'worker-a', startedAt: '2026-11-01T00:01:00Z' },
    { id: 18, parentId: null, status: 'running', agentId: 'worker-b', startedAt: '2026-11-01T00:02:00Z' },
  ];
  client.status = async () => ({ activities });
  assert.equal(await client.requestParent(), 12); // Another agent's subtree is not ours.
  activities.push({
    id: 14, parentId: 12, status: 'running', agentId: 'worker-b',
    latestEvent: { timestamp: '2026-11-01T00:03:00Z' },
  });
  assert.equal(await client.requestParent(), 14);
  activities.push({
    id: 15, parentId: 14, status: 'running', agentId: 'worker-b',
    latestEvent: { timestamp: '2026-11-01T00:04:00Z' },
  });
  assert.equal(await client.requestParent(), 15);

  client.resolveThreadId = async () => undefined;
  client.postStart = async input => input;
  assert.equal((await client.start({ name: 'Nested debugging' })).parentId, 15);
  assert.equal((await client.start({ name: 'Another independent root', parentId: null })).parentId, null);
  assert.equal((await client.start({ name: 'Explicit other parent', parentId: 99 })).parentId, 99);

  activities = activities.filter(activity => activity.id !== 12);
  await assert.rejects(client.requestParent(), /no longer active/);
});

test('completed requests are never force-closed by the shared helper', async () => {
  const client = { end: async args => {
    assert.equal(args.force, false);
    throw new Error('OPEN_CHILDREN');
  } };
  await assert.rejects(completeRequest(client, { activityId: 4 }), /OPEN_CHILDREN/);
});
