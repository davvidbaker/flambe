import assert from 'node:assert/strict';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {Readable} from 'node:stream';
import test from 'node:test';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {HOOK_EVENTS, managedHook, setupCodex} from '../src/codex-setup.mjs';
import {readHookInput, runCodexHook} from '../src/codex-hook.mjs';

function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'flambe-codex-hook-'));
  const root = join(base, 'project with spaces');
  mkdirSync(root);
  const cleanup = [];
  t.after(async () => {for (const clean of cleanup) await clean(); rmSync(base, {recursive: true, force: true});});
  return {base, root, cleanup, path: join(root, '.codex', 'hooks.json'),
    skillPath: join(root, '.codex', 'skills', 'flambe-cli', 'SKILL.md')};
}

function harness(t, overrides = {}) {
  const files = fixture(t);
  setupCodex({cwd: files.root, skill: 'canonical skill'});
  const env = {FLAMBE_URL: 'http://127.0.0.1:4001', FLAMBE_RUNTIME_MODE: 'local_self_contained',
    FLAMBE_API_TOKEN: 'test-secret-token', FLAMBE_TRACE_ID: '1',
    CODEX_SESSION_ID: 'host-session', CODEX_THREAD_ID: 'thread',
    FLAMBE_AGENT_NAMES_PATH: join(files.base, 'names.json')};
  let at = 100_000;
  let calls = [];
  let activities = [];
  const fetchImpl = async (url, options) => {
    calls.push({url, options});
    if (options.method === 'POST') return Response.json({data: {state: {activities}}});
    return Response.json({data: {version: 1, commands: ['start','end','suspend','resume','status','message']}});
  };
  const options = {env, stateDir: join(files.base, 'state'), now: () => at, fetchImpl, ...overrides};
  const event = (hook_event_name, fields = {}) => ({cwd: files.root, session_id: 'thread',
    turn_id: 'turn-1', hook_event_name, ...fields});
  return {...files, env, options, event,
    run: (name, fields) => runCodexHook(event(name, fields), options),
    advance: ms => {at += ms;}, calls: () => calls,
    activities: value => {activities = value;},
    own: (id = 1) => ({id, name: 'Actual work', parentId: null, status: 'running',
      agentId: 'codex:host-session:thread', latestEvent: {id, timestamp: new Date(at).toISOString()}}),
  };
}

test('setup preserves unrelated hooks/custom skills, is idempotent, and removes only its own handlers', t => {
  const f = fixture(t);
  mkdirSync(dirname(f.path), {recursive: true});
  mkdirSync(dirname(f.skillPath), {recursive: true});
  const other = {matcher: 'Bash', hooks: [{type: 'command', command: 'other-check'}]};
  const config = {description: 'My hooks', hooks: {PreToolUse: [other], SessionEnd: [{hooks: []}]}};
  writeFileSync(f.path, JSON.stringify(config));
  writeFileSync(f.skillPath, 'custom skill');
  const first = setupCodex({cwd: f.root, skill: 'canonical'});
  assert.equal(first.skillInstalled, false);
  assert.equal(first.skillMatches, false);
  assert.equal(readFileSync(f.skillPath, 'utf8'), 'custom skill');
  assert.equal(readFileSync(`${f.path}.before-flambe`, 'utf8'), JSON.stringify(config));
  const once = readFileSync(f.path, 'utf8');
  assert.equal(setupCodex({cwd: f.root, skill: 'canonical'}).unchanged, true);
  assert.equal(readFileSync(f.path, 'utf8'), once);
  const installed = JSON.parse(once);
  for (const event of HOOK_EVENTS) {
    assert.equal(installed.hooks[event].flatMap(group => group.hooks).filter(managedHook).length, 1);
  }
  assert.deepEqual(installed.hooks.PreToolUse[0], other);
  assert.equal(installed.hooks.PreToolUse[1].hooks[0].commandWindows, 'flambe.cmd hook codex');
  assert(!once.includes(f.root));
  assert.equal(setupCodex({cwd: f.root, action: 'check', skill: 'canonical'}).installed, true);
  setupCodex({cwd: f.root, action: 'remove', skill: 'canonical'});
  assert.deepEqual(JSON.parse(readFileSync(f.path, 'utf8')), config);
  assert.equal(readFileSync(f.skillPath, 'utf8'), 'custom skill');
});

test('malformed hook configuration is left untouched', t => {
  const f = fixture(t);
  mkdirSync(dirname(f.path), {recursive: true});
  writeFileSync(f.path, '{broken');
  assert.throws(() => setupCodex({cwd: f.root, skill: 'canonical'}), /existing hooks were not changed/);
  assert.equal(readFileSync(f.path, 'utf8'), '{broken');
  assert.equal(existsSync(f.skillPath), false);
});

test('session restore uses only the configured local status and this agent, without retaining private content', async t => {
  const h = harness(t);
  h.activities([h.own(), {...h.own(2), agentId: 'someone-else', name: 'OTHER AGENT PRIVATE WORK'}]);
  const input = h.event('SessionStart', {prompt: 'PRIVATE PROMPT', transcript_path: 'PRIVATE TRANSCRIPT'});
  const result = await runCodexHook(input, h.options);
  const output = JSON.stringify(result);
  assert.match(output, /Actual work/);
  assert(!output.includes('OTHER AGENT') && !output.includes('PRIVATE PROMPT') && !output.includes('test-secret'));
  assert.equal(h.calls().length, 2);
  const request = h.calls()[1];
  assert.equal(request.options.redirect, 'manual');
  assert.equal(JSON.parse(request.options.body).command, 'status');
  assert.equal(JSON.parse(request.options.body).arguments.agent_id, 'codex:host-session:thread');
  for (const name of readdirSync(h.options.stateDir)) {
    const saved = readFileSync(join(h.options.stateDir, name), 'utf8');
    for (const secret of ['test-secret', 'PRIVATE', 'Actual work', 'OTHER AGENT']) assert(!saved.includes(secret));
  }
});

test('nested cwd finds the installed project env; shell precedence cannot silently redirect hooks to Cloud', async t => {
  const h = harness(t);
  const nested = join(h.root, 'src'); mkdirSync(nested);
  writeFileSync(join(h.root, '.env'), 'FLAMBE_URL=http://127.0.0.1:4321\nFLAMBE_RUNTIME_MODE=local_self_contained\nFLAMBE_API_TOKEN=local-token\nFLAMBE_TRACE_ID=1\n');
  const env = {...h.env}; delete env.FLAMBE_URL;
  await runCodexHook(h.event('SessionStart', {cwd: nested}), {...h.options, env});
  assert(h.calls().every(call => call.url.startsWith('http://127.0.0.1:4321/')));
  const before = h.calls().length;
  const denied = await runCodexHook(h.event('SessionStart'), {...h.options,
    env: {...env, FLAMBE_URL: 'https://flambe.fly.dev'}});
  assert.match(JSON.stringify(denied), /do not substitute Cloud/);
  assert.equal(h.calls().length, before);
});

test('missing Codex identity never inspects another agent stack or invents a shared identity', async t => {
  const h = harness(t);
  const env = {...h.env}; delete env.CODEX_SESSION_ID; delete env.CODEX_THREAD_ID;
  const result = await runCodexHook(h.event('SessionStart'), {...h.options, env});
  assert.match(JSON.stringify(result), /could not derive/);
  assert.equal(h.calls().length, 0);
});

test('periodic checkpoints query a fresh stack while ordinary tools use cached local state', async t => {
  const h = harness(t, {remindEveryCalls: 3});
  h.activities([h.own()]);
  await h.run('SessionStart');
  assert.deepEqual(await h.run('PreToolUse', {tool_name: 'Bash', tool_input: {command: 'rg needle'}}), {});
  assert.deepEqual(await h.run('PreToolUse', {tool_name: 'Bash', tool_input: {command: 'rg other'}}), {});
  assert.equal(h.calls().length, 2);
  const checkpoint = await h.run('PreToolUse', {tool_name: 'apply_patch', tool_input: {command: 'patch'}});
  assert.match(JSON.stringify(checkpoint), /Actual work/);
  assert.equal(h.calls().length, 4);
});

test('an empty stack gets one early reminder and at most one Stop continuation per turn', async t => {
  const h = harness(t);
  await h.run('SessionStart');
  const work = {tool_name: 'Bash', tool_input: {command: 'rg code'}};
  assert.match(JSON.stringify(await h.run('PreToolUse', work)), /no running activity/);
  assert.deepEqual(await h.run('PreToolUse', work), {});
  await h.run('PreToolUse', work);
  const stop = await h.run('Stop');
  assert.equal(stop.decision, 'block');
  assert.match(stop.reason, /reconcile/);
  assert.deepEqual(await h.run('Stop'), {});
  assert.deepEqual(await h.run('Stop', {stop_hook_active: true}), {});
});

test('each new prompt can reconcile once even when the host omits turn_id', async t => {
  const h = harness(t);
  const fields = {turn_id: undefined};
  for (let turn = 0; turn < 2; turn++) {
    await h.run('UserPromptSubmit', fields);
    await h.run('PreToolUse', {...fields, tool_name: 'apply_patch'});
    assert.equal((await h.run('Stop', fields)).decision, 'block');
    assert.deepEqual(await h.run('Stop', fields), {});
  }
});

test('status/ping is not activity reconciliation; successful lifecycle writes acknowledge the checkpoint', async t => {
  const h = harness(t);
  await h.run('SessionStart');
  await h.run('PreToolUse', {tool_name: 'apply_patch'});
  await h.run('PostToolUse', {tool_name: 'Bash', tool_input: {command: 'flambe status --active'}, tool_response: {exit_code: 0}});
  assert.equal((await h.run('Stop')).decision, 'block');
  await h.run('UserPromptSubmit', {turn_id: 'turn-2'});
  await h.run('PreToolUse', {turn_id: 'turn-2', tool_name: 'apply_patch'});
  await h.run('PostToolUse', {turn_id: 'turn-2', tool_name: 'Bash', tool_input: {command: 'flambe.cmd suspend 1 "Waiting"'}, tool_response: {exit_code: 0}});
  assert.deepEqual(await h.run('Stop', {turn_id: 'turn-2'}), {});
});

test('a failed tracking command does not acknowledge work, and mixed scripts count as work', async t => {
  const h = harness(t);
  await h.run('SessionStart');
  await h.run('PreToolUse', {tool_name: 'apply_patch'});
  await h.run('PostToolUse', {tool_input: {command: 'flambe end 1'}, tool_response: {exit_code: 1}});
  assert.equal((await h.run('Stop')).decision, 'block');
  await h.run('UserPromptSubmit', {turn_id: 'turn-2'});
  for (let i=0; i<3; i++) await h.run('PreToolUse', {turn_id: 'turn-2', tool_name: 'Bash', tool_input: {command: 'flambe start test; npm test'}});
  assert.equal((await h.run('Stop', {turn_id: 'turn-2'})).decision, 'block');
});

test('server failures are bounded feedback, never a stop continuation or activity mutation', async t => {
  const h = harness(t, {fetchImpl: async () => {throw new Error('SECRET should never be echoed');}});
  const start = await h.run('SessionStart');
  assert(!JSON.stringify(start).includes('SECRET'));
  assert.match(JSON.stringify(start), /Work may continue/);
  await h.run('PreToolUse', {tool_name: 'apply_patch'});
  const stop = await h.run('Stop');
  assert.notEqual(stop.decision, 'block');
});

test('interrupt does not change activities; the next prompt requests reconciliation', async t => {
  const h = harness(t);
  h.activities([h.own()]);
  await h.run('SessionStart');
  const before = h.calls().length;
  assert.deepEqual(await h.run('Interrupt'), {});
  assert.equal(h.calls().length, before);
  const restored = await h.run('UserPromptSubmit', {turn_id: 'turn-2'});
  assert.match(JSON.stringify(restored), /previous turn was interrupted/);
  assert(h.calls().filter(call => call.options.method === 'POST').every(call => JSON.parse(call.options.body).command === 'status'));
});

test('a trivial turn needs no stop continuation and oversized/invalid hook input is rejected safely', async t => {
  const h = harness(t);
  await h.run('SessionStart');
  await h.run('PreToolUse', {tool_name: 'Bash', tool_input: {command: 'pwd'}});
  assert.deepEqual(await h.run('Stop'), {});
  await assert.rejects(readHookInput(Readable.from(['{bad'])));
  await assert.rejects(readHookInput(Readable.from(['x'.repeat(1024*1024+1)])), /exceeds/);
});

test('parallel tool hooks keep a valid shared checkpoint state', async t => {
  const h = harness(t);
  await h.run('SessionStart');
  await Promise.all(Array.from({length: 5}, () => h.run('PreToolUse', {tool_name: 'Bash', tool_input: {command: 'rg work'}})));
  const names = readdirSync(h.options.stateDir);
  assert.equal(names.length, 1);
  const state = JSON.parse(readFileSync(join(h.options.stateDir, names[0]), 'utf8'));
  assert.equal(state.workInTurn, 5);
});

test('a killed hook lock is recovered rather than disabling future checkpoints', async t => {
  const h = harness(t);
  await h.run('SessionStart');
  const statePath = join(h.options.stateDir, readdirSync(h.options.stateDir)[0]);
  mkdirSync(`${statePath}.lock`);
  writeFileSync(join(`${statePath}.lock`, 'pid'), '2147483647');
  await h.run('PreToolUse', {tool_name: 'Bash', tool_input: {command: 'rg work'}});
  assert.equal(existsSync(`${statePath}.lock`), false);
  assert.equal(JSON.parse(readFileSync(statePath, 'utf8')).workInTurn, 1);
});

test('real CLI hook entrypoint resolves the project env from a nested cwd and verifies local tracking without inference', async t => {
  const f = fixture(t);
  const {listenLocal} = await import('../src/local/serve.mjs');
  let providerCalls = 0;
  const local = await listenLocal({port: 0, dbPath: join(f.base, 'local.sqlite'), staticDir: false,
    reducer: {env: {FLAMBE_LOCAL_REDUCER_MODE: 'agent'}, fetchImpl() {providerCalls++; throw new Error('Unexpected inference');}}});
  f.cleanup.push(async () => {local.server.closeAllConnections(); await new Promise(resolve => local.server.close(resolve)); local.store.close();});
  const {rawToken, traceId} = local.store.credentials();
  writeFileSync(join(f.root, '.env'), `FLAMBE_URL=http://127.0.0.1:${local.port}\nFLAMBE_RUNTIME_MODE=local_self_contained\nFLAMBE_API_TOKEN=${rawToken}\nFLAMBE_TRACE_ID=${traceId}\n`);
  const nested = join(f.root, 'nested'); mkdirSync(nested);
  writeFileSync(join(nested, '.env'), 'FLAMBE_URL=https://should-not-be-used.example\n');
  const env = {...process.env, FLAMBE_AGENT_ID: 'test:codex-hook-real',
    FLAMBE_AGENT_NAMES_PATH: join(f.base, 'names.json'), FLAMBE_QUEUE_PATH: join(f.base, 'queue.json'),
    FLAMBE_QUESTIONS_PATH: join(f.base, 'questions.json'), FLAMBE_CODEX_HOOK_STATE_DIR: join(f.base, 'state')};
  for (const key of ['FLAMBE_URL','FLAMBE_RUNTIME_MODE','FLAMBE_API_TOKEN','FLAMBE_TRACE_ID']) delete env[key];
  const bin = fileURLToPath(new URL('../bin/flambe.mjs', import.meta.url));
  async function command(args, cwd, input = '') {
    const child = spawn(process.execPath, [bin, ...args], {cwd, env, stdio: ['pipe', 'pipe', 'pipe']});
    let stdout = ''; let stderr = '';
    child.stdout.on('data', data => {stdout += data;});
    child.stderr.on('data', data => {stderr += data;});
    child.stdin.end(input);
    const code = await new Promise((resolve, reject) => {child.once('error', reject); child.once('exit', resolve);});
    assert.equal(code, 0, stderr);
    return stdout;
  }
  const hook = async (hook_event_name, fields = {}) => JSON.parse(await command(['hook','codex'], nested,
    JSON.stringify({hook_event_name, cwd: nested, session_id: 'real-thread', turn_id: 'real-turn', ...fields})));
  const installed = await command(['setup','codex'], f.root);
  assert.match(installed, /Review and trust/);
  const checked = JSON.parse(await command(['setup','codex','--check'], f.root));
  assert.equal(checked.installed, true);
  assert.equal(checked.localConnectionConfigured, true);
  assert.equal(checked.skillMatches, true);
  assert.match(JSON.stringify(await hook('SessionStart')), /no running activity/);
  await hook('PreToolUse', {tool_name: 'apply_patch'});
  assert.equal((await hook('Stop')).decision, 'block');
  assert.deepEqual(await hook('Stop', {stop_hook_active: true}), {});
  assert.equal(local.store.getTrace(1, traceId).events.length, 0);
  const id = Number((await command(['start','Verify Codex hooks','--root'], f.root)).trim());
  await hook('PostToolUse', {tool_name: 'Bash', tool_input: {command: 'flambe start "Verify Codex hooks" --root'}, tool_response: {exit_code: 0}});
  assert.deepEqual(await hook('Stop'), {});
  await command(['end',String(id),'Local hook verification passed'], f.root);
  const trace = local.store.getTrace(1, traceId);
  assert.equal(trace.events.filter(event => event.phase === 'B').length, 1);
  assert.equal(trace.events.filter(event => ['E','J','V'].includes(event.phase)).length, 1);
  assert.equal(providerCalls, 0);
});
