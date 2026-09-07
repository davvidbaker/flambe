import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { FlambeClient, clientFromEnv, configFromEnv } from '../src/client.mjs';
import { run } from '../src/cli.mjs';
import { loadProjectEnv } from '../src/env.mjs';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function emptyTrace(traceId = 3) {
  return {
    id: traceId,
    name: 'Work',
    threads: [{ id: 1, name: 'Main', rank: 0 }],
    events: [],
  };
}

test('configFromEnv requires exactly the agent-facing configuration', () => {
  assert.deepEqual(
    configFromEnv({
      FLAMBE_URL: 'http://localhost:4001/',
      FLAMBE_API_TOKEN: 'flb_secret',
      FLAMBE_TRACE_ID: '7',
    }),
    { baseUrl: 'http://localhost:4001', token: 'flb_secret', traceId: 7 },
  );

  assert.throws(() => configFromEnv({}), /FLAMBE_URL, FLAMBE_API_TOKEN, FLAMBE_TRACE_ID/);
  assert.throws(
    () => configFromEnv({ FLAMBE_URL: 'x', FLAMBE_API_TOKEN: 'y', FLAMBE_TRACE_ID: 'nope' }),
    /positive integer/,
  );
});

test('configFromEnv derives an agent identity from the Codex session when needed', () => {
  const config = configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CODEX_SESSION_ID: 'session-1',
    CODEX_THREAD_ID: 'thread-2',
  });

  assert.equal(config.agentId, 'codex:session-1:thread-2');
  assert.equal(config.agentName, undefined);
  assert.equal(config.agentPlatform, 'Codex');
  assert.equal(configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CURSOR_AGENT: '1',
    CURSOR_CONVERSATION_ID: 'conv-1',
    FLAMBE_AGENT_PLATFORM: ' Cursor Cloud ',
  }).agentPlatform, 'Cursor Cloud');
  assert.equal(configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CODEX_SESSION_ID: 'session-1',
    CODEX_THREAD_ID: 'thread-2',
    FLAMBE_AGENT_ID: 'steve',
  }).agentId, 'steve');
});

test('configFromEnv derives a Cursor agent identity and optional display name', () => {
  const config = configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CURSOR_AGENT: '1',
    CURSOR_CONVERSATION_ID: 'conv-99',
    FLAMBE_AGENT_NAME: '  Grok  ',
  });

  assert.equal(config.agentId, 'cursor:conv-99');
  assert.equal(config.agentName, 'Grok');
  assert.equal(configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CURSOR_CONVERSATION_ID: 'conv-99',
  }).agentId, undefined);
});

test('configFromEnv derives a Claude Code agent identity from the session', () => {
  const config = configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CLAUDECODE: '1',
    CLAUDE_CODE_SESSION_ID: 'sess-42',
    FLAMBE_AGENT_NAME: 'Claude',
  });

  assert.equal(config.agentId, 'claude:sess-42');
  assert.equal(config.agentName, 'Claude');
  assert.equal(configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CLAUDECODE: '1',
  }).agentId, undefined);
  assert.equal(configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CLAUDE_CODE_SESSION_ID: 'sess-42',
  }).agentId, undefined);
  assert.equal(configFromEnv({
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
    CLAUDE_CODE_CHILD_SESSION: '1',
    CLAUDE_SESSION_ID: 'hook-session',
  }).agentId, 'claude:hook-session');
});

test('loadProjectEnv reads .env from cwd without overriding existing environment values', () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-env-'));

  try {
    writeFileSync(
      join(directory, '.env'),
      [
        'FLAMBE_URL=http://from-dotenv:4001',
        'FLAMBE_API_TOKEN="flb_from_dotenv"',
        'FLAMBE_TRACE_ID=27',
      ].join('\n'),
    );

    const env = { FLAMBE_URL: 'http://from-shell:4001' };
    assert.equal(loadProjectEnv({ cwd: directory, env }), join(directory, '.env'));
    assert.deepEqual(env, {
      FLAMBE_URL: 'http://from-shell:4001',
      FLAMBE_API_TOKEN: 'flb_from_dotenv',
      FLAMBE_TRACE_ID: '27',
    });
    assert.deepEqual(configFromEnv(env), {
      baseUrl: 'http://from-shell:4001',
      token: 'flb_from_dotenv',
      traceId: 27,
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('loadProjectEnv is a no-op when the project has no .env', () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-no-env-'));

  try {
    const env = { KEEP_ME: 'yes' };
    assert.equal(loadProjectEnv({ cwd: directory, env }), null);
    assert.deepEqual(env, { KEEP_ME: 'yes' });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('start posts one authenticated begin event and leaves thread and parent to the reducer', async () => {
  const requests = [];
  const notes = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    return jsonResponse({
      data: {
        activity: { id: 42, parent_id: null, thread_id: 4 },
        event: { id: 50 },
        reducer: { parent_source: 'root', thread_source: 'default', categories_source: 'request' },
      },
    }, 201);
  };

  const client = new FlambeClient({
    baseUrl: 'http://flambe.test/',
    token: 'flb_test_token',
    traceId: 9,
    fetchImpl,
    now: () => 1_788_360_000_123,
    onReducerNote: note => notes.push(note),
  });

  assert.equal(await client.start({ name: 'Inspect authentication flow', categoryIds: ['5', '5', '8'] }), 42);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://flambe.test/api/activities');
  assert.equal(requests[0].options.headers.authorization, 'Bearer flb_test_token');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    trace_id: 9,
    activity: { name: 'Inspect authentication flow', categories: [5, 8] },
    event: { timestamp_integer: 1_788_360_000_123, phase: 'B' },
  });
  assert.deepEqual(notes, [{
    type: 'start_reduced',
    activityId: 42,
    parentId: null,
    threadId: 4,
    requestedThreadId: undefined,
    parentSource: 'root',
    threadSource: 'default',
    categoriesSource: 'request',
  }]);
});

test('includes the stable agent instance ID when configured', async () => {
  let request;
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 'secret', traceId: 3, agentId: 'agent-session-7',
    fetchImpl: async (url, options = {}) => {
      request = options;
      if (!options.method || options.method === 'GET') {
        return jsonResponse({ data: emptyTrace(3) });
      }
      return jsonResponse({ data: { id: 77, phase: 'E' } }, 201);
    },
  });

  await client.end({ activityId: 42 });
  assert.equal(request.headers['x-flambe-agent-id'], 'agent-session-7');
  assert.equal(request.headers['x-flambe-agent-name'], undefined);
});

test('sends the agent display name only together with an instance ID', async () => {
  let namedRequest;
  const named = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    agentId: 'agent-session-7',
    agentName: 'Grok',
    fetchImpl: async (_url, options = {}) => {
      namedRequest = options;
      if (!options.method || options.method === 'GET') {
        return jsonResponse({ data: emptyTrace(3) });
      }
      return jsonResponse({ data: { id: 77, phase: 'E' } }, 201);
    },
  });

  await named.end({ activityId: 42 });
  assert.equal(namedRequest.headers['x-flambe-agent-id'], 'agent-session-7');
  assert.equal(namedRequest.headers['x-flambe-agent-name'], 'Grok');

  let namelessRequest;
  const nameless = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    agentName: 'Grok',
    fetchImpl: async (_url, options = {}) => {
      namelessRequest = options;
      if (!options.method || options.method === 'GET') {
        return jsonResponse({ data: emptyTrace(3) });
      }
      return jsonResponse({ data: { id: 77, phase: 'E' } }, 201);
    },
  });

  await nameless.end({ activityId: 42 });
  assert.equal(namelessRequest.headers['x-flambe-agent-id'], undefined);
  assert.equal(namelessRequest.headers['x-flambe-agent-name'], undefined);
});

test('an explicit thread is sent as a request, and the reducer may keep a child on its parent\'s thread', async () => {
  const requests = [];
  const notes = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    return jsonResponse({
      data: {
        activity: { id: 8, parent_id: 6, thread_id: 3 },
        event: { id: 9 },
        reducer: { parent_source: 'inferred', thread_source: 'parent', categories_source: 'parent' },
      },
    }, 201);
  };

  const client = new FlambeClient({ baseUrl: 'http://flambe.test', token: 't', traceId: 2, fetchImpl, now: () => 7, onReducerNote: note => notes.push(note) });
  assert.equal(await client.start({ name: 'Run tests', threadId: '11', description: 'CI' }), 8);
  assert.equal(requests.length, 1);
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    trace_id: 2,
    thread_id: 11,
    activity: { name: 'Run tests', description: 'CI', categories: [] },
    event: { timestamp_integer: 7, phase: 'B' },
  });
  assert.equal(notes[0].parentId, 6);
  assert.equal(notes[0].threadId, 3);
  assert.equal(notes[0].requestedThreadId, 11);
  await assert.rejects(client.start({ name: 'Bad thread', threadId: 'main' }), /--thread must be a positive integer/);
});

test('start sends FLAMBE_THREAD when --thread is omitted', async () => {
  let body;
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2, threadId: 11, now: () => 7,
    fetchImpl: async (_url, options = {}) => {
      body = JSON.parse(options.body);
      return jsonResponse({ data: { activity: { id: 8, parent_id: null, thread_id: 11 }, event: { id: 9 } } }, 201);
    },
  });

  assert.equal(await client.start({ name: 'Root work' }), 8);
  assert.equal(body.thread_id, 11);

  await client.start({ name: 'Override', threadId: '4' });
  assert.equal(body.thread_id, 4);
});

test('configFromEnv reads optional FLAMBE_THREAD', () => {
  const env = {
    FLAMBE_URL: 'http://localhost:4001',
    FLAMBE_API_TOKEN: 'flb_secret',
    FLAMBE_TRACE_ID: '7',
  };
  assert.equal(configFromEnv(env).threadId, undefined);
  assert.equal(configFromEnv({ ...env, FLAMBE_THREAD: ' 11 ' }).threadId, 11);
  assert.throws(() => configFromEnv({ ...env, FLAMBE_THREAD: 'main' }), /FLAMBE_THREAD must be a positive integer/);
});

test('CLI start forwards FLAMBE_THREAD from the environment', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-thread-env-'));

  try {
    let body;
    const env = {
      FLAMBE_URL: 'http://flambe.test',
      FLAMBE_API_TOKEN: 't',
      FLAMBE_TRACE_ID: '2',
      FLAMBE_THREAD: '11',
      FLAMBE_QUEUE_PATH: join(directory, 'queue.json'),
    };
    const client = clientFromEnv(env, {
      now: () => 7,
      fetchImpl: async (_url, options = {}) => {
        body = JSON.parse(options.body);
        return jsonResponse({ data: { activity: { id: 8, parent_id: null, thread_id: 11 }, event: { id: 9 } } }, 201);
      },
    });
    const output = [];
    await run(['start', 'Root work'], { env, client, stdout: { write(value) { output.push(value); } } });
    assert.deepEqual(output, ['8\n']);
    assert.equal(body.thread_id, 11);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('start omits parent_id so the reducer infers this agent\'s newest active activity', async () => {
  let request;
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2, now: () => 7, agentId: 'cursor:conv-1',
    fetchImpl: async (_url, options = {}) => {
      request = options;
      return jsonResponse({ data: { activity: { id: 8, parent_id: 6, thread_id: 11 }, event: { id: 9 } } }, 201);
    },
  });

  await client.start({ name: 'Inspect config' });
  assert.equal(request.headers['x-flambe-agent-id'], 'cursor:conv-1');
  assert.equal(Object.hasOwn(JSON.parse(request.body).activity, 'parent_id'), false);
  assert.equal(Object.hasOwn(JSON.parse(request.body), 'thread_id'), false);
});

test('start --root sends an explicit null parent', async () => {
  let request;
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2, now: () => 7,
    fetchImpl: async (_url, options = {}) => {
      request = options;
      return jsonResponse({ data: { activity: { id: 8, parent_id: null, thread_id: 11 }, event: { id: 9 } } }, 201);
    },
  });

  await client.start({ name: 'New root', threadId: 11, parentId: null });
  assert.equal(JSON.parse(request.body).activity.parent_id, null);
  assert.equal(Object.hasOwn(JSON.parse(request.body).activity, 'parent_id'), true);
});

test('CLI parses --root as an explicit root activity', async () => {
  let input;
  const client = {
    flushQueue: async () => {},
    start: async value => {
      input = value;
      return 1;
    },
  };
  const stdout = { write: () => {} };

  await run(['start', 'New', 'root', '--root'], { client, stdout });
  assert.equal(input.parentId, null);
});

test('start accepts a timezone-aware ISO timestamp for a backdated begin event', async () => {
  let request;
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2,
    fetchImpl: async (_url, options = {}) => {
      request = options;
      return jsonResponse({ data: { activity: { id: 8 }, event: { id: 9 } } }, 201);
    },
    now: () => 7,
  });

  await client.start({ name: 'Last night', threadId: '11', startedAt: '2026-09-01T20:00:00-06:00' });

  assert.equal(JSON.parse(request.body).event.timestamp_integer, Date.parse('2026-09-01T20:00:00-06:00'));
});

test('start rejects timestamps without a timezone before posting an activity', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2,
    fetchImpl: async () => { throw new Error('should not make a request'); },
  });

  await assert.rejects(
    client.start({ name: 'Last night', threadId: '11', startedAt: '2026-09-01T20:00:00' }),
    /--started-at must be an ISO-8601 timestamp with a timezone/,
  );
});

test('start rejects invalid category IDs before posting an activity', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 2,
    fetchImpl: async () => { throw new Error('should not make a request'); },
  });

  await assert.rejects(client.start({ name: 'Run tests', threadId: '11', categoryIds: ['nope'] }), /--category must be a positive integer/);
});

test('end posts an authenticated end event with the completion message', async () => {
  let request;
  const fetchImpl = async (url, options = {}) => {
    if (!options.method || options.method === 'GET') {
      return jsonResponse({ data: emptyTrace(3) });
    }
    request = { url, options };
    return jsonResponse({ data: { id: 77, phase: 'E' } }, 201);
  };

  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    fetchImpl,
    now: () => 456,
  });

  assert.equal(await client.end({ activityId: 42, message: 'Found the issue' }), 77);
  assert.equal(request.options.headers.authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(request.options.body), {
    trace_id: 3,
    activity_id: 42,
    event: { timestamp_integer: 456, phase: 'E', message: 'Found the issue' },
  });
});

test('end refuses when the activity still has open children', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    now: () => 456,
    fetchImpl: async (url, options = {}) => {
      if (!options.method || options.method === 'GET') {
        return jsonResponse({
          data: {
            id: 3,
            name: 'Work',
            threads: [{ id: 1, name: 'Main', rank: 0 }],
            events: [
              {
                id: 1,
                timestamp: '2026-09-03T12:00:00Z',
                phase: 'B',
                activity: {
                  id: 10,
                  name: 'Parent work',
                  parent_id: null,
                  thread: { id: 1 },
                  categories: [],
                },
              },
              {
                id: 2,
                timestamp: '2026-09-03T12:01:00Z',
                phase: 'B',
                activity: {
                  id: 11,
                  name: 'Child work',
                  parent_id: 10,
                  thread: { id: 1 },
                  categories: [],
                },
              },
              {
                id: 3,
                timestamp: '2026-09-03T12:02:00Z',
                phase: 'B',
                activity: {
                  id: 12,
                  name: 'Other child',
                  parent_id: 10,
                  thread: { id: 1 },
                  categories: [],
                },
              },
            ],
          },
        });
      }
      throw new Error('should not post an end event');
    },
  });

  await assert.rejects(
    client.end({ activityId: 10, message: 'Too soon' }),
    /Cannot end activity 10 while open children remain: 11 \(Child work\), 12 \(Other child\)\. End 11, 12 first/,
  );
});

test('end --force closes a parent even when children are still open', async () => {
  let posted;
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    now: () => 456,
    fetchImpl: async (_url, options = {}) => {
      if (!options.method || options.method === 'GET') {
        return jsonResponse({
          data: {
            id: 3,
            name: 'Work',
            threads: [{ id: 1, name: 'Main', rank: 0 }],
            events: [
              {
                id: 1,
                timestamp: '2026-09-03T12:00:00Z',
                phase: 'B',
                activity: {
                  id: 10,
                  name: 'Parent work',
                  parent_id: null,
                  thread: { id: 1 },
                  categories: [],
                },
              },
              {
                id: 2,
                timestamp: '2026-09-03T12:01:00Z',
                phase: 'B',
                activity: {
                  id: 11,
                  name: 'Child work',
                  parent_id: 10,
                  thread: { id: 1 },
                  categories: [],
                },
              },
            ],
          },
        });
      }
      posted = JSON.parse(options.body);
      return jsonResponse({ data: { id: 99, phase: 'E' } }, 201);
    },
  });

  assert.equal(await client.end({ activityId: 10, message: 'Forced', force: true }), 99);
  assert.equal(posted.activity_id, 10);
  assert.equal(posted.event.phase, 'E');
});

test('end reports descendants the reducer closed on its behalf', async () => {
  const notes = [];
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    now: () => 456,
    onReducerNote: note => notes.push(note),
    fetchImpl: async () => jsonResponse({
      data: {
        id: 99,
        phase: 'E',
        reducer: {
          closed_descendants: [
            { activity_id: 12, activity_name: 'Grandchild', event_id: 97 },
            { activity_id: 11, activity_name: 'Child work', event_id: 98 },
          ],
        },
      },
    }, 201),
  });

  assert.equal(await client.end({ activityId: 10, message: 'Forced', force: true }), 99);
  assert.deepEqual(notes, [{
    type: 'closed_descendants',
    activityId: 10,
    closedDescendants: [
      { activityId: 12, activityName: 'Grandchild', eventId: 97 },
      { activityId: 11, activityName: 'Child work', eventId: 98 },
    ],
  }]);
});

test('cli end keeps the id on stdout and puts reducer closures on stderr', async () => {
  const output = [];
  const errors = [];
  const client = {
    flushQueue: async () => {},
    async end() {
      this.onReducerNote({
        type: 'closed_descendants',
        activityId: 10,
        closedDescendants: [
          { activityId: 12, activityName: 'Grandchild', eventId: 97 },
          { activityId: 11, activityName: 'Child work', eventId: 98 },
        ],
      });
      return 99;
    },
  };

  await run(['end', '10', 'Forced close', '--force'], {
    client,
    stdout: { write: chunk => output.push(chunk) },
    stderr: { write: chunk => errors.push(chunk) },
  });

  assert.deepEqual(output, ['99\n']);
  assert.deepEqual(errors, ['reducer closed open descendants of 10: 12 (Grandchild), 11 (Child work)\n']);
});

test('cli message prints reducer actions when the reducer changed the stack', async () => {
  const output = [];
  await run(['message', 'Widening scope', '--activity', '9'], {
    client: {
      flushQueue: async () => {},
      async message() {
        return {
          activityId: 9,
          assessment: 'slightly_off_track',
          direction: 'narrow_scope',
          reply: 'Track the refactor separately.',
          rationale: 'Refactor is its own unit.',
          actions_applied: [{ type: 'create_child', activity_id: 31, parent_activity_id: 9 }],
          reducer_model: 'gpt-5.6-terra',
          escalated: true,
        };
      },
    },
    stdout: { write: chunk => output.push(chunk) },
  });

  assert.deepEqual(output, [
    'activity\t9\n',
    'assessment\tslightly_off_track\n',
    'direction\tnarrow_scope\n',
    'reply\tTrack the refactor separately.\n',
    'actions\tcreated child 31 under 9\n',
  ]);
});

test('cli end --force passes through to the client', async () => {
  const calls = [];
  const output = [];
  await run(['end', '10', 'Forced close', '--force'], {
    client: {
      flushQueue: async () => {},
      end: async input => {
        calls.push(input);
        return 55;
      },
    },
    stdout: { write: chunk => output.push(chunk) },
  });
  assert.deepEqual(calls, [{ activityId: '10', message: 'Forced close', force: true }]);
  assert.deepEqual(output, ['55\n']);
});

test('suspend and resume post lifecycle events', async () => {
  const requests = [];
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 'secret', traceId: 3, now: () => 456,
    fetchImpl: async (_url, options = {}) => {
      requests.push(JSON.parse(options.body));
      return jsonResponse({ data: { id: requests.length, phase: requests.length === 1 ? 'S' : 'R' } }, 201);
    },
  });

  assert.equal(await client.suspend({ activityId: 42, message: 'Waiting' }), 1);
  assert.equal(await client.resume({ activityId: 42, message: 'Back to it' }), 2);
  assert.deepEqual(requests, [
    { trace_id: 3, activity_id: 42, event: { timestamp_integer: 456, phase: 'S', message: 'Waiting' } },
    { trace_id: 3, activity_id: 42, event: { timestamp_integer: 456, phase: 'R', message: 'Back to it' } },
  ]);
});

test('queues the full offline activity lifecycle and replays it in order', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-queue-'));
  const queuePath = join(directory, 'queue.json');
  const requests = [];
  let connected = false;

  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'do-not-store-me',
    traceId: 3,
    queuePath,
    now: () => 456,
    fetchImpl: async (url, options = {}) => {
      if (!connected) throw new TypeError('network unavailable');
      requests.push({ url, options });
      if (options.method === undefined || options.method === 'GET') {
        return jsonResponse({ data: { id: 3, threads: [{ id: 4, name: 'Main', rank: 0 }], events: [] } });
      }
      if (url.endsWith('/api/activities')) {
        return jsonResponse({ data: { activity: { id: 42 }, event: { id: 50 } } }, 201);
      }
      return jsonResponse({ data: { id: 77, phase: JSON.parse(options.body).event.phase } }, 201);
    },
  });

  try {
    const activityId = await client.start({ name: 'Work offline', threadId: 4, categoryIds: [5] });
    assert.match(activityId, /^offline-/);
    connected = true;
    assert.equal(await client.suspend({ activityId, message: 'Waiting offline' }), 'queued');
    assert.equal(await client.resume({ activityId, message: 'Back offline' }), 'queued');
    assert.equal(await client.end({ activityId, message: 'Finished offline' }), 'queued');

    const queued = readFileSync(queuePath, 'utf8');
    assert.doesNotMatch(queued, /do-not-store-me/);
    assert.deepEqual(JSON.parse(queued).entries.map(entry => entry.type), ['start', 'suspend', 'resume', 'end']);

    await client.flushQueue();

    assert.equal(requests.length, 4);
    assert.equal(requests[0].url, 'http://flambe.test/api/activities');
    assert.deepEqual(JSON.parse(requests[0].options.body), {
      trace_id: 3,
      thread_id: 4,
      activity: { name: 'Work offline', categories: [5] },
      event: { timestamp_integer: 456, phase: 'B' },
    });
    assert.deepEqual(JSON.parse(requests[1].options.body), {
      trace_id: 3,
      activity_id: 42,
      event: { timestamp_integer: 456, phase: 'S', message: 'Waiting offline' },
    });
    assert.deepEqual(JSON.parse(requests[2].options.body), {
      trace_id: 3,
      activity_id: 42,
      event: { timestamp_integer: 456, phase: 'R', message: 'Back offline' },
    });
    assert.deepEqual(JSON.parse(requests[3].options.body), {
      trace_id: 3,
      activity_id: 42,
      event: { timestamp_integer: 456, phase: 'E', message: 'Finished offline' },
    });
    assert.throws(() => readFileSync(queuePath, 'utf8'), /ENOENT/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('status identifies active and suspended activities by their latest lifecycle event', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    fetchImpl: async () => jsonResponse({
      data: {
        id: 3,
        name: 'Agent work',
        events: [
          { id: 3, timestamp: '2026-09-02T12:00:00Z', phase: 'E', message: 'Done', activity: { id: 10, name: 'Closed work', thread: { id: 2 }, categories: [7] } },
          { id: 1, timestamp: '2026-09-02T10:00:00Z', phase: 'B', message: null, activity: { id: 10, name: 'Closed work', thread: { id: 2 }, categories: [7] } },
          { id: 2, timestamp: '2026-09-02T11:00:00Z', phase: 'B', message: null, activity: { id: 11, name: 'Open work', thread: { id: 4 }, categories: [5] } },
          { id: 4, timestamp: '2026-09-02T13:00:00Z', phase: 'S', message: 'Waiting', activity: { id: 12, name: 'Paused work', thread: { id: 4 }, categories: [] } },
          { id: 5, timestamp: '2026-09-02T12:30:00Z', phase: 'B', message: null, activity: { id: 12, name: 'Paused work', thread: { id: 4 }, categories: [] } },
          { id: 6, timestamp: '2026-09-02T14:00:00Z', phase: 'R', message: null, activity: { id: 13, name: 'Resumed work', thread: { id: 4 }, categories: [] } },
          { id: 7, timestamp: '2026-09-02T12:15:00Z', phase: 'B', message: null, activity: { id: 13, name: 'Resumed work', thread: { id: 4 }, categories: [] } },
        ],
        threads: [{ id: 2, name: 'Closed' }, { id: 4, name: 'Open' }],
      },
    }),
  });

  assert.deepEqual(await client.status({ activeOnly: true }), {
    trace: { id: 3, name: 'Agent work' },
    activities: [{
      id: 11,
      name: 'Open work',
      threadId: 4,
      threadName: 'Open',
      parentId: null,
      agentId: null,
      path: ['Open work'],
      categoryIds: [5],
      startedAt: '2026-09-02T11:00:00Z',
      latestEvent: { id: 2, phase: 'B', timestamp: '2026-09-02T11:00:00Z' },
    }, {
      id: 13,
      name: 'Resumed work',
      threadId: 4,
      threadName: 'Open',
      parentId: null,
      agentId: null,
      path: ['Resumed work'],
      categoryIds: [],
      startedAt: '2026-09-02T12:15:00Z',
      latestEvent: { id: 6, phase: 'R', timestamp: '2026-09-02T14:00:00Z' },
    }],
  });

  assert.deepEqual((await client.status({ suspendedOnly: true })).activities, [{
    id: 12,
    name: 'Paused work',
    threadId: 4,
    threadName: 'Open',
    parentId: null,
    agentId: null,
    path: ['Paused work'],
    categoryIds: [],
    startedAt: '2026-09-02T12:30:00Z',
    latestEvent: { id: 4, phase: 'S', timestamp: '2026-09-02T13:00:00Z', message: 'Waiting' },
  }]);
});

test('message asks the reducer about this agent\'s newest active activity without allowing stack changes', async () => {
  const requests = [];
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    agentId: 'cursor:conv-1',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith('/api/traces/3')) {
        return jsonResponse({
          data: {
            id: 3,
            name: 'Agent work',
            threads: [{ id: 1, name: 'Main', rank: 0 }],
            events: [
              { id: 1, timestamp: '2026-09-02T10:00:00Z', phase: 'B', activity: { id: 20, name: 'Root', thread: { id: 1 }, categories: [], agent_id: null } },
              { id: 2, timestamp: '2026-09-02T11:00:00Z', phase: 'B', activity: { id: 21, name: 'Mine', parent_id: 20, thread: { id: 1 }, categories: [], agent_id: 'cursor:conv-1' } },
              { id: 3, timestamp: '2026-09-02T12:00:00Z', phase: 'B', activity: { id: 22, name: 'Someone else', parent_id: 20, thread: { id: 1 }, categories: [], agent_id: 'codex:x' } },
            ],
          },
        });
      }
      return jsonResponse({
        jsonrpc: '2.0',
        id: 1,
        result: {
          isError: false,
          content: [{ type: 'text', text: 'Direction: narrow_scope' }],
          structuredContent: {
            assessment: 'slightly_off_track',
            direction: 'narrow_scope',
            reply: 'Stay on the auth fix; leave the refactor.',
            rationale: 'Refactor is outside the flame intent.',
            actions_applied: [],
            reducer_model: 'gpt-5.6-terra',
            escalated: true,
          },
        },
      });
    },
  });

  const decision = await client.message({ text: 'I want to refactor the whole session module while here.' });

  assert.equal(decision.activityId, 21);
  assert.equal(decision.direction, 'narrow_scope');
  assert.equal(decision.escalated, true);

  const mcp = requests.at(-1);
  assert.equal(mcp.url, 'http://flambe.test/mcp');
  assert.equal(mcp.options.headers.authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(mcp.options.body), {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'flambe_message',
      arguments: {
        trace_id: 3,
        activity_id: 21,
        agent_id: 'cursor:conv-1',
        message: 'I want to refactor the whole session module while here.',
      },
    },
  });
});

test('message surfaces reducer tool errors and refuses without an active activity', async () => {
  const errorClient = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    fetchImpl: async () => jsonResponse({
      jsonrpc: '2.0',
      id: 1,
      result: { isError: true, content: [{ type: 'text', text: 'Reducer Agent is not configured: OPENAI_API_KEY is missing' }] },
    }),
  });

  await assert.rejects(errorClient.message({ activityId: 21, text: 'hello' }), /OPENAI_API_KEY is missing/);

  const emptyClient = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'secret',
    traceId: 3,
    fetchImpl: async () => jsonResponse({ data: emptyTrace() }),
  });

  await assert.rejects(emptyClient.message({ text: 'hello' }), /No active activity/);
});

test('threads sorts by rank and identifies the default thread', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 'secret', traceId: 3,
    fetchImpl: async () => jsonResponse({ data: { threads: [{ id: 8, name: 'Later', rank: 2 }, { id: 4, name: 'Main', rank: 0 }, { id: 3, name: 'Also main', rank: 0 }] } }),
  });

  assert.deepEqual(await client.threads(), [
    { id: 3, name: 'Also main', rank: 0, default: true },
    { id: 4, name: 'Main', rank: 0, default: false },
    { id: 8, name: 'Later', rank: 2, default: false },
  ]);
});

test('categories returns the authenticated user categories', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 'secret', traceId: 3,
    fetchImpl: async () => jsonResponse({ data: [{ id: 5, name: 'Client', color_background: '#fff', color_text: '#000' }] }),
  });

  assert.deepEqual(await client.categories(), [{ id: 5, name: 'Client', color_background: '#fff', color_text: '#000' }]);
});

test('API errors are useful without echoing credentials', async () => {
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test',
    token: 'do-not-print-me',
    traceId: 1,
    fetchImpl: async () => jsonResponse({ error: 'UNAUTHENTICATED' }, 401),
  });

  await assert.rejects(client.getTrace(), error => {
    assert.match(error.message, /401/);
    assert.match(error.message, /UNAUTHENTICATED/);
    assert.doesNotMatch(error.message, /do-not-print-me/);
    return true;
  });
});

test('CLI commands print machine-friendly output', async () => {
  const output = [];
  const stdout = { write(value) { output.push(value); } };
  const calls = [];
  const client = {
    async flushQueue() { calls.push(['flushQueue']); },
    async start(input) { calls.push(['start', input]); return 123; },
    async end(input) { calls.push(['end', input]); return 456; },
    async suspend(input) { calls.push(['suspend', input]); return 457; },
    async resume(input) { calls.push(['resume', input]); return 458; },
    async status(input) {
      calls.push(['status', input]);
      return { trace: { id: 1, name: 'Work' }, activities: [{ id: 9, name: 'Open work', threadId: 2, threadName: 'Main', categoryIds: [5], latestEvent: { id: 3, phase: 'B', timestamp: '2026-09-02T11:00:00Z' } }] };
    },
    async threads() { calls.push(['threads']); return [{ id: 2, name: 'Main', rank: 0, default: true }]; },
    async categories() { calls.push(['categories']); return [{ id: 5, name: 'Work', color_background: '#fff', color_text: '#000' }]; },
    async observe(input) { calls.push(['observe', input]); return 88; },
    async message(input) {
      calls.push(['message', input]);
      return { activityId: 9, assessment: 'on_track', direction: null, reply: null, rationale: 'fine', actions_applied: [], reducer_model: 'gpt-5.6-luna', escalated: false };
    },
  };

  await run(['start', 'Inspect', 'auth', '--description', 'Agent work', '--category', '5', '--started-at', '2026-09-01T20:00:00-06:00'], { stdout, client });
  await run(['end', '123', 'Done'], { stdout, client });
  await run(['suspend', '123', 'Waiting'], { stdout, client });
  await run(['resume', '123', 'Continue'], { stdout, client });
  await run(['status', '--active', '--json'], { stdout, client });
  await run(['threads'], { stdout, client });
  await run(['categories', '--json'], { stdout, client });
  await run(['observe', 'carbon', '312.4', '--unit', 'gCO2eq/kWh', '--on', '2026-09-04', '--payload', '{"source":"us-ba-mean"}'], { stdout, client });
  await run(['message', 'Scope', 'may', 'be', 'drifting', '--activity', '9'], { stdout, client });

  assert.deepEqual(output, ['123\n', '456\n', '457\n', '458\n', '{"trace":{"id":1,"name":"Work"},"activities":[{"id":9,"name":"Open work","threadId":2,"threadName":"Main","categoryIds":[5],"latestEvent":{"id":3,"phase":"B","timestamp":"2026-09-02T11:00:00Z"}}]}\n', '2\t0\tMain\tdefault\n', '[{"id":5,"name":"Work","color_background":"#fff","color_text":"#000"}]\n', '88\n', 'activity\t9\n', 'assessment\ton_track\n', 'direction\t-\n', 'reply\t-\n']);
  assert.deepEqual(calls, [
    ['flushQueue'],
    ['start', { name: 'Inspect auth', description: 'Agent work', threadId: undefined, categoryIds: ['5'], startedAt: '2026-09-01T20:00:00-06:00' }],
    ['flushQueue'],
    ['end', { activityId: '123', message: 'Done', force: false }],
    ['flushQueue'],
    ['suspend', { activityId: '123', message: 'Waiting' }],
    ['flushQueue'],
    ['resume', { activityId: '123', message: 'Continue' }],
    ['flushQueue'],
    ['status', { activeOnly: true, suspendedOnly: false }],
    ['flushQueue'],
    ['threads'],
    ['flushQueue'],
    ['categories'],
    ['flushQueue'],
    ['observe', { kind: 'carbon', value: 312.4, unit: 'gCO2eq/kWh', observedOn: '2026-09-04', payload: { source: 'us-ba-mean' }, at: undefined }],
    ['flushQueue'],
    ['message', { activityId: '9', text: 'Scope may be drifting' }],
  ]);
});

test('adopts the name the reducer assigns, remembers it, and tells the worker once', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-names-'));
  const namesPath = join(directory, 'agent-names.json');
  const notes = [];
  const seenNameHeaders = [];
  let first = true;

  const fetchImpl = async (_url, options = {}) => {
    seenNameHeaders.push(options.headers['x-flambe-agent-name']);
    const headers = { 'content-type': 'application/json', 'x-flambe-agent-name': 'Juniper' };
    if (first) headers['x-flambe-agent-name-assigned'] = 'true';
    first = false;
    return new Response(JSON.stringify({ data: { id: 3, name: 'Work', threads: [], events: [] } }), { status: 200, headers });
  };

  try {
    const client = new FlambeClient({
      baseUrl: 'http://flambe.test', token: 't', traceId: 3, agentId: 'cursor:conv-1', agentNamesPath: namesPath,
      fetchImpl, onReducerNote: note => notes.push(note),
    });

    await client.getTrace();
    await client.getTrace();

    assert.deepEqual(seenNameHeaders, [undefined, 'Juniper']);
    assert.deepEqual(notes, [{ type: 'agent_named', agentId: 'cursor:conv-1', name: 'Juniper' }]);
    assert.deepEqual(JSON.parse(readFileSync(namesPath, 'utf8')), { 'cursor:conv-1': 'Juniper' });

    // A later process for the same agent picks the name up from disk; FLAMBE_AGENT_NAME still overrides.
    const base = { FLAMBE_URL: 'http://flambe.test', FLAMBE_API_TOKEN: 't', FLAMBE_TRACE_ID: '3', FLAMBE_AGENT_ID: 'cursor:conv-1', FLAMBE_AGENT_NAMES_PATH: namesPath };
    assert.equal(configFromEnv(base).agentName, 'Juniper');
    assert.equal(configFromEnv({ ...base, FLAMBE_AGENT_NAME: 'Grok' }).agentName, 'Grok');
    assert.equal(configFromEnv({ ...base, FLAMBE_AGENT_ID: 'cursor:other' }).agentName, undefined);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('whoami reports the reducer-side identity and needs an agent id', async () => {
  const stdout = [];
  const client = new FlambeClient({
    baseUrl: 'http://flambe.test', token: 't', traceId: 3, agentId: 'cursor:conv-1', agentPlatform: 'Cursor Cloud',
    fetchImpl: async (url, options = {}) => {
      assert.equal(url, 'http://flambe.test/api/agents/me');
      assert.equal(options.headers['x-flambe-agent-id'], 'cursor:conv-1');
      assert.equal(options.headers['x-flambe-agent-platform'], 'Cursor Cloud');
      return jsonResponse({ data: { agent_id: 'cursor:conv-1', name: 'Juniper', platform: 'Cursor Cloud', name_assigned: false } });
    },
  });
  client.flushQueue = async () => {};

  await run(['whoami'], { client, stdout: { write: chunk => stdout.push(chunk) }, stderr: { write: () => {} } });
  assert.deepEqual(stdout, ['cursor:conv-1\tJuniper\tCursor Cloud\n']);

  const nameless = new FlambeClient({ baseUrl: 'http://flambe.test', token: 't', traceId: 3, fetchImpl: async () => { throw new Error('unexpected'); } });
  await assert.rejects(nameless.whoami(), /FLAMBE_AGENT_ID/);
});

test('CLI prints reducer start and naming notes on stderr, ids on stdout', async () => {
  const stdout = [];
  const stderr = [];
  const client = {
    flushQueue: async () => {},
    async start() {
      this.onReducerNote({ type: 'agent_named', agentId: 'a', name: 'Juniper' });
      this.onReducerNote({ type: 'start_reduced', activityId: 8, parentId: 6, threadId: 3, requestedThreadId: 11, parentSource: 'inferred', threadSource: 'parent', categoriesSource: 'parent' });
      this.onReducerNote({ type: 'start_reduced', activityId: 9, parentId: null, threadId: 3, requestedThreadId: undefined, parentSource: 'root', threadSource: 'default', categoriesSource: 'none' });
      return 8;
    },
  };

  await run(['start', 'Thing'], { client, stdout: { write: chunk => stdout.push(chunk) }, stderr: { write: chunk => stderr.push(chunk) } });
  assert.deepEqual(stdout, ['8\n']);
  assert.deepEqual(stderr, [
    'reducer named this agent "Juniper"; the CLI will use it from now on\n',
    "reducer nested 8 under 6; kept it on the parent's thread 3, not 11; inherited the parent's categories\n",
  ]);
});

test('status ignores reducer annotation events when deciding what is active', async () => {
  const client = new FlambeClient({ baseUrl: 'http://flambe.test', token: 't', traceId: 3 });
  const status = client.statusFromTrace({
    id: 3,
    name: 'Work',
    threads: [{ id: 1, name: 'Main', rank: 0 }],
    events: [
      { id: 1, timestamp: '2026-09-02T10:00:00Z', phase: 'B', activity: { id: 6, name: 'Task', thread: { id: 1 }, categories: [] } },
      { id: 2, timestamp: '2026-09-02T10:05:00Z', phase: 'reducer_decision', message: 'placed', activity: { id: 6, name: 'Task', thread: { id: 1 }, categories: [] } },
    ],
  }, { activeOnly: true });

  assert.deepEqual(status.activities.map(activity => [activity.id, activity.latestEvent.phase]), [[6, 'B']]);
});
