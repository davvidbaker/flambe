import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { createCodexProvider, codexLoginHelp, codexVersion, resolveCodexRuntime } from '../src/local/codex-provider.mjs';
import { createReducerProvider, reducerConfig } from '../src/local/reducer-provider.mjs';
import { createLocalCommandRunner } from '../src/local/reducer.mjs';
import { LocalStore } from '../src/local/store.mjs';
import { executeCommand } from '../src/local/commands.mjs';
import { listenLocal } from '../src/local/serve.mjs';
import { schema, system } from '../src/local/reducer-review.mjs';

const hasCode = code => problem => problem.body?.error?.code === code;
const decision = actions => ({ assessment: 'on_track', direction: 'continue', reply: 'Keep working.', rationale: 'Fixture review.', actions });
const fakeSource = `
import { readFileSync, writeFileSync } from 'node:fs';
const [mode, capture, ...args] = process.argv.slice(2);
let text = ''; for await (const chunk of process.stdin) text += chunk;
const context = JSON.parse(text);
const schemaPath = args[args.indexOf('--output-schema') + 1];
const policyArg = args.find(arg => arg.startsWith('model_instructions_file='));
writeFileSync(capture, JSON.stringify({ args, context, env: process.env, cwd: process.cwd(),
  schema: JSON.parse(readFileSync(schemaPath, 'utf8')), policy: readFileSync(JSON.parse(policyArg.slice(policyArg.indexOf('=')+1)), 'utf8') }));
const emit = event => process.stdout.write(JSON.stringify(event) + '\\n');
if (mode === 'timeout') { setInterval(() => {}, 1000); }
else if (mode === 'auth') { process.stderr.write('401 Unauthorized secret-token-value'); process.exitCode = 1; }
else if (mode === 'expired') { emit({type:'turn.failed',error:{message:'refresh_token_expired'}}); }
else if (mode === 'exit') { process.stderr.write('secret-token-value'); process.exitCode = 1; }
else if (mode === 'overflow') { process.stdout.write('x'.repeat(1048577)); }
else if (mode === 'tool') { emit({type:'item.started',item:{type:'command_execution',command:'do not log this private command'}}); setInterval(() => {}, 1000); }
else if (mode === 'badstream') { process.stdout.write('not JSON\\n'); }
else if (mode === 'nullstream') { process.stdout.write('null\\n'); }
else {
 let actions = [];
 if (context.thread_selection) actions = [{type:'select_thread', activity_id:context.current, thread_id:context.threads.at(-1).id}];
 else if (context.kind === 'new_root_while_open') actions = [{type:'reparent', activity_id:context.current, parent_activity_id:context.reparent_candidates[0]}];
 else if (context.message === 'Create necessary child') actions = [{type:'create_child',parent_activity_id:context.current,name:'Verify reducer',description:null}];
 else if (context.message === 'Rename current activity') actions = [{type:'update_activity',activity_id:context.current,name:'Clarified intent',description:null}];
 else if (context.message === 'Ask structural question') actions = [{type:'ask',activity_id:context.current,question:'How does this relate to the root intent?'}];
 const result={assessment:'on_track',direction:context.message==='Drift check'?'narrow_scope':'continue',reply:'Keep working.',rationale:'Fixture review.',actions};
 if (mode === 'malicious') result.actions=[{type:'delete',activity_id:context.current}];
 if(mode==='warning') emit({type:'item.completed',item:{type:'error',message:'Nonfatal runtime warning'}});
 emit({type:'thread.started',thread_id:'independent-fixture'});
 emit({type:'item.completed',item:{type:'agent_message',text:mode==='invalid'?'bad JSON':JSON.stringify(result)}});
 if(mode!=='incomplete') emit({type:'turn.completed',usage:{input_tokens:12,cached_input_tokens:3,output_tokens:4,secret:'never retain'}});
}
`;
function fixture(t, mode = 'success', overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-codex-test-'));
  const cleanups = [];
  t.after(async () => {
    try { for (const cleanup of cleanups.reverse()) await cleanup(); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });
  const script = join(dir, 'fake-codex.mjs');
  const capture = join(dir, 'capture.json');
  writeFileSync(script, fakeSource);
  const home = join(dir, 'reducer-profile');
  const env = { HOME: dir, PATH: process.env.PATH, CODEX_HOME: join(dir, 'worker-codex'),
    FLAMBE_LOCAL_REDUCER_MODE: 'codex', FLAMBE_LOCAL_REDUCER_MODEL: 'chosen-model', FLAMBE_LOCAL_CODEX_HOME: home,
    FLAMBE_API_TOKEN: 'secret-flambe-token', OPENAI_API_KEY: 'unrelated-provider-key', CODEX_API_KEY: 'unrelated-codex-key',
    CODEX_THREAD_ID: 'worker-thread', FLAMBE_AGENT_ID: 'worker-agent', ...overrides };
  const config = reducerConfig(env);
  const codexRuntime = { file: process.execPath, args: [script, mode, capture] };
  const options = { env, codexRuntime };
  return { dir, home, config, options, capture, cleanup: fn => cleanups.push(fn),
    provider: createReducerProvider(config, options),
    captured: () => JSON.parse(readFileSync(capture, 'utf8')) };
}
const request = { system, schema, context: { kind: 'message', current: 1, message: 'Review', stack: [] } };

test('Codex is explicit, requires a model, ignores API settings, and validates timeout/profile isolation', t => {
  const f = fixture(t);
  assert.equal(f.config.mode, 'codex');
  assert.equal(f.config.model, 'chosen-model');
  assert.equal(f.config.codexHome, f.home);
  assert.equal(f.config.apiKey, undefined);
  assert.equal(f.config.endpoint, undefined);
  assert.throws(() => reducerConfig({ FLAMBE_LOCAL_REDUCER_MODE: 'codex' }), hasCode('REDUCER_CONFIG_INVALID'));
  assert.throws(() => reducerConfig({ FLAMBE_LOCAL_REDUCER_MODE: 'codex', FLAMBE_LOCAL_REDUCER_MODEL: 'chosen', FLAMBE_LOCAL_REDUCER_TIMEOUT_MS: '0' }), hasCode('REDUCER_CONFIG_INVALID'));
  for (const home of [f.dir, join(f.dir, '.codex'), f.options.env.CODEX_HOME]) {
    assert.throws(() => createCodexProvider({ ...f.config, codexHome: home }, f.options), hasCode('REDUCER_CONFIG_INVALID'));
  }
  assert.deepEqual(reducerConfig({ CODEX_HOME: f.home, CODEX_API_KEY: 'ambient' }), { mode: 'off' });
});

test('fresh independent Codex process receives only bounded context, schema, policy and an isolated environment', async t => {
  const f = fixture(t);
  let usage;
  assert.deepEqual(await f.provider.review({ ...request, onUsage: value => { usage = value; } }), decision([]));
  const captured = f.captured();
  assert.deepEqual(captured.context, request.context);
  assert.deepEqual(captured.schema, schema);
  assert.equal(captured.policy, system);
  assert.equal(captured.env.CODEX_HOME, f.home);
  for (const key of ['FLAMBE_API_TOKEN', 'FLAMBE_AGENT_ID', 'CODEX_THREAD_ID', 'OPENAI_API_KEY', 'CODEX_API_KEY']) assert.equal(captured.env[key], undefined);
  for (const flag of ['--ephemeral', '--ignore-user-config', '--ignore-rules', '--strict-config', '--skip-git-repo-check']) assert.ok(captured.args.includes(flag));
  assert.ok(captured.args.includes('read-only'));
  assert.ok(captured.args.includes('model_reasoning_effort="low"'));
  assert.ok(captured.args.includes('features.hooks=false'));
  assert.ok(captured.args.includes('features.shell_tool=false'));
  assert.ok(captured.args.includes('features.skip_host_skill_discovery=true'));
  assert.equal(captured.args.includes('resume'), false);
  assert.equal(existsSync(captured.cwd), false, 'per-review context files are removed after completion');
  assert.equal(usage.input_tokens, 12);
  assert.equal(usage.output_tokens, 4);
  assert.equal(usage.runtime_version, codexVersion);
  assert.equal(usage.secret, undefined);
  assert.ok(usage.duration_ms >= 0);
});

for (const [mode, code] of [['timeout', 'REDUCER_TIMEOUT'], ['tool', 'REDUCER_CODEX_TOOL_CALL'],
  ['overflow', 'REDUCER_PROVIDER_ERROR'], ['auth', 'REDUCER_CODEX_AUTH_REQUIRED'], ['expired', 'REDUCER_CODEX_AUTH_REQUIRED'], ['exit', 'REDUCER_PROVIDER_ERROR'],
  ['badstream', 'REDUCER_PROVIDER_ERROR'], ['nullstream', 'REDUCER_PROVIDER_ERROR'], ['invalid', 'REDUCER_PROVIDER_ERROR'], ['incomplete', 'REDUCER_PROVIDER_ERROR']]) {
  test(`Codex ${mode} fails safely without exposing stderr, prompts, or commands`, async t => {
    const f = fixture(t, mode, { FLAMBE_LOCAL_REDUCER_TIMEOUT_MS: mode === 'timeout' ? '300' : '3000' });
    await assert.rejects(f.provider.review(request), problem => {
      assert.equal(JSON.stringify(problem.body).includes('secret-token-value'), false);
      assert.equal(JSON.stringify(problem.body).includes('private command'), false);
      return hasCode(code)(problem);
    });
    if (existsSync(f.capture)) assert.equal(existsSync(f.captured().cwd), false);
  });
}

test('login help quotes custom profiles and restores PowerShell CODEX_HOME', () => {
  assert.ok(codexLoginHelp("/tmp/reducer's profile", 'darwin').includes(`CODEX_HOME='/tmp/reducer'"'"'s profile' npx`));
  const windows = codexLoginHelp("C:\\Users\\O'Brien\\reducer", 'win32');
  assert.ok(windows.includes("'C:\\Users\\O''Brien\\reducer'"));
  assert.ok(windows.includes('finally { $env:CODEX_HOME = $previousCodexHome }'));
});

test('auth failures include the configured login command and warn once until recovery', async t => {
  const f = fixture(t, 'expired');
  const warnings = [];
  const provider = createCodexProvider(f.config, { ...f.options, warn: text => warnings.push(text) });
  for (let i = 0; i < 2; i++) {
    await assert.rejects(provider.review(request), problem => {
      assert.ok(problem.body.error.message.includes(`CODEX_HOME='${f.home}'`));
      assert.ok(problem.body.error.message.includes('--device-auth'));
      return hasCode('REDUCER_CODEX_AUTH_REQUIRED')(problem);
    });
  }
  assert.equal(warnings.length, 1);
  assert.ok(warnings[0].includes('missing or expired'));
  writeFileSync(join(f.dir, 'fake-codex.mjs'), fakeSource.replace("mode === 'expired'", "mode === 'never'"));
  await provider.review(request);
  writeFileSync(join(f.dir, 'fake-codex.mjs'), fakeSource);
  await assert.rejects(provider.review(request), hasCode('REDUCER_CODEX_AUTH_REQUIRED'));
  assert.equal(warnings.length, 2);
});

test('Codex nonfatal warning items do not abort a successful review', async t => {
  const f = fixture(t, 'warning');
  assert.deepEqual(await f.provider.review(request), decision([]));
});

test('dedicated profile instructions fail closed, including files added after server startup', async t => {
  const f = fixture(t);
  mkdirSync(f.home, { recursive: true });
  writeFileSync(join(f.home, 'AGENTS.md'), 'Must never enter the review context');
  await assert.rejects(f.provider.review(request), hasCode('REDUCER_CONFIG_INVALID'));
  assert.equal(existsSync(f.capture), false);
  assert.throws(() => createCodexProvider(f.config, f.options), hasCode('REDUCER_CONFIG_INVALID'));
});

test('spawn errors are sanitized and missing Codex does not affect other provider modes', async t => {
  const f = fixture(t);
  const provider = createCodexProvider(f.config, { ...f.options, codexRuntime: { file: join(f.dir, 'missing-executable'), args: [] } });
  await assert.rejects(provider.review(request), hasCode('REDUCER_CODEX_UNAVAILABLE'));
  assert.equal(createReducerProvider({ mode: 'off' }).mode, 'off');
});

function reducerFixture(t, mode = 'success') {
  const f = fixture(t, mode);
  const store = new LocalStore(join(f.dir, 'local.sqlite'));
  f.cleanup(() => store.close());
  const { traceId } = store.credentials();
  const attrs = { trace_id: traceId, agent_id: 'test:codex-provider' };
  const root = executeCommand(store, 1, 'start', { ...attrs, name: 'Preserve root intent', parent_id: null }).activity_id;
  const run = createLocalCommandRunner(store, f.options);
  return { ...f, store, root, traceId, call: (command, values = {}) => run(1, command, { ...attrs, ...values }) };
}

test('Codex reviews worker messages, returns direction, clarifies work and creates unstarted children without decide', async t => {
  const f = reducerFixture(t);
  const drift = await f.call('message', { activity_id: f.root, message: 'Drift check' });
  assert.equal(drift.direction, 'narrow_scope');
  assert.equal(drift.model_review.mode, 'codex');
  assert.equal(drift.model_review.status, 'completed');
  assert.equal(drift.review, undefined);
  assert.equal(drift.reviewer.usage.input_tokens, 12);
  const rename = await f.call('message', { activity_id: f.root, message: 'Rename current activity' });
  assert.equal(rename.actions_applied[0].type, 'update_activity');
  assert.equal(f.store.getActivity(1, f.root).name, 'Clarified intent');
  const child = await f.call('message', { activity_id: f.root, message: 'Create necessary child' });
  assert.ok(f.store.listUnstarted(f.traceId).some(a => a.id === child.actions_applied[0].activity_id));
});

test('Codex structural review corrects a flagged root and initial thread selection is server-owned', async t => {
  const f = reducerFixture(t);
  const corrected = await f.call('start', { name: 'Root intent follow-up', parent_id: null });
  assert.equal(f.store.getActivity(1, corrected.activity_id).parent_id, f.root);
  assert.equal(corrected.model_review.status, 'completed');
  await f.call('end', { activity_id: corrected.activity_id });
  await f.call('end', { activity_id: f.root });
  const lane = f.store.createThread(1, f.traceId, { name: 'Engineering' });
  const placed = await f.call('start', { name: 'Engineering work', parent_id: null });
  assert.equal(f.store.getActivity(1, placed.activity_id).thread_id, lane.id);
  assert.equal(placed.actions_applied[0].type, 'select_thread');
});

test('Codex decisions still pass through action validation and advice-only enforcement', async t => {
  const f = reducerFixture(t);
  await f.call('message', { activity_id: f.root, message: 'Rename current activity', allow_stack_changes: false });
  assert.equal(f.store.getActivity(1, f.root).name, 'Preserve root intent');
  const bad = reducerFixture(t, 'malicious');
  await assert.rejects(bad.call('message', { activity_id: bad.root, message: 'Review' }), hasCode('REDUCER_INVALID_DECISION'));
  assert.ok(bad.store.getActivity(1, bad.root));
});

test('human edits during independent Codex inference win over a stale model correction', async t => {
  const f = reducerFixture(t);
  const run = createLocalCommandRunner(f.store, { ...f.options, spawnImpl: (...args) => {
    const child = spawn(...args);
    f.store.updateActivity(1, f.root, { name: 'Human correction' });
    return child;
  } });
  await assert.rejects(run(1, 'message', { trace_id: f.traceId, agent_id: 'test:codex-provider',
    activity_id: f.root, message: 'Rename current activity' }), hasCode('REDUCER_STATE_CHANGED'));
  assert.equal(f.store.getActivity(1, f.root).name, 'Human correction');
});

test('Codex failure preserves a committed start; ordinary lifecycle work does not invoke Codex', async t => {
  const f = reducerFixture(t, 'exit');
  await f.call('suspend', { activity_id: f.root });
  await f.call('resume', { activity_id: f.root });
  assert.equal(existsSync(f.capture), false);
  const start = await f.call('start', { name: 'Flagged root', parent_id: null });
  assert.equal(start.model_review.status, 'failed');
  assert.equal(start.model_review.code, 'REDUCER_PROVIDER_ERROR');
  assert.ok(f.store.getActivity(1, start.activity_id));
});

test('HTTP and MCP commands share independent Codex review and safe usage diagnostics', async t => {
  const f = fixture(t);
  const logPath = join(f.dir, 'diagnostic.log');
  const local = await listenLocal({ port: 0, dbPath: join(f.dir, 'local.sqlite'), staticDir: null, reducer: f.options, logPath });
  f.cleanup(async () => {
    local.server.closeAllConnections();
    await new Promise(resolve => local.server.close(resolve));
    local.store.close();
  });
  const { rawToken, traceId } = local.store.credentials();
  const attrs = { trace_id: traceId, agent_id: 'test:codex-network' };
  const root = executeCommand(local.store, 1, 'start', { ...attrs, name: 'Preserve root intent', parent_id: null }).activity_id;
  const headers = { authorization: `Bearer ${rawToken}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const origin = `http://127.0.0.1:${local.port}`;
  const httpResponse = await fetch(`${origin}/api/agent-commands`, { method: 'POST', headers,
    body: JSON.stringify({ command: 'message', arguments: { ...attrs, activity_id: root, message: 'Drift check' } }) });
  const httpResult = (await httpResponse.json()).data;
  assert.equal(httpResponse.status, 200);
  assert.equal(httpResult.direction, 'narrow_scope');
  assert.equal(httpResult.model_review.mode, 'codex');
  assert.equal(httpResult.review, undefined);
  const mcpResponse = await fetch(`${origin}/mcp`, { method: 'POST', headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'flambe_message',
      arguments: { ...attrs, expected_instance_id: local.store.instance().id, activity_id: root, message: 'Rename current activity' } } }) });
  const text = await mcpResponse.text();
  const mcp = mcpResponse.headers.get('content-type').includes('text/event-stream')
    ? JSON.parse(text.split('\n').filter(line => line.startsWith('data:')).at(-1).slice(5)) : JSON.parse(text);
  assert.equal(mcpResponse.status, 200);
  assert.equal(mcp.result.isError, false, JSON.stringify(mcp));
  assert.equal(mcp.result.structuredContent.model_review.mode, 'codex');
  assert.equal(local.store.getActivity(1, root).name, 'Clarified intent');
  const logs = readFileSync(logPath, 'utf8');
  const completed = logs.trim().split('\n').map(JSON.parse).filter(e => e.event === 'command.completed');
  assert.equal(completed.length, 2);
  assert.ok(completed.every(e => e.review_model === 'chosen-model' && e.review_usage.input_tokens === 12));
  for (const secret of [rawToken, f.options.env.FLAMBE_API_TOKEN, 'Drift check', 'Clarified intent', 'Keep working.']) assert.equal(logs.includes(secret), false);
});

test('pinned native CLI excludes inherited configuration, hooks, skills and executable tools (mock endpoint only)', { timeout: 20000 }, async t => {
  let runtime;
  try { runtime = resolveCodexRuntime(); } catch { t.skip('optional native Codex runtime not installed on this platform'); return; }
  const f = fixture(t);
  mkdirSync(f.home, { recursive: true });
  writeFileSync(join(f.home, 'config.toml'), 'THIS IS INVALID TOML: inherited-config-marker');
  mkdirSync(f.options.env.CODEX_HOME, { recursive: true });
  writeFileSync(join(f.options.env.CODEX_HOME, 'AGENTS.md'), 'inherited-instruction-marker');
  mkdirSync(join(f.dir, '.agents', 'skills', 'secret'), { recursive: true });
  writeFileSync(join(f.dir, '.agents', 'skills', 'secret', 'SKILL.md'), '---\nname: secret\ndescription: inherited-skill-marker\n---\n');
  const requests = [];
  const server = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    requests.push({ path: req.url, body: JSON.parse(body), authorization: req.headers.authorization });
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    const output = { id: 'fixture-message', type: 'message', role: 'assistant',
      content: [{ type: 'output_text', text: JSON.stringify(decision([])), annotations: [] }] };
    const events = [
      { type: 'response.created', response: { id: 'fixture-response', status: 'in_progress', output: [] } },
      { type: 'response.output_item.added', output_index: 0, item: { ...output, content: [] } },
      { type: 'response.output_text.delta', item_id: output.id, output_index: 0, content_index: 0, delta: JSON.stringify(decision([])) },
      { type: 'response.output_item.done', output_index: 0, item: output },
      { type: 'response.completed', response: { id: 'fixture-response', status: 'completed', output: [output],
        usage: { input_tokens: 12, output_tokens: 4, total_tokens: 16, input_tokens_details: { cached_tokens: 3 }, output_tokens_details: { reasoning_tokens: 0 } } } },
    ];
    for (const event of events) res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  f.cleanup(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const args = ['--config', 'model_provider="fixture"', '--config', 'model_providers.fixture.name="Fixture"',
    '--config', `model_providers.fixture.base_url="http://127.0.0.1:${server.address().port}/v1"`,
    '--config', 'model_providers.fixture.wire_api="responses"', '--config', 'model_providers.fixture.requires_openai_auth=false',
    '--config', 'model_providers.fixture.request_max_retries=0'];
  // Only this test redirects inference. No real credentials or external endpoint are used.
  let nativeStderr = '';
  const provider = createCodexProvider({ ...f.config, model: 'gpt-5.4', timeoutMs: 10000 }, {
    env: f.options.env, codexRuntime: runtime,
    spawnImpl: (file, original, options) => {
      const child = spawn(file, [...original.slice(0, -1), ...args, original.at(-1)], options);
      child.stderr.on('data', chunk => { nativeStderr += chunk.toString(); });
      child.stdout.on('data', chunk => { nativeStderr += chunk.toString(); });
      return child;
    },
  });
  let usage;
  const result = await provider.review({ ...request, onUsage: value => { usage = value; } }).catch(problem => {
    assert.fail(`${problem.message}\n${nativeStderr}`);
  });
  assert.deepEqual(result, decision([]));
  assert.equal(usage.input_tokens, 12);
  assert.equal(usage.output_tokens, 4);
  assert.equal(requests.length, 1, nativeStderr);
  assert.equal(requests[0].path, '/v1/responses');
  assert.deepEqual(requests[0].body.tools, []);
  assert.equal(requests[0].body.model, 'gpt-5.4');
  assert.equal(requests[0].body.reasoning.effort, 'low');
  assert.deepEqual(requests[0].body.text.format.schema, schema);
  assert.equal(nativeStderr.includes('fallback metadata'), false, 'must exercise the explicit tool-free model catalog');
  assert.equal(requests[0].authorization, undefined);
  const payload = JSON.stringify(requests[0].body);
  for (const marker of ['inherited-config-marker', 'inherited-instruction-marker', 'inherited-skill-marker', 'secret-flambe-token', 'unrelated-provider-key']) assert.equal(payload.includes(marker), false, `must exclude ${marker}`);
  assert.equal(payload.includes('independent Flambe reviewer'), true);
  assert.equal(existsSync(join(f.home, 'sessions')), false, 'ephemeral reviews must not create session transcripts');
});
