import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSaga } from 'redux-saga';
import { bulkActivities } from './network';
import { ACTIVITIES_BULK_DELETE, ACTIVITIES_BULK_MOVE, selectActivities } from '../reducers/activitySelection';

afterEach(() => vi.unstubAllGlobals());
const run = async (type: string, fetch: ReturnType<typeof vi.fn>) => {
  vi.stubGlobal('fetch', fetch);
  const actions: unknown[] = [];
  await runSaga({ dispatch: action => { actions.push(action); },
    getState: () => ({ user: { id: 4 }, timeline: { trace: { id: 1 } } }),
  }, bulkActivities, { type, ids: ['1', '2'], thread_id: 7 }).toPromise();
  return actions;
};
const refreshed = { ok: true, status: 200, json: async () => ({ data: null }) };

describe('bulk activity requests', () => {
  it('moves the exact set atomically and records one signed undo step', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 200,
      json: async () => ({ data: { undo_token: 'signed' } }),
    }).mockResolvedValue(refreshed);
    const actions = await run(ACTIVITIES_BULK_MOVE, fetch);
    expect(fetch.mock.calls[0][0]).toBe('/api/traces/1/activity_moves');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ activity_ids: ['1', '2'], thread_id: 7 });
    expect(actions).toContainEqual({ type: 'UNDO_RECORD', scope: '4:1',
      target: { kind: 'move', token: 'signed', trace_id: 1 } });
    expect(actions).toContainEqual(selectActivities([]));
  });
  it('keeps selection and history after a failed move', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 422 }).mockResolvedValue(refreshed);
    const actions = await run(ACTIVITIES_BULK_MOVE, fetch);
    expect(actions).not.toContainEqual(selectActivities([]));
    expect(JSON.stringify(actions)).not.toContain('UNDO_RECORD');
    expect(JSON.stringify(actions)).toContain('No activities were moved');
  });
  it('deletes only selected IDs', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 204 })
      .mockResolvedValueOnce({ ok: true, status: 204 }).mockResolvedValue(refreshed);
    await run(ACTIVITIES_BULK_DELETE, fetch);
    expect(fetch.mock.calls.slice(0, 2).map(call => [call[0], call[1].method])).toEqual([
      ['/api/activities/1', 'DELETE'], ['/api/activities/2', 'DELETE'],
    ]);
  });
  it('falls back to exact individual moves only when the atomic endpoint is absent', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: {} }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: {} }) })
      .mockResolvedValue(refreshed);
    const actions = await run(ACTIVITIES_BULK_MOVE, fetch);
    expect(fetch.mock.calls.slice(0, 3).map(call => [call[0], call[1].method])).toEqual([
      ['/api/traces/1/activity_moves', 'POST'], ['/api/activities/1', 'PUT'], ['/api/activities/2', 'PUT'],
    ]);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ activity: { thread_id: 7, move_child_ids: [] } });
    expect(actions).toContainEqual({ type: 'UNDO_RECORD', scope: '4:1',
      target: { kind: 'unsupported', label: 'Bulk move on this server' } });
    expect(actions).toContainEqual(selectActivities([]));
  });
  it('reports partial legacy moves accurately and keeps selection on failure', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: {} }) })
      .mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValue(refreshed);
    const actions = await run(ACTIVITIES_BULK_MOVE, fetch);
    expect(actions).not.toContainEqual(selectActivities([]));
    expect(JSON.stringify(actions)).toContain('Some activities may have moved');
    expect(JSON.stringify(actions)).toContain('unsupported');
  });

});
