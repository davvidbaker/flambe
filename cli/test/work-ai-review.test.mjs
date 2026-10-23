import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { LocalStore } from '../src/local/store.mjs';
import { executeCommand } from '../src/local/commands.mjs';
import { createLocalCommandRunner } from '../src/local/reducer.mjs';
import { reducerConfig } from '../src/local/reducer-provider.mjs';
import { listenLocal } from '../src/local/serve.mjs';
import { run as runCli } from '../src/cli.mjs';

const decision = (actions = [], extra = {}) => ({ assessment: 'on_track', direction: 'continue',
  reply: 'Continue the intended work.', rationale: 'The proposed work serves the user intent.', actions, ...extra });
const code = expected => error => error.body?.error?.code === expected;
function fixture(t, { reviewStarts = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-work-ai-'));
  const path = join(dir, 'local.sqlite');
  let store = new LocalStore(path);
  let run;
  const configure = () => { run = createLocalCommandRunner(store, { env: { FLAMBE_LOCAL_REDUCER_MODE: 'agent', FLAMBE_LOCAL_REDUCER_REVIEW_STARTS: String(reviewStarts) },
    fetchImpl() { assert.fail('Work-AI mode must not invoke a provider'); } }); };
  configure();
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { traceId } = store.credentials();
  const attrs = { trace_id: traceId, agent_id: 'test:work-ai' };
  const root = executeCommand(store, 1, 'start', { ...attrs, name: 'Implement the user intent', parent_id: null }).activity_id;
  const call = (command, args = {}) => run(1, command, { ...attrs, ...args });
  return { dir, path, get store() { return store; }, traceId, attrs, root, call,
    review: (args = {}) => call('message', { activity_id: root, message: 'Review scope', ...args }),
    submit: (packet, value = decision(), args = {}) => call('decide', { review_id: packet.review.review_id, decision: value, ...args }),
    reopen() { store.close(); store = new LocalStore(path); configure(); } };
}

test('agent mode needs no model or key and returns context, policy, and schema without inference', async t => {
  assert.deepEqual(reducerConfig({ FLAMBE_LOCAL_REDUCER_MODE: 'agent' }), { mode: 'agent', reviewStarts: false });
  const f = fixture(t);
  const packet = await f.review();
  assert.equal(packet.model_review.status, 'awaiting_decision');
  assert.equal(packet.review.context.current, f.root);
  assert.equal(packet.review.context.instance.id, f.store.instance().id);
  assert.equal(packet.review.context.reviewer_mode, 'agent');
  assert.match(packet.review.instructions, /not an independent reviewer/);
  assert.equal(packet.review.decision_schema.additionalProperties, false);
  assert.equal(JSON.stringify(packet).includes(f.store.credentials().rawToken), false);
  assert.equal(f.store.db.prepare("SELECT COUNT(*) AS n FROM events WHERE phase='reducer_decision'").get().n, 0);
});

test('opted-in flagged lifecycle proposals stay recorded while awaiting the work AI', async t => {
  const f = fixture(t, { reviewStarts: true });
  const result = await f.call('start', { name: 'Check a structural issue', parent_id: null });
  assert.equal(result.model_review.status, 'awaiting_decision');
  assert.equal(f.store.getActivity(1, result.activity_id).name, 'Check a structural issue');
  assert.equal(result.review.context.kind, 'new_root_while_open');
  const applied = await f.submit(result, decision([{ type: 'reparent', activity_id: result.activity_id, parent_activity_id: f.root }]));
  assert.equal(f.store.getActivity(1, result.activity_id).parent_id, f.root);
  assert.equal(applied.reviewer.mode, 'agent');
  assert.equal(applied.reviewer.agent_id, f.attrs.agent_id);
  assert.equal(applied.reducer_model, null);
});

test('a review is scoped to the instance, trace, and agent and requires a stable identity', async t => {
  const f = fixture(t);
  const other = fixture(t);
  const packet = await f.review();
  await assert.rejects(f.review({ agent_id: undefined }), code('AGENT_ID_REQUIRED'));
  await assert.rejects(f.submit(packet, decision(), { agent_id: undefined }), code('AGENT_ID_REQUIRED'));
  for (const args of [{ agent_id: 'another:agent' }, { trace_id: 999 }, { review_id: 'unknown' }]) {
    await assert.rejects(f.submit(packet, decision(), args), code('REVIEW_NOT_FOUND'));
  }
  await assert.rejects(other.submit(packet), code('REVIEW_NOT_FOUND'));
});

test('stale or expired reviews cannot overwrite human edits; a fresh review works', async t => {
  const f = fixture(t);
  const packet = await f.review();
  f.store.updateActivity(1, f.root, { name: 'Human intent clarified' });
  const rename = decision([{ type: 'update_activity', activity_id: f.root, name: 'Reviewed intent', description: null }]);
  await assert.rejects(f.submit(packet, rename), code('REDUCER_STATE_CHANGED'));
  const expired = await f.review();
  f.store.db.prepare('UPDATE reducer_reviews SET created_ms = ? WHERE id = ?').run(Date.now() - 16 * 60_000, expired.review.review_id);
  await assert.rejects(f.submit(expired, rename), code('REVIEW_EXPIRED'));
  assert.equal(f.store.getActivity(1, f.root).name, 'Human intent clarified');
  const fresh = await f.review();
  await f.submit(fresh, rename);
  assert.equal(f.store.getActivity(1, f.root).name, 'Reviewed intent');
});

test('review requests survive restart and identical decision retries cannot duplicate a child', async t => {
  const f = fixture(t);
  const packet = await f.review();
  f.reopen();
  const value = decision([{ type: 'create_child', parent_activity_id: f.root, name: 'Check the result', description: null }]);
  const first = await f.submit(packet, value);
  f.reopen();
  f.store.updateActivity(1, f.root, { name: 'Newer human edit' });
  const repeated = await f.submit(packet, { actions: value.actions, ...value });
  assert.equal(repeated.replayed, true);
  assert.deepEqual(repeated.actions_applied, first.actions_applied);
  assert.equal(repeated.state.activities.find(a => a.id === f.root).name, 'Newer human edit');
  assert.equal(f.store.listUnstarted(f.traceId).filter(a => a.name === 'Check the result').length, 1);
  assert.equal(f.store.db.prepare("SELECT COUNT(*) AS n FROM events WHERE phase='reducer_decision'").get().n, 1);
  await assert.rejects(f.submit(packet, decision()), code('REVIEW_ALREADY_DECIDED'));
  assert.equal(Object.hasOwn(f.store.exportBundle(), 'reducer_reviews'), false);
});

test('decisions reject unbounded, arbitrary, foreign-trace, and cyclic changes', async t => {
  const f = fixture(t);
  const child = executeCommand(f.store, 1, 'start', { ...f.attrs, parent_id: f.root, name: 'Existing child' }).activity_id;
  const foreign = f.store.createTrace(1, 'Separate trace');
  const foreignId = executeCommand(f.store, 1, 'start', { trace_id: foreign.id, name: 'Separate work' }).activity_id;
  const packet = await f.review();
  for (const actions of [
    [{ type: 'delete', activity_id: f.root }],
    [{ type: 'no_op' }, { type: 'no_op' }],
    [{ type: 'update_activity', activity_id: foreignId, name: 'Invalid', description: null }],
    [{ type: 'update_activity', activity_id: f.root, name: 'x'.repeat(256), description: null }],
    [{ type: 'reparent', activity_id: f.root, parent_activity_id: child }],
  ]) await assert.rejects(f.submit(packet, decision(actions)), code('REDUCER_INVALID_DECISION'));
  assert.equal(f.store.getActivity(1, f.root).parent_id, null);
});

test('message review can move current work to its own running parent, never another agent or ended work', async t => {
  const f = fixture(t);
  const parent = executeCommand(f.store, 1, 'start', { ...f.attrs, name: 'Broader intent', parent_id: null }).activity_id;
  const other = executeCommand(f.store, 1, 'start', { ...f.attrs, agent_id: 'other:worker', name: 'Other agent intent', parent_id: null }).activity_id;
  const packet = await f.review();
  await assert.rejects(f.submit(packet, decision([{ type: 'reparent', activity_id: f.root, parent_activity_id: other }])), code('REDUCER_INVALID_DECISION'));
  await f.submit(packet, decision([{ type: 'reparent', activity_id: f.root, parent_activity_id: parent }]));
  assert.equal(f.store.getActivity(1, f.root).parent_id, parent);
  const otherReview = await f.review({ activity_id: other });
  await assert.rejects(f.submit(otherReview, decision([{ type: 'reparent', activity_id: other, parent_activity_id: parent }])), code('REDUCER_INVALID_DECISION'));
  await f.call('end', { activity_id: f.root });
  const endedReview = await f.review();
  await assert.rejects(f.submit(endedReview, decision([{ type: 'reparent', activity_id: f.root, parent_activity_id: parent }])), code('REDUCER_INVALID_DECISION'));
});

test('advice-only is enforced by Single Burner and clarification remains visible', async t => {
  const f = fixture(t);
  const packet = await f.review({ allow_stack_changes: false });
  const applied = await f.submit(packet, decision([{ type: 'update_activity', activity_id: f.root, name: 'Must not apply', description: null }]));
  assert.deepEqual(applied.actions_applied, []);
  assert.equal(f.store.getActivity(1, f.root).name, 'Implement the user intent');
  const question = await f.review();
  const result = await f.submit(question, decision([{ type: 'ask', activity_id: f.root, question: 'Does the user want this scope?' }], { reply: null, direction: 'escalate' }));
  assert.equal(result.reply, 'Does the user want this scope?');
  assert.equal(result.direction, 'escalate');
});

test('a failed receipt write rolls back the action and audit together', async t => {
  const f = fixture(t);
  const packet = await f.review();
  f.store.db.exec("CREATE TRIGGER fail_receipt BEFORE UPDATE ON reducer_reviews BEGIN SELECT RAISE(ABORT, 'test persistence failure'); END");
  const rename = decision([{ type: 'update_activity', activity_id: f.root, name: 'Must be atomic', description: null }]);
  await assert.rejects(f.submit(packet, rename), code('REDUCER_PERSISTENCE_ERROR'));
  assert.equal(f.store.getActivity(1, f.root).name, 'Implement the user intent');
  assert.equal(f.store.db.prepare("SELECT COUNT(*) AS n FROM events WHERE phase='reducer_decision'").get().n, 0);
  assert.equal(f.store.db.prepare('SELECT receipt FROM reducer_reviews WHERE id = ?').get(packet.review.review_id).receipt, null);
  f.store.db.exec('DROP TRIGGER fail_receipt');
  await f.submit(packet, rename);
  assert.equal(f.store.getActivity(1, f.root).name, 'Must be atomic');
});

test('agent MCP discovers the local decision tool, guards instances, and applies the work AI decision', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-agent-mcp-'));
  const local = await listenLocal({ port: 0, dbPath: join(dir, 'local.sqlite'), staticDir: null, reducer: { env: { FLAMBE_LOCAL_REDUCER_MODE: 'agent' } } });
  t.after(async () => { local.server.closeAllConnections(); await new Promise(r => local.server.close(r)); local.store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { rawToken, traceId } = local.store.credentials();
  const args = { trace_id: traceId, expected_instance_id: local.store.instance().id, agent_id: 'test:mcp-work-ai' };
  const rpc = async (method, params) => {
    const response = await fetch(`http://127.0.0.1:${local.port}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${rawToken}`,
      'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    const text = await response.text();
    return (response.headers.get('content-type').includes('text/event-stream')
      ? JSON.parse(text.split('\n').filter(l => l.startsWith('data:')).at(-1).slice(5)) : JSON.parse(text)).result;
  };
  const call = (name, arguments_) => rpc('tools/call', { name: `flambe_${name}`, arguments: { ...args, ...arguments_ } });
  const tools = (await rpc('tools/list', {})).tools;
  assert.equal(tools.length, 9);
  assert.ok(tools.some(tool => tool.name === 'flambe_decide'));
  const start = await call('start', { name: 'MCP work-AI review', parent_id: null });
  const packet = await call('message', { activity_id: start.structuredContent.activity_id, message: 'Review current work' });
  const request = { review_id: packet.structuredContent.review.review_id,
    decision: decision([{ type: 'update_activity', activity_id: start.structuredContent.activity_id, name: 'Reviewed by this AI', description: null }]) };
  assert.equal((await call('decide', { ...request, expected_instance_id: 'wrong' })).structuredContent.code, 'INSTANCE_MISMATCH');
  assert.equal((await call('decide', { ...request, agent_id: 'wrong:agent' })).structuredContent.code, 'REVIEW_NOT_FOUND');
  assert.equal((await call('decide', request)).structuredContent.model_review.status, 'completed');
  assert.equal(local.store.getActivity(1, start.structuredContent.activity_id).name, 'Reviewed by this AI');
  assert.equal((await call('decide', request)).structuredContent.replayed, true);
});

test('CLI exposes pending start reviews and completes message/decide without another model', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-agent-cli-'));
  const local = await listenLocal({ port: 0, dbPath: join(dir, 'local.sqlite'), staticDir: null, reducer: { env: { FLAMBE_LOCAL_REDUCER_MODE: 'agent' } } });
  t.after(async () => { local.server.closeAllConnections(); await new Promise(r => local.server.close(r)); local.store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { rawToken, traceId } = local.store.credentials();
  const env = { FLAMBE_URL: `http://127.0.0.1:${local.port}`, FLAMBE_API_TOKEN: rawToken, FLAMBE_TRACE_ID: String(traceId),
    FLAMBE_RUNTIME_MODE: 'local_self_contained', FLAMBE_AGENT_ID: 'test:cli-work-ai', FLAMBE_AGENT_NAMES_PATH: join(dir, 'names.json'),
    FLAMBE_QUEUE_PATH: join(dir, 'queue.json'), FLAMBE_QUESTIONS_PATH: join(dir, 'questions.json') };
  const cli = async argv => {
    let out = '', err = '';
    await runCli(argv, { env, stdout: { write(s) { out += s; } }, stderr: { write(s) { err += s; } } });
    return { out, err };
  };
  const root = Number((await cli(['start', 'CLI work-AI intent', '--root'])).out.trim());
  const nested = await cli(['start', 'Unrelated investigation']);
  assert.match(nested.out, /^\d+\n$/);
  assert.match(nested.err, /review available/);
  assert.equal(nested.err.includes('decision_schema'), false);
  const packet = JSON.parse((await cli(['message', 'Review the root', '--activity', String(root)])).out);
  const file = join(dir, 'decision.json');
  writeFileSync(file, JSON.stringify(decision([{ type: 'update_activity', activity_id: root, name: 'CLI reviewed intent', description: null }])));
  const result = JSON.parse((await cli(['decide', packet.review.review_id, '--file', file])).out);
  assert.equal(result.model_review.status, 'completed');
  assert.equal(local.store.getActivity(1, root).name, 'CLI reviewed intent');
});


test('routine flagged starts return only a small notice and explicit reviews omit irrelevant history', async t => {
  const f = fixture(t);
  for (let i = 0; i < 20; i++) {
    const id = executeCommand(f.store, 1, 'start', { ...f.attrs, name: `Ended history ${i}`, parent_id: null }).activity_id;
    executeCommand(f.store, 1, 'end', { ...f.attrs, activity_id: id, message: 'Unrelated past details' });
  }
  const otherId = executeCommand(f.store, 1, 'start', { ...f.attrs, agent_id: 'another:worker', name: 'Other agent work', parent_id: null }).activity_id;
  const started = await f.call('start', { name: 'Check a different scope', parent_id: null });
  assert.equal(started.model_review.status, 'available');
  assert.equal(started.review, undefined);
  assert.equal(started.state.scope, 'current_activity_and_own_open_work');
  assert.equal(started.state.activities.some(a => a.name.startsWith('Ended history')), false);
  assert.equal(started.state.activities.some(a => a.id === otherId), false);
  assert.equal(JSON.stringify(started).includes('Unrelated past details'), false);
  assert.equal(f.store.db.prepare('SELECT COUNT(*) AS n FROM reducer_reviews').get().n, 0);
  const packet = await f.review();
  assert.equal(packet.review.context.context_scope, 'current_path_and_own_open_work');
  assert.deepEqual(packet.review.context.stack.map(a => a.id).sort((a,b) => a-b), [f.root, started.activity_id].sort((a,b) => a-b));
  assert.equal(packet.review.context.stack.some(a => a.id === otherId), false);
});


test('compact reviews preserve relevant ancestors and reject cycles through another agent', async t => {
  const f = fixture(t);
  const bridge = executeCommand(f.store, 1, 'start', { ...f.attrs, agent_id: 'other:bridge', parent_id: f.root, name: 'Shared prerequisite' }).activity_id;
  const descendant = executeCommand(f.store, 1, 'start', { ...f.attrs, parent_id: bridge, name: 'Own descendant' }).activity_id;
  const packet = await f.review();
  assert.ok(packet.review.context.stack.some(a => a.id === bridge));
  await assert.rejects(f.submit(packet, decision([{ type: 'reparent', activity_id: f.root, parent_activity_id: descendant }])), code('REDUCER_INVALID_DECISION'));
  assert.equal(f.store.getActivity(1, f.root).parent_id, null);
});
