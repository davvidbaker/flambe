import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSaga, stdChannel } from 'redux-saga';

import * as actions from '../actions';
import timelineReducer from '../reducers/timeline';
import { persistCollapsedThreadState } from '../utilities/threadCollapseState';
import networkSaga from './network';

afterEach(() => vi.unstubAllGlobals());

describe('thread collapse across trace refreshes', () => {
  it.each([
    { name: 'keeps an expanded thread open despite stale saved collapse', current: false, saved: true, expected: false },
    { name: 'keeps a collapsed thread closed despite stale saved expansion', current: true, saved: false, expected: true },
    { name: 'restores a saved collapse on initial load', current: undefined, saved: true, expected: true },
    { name: 'restores a saved expansion on initial load', current: undefined, saved: false, expected: false },
    { name: 'opens threads with no saved preference', current: undefined, saved: undefined, expected: false },
  ])('$name', async ({ current, saved, expected }) => {
    const storage = new Map<string, string>();
    vi.stubGlobal('window', { localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    } });
    const thread = { id: 7, name: 'Work', rank: 0 };
    const state = { user: { id: 4 }, timeline: timelineReducer(undefined, actions.selectTrace({ id: 1, name: 'Main' })) };
    if (current !== undefined) {
      state.timeline = timelineReducer(state.timeline, actions.processTimelineTrace([], [thread]));
      state.timeline = timelineReducer(state.timeline, current ? actions.collapseThread(7) : actions.expandThread(7));
    }
    if (saved !== undefined) persistCollapsedThreadState(1, { 7: { collapsed: saved } });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200,
      json: async () => ({ data: { id: 1, threads: [thread], events: [] } }),
    })));

    let finish!: () => void;
    const refreshed = new Promise<void>(resolve => { finish = resolve; });
    const channel = stdChannel();
    const task = runSaga({ channel, getState: () => state, dispatch: (action: { type: string }) => {
      state.timeline = timelineReducer(state.timeline, action);
      if (action.type === actions.TRACE_FILTER) finish();
    } }, networkSaga);
    try {
      channel.put(actions.fetchTrace(1));
      await refreshed;
      expect(state.timeline.threads['7'].collapsed).toBe(expected);
    } finally {
      task.cancel();
      await task.toPromise();
    }
  });
});
