import timeline from './timeline';
import {
  ATTENTION_SHIFT,
  hideThread,
  reorderThreads,
  setHiddenThreads,
} from '../actions';
import type { TimelineState } from './timeline';
import type { Thread } from '../types/Thread';

function stateWithThreads(threads: Record<string, Thread>, filterExcludes: number[] = []): TimelineState {
  return {
    ...timeline(undefined, { type: '@@init' }),
    trace: { id: 1, name: 'Trace', filterExcludes },
    threads,
  };
}

const threads = {
  1: { id: 1, name: 'Main', rank: 0 },
  2: { id: 2, name: 'Later', rank: 1 },
};

describe('thread hide and reorder', () => {
  it('hides a thread and refuses to hide the last visible one', () => {
    const hidden = timeline(stateWithThreads(threads), hideThread(2));
    expect(hidden.trace?.filterExcludes).toEqual([2]);

    const stillHidden = timeline(hidden, hideThread(1));
    expect(stillHidden.trace?.filterExcludes).toEqual([2]);
  });

  it('rewrites ranks from an ordered id list', () => {
    const next = timeline(stateWithThreads(threads), reorderThreads([2, 1]));
    expect(next.threads[1].rank).toBe(1);
    expect(next.threads[2].rank).toBe(0);
  });

  it('does not let attention shifts rewrite persisted rank', () => {
    const next = timeline(stateWithThreads(threads), { type: ATTENTION_SHIFT, thread_id: 2 });
    expect(next.threads[1].rank).toBe(0);
    expect(next.threads[2].rank).toBe(1);
  });

  it('replaces the hidden set from an explicit list', () => {
    const next = timeline(stateWithThreads(threads, [2]), setHiddenThreads([]));
    expect(next.trace?.filterExcludes).toEqual([]);
  });
});
