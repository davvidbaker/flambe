import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSaga } from 'redux-saga';
import { bulkActivities } from './network';
import { ACTIVITIES_BULK_DELETE, ACTIVITIES_BULK_MOVE, selectActivities } from '../reducers/activitySelection';

afterEach(() => vi.unstubAllGlobals());

describe('bulk activity requests', () => {
  const run = async (type: string, fetch: ReturnType<typeof vi.fn>) => {
    vi.stubGlobal('fetch', fetch);
    const actions: unknown[] = [];
    await runSaga({
      dispatch: action => { actions.push(action); },
      getState: () => ({ timeline: { trace: { id: null } } }),
    }, bulkActivities, { type, ids: ['1', '2'], thread_id: 7 }).toPromise();
    return actions;
  };

  it('moves exactly the selected activities, serially, without descendants', async () => {
    let inFlight = 0;
    const fetch = vi.fn(async (_url: string, _init: RequestInit) => {
      expect(inFlight++).toBe(0);
      await Promise.resolve();
      inFlight--;
      return { ok: true, status: 200, json: async () => ({ data: {} }) };
    });
    const actions = await run(ACTIVITIES_BULK_MOVE, fetch);
    expect(fetch.mock.calls.map(call => call[0])).toEqual(['/api/activities/1', '/api/activities/2']);
    for (const call of fetch.mock.calls) {
      expect(JSON.parse((call as unknown as [string, RequestInit])[1].body as string)).toEqual({
        activity: { thread_id: 7, move_child_ids: [] },
      });
    }
    expect(actions).toContainEqual(selectActivities([]));
  });

  it('stops after a failure, reports partial progress, and retains selection', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const actions = await run(ACTIVITIES_BULK_DELETE, fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(actions).not.toContainEqual(selectActivities([]));
    expect(JSON.stringify(actions)).toContain('Some activities may have changed');
  });

  it('deletes only the selected IDs', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    await run(ACTIVITIES_BULK_DELETE, fetch);
    expect(fetch.mock.calls.map(call => [call[0], call[1].method])).toEqual([
      ['/api/activities/1', 'DELETE'], ['/api/activities/2', 'DELETE'],
    ]);
  });
});
