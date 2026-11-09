import assert from 'node:assert/strict';
import test from 'node:test';
import { registerPiActivityRoots, requestHeadline } from '../pi/flambe.js';

function harness(env = {
  FLAMBE_URL: 'http://127.0.0.1:4123',
  FLAMBE_API_TOKEN: 'test',
  FLAMBE_TRACE_ID: '1',
}) {
  const handlers = {};
  const calls = [];
  let nextId = 40;
  const client = {
    supportsAgentCommands: async () => { calls.push(['connect']); return true; },
    start: async args => { calls.push(['start', args]); return nextId++; },
    end: async args => { calls.push(['end', args]); },
  };
  const pi = { on: (name, handler) => { handlers[name] = handler; } };
  registerPiActivityRoots(pi, { env, makeClient: () => client, loadEnv: () => {} });
  const ctx = { cwd: '/test', hasUI: false, sessionManager: { getSessionId: () => 'session-123' } };
  return { handlers, calls, env, ctx };
}

test('uses the request as a concise headline', () => {
  assert.equal(requestHeadline('  fix   the  bug\nplease '), 'fix the bug please');
  assert.equal(requestHeadline(' '), 'Image or attachment request');
  assert.equal(requestHeadline('x'.repeat(130)).length, 120);
});

test('creates a root for each user request and ends it on settlement', async () => {
  const { handlers, calls, env, ctx } = harness();
  await handlers.before_agent_start({ messageType: 'user', prompt: 'Ship the new feature' }, ctx);
  assert.equal(env.PI_SESSION_ID, 'session-123');
  assert.deepEqual(calls, [['connect'], ['start', { name: 'Ship the new feature', parentId: null }]]);
  await handlers.agent_settled({ aborted: false }, ctx);
  assert.deepEqual(calls[2], ['end', { activityId: 40, force: true }]);

  await handlers.before_agent_start({ messageType: 'user', prompt: 'Run tests' }, ctx);
  await handlers.agent_settled({ aborted: true }, ctx);
  assert.deepEqual(calls[4], ['start', { name: 'Run tests', parentId: null }]);
  assert.deepEqual(calls[5], ['end', { activityId: 41, force: true, message: 'Interrupted' }]);
  await handlers.session_shutdown({}, ctx);
  assert.equal(env.PI_SESSION_ID, undefined);
});

test('ignores custom runs, closes previous root on a new request, and cleans up on shutdown', async () => {
  const { handlers, calls, ctx } = harness();
  await handlers.before_agent_start({ messageType: 'custom' }, ctx);
  assert.equal(calls.length, 0);
  await handlers.before_agent_start({ messageType: 'user', prompt: 'First' }, ctx);
  await handlers.before_agent_start({ messageType: 'user', prompt: 'Second' }, ctx);
  assert.deepEqual(calls[2], ['end', { activityId: 40, force: true, message: 'Superseded by a new request' }]);
  await handlers.session_shutdown({}, ctx);
  assert.deepEqual(calls[5], ['end', { activityId: 41, force: true, message: 'Pi session closed' }]);
});

test('does not create activities when connection settings are absent', async () => {
  const { handlers, calls, ctx } = harness({});
  await handlers.before_agent_start({ messageType: 'user', prompt: 'Hello' }, ctx);
  await handlers.agent_settled({ aborted: false }, ctx);
  assert.deepEqual(calls, []);
});
