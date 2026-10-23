import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import test from 'node:test';
import { LocalStore } from '../src/local/store.mjs';
import { executeCommand } from '../src/local/commands.mjs';
import { createLocalCommandRunner } from '../src/local/reducer.mjs';
import { createReducerProvider, reducerConfig } from '../src/local/reducer-provider.mjs';
import { listenLocal } from '../src/local/serve.mjs';
import { run as runCli } from '../src/cli.mjs';

const decision = (actions = [], extra = {}) => ({ assessment: 'on_track', direction: 'continue',
  reply: 'Keep working on the current task.', rationale: 'The stack matches the requested work.', actions, ...extra });
const hasCode = code => error => error.body?.error?.code === code;
function fixture(t, review = async () => decision()) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-local-reducer-'));
  const store = new LocalStore(join(dir, 'test.sqlite'));
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { traceId, rawToken } = store.credentials();
  const attrs = { trace_id: traceId, agent_id: 'test:reducer' };
  const root = executeCommand(store, 1, 'start', { ...attrs, name: 'Build local reducer', parent_id: null }).activity_id;
  const run = createLocalCommandRunner(store, { provider: { mode: 'local', model: 'fixture', review } });
  const call = (command, args = {}) => run(1, command, { ...attrs, ...args });
  const message = (args = {}) => call('message', { activity_id: root, message: 'Review this work', ...args });
  return { store, traceId, root, attrs, rawToken, call, message };
}

test('off is the default even with ambient provider credentials; invalid opt-ins fail clearly', async t => {
  assert.deepEqual(reducerConfig({ OPENAI_API_KEY: 'unrelated', TYPESAFE_API_KEY: 'unrelated' }), { mode: 'off' });
  const { store, root, attrs } = fixture(t);
  const run = createLocalCommandRunner(store, { env: {}, fetchImpl() { throw new Error('must not call'); } });
  await assert.rejects(run(1, 'message', { ...attrs, activity_id: root, message: 'review' }), hasCode('REDUCER_NOT_CONFIGURED'));
  assert.equal((await run(1, 'end', { ...attrs, activity_id: root })).state.activities[0].status, 'ended');
  for (const env of [{ FLAMBE_LOCAL_REDUCER_MODE: 'typo' }, { FLAMBE_LOCAL_REDUCER_MODE: 'api' },
    { FLAMBE_LOCAL_REDUCER_MODE: 'api', FLAMBE_LOCAL_REDUCER_MODEL: 'chosen' }]) {
    assert.throws(() => reducerConfig(env), hasCode('REDUCER_CONFIG_INVALID'));
  }
});

test('local mode requires loopback and ignores API keys; API mode requires explicit HTTPS credentials', () => {
  const local = { FLAMBE_LOCAL_REDUCER_MODE: 'local', FLAMBE_LOCAL_REDUCER_MODEL: 'installed-model' };
  const api = { FLAMBE_LOCAL_REDUCER_MODE: 'api', FLAMBE_LOCAL_REDUCER_MODEL: 'chosen', FLAMBE_LOCAL_REDUCER_API_KEY: 'secret' };
  assert.equal(reducerConfig(local).endpoint, 'http://127.0.0.1:11434/api/chat');
  assert.equal(reducerConfig({ ...local, FLAMBE_LOCAL_REDUCER_API_KEY: 'ignored' }).apiKey, undefined);
  assert.equal(reducerConfig(api).endpoint, 'https://api.openai.com/v1/responses');
  for (const url of ['https://remote.example/', 'http://127.0.0.1.evil.example/', 'file:///tmp/model', 'http://user:secret@localhost/', 'http://localhost/?token=secret']) {
    assert.throws(() => reducerConfig({ ...local, FLAMBE_LOCAL_REDUCER_BASE_URL: url }), hasCode('REDUCER_CONFIG_INVALID'));
  }
  assert.throws(() => reducerConfig({ ...local, FLAMBE_LOCAL_REDUCER_MODEL: 'model:cloud' }), hasCode('REDUCER_CONFIG_INVALID'));
  assert.throws(() => reducerConfig({ ...api, FLAMBE_LOCAL_REDUCER_BASE_URL: 'http://remote.example/v1' }), hasCode('REDUCER_CONFIG_INVALID'));
});

test('message review sends bounded trace context without credentials and records advice without reopening work', async t => {
  let input;
  const f = fixture(t, async request => { input = request; return decision(); });
  const response = await f.message();
  assert.equal(response.direction, 'continue');
  assert.deepEqual(response.model_review, { mode: 'local', status: 'completed' });
  assert.equal(response.state.activities[0].latestEvent.phase, 'B');
  assert.equal(input.context.current, f.root);
  assert.equal(input.context.instance.name, 'Single Burner');
  assert.equal(JSON.stringify(input).includes(f.rawToken), false);
  assert.equal(f.store.db.prepare("SELECT COUNT(*) AS n FROM events WHERE phase IN ('reducer_incoming','reducer_decision')").get().n, 2);
});

test('authorization and input validation happen before model calls', async t => {
  let calls = 0;
  const f = fixture(t, async () => { calls++; return decision(); });
  await assert.rejects(f.message({ trace_id: 999 }), hasCode('NOT_FOUND'));
  await assert.rejects(f.message({ activity_id: 999 }), hasCode('NOT_FOUND'));
  await assert.rejects(f.message({ message: '' }), hasCode('INVALID_INPUT'));
  await assert.rejects(f.message({ allow_stack_changes: 'false' }), hasCode('INVALID_INPUT'));
  assert.equal(calls, 0);
});

test('advice-only suppresses otherwise valid model mutations', async t => {
  let root;
  const f = fixture(t, async () => decision([{ type: 'update_activity', activity_id: root, name: 'Changed', description: null }]));
  root = f.root;
  const result = await f.message({ allow_stack_changes: false });
  assert.deepEqual(result.actions_applied, []);
  assert.equal(f.store.getActivity(1, root).name, 'Build local reducer');
});

test('validated review can rename work or create an unstarted child in the same trace', async t => {
  let actions;
  const f = fixture(t, async () => decision(actions));
  actions = [{ type: 'update_activity', activity_id: f.root, name: 'Build optional local reducer', description: 'Clarified' }];
  await f.message();
  assert.equal(f.store.getActivity(1, f.root).name, 'Build optional local reducer');
  actions = [{ type: 'create_child', parent_activity_id: f.root, name: 'Verify model timeout', description: null }];
  const result = await f.message();
  const id = result.actions_applied[0].activity_id;
  assert.equal(f.store.getActivity(1, id).parent_id, f.root);
  assert.ok(f.store.listUnstarted(f.traceId).some(a => a.id === id));
});

test('untrusted model actions cannot target another trace, execute arbitrary operations, or exceed limits', async t => {
  let actions;
  const f = fixture(t, async () => decision(actions));
  const otherTrace = f.store.createTrace(1, 'Other history');
  const otherId = executeCommand(f.store, 1, 'start', { trace_id: otherTrace.id, name: 'Other work' }).activity_id;
  for (const rejected of [
    [{ type: 'update_activity', activity_id: otherId, name: 'Stolen', description: null }],
    [{ type: 'delete', activity_id: f.root }],
    [{ type: 'update_activity', activity_id: f.root, name: 'x'.repeat(256), description: null }],
    [{ type: 'no_op', url: 'https://attacker.example' }],
    [{ type: 'no_op' }, { type: 'no_op' }],
    [{ type: 'reparent', activity_id: f.root, parent_activity_id: otherId }],
  ]) {
    actions = rejected;
    await assert.rejects(f.message(), hasCode('REDUCER_INVALID_DECISION'));
  }
  assert.equal(f.store.getActivity(1, otherId).name, 'Other work');
  assert.equal(f.store.getActivity(1, f.root).name, 'Build local reducer');
});

test('a concurrent human edit invalidates the model snapshot without locking SQLite during inference', async t => {
  let resolve;
  let entered;
  const pending = new Promise(r => { entered = r; });
  const f = fixture(t, () => { entered(); return new Promise(r => { resolve = r; }); });
  const request = f.message();
  await pending;
  f.store.updateActivity(1, f.root, { name: 'Human chose this name' });
  resolve(decision([{ type: 'update_activity', activity_id: f.root, name: 'Stale model name', description: null }]));
  await assert.rejects(request, hasCode('REDUCER_STATE_CHANGED'));
  assert.equal(f.store.getActivity(1, f.root).name, 'Human chose this name');
});

test('model changes and audit events roll back together if persistence fails', async t => {
  let root;
  const f = fixture(t, async () => decision([{ type: 'update_activity', activity_id: root, name: 'Must roll back', description: null }]));
  root = f.root;
  const original = f.store.createEvent.bind(f.store);
  f.store.createEvent = (userId, opts) => {
    if (opts.event.phase === 'reducer_decision') throw new Error('disk failure');
    return original(userId, opts);
  };
  await assert.rejects(f.message(), hasCode('REDUCER_PROVIDER_ERROR'));
  assert.equal(f.store.getActivity(1, root).name, 'Build local reducer');
  assert.equal(f.store.db.prepare("SELECT COUNT(*) AS n FROM events WHERE phase='reducer_incoming'").get().n, 0);
});

test('flagged starts receive structural judgment; normal lifecycle events do not require a model', async t => {
  let calls = 0;
  let root;
  const f = fixture(t, async ({ context }) => {
    calls++;
    return decision([{ type: 'reparent', activity_id: context.current, parent_activity_id: root }]);
  });
  root = f.root;
  const started = await f.call('start', { name: 'Review local reducer', parent_id: null });
  assert.equal(started.state.activities.find(a => a.id === started.activity_id).parentId, root);
  assert.equal(started.model_review.status, 'completed');
  await f.call('suspend', { activity_id: started.activity_id });
  await f.call('resume', { activity_id: started.activity_id });
  await f.call('end', { activity_id: started.activity_id });
  assert.equal(calls, 1);
});

test('provider failure preserves a flagged start and returns an explicit review failure', async t => {
  const f = fixture(t, async () => { throw new Error('secret upstream error'); });
  const result = await f.call('start', { name: 'Another root', parent_id: null });
  assert.equal(result.state.activities.find(a => a.id === result.activity_id).status, 'running');
  assert.equal(result.model_review.status, 'failed');
  assert.equal(JSON.stringify(result).includes('secret upstream error'), false);
  assert.equal((await f.call('end', { activity_id: result.activity_id })).state.activities.find(a => a.id === result.activity_id).status, 'ended');
});

test('structural clarification returns an ask action and preserves the recorded child', async t => {
  const f = fixture(t, async ({ context }) => decision([
    { type: 'ask', activity_id: context.current, question: 'How does billing relate to this reducer work?' },
  ], { reply: null, direction: 'investigate' }));
  const result = await f.call('start', { name: 'Investigate billing', parent_id: f.root });
  assert.equal(result.actions_applied[0].type, 'ask');
  assert.equal(result.reply, 'How does billing relate to this reducer work?');
  assert.equal(result.state.activities.find(a => a.id === result.activity_id).parentId, f.root);
});

test('too-large context fails before network access while preserving lifecycle work', async t => {
  let calls = 0;
  const f = fixture(t, async () => { calls++; return decision(); });
  f.store.updateActivity(1, f.root, { description: 'x'.repeat(70_000) });
  await assert.rejects(f.message(), hasCode('REDUCER_CONTEXT_TOO_LARGE'));
  const result = await f.call('start', { name: 'Another local root', parent_id: null });
  assert.equal(result.model_review.code, 'REDUCER_CONTEXT_TOO_LARGE');
  assert.equal(result.state.activities.find(a => a.id === result.activity_id).status, 'running');
  assert.equal(calls, 0);
});

test('CLI shows a structural-review failure without failing or repeating the recorded start', async t => {
  const f = fixture(t);
  let out = '';
  let err = '';
  let starts = 0;
  const client = { start: async function () {
    starts++;
    this.onReducerNote({ type: 'command_result', activityId: 2, actionsApplied: [],
      modelReview: { status: 'failed', code: 'REDUCER_TIMEOUT', message: 'AI review timed out.' } });
    return 2;
  } };
  await runCli(['start', 'Test review failure'], { client, env: { FLAMBE_TRACE_ID: String(f.traceId) },
    questionsPath: join(tmpdir(), `flambe-review-question-${f.root}-${Date.now()}.json`),
    stdout: { write(s) { out += s; } }, stderr: { write(s) { err += s; } } });
  assert.equal(out, '2\n');
  assert.match(err, /REDUCER_TIMEOUT.*Recorded work was preserved/);
  assert.equal(starts, 1);
});

for (const mode of ['api', 'local']) {
  test(`${mode} provider uses the explicit endpoint and structured format without leaking secrets into context`, async () => {
    const config = reducerConfig({ FLAMBE_LOCAL_REDUCER_MODE: mode, FLAMBE_LOCAL_REDUCER_MODEL: 'test-model', FLAMBE_LOCAL_REDUCER_API_KEY: 'fixture-secret' });
    let request;
    const provider = createReducerProvider(config, { fetchImpl: async (url, init) => {
      request = { url, ...init, body: JSON.parse(init.body) };
      return Response.json(mode === 'api' ? { output: [{ content: [{ type: 'output_text', text: JSON.stringify(decision()) }] }] }
        : { done: true, message: { content: JSON.stringify(decision()) } });
    } });
    assert.deepEqual(await provider.review({ system: 'Policy', context: { message: 'Review' }, schema: { type: 'object' } }), decision());
    assert.equal(request.redirect, 'error');
    assert.equal(JSON.stringify(request.body).includes('fixture-secret'), false);
    assert.equal(request.headers.authorization, mode === 'api' ? 'Bearer fixture-secret' : undefined);
    if (mode === 'api') { assert.equal(request.body.store, false); assert.equal(request.body.text.format.strict, true); }
    else { assert.equal(request.body.stream, false); assert.deepEqual(request.body.format, { type: 'object' }); }
  });
}

test('provider errors are sanitized and oversized or invalid responses fail closed', async () => {
  const config = reducerConfig({ FLAMBE_LOCAL_REDUCER_MODE: 'local', FLAMBE_LOCAL_REDUCER_MODEL: 'fixture' });
  for (const response of [Response.json({ error: 'credential echoed here' }, { status: 401 }),
    new Response('x'.repeat(1_048_577)), Response.json({ message: { content: 'not JSON' } })]) {
    const provider = createReducerProvider(config, { fetchImpl: async () => response });
    await assert.rejects(provider.review({ system: '', context: {}, schema: {} }), error => {
      assert.equal(JSON.stringify(error.body).includes('credential echoed here'), false);
      return hasCode('REDUCER_PROVIDER_ERROR')(error);
    });
  }
});

test('timeouts include response-body reads; local model redirects are never followed', async t => {
  let redirected = 0;
  const server = http.createServer((req, res) => {
    if (req.url === '/redirect/api/chat') { res.writeHead(302, { location: '/destination' }); res.end(); }
    else if (req.url === '/destination') { redirected++; res.end('{}'); }
    else { res.writeHead(200); res.flushHeaders(); res.write('{'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(r => server.close(r)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const env = { FLAMBE_LOCAL_REDUCER_MODE: 'local', FLAMBE_LOCAL_REDUCER_MODEL: 'fixture', FLAMBE_LOCAL_REDUCER_TIMEOUT_MS: '100' };
  const hung = createReducerProvider(reducerConfig({ ...env, FLAMBE_LOCAL_REDUCER_BASE_URL: base }));
  await assert.rejects(hung.review({ system: '', context: {}, schema: {} }), hasCode('REDUCER_TIMEOUT'));
  const redirect = createReducerProvider(reducerConfig({ ...env, FLAMBE_LOCAL_REDUCER_TIMEOUT_MS: '1000', FLAMBE_LOCAL_REDUCER_BASE_URL: base + '/redirect/' }));
  await assert.rejects(redirect.review({ system: '', context: {}, schema: {} }), hasCode('REDUCER_PROVIDER_ERROR'));
  assert.equal(redirected, 0);
});

test('REST and MCP share configured review; mismatched instances cannot invoke a provider', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-reducer-transport-'));
  let calls = 0;
  const local = await listenLocal({ port: 0, dbPath: join(dir, 'test.sqlite'), staticDir: null,
    reducer: { provider: { mode: 'local', model: 'fixture', review: async () => { calls++; return decision(); } } } });
  t.after(async () => { local.server.closeAllConnections(); await new Promise(r => local.server.close(r)); local.store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { rawToken, traceId } = local.store.credentials();
  const root = executeCommand(local.store, 1, 'start', { trace_id: traceId, name: 'Transport test' }).activity_id;
  const base = `http://127.0.0.1:${local.port}`;
  const headers = { authorization: `Bearer ${rawToken}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const capability = await (await fetch(base + '/api/agent-commands', { headers })).json();
  assert.equal(capability.data.model_review, true);
  assert.equal(capability.data.reducer.mode, 'local');
  const args = { trace_id: traceId, activity_id: root, message: 'Review transport' };
  const rest = await (await fetch(base + '/api/agent-commands', { method: 'POST', headers,
    body: JSON.stringify({ command: 'message', arguments: args }) })).json();
  assert.equal(rest.data.direction, 'continue');
  for (const expected of ['wrong-instance', local.store.instance().id]) {
    const response = await fetch(base + '/mcp', { method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: {
        name: 'flambe_message', arguments: { ...args, expected_instance_id: expected } } }) });
    const body = await response.text();
    const parsed = response.headers.get('content-type').includes('text/event-stream')
      ? JSON.parse(body.split('\n').filter(l => l.startsWith('data:')).at(-1).slice(5)) : JSON.parse(body);
    if (expected === 'wrong-instance') assert.equal(parsed.result.structuredContent.code, 'INSTANCE_MISMATCH');
    else assert.equal(parsed.result.structuredContent.direction, 'continue');
  }
  assert.equal(calls, 2);
});


test('legacy agent starts report review failure without losing the recorded activity', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-reducer-legacy-'));
  const local = await listenLocal({ port: 0, dbPath: join(dir, 'test.sqlite'), staticDir: null,
    reducer: { provider: { mode: 'local', model: 'fixture', review: async () => { throw new Error('unavailable'); } } } });
  t.after(async () => { local.server.closeAllConnections(); await new Promise(r => local.server.close(r)); local.store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { rawToken, traceId } = local.store.credentials();
  executeCommand(local.store, 1, 'start', { trace_id: traceId, name: 'Existing root', agent_id: 'test:legacy' });
  const response = await fetch(`http://127.0.0.1:${local.port}/api/activities`, {
    method: 'POST', headers: { authorization: `Bearer ${rawToken}`, 'content-type': 'application/json', 'x-flambe-agent-id': 'test:legacy' },
    body: JSON.stringify({ trace_id: traceId, activity: { name: 'New root', parent_id: null }, event: { phase: 'B' } }),
  });
  assert.equal(response.status, 201);
  const { data } = await response.json();
  assert.equal(data.model_review.status, 'failed');
  assert.equal(data.model_review.code, 'REDUCER_PROVIDER_ERROR');
  assert.equal(data.activity.name, 'New root');
  assert.equal(local.store.db.prepare('SELECT COUNT(*) AS n FROM activities WHERE name = ?').get('New root').n, 1);
});
