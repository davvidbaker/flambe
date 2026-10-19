import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSaga } from 'redux-saga';
import { navigate } from '../utilities/navigation';
vi.mock('../utilities/navigation', () => ({ navigate: vi.fn() }));
import { undoLastCommand } from './undo';
import { UNDO_POP, REDO_POP } from '../reducers/undo';
import { REDO_LAST_COMMAND } from '../actions';
import { loadUndoHistory, saveUndoHistory } from '../utilities/undoStorage';

afterEach(() => vi.unstubAllGlobals());
describe('persistent move undo', () => {
  const target = { kind: 'move' as const, token: 'signed', trace_id: 1 };
  const state = { user: { id: 4 }, timeline: { trace: { id: 1 } }, undo: { '4:1': [target] } };
  it('round-trips history through browser storage and retains trace/account isolation', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value) });
    saveUndoHistory(state.undo);
    expect(loadUndoHistory()).toEqual(state.undo);
    expect(loadUndoHistory()['5:1']).toBeUndefined();
    expect(loadUndoHistory()['4:2']).toBeUndefined();
  });
  it('removes a history step only after a successful restore and refresh', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { undo_token: 'redo-signed' } }) })
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: null }) });
    vi.stubGlobal('fetch', fetch);
    const actions: unknown[] = [];
    await runSaga({ getState: () => state, dispatch: action => { actions.push(action); } }, undoLastCommand).toPromise();
    expect(fetch.mock.calls[0][0]).toBe('/api/traces/1/undo_move');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ undo_token: 'signed' });
    expect(actions).toContainEqual({ type: UNDO_POP, scope: '4:1', target, inverse: { kind: 'move', token: 'redo-signed', trace_id: 1 } });
  });
  it('stops at unsupported edits instead of undoing an older move', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const actions: unknown[] = [];
    const blocked = { ...state, undo: { '4:1': [target, { kind: 'unsupported', label: 'Activity edit' }] } };
    await runSaga({ getState: () => blocked, dispatch: action => { actions.push(action); } }, undoLastCommand).toPromise();
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(actions)).toContain('Earlier changes were left alone');
    expect(JSON.stringify(actions)).not.toContain(UNDO_POP);
  });
  it('keeps history after server conflict or network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 409 })
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: null }) }));
    const actions: unknown[] = [];
    await runSaga({ getState: () => state, dispatch: action => { actions.push(action); } }, undoLastCommand).toPromise();
    expect(JSON.stringify(actions)).not.toContain(UNDO_POP);
    expect(JSON.stringify(actions)).toContain('history has been kept');
  });
  it('preserves the login redirect when an existing lifecycle undo loses authentication', async () => {
    const event = { kind: 'event' as const, id: 9 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: null }) }));
    const dispatched: unknown[] = [];
    await runSaga({ getState: () => ({ ...state, undo: { '4:1': [event] } }),
      dispatch: action => { dispatched.push(action); } }, undoLastCommand).toPromise();
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(JSON.stringify(dispatched)).not.toContain(UNDO_POP);
  });

  it('redoes one operation and puts its fresh reciprocal token back on undo', async () => {
    const redoTarget = { kind: 'creation' as const, token: 'restore-event', trace_id: 1 };
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 200,
      json: async () => ({ data: { undo_token: 'remove-event-again' } }) })
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: null }) });
    vi.stubGlobal('fetch', fetch);
    const actions: unknown[] = [];
    await runSaga({ getState: () => ({ ...state, redo: { '4:1': [redoTarget] } }),
      dispatch: action => { actions.push(action); } }, undoLastCommand, { type: REDO_LAST_COMMAND }).toPromise();
    expect(fetch.mock.calls[0][0]).toBe('/api/traces/1/reverse_creation');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ token: 'restore-event' });
    expect(actions).toContainEqual({ type: REDO_POP, scope: '4:1', target: redoTarget,
      inverse: { kind: 'creation', token: 'remove-event-again', trace_id: 1 } });
  });
  it('keeps redo history after a failed restoration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 409 })
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: null }) }));
    const actions: unknown[] = [];
    await runSaga({ getState: () => ({ ...state, redo: { '4:1': [target] } }),
      dispatch: action => { actions.push(action); } }, undoLastCommand, { type: REDO_LAST_COMMAND }).toPromise();
    expect(JSON.stringify(actions)).not.toContain(REDO_POP);
    expect(JSON.stringify(actions)).toContain('history has been kept');
  });
  it('does not rebuild a redo branch after a new change completes during undo', async () => {
    let finish!: (response: unknown) => void;
    const pending = new Promise(resolve => { finish = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(pending)
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: null }) }));
    let current = { ...state, undo: { '4:1': [target] as unknown[] } };
    const actions: unknown[] = [];
    const task = runSaga({ getState: () => current, dispatch: action => { actions.push(action); } }, undoLastCommand);
    current = { ...current, undo: { '4:1': [target, { kind: 'event', id: 99 }] } };
    finish({ ok: true, status: 200, json: async () => ({ data: { undo_token: 'redo' } }) });
    await task.toPromise();
    expect(actions).toContainEqual({ type: UNDO_POP, scope: '4:1', target, inverse: undefined });
  });

});
