import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { run } from '../src/cli.mjs';
import { listenLocal } from '../src/local/serve.mjs';
import { LocalStore } from '../src/local/store.mjs';

async function withServer(fn) {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-local-'));
  const dbPath = join(directory, 'local.sqlite');
  const { server, store, port } = await listenLocal({
    host: '127.0.0.1',
    port: 0,
    dbPath,
    staticDir: null,
  });
  const origin = `http://127.0.0.1:${port}`;
  const { rawToken, traceId } = store.credentials();

  try {
    await fn({ origin, rawToken, traceId, store, dbPath, directory });
  } finally {
    server.close();
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test('local server binds loopback, seeds a token, and round-trips CLI activity events', async () => {
  await withServer(async ({ origin, rawToken, traceId }) => {
    const health = await fetch(`${origin}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });

    const headers = {
      authorization: `Bearer ${rawToken}`,
      'content-type': 'application/json',
      'x-flambe-agent-id': 'cursor:test',
      'x-flambe-agent-name': 'Grok',
    };

    const begin = await fetch(`${origin}/api/activities`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        trace_id: traceId,
        thread_id: 1,
        activity: { name: 'Keep work on this laptop' },
        event: { timestamp_integer: 1_788_360_000_123, phase: 'B' },
      }),
    });
    assert.equal(begin.status, 201);
    const created = await begin.json();
    const activityId = created.data.activity.id;

    const end = await fetch(`${origin}/api/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        trace_id: traceId,
        activity_id: activityId,
        event: { timestamp_integer: 1_788_360_000_999, phase: 'E', message: 'stayed local' },
      }),
    });
    assert.equal(end.status, 201);

    const trace = await fetch(`${origin}/api/traces/${traceId}`, { headers }).then(r => r.json());
    assert.equal(trace.data.events.length, 2);
    assert.equal(trace.data.events[0].activity.name, 'Keep work on this laptop');
    assert.equal(trace.data.events[0].activity.agent_name, 'Grok');
    assert.equal(trace.data.events[1].phase, 'E');
  });
});

test('login on the local server sets a session cookie and serves the user dashboard', async () => {
  await withServer(async ({ origin }) => {
    const login = await fetch(`${origin}/auth/identity/callback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'anyone@local', password: 'ignored' }),
    });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get('set-cookie');
    assert.match(setCookie, /flambe_user=1/);
    const { data } = await login.json();
    assert.equal(data.username, 'local');

    const user = await fetch(`${origin}/api/users/${data.id}`, {
      headers: { cookie: setCookie.split(';')[0] },
    });
    assert.equal(user.status, 200);
    const dashboard = await user.json();
    assert.equal(dashboard.data.traces[0].name, 'Main');
  });
});

test('export writes a remappable bundle without tokens', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-export-'));
  const dbPath = join(directory, 'local.sqlite');
  const store = new LocalStore(dbPath);
  try {
    store.createActivity(1, {
      traceId: 1,
      threadId: 1,
      activity: { name: 'Company work' },
      event: { timestamp_integer: 1000, phase: 'B' },
      agentId: 'agent-1',
      agentName: 'Grok',
    });
    const out = join(directory, 'out.json');
    const chunks = [];
    await run(['export', out, '--db', dbPath], {
      env: {},
      stdout: { write: chunk => chunks.push(chunk) },
    });
    const bundle = JSON.parse(readFileSync(out, 'utf8'));
    assert.equal(bundle.format, 'flambe-local-export');
    assert.equal(bundle.version, 1);
    assert.equal(bundle.traces[0].activities[0].name, 'Company work');
    assert.ok(bundle.traces[0].export_id);
    assert.equal(JSON.stringify(bundle).includes('flb_'), false);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('refuses a non-loopback bind', () => {
  assert.throws(
    () => listenLocal({ host: '0.0.0.0', port: 0, dbPath: join(tmpdir(), 'no.sqlite') }),
    /loopback only/,
  );
});
