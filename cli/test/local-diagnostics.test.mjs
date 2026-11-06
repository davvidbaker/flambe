import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createDiagnosticLog } from '../src/local/diagnostics.mjs';
import { LocalStore } from '../src/local/store.mjs';
import { createLocalCommandRunner } from '../src/local/reducer.mjs';
import { createLocalServer, engineVersion, listenLocal } from '../src/local/serve.mjs';

function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-diagnostics-'));
  const store = new LocalStore(join(dir, 'local.sqlite'));
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  const path = join(dir, 'diagnostic.log');
  const log = createDiagnosticLog(path);
  const run = createLocalCommandRunner(store, { env: {}, ...options, diagnostic: log.write });
  const { traceId, rawToken } = store.credentials();
  const attrs = { trace_id: traceId, agent_id: 'test:diagnostics' };
  return { store, path, attrs, rawToken, run,
    call: (command, input = {}) => run(1, command, { ...attrs, ...input }),
    entries: () => readFileSync(path, 'utf8').trim().split('\n').map(JSON.parse) };
}
const decision = actions => ({ assessment: 'on_track', direction: 'continue',
  reply: 'private reply', rationale: 'private reasoning', actions });

test('logs default roots, inherited lanes overriding explicit requests, and explicit roots', async t => {
  const f = fixture(t);
  const lane = f.store.createThread(1, f.attrs.trace_id, { name: 'Engineering' });
  const root = await f.call('start', { name: 'private activity title', description: 'private description', parent_id: null });
  const child = await f.call('start', { name: 'A child', thread_id: lane.id });
  const explicit = await f.call('start', { name: 'Explicit root', parent_id: null, thread_id: lane.id });
  const logs = f.entries();
  const rootLog = logs.find(e => e.event === 'command.completed' && e.activity_id === root.activity_id);
  assert.equal(rootLog.thread_source, 'default');
  assert.equal(rootLog.reducer_mode, 'off');
  assert.equal(rootLog.selected_parent_id, null);
  const childLog = logs.find(e => e.event === 'command.completed' && e.activity_id === child.activity_id);
  assert.equal(childLog.thread_source, 'parent');
  assert.equal(childLog.parent_source, 'inferred');
  assert.equal(childLog.requested_thread_id, lane.id);
  assert.equal(childLog.selected_thread_id, rootLog.selected_thread_id);
  assert.equal(childLog.selected_parent_id, root.activity_id);
  const explicitLog = logs.find(e => e.event === 'command.completed' && e.activity_id === explicit.activity_id);
  assert.equal(explicitLog.thread_source, 'request');
  assert.equal(explicitLog.selected_thread_id, lane.id);
  assert.equal(new Set(logs.slice(0, 3).map(e => e.request_id)).size, 1);
  assert.equal(logs.length, 9);
  const text = readFileSync(f.path, 'utf8');
  for (const secret of [f.rawToken, 'private activity title', 'private description']) assert.equal(text.includes(secret), false);
});

test('logs pending work-AI review and the submitted thread selection', async t => {
  const f = fixture(t, { env: { FLAMBE_LOCAL_REDUCER_MODE: 'agent' } });
  const lane = f.store.createThread(1, f.attrs.trace_id, { name: 'Engineering' });
  const started = await f.call('start', { name: 'New root', parent_id: null });
  const pending = f.entries().find(e => e.event === 'command.completed');
  assert.equal(pending.review_status, 'awaiting_decision');
  assert.equal(pending.thread_selection_requested, true);
  assert.equal(pending.review_id, started.review.review_id);
  await f.call('decide', { review_id: pending.review_id,
    decision: decision([{ type: 'select_thread', activity_id: started.activity_id, thread_id: lane.id }]) });
  const completed = f.entries().at(-1);
  assert.equal(completed.command, 'decide');
  assert.equal(completed.selected_thread_id, lane.id);
  assert.equal(completed.review_status, 'completed');
  assert.equal(completed.review_id, pending.review_id);
  assert.deepEqual(completed.actions_applied, [{ type: 'select_thread', activity_id: started.activity_id, thread_id: lane.id }]);
  const text = readFileSync(f.path, 'utf8');
  assert.equal(text.includes('private reasoning'), false);
  assert.equal(text.includes('private reply'), false);
});

test('logs initial fallback before provider review, final placement, and safe failures', async t => {
  let lane;
  let fail = false;
  const f = fixture(t, { provider: { mode: 'local', model: 'fixture', review: async ({ context }) => {
    if (fail) throw new Error('secret provider credential');
    return decision([{ type: 'select_thread', activity_id: context.current, thread_id: lane.id }]);
  } } });
  lane = f.store.createThread(1, f.attrs.trace_id, { name: 'Engineering' });
  await f.call('start', { name: 'First root', parent_id: null });
  assert.equal(f.entries()[1].thread_source, 'default');
  assert.notEqual(f.entries()[1].selected_thread_id, lane.id);
  assert.equal(f.entries()[2].selected_thread_id, lane.id);
  assert.equal(f.entries()[2].thread_source, 'review');
  fail = true;
  await f.call('start', { name: 'Another root', parent_id: null });
  assert.equal(f.entries().at(-1).review_status, 'failed');
  assert.equal(f.entries().at(-1).review_error_code, 'REDUCER_PROVIDER_ERROR');
  await assert.rejects(f.call('start', { name: '' }));
  assert.equal(f.entries().at(-1).error_code, 'INVALID_INPUT');
  assert.equal(readFileSync(f.path, 'utf8').includes('secret provider credential'), false);
});

test('provider diagnostics report bounded context counts without logging shortened text', async t => {
  const f = fixture(t, { provider: { mode: 'local', model: 'fixture', review: async () => decision([]) } });
  const root = await f.call('start', { name: 'Private intent', parent_id: null });
  f.store.updateActivity(1, root.activity_id, { description: 'private original description '.repeat(4000) });
  await f.call('message', { activity_id: root.activity_id, message: 'private review request' });
  const stats = f.entries().at(-1).review_context;
  assert.ok(stats.bytes <= 65_536);
  assert.ok(stats.source_bytes > 65_536);
  assert.equal(stats.shortened_fields, 1);
  const text = readFileSync(f.path, 'utf8');
  for (const secret of ['Private intent', 'private original description', 'private review request', 'shortened for review']) assert.equal(text.includes(secret), false);
});

test('rotation bounds disk use, sets private permissions, and failed logging does not throw', t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-log-rotation-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'events.log');
  const log = createDiagnosticLog(path, { maxBytes: 150 });
  log.write('first', { id: 1 });
  log.write('second', { id: 2 });
  log.write('third', { id: 3 });
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).event, 'third');
  assert.ok(statSync(`${path}.1`).size <= 150);
  if (process.platform !== 'win32') assert.equal(statSync(path).mode & 0o777, 0o600);
  const warnings = [];
  const bad = createDiagnosticLog(join(path, 'impossible.log'), { warn: message => warnings.push(message) });
  assert.doesNotThrow(() => { bad.write('first'); bad.write('second'); });
  assert.equal(warnings.length, 1);
});

test('log paths cannot overwrite the database, including through rotation', t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-log-path-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const dbPath = join(dir, 'local.sqlite');
  assert.throws(() => createLocalServer({ dbPath, logPath: dbPath }), /must not overwrite/);
  assert.throws(() => createLocalServer({ dbPath: `${dbPath}.1`, logPath: dbPath }), /must not overwrite/);
});

test('broken diagnostic callbacks do not fail committed starts', async t => {
  const f = fixture(t);
  const run = createLocalCommandRunner(f.store, { env: {}, diagnostic() { throw new Error('logging unavailable'); } });
  const started = await run(1, 'start', { ...f.attrs, name: 'Work', parent_id: null });
  assert.ok(f.store.getActivity(1, started.activity_id));
});

test('HTTP commands produce log entries and startup records app and engine versions', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-log-server-'));
  const logPath = join(dir, 'local.sqlite.log');
  const local = await listenLocal({ port: 0, dbPath: join(dir, 'local.sqlite'), staticDir: null,
    reducer: { env: {} }, logPath, appVersion: 'test-version' });
  t.after(async () => {
    await new Promise(resolve => local.server.close(resolve));
    local.store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const { rawToken, traceId } = local.store.credentials();
  const response = await fetch(`http://127.0.0.1:${local.port}/api/agent-commands`, {
    method: 'POST', headers: { authorization: `Bearer ${rawToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ command: 'start', arguments: { trace_id: traceId, agent_id: 'test:http', name: 'Work', parent_id: null } }),
  });
  assert.equal(response.status, 200);
  const text = readFileSync(logPath, 'utf8');
  const entries = text.trim().split('\n').map(JSON.parse);
  assert.equal(entries[0].engine_version, engineVersion);
  assert.equal(entries[0].app_version, 'test-version');
  assert.equal(entries.at(-1).thread_source, 'default');
  assert.equal(text.includes(rawToken), false);
});
