import { describe, expect, it } from 'vitest';
import { TRACE_SELECT, UNDO_CLEAR, UNDO_RECORD } from '../actions';
import undo, { UNDO_POP } from './undo';

describe('undo history', () => {
  it('keeps chronological steps per user and trace, including grouped moves', () => {
    const event = { kind: 'event' as const, id: 10 };
    const move = { kind: 'move' as const, token: 'signed', trace_id: 1 };
    let state = undo(undefined, { type: UNDO_RECORD, scope: '1:1', target: event });
    state = undo(state, { type: UNDO_RECORD, scope: '1:1', target: move });
    state = undo(state, { type: UNDO_RECORD, scope: '2:1', target: event });
    expect(state['1:1']).toEqual([event, move]);
    state = undo(state, { type: UNDO_POP, scope: '1:1', target: move });
    expect(state['1:1']).toEqual([event]);
    expect(state['2:1']).toEqual([event]);
  });
  it('retains history across trace navigation and supports explicitly clearing one scope', () => {
    const state = { '1:1': [{ kind: 'event' as const, id: 10 }] };
    expect(undo(state, { type: TRACE_SELECT })).toEqual(state);
    expect(undo(state, { type: UNDO_CLEAR, scope: '1:1' })).toEqual({ '1:1': [] });
  });
});
