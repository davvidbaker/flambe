import { createShareThreadDrafts, snapshotFromShareDraft } from '../components/ShareTimeline';
import { toDatetimeLocalValue } from '../utilities/timelineViewport';

describe('createShareThreadDrafts', () => {
  const threads = {
    1: { id: 1, name: 'visible', rank: 0, collapsed: false },
    2: { id: 2, name: 'hidden', rank: 1, collapsed: true },
  };

  it('includes currently visible threads and preserves collapse', () => {
    expect(createShareThreadDrafts(threads, [], false, [2])).toEqual([
      { id: 1, name: 'visible', included: true, collapsed: false },
      { id: 2, name: 'hidden', included: false, collapsed: true },
    ]);
  });
});

describe('snapshotFromShareDraft', () => {
  const now = 1_700_000_000_000;
  const threads = {
    1: { id: 1, name: 'visible', rank: 0, collapsed: false },
    2: { id: 2, name: 'hidden', rank: 1, collapsed: true },
  };

  const base = {
    absoluteTimeLabels: true,
    attentionShifts: [],
    categories: [],
    endValue: toDatetimeLocalValue(now),
    events: [],
    startValue: toDatetimeLocalValue(now - 60_000),
    threads,
    twelveHourClock: true,
    traceId: 9 as const,
    traceName: 'demo',
  };

  it('builds a snapshot from included threads', () => {
    const result = snapshotFromShareDraft({
      ...base,
      draftThreads: createShareThreadDrafts(threads, [], false, [2]),
    });
    expect('snapshot' in result).toBe(true);
    if (!('snapshot' in result)) return;
    expect(result.snapshot.fixture.traceName).toBe('demo');
    expect(result.snapshot.fixture.threads.map(thread => thread.id)).toEqual([1]);
  });

  it('rejects an empty thread selection', () => {
    expect(snapshotFromShareDraft({
      ...base,
      draftThreads: [
        { id: 1, name: 'visible', included: false, collapsed: false },
      ],
    })).toEqual({ error: 'Include at least one thread.' });
  });
});
