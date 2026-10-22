import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runSaga } from 'redux-saga';
import { AGENT_CONTACTS_RECEIVED, AGENT_CONTACT_POLL_MS, AGENT_CONTACT_REQUEST_TIMEOUT_MS } from '../constants/agentContact';
import { pollAgentContacts } from './agentContact';

let visibility: EventTarget & { visibilityState: string };
beforeEach(() => {
  vi.useFakeTimers();
  visibility = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  vi.stubGlobal('document', visibility);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('agent contact polling', () => {
  it('aborts a stalled request and recovers on the next refresh', async () => {
    const agents = [{ agent_id: 'codex:test', name: 'Avery', last_seen_at: '2026-10-22T05:00:00Z' }];
    const fetch = vi.fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValue({ ok: true, json: async () => ({ data: agents }) });
    vi.stubGlobal('fetch', fetch);
    const dispatched: unknown[] = [];
    const task = runSaga({ dispatch: action => dispatched.push(action) }, pollAgentContacts);
    try {
      await vi.advanceTimersByTimeAsync(AGENT_CONTACT_REQUEST_TIMEOUT_MS);
      expect((fetch.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true);
      expect(dispatched).toEqual([]);
      await vi.advanceTimersByTimeAsync(AGENT_CONTACT_POLL_MS);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(dispatched).toEqual([{ type: AGENT_CONTACTS_RECEIVED, agents }]);
    } finally {
      task.cancel();
      await task.toPromise();
    }
  });

  it('aborts an in-flight request when hidden and recovers immediately on return', async () => {
    const fetch = vi.fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal('fetch', fetch);
    const task = runSaga({ dispatch: () => undefined }, pollAgentContacts);
    try {
      visibility.visibilityState = 'hidden';
      visibility.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect((fetch.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
      visibility.visibilityState = 'visible';
      visibility.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      task.cancel();
      await task.toPromise();
    }
  });

  it('refreshes quietly every 15 seconds, pauses when hidden, and refreshes on return', async () => {
    const agents = [{ agent_id: 'codex:test', name: 'Avery', last_seen_at: '2026-10-22T05:00:00Z' }];
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: agents }) });
    vi.stubGlobal('fetch', fetch);
    const dispatched: unknown[] = [];
    const task = runSaga({ dispatch: action => dispatched.push(action) }, pollAgentContacts);
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(fetch).toHaveBeenCalledWith('/api/agents', expect.objectContaining({ credentials: 'include', cache: 'no-store' }));
      expect(dispatched).toEqual([{ type: AGENT_CONTACTS_RECEIVED, agents }]);
      await vi.advanceTimersByTimeAsync(AGENT_CONTACT_POLL_MS);
      expect(fetch).toHaveBeenCalledTimes(2);

      visibility.visibilityState = 'hidden';
      visibility.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(AGENT_CONTACT_POLL_MS * 3);
      expect(fetch).toHaveBeenCalledTimes(2);

      visibility.visibilityState = 'visible';
      visibility.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(fetch).toHaveBeenCalledTimes(3);
    } finally {
      task.cancel();
      await task.toPromise();
    }
    await vi.advanceTimersByTimeAsync(AGENT_CONTACT_POLL_MS * 2);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect((fetch.mock.calls[2][1] as RequestInit).signal?.aborted).toBe(true);
  });

  it('does not poll a hidden page initially or replace contact evidence on a failed refresh', async () => {
    visibility.visibilityState = 'hidden';
    const fetch = vi.fn().mockRejectedValue(new Error('Offline'));
    vi.stubGlobal('fetch', fetch);
    const dispatched: unknown[] = [];
    const task = runSaga({ dispatch: action => dispatched.push(action) }, pollAgentContacts);
    try {
      await vi.advanceTimersByTimeAsync(AGENT_CONTACT_POLL_MS * 2);
      expect(fetch).not.toHaveBeenCalled();
      visibility.visibilityState = 'visible';
      visibility.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(AGENT_CONTACT_POLL_MS);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(dispatched).toEqual([]);
    } finally {
      task.cancel();
      await task.toPromise();
    }
  });
});
