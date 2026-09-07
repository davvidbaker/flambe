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

test('local server names nameless agents and applies the deterministic start rules', async () => {
  await withServer(async ({ origin, rawToken, traceId }) => {
    const headersFor = agentId => ({
      authorization: `Bearer ${rawToken}`,
      'content-type': 'application/json',
      'x-flambe-agent-id': agentId,
      'x-flambe-agent-platform': 'Cursor Cloud',
    });
    const start = (agentId, body) => fetch(`${origin}/api/activities`, {
      method: 'POST',
      headers: headersFor(agentId),
      body: JSON.stringify({ trace_id: traceId, event: { timestamp_integer: 1_788_360_000_123, phase: 'B' }, ...body }),
    });

    const me = await fetch(`${origin}/api/agents/me`, { headers: headersFor('cursor:a') });
    assert.equal(me.status, 200);
    const identity = await me.json();
    assert.equal(identity.data.name_assigned, true);
    assert.equal(identity.data.platform, 'Cursor Cloud');
    assert.equal(me.headers.get('x-flambe-agent-name'), identity.data.name);
    assert.equal(me.headers.get('x-flambe-agent-name-assigned'), 'true');

    const again = await fetch(`${origin}/api/agents/me`, { headers: headersFor('cursor:a') });
    assert.equal((await again.json()).data.name_assigned, false);
    assert.equal(again.headers.get('x-flambe-agent-name-assigned'), null);

    const other = await fetch(`${origin}/api/agents/me`, { headers: headersFor('cursor:b') }).then(r => r.json());
    assert.notEqual(other.data.name, identity.data.name);

    // Roots without a thread go to the default thread; inference is per agent.
    const rootA = await start('cursor:a', { activity: { name: 'A root' } }).then(r => r.json());
    assert.equal(rootA.data.activity.parent_id, null);
    assert.equal(rootA.data.activity.thread_id, 1);
    assert.deepEqual(rootA.data.reducer, { parent_source: 'root', thread_source: 'default', categories_source: 'none' });

    const rootB = await start('cursor:b', { activity: { name: 'B root' } }).then(r => r.json());
    assert.equal(rootB.data.activity.parent_id, null);

    const childA = await start('cursor:a', { thread_id: 999, activity: { name: 'A child' } }).then(r => r.json());
    assert.equal(childA.data.activity.parent_id, rootA.data.activity.id);
    assert.equal(childA.data.activity.thread_id, 1);
    assert.equal(childA.data.reducer.parent_source, 'inferred');
    assert.equal(childA.data.reducer.thread_source, 'parent');

    const explicitRoot = await start('cursor:a', { activity: { name: 'A new root', parent_id: null } }).then(r => r.json());
    assert.equal(explicitRoot.data.activity.parent_id, null);

    const trace = await fetch(`${origin}/api/traces/${traceId}`, { headers: headersFor('cursor:a') }).then(r => r.json());
    const names = new Set(trace.data.events.map(event => event.activity.agent_name));
    assert.deepEqual([...names].sort(), [identity.data.name, other.data.name].sort());
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
      agent: { agent_id: 'agent-1', name: 'Grok' },
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
