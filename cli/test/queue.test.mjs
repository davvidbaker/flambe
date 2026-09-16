import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { FlambeQueue, MAX_FLUSH_ATTEMPTS } from '../src/queue.mjs';

const BASE = 'http://flambe.test';
const TRACE = 3;

function seed(entries) {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-queue-'));
  const path = join(directory, 'queue.json');
  writeFileSync(path, JSON.stringify({
    version: 1,
    entries: entries.map(entry => ({ baseUrl: BASE, traceId: TRACE, ...entry })),
    aliases: {},
  }));
  const queue = new FlambeQueue({ baseUrl: BASE, traceId: TRACE, path });
  return { directory, path, queue };
}

function serverError(status) {
  const error = new Error(`server said ${status}`);
  error.status = status;
  error.retryable = status >= 500;
  return error;
}

function networkError() {
  const error = new TypeError('network unavailable');
  error.retryable = true; // no .status -- server never answered
  return error;
}

function endEntry(activityId) {
  return { type: 'end', activityId, message: `close ${activityId}`, timestamp: 1 };
}

test('a permanently 500ing entry is dropped after MAX_FLUSH_ATTEMPTS, unblocking the rest', async () => {
  const { path, queue } = seed([endEntry('217'), endEntry('218')]);
  const warns = [];
  let good = 0;
  const handlers = {
    async end({ activityId }) {
      if (activityId === '217') throw serverError(500); // the varchar(255) case
      good += 1;
    },
    async start() {}, async suspend() {}, async resume() {},
  };

  try {
    for (let i = 0; i < MAX_FLUSH_ATTEMPTS; i += 1) {
      await queue.flush(handlers, { warn: message => warns.push(message) });
    }

    // 217 dropped after the attempt cap; 218 then flushed; queue file removed.
    assert.equal(good, 1);
    assert.equal(existsSync(path), false);
    assert.ok(warns.some(w => /stalled on end \(activity 217\).*attempt 1\//.test(w)));
    assert.ok(warns.some(w => /dropping offline queue entry end \(activity 217\)/.test(w)));
    // the payload is printed so nothing is lost silently
    assert.ok(warns.some(w => w.includes('"activityId":"217"')));
  } finally {
    rmSync(path, { force: true });
  }
});

test('an unreachable server never ages out an entry and keeps queue order', async () => {
  const { path, queue } = seed([endEntry('217')]);
  const warns = [];
  const handlers = {
    async end() { throw networkError(); },
    async start() {}, async suspend() {}, async resume() {},
  };

  try {
    for (let i = 0; i < MAX_FLUSH_ATTEMPTS + 3; i += 1) {
      await queue.flush(handlers, { warn: message => warns.push(message) });
    }

    const state = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(state.entries.length, 1);            // still there
    assert.equal(state.entries[0].attempts, undefined); // connectivity failures don't count
    assert.ok(warns.every(w => /server unreachable/.test(w)));
  } finally {
    rmSync(path, { force: true });
  }
});

test('a 4xx entry is dropped immediately, loudly, and later entries still flush', async () => {
  const { path, queue } = seed([endEntry('217'), endEntry('218')]);
  const warns = [];
  let good = 0;
  const handlers = {
    async end({ activityId }) {
      if (activityId === '217') throw serverError(400);
      good += 1;
    },
    async start() {}, async suspend() {}, async resume() {},
  };

  try {
    await queue.flush(handlers, { warn: message => warns.push(message) }); // a single pass suffices

    assert.equal(good, 1);
    assert.equal(existsSync(path), false);
    assert.ok(warns.some(w => /dropping offline queue entry end \(activity 217\) after 1 attempt/.test(w)));
  } finally {
    rmSync(path, { force: true });
  }
});

test('entries for a different server are left untouched', async () => {
  const { path, queue } = seed([{ type: 'end', activityId: '9', message: 'x', timestamp: 1 }]);
  // Rewrite the one entry to belong to another base URL.
  const state = JSON.parse(readFileSync(path, 'utf8'));
  state.entries[0].baseUrl = 'http://other.test';
  writeFileSync(path, JSON.stringify(state));

  const handlers = {
    async end() { throw new Error('should not be called'); },
    async start() {}, async suspend() {}, async resume() {},
  };

  try {
    await queue.flush(handlers, { warn() {} });
    const after = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(after.entries.length, 1);
    assert.equal(after.entries[0].baseUrl, 'http://other.test');
  } finally {
    rmSync(path, { force: true });
  }
});

test('one agent cannot replay another agent queued work', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-queue-agent-'));
  const path = join(directory, 'queue.json');
  const first = new FlambeQueue({ baseUrl: BASE, traceId: TRACE, agentId: 'agent-a', path });
  const second = new FlambeQueue({ baseUrl: BASE, traceId: TRACE, agentId: 'agent-b', path });
  const replayed = [];
  const handlers = name => ({
    async start(input) { replayed.push([name, input.name]); return replayed.length; },
    async end() {}, async suspend() {}, async resume() {}, async observe() {},
  });

  try {
    await first.enqueue('start', { input: { name: 'A queued work' } });
    await second.enqueue('start', { input: { name: 'B queued work' } });
    await second.flush(handlers('agent-b'), { warn() {} });
    assert.deepEqual(replayed, [['agent-b', 'B queued work']]);
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).entries[0].agentId, 'agent-a');
    await first.flush(handlers('agent-a'), { warn() {} });
    assert.deepEqual(replayed, [['agent-b', 'B queued work'], ['agent-a', 'A queued work']]);
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).entries, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
