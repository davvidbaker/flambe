import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { listenLocal } from '../src/local/serve.mjs';

async function fixture(fn) {
  const directory = mkdtempSync(join(tmpdir(), 'flambe-history-'));
  const dbPath = join(directory, 'history.sqlite');
  let current = await listenLocal({ port: 0, dbPath, staticDir: null });
  const context = {
    get store() { return current.store; },
    async restart() {
      await new Promise(resolve => current.server.close(resolve));
      current.store.close();
      current = await listenLocal({ port: 0, dbPath, staticDir: null });
    },
    async request(traceId, body) {
      const response = await fetch(`http://127.0.0.1:${current.port}/api/traces/${traceId}/reverse_creation`, {
        method: 'POST', headers: { cookie: 'flambe_user=1', 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    },
    async reverse(traceId, body) {
      const response = await this.request(traceId, body);
      assert.equal(response.status, 200, JSON.stringify(response.body));
      return response.body.data.undo_token;
    },
  };
  try { await fn(context); }
  finally {
    await new Promise(resolve => current.server.close(resolve)); current.store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test('Single Burner activity redo survives restart and preserves records and child links', async () => {
  await fixture(async f => {
    const traceId = f.store.credentials().traceId;
    const [thread] = f.store.getTrace(1, traceId).threads;
    const { activity, event } = f.store.createActivity(1, { traceId, threadId: thread.id,
      activity: { name: 'Original', description: 'Preserve', categories: [f.store.listCategories(1)[0].id] },
      event: { phase: 'B', timestamp_integer: 1234 } });
    const child = f.store.createActivity(1, { traceId, threadId: thread.id,
      activity: { name: 'Child', parent_id: activity.id } }).activity;
    const original = f.store.getActivity(1, activity.id);
    const originalEvent = f.store.db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);
    const token = await f.reverse(traceId, { kind: 'activity', target_id: activity.id });
    assert.equal(f.store.getActivity(1, activity.id), null);
    assert.equal(f.store.getActivity(1, child.id).parent_id, null);
    await f.restart();
    const undo = await f.reverse(traceId, { token });
    assert.deepEqual(f.store.getActivity(1, activity.id), original);
    assert.deepEqual(f.store.db.prepare('SELECT * FROM events WHERE id = ?').get(event.id), originalEvent);
    assert.equal(f.store.getActivity(1, child.id).parent_id, activity.id);
    await f.reverse(traceId, { token: undo });
    assert.equal(f.store.getActivity(1, activity.id), null);
  });
});

test('Single Burner lifecycle redo reverses weighted suspension atomically', async () => {
  await fixture(async f => {
    const traceId = f.store.credentials().traceId;
    const [thread] = f.store.getTrace(1, traceId).threads;
    const { activity } = f.store.createActivity(1, { traceId, threadId: thread.id,
      activity: { name: 'Weighted', weight: 9 }, event: { phase: 'B', timestamp_integer: 1 } });
    const event = f.store.createEvent(1, { traceId, activityId: activity.id, event: { phase: 'S', timestamp_integer: 2000 } });
    const token = await f.reverse(traceId, { kind: 'event', target_id: event.id, restore_weight: { activity_id: activity.id, weight: null } });
    assert.equal(f.store.getActivity(1, activity.id).weight, null);
    const undo = await f.reverse(traceId, { token });
    assert.equal(f.store.getActivity(1, activity.id).weight, 9);
    assert.equal(f.store.db.prepare('SELECT timestamp_ms FROM events WHERE id = ?').get(event.id).timestamp_ms, 2000);
    await f.reverse(traceId, { token: undo });
    assert.equal(f.store.getActivity(1, activity.id).weight, null);
  });
});

test('Single Burner rejects tampering, cross-trace restore, and conflicting redo without partial inserts', async () => {
  await fixture(async f => {
    const traceId = f.store.credentials().traceId;
    const [thread] = f.store.getTrace(1, traceId).threads;
    const { activity } = f.store.createActivity(1, { traceId, threadId: thread.id, activity: { name: 'Plan' } });
    const token = await f.reverse(traceId, { kind: 'activity', target_id: activity.id });
    assert.equal((await f.request(traceId, { token: token + 'x' })).status, 422);
    const other = f.store.createTrace(1, 'Other');
    assert.equal((await f.request(other.id, { token })).status, 422);
    // SQLite can reuse the deleted ID; a different record must never be overwritten.
    const replacement = f.store.createActivity(1, { traceId, threadId: thread.id, activity: { name: 'Replacement' } }).activity;
    assert.equal(replacement.id, activity.id);
    assert.equal((await f.request(traceId, { token })).status, 409);
    assert.equal(f.store.getActivity(1, replacement.id).name, 'Replacement');
  });
});
