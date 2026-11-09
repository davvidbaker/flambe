import assert from 'node:assert/strict';
import test from 'node:test';
import { registerPiActivityRoots, requestHeadline } from '../pi/flambe.js';
import { completeRequest } from '../src/requests.mjs';

function harness(env = {
  FLAMBE_URL: 'http://127.0.0.1:4123',
  FLAMBE_API_TOKEN: 'test',
  FLAMBE_TRACE_ID: '1',
}) {
  const handlers = {};
  const calls = [];
  const activities = [];
  let nextId = 40;
  const client = {
    agentId: 'pi:session-123',
    supportsAgentCommands: async () => { calls.push(['connect']); return true; },
    status: async () => ({ activities: activities.filter(a => a.status === 'running') }),
    start: async args => {
      calls.push(['start', args]);
      const id = nextId++;
      activities.push({ id, parentId: args.parentId, agentId: client.agentId, status: 'running' });
      return id;
    },
    end: async args => {
      calls.push(['end', args]);
      const activity = activities.find(a => a.id === Number(args.activityId));
      if (!activity) throw new Error('not found');
      activity.status = 'ended';
      return 101;
    },
  };
  const pi = { on: (name, handler) => { handlers[name] = handler; } };
  registerPiActivityRoots(pi, { env, makeClient: () => client, loadEnv: () => {} });
  const ctx = { cwd: '/test', hasUI: false, sessionManager: { getSessionId: () => 'session-123' } };
  return { handlers, calls, env, ctx, client, activities };
}

test('uses the request as a concise headline', () => {
  assert.equal(requestHeadline('  fix   the  bug\nplease '), 'fix the bug please');
  assert.equal(requestHeadline(' '), 'Attachment request');
  assert.equal(requestHeadline('x'.repeat(130)).length, 120);
});

test('request remains open across prompts and agent settlement until explicitly completed', async () => {
  const { handlers, calls, env, ctx, client } = harness();
  const first = await handlers.before_agent_start({ messageType: 'user', prompt: 'Ship the new feature', systemPrompt: 'base' }, ctx);
  assert.equal(env.PI_SESSION_ID, 'session-123');
  assert.equal(env.FLAMBE_REQUEST_ROOT_ID, '40');
  assert.match(first.systemPrompt, /only when the original request is actually complete/i);
  assert.deepEqual(calls.filter(([command]) => command === 'start'), [['start', { name: 'Ship the new feature', parentId: null }]]);

  // Settling a run must never close the request.
  await handlers.before_agent_start({ messageType: 'user', prompt: 'Continue the implementation', systemPrompt: 'base' }, ctx);
  assert.equal(calls.filter(([command]) => command === 'start').length, 1);
  assert.equal(calls.filter(([command]) => command === 'end').length, 0);

  await completeRequest(client, { activityId: 40, message: 'Implemented and verified' });
  assert.deepEqual(calls.filter(([command]) => command === 'end'), [
    ['end', { activityId: 40, message: 'Implemented and verified', force: false }],
  ]);
  await handlers.before_agent_start({ messageType: 'user', prompt: 'Run a different task', systemPrompt: 'base' }, ctx);
  assert.equal(env.FLAMBE_REQUEST_ROOT_ID, '41');
  assert.deepEqual(calls.filter(([command]) => command === 'start')[1],
    ['start', { name: 'Run a different task', parentId: null }]);
});

test('session shutdown leaves incomplete request running, which a resumed Pi session recovers', async () => {
  const { handlers, calls, ctx, env, activities } = harness();
  await handlers.before_agent_start({ messageType: 'user', prompt: 'First', systemPrompt: 'base' }, ctx);
  await handlers.session_shutdown({ reason: 'reload' }, ctx);
  assert.equal(env.FLAMBE_REQUEST_ROOT_ID, undefined);
  assert.equal(env.PI_SESSION_ID, undefined);
  assert.equal(activities[0].status, 'running');
  assert.equal(calls.filter(([command]) => command === 'end').length, 0);
  await handlers.before_agent_start({ messageType: 'user', prompt: 'Pick up where we left off', systemPrompt: 'base' }, ctx);
  assert.equal(env.FLAMBE_REQUEST_ROOT_ID, '40');
  assert.equal(calls.filter(([command]) => command === 'start').length, 1);
});

test('ignores custom runs and unconfigured projects', async () => {
  const { handlers, calls, ctx } = harness({});
  await handlers.before_agent_start({ messageType: 'custom' }, ctx);
  await handlers.before_agent_start({ messageType: 'user', prompt: 'Hello', systemPrompt: 'base' }, ctx);
  assert.deepEqual(calls, []);
});
