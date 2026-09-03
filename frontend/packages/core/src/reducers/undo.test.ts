import { describe, expect, it } from 'vitest';

import { TRACE_SELECT, UNDO_CLEAR, UNDO_RECORD } from '../actions';
import undo from './undo';

describe('undo session history', () => {
  it('keeps only the most recent successful lifecycle target', () => {
    const first = undo(undefined, {
      type: UNDO_RECORD,
      target: { kind: 'event', id: 10 },
    });
    const second = undo(first, {
      type: UNDO_RECORD,
      target: { kind: 'activity', id: 7, thread_id: 3 },
    });

    expect(second).toEqual({ kind: 'activity', id: 7, thread_id: 3 });
  });

  it('clears history after undo or trace navigation', () => {
    const state = { kind: 'event' as const, id: 10 };

    expect(undo(state, { type: UNDO_CLEAR })).toBeNull();
    expect(undo(state, { type: TRACE_SELECT })).toBeNull();
  });
});
