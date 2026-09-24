import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { LocalStore } from '../src/local/store.mjs';
import { executeCommand } from '../src/local/commands.mjs';
import { listenLocal } from '../src/local/serve.mjs';
import { FlambeClient } from '../src/client.mjs';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-commands-'));
  const store = new LocalStore(join(dir, 'local.sqlite'));
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  let timestamp = 100;
  const traceId = store.credentials().traceId;
  const call = (command, attrs = {}, userId = 1) => executeCommand(store, userId, command, {
    trace_id: traceId, agent_id: 'test:a', timestamp: timestamp++, ...attrs,
  });
  const start = (name, attrs = {}) => call('start', { name, ...attrs });
  return { store, traceId, call, start };
}

test('local commands infer each agent stack, inherit categories, and reuse duplicate starts', t => {
  const { store, start, call } = fixture(t);
  const category = store.listCategories(1)[0].id;
  const root = start('Research hosting', { category_ids: [category, category] });
  const other = start('Research hosting', { agent_id: 'test:b' });
  assert.notEqual(other.activity_id, root.activity_id);
  assert.equal(other.state.activities.at(-1).parentId, null);
  const child = start('Research storage', { thread_id: 999 });
  assert.equal(child.state.activities.at(-1).parentId, root.activity_id);
  assert.deepEqual(child.state.activities.at(-1).categoryIds, [category]);
  const duplicate = start('Research storage');
  assert.equal(duplicate.activity_id, child.activity_id);
  assert.equal(duplicate.actions_applied[0].type, 'no_op');
  call('suspend', { activity_id: child.activity_id });
  const resumed = start('Research storage');
  assert.equal(resumed.activity_id, child.activity_id);
  assert.equal(resumed.actions_applied[0].type, 'resume_existing');
  assert.equal(resumed.state.activities.find(a => a.id === child.activity_id).status, 'running');
});

test('parent suspension filters descendants; explicit child start resumes ancestors atomically', t => {
  const { start, call } = fixture(t);
  const root = start('Research root');
  const child = start('Research child');
  call('suspend', { activity_id: root.activity_id });
  assert.equal(call('status', { active_only: true }).state.activities.length, 0);
  assert.deepEqual(call('status', { suspended_only: true }).state.activities.map(a => a.status).sort(),
    ['parent_suspended', 'suspended']);
  const grandchild = start('Research deeper', { parent_id: child.activity_id });
  assert.ok(grandchild.actions_applied.some(a => a.type === 'resume_ancestor' && a.activity_id === root.activity_id));
  assert.ok(grandchild.state.activities.every(a => a.status === 'running'));
});

test('end guards all descendants, force closes deepest first, and child end reports parent', t => {
  const { store, traceId, start, call } = fixture(t);
  const root = start('Research root');
  const child = start('Research child');
  const grandchild = start('Research grandchild');
  const before = store.getTrace(1, traceId).events.length;
  assert.throws(() => call('end', { activity_id: root.activity_id }), e => e.status === 409);
  assert.equal(store.getTrace(1, traceId).events.length, before);
  const ended = call('end', { activity_id: root.activity_id, force: true, message: 'Finished' });
  assert.deepEqual(ended.closed_descendants.map(a => a.activity_id), [grandchild.activity_id, child.activity_id]);
  assert.ok(ended.state.activities.every(a => a.status === 'ended'));
  const next = start('Next root');
  assert.equal(next.state.activities.at(-1).parentId, null);
  const leaf = start('Next leaf');
  assert.equal(call('end', { activity_id: leaf.activity_id }).rules_fired[0].applied.activity_id, next.activity_id);
});

test('invalid writes roll back resumed ancestors and reject cross-trace and cross-user references', t => {
  const { store, traceId, start, call } = fixture(t);
  const root = start('Research root');
  call('suspend', { activity_id: root.activity_id });
  const before = store.getTrace(1, traceId).events.length;
  assert.throws(() => start('Research bad category', { parent_id: root.activity_id, category_ids: [999999] }), e => e.status === 404);
  assert.equal(store.getTrace(1, traceId).events.length, before);
  assert.equal(call('status').state.activities[0].status, 'suspended');
  const otherTrace = store.createTrace(1, 'Another trace');
  assert.throws(() => start('Wrong parent', { trace_id: otherTrace.id, parent_id: root.activity_id }), e => e.status === 404);
  assert.throws(() => call('status', {}, 999), e => e.status === 404);
  for (const attrs of [{ timestamp: 'bad' }, { name: '' }, { category_ids: false }, { parent_id: true }, { force: 'yes' }]) {
    assert.throws(() => start('Invalid', attrs), e => e.status === 422);
  }
  assert.throws(() => call('status', { active_only: true, suspended_only: true }), e => e.status === 422);
});

test('structural reviews are recorded as skipped and local message fails explicitly without a provider', t => {
  const { store, traceId, start, call } = fixture(t);
  start('Research storage');
  const root = start('New root', { parent_id: null });
  assert.equal(root.rules_fired[0].rule, 'new_root_while_open');
  const child = start('Unrelated cooking');
  assert.equal(child.rules_fired[0].rule, 'name_unfit');
  const before = store.getTrace(1, traceId).events.length;
  assert.throws(() => call('message', { message: 'Am I on track?' }),
    e => e.status === 503 && e.body.error.code === 'REDUCER_NOT_CONFIGURED');
  assert.equal(store.getTrace(1, traceId).events.length, before);
});

test('CLI discovers local commands; legacy REST shares the reducer and honors header identity', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-command-http-'));
  const { server, store, port } = await listenLocal({ port: 0, dbPath: join(dir, 'local.sqlite'), staticDir: null });
  t.after(() => { server.close(); store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { rawToken, traceId } = store.credentials();
  const url = `http://127.0.0.1:${port}`;
  const client = new FlambeClient({ baseUrl: url, token: rawToken, traceId, agentId: 'test:a',
    runtimeMode: 'local_self_contained', agentNamesPath: join(dir, 'names.json'), queuePath: join(dir, 'queue.json') });
  assert.equal(await client.supportsAgentCommands(), true);
  const root = await client.start({ name: 'Research root' });
  const child = await client.start({ name: 'Research child' });
  await assert.rejects(client.end({ activityId: root }), /open|descendants/i);
  const response = await fetch(`${url}/api/events`, { method: 'POST', headers: {
    authorization: `Bearer ${rawToken}`, 'content-type': 'application/json', 'x-flambe-agent-id': 'test:a',
  }, body: JSON.stringify({ trace_id: traceId, activity_id: root,
    event: { phase: 'V', message: 'Done', timestamp_integer: Date.now() + 1 } }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.reducer.closed_descendants[0].activity_id, child);
  assert.equal((await client.status({ activeOnly: true })).activities.length, 0);
  const spoof = await fetch(`${url}/api/agent-commands`, { method: 'POST', headers: {
    authorization: `Bearer ${rawToken}`, 'content-type': 'application/json', 'x-flambe-agent-id': 'test:a',
  }, body: JSON.stringify({ command: 'start', arguments: {
    trace_id: traceId, name: 'Header identity', agent_id: 'test:spoof',
  } }) }).then(r => r.json());
  assert.equal(spoof.data.state.activities.at(-1).agentId, 'test:a');
  assert.equal((await fetch(`${url}/api/agent-commands`)).status, 401);
});

test('plan stays out of status until asked, and a matching start begins limbo', t => {
  const { call, start } = fixture(t);
  const planned = call('plan', { name: 'Sit in limbo' });
  const hidden = call('status');
  assert.equal(hidden.state.activities.some(a => a.id === planned.activity_id), false);
  const shown = call('status', { include_unstarted: true });
  assert.equal(shown.state.activities.some(a => a.status === 'unstarted' && a.id === planned.activity_id), true);
  const begun = start('Sit in limbo');
  assert.equal(begun.activity_id, planned.activity_id);
  assert.equal(begun.actions_applied[0].type, 'begin_existing');
});
