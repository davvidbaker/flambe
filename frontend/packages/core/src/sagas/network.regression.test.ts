import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSaga, stdChannel } from 'redux-saga';
import networkSaga, { bulkActivities, performUndo } from './network';
import * as actions from '../actions';
import timelineReducer from '../reducers/timeline';

const response = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
const initial = () => ({ user: { id: 4 }, timeline: {
  trace: { id: 1 }, activities: { '1': { id: 1, thread_id: 7, weight: 2, status: 'active' } }, blocks: [],
} });

afterEach(() => vi.unstubAllGlobals());

async function execute(action: object) {
  const channel = stdChannel();
  const state = initial();
  const dispatched: Array<Record<string, unknown>> = [];
  let finish!: () => void;
  const recorded = new Promise<void>(resolve => { finish = resolve; });
  const fetch = vi.fn(async (url: string, request: RequestInit) => {
    if (url.includes('/traces/')) return response(null);
    if (url === '/api/events') return response({ id: 101 });
    if (request.method === 'PUT') return response({ id: 1, weight: 9 });
    if (request.method === 'DELETE') return { ok: true, status: 204 };
    return response({ activity: { id: 1 } });
  });
  vi.stubGlobal('fetch', fetch);
  const task = runSaga({ channel, getState: () => state, dispatch: (action: Record<string, unknown>) => {
    dispatched.push(action);
    if (action.type === actions.UNDO_RECORD) finish();
  } }, networkSaga);
  channel.put(action);
  await recorded;
  task.cancel();
  await task.toPromise();
  return { dispatched, fetch };
}

describe('existing mutation paths with undo history', () => {
  it.each(['creation', 'refresh'])(
    'keeps delayed live %s from opening the name editor on another trace', async delayed => {
      const state = initial();
      const channel = stdChannel();
      const dispatched: Array<Record<string, unknown>> = [];
      let respond!: (value: unknown) => void;
      const pending = new Promise(resolve => { respond = resolve; });
      let requested!: () => void;
      const started = new Promise<void>(resolve => { requested = resolve; });
      let succeeded!: () => void;
      const completed = new Promise<void>(resolve => { succeeded = resolve; });
      const fetch = vi.fn(async (url: string) => {
        if ((delayed === 'creation') === (url === '/api/activities')) {
          requested();
          return pending;
        }
        return response({ activity: { id: 42 } });
      });
      vi.stubGlobal('fetch', fetch);
      const task = runSaga({ channel, getState: () => state, dispatch: (action: { type: string }) => {
        dispatched.push(action);
        if (action.type === `${delayed === 'creation' ? actions.ACTIVITY_CREATE_B : actions.TRACE_FETCH}_SUCCEEDED`) {
          succeeded();
        }
      } }, networkSaga);
      channel.put(actions.createActivityB({ name: 'New activity', timestamp: 123, thread_id: 7,
        description: '', category_id: null, phase: 'B', editName: true }));
      try {
        await started;
        state.timeline = { ...state.timeline, trace: { id: 22 } };
        respond(response(delayed === 'creation' ? { activity: { id: 42 } } : null));
        await completed;
        expect(dispatched.some(action => action.type === actions.ACTIVITY_DETAILS_SHOW)).toBe(false);
        expect(dispatched.some(action => action.type === actions.BLOCK_FOCUS)).toBe(false);
        expect(dispatched).toContainEqual({ type: actions.UNDO_RECORD, scope: '4:1',
          target: { kind: 'activity', id: 42, thread_id: 7 } });
        expect(fetch.mock.calls.map(([url]) => url)).toEqual(
          delayed === 'creation' ? ['/api/activities'] : ['/api/activities', '/api/traces/1'],
        );
      } finally {
        task.cancel();
        await task.toPromise();
      }
    },
  );

  it.each(['live', 'scheduled'] as const)(
    'persists a %s chart activity at the clicked time and opens its name editor', async mode => {
      const timestamp = 1_234;
      const thread = { id: 7, name: 'Work', rank: 0, trace_id: 1 };
      const activity = { id: 42, name: 'New activity', thread_id: 7, categories: [] };
      const event = { id: 101, timestamp, phase: 'B', activity };
      const state = { user: { id: 4 }, timeline: timelineReducer(undefined, { type: 'INIT' }) };
      state.timeline = timelineReducer(state.timeline, actions.selectTrace({ id: 1, name: 'Main' }));
      state.timeline = timelineReducer(state.timeline, actions.processTimelineTrace([], [thread]));
      const fetch = vi.fn().mockResolvedValueOnce(response({ activity, event })).mockResolvedValue(response({
        id: 1, threads: [thread],
        events: mode === 'live' ? [event] : [],
        unstarted: mode === 'scheduled'
          ? [{ ...activity, status: 'unstarted', scheduled_start: timestamp }]
          : [],
      }));
      vi.stubGlobal('fetch', fetch);
      const dispatched: Array<Record<string, unknown>> = [];
      let finish!: () => void;
      const shown = new Promise<void>(resolve => { finish = resolve; });
      const channel = stdChannel();
      const task = runSaga({ channel, getState: () => state, dispatch: (action: { type: string }) => {
        dispatched.push(action);
        state.timeline = timelineReducer(state.timeline, action);
        if (action.type === actions.ACTIVITY_DETAILS_SHOW) finish();
      } }, networkSaga);
      const create = mode === 'live'
        ? actions.createActivityB({ name: activity.name, thread_id: 7, timestamp,
          description: '', category_id: null, phase: 'B', editName: true })
        : actions.planActivity({ name: activity.name, thread_id: 7, scheduled_start: timestamp });
      state.timeline = timelineReducer(state.timeline, create);
      channel.put(create);
      try {
        await shown;
        expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/activities', '/api/traces/1']);
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body).toMatchObject({ trace_id: 1, thread_id: 7 });
        if (mode === 'live') {
          expect(body.event).toEqual({ timestamp_integer: timestamp, phase: 'B' });
          expect(body.activity).not.toHaveProperty('scheduled_start_integer');
          expect(state.timeline.activities['42']).toMatchObject({ id: 42, status: 'active', startTime: timestamp });
          expect(state.timeline.blocks[0]).toMatchObject({ activity_id: 42, beginning: 'B', startTime: timestamp });
          expect(state.timeline.blocks[0].scheduled).toBeFalsy();
          expect(state.timeline.blocks[0].endTime).toBeUndefined();
        } else {
          expect(body).not.toHaveProperty('event');
          expect(body.activity.scheduled_start_integer).toBe(timestamp);
          expect(state.timeline.blocks[0]).toMatchObject({ activity_id: 42, scheduled: true, startTime: timestamp });
        }
        expect(dispatched).toContainEqual(actions.focusBlock({
          index: 0, activity_id: 42, activityStatus: mode === 'live' ? 'active' : 'unstarted', thread_id: 7,
        }));
        expect(dispatched.at(-1)).toEqual(actions.showActivityDetails({ editName: true }));
        expect(dispatched.filter(action => action.type === actions.UNDO_RECORD)).toEqual([
          { type: actions.UNDO_RECORD, scope: '4:1', target: { kind: 'activity', id: 42, thread_id: 7 } },
        ]);
      } finally {
        task.cancel();
        await task.toPromise();
      }
    },
  );

  it.each([
    [actions.ACTIVITY_CREATE_B, 'activity'], [actions.ACTIVITY_END, 'event'],
    [actions.ACTIVITY_SUSPEND, 'event'], [actions.ACTIVITY_RESUME, 'event'],
    [actions.ACTIVITY_RESURRECT, 'event'], [actions.ACTIVITY_BEGIN, 'event'],
    [actions.ACTIVITY_PLAN, 'activity'],
  ])('preserves successful %s requests and records their inverse', async (type, kind) => {
    const { dispatched, fetch } = await execute({ type, id: 1, name: 'Example', thread_id: 7, timestamp: 123 });
    expect(fetch.mock.calls[0][0]).toBe(kind === 'event' ? '/api/events' : '/api/activities');
    expect(fetch.mock.calls[0][1].method).toBe('POST');
    const entry = dispatched.find(action => action.type === actions.UNDO_RECORD);
    expect(entry).toMatchObject({ scope: '4:1', target: { kind, id: kind === 'event' ? 101 : 1 } });
    expect(dispatched.filter(action => action.type === actions.UNDO_RECORD)).toHaveLength(1);
  });

  it('keeps weighted suspension undoable as one operation and restores the previous weight', async () => {
    const { dispatched, fetch } = await execute({ type: actions.ACTIVITY_SUSPEND, id: 1,
      thread_id: 7, timestamp: 123, weight: 9 });
    const entries = dispatched.filter(action => action.type === actions.UNDO_RECORD);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ scope: '4:1', target: {
      kind: 'event', id: 101, restoreWeight: { activity_id: 1, weight: 2 },
    } });
    expect(JSON.parse(fetch.mock.calls[1][1].body as string)).toEqual({ activity: { weight: 9 } });
    fetch.mockClear();
    fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    fetch.mockImplementation(async () => ({ ok: true, status: 204 }));
    await runSaga({ getState: () => initial(), dispatch: vi.fn() }, performUndo, entries[0].target as never).toPromise();
    expect(fetch.mock.calls.slice(1, 3).map(([url, init]) => [url, init.method])).toEqual([
      ['/api/activities/1', 'PUT'], ['/api/events/101', 'DELETE'],
    ]);
    expect(JSON.parse(fetch.mock.calls[1][1].body as string)).toEqual({ activity: { weight: 2 } });
  });

  it.each([actions.ACTIVITY_UPDATE, actions.EVENT_UPDATE, actions.ACTIVITY_DELETE, actions.EVENT_DELETE])(
    'preserves manual %s transport and prevents undo from reaching an older command', async type => {
      const { fetch, dispatched } = await execute({ type, id: 1, thread_id: 7, updates: { name: 'Edited' } });
      expect(fetch.mock.calls[0][1].method).toBe(type.includes('DELETE') ? 'DELETE' : 'PUT');
      expect(dispatched.find(action => action.type === actions.UNDO_RECORD)).toMatchObject({
        scope: '4:1', target: { kind: 'unsupported' },
      });
    },
  );


  it('preserves the existing single-activity move API and child choices', async () => {
    const updates = { thread_id: 9, move_child_ids: [2] };
    const { fetch } = await execute({ type: actions.ACTIVITY_UPDATE, id: 1, updates });
    expect(fetch.mock.calls[0][0]).toBe('/api/activities/1');
    expect(fetch.mock.calls[0][1].method).toBe('PUT');
    expect(JSON.parse(fetch.mock.calls[0][1].body as string)).toEqual({ activity: updates });
  });

  it.each([actions.ACTIVITY_END, actions.ACTIVITY_UPDATE])(
    'keeps in-flight %s history on its original trace', async type => {
      const channel = stdChannel();
      const state = initial();
      let finish!: (value: unknown) => void;
      const pending = new Promise(resolve => { finish = resolve; });
      vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(pending));
      let recorded!: () => void;
      const done = new Promise<void>(resolve => { recorded = resolve; });
      const dispatched: Array<Record<string, unknown>> = [];
      const task = runSaga({ channel, getState: () => state, dispatch: (action: Record<string, unknown>) => {
        dispatched.push(action);
        if (action.type === actions.UNDO_RECORD) recorded();
      } }, networkSaga);
      channel.put({ type, id: 1, timestamp: 123, thread_id: 7, updates: { name: 'Edited' } });
      state.timeline.trace.id = 22;
      state.user.id = 8;
      finish(response({ id: 101 }));
      await done;
      task.cancel();
      await task.toPromise();
      expect(dispatched.find(action => action.type === actions.UNDO_RECORD)?.scope).toBe('4:1');
    },
  );

  it('records an in-flight move under its original scope after navigation', async () => {
    const state = initial();
    let finish!: (value: unknown) => void;
    const pending = new Promise(resolve => { finish = resolve; });
    const fetch = vi.fn().mockReturnValueOnce(pending).mockResolvedValue(response(null));
    vi.stubGlobal('fetch', fetch);
    const dispatched: unknown[] = [];
    const task = runSaga({ getState: () => state, dispatch: action => { dispatched.push(action); } },
      bulkActivities, { type: 'ACTIVITIES_BULK_MOVE', ids: ['1', '2'], thread_id: 9 });
    state.timeline.trace.id = 22;
    state.user.id = 8;
    finish(response({ undo_token: 'signed' }));
    await task.toPromise();
    expect(dispatched).toContainEqual({ type: actions.UNDO_RECORD, scope: '4:1',
      target: { kind: 'move', token: 'signed', trace_id: 1 } });
  });
});
