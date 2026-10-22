import type { Dispatch } from 'redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConnectedTimeline from './ConnectedTimeline';
import { ACTIVITY_CREATE_B, ACTIVITY_PLAN } from '../actions';
import type { EntityId } from '../types/ids';

// Expose the connector's dispatch callbacks without mounting the timeline canvas.
vi.mock('react-redux', () => ({
  connect: (_mapState: unknown, mapDispatch: unknown) => () => mapDispatch,
}));
vi.mock('../components/Timeline', () => ({ default: () => null }));

const dispatchProps = ConnectedTimeline as unknown as (dispatch: Dispatch) => {
  createActivityAt: (threadId: EntityId, time: number) => unknown;
};
const now = 100_000;

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(now);
});
afterEach(() => vi.restoreAllMocks());

describe('timeline activity creation', () => {
  it.each([
    { label: 'in the past', time: now - 5000 },
    { label: 'exactly now', time: now },
  ])('starts a live activity $label at the clicked time and thread', ({ time }) => {
    const dispatch = vi.fn();
    dispatchProps(dispatch).createActivityAt('work', time);

    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: ACTIVITY_CREATE_B,
      name: 'New activity',
      timestamp: time,
      description: '',
      thread_id: 'work',
      category_id: null,
      phase: 'B',
      editName: true,
    });
  });

  it('schedules future clicks at the clicked time and thread', () => {
    const dispatch = vi.fn();
    dispatchProps(dispatch).createActivityAt(7, now + 1);

    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: ACTIVITY_PLAN,
      name: 'Scheduled',
      thread_id: 7,
      scheduled_start: now + 1,
      scheduled_end: undefined,
    });
  });
});
