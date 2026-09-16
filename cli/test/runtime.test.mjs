import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { FlambeClient, clientFromEnv, clientFromHostEnv } from '../src/client.mjs';

test('self-contained configuration rejects remote destinations before any request', () => {
  for (const make of [clientFromEnv, clientFromHostEnv]) {
    for (const url of ['https://example.com', 'http://127.0.0.1.example.com', 'http://localhost:4001', 'file:///tmp/flambe']) {
      assert.throws(() => make({
        FLAMBE_URL: url, FLAMBE_API_TOKEN: 'test', FLAMBE_TRACE_ID: '1',
        FLAMBE_RUNTIME_MODE: 'local_self_contained',
      }), /Self-contained mode/);
    }
  }
  assert.throws(() => clientFromEnv({
    FLAMBE_URL: 'http://127.0.0.1', FLAMBE_API_TOKEN: 'test', FLAMBE_TRACE_ID: '1',
    FLAMBE_RUNTIME_MODE: 'typo',
  }), /FLAMBE_RUNTIME_MODE/);
});

test('self-contained requests do not follow redirects or send their body to another destination', async t => {
  let destinationRequests = 0;
  const destination = createServer((_req, res) => { destinationRequests++; res.end('{}'); });
  await new Promise(resolve => destination.listen(0, '127.0.0.1', resolve));
  t.after(() => destination.close());
  const source = createServer((_req, res) => {
    res.writeHead(307, { location: `http://127.0.0.1:${destination.address().port}/collect` });
    res.end();
  });
  await new Promise(resolve => source.listen(0, '127.0.0.1', resolve));
  t.after(() => source.close());
  const client = new FlambeClient({
    baseUrl: `http://127.0.0.1:${source.address().port}`, token: 'test', traceId: 1,
    runtimeMode: 'local_self_contained',
  });
  await assert.rejects(client.request('/api/activities', { method: 'POST', body: { private: 'trace' } }), /307/);
  assert.equal(destinationRequests, 0);
});

test('legacy status treats V/J as ended, X as running, and annotations as non-lifecycle', () => {
  const client = new FlambeClient({ baseUrl: 'http://127.0.0.1', token: 'test', traceId: 1 });
  const events = [];
  for (const [index, phase] of ['V', 'J', 'X'].entries()) {
    const activity = { id: index + 1, name: phase, thread: { id: 1 } };
    events.push({ id: index * 3, timestamp: '2026-09-16T01:00:00Z', phase: 'B', activity });
    events.push({ id: index * 3 + 1, timestamp: '2026-09-16T02:00:00Z', phase, activity });
    events.push({ id: index * 3 + 2, timestamp: '2026-09-16T03:00:00Z', phase: 'reducer_decision', activity });
  }
  const trace = { id: 1, name: 'Local', threads: [], events };
  assert.deepEqual(client.statusFromTrace(trace, { activeOnly: true }).activities.map(a => a.name), ['X']);
  assert.deepEqual(client.statusFromTrace(trace).activities.map(a => a.latestEvent.phase), ['V', 'J', 'X']);
});
